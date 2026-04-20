import { prisma } from "@/lib/prisma";
import { ClientHome } from "../components/client-home";
import { Suspense } from "react";
import { ProductGridSkeleton } from "@/components/product-skeleton";

async function ProductsList({ category, search }: { category?: string, search?: string }) {
  const whereClause: any = {
    isActive: true,
    isDeleted: false,
  };

  if (category && category !== 'all') {
    if (category === 'ofertas') {
      whereClause.comparePrice = { not: null };
    } else {
      whereClause.category = {
        slug: category
      };
    }
  }

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { team: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const dbProducts = await prisma.product.findMany({
    where: whereClause,
    include: {
      team: true
    },
    orderBy: { createdAt: 'desc' },
    take: 12
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

  return <ClientHome products={products} initialCategory={category || "all"} />;
}

export default async function Home({ searchParams }: { searchParams: Promise<{ category?: string, search?: string }> }) {
  const { category, search } = await searchParams;

  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductsList category={category} search={search} />
    </Suspense>
  );
}
