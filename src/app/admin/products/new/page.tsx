import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
// Force ts reload
import { ProductFormClient } from "./form-client";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  const teams = await prisma.team.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="w-full max-w-3xl">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight">Agregar Producto</h1>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Registro de nueva playera en inventario</p>
        </div>
        <Link href="/admin/products">
          <Button variant="outline" className="rounded-none border-black font-bold uppercase tracking-widest text-xs h-10">
            Cancelar
          </Button>
        </Link>
      </div>

      <ProductFormClient categories={categories} teams={teams} />
    </div>
  );
}
