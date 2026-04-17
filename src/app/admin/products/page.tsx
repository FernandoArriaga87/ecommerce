import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/data";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeleteProductButton } from "@/components/admin/delete-button";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      team: true,
      variants: true,
    }
  });

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight">Catálogo de Productos</h1>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Gestión de Inventario y Precios</p>
        </div>
        <Link href="/admin/products/new">
          <Button className="rounded-none bg-black text-white hover:bg-gray-800 uppercase font-black tracking-widest px-6 h-12">
            + Agregar Producto
          </Button>
        </Link>
      </div>

      <div className="bg-white border border-gray-200 overflow-x-auto rounded-none">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 border-b border-gray-200 text-xs text-gray-600 uppercase tracking-widest font-bold">
            <tr>
              <th className="px-6 py-4">Producto</th>
              <th className="px-6 py-4">Equipo / Liga</th>
              <th className="px-6 py-4">Variantes</th>
              <th className="px-6 py-4">Precio</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest">
                  No hay productos registrados
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
                
                return (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-4">
                      <div className="relative h-12 w-12 bg-zinc-100 border border-black/10 overflow-hidden">
                        <Image src={product.images[0] || ""} alt={product.name} fill className="object-cover" />
                      </div>
                      <span className="font-bold uppercase text-xs">{product.name}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                      {product.team.name} <br/> <span className="text-[10px]">{product.category.name}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold">
                      {product.variants.length} Tallas<br/>
                      <span className={`text-[10px] ${totalStock === 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {totalStock} en stock
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black">
                      {formatPrice(Number(product.price))}
                    </td>
                    <td className="px-6 py-4">
                      {product.isActive ? (
                        <span className="bg-black text-white text-[10px] px-2 py-1 font-bold tracking-widest">ACTIVO</span>
                      ) : (
                        <span className="bg-gray-200 text-gray-500 text-[10px] px-2 py-1 font-bold tracking-widest">OCULTO</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/products/${product.id}`} className="text-[10px] font-bold tracking-widest uppercase border-b-2 border-black hover:text-gray-500 hover:border-gray-500 transition-colors inline-block">
                        Editar
                      </Link>
                      <DeleteProductButton id={product.id} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
