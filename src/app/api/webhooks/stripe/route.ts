import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { resend, SEND_FROM } from "@/lib/resend";
import OrderPaidEmail from "@/components/emails/OrderPaidEmail";
import { formatPrice } from "@/lib/data";

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
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { 
            items: true,
            user: true
          }
        });

        if (order && order.status === "PENDING") {
          await prisma.$transaction(async (tx) => {
            await tx.order.update({
              where: { id: orderId },
              data: {
                status: "PAID",
                externalId: session.id,
              },
            });

            for (const item of order.items) {
              await tx.variant.update({
                where: { id: item.variantId },
                data: {
                  stock: { decrement: item.quantity }
                }
              });
            }
          });
          
          console.log(`Orden ${orderId} marcada como PAGADA y stock descontado.`);

          // Enviar correo de confirmación de pago
          if (resend && order.user?.email) {
            try {
              await resend.emails.send({
                from: SEND_FROM,
                to: order.user.email,
                subject: `Pago Confirmado - Pedido ${order.orderNumber}`,
                react: OrderPaidEmail({ 
                  orderNumber: order.orderNumber, 
                  customerName: order.user.name.split(" ")[0] || "Cliente", 
                  total: formatPrice(Number(order.total))
                }),
              });
              console.log(`Correo de pago enviado para orden: ${order.orderNumber}`);
            } catch (emailError) {
              console.error("Error enviando correo de pago:", emailError);
            }
          }
        }
        break;
      }

      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
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
