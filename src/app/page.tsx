import { prisma } from "@/lib/prisma";
import { ClientHome } from "../components/client-home";
import { Suspense } from "react";
import { ProductGridSkeleton } from "@/components/product-skeleton";
import { Prisma } from "@prisma/client";

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

type ProductCardShape = {
  id: string;
  name: string;
  team: string;
  price: number;
  image: string;
  badge?: string;
  slug: string;
};

// Raw-SQL path: Postgres full-text search over Product.name + description
// (via the `search_vector` GENERATED column, see prisma/migrations/product_search_vector.sql)
// plus ILIKE fallback on Team.name / Category.name so "barcelona jersey" matches
// even when the team name isn't in the product description.
async function searchProducts({
  search,
  category,
  sort,
  page,
}: {
  search: string;
  category?: string;
  sort: SortKey;
  page: number;
}): Promise<{ products: ProductCardShape[]; total: number }> {
  const pattern = `%${search}%`;
  const offset = (page - 1) * PAGE_SIZE;

  let categoryFilter = Prisma.empty;
  if (category && category !== "all") {
    categoryFilter =
      category === "ofertas"
        ? Prisma.sql`AND p."comparePrice" IS NOT NULL`
        : Prisma.sql`AND c.slug = ${category}`;
  }

  // Rank is only meaningful when sort is the default ("newest"); otherwise
  // the user explicitly asked for a price ordering and we respect it.
  let orderBy: Prisma.Sql;
  switch (sort) {
    case "price-asc":
      orderBy = Prisma.sql`ORDER BY p.price ASC`;
      break;
    case "price-desc":
      orderBy = Prisma.sql`ORDER BY p.price DESC`;
      break;
    default:
      orderBy = Prisma.sql`ORDER BY rank DESC, p."createdAt" DESC`;
  }

  type Row = {
    id: string;
    name: string;
    slug: string;
    price: Prisma.Decimal;
    images: string[];
    isNew: boolean;
    isFeatured: boolean;
    teamName: string;
  };

  const rowsPromise = prisma.$queryRaw<Row[]>`
    SELECT
      p.id,
      p.name,
      p.slug,
      p.price,
      p.images,
      p."isNew",
      p."isFeatured",
      t.name AS "teamName",
      ts_rank(p.search_vector, q.query) AS rank
    FROM "Product" p
    LEFT JOIN "Team" t ON t.id = p."teamId"
    LEFT JOIN "Category" c ON c.id = p."categoryId"
    CROSS JOIN (SELECT websearch_to_tsquery('spanish', ${search}) AS query) q
    WHERE p."isActive" = true
      AND p."isDeleted" = false
      AND (
        p.search_vector @@ q.query
        OR t.name ILIKE ${pattern}
        OR c.name ILIKE ${pattern}
      )
      ${categoryFilter}
    ${orderBy}
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  `;

  const countPromise = prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "Product" p
    LEFT JOIN "Team" t ON t.id = p."teamId"
    LEFT JOIN "Category" c ON c.id = p."categoryId"
    CROSS JOIN (SELECT websearch_to_tsquery('spanish', ${search}) AS query) q
    WHERE p."isActive" = true
      AND p."isDeleted" = false
      AND (
        p.search_vector @@ q.query
        OR t.name ILIKE ${pattern}
        OR c.name ILIKE ${pattern}
      )
      ${categoryFilter}
  `;

  const [rows, countRows] = await Promise.all([rowsPromise, countPromise]);

  const products: ProductCardShape[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    team: r.teamName,
    price: Number(r.price),
    image: r.images[0] || "",
    badge: r.isFeatured ? "Más vendido" : r.isNew ? "Nuevo" : undefined,
    slug: r.slug,
  }));

  return { products, total: Number(countRows[0]?.count ?? 0) };
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
  let products: ProductCardShape[];
  let total: number;

  if (search) {
    ({ products, total } = await searchProducts({ search, category, sort, page }));
  } else {
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

    const [totalCount, dbProducts] = await Promise.all([
      prisma.product.count({ where: whereClause }),
      prisma.product.findMany({
        where: whereClause,
        include: { team: true },
        orderBy: getOrderBy(sort),
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);

    total = totalCount;
    products = dbProducts.map((p) => ({
      id: p.id,
      name: p.name,
      team: p.team.name,
      price: Number(p.price),
      image: p.images[0] || "",
      badge: p.isFeatured ? "Más vendido" : p.isNew ? "Nuevo" : undefined,
      slug: p.slug,
    }));
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
