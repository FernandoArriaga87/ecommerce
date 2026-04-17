import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, shipping, subtotal, total } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
    }

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

    // Create Order in DB (Status: PENDING)
    const orderNumber = `DS-${Date.now().toString(36).toUpperCase()}`;
    const order = await prisma.order.create({
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
          create: await Promise.all(
            items.map(async (item: any) => {
              let variant = await prisma.variant.findFirst({
                where: { productId: item.productId, size: item.size },
              });

              if (!variant) {
                variant = await prisma.variant.create({
                  data: {
                    productId: item.productId,
                    size: item.size,
                    color: "Default",
                    stock: 0,
                    sku: `AUTO-${item.productId.slice(0, 8)}-${item.size}`,
                  },
                });
              }

              return {
                variantId: variant.id,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity,
              };
            })
          ),
        },
      },
    });

    // Create Stripe Line Items
    const line_items = items.map((item: any) => ({
      price_data: {
        currency: "mxn",
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
          metadata: {
            productId: item.productId,
            size: item.size,
          },
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // Add shipping as a line item if applicable
    if (shipping > 0) {
      line_items.push({
        price_data: {
          currency: "mxn",
          product_data: {
            name: "Envío",
          },
          unit_amount: Math.round(shipping * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout Session
    const origin = req.headers.get("origin");
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&orderId=${order.id}`,
      cancel_url: `${origin}/checkout`,
      customer_email: user.email,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error: any) {
    console.error("Quick Checkout Error:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}
