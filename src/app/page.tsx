import { prisma } from "@/lib/prisma";
import { ClientHome } from "../components/client-home";
import { Suspense } from "react";
import { ProductGridSkeleton } from "@/components/product-skeleton";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 12;
const SORT_KEYS = ["newest", "price-asc", "price-desc"] as const;
type SortKey = (typeof SORT_KEYS)[number];

function getOrderBy(sort: SortKey): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "price-asc":
      return { price: "asc" };
    case "price-desc":
      return { price: "desc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

async function ProductsList({
  category,
  search,
  page,
  sort,
}: {
  category?: string;
  search?: string;
  page: number;
  sort: SortKey;
}) {
  const whereClause: Prisma.ProductWhereInput = {
    isActive: true,
    isDeleted: false,
  };

  if (category && category !== "all") {
    if (category === "ofertas") {
      whereClause.comparePrice = { not: null };
    } else {
      whereClause.category = { slug: category };
    }
  }

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { team: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, dbProducts] = await Promise.all([
    prisma.product.count({ where: whereClause }),
    prisma.product.findMany({
      where: whereClause,
      include: { team: true },
      orderBy: getOrderBy(sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const products = dbProducts.map((p) => ({
    id: p.id,
    name: p.name,
    team: p.team.name,
    price: Number(p.price),
    image: p.images[0] || "",
    badge: p.isFeatured ? "Más vendido" : p.isNew ? "Nuevo" : undefined,
    slug: p.slug,
  }));

  return (
    <ClientHome
      products={products}
      initialCategory={category || "all"}
      currentPage={page}
      totalPages={totalPages}
      totalCount={total}
      currentSort={sort}
      currentSearch={search}
    />
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    search?: string;
    page?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const pageNum = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const sort: SortKey = (SORT_KEYS as readonly string[]).includes(params.sort || "")
    ? (params.sort as SortKey)
    : "newest";

  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductsList
        category={params.category}
        search={params.search}
        page={pageNum}
        sort={sort}
      />
    </Suspense>
  );
}
