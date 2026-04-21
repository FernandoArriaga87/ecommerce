"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { checkActionRateLimit } from "@/lib/rate-limit-action";

async function requireUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function toggleWishlistAction(productId: string) {
  if (!(await checkActionRateLimit("write"))) {
    return { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." };
  }

  const userId = await requireUserId();
  if (!userId) return { error: "Debes iniciar sesión.", requiresAuth: true };

  if (!productId || typeof productId !== "string") {
    return { error: "Producto inválido." };
  }

  try {
    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
      select: { id: true },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      revalidatePath("/wishlist");
      return { success: true, added: false };
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isActive: true, isDeleted: true },
    });
    if (!product || product.isDeleted || !product.isActive) {
      return { error: "Producto no disponible." };
    }

    await prisma.wishlistItem.create({
      data: { userId, productId },
    });

    revalidatePath("/wishlist");
    return { success: true, added: true };
  } catch (error: any) {
    console.error("toggleWishlistAction error:", error);
    return { error: "No se pudo actualizar la lista de deseos." };
  }
}

export async function getWishlistIdsAction(): Promise<string[]> {
  const userId = await requireUserId();
  if (!userId) return [];

  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    select: { productId: true },
  });
  return items.map((i) => i.productId);
}

export async function getWishlistProductsAction(productIds: string[]) {
  if (!Array.isArray(productIds) || productIds.length === 0) return [];

  const cleanIds = Array.from(
    new Set(productIds.filter((id) => typeof id === "string" && id.length > 0))
  ).slice(0, 200);

  if (cleanIds.length === 0) return [];

  const products = await prisma.product.findMany({
    where: {
      id: { in: cleanIds },
      isActive: true,
      isDeleted: false,
    },
    include: { team: true },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    team: p.team.name,
    price: Number(p.price),
    image: p.images[0] || "",
    badge: p.isFeatured ? "Más vendido" : p.isNew ? "Nuevo" : undefined,
  }));
}

export async function mergeGuestWishlistAction(productIds: string[]) {
  const userId = await requireUserId();
  if (!userId) return { error: "Debes iniciar sesión." };

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return { success: true, merged: 0 };
  }

  const cleanIds = Array.from(
    new Set(productIds.filter((id) => typeof id === "string" && id.length > 0))
  ).slice(0, 200);

  if (cleanIds.length === 0) return { success: true, merged: 0 };

  try {
    const validProducts = await prisma.product.findMany({
      where: {
        id: { in: cleanIds },
        isActive: true,
        isDeleted: false,
      },
      select: { id: true },
    });

    if (validProducts.length === 0) return { success: true, merged: 0 };

    const result = await prisma.wishlistItem.createMany({
      data: validProducts.map((p) => ({ userId, productId: p.id })),
      skipDuplicates: true,
    });

    revalidatePath("/wishlist");
    return { success: true, merged: result.count };
  } catch (error: any) {
    console.error("mergeGuestWishlistAction error:", error);
    return { error: "No se pudieron fusionar los productos guardados." };
  }
}
