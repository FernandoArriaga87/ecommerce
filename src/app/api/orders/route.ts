import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const reviewedIds = new Set(
      (
        await prisma.review.findMany({
          where: { userId: user.id },
          select: { productId: true },
        })
      ).map((r) => r.productId)
    );

    const shaped = orders.map((o) => ({
      ...o,
      items: o.items.map((item) => ({
        ...item,
        variant: {
          ...item.variant,
          product: {
            ...item.variant.product,
            userReviewed: reviewedIds.has(item.variant.product.id),
          },
        },
      })),
    }));

    return NextResponse.json({ orders: shaped });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
