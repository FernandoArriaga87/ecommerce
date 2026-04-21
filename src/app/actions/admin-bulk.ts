"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminUser, logAudit } from "@/lib/admin-utils";
import { resend, SEND_FROM } from "@/lib/resend";
import OrderShippedEmail from "@/components/emails/OrderShippedEmail";

const MAX_BULK = 200;

function sanitizeIds(ids: string[]): string[] {
  const unique = Array.from(new Set(ids.filter((id) => typeof id === "string" && id.length > 0)));
  return unique.slice(0, MAX_BULK);
}

type ProductBulkAction = "activate" | "deactivate" | "delete";

export async function bulkProductAction(ids: string[], action: ProductBulkAction) {
  const admin = await requireAdminUser();
  if (!admin) return { error: "Acceso denegado." };

  const targets = sanitizeIds(ids);
  if (targets.length === 0) return { error: "Selecciona al menos un producto." };

  try {
    if (action === "activate") {
      await prisma.product.updateMany({
        where: { id: { in: targets }, isDeleted: false },
        data: { isActive: true },
      });
    } else if (action === "deactivate") {
      await prisma.product.updateMany({
        where: { id: { in: targets }, isDeleted: false },
        data: { isActive: false },
      });
    } else {
      await prisma.product.updateMany({
        where: { id: { in: targets } },
        data: { isDeleted: true, isActive: false },
      });
    }

    await logAudit({
      actorId: admin.id,
      action: `PRODUCT_BULK_${action.toUpperCase()}`,
      entityType: "PRODUCT",
      entityIds: targets,
      metadata: { count: targets.length },
    });

    revalidatePath("/admin/products");
    revalidatePath("/", "layout");
    return { success: true, count: targets.length };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[bulkProductAction]", err);
    return { error: `No se pudo aplicar la acción: ${message}` };
  }
}

type OrderBulkAction = "SHIPPED" | "DELIVERED";

export async function bulkOrderStatusAction(ids: string[], status: OrderBulkAction) {
  const admin = await requireAdminUser();
  if (!admin) return { error: "Acceso denegado." };

  const targets = sanitizeIds(ids);
  if (targets.length === 0) return { error: "Selecciona al menos un pedido." };

  const eligibleStatuses = status === "SHIPPED" ? ["PAID"] : ["SHIPPED"];

  const orders = await prisma.order.findMany({
    where: { id: { in: targets }, status: { in: eligibleStatuses as never } },
    include: { user: true },
  });

  if (orders.length === 0) {
    return {
      error:
        status === "SHIPPED"
          ? "Ninguno de los pedidos seleccionados está PAID."
          : "Ninguno de los pedidos seleccionados está SHIPPED.",
    };
  }

  try {
    await prisma.order.updateMany({
      where: { id: { in: orders.map((o) => o.id) } },
      data: { status },
    });

    await logAudit({
      actorId: admin.id,
      action: `ORDER_BULK_${status}`,
      entityType: "ORDER",
      entityIds: orders.map((o) => o.id),
      metadata: { count: orders.length, skipped: targets.length - orders.length },
    });

    if (status === "SHIPPED" && resend) {
      for (const order of orders) {
        if (!order.user?.email) continue;
        try {
          await resend.emails.send({
            from: SEND_FROM,
            to: order.user.email,
            subject: `📦 Tu pedido ${order.orderNumber} va en camino!`,
            react: OrderShippedEmail({
              orderNumber: order.orderNumber,
              customerName: order.user.name.split(" ")[0] || "Cliente",
            }),
          });
        } catch (emailErr) {
          console.error(`[bulkOrderStatusAction] email failed ${order.orderNumber}`, emailErr);
        }
      }
    }

    revalidatePath("/admin/payments");
    return {
      success: true,
      count: orders.length,
      skipped: targets.length - orders.length,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[bulkOrderStatusAction]", err);
    return { error: `No se pudo actualizar: ${message}` };
  }
}

type ReviewBulkAction = "hide" | "show" | "delete";

export async function bulkReviewAction(ids: string[], action: ReviewBulkAction) {
  const admin = await requireAdminUser();
  if (!admin) return { error: "Acceso denegado." };

  const targets = sanitizeIds(ids);
  if (targets.length === 0) return { error: "Selecciona al menos una reseña." };

  try {
    if (action === "delete") {
      await prisma.review.deleteMany({ where: { id: { in: targets } } });
    } else {
      await prisma.review.updateMany({
        where: { id: { in: targets } },
        data: { isHidden: action === "hide" },
      });
    }

    await logAudit({
      actorId: admin.id,
      action: `REVIEW_BULK_${action.toUpperCase()}`,
      entityType: "REVIEW",
      entityIds: targets,
      metadata: { count: targets.length },
    });

    revalidatePath("/admin/reviews");
    revalidatePath("/", "layout");
    return { success: true, count: targets.length };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[bulkReviewAction]", err);
    return { error: `No se pudo aplicar la acción: ${message}` };
  }
}
