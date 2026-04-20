import { prisma } from "@/lib/prisma";
import { ClientHome } from "../components/client-home";
import { Suspense } from "react";
import { ProductGridSkeleton } from "@/components/product-skeleton";

async function ProductsList() {
  const dbProducts = await prisma.product.findMany({
    where: { isActive: true, isDeleted: false },
    include: {
      team: true
    },
    orderBy: { createdAt: 'desc' },
    take: 8
  });

  const products = dbProducts.map(p => ({
    id: p.id,
    name: p.name,
    team: p.team.name,
    price: Number(p.price),
    image: p.images[0] || "",
    badge: p.isFeatured ? "Más vendido" : p.isNew ? "Nuevo" : undefined,
    slug: p.slug
  }));

  return <ClientHome products={products} />;
}

export default function Home() {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductsList />
    </Suspense>
  );
}
