import { formatPrice } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
  return (
    <div className="w-full pb-12">
      {/* Edge-to-Edge Hero Section */}
      <div className="relative w-full bg-zinc-200 h-[600px] lg:h-[750px] flex items-center overflow-hidden mb-12">
        <Image
          // High end fashion/sports placeholder image
          src="https://images.unsplash.com/photo-1518605368461-1e1292237fac?q=80&w=1920&auto=format&fit=crop"
          alt="Sports Fashion"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay for contrast */}
        <div className="absolute inset-0 bg-black/40 lg:bg-black/20" />
        
        <div className="relative z-20 w-full px-6 md:px-16 lg:px-24 flex flex-col items-start gap-4">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white drop-shadow-md">
            LA PIEL DE<br/>LA PASIÓN
          </h1>
          <p className="text-xl md:text-2xl text-white font-semibold drop-shadow-md tracking-wide">
            ESTILO Y RENDIMIENTO.
          </p>
          <div className="flex flex-wrap gap-4 mt-4">
            <Button className="rounded-none bg-white text-black hover:bg-gray-200 uppercase font-bold tracking-wider px-8 h-12 text-sm">
              Equipos de la liga
            </Button>
            <Button className="rounded-none bg-white text-black hover:bg-gray-200 uppercase font-bold tracking-wider px-8 h-12 text-sm">
              Sudaderas y Más
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8">
        {/* Centered Bold Section Title */}
        <div className="flex flex-col items-center justify-center text-center mt-16 mb-8 lg:mb-12">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
            Eleva tu estilo de juego
          </h2>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center items-center gap-6 lg:gap-10 mb-10 overflow-x-auto pb-4 hide-scrollbar text-xs lg:text-sm font-bold tracking-widest uppercase">
          <button className="border-b-2 border-black pb-1 text-black font-black whitespace-nowrap">Ver Todos</button>
          <button className="border-b-2 border-transparent pb-1 text-gray-400 hover:text-black whitespace-nowrap transition-colors">Liga MX</button>
          <button className="border-b-2 border-transparent pb-1 text-gray-400 hover:text-black whitespace-nowrap transition-colors">Europeos</button>
          <button className="border-b-2 border-transparent pb-1 text-gray-400 hover:text-black whitespace-nowrap transition-colors">Selecciones</button>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
          {products.map((product) => (
            <Link href={`/producto/${product.id}`} key={product.id} className="group">
              <Card className="rounded-none border-none shadow-none bg-transparent hover:bg-[#FAFAFA] transition-all duration-300">
                <CardHeader className="p-0">
                  <div className="relative aspect-[4/5] bg-zinc-100 overflow-hidden">
                    {product.badge && (
                      <Badge className="absolute top-3 left-3 z-10 bg-black text-white hover:bg-black border-none rounded-none shadow-none font-bold text-xs px-2 py-1 uppercase tracking-widest">
                        {product.badge}
                      </Badge>
                    )}
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 mix-blend-multiply"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4 px-2">
                  <div className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-widest">
                    {product.team}
                  </div>
                  <h3 className="font-extrabold text-base leading-tight mb-2 group-hover:underline decoration-2 underline-offset-4">
                    {product.name}
                  </h3>
                </CardContent>
                <CardFooter className="p-4 pt-0 px-2 flex flex-col items-start">
                  <span className="font-bold text-lg">{formatPrice(product.price)}</span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Sticky Bottom-Left Widget */}
      <div className="fixed bottom-6 left-6 z-40">
        <Button variant="outline" className="rounded-none border-black bg-white text-black hover:bg-gray-100 uppercase font-bold text-xs px-4 py-6 shadow-xl flex items-center justify-between gap-4">
          OFERTA DEL 20%
          <span className="text-gray-500 text-lg font-light leading-none">×</span>
        </Button>
      </div>
    </div>
  );
}
