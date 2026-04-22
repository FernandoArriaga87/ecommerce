import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { checkoutSchema } from "@/lib/validations/checkout";
import type { ShippingOption } from "@/lib/skydropx";
import { qualifiesForFreeShipping } from "@/lib/shipping";
import { Decimal } from "@/lib/generated-prisma/runtime/library";

/**
 * Canonical checkout endpoint.
 * Called from /checkout after the customer has entered their address
 * and chosen a shipping option. Security:
 *  - Requires an authenticated Supabase session.
 *  - Email in body must match the session email (prevents spoofing someone else's account).
 *  - Rate-limited at the middleware layer (/api/checkout bucket).
 *  - Shipping price is re-quoted server-side (never trusts the client-sent price).
 *  - Stock is reserved inside a transaction to prevent overselling.
 */
export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth ──
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json(
        { error: "Sesión requerida. Inicia sesión para continuar." },
        { status: 401 }
      );
    }

    // ── 2. Validate payload ──
    const body = await req.json();
    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: "Datos inválidos",
        details: validation.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { name, email, phone, address, city, state, zipCode, quoteId, shippingRateId, items, addressId } = validation.data;

    // ── 3. Security: email must match the session ──
    const sessionEmail = (authUser.email || "").trim().toLowerCase();
    if (sessionEmail && email.trim().toLowerCase() !== sessionEmail) {
      return NextResponse.json(
        { error: "El correo no coincide con tu cuenta activa." },
        { status: 403 }
      );
    }

    // ── 4. Validate shipping against the persisted quote ──
    const totalQty = items.reduce((sum, it) => sum + it.quantity, 0);
    
    let chosenRate: any = null;
    const isFreeShippingRequest = quoteId === "free_shipping" && shippingRateId === "free_shipping";

    if (!isFreeShippingRequest) {
      const quote = await prisma.shippingQuote.findUnique({ where: { id: quoteId } });
      if (!quote || quote.expiresAt < new Date()) {
        return NextResponse.json(
          { error: "Tu cotización de envío expiró. Vuelve a cotizar." },
          { status: 400 }
        );
      }
      if (quote.zipCode !== zipCode.trim() || quote.totalItems !== totalQty) {
        return NextResponse.json(
          { error: "Cambiaste el envío después de cotizar. Vuelve a cotizar para confirmar el precio." },
          { status: 400 }
        );
      }
      const storedRates = (quote.rates as unknown as ShippingOption[]) || [];
      chosenRate = storedRates.find((r) => r.rateId === shippingRateId);
      if (!chosenRate) {
        return NextResponse.json(
          { error: "La opción de envío seleccionada ya no está disponible. Vuelve a cotizar." },
          { status: 400 }
        );
      }
    } else {
      chosenRate = {
        rateId: "free_shipping",
        carrier: "Envío Gratis",
        price: 0,
        isPersonalDelivery: false,
      };
    }

    // ── 5. Stock reservation + order creation in a single SERIALIZABLE transaction ──
    const result = await prisma.$transaction(async (tx) => {
      const dbItems: Array<{
        variant: Awaited<ReturnType<typeof tx.variant.findFirst>> & {
          product: { id: string; name: string; price: any; images: string[] };
        };
        quantity: number;
        price: any;
      }> = [];
      const outOfStockErrors: string[] = [];

      for (const item of items) {
        const variant = await tx.variant.findFirst({
          where: {
            productId: item.productId,
            size: item.size,
            product: { isDeleted: false },
          },
          include: { product: true },
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

        dbItems.push({ variant: variant as any, quantity: item.quantity, price: variant.product.price });
      }

      if (outOfStockErrors.length > 0) throw new StockError(outOfStockErrors);

      // Reserve stock atomically (double-check guard prevents race conditions)
      for (const item of dbItems) {
        const updated = await tx.variant.updateMany({
          where: { id: item.variant.id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });

        if (updated.count === 0) {
          throw new StockError([
            `"${item.variant.product.name}" (Talla ${item.variant.size}) se agotó mientras procesábamos tu pedido. Intenta de nuevo.`,
          ]);
        }
      }

      // Totals computed server-side (never from client body)
      const subtotal = dbItems.reduce((acc, item) => {
        return acc.add(new Decimal(item.price.toString()).mul(item.quantity));
      }, new Decimal(0));
      // Envío gratis cuando el subtotal califica. La tienda absorbe el costo
      // real cobrado por la paquetería — al cliente se le cobra $0 y el admin
      // genera la guía manualmente (no pasa por la automatización de Skydropx
      // en el webhook de Stripe, que está reservada para envíos cobrados).
      const isFreeShipping = qualifiesForFreeShipping(subtotal.toNumber());
      const shipping = isFreeShipping ? new Decimal(0) : new Decimal(chosenRate.price);
      const total = subtotal.add(shipping);

      // Match the user by Supabase auth id (the source of truth) to avoid races
      // with the Supabase webhook that syncs new users by id. Email-only lookups
      // can either miss (webhook hasn't run yet) or, worse, collide with a stale
      // row that the webhook would have replaced.
      const user = await tx.user.upsert({
        where: { id: authUser.id },
        update: {
          // Refresh phone if missing, never overwrite an existing name silently
          phone: phone || undefined,
        },
        create: {
          id: authUser.id,
          email,
          name,
          phone,
        },
      });

      // Dedup by content: if the user already has a saved address with the
      // exact same name/phone/street/city/state/zip, reuse it. Otherwise the
      // Address table grows by one row per checkout and the user's address
      // book fills up with duplicates of the same place.
      let existingAddr = null;

      if (addressId) {
        existingAddr = await tx.address.findUnique({
          where: { id: addressId }
        });
        // Security check: ensure the address actually belongs to the user
        if (existingAddr && existingAddr.userId !== user.id) {
          existingAddr = null;
        }
      }

      if (!existingAddr) {
        existingAddr = await tx.address.findFirst({
          where: {
            userId: user.id,
            name,
            phone,
            address,
            city,
            state,
            zipCode,
          },
        });
      }

      const addr =
        existingAddr ??
        (await tx.address.create({
          data: {
            userId: user.id,
            label: "Envío",
            name,
            phone,
            address,
            city,
            state,
            zipCode,
          },
        }));

      // Vacía el carrito persistido del usuario en cuanto se reservó el stock.
      // El carrito ya quedó "consumido" en la orden PENDING — si el usuario
      // abandona Stripe, el webhook de expiración cancela la orden y restaura
      // el stock, pero el carrito permanece vacío (tendrá que volver a armarlo).
      await tx.cartItem.deleteMany({
        where: { cart: { userId: user.id } },
      });

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
          carrier: chosenRate.carrier,
          // No guardes el rateId de Skydropx en casos manuales — el admin genera
          // la guía afuera del sistema, y dejar el rateId provocaría que el
          // webhook intente crearla automáticamente.
          skydropxRateId: (chosenRate.isPersonalDelivery || isFreeShipping) ? null : chosenRate.rateId,
          isPersonalDelivery: chosenRate.isPersonalDelivery,
          isFreeShipping,
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

      return { order, dbItems, shipping, userEmail: user.email };
    });

    // ── 6. Build Stripe line items (only absolute image URLs are sent) ──
    const line_items = result.dbItems.map((item) => {
      const firstImage = item.variant.product.images?.[0];
      const validImage = firstImage && /^https?:\/\//i.test(firstImage) ? [firstImage] : [];
      return {
        price_data: {
          currency: "mxn",
          product_data: {
            name: item.variant.product.name,
            images: validImage,
            metadata: {
              productId: item.variant.productId,
              variantId: item.variant.id,
              size: item.variant.size,
            },
          },
          unit_amount: Math.round(Number(item.price) * 100),
        },
        quantity: item.quantity,
      };
    });

    if (Number(result.shipping) > 0) {
      line_items.push({
        price_data: {
          currency: "mxn",
          product_data: {
            name: `Envío — ${chosenRate.carrier}`,
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

    // ── 7. Create Stripe Checkout Session ──
    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      req.nextUrl.origin;

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&orderId=${result.order.id}`,
      cancel_url: `${origin}/checkout`,
      customer_email: result.userEmail,
      metadata: {
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
      },
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

    console.error("Checkout Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

class StockError extends Error {
  items: string[];
  constructor(items: string[]) {
    super("Stock insuficiente");
    this.name = "StockError";
    this.items = items;
  }
}
