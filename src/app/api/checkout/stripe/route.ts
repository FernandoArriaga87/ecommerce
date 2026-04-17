import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Checkout Body:", JSON.stringify(body, null, 2));
    const { name, email, phone, address, city, state, zipCode, items, shipping, subtotal, total } = body;

    if (!items || items.length === 0) {
      console.error("Empty cart");
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
    }

    // 1. Create or get user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          phone: phone || null,
          password: "guest", // Placeholder for guest
        },
      });
    }

    // 2. Create address
    const addr = await prisma.address.create({
      data: {
        userId: user.id,
        label: "Envío",
        name,
        phone: phone || "",
        address,
        city,
        state,
        zipCode,
      },
    });

    // 3. Create Order in DB (Status: PENDING)
    const orderNumber = `DS-${Date.now().toString(36).toUpperCase()}`;
    const order = await prisma.order.create({
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

    // 4. Create Stripe Line Items
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
        unit_amount: Math.round(item.price * 100), // Stripe expects cents
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

    // 5. Create Stripe Checkout Session
    const origin = req.headers.get("origin");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&orderId=${order.id}`,
      cancel_url: `${origin}/checkout`,
      customer_email: email,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    console.log("Stripe Session Created:", session.id);
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("CRITICAL Stripe Checkout Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
