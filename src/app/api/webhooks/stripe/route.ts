import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { resend, SEND_FROM } from "@/lib/resend";
import OrderPaidEmail from "@/components/emails/OrderPaidEmail";
import OrderShippedEmail from "@/components/emails/OrderShippedEmail";
import { createShipment } from "@/lib/skydropx";
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
    // ── Idempotency check ──
    // For checkout.session.completed we DON'T early-exit on duplicate events.
    // Instead each sub-step (status flip, paid email, label creation, shipped
    // email) has its own DB-state guard, and the WebhookEvent row is written at
    // the very end. That way if Skydropx (or anything else) blows up partway
    // through, returning 500 lets Stripe retry and we resume from where we
    // left off without re-sending emails or double-flipping status.
    //
    // Other events still rely on the old "register first, exit if seen" model
    // because they're naturally idempotent (idempotent SET ... WHERE state=…).
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { id: event.id }
    });

    const isCheckoutCompleted = event.type === "checkout.session.completed";

    if (existingEvent && !isCheckoutCompleted) {
      console.log(`Evento ${event.id} ya fue procesado. Ignorando.`);
      return NextResponse.json({ received: true });
    }

    if (!isCheckoutCompleted) {
      await prisma.webhookEvent.create({
        data: { id: event.id, type: event.type }
      });
    }

    switch (event.type) {
      // ─────────────────────────────────────────────
      // PAYMENT SUCCEEDED
      // Stock was reserved at checkout → flip to PAID.
      // Each sub-step is guarded by an Order column so this whole branch is
      // safely retryable end-to-end.
      // ─────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const orderId = session.metadata?.orderId;
        if (!orderId) break;

        let order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            items: { include: { variant: { include: { product: true } } } },
            user: true
          }
        });

        if (!order) break;

        // ── Step 1: PENDING → PAID (idempotent via status guard) ──
        if (order.status === "PENDING") {
          const updated = await prisma.order.updateMany({
            where: { id: orderId, status: "PENDING" },
            data: {
              status: "PAID",
              externalId: session.payment_intent ?? session.id,
            },
          });
          if (updated.count > 0) {
            console.log(`✅ Orden ${orderId} marcada como PAGADA. (Stock ya reservado)`);
            // Refresh the in-memory copy so downstream steps see PAID.
            order = { ...order, status: "PAID", externalId: session.payment_intent ?? session.id };
          }
        }

        // ── Step 2: send "payment confirmed" email (guarded by paymentEmailSentAt) ──
        if (resend && order.user?.email && !order.paymentEmailSentAt &&
            (order.status === "PAID" || order.status === "SHIPPED" || order.status === "DELIVERED")) {
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
              customerName: order.user.name?.split(" ")[0] || "Cliente",
              total: formatPrice(Number(order.total)),
              subtotal: formatPrice(Number(order.subtotal)),
              shipping: Number(order.shipping) === 0 ? "Gratis" : formatPrice(Number(order.shipping)),
              items: emailItems,
            }),
          });

          if (sendError) {
            // Resend failure is not retryable from Stripe's side in a useful way
            // (we'd just re-flip the order). Log and move on; admin can resend.
            console.error("Error API Resend (correo pago):", sendError);
          } else {
            await prisma.order.update({
              where: { id: orderId },
              data: { paymentEmailSentAt: new Date() },
            });
            order = { ...order, paymentEmailSentAt: new Date() };
          }
        }

        // ── Step 3: create Skydropx label (guarded by skydropxShipmentId) ──
        // Skip entirely for personal delivery (NL) and free-shipping orders —
        // those los maneja el admin manualmente desde el panel.
        // If this throws we let the error bubble: WebhookEvent never gets
        // recorded, Stripe retries, and steps 1-2 short-circuit on their own
        // guards so only this step actually re-runs.
        if (!order.isPersonalDelivery &&
            !order.isFreeShipping &&
            order.skydropxRateId &&
            !order.skydropxShipmentId &&
            (order.status === "PAID" || order.status === "SHIPPED")) {
          const shippingAddr = await prisma.address.findUnique({
            where: { id: order.addressId },
          });

          if (!shippingAddr) {
            console.error(`No se encontró dirección ${order.addressId} para orden ${order.orderNumber}.`);
          } else {
            const totalItems = order.items.reduce((sum: number, it: any) => sum + it.quantity, 0);
            const shipment = await createShipment({
              rateId: order.skydropxRateId,
              orderNumber: order.orderNumber,
              totalItems,
              destination: {
                name: shippingAddr.name,
                street1: shippingAddr.address,
                city: shippingAddr.city,
                province: shippingAddr.state,
                zip: shippingAddr.zipCode,
                phone: shippingAddr.phone,
                email: order.user?.email || "",
              },
            });

            await prisma.order.update({
              where: { id: orderId },
              data: {
                status: "SHIPPED",
                skydropxShipmentId: shipment.shipmentId,
                trackingNumber: shipment.trackingNumber,
                trackingUrl: shipment.trackingUrl,
                shippingLabelUrl: shipment.labelUrl,
                shippedAt: new Date(),
              },
            });

            console.log(`📦 Guía Skydropx creada para ${order.orderNumber}: ${shipment.trackingNumber}`);
            order = {
              ...order,
              status: "SHIPPED",
              skydropxShipmentId: shipment.shipmentId,
              trackingNumber: shipment.trackingNumber,
              trackingUrl: shipment.trackingUrl,
              shippingLabelUrl: shipment.labelUrl,
              shippedAt: new Date(),
            };
          }
        }

        // ── Step 4: send "in transit" email (guarded by shippedEmailSentAt) ──
        if (resend && order.user?.email &&
            order.skydropxShipmentId &&
            !order.shippedEmailSentAt) {
          const { error: shipEmailError } = await resend.emails.send({
            from: SEND_FROM,
            to: order.user.email,
            subject: `📦 Tu pedido ${order.orderNumber} va en camino`,
            react: OrderShippedEmail({
              orderNumber: order.orderNumber,
              customerName: order.user.name?.split(" ")[0] || "Cliente",
              estimatedDelivery: "3-5 días hábiles",
              carrier: order.carrier || undefined,
              trackingNumber: order.trackingNumber || undefined,
              trackingUrl: order.trackingUrl || undefined,
            }),
          });
          if (shipEmailError) {
            console.error("Error API Resend (correo envío):", shipEmailError);
          } else {
            await prisma.order.update({
              where: { id: orderId },
              data: { shippedEmailSentAt: new Date() },
            });
          }
        }

        // All steps succeeded (or were skipped because they don't apply) →
        // record the event. Use upsert because Stripe may re-deliver after a
        // successful run and we want the second pass to no-op cleanly.
        await prisma.webhookEvent.upsert({
          where: { id: event.id },
          create: { id: event.id, type: event.type },
          update: {},
        });
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
