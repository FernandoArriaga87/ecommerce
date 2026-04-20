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
    // Check if event was already processed
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { id: event.id }
    });

    if (existingEvent) {
      console.log(`Evento ${event.id} ya fue procesado. Ignorando.`);
      return NextResponse.json({ received: true });
    }

    // Save event to prevent future duplicate processing
    await prisma.webhookEvent.create({
      data: {
        id: event.id,
        type: event.type
      }
    });

    switch (event.type) {
      // ─────────────────────────────────────────────
      // PAYMENT SUCCEEDED
      // Stock was already reserved at checkout time.
      // We only need to flip status → PAID + send email.
      // ─────────────────────────────────────────────
      case "checkout.session.completed": {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { 
            items: {
              include: {
                variant: {
                  include: { product: true }
                }
              }
            },
            user: true
          }
        });

        if (order && order.status === "PENDING") {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: "PAID",
              externalId: session.id,
            },
          });
          
          console.log(`✅ Orden ${orderId} marcada como PAGADA. (Stock ya reservado al crear la orden)`);

          // Enviar correo de confirmación de pago con detalles del pedido
          if (resend && order.user?.email) {
            try {
              const emailItems = order.items.map((item) => ({
                name: item.variant.product.name,
                size: item.variant.size,
                quantity: item.quantity,
                price: formatPrice(Number(item.price)),
              }));

              const { data, error: sendError } = await resend.emails.send({
                from: SEND_FROM,
                to: order.user.email,
                subject: `✅ Pago Confirmado — Pedido ${order.orderNumber}`,
                react: OrderPaidEmail({ 
                  orderNumber: order.orderNumber, 
                  customerName: order.user.name.split(" ")[0] || "Cliente", 
                  total: formatPrice(Number(order.total)),
                  subtotal: formatPrice(Number(order.subtotal)),
                  shipping: Number(order.shipping) === 0 ? "Gratis" : formatPrice(Number(order.shipping)),
                  items: emailItems,
                }),
              });

              if (sendError) {
                console.error("Error desde API de Resend enviando correo de pago:", sendError);
              } else {
                console.log(`📧 Correo de pago enviado con éxito para orden: ${order.orderNumber}`, data);
              }
            } catch (emailError) {
              console.error("Excepción enviando correo de pago:", emailError);
            }
          }
        }
        break;
      }

      // ─────────────────────────────────────────────
      // PAYMENT FAILED / SESSION EXPIRED
      // Stock was reserved at checkout → must be 
      // restored so other customers can purchase.
      // ─────────────────────────────────────────────
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: true }
        });

        if (order && order.status === "PENDING") {
          await prisma.$transaction(async (tx) => {
            // 1. Mark order as CANCELLED
            await tx.order.update({
              where: { id: orderId },
              data: {
                status: "CANCELLED",
                externalId: session.id,
              },
            });

            // 2. Restore reserved stock for each item
            for (const item of order.items) {
              await tx.variant.update({
                where: { id: item.variantId },
                data: {
                  stock: { increment: item.quantity }
                }
              });
            }
          });
          
          console.log(`❌ Orden ${orderId} CANCELADA. Stock restaurado para ${order.items.length} variante(s).`);
        }
        break;
      }

      // ─────────────────────────────────────────────
      // CHARGE DISPUTE (CHARGEBACK)
      // Customer disputed the charge via their bank.
      // Mark as DISPUTED to stop fulfillment.
      // ─────────────────────────────────────────────
      case "charge.dispute.created": {
        const dispute = event.data.object as any;
        const paymentIntentId = dispute.payment_intent;

        if (paymentIntentId) {
          // Find the order that has this payment intent ID (stored as externalId in our PAID flow)
          const order = await prisma.order.findFirst({
            where: { externalId: paymentIntentId }
          });

          if (order) {
            await prisma.order.update({
              where: { id: order.id },
              data: { status: "DISPUTED" }
            });
            console.log(`⚠️ Alerta de contracargo: Orden ${order.orderNumber} marcada como DISPUTED.`);
          }
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
