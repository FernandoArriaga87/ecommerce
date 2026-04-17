"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Trash, Plus, Minus, ArrowRight, Package, ShoppingCart } from "@phosphor-icons/react";
import Image from "next/image";
import { formatPrice } from "@/lib/data";
import { useCart } from "@/lib/cart-context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function CartDrawer() {
  const { items, removeItem, updateQuantity, totalItems, subtotal, isOpen, setIsOpen } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const shipping = subtotal >= 1499 ? 0 : 149;
      const total = subtotal + shipping;

      const res = await fetch("/api/checkout/quick-stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            size: i.size,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
          })),
          shipping,
          subtotal,
          total,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (res.status === 401) {
        setIsOpen(false);
        router.push("/login?returnUrl=/checkout");
      } else if (data.code === "PROFILE_INCOMPLETE") {
        setIsOpen(false);
        router.push("/complete-profile?returnUrl=/checkout");
      } else {
        alert(data.error || "Hubo un error al iniciar el pago.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const freeShippingThreshold = 1499;
  const remaining = Math.max(0, freeShippingThreshold - subtotal);
  const shippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {/* Trigger button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative text-[#111111] hover:bg-[#111111]/5 transition-all p-2 rounded-full h-auto w-auto"
        onClick={() => setIsOpen(true)}
      >
        <ShoppingBag weight="bold" size={24} />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center bg-[#111111] text-[9px] font-black text-white rounded-full">
            {totalItems}
          </span>
        )}
      </Button>

      <SheetContent className="flex w-full flex-col sm:max-w-md p-0 gap-0 border-l border-[#111111]/5 shadow-2xl bg-[#FAFAFA]">
        {/* Header */}
        <div className="bg-white border-b border-[#111111]/5 px-8 py-6">
          <SheetHeader>
            <SheetTitle className="text-xl font-black uppercase tracking-tighter text-[#111111] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag weight="fill" className="text-[#111111]" size={24} />
                Tu Carrito
              </div>
              {totalItems > 0 && (
                <span className="text-[10px] font-bold bg-[#111111]/5 text-[#111111]/40 px-3 py-1 rounded-full tracking-widest">
                  {totalItems} {totalItems === 1 ? "ARTÍCULO" : "ARTÍCULOS"}
                </span>
              )}
            </SheetTitle>
          </SheetHeader>
        </div>

        {/* Free shipping progress */}
        {totalItems > 0 && (
          <div className="px-8 py-4 bg-white">
            <div className="flex justify-between items-center mb-3">
              {remaining > 0 ? (
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#111111]/40">
                  Faltan <span className="text-[#111111]">{formatPrice(remaining)}</span> para <span className="text-[#111111]">Envío Gratis</span>
                </p>
              ) : (
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 flex items-center gap-2">
                  <Package weight="bold" size={14} /> ¡Envío gratis activado!
                </p>
              )}
              <span className="text-[10px] font-black text-[#111111]/20">{Math.round(shippingProgress)}%</span>
            </div>
            <div className="w-full h-1 bg-[#111111]/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${shippingProgress}%` }}
                className="h-full bg-[#111111] rounded-full"
                transition={{ duration: 1, ease: "circOut" }}
              />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-8 text-center px-12">
              <div className="w-32 h-32 rounded-[2.5rem] bg-[#111111]/5 flex items-center justify-center relative">
                <ShoppingBag weight="light" className="text-[#111111]/10" size={64} />
                <div className="absolute inset-0 flex items-center justify-center scale-150 rotate-12 opacity-5">
                   <ShoppingCart size={100} weight="fill" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xl font-black uppercase tracking-tight text-[#111111]">
                  Está muy vacío aquí
                </p>
                <p className="text-sm text-[#111111]/40 font-medium leading-relaxed">
                  Tu próximo jersey favorito está esperando. Explora nuestra nueva colección.
                </p>
              </div>
              <Button
                onClick={() => setIsOpen(false)}
                className="rounded-full bg-[#111111] text-white hover:bg-[#222222] uppercase font-black tracking-widest text-[10px] h-14 px-12 shadow-xl shadow-black/10"
              >
                Ir a la Tienda
              </Button>
            </div>
          ) : (
            <div className="flex flex-col p-8 gap-8">
              <AnimatePresence>
                {items.map((item, index) => (
                  <motion.div
                    key={`${item.productId}-${item.size}`}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: "spring" as const, stiffness: 300, damping: 30, delay: index * 0.05 }}
                    className="flex gap-6 group"
                  >
                    {/* Image */}
                    <div className="relative h-32 w-28 overflow-hidden bg-[#F3F3F3] rounded-3xl shrink-0 border border-[#111111]/5">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="text-[10px] text-[#111111]/30 font-bold uppercase tracking-widest mb-1">
                              {item.team}
                            </p>
                            <h3 className="font-bold text-base leading-tight text-[#111111] group-hover:text-[#111111]/60 transition-colors">
                              {item.name}
                            </h3>
                          </div>
                          <button
                            onClick={() => removeItem(item.productId, item.size)}
                            className="p-2 hover:bg-red-50 text-[#111111]/10 hover:text-red-500 rounded-full transition-all"
                          >
                            <Trash weight="bold" size={18} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-[9px] font-black uppercase tracking-widest bg-[#111111] text-white px-3 py-1 rounded-full">
                            {item.size}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        {/* Quantity controls */}
                        <div className="flex items-center bg-[#111111]/5 rounded-full p-1 h-10">
                          <button
                            onClick={() => updateQuantity(item.productId, item.size, -1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-full transition-all text-[#111111]"
                          >
                            <Minus weight="bold" size={12} />
                          </button>
                          <span className="w-8 flex items-center justify-center text-[11px] font-black text-[#111111]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.size, 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-full transition-all text-[#111111]"
                          >
                            <Plus weight="bold" size={12} />
                          </button>
                        </div>

                        <span className="font-black text-lg tracking-tighter text-[#111111]">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer / Checkout */}
        {items.length > 0 && (
          <div className="bg-white border-t border-[#111111]/5 px-8 py-8 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[#111111]/40">
                <span className="text-[10px] font-bold uppercase tracking-widest">Subtotal</span>
                <span className="font-bold text-sm tracking-tight">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-tighter text-[#111111]">Total estimado</span>
                <span className="text-3xl font-black text-[#111111] tracking-tighter">{formatPrice(subtotal)}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button
                className="w-full bg-[#111111] text-white hover:bg-[#222222] rounded-full h-16 uppercase font-black tracking-widest text-[10px] transition-all shadow-2xl shadow-black/20 flex items-center justify-center gap-3 group overflow-hidden relative"
                onClick={handleCheckout}
                disabled={loading}
              >
                <div className="flex items-center gap-3 group-hover:translate-x-1 transition-transform">
                  {loading ? "PROCESANDO..." : "FINALIZAR PEDIDO"}
                  {!loading && <ArrowRight weight="bold" size={18} />}
                </div>
              </Button>
              
              <Button
                variant="ghost"
                className="w-full text-[#111111]/40 hover:text-[#111111] hover:bg-transparent rounded-full h-10 uppercase font-bold tracking-[0.2em] text-[10px]"
                onClick={() => setIsOpen(false)}
              >
                Seguir Comprando
              </Button>
            </div>
            
            <p className="text-[9px] text-[#111111]/20 font-bold text-center uppercase tracking-widest leading-relaxed">
              Pago seguro encriptado • Envío rastreado • Devoluciones fáciles
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

