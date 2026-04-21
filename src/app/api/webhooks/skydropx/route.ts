import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { resend, SEND_FROM } from "@/lib/resend";
import OrderDeliveredEmail from "@/components/emails/OrderDeliveredEmail";

/**
 * Skydropx webhook.
 *
 * Auth: Skydropx manda un header `admin: Bearer <token>` que debe coincidir con
 *       SKYDROPX_WEBHOOK_TOKEN en env. La comparación es constant-time para
 *       prevenir timing attacks.
 *
 * Payload (JSON:API):
 *   {
 *     "data": {
 *       "id": "<package-id>",
 *       "type": "packages",
 *       "attributes": {
 *         "status": "delivered" | "in_transit" | ...,
 *         "tracking_number": "...",
 *         "tracking_url_provider": "...",
 *         "label_url": "...",
 *         "event_description": "..."
 *       },
 *       "relationships": {
 *         "shipment": { "data": { "id": "<shipment-id>", "type": "shipments" } }
 *       }
 *     }
 *   }
 *
 * Idempotencia: WebhookEvent(id) usando `sdpx_<shipmentId>_<status>`.
 */
export async function POST(req: NextRequest) {
  const expectedToken = process.env.SKYDROPX_WEBHOOK_SECRET || process.env.SKYDROPX_WEBHOOK_TOKEN;
  if (!expectedToken) {
    console.error("SKYDROPX_WEBHOOK_SECRET no está configurado");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  // Header personalizado: "admin: Bearer <token>"
  const adminHeader = req.headers.get("admin") || "";
  const received = adminHeader.replace(/^Bearer\s+/i, "").trim();

  const expectedBuf = Buffer.from(expectedToken);
  const receivedBuf = Buffer.from(received);
  const authOk =
    receivedBuf.length === expectedBuf.length &&
    crypto.timingSafeEqual(receivedBuf, expectedBuf);

  if (!authOk) {
    console.error("Token de webhook Skydropx inválido");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = payload?.data;
  const attrs = data?.attributes || {};
  const shipmentId: string = String(data?.relationships?.shipment?.data?.id || "");
  const packageId: string = String(data?.id || "");
  const status: string = String(attrs.status || "").toLowerCase();
  const trackingNumber: string | undefined = attrs.tracking_number;
  const trackingUrl: string | undefined = attrs.tracking_url_provider;

  if (!shipmentId) {
    return NextResponse.json({ received: true, skipped: "no shipment id" });
  }

  const eventId = `sdpx_${shipmentId}_${status || "update"}_${packageId}`;

  try {
    const existing = await prisma.webhookEvent.findUnique({ where: { id: eventId } });
    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    await prisma.webhookEvent.create({ data: { id: eventId, type: `skydropx.${status || "update"}` } });

    const order = await prisma.order.findFirst({
      where: { skydropxShipmentId: shipmentId },
      include: { user: true },
    });

    if (!order) {
      console.warn(`Webhook Skydropx para shipment ${shipmentId} pero no se encontró orden.`);
      return NextResponse.json({ received: true, skipped: "order not found" });
    }

    // Actualiza tracking si llegó más completo
    const trackingUpdates: Record<string, any> = {};
    if (trackingNumber && trackingNumber !== order.trackingNumber) {
      trackingUpdates.trackingNumber = trackingNumber;
    }
    if (trackingUrl && trackingUrl !== order.trackingUrl) {
      trackingUpdates.trackingUrl = trackingUrl;
    }

    const isDelivered = status === "delivered" || status === "entregado";
    const isInTransit =
      status === "in_transit" ||
      status === "transit" ||
      status === "picked_up" ||
      status === "out_for_delivery";

    if (isDelivered && order.status !== "DELIVERED") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          ...trackingUpdates,
          status: "DELIVERED",
          deliveredAt: new Date(),
        },
      });

      console.log(`🎉 Orden ${order.orderNumber} marcada como DELIVERED.`);

      if (resend && order.user?.email) {
        try {
          const { error: emailError } = await resend.emails.send({
            from: SEND_FROM,
            to: order.user.email,
            subject: `🎉 Tu pedido ${order.orderNumber} ha sido entregado`,
            react: OrderDeliveredEmail({
              orderNumber: order.orderNumber,
              customerName: order.user.name.split(" ")[0] || "Cliente",
            }),
          });
          if (emailError) console.error("Error API Resend (correo entrega):", emailError);
        } catch (emailError) {
          console.error("Excepción enviando correo de entrega:", emailError);
        }
      }
    } else if (isInTransit && order.status === "PAID") {
      // Si aún no marcábamos SHIPPED (raro pero posible), lo hacemos ahora
      await prisma.order.update({
        where: { id: order.id },
        data: {
          ...trackingUpdates,
          status: "SHIPPED",
          shippedAt: order.shippedAt ?? new Date(),
        },
      });
      console.log(`🚚 Orden ${order.orderNumber} marcada como SHIPPED por webhook.`);
    } else if (Object.keys(trackingUpdates).length > 0) {
      // Sólo refrescar tracking sin cambiar estado
      await prisma.order.update({
        where: { id: order.id },
        data: trackingUpdates,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error procesando webhook Skydropx:", error);
    return NextResponse.json({ error: "processing error" }, { status: 500 });
  }
}
