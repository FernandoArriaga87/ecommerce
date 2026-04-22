import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ProductClientDisplay } from "./client-display";
import { ReviewList } from "@/components/review-list";
import { getPlaceholderAggregate } from "@/lib/placeholder-reviews";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      name: true,
      description: true,
      images: true,
      isDeleted: true,
      isActive: true,
      team: { select: { name: true } },
    },
  });

  if (!product || product.isDeleted) {
    return { title: "Producto no encontrado" };
  }

  const title = `${product.name} — Jersey de Aficionado ${product.team.name}`;
  const description =
    product.description?.slice(0, 160) ||
    `Jersey de aficionado inspirado en ${product.team.name}. Calidad premium, envío a todo México. Réplica no oficial.`;

  const ogImage = product.images?.[0];

  return {
    title,
    description,
    alternates: { canonical: `/producto/${id}` },
    robots: product.isActive ? undefined : { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/producto/${id}`,
      images: ogImage ? [{ url: ogImage, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [dbProduct, reviewAgg] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        team: true,
        variants: true,
      }
    }),
    prisma.review.aggregate({
      where: { productId: id, isHidden: false },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  if (!dbProduct || dbProduct.isDeleted) {
    notFound();
  }

  const realCount = reviewAgg._count.rating;
  const realAverage = reviewAgg._avg.rating ?? 0;

  // When there are no real reviews yet, fall back to placeholder aggregate
  // for the UI header. JSON-LD below intentionally only uses real data.
  const placeholderAgg = realCount === 0 ? getPlaceholderAggregate(id) : null;
  const reviewCount = placeholderAgg ? placeholderAgg.count : realCount;
  const reviewAverage = placeholderAgg ? placeholderAgg.average : realAverage;

  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL"];

  const sizes = Array.from(new Set(dbProduct.variants.map(v => v.size)))
    .sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b));

  const variants = dbProduct.variants.map(v => ({
    id: v.id,
    size: v.size,
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
    sizes,
    variants,
  };

  const totalStock = dbProduct.variants.reduce((sum, v) => sum + v.stock, 0);
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: dbProduct.description || `Jersey de aficionado inspirado en ${product.team}.`,
    image: product.images,
    sku: product.sku,
    brand: { "@type": "Brand", name: "AuraSport" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/producto/${product.id}`,
      priceCurrency: "MXN",
      price: product.price.toFixed(2),
      availability:
        totalStock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  if (realCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: realAverage.toFixed(2),
      reviewCount: realCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-16">
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        suppressHydrationWarning
      />
      <ProductClientDisplay
        product={product}
        reviewAverage={reviewAverage}
        reviewCount={reviewCount}
      />
      <ReviewList productId={product.id} />
    </div>
  );
}
