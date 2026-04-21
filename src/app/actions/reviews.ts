"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-utils";
import { checkActionRateLimit } from "@/lib/rate-limit-action";

export async function createReviewAction(formData: FormData) {
  if (!(await checkActionRateLimit("write"))) {
    return { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión para reseñar." };

  const productId = String(formData.get("productId") || "");
  const ratingRaw = Number(formData.get("rating"));
  const title = String(formData.get("title") || "").trim().slice(0, 100) || null;
  const body = String(formData.get("body") || "").trim();

  if (!productId) return { error: "Producto inválido." };
  if (!Number.isInteger(ratingRaw) || ratingRaw < 1 || ratingRaw > 5) {
    return { error: "La calificación debe estar entre 1 y 5." };
  }
  if (body.length < 10) return { error: "Escribe al menos 10 caracteres." };
  if (body.length > 2000) return { error: "La reseña es demasiado larga (máx 2000)." };

  // Verified buyer: must have a DELIVERED order containing this product.
  const deliveredOrder = await prisma.order.findFirst({
    where: {
      userId: user.id,
      status: "DELIVERED",
      items: { some: { variant: { productId } } },
    },
    select: { id: true },
  });

  if (!deliveredOrder) {
    return { error: "Solo puedes reseñar productos de pedidos entregados." };
  }

  try {
    await prisma.review.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      create: {
        userId: user.id,
        productId,
        orderId: deliveredOrder.id,
        rating: ratingRaw,
        title,
        body: body.slice(0, 2000),
      },
      update: {
        rating: ratingRaw,
        title,
        body: body.slice(0, 2000),
      },
    });

    revalidatePath(`/producto/${productId}`);
    revalidatePath("/orders");
    return { success: true };
  } catch (error: any) {
    console.error("createReviewAction error:", error);
    return { error: "No se pudo guardar la reseña." };
  }
}

export async function deleteOwnReviewAction(reviewId: string) {
  if (!(await checkActionRateLimit("write"))) {
    return { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { userId: true, productId: true },
    });
    if (!review) return { error: "Reseña no encontrada." };
    if (review.userId !== user.id) return { error: "No puedes eliminar esta reseña." };

    await prisma.review.delete({ where: { id: reviewId } });

    revalidatePath(`/producto/${review.productId}`);
    revalidatePath("/orders");
    return { success: true };
  } catch (error: any) {
    console.error("deleteOwnReviewAction error:", error);
    return { error: "No se pudo eliminar la reseña." };
  }
}

export async function adminToggleReviewVisibilityAction(reviewId: string) {
  const admin = await requireAdminUser();
  if (!admin) return { error: "Acceso denegado." };

  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { isHidden: true, productId: true },
    });
    if (!review) return { error: "Reseña no encontrada." };

    await prisma.review.update({
      where: { id: reviewId },
      data: { isHidden: !review.isHidden },
    });

    revalidatePath(`/producto/${review.productId}`);
    revalidatePath("/admin/reviews");
    return { success: true };
  } catch (error: any) {
    console.error("adminToggleReviewVisibilityAction error:", error);
    return { error: "No se pudo actualizar la visibilidad." };
  }
}
