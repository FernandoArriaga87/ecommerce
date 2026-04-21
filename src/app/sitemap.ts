import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/?category=ofertas`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/envios`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/devoluciones`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contacto`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terminos`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacidad`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  let categoryRoutes: MetadataRoute.Sitemap = [];

  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true, isDeleted: false },
        select: { id: true, createdAt: true },
      }),
      prisma.category.findMany({
        where: { products: { some: { isActive: true, isDeleted: false } } },
        select: { slug: true },
      }),
    ]);

    productRoutes = products.map((p) => ({
      url: `${BASE_URL}/producto/${p.id}`,
      lastModified: p.createdAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    categoryRoutes = categories.map((c) => ({
      url: `${BASE_URL}/?category=${encodeURIComponent(c.slug)}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("sitemap: failed to load dynamic routes", error);
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
