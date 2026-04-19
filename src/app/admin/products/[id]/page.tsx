import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductFormClient } from "../new/form-client";
import { notFound } from "next/navigation";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  const teams = await prisma.team.findMany({ orderBy: { name: 'asc' } });
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });

  if (!product) {
    notFound();
  }

  // Next.js (React Server Components) won't serialize Prisma's Decimal type automatically
  const serializedProduct = {
    ...product,
    price: Number(product.price),
    // Convert Dates if necessary, though React 19 handles Dates natively, 
    // it's safer to avoid passing them to Client components if unused.
    createdAt: product.createdAt.toISOString()
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight">Editar Producto</h1>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Modificando: {product.name}</p>
        </div>
        <Link href="/admin/products">
          <Button variant="outline" className="rounded-none border-black font-bold uppercase tracking-widest text-xs h-10">
            Regresar
          </Button>
        </Link>
      </div>

      <ProductFormClient categories={categories} teams={teams} product={serializedProduct} />
    </div>
  );
}
