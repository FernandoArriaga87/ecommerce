import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Error verificando la firma del Webhook de Stripe:`, err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const session = event.data.object as any;
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    // Si no hay orderId en los metadatos, no podemos hacer mucho.
    // Stripe manda eventos para otros cobros (si usas la misma cuenta), los ignoramos.
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        // El pago fue exitoso y los fondos fueron capturados.
        
        // 1. Buscamos la orden y verificamos que siga PENDING para no procesarla dos veces
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: true }
        });

        if (order && order.status === "PENDING") {
          // 2. Transacción: Actualizar orden a PAID y descontar el stock
          await prisma.$transaction(async (tx) => {
            await tx.order.update({
              where: { id: orderId },
              data: {
                status: "PAID",
                externalId: session.id,
              },
            });

            // Descontar inventario por cada item de la orden
            for (const item of order.items) {
              await tx.variant.update({
                where: { id: item.variantId },
                data: {
                  // Decrementa usando la base de datos de forma atómica
                  stock: { decrement: item.quantity }
                }
              });
            }
          });
          
          console.log(`Orden ${orderId} marcada como PAGADA y stock descontado.`);
        }
        break;
      }

      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        // El pago falló (ej. fondos insuficientes) o el usuario cerró la ventana y expiró la sesión (24h default)
        const order = await prisma.order.findUnique({
          where: { id: orderId }
        });

        if (order && order.status === "PENDING") {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: "CANCELLED",
              externalId: session.id,
            },
          });
          
          console.log(`Orden ${orderId} CANCELADA por fallo o expiración en Stripe.`);
        }
        break;
      }

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error crítico procesando el evento de Stripe:", error);
    return NextResponse.json(
      { error: "Error procesando el evento en la base de datos." },
      { status: 500 }
    );
  }
}
