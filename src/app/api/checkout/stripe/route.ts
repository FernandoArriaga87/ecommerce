import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validations/checkout";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 1. Validar el cuerpo de la petición con Zod
    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Datos inválidos", 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { name, email, phone, address, city, state, zipCode, items } = validation.data;

    // 2. Stock check + order creation inside a single SERIALIZABLE transaction
    //    to eliminate race conditions (two concurrent checkouts for the same item).
    const result = await prisma.$transaction(async (tx) => {

      // ── Fetch all variants and validate stock atomically ──
      const dbItems = [];
      const outOfStockErrors: string[] = [];

      for (const item of items) {
        const variant = await tx.variant.findFirst({
          where: { 
            productId: item.productId, 
            size: item.size 
          },
          include: { product: true }
        });

        if (!variant) {
          outOfStockErrors.push(
            `"${item.productId}" en talla ${item.size} ya no está disponible.`
          );
          continue;
        }

        if (variant.stock < item.quantity) {
          const availableMsg = variant.stock === 0
            ? "está agotado"
            : `solo tiene ${variant.stock} unidad(es) disponible(s)`;
          outOfStockErrors.push(
            `"${variant.product.name}" (Talla ${item.size}) ${availableMsg}.`
          );
          continue;
        }

        dbItems.push({
          variant,
          quantity: item.quantity,
          price: variant.product.price
        });
      }

      // If any items failed stock check, abort the entire transaction
      if (outOfStockErrors.length > 0) {
        throw new StockError(outOfStockErrors);
      }

      // ── Reserve stock by decrementing immediately ──
      for (const item of dbItems) {
        const updated = await tx.variant.updateMany({
          where: {
            id: item.variant.id,
            stock: { gte: item.quantity }, // double-check guard
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        // If updateMany matched 0 rows, stock was grabbed between our read and write
        if (updated.count === 0) {
          throw new StockError([
            `"${item.variant.product.name}" (Talla ${item.variant.size}) se agotó mientras procesábamos tu pedido. Intenta de nuevo.`
          ]);
        }
      }

      // ── Calculate totals on the server ──
      const subtotal = dbItems.reduce((acc, item) => {
        return acc.add(new Decimal(item.price.toString()).mul(item.quantity));
      }, new Decimal(0));

      const shipping = new Decimal(subtotal.gte(1499) ? 0 : 150);
      const total = subtotal.add(shipping);

      // ── Find or create user ──
      let user = await tx.user.findUnique({ where: { email } });
      if (!user) {
        user = await tx.user.create({
          data: {
            email,
            name,
            phone,
          },
        });
      }

      // ── Create address ──
      const addr = await tx.address.create({
        data: {
          userId: user.id,
          label: "Envío Checkout",
          name,
          phone,
          address,
          city,
          state,
          zipCode,
        },
      });

      // ── Create order with status PENDING ──
      const orderNumber = `DS-${Date.now().toString(36).toUpperCase()}`;
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          addressId: addr.id,
          subtotal,
          shipping,
          total,
          paymentMethod: "STRIPE",
          status: "PENDING",
          items: {
            create: dbItems.map((item) => ({
              variantId: item.variant.id,
              price: item.price,
              quantity: item.quantity,
              total: new Decimal(item.price.toString()).mul(item.quantity)
            })),
          },
        },
      });

      return { order, dbItems, email, shipping };
    }); // ← end $transaction

    // 3. Prepare Stripe line_items (outside the DB transaction, it's read-only)
    const line_items = result.dbItems.map((item) => ({
      price_data: {
        currency: "mxn",
        product_data: {
          name: item.variant.product.name,
          images: item.variant.product.images.length > 0 ? [item.variant.product.images[0]] : [],
          metadata: {
            productId: item.variant.productId,
            variantId: item.variant.id,
            size: item.variant.size,
          },
        },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: item.quantity,
    }));

    // Add shipping line item
    if (Number(result.shipping) > 0) {
      line_items.push({
        price_data: {
          currency: "mxn",
          product_data: {
            name: "Costo de Envío",
            images: [],
            metadata: {
              productId: "shipping",
              variantId: "shipping",
              size: "N/A",
            },
          },
          unit_amount: Math.round(Number(result.shipping) * 100),
        },
        quantity: 1,
      });
    }

    // 4. Create Stripe session
    const origin = req.headers.get("origin");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&orderId=${result.order.id}`,
      cancel_url: `${origin}/checkout`,
      customer_email: result.email,
      metadata: {
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
      },
      // Auto-expire in 30 min so reserved stock is released
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    // Return user-friendly stock errors with 409 Conflict
    if (error instanceof StockError) {
      return NextResponse.json({ 
        error: "Algunos artículos no tienen stock suficiente.",
        stockErrors: error.items,
        code: "STOCK_ERROR",
      }, { status: 409 });
    }

    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ 
      error: error.message || "Ocurrió un error al procesar el pago" 
    }, { status: 500 });
  }
}

/* ───────────── custom error for stock failures ─────────────── */
class StockError extends Error {
  items: string[];
  constructor(items: string[]) {
    super("Stock insuficiente");
    this.name = "StockError";
    this.items = items;
  }
}
