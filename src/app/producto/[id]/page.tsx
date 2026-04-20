import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ProductClientDisplay } from "./client-display";
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

  const totalStock = dbProduct.variants.reduce((sum, v) => sum + v.stock, 0);
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: dbProduct.description || `Jersey de aficionado inspirado en ${product.team}.`,
    image: product.images,
    sku: product.sku,
    brand: { "@type": "Brand", name: "DeportivoStore" },
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

  return (
    <div className="container mx-auto px-4 py-8 lg:py-16">
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductClientDisplay product={product} />
    </div>
  );
}
