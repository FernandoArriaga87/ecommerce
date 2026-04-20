import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
    }

    // ── Auth check ──
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "No sessions found. Please login." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        addresses: {
          where: { isDefault: true },
          take: 1
        }
      }
    });

    if (!user || user.addresses.length === 0) {
       return NextResponse.json({ error: "Perfil incompleto. Redirigiendo a completar perfil.", code: "PROFILE_INCOMPLETE" }, { status: 400 });
    }

    const defaultAddress = user.addresses[0];

    // ── Stock check + reserve + order creation in a single atomic transaction ──
    const result = await prisma.$transaction(async (tx) => {
      const dbItems = [];
      const outOfStockErrors: string[] = [];

      for (const item of items) {
        const variant = await tx.variant.findFirst({
          where: { productId: item.productId, size: item.size, product: { isDeleted: false } },
          include: { product: true },
        });

        if (!variant) {
          outOfStockErrors.push(
            `"${item.name}" en talla ${item.size} ya no está disponible.`
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
          price: variant.product.price,
          name: item.name,
          image: item.image,
        });
      }

      if (outOfStockErrors.length > 0) {
        throw new StockError(outOfStockErrors);
      }

      // ── Reserve stock atomically ──
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

        if (updated.count === 0) {
          throw new StockError([
            `"${item.variant.product.name}" (Talla ${item.variant.size}) se agotó mientras procesábamos tu pedido. Intenta de nuevo.`
          ]);
        }
      }

      // ── Calculate totals on the server (ignore client-sent totals) ──
      const subtotal = dbItems.reduce((acc, item) => {
        return acc.add(new Decimal(item.price.toString()).mul(item.quantity));
      }, new Decimal(0));

      const shipping = new Decimal(subtotal.gte(1499) ? 0 : 150);
      const total = subtotal.add(shipping);

      // ── Create order ──
      const orderNumber = `DS-${Date.now().toString(36).toUpperCase()}`;
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          addressId: defaultAddress.id,
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
              total: new Decimal(item.price.toString()).mul(item.quantity),
            })),
          },
        },
      });

      return { order, dbItems, subtotal, shipping, total };
    }); // ← end $transaction

    // ── Build Stripe line items ──
    const line_items = result.dbItems.map((item) => ({
      price_data: {
        currency: "mxn",
        product_data: {
          name: item.variant.product.name,
          images: item.image ? [item.image] : [],
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

    if (Number(result.shipping) > 0) {
      line_items.push({
        price_data: {
          currency: "mxn",
          product_data: {
            name: "Envío",
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

    // ── Create Stripe Checkout Session ──
    const origin = req.headers.get("origin");
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&orderId=${result.order.id}`,
      cancel_url: `${origin}/checkout`,
      customer_email: user.email,
      metadata: {
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
      },
      // Auto-expire in 30 min so reserved stock is released
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error: any) {
    if (error instanceof StockError) {
      return NextResponse.json({
        error: "Algunos artículos no tienen stock suficiente.",
        stockErrors: error.items,
        code: "STOCK_ERROR",
      }, { status: 409 });
    }

    console.error("Quick Checkout Error:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
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
