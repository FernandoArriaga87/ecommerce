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

  try {
    // ── Idempotency: skip if we've seen this event id before ──
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { id: event.id }
    });

    if (existingEvent) {
      console.log(`Evento ${event.id} ya fue procesado. Ignorando.`);
      return NextResponse.json({ received: true });
    }

    await prisma.webhookEvent.create({
      data: { id: event.id, type: event.type }
    });

    switch (event.type) {
      // ─────────────────────────────────────────────
      // PAYMENT SUCCEEDED
      // Stock was reserved at checkout → flip to PAID.
      // We store payment_intent as externalId so that
      // future dispute/refund events can find the order.
      // ─────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const orderId = session.metadata?.orderId;
        if (!orderId) break;

        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            items: { include: { variant: { include: { product: true } } } },
            user: true
          }
        });

        if (order && order.status === "PENDING") {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: "PAID",
              externalId: session.payment_intent ?? session.id,
            },
          });

          console.log(`✅ Orden ${orderId} marcada como PAGADA. (Stock ya reservado)`);

          if (resend && order.user?.email) {
            try {
              const emailItems = order.items.map((item) => ({
                name: item.variant.product.name,
                size: item.variant.size,
                quantity: item.quantity,
                price: formatPrice(Number(item.price)),
              }));

              const { error: sendError } = await resend.emails.send({
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

              if (sendError) console.error("Error API Resend (correo pago):", sendError);
            } catch (emailError) {
              console.error("Excepción enviando correo de pago:", emailError);
            }
          }
        }
        break;
      }

      // ─────────────────────────────────────────────
      // PAYMENT FAILED / SESSION EXPIRED
      // Restore stock reserved at checkout.
      // ─────────────────────────────────────────────
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const session = event.data.object as any;
        const orderId = session.metadata?.orderId;
        if (!orderId) break;

        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: true }
        });

        if (order && order.status === "PENDING") {
          await prisma.$transaction(async (tx) => {
            await tx.order.update({
              where: { id: orderId },
              data: { status: "CANCELLED", externalId: session.id },
            });

            for (const item of order.items) {
              await tx.variant.update({
                where: { id: item.variantId },
                data: { stock: { increment: item.quantity } }
              });
            }
          });

          console.log(`❌ Orden ${orderId} CANCELADA. Stock restaurado.`);
        }
        break;
      }

      // ─────────────────────────────────────────────
      // CHARGEBACK: dispute opened at the issuing bank.
      // Freeze the order (DISPUTED) so admin does not
      // ship while Stripe investigates.
      // ─────────────────────────────────────────────
      case "charge.dispute.created": {
        const dispute = event.data.object as any;
        const paymentIntentId = dispute.payment_intent;
        if (!paymentIntentId) break;

        const order = await prisma.order.findFirst({
          where: { externalId: paymentIntentId }
        });

        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "DISPUTED" }
          });
          console.error(
            `⚠️ CHARGEBACK abierto — Orden ${order.orderNumber} (${order.id}) ` +
            `marcada DISPUTED. Reason: ${dispute.reason}. Amount: ${dispute.amount}.`
          );
        } else {
          console.error(`⚠️ Chargeback recibido pero no se encontró orden con payment_intent=${paymentIntentId}`);
        }
        break;
      }

      // ─────────────────────────────────────────────
      // CHARGEBACK RESOLVED
      // won      → revertir a PAID (podemos enviar)
      // lost     → dejar DISPUTED (ya perdimos el dinero)
      // warning_closed / needs_response → sin acción
      // ─────────────────────────────────────────────
      case "charge.dispute.closed": {
        const dispute = event.data.object as any;
        const paymentIntentId = dispute.payment_intent;
        if (!paymentIntentId) break;

        const order = await prisma.order.findFirst({
          where: { externalId: paymentIntentId }
        });
        if (!order) break;

        if (dispute.status === "won") {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "PAID" }
          });
          console.log(`✅ Dispute GANADA — Orden ${order.orderNumber} revertida a PAID.`);
        } else if (dispute.status === "lost") {
          console.error(
            `❌ Dispute PERDIDA — Orden ${order.orderNumber}. ` +
            `Revisar manualmente si hay que restaurar stock o no.`
          );
        }
        break;
      }

      // ─────────────────────────────────────────────
      // REFUND ISSUED (full or partial)
      // Marca como CANCELLED si el reembolso cubre el
      // total y la orden no fue entregada.
      // ─────────────────────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object as any;
        const paymentIntentId = charge.payment_intent;
        if (!paymentIntentId) break;

        const order = await prisma.order.findFirst({
          where: { externalId: paymentIntentId },
          include: { items: true }
        });
        if (!order) break;

        const fullyRefunded = charge.amount_refunded >= charge.amount;
        if (!fullyRefunded) {
          console.log(`Reembolso parcial en orden ${order.orderNumber}. Sin cambio de estado.`);
          break;
        }

        // If not yet shipped, restore stock.
        const canRestoreStock = order.status === "PAID" || order.status === "DISPUTED";

        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: { status: "CANCELLED" }
          });

          if (canRestoreStock) {
            for (const item of order.items) {
              await tx.variant.update({
                where: { id: item.variantId },
                data: { stock: { increment: item.quantity } }
              });
            }
          }
        });

        console.log(
          `💸 Reembolso total aplicado — Orden ${order.orderNumber} CANCELADA. ` +
          `Stock ${canRestoreStock ? "restaurado" : "NO restaurado (ya enviada)"}.`
        );
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
