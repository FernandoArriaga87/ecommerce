import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type SyncMode = "merge" | "replace";

// POST /api/cart/sync
// body: { localItems: CartItem[]; mode?: "merge" | "replace" }
//
// "merge"  — guest→user fusion. Existing DB rows are preserved; quantities
//            for variants present in both sides are summed (capped at 99).
//            Used on SIGNED_IN so items the user already had on another
//            device don't get wiped out.
// "replace" — client is the source of truth (logged-in user just mutated
//            their cart). DB contents are deleted and rewritten from
//            localItems. Used for ongoing sync while the session is live.
//
// Always returns the fresh, fully hydrated cart so the client can replace
// its in-memory state directly.
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const localItems = Array.isArray(body?.localItems) ? body.localItems : [];
    const mode: SyncMode = body?.mode === "merge" ? "merge" : "replace";

    const cart = await prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    // Resolve each (productId, size) to a real, active variant. Invalid or
    // soft-deleted entries are silently dropped.
    const resolved: Array<{ variantId: string; quantity: number }> = [];
    for (const item of localItems) {
      const qty = Math.max(1, Math.min(99, Number(item?.quantity) || 1));
      const variant = await prisma.variant.findFirst({
        where: {
          productId: item?.productId,
          size: item?.size,
          product: { isDeleted: false, isActive: true },
        },
        select: { id: true },
      });
      if (variant) resolved.push({ variantId: variant.id, quantity: qty });
    }

    if (mode === "replace") {
      await prisma.$transaction([
        prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
        ...(resolved.length
          ? [
              prisma.cartItem.createMany({
                data: resolved.map((r) => ({
                  cartId: cart.id,
                  variantId: r.variantId,
                  quantity: r.quantity,
                })),
                skipDuplicates: true,
              }),
            ]
          : []),
      ]);
    } else {
      // merge: sum quantities for overlaps, keep existing DB items intact.
      for (const r of resolved) {
        await prisma.cartItem.upsert({
          where: {
            cartId_variantId: { cartId: cart.id, variantId: r.variantId },
          },
          update: { quantity: { increment: r.quantity } },
          create: {
            cartId: cart.id,
            variantId: r.variantId,
            quantity: r.quantity,
          },
        });
      }
      // Re-cap anything that went over 99 after the increment.
      await prisma.cartItem.updateMany({
        where: { cartId: cart.id, quantity: { gt: 99 } },
        data: { quantity: 99 },
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            variant: {
              include: { product: { include: { team: true } } },
            },
          },
        },
      },
    });

    const items =
      updatedCart?.items.map((i) => ({
        productId: i.variant.productId,
        name: i.variant.product.name,
        team: i.variant.product.team.name,
        price: Number(i.variant.product.price),
        image: i.variant.product.images[0] || "",
        size: i.variant.size,
        quantity: i.quantity,
      })) || [];

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Cart sync error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
