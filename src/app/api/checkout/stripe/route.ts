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

    // 2. Obtener productos y variantes de la DB para calcular precios reales
    // Buscamos todas las variantes involucradas
    const dbItems = await Promise.all(
      items.map(async (item) => {
        const variant = await prisma.variant.findFirst({
          where: { 
            productId: item.productId, 
            size: item.size 
          },
          include: { 
            product: true 
          }
        });

        if (!variant) {
          throw new Error(`Producto o talla no disponible: ${item.productId} - ${item.size}`);
        }

        if (variant.stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${variant.product.name} (Talla: ${item.size})`);
        }

        return {
          variant,
          quantity: item.quantity,
          price: variant.product.price
        };
      })
    );

    // 3. Calcular totales en el servidor
    const subtotal = dbItems.reduce((acc, item) => {
      return acc.add(new Decimal(item.price.toString()).mul(item.quantity));
    }, new Decimal(0));

    const shipping = new Decimal(150); // Tarifa fija de envío por ahora
    const total = subtotal.add(shipping);

    // 4. Buscar o crear usuario (Guest logic mejorada)
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          phone,
          password: "GUEST_USER_" + Math.random().toString(36).slice(-8), 
        },
      });
    }

    // 5. Crear dirección
    const addr = await prisma.address.create({
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

    // 6. Crear la orden con estatus PENDING
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
          create: dbItems.map((item) => ({
            variantId: item.variant.id,
            price: item.price,
            quantity: item.quantity,
            total: new Decimal(item.price.toString()).mul(item.quantity)
          })),
        },
      },
    });

    // 7. Preparar line_items para Stripe
    const line_items = dbItems.map((item) => ({
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

    // Agregar envío
    line_items.push({
      price_data: {
        currency: "mxn",
        product_data: {
          name: "Costo de Envío",
        },
        unit_amount: Math.round(Number(shipping) * 100),
      },
      quantity: 1,
    });

    // 8. Crear sesión de Stripe
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

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ 
      error: error.message || "Ocurrió un error al procesar el pago" 
    }, { status: 500 });
  }
}
