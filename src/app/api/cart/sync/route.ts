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

    // Find or create cart for user
    const cart = await prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
      include: { items: true },
    });

    // Strategy: Merge local items into DB. 
    // If same variant exists, we could sum them or prefer one. 
    // Here we'll just ensure all local items are in DB.
    
    for (const item of localItems) {
      // Find variant ID first (should be passed from client or we find by product + size)
      // For simplicity, let's assume client sends variantId if it has it, 
      // otherwise we find it.
      
      const variant = await prisma.variant.findFirst({
        where: {
          productId: item.productId,
          size: item.size
        }
      });

      if (!variant) continue;

      await prisma.cartItem.upsert({
        where: {
          // This requires a composite unique index in Prisma if we want real upsert
          // For now, let's find and update or create
          id: cart.items.find(i => i.variantId === variant.id)?.id || 'new-id'
        },
        update: { quantity: item.quantity },
        create: {
          cartId: cart.id,
          variantId: variant.id,
          quantity: item.quantity
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
