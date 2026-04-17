import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, address, city, state, zipCode, items, subtotal, shipping, total } = body;

    if (!name || !email || !items?.length) {
      return NextResponse.json({ success: false, error: "Campos obligatorios faltantes." }, { status: 400 });
    }

    // Find or create guest user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          phone: phone || null,
          password: "guest", // Guest checkout — no real password
        },
      });
    }

    // Create address
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

    // Generate order number
    const orderNumber = `DS-${Date.now().toString(36).toUpperCase()}`;

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        addressId: addr.id,
        subtotal,
        shipping,
        total,
        paymentMethod: "MERCADO_PAGO",
        status: "PENDING",
        items: {
          create: await Promise.all(
            items.map(async (item: any) => {
              // Try to find the matching variant for stock tracking
              let variant = await prisma.variant.findFirst({
                where: { productId: item.productId, size: item.size },
              });

              // If no variant exists, create one on the fly
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

    return NextResponse.json({ success: true, orderNumber: order.orderNumber });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { success: false, error: `Error interno: ${error.message}` },
      { status: 500 }
    );
  }
}
