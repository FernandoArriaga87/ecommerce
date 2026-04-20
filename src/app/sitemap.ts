import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/envios`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/devoluciones`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contacto`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terminos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacidad`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/cookies`, changeFrequency: "yearly", priority: 0.3 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];

  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isDeleted: false },
      select: { id: true, createdAt: true },
    });

    productRoutes = products.map((p) => ({
      url: `${BASE_URL}/producto/${p.id}`,
      lastModified: p.createdAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch (error) {
    console.error("sitemap: failed to load products", error);
  }

  return [...staticRoutes, ...productRoutes];
}
