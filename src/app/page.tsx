import { formatPrice } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { ClientHome } from "../components/client-home";


export default async function Home() {
  const dbProducts = await prisma.product.findMany({
    include: {
      team: true
    }
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
