"use client";

import { useState } from "react";
import Image from "next/image";
import { formatPrice } from "@/lib/data";
import { ShoppingCart, ShieldCheck, Truck, ArrowClockwise, Check, Ruler, Info, Sparkle, Globe } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart-context";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
      {/* Left: Product Image Gallery */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <motion.div 
          layoutId={`image-${product.id}`}
          className="relative aspect-square md:aspect-[4/5] bg-[#F3F3F3] rounded-[2.5rem] overflow-hidden border border-[#111111]/5"
        >
          {product.badge && (
            <div className="absolute top-8 left-8 z-10">
              <span className="bg-[#111111] text-white text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-full shadow-2xl">
                {product.badge}
              </span>
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeImage}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              <Image
                src={activeImage}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
            {images.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`relative w-24 aspect-square rounded-2xl overflow-hidden shrink-0 border-2 transition-all duration-300 ${
                  activeImage === img ? "border-[#111111] scale-95" : "border-transparent opacity-40 hover:opacity-100"
                }`}
              >
                <Image src={img} alt={`Vista ${idx + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Product Details */}
      <div className="lg:col-span-5 flex flex-col py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-6 flex justify-between items-center">
            <span className="text-[#111111]/40 font-bold tracking-[0.2em] uppercase text-[10px]">
              OFICIAL {product.team}
            </span>
            <span className="text-[#111111]/20 font-bold tracking-[0.2em] uppercase text-[10px]">
              ID: {product.sku}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 text-[#111111] leading-[0.9]">
            {product.name}
          </h1>

          <div className="flex items-baseline gap-4 mb-10">
            <span className="text-4xl font-black tracking-tighter text-[#111111]">
              {formatPrice(product.price)}
            </span>
            <span className="text-xl font-medium text-[#111111]/20 line-through">
              {formatPrice(product.price * 1.25)}
            </span>
          </div>

          <div className="h-[1px] w-full bg-[#111111]/5 mb-10" />

          {/* Size Selector */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#111111]">Seleccionar Talla</h3>
              <button className="flex items-center gap-2 text-[10px] text-[#111111]/40 hover:text-[#111111] font-bold uppercase tracking-widest transition-all">
                <Ruler size={16} />
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
                    className={`h-14 flex items-center justify-center rounded-2xl border-2 font-black uppercase tracking-widest transition-all duration-300 relative ${
                      outOfStock
                        ? "border-[#111111]/5 text-[#111111]/10 bg-[#FAFAFA] cursor-not-allowed grayscale"
                        : isActive
                        ? "border-[#111111] bg-[#111111] text-white shadow-xl shadow-black/10 -translate-y-1"
                        : "border-[#111111]/10 text-[#111111]/60 bg-white hover:border-[#111111] hover:text-[#111111]"
                    }`}
                  >
                    {sizeObj.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-5 mb-16">
            <Button
              size="lg"
              onClick={handleAddToCart}
              className={`h-20 rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] transition-all hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.15)] active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 ${
                added
                  ? "bg-green-600 hover:bg-green-700 text-white border-none"
                  : "bg-[#111111] text-white hover:bg-[#222222] border-none"
              }`}
              disabled={!selectedSize}
            >
              {added ? (
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-3">
                  <Check weight="bold" size={24} />
                  ¡AGREGADO!
                </motion.div>
              ) : (
                <div className="flex items-center gap-3">
                  <ShoppingCart weight="bold" size={24} />
                  {selectedSize ? "AGREGAR AL CARRITO" : "SELECCIONA TALLA"}
                </div>
              )}
            </Button>
            
            <div className="flex items-center justify-center gap-3 p-4 bg-white rounded-3xl border border-[#111111]/5">
              <ShieldCheck weight="bold" size={20} className="text-green-600" />
              <p className="text-[10px] text-[#111111]/40 font-black tracking-widest uppercase">
                Compra Protegida · Envío Asegurado
              </p>
            </div>
          </div>

          {/* Specs & Info */}
          <div className="grid grid-cols-1 gap-12 pt-12 border-t border-[#111111]/5">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="bg-[#111111]/5 h-12 w-12 rounded-2xl flex items-center justify-center shrink-0">
                  <Truck weight="bold" size={24} className="text-[#111111]" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">Envío Estándar Gratis</h4>
                  <p className="text-sm text-[#111111]/50 font-medium">Entrega de 3 a 5 días con rastreo premium.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="bg-[#111111]/5 h-12 w-12 rounded-2xl flex items-center justify-center shrink-0">
                  <ArrowClockwise weight="bold" size={24} className="text-[#111111]" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">Política Cero Riesgo</h4>
                  <p className="text-sm text-[#111111]/50 font-medium">30 días para cambios sin cargos ocultos.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-[#111111]/5 h-12 w-12 rounded-2xl flex items-center justify-center shrink-0">
                  <Sparkle weight="bold" size={24} className="text-[#111111]" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">Calidad Profesional</h4>
                  <p className="text-sm text-[#111111]/50 font-medium">Tejido ultraligero con licencia oficial.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

