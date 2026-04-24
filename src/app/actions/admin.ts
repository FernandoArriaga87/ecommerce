"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resend, SEND_FROM } from "@/lib/resend";
import OrderShippedEmail from "@/components/emails/OrderShippedEmail";
import OrderDeliveredEmail from "@/components/emails/OrderDeliveredEmail";
import { stripe } from "@/lib/stripe";
import { createShipment } from "@/lib/skydropx";
import { requireAdminUser, logAudit } from "@/lib/admin-utils";
import { formatPrice } from "@/lib/data";

async function verifyAdmin(): Promise<boolean> {
  return (await requireAdminUser()) !== null;
}

// Images are uploaded client-side to Supabase Storage; the form posts only their
// public URLs. We validate they point to our own `products` bucket so an attacker
// can't inject arbitrary URLs (e.g. hotlinks or tracking pixels) into the DB.
const PRODUCTS_BUCKET_PREFIX = (() => {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/products/` : null;
})();

function parseImageUrls(raw: string | null): string[] | null {
  if (!raw) return null;
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) return null;
    if (arr.length > 10) return null;
    for (const u of arr) {
      if (typeof u !== "string") return null;
      if (PRODUCTS_BUCKET_PREFIX && !u.startsWith(PRODUCTS_BUCKET_PREFIX)) return null;
    }
    return arr;
  } catch {
    return null;
  }
}

export async function createProductAction(prevState: any, formData: FormData) {
  if (!(await verifyAdmin())) return { error: "Acceso denegado." };

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const price = formData.get("price") as string;
  const teamId = formData.get("teamId") as string;
  const categoryId = formData.get("categoryId") as string;
  const isFeatured = formData.get("isFeatured") === "on";
  const isNew = formData.get("isNew") === "on";
  const variantsJson = formData.get("variantsJson") as string;
  const imageUrlsJson = formData.get("imageUrlsJson") as string | null;

  if (!name || !slug || !price || !teamId || !categoryId || !variantsJson) {
    return { error: "Todos los campos principales son obligatorios." };
  }

  const imageUrls = parseImageUrls(imageUrlsJson);
  if (!imageUrls) {
    return { error: "Debes subir al menos una imagen válida (hasta 10)." };
  }

  const variants = JSON.parse(variantsJson);
  if (variants.length === 0) {
    return { error: "Debes agregar al menos una variante (talla/stock)." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name,
          slug,
          price: Number(price),
          teamId,
          categoryId,
          images: imageUrls,
          isFeatured,
          isNew,
        }
      });

      for (const v of variants) {
        await tx.variant.create({
          data: {
            productId: product.id,
            size: v.size,
            stock: v.stock,
            sku: `${slug.toUpperCase()}-${v.size.toUpperCase()}-${Math.round(Math.random() * 1000)}`,
          }
        });
      }
    });
  } catch (error: any) {
    console.error("[createProductAction] DB error:", error);
    if (error?.code === "P2002") {
      return { error: "Ese slug ya está en uso. Elige otro." };
    }
    return { error: "No se pudo crear el producto. Revisa los datos e intenta de nuevo." };
  }

  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function deleteProductAction(productId: string) {
  if (!(await verifyAdmin())) throw new Error("Acceso denegado.");

  try {
    await prisma.product.update({ 
      where: { id: productId },
      data: { isDeleted: true }
    });
    revalidatePath("/", "layout");
  } catch (err) {
    console.error("Error al eliminar:", err);
    throw new Error("No se pudo archivar el producto");
  }
}

export async function updateProductAction(prevState: any, formData: FormData) {
  if (!(await verifyAdmin())) return { error: "Acceso denegado." };

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const teamId = formData.get("teamId") as string;
  const categoryId = formData.get("categoryId") as string;
  const isFeatured = formData.get("isFeatured") === "on";
  const isNew = formData.get("isNew") === "on";
  const variantsJson = formData.get("variantsJson") as string;
  const imageUrlsJson = formData.get("imageUrlsJson") as string | null;

  if (!id || !name || !slug || !teamId || !categoryId || !variantsJson) {
    return { error: "Todos los campos obligatorios deben estar llenos." };
  }

  const finalImageUrls = parseImageUrls(imageUrlsJson);
  if (!finalImageUrls) {
    return { error: "Debes tener al menos una imagen válida (hasta 10)." };
  }

  const variants = JSON.parse(variantsJson);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          name,
          slug,
          // El precio se omite aquí por seguridad para que sea inmutable
          teamId,
          categoryId,
          images: finalImageUrls,
          isFeatured,
          isNew,
        }
      });

      // Variantes: upsert por (productId, size). Las variantes que ya no están
      // en el form NO se borran (romperían la FK contra OrderItem/CartItem) —
      // se les pone stock=0 para que dejen de venderse.
      const existing = await tx.variant.findMany({
        where: { productId: id },
        select: { id: true, size: true },
      });
      const incomingSizes = new Set(variants.map((v: { size: string }) => v.size));

      for (const v of variants as Array<{ size: string; stock: number }>) {
        await tx.variant.upsert({
          where: {
            productId_size: { productId: id, size: v.size },
          },
          update: { stock: v.stock },
          create: {
            productId: id,
            size: v.size,
            stock: v.stock,
            sku: `${slug.toUpperCase()}-${v.size.toUpperCase()}-${Math.round(Math.random() * 1000)}`,
          },
        });
      }

      const removedIds = existing
        .filter((e) => !incomingSizes.has(e.size))
        .map((e) => e.id);
      if (removedIds.length > 0) {
        await tx.variant.updateMany({
          where: { id: { in: removedIds } },
          data: { stock: 0 },
        });
      }
    });
  } catch (error) {
    console.error("Update error:", error);
    return { error: "Error al actualizar producto y variantes." };
  }

  revalidatePath("/", "layout");
  redirect("/admin/products");
}

type OrderStatusInput = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "DISPUTED";

export async function updateOrderStatusAction(orderId: string, newStatus: OrderStatusInput) {
  if (!(await verifyAdmin())) return { error: "Acceso denegado." };

  try {
    const current = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true }
    });
    if (!current) return { error: "Pedido no encontrado." };

    // Safety: never ship or deliver while a chargeback is open. Resolve dispute first
    // (webhook will revert to PAID automatically if we win).
    if (current.status === "DISPUTED" && (newStatus === "SHIPPED" || newStatus === "DELIVERED")) {
      return { error: "No puedes enviar un pedido en disputa. Espera a que Stripe resuelva el contracargo." };
    }

    const extraData: Record<string, any> = {};
    if (newStatus === "SHIPPED" && current.status !== "SHIPPED") {
      extraData.shippedAt = new Date();
    }
    if (newStatus === "DELIVERED" && current.status !== "DELIVERED") {
      extraData.deliveredAt = new Date();
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus, ...extraData },
      include: {
        user: true,
        items: { include: { variant: { include: { product: true } } } },
      },
    });

    // Si se marca como enviado y tenemos resend configurado
    if (newStatus === "SHIPPED" && resend && order.user?.email) {
      try {
        const shipAddr = await prisma.address.findUnique({
          where: { id: order.addressId },
        });
        const shippedItems = order.items.map((it) => ({
          name: it.variant.product.name,
          size: it.variant.size,
          quantity: it.quantity,
          price: formatPrice(Number(it.total)),
        }));
        const { data, error: sendError } = await resend.emails.send({
          from: SEND_FROM,
          to: order.user.email,
          subject: `📦 Tu pedido ${order.orderNumber} va en camino!`,
          react: OrderShippedEmail({
            orderNumber: order.orderNumber,
            customerName: order.user.name.split(" ")[0] || "Cliente",
            carrier: order.carrier || undefined,
            trackingNumber: order.trackingNumber || undefined,
            trackingUrl: order.trackingUrl || undefined,
            items: shippedItems,
            shippingAddress: shipAddr ? {
              name: shipAddr.name,
              address: shipAddr.address,
              city: shipAddr.city,
              state: shipAddr.state,
              zipCode: shipAddr.zipCode,
            } : undefined,
          }),
        });
        if (sendError) console.error("Error API Resend (envío en admin action):", sendError);
        else console.log(`Correo de envío despachado con éxito para la orden: ${order.orderNumber}`, data);
      } catch (emailError) {
        console.error("Excepción enviando correo de pedido enviado:", emailError);
      }
    }

    // Si se marca como entregado, enviar correo de entrega
    if (newStatus === "DELIVERED" && resend && order.user?.email) {
      try {
        const { error: sendError } = await resend.emails.send({
          from: SEND_FROM,
          to: order.user.email,
          subject: `🎉 Tu pedido ${order.orderNumber} ha sido entregado`,
          react: OrderDeliveredEmail({
            orderNumber: order.orderNumber,
            customerName: order.user.name.split(" ")[0] || "Cliente",
          }),
        });
        if (sendError) console.error("Error API Resend (entrega en admin action):", sendError);
      } catch (emailError) {
        console.error("Excepción enviando correo de pedido entregado:", emailError);
      }
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Error actualizando estado del pedido:", error);
    return { error: "No se pudo actualizar el estado del pedido." };
  }
}

/**
 * Manually create the Skydropx shipment for an order stuck in PAID without
 * a tracking number. Used as a recovery path when the Stripe webhook hand-off
 * to Skydropx failed and Stripe's automatic retries already ran out.
 *
 * Idempotent: re-running on an order that already has skydropxShipmentId is a
 * no-op. Same per-step guards as the webhook (skydropxShipmentId,
 * shippedEmailSentAt) so this can be triggered manually or by a future cron.
 */
export async function createShipmentForOrderAction(orderId: string) {
  if (!(await verifyAdmin())) return { error: "Acceso denegado." };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { variant: { include: { product: true } } } },
      user: true,
    },
  });

  if (!order) return { error: "Pedido no encontrado." };
  if (order.skydropxShipmentId) {
    return { error: "Esta orden ya tiene un rastreo generado." };
  }
  if (order.isPersonalDelivery) {
    return { error: "Es entrega personal — no requiere rastreo." };
  }
  if (!order.skydropxRateId) {
    return { error: "La orden no tiene un rateId de Skydropx asociado. Reembolsa y pídele al cliente que vuelva a comprar." };
  }
  if (order.status !== "PAID" && order.status !== "SHIPPED") {
    return { error: `No puedes generar rastreo para una orden en estado ${order.status}.` };
  }

  const shippingAddr = await prisma.address.findUnique({
    where: { id: order.addressId },
  });
  if (!shippingAddr) return { error: "No se encontró la dirección de envío." };

  try {
    const totalItems = order.items.reduce((sum, it) => sum + it.quantity, 0);
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
        shippedAt: order.shippedAt ?? new Date(),
      },
    });

    if (resend && order.user?.email && !order.shippedEmailSentAt) {
      const shippedItems = order.items.map((it) => ({
        name: it.variant.product.name,
        size: it.variant.size,
        quantity: it.quantity,
        price: formatPrice(Number(it.total)),
      }));
      const { error: emailError } = await resend.emails.send({
        from: SEND_FROM,
        to: order.user.email,
        subject: `📦 Tu pedido ${order.orderNumber} va en camino`,
        react: OrderShippedEmail({
          orderNumber: order.orderNumber,
          customerName: order.user.name?.split(" ")[0] || "Cliente",
          estimatedDelivery: "3-5 días hábiles",
          carrier: order.carrier || undefined,
          trackingNumber: shipment.trackingNumber || undefined,
          trackingUrl: shipment.trackingUrl || undefined,
          items: shippedItems,
          shippingAddress: {
            name: shippingAddr.name,
            address: shippingAddr.address,
            city: shippingAddr.city,
            state: shippingAddr.state,
            zipCode: shippingAddr.zipCode,
          },
        }),
      });
      if (emailError) {
        console.error("Error API Resend (correo envío manual):", emailError);
      } else {
        await prisma.order.update({
          where: { id: orderId },
          data: { shippedEmailSentAt: new Date() },
        });
      }
    }

    revalidatePath("/admin/payments");
    return { success: true, trackingNumber: shipment.trackingNumber };
  } catch (error: any) {
    const message = error?.message || "Error desconocido";
    console.error(`Error generando rastreo Skydropx para ${order.orderNumber}:`, error);
    return { error: `No se pudo generar el rastreo: ${message}` };
  }
}

/**
 * Marca una orden como enviada MANUALMENTE y dispara el correo al cliente.
 * Para órdenes que el admin trabaja fuera de la automatización de Skydropx:
 * entregas personales en NL y órdenes con envío gratis (subtotal >= $1499)
 * donde el admin genera el rastreo por su cuenta con la paquetería que prefiera.
 *
 * Requiere carrier + trackingNumber. Idempotente a nivel de correo: 
 * respeta `shippedEmailSentAt`.
 */
export async function markManualShippedAction(input: {
  orderId: string;
  carrier: string;
  trackingNumber: string;
}) {
  const admin = await requireAdminUser();
  if (!admin) return { error: "Acceso denegado." };

  const carrier = input.carrier.trim();
  const trackingNumber = input.trackingNumber.trim();

  if (!carrier) return { error: "Indica la paquetería." };
  if (!trackingNumber) return { error: "Indica el número de rastreo." };

  let trackingUrl: string | null = null;
  const carrierLower = carrier.toLowerCase().replace(/\s/g, "");
  
  if (carrierLower.includes("dhl")) {
    trackingUrl = `https://www.dhl.com/mx-es/home/rastreo.html?tracking_id=${trackingNumber}`;
  } else if (carrierLower.includes("fedex")) {
    trackingUrl = `https://www.fedex.com/apps/fedextrack/?action=track&trackingnumber=${trackingNumber}`;
  } else if (carrierLower.includes("estafeta")) {
    trackingUrl = `https://www.estafeta.com/Herramientas/Rastreo?guia=${trackingNumber}`;
  } else if (carrierLower.includes("paquetexpress") || carrierLower.includes("paqueteexpress")) {
    trackingUrl = `https://www.paquetexpress.com.mx/rastreo?guia=${trackingNumber}`;
  } else if (carrierLower.includes("redpack")) {
    trackingUrl = `https://www.redpack.com.mx/rastreo-de-envios/?guia=${trackingNumber}`;
  } else if (carrierLower.includes("sendex")) {
    trackingUrl = `https://www.sendex.mx/rastreo-de-envio?guia=${trackingNumber}`;
  } else if (carrierLower.includes("jt") || carrierLower.includes("j&t")) {
    trackingUrl = `https://www.jtexpress.mx/index/query/gzquery.html?bills=${trackingNumber}`;
  } else if (carrierLower.includes("carssa")) {
    trackingUrl = `https://www.carssa.com.mx/rastreo/?guia=${trackingNumber}`;
  } else if (carrierLower.includes("99minutos")) {
    trackingUrl = `https://tracking.99minutos.com/tracking/${trackingNumber}`;
  }

  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: {
      user: true,
      items: { include: { variant: { include: { product: true } } } },
    },
  });
  if (!order) return { error: "Pedido no encontrado." };

  if (!order.isFreeShipping && !order.isPersonalDelivery) {
    return { error: "Esta orden tiene envío cobrado — se procesa automáticamente por Skydropx." };
  }
  if (order.status !== "PAID" && order.status !== "SHIPPED") {
    return { error: `No puedes marcar como enviada una orden en estado ${order.status}.` };
  }

  try {
    const wasAlreadyShipped = order.status === "SHIPPED";

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "SHIPPED",
        carrier,
        trackingNumber,
        trackingUrl,
        shippedAt: order.shippedAt ?? new Date(),
      },
    });

    if (resend && order.user?.email && !order.shippedEmailSentAt) {
      const shipAddr = await prisma.address.findUnique({
        where: { id: order.addressId },
      });
      const shippedItems = order.items.map((it) => ({
        name: it.variant.product.name,
        size: it.variant.size,
        quantity: it.quantity,
        price: formatPrice(Number(it.total)),
      }));
      const { error: emailError } = await resend.emails.send({
        from: SEND_FROM,
        to: order.user.email,
        subject: `📦 Tu pedido ${order.orderNumber} va en camino`,
        react: OrderShippedEmail({
          orderNumber: order.orderNumber,
          customerName: order.user.name?.split(" ")[0] || "Cliente",
          estimatedDelivery: "3-5 días hábiles",
          carrier,
          trackingNumber,
          trackingUrl: trackingUrl || undefined,
          items: shippedItems,
          shippingAddress: shipAddr ? {
            name: shipAddr.name,
            address: shipAddr.address,
            city: shipAddr.city,
            state: shipAddr.state,
            zipCode: shipAddr.zipCode,
          } : undefined,
        }),
      });
      if (emailError) {
        console.error("Error API Resend (envío manual):", emailError);
        // No borramos el cambio de estado — el admin puede reenviar el correo.
      } else {
        await prisma.order.update({
          where: { id: order.id },
          data: { shippedEmailSentAt: new Date() },
        });
      }
    }

    await logAudit({
      actorId: admin.id,
      action: wasAlreadyShipped ? "MANUAL_SHIP_UPDATE" : "MANUAL_SHIP",
      entityType: "ORDER",
      entityIds: [order.id],
      metadata: { carrier, trackingNumber, trackingUrl },
    });

    revalidatePath("/admin/payments");
    return { success: true };
  } catch (error: any) {
    console.error("[markManualShippedAction] error:", error);
    return { error: "No se pudo registrar el envío. Revisa los datos e intenta de nuevo." };
  }
}

type StripeRefundReason = "duplicate" | "fraudulent" | "requested_by_customer";

export async function refundOrderAction(
  orderId: string,
  reason: StripeRefundReason = "requested_by_customer"
) {
  if (!(await verifyAdmin())) return { error: "Acceso denegado." };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      externalId: true,
      total: true,
    },
  });

  if (!order) return { error: "Pedido no encontrado." };

  if (!order.externalId) {
    return { error: "Esta orden no tiene un cargo de Stripe asociado." };
  }

  if (order.status === "PENDING") {
    return { error: "La orden aún no se ha pagado. Cancélala en su lugar." };
  }

  if (order.status === "CANCELLED") {
    return { error: "La orden ya fue cancelada/reembolsada." };
  }

  try {
    await stripe.refunds.create({
      payment_intent: order.externalId,
      reason,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    console.log(
      `💸 Reembolso solicitado por admin — Orden ${order.orderNumber}. ` +
      `El webhook charge.refunded aplicará el cambio de estado.`
    );

    revalidatePath("/admin/payments");
    return { success: true };
  } catch (error: any) {
    const message: string =
      error?.raw?.message || error?.message || "Error desconocido";

    if (message.includes("already been refunded") || error?.code === "charge_already_refunded") {
      return { error: "Este cargo ya fue reembolsado en Stripe." };
    }

    console.error("Error reembolsando orden:", error);
    return { error: `No se pudo procesar el reembolso: ${message}` };
  }
}
