"use client";

import { useState } from "react";
import Image from "next/image";
import { formatPrice } from "@/lib/data";
import { ShoppingCart, ShieldCheck, Truck, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart-context";

export function ProductClientDisplay({ product }: { product: any }) {
  const { addItem } = useCart();

  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes.find((s: any) => s.stock > 0)?.label || ""
  );
  const [added, setAdded] = useState(false);

  const images = product.images?.length > 0 ? product.images : ["/placeholder.jpg"];
  const [activeImage, setActiveImage] = useState<string>(images[0]);

  const handleAddToCart = () => {
    if (!selectedSize) return;
    addItem({
      productId: product.id,
      name: product.name,
      team: product.team,
      price: product.price,
      image: images[0],
      size: selectedSize,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
      {/* Left: Product Image Gallery */}
      <div className="flex flex-col gap-4">
        <div className="relative aspect-square md:aspect-[4/5] bg-zinc-100 overflow-hidden border border-black/10">
          {product.badge && (
            <Badge className="absolute top-4 left-4 z-10 bg-blue-600 text-white rounded-none border-none font-black tracking-widest text-xs px-3 py-1 uppercase shadow-none">
              {product.badge}
            </Badge>
          )}
          <Image
            src={activeImage}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 ease-out hover:scale-105"
            priority
          />
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {images.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`relative aspect-square bg-zinc-100 overflow-hidden border-2 transition-all ${
                  activeImage === img ? "border-black" : "border-transparent hover:border-gray-300 opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={img} alt={`Vista ${idx + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Product Details */}
      <div className="flex flex-col">
        <div className="mb-3 flex justify-between items-center">
          <span className="text-gray-500 font-bold tracking-widest uppercase text-[10px] md:text-xs">
            {product.team}
          </span>
          <span className="text-gray-400 font-bold tracking-widest uppercase text-[10px] md:text-xs">
            SKU: {product.sku}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-4 text-black leading-tight">
          {product.name}
        </h1>

        <div className="text-3xl font-black mb-8 tracking-tight">
          {formatPrice(product.price)}
        </div>

        <div className="space-y-8 mb-8 mt-4">
          {/* Size Selector */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-black">Seleccionar Talla</h3>
              <button className="text-[10px] text-gray-500 hover:text-black border-b border-gray-500 hover:border-black font-bold uppercase tracking-widest transition-colors pb-0.5">
                Guía de Tallas
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {product.sizes.map((sizeObj: any, idx: number) => {
                const outOfStock = sizeObj.stock === 0;
                const isActive = selectedSize === sizeObj.label && !outOfStock;

                return (
                  <button
                    key={idx}
                    disabled={outOfStock}
                    onClick={() => setSelectedSize(sizeObj.label)}
                    className={`h-12 flex items-center justify-center rounded-none border-2 font-black uppercase tracking-widest transition-all ${
                      outOfStock
                        ? "border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed relative overflow-hidden"
                        : isActive
                        ? "border-black bg-black text-white shadow-md scale-[1.02]"
                        : "border-gray-200 hover:border-black text-black bg-white hover:bg-zinc-50"
                    }`}
                  >
                    {sizeObj.label}
                    {outOfStock && (
                      <span className="absolute inset-x-0 top-1/2 h-[2px] bg-red-400/50 -rotate-12 transform w-[150%] -left-3" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-4 mb-12">
          <Button
            size="lg"
            onClick={handleAddToCart}
            className={`h-16 rounded-none text-base font-black uppercase tracking-widest transition-all hover:translate-y-[-2px] hover:shadow-xl active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 ${
              added
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-black text-white hover:bg-gray-900"
            }`}
            disabled={!selectedSize}
          >
            {added ? (
              <>
                <Check className="mr-3 h-5 w-5" />
                ¡AGREGADO AL CARRITO!
              </>
            ) : (
              <>
                <ShoppingCart className="mr-3 h-5 w-5" />
                {selectedSize ? "AGREGAR AL CARRITO" : "SELECCIONA TALLA"}
              </>
            )}
          </Button>
          <div className="flex items-center justify-center gap-2 p-3 bg-zinc-50 border border-zinc-100">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <p className="text-[10px] md:text-xs text-gray-600 font-bold tracking-widest uppercase">
              Compra Protegida · Envío Asegurado
            </p>
          </div>
        </div>

        {/* Expanded Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-200">
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4" /> Envíos y Devoluciones
            </h4>
            <div className="space-y-4 text-sm text-gray-600 font-medium">
              <p>
                <strong className="block text-black mb-1">Envío Estándar Gratis</strong>
                Entrega de 3 a 5 días hábiles a cualquier parte con rastreo en vivo.
              </p>
              <p>
                <strong className="block text-black mb-1 flex items-center gap-2">
                  <RefreshCw className="w-3 h-3" /> Política Cero Riesgo
                </strong>
                Tienes 30 días exactos para cambiar de talla o color sin ningún cargo oculto adicional.
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest mb-4">
              Calidad y Especificaciones
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 font-medium list-inside list-disc">
              <li>Corte profesional atlético.</li>
              <li>Tejido ultraligero que absorbe la humedad inmediatamente al contacto.</li>
              <li>Escudo principal plastificado e inserciones bordadas.</li>
              <li>100% malla de poliéster técnico reciclado.</li>
              <li>Holograma de producto con licencia oficial impreso.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
