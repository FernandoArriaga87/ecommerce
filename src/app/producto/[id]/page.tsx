import { formatPrice } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProductClientDisplay } from "./client-display";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const dbProduct = await prisma.product.findUnique({
    where: { id },
    include: {
      team: true,
      variants: true,
    }
  });

  if (!dbProduct || dbProduct.isDeleted) {
    notFound();
  }

  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL"];

  const colors = Array.from(new Set(dbProduct.variants.map(v => v.color)));
  const sizes = Array.from(new Set(dbProduct.variants.map(v => v.size)))
    .sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b));

  const variants = dbProduct.variants.map(v => ({
    id: v.id,
    size: v.size,
    color: v.color,
    stock: v.stock,
    sku: v.sku,
  }));

  const product = {
    id: dbProduct.id,
    name: dbProduct.name,
    team: dbProduct.team.name,
    price: Number(dbProduct.price),
    images: dbProduct.images || [],
    badge: dbProduct.isFeatured ? "MÁS VENDIDO" : dbProduct.isNew ? "NUEVO" : undefined,
    sku: dbProduct.variants[0]?.sku.split('-').slice(0, -1).join('-') || "VAR-000",
    colors,
    sizes,
    variants,
  };

  return (
    <div className="container mx-auto px-4 py-8 lg:py-16">
      <ProductClientDisplay product={product} />
    </div>
  );
}
