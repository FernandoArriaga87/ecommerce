import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { localItems } = await req.json();

    if (!Array.isArray(localItems)) {
      return NextResponse.json({ error: "localItems must be an array" }, { status: 400 });
    }

    const cart = await prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    for (const item of localItems) {
      const qty = Math.max(1, Math.min(99, Number(item.quantity) || 1));

      const variant = await prisma.variant.findFirst({
        where: {
          productId: item.productId,
          size: item.size,
          product: { isDeleted: false, isActive: true }
        }
      });

      if (!variant) continue;

      await prisma.cartItem.upsert({
        where: {
          cartId_variantId: { cartId: cart.id, variantId: variant.id }
        },
        update: { quantity: qty },
        create: {
          cartId: cart.id,
          variantId: variant.id,
          quantity: qty
        }
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            variant: {
              include: { product: { include: { team: true } } }
            }
          }
        }
      }
    });

    // Format for client
    const items = updatedCart?.items.map(i => ({
      productId: i.variant.productId,
      name: i.variant.product.name,
      team: i.variant.product.team.name,
      price: Number(i.variant.product.price),
      image: i.variant.product.images[0] || "",
      size: i.variant.size,
      quantity: i.quantity
    })) || [];

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Cart sync error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
