"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package } from "lucide-react";
import Image from "next/image";
import { formatPrice } from "@/lib/data";
import { useCart } from "@/lib/cart-context";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
        router.push("/login?returnUrl=/checkout"); // Fallback if they want to review
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
        className="relative text-white hover:text-gray-300 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <ShoppingCart className="h-5 w-5" />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center bg-white text-[10px] font-black text-black rounded-full animate-in zoom-in duration-200">
            {totalItems}
          </span>
        )}
      </Button>

      <SheetContent className="flex w-full flex-col sm:max-w-md p-0 gap-0 border-l-0 shadow-2xl">
        {/* Header */}
        <div className="bg-black text-white px-6 py-5">
          <SheetHeader>
            <SheetTitle className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-3">
              <ShoppingCart className="h-5 w-5" />
              Tu Carrito
              {totalItems > 0 && (
                <span className="text-xs font-bold bg-white text-black px-2 py-0.5 ml-auto">
                  {totalItems} {totalItems === 1 ? "ARTÍCULO" : "ARTÍCULOS"}
                </span>
              )}
            </SheetTitle>
          </SheetHeader>
        </div>

        {/* Free shipping progress */}
        {totalItems > 0 && (
          <div className="px-6 py-3 bg-zinc-50 border-b border-zinc-100">
            {remaining > 0 ? (
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Faltan <span className="text-black">{formatPrice(remaining)}</span> para envío gratis
              </p>
            ) : (
              <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 mb-2 flex items-center gap-1">
                <Package className="w-3 h-3" /> ¡Envío gratis desbloqueado!
              </p>
            )}
            <div className="w-full h-1.5 bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-black transition-all duration-500 ease-out"
                style={{ width: `${shippingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Body */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-8">
            <div className="w-24 h-24 rounded-full bg-zinc-100 flex items-center justify-center">
              <ShoppingCart className="h-10 w-10 text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-gray-800 mb-1">
                Tu carrito está vacío
              </p>
              <p className="text-xs text-gray-400 font-medium">
                Explora el catálogo y encuentra tu playera ideal.
              </p>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              className="rounded-none bg-black text-white hover:bg-gray-800 uppercase font-black tracking-widest text-xs h-12 px-10"
            >
              Seguir Comprando
            </Button>
          </div>
        ) : (
          <>
            {/* Items list */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col divide-y divide-zinc-100">
                {items.map((item, index) => (
                  <div
                    key={`${item.productId}-${item.size}`}
                    className="flex gap-4 p-6 hover:bg-zinc-50/50 transition-colors group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Image */}
                    <div className="relative h-28 w-24 overflow-hidden bg-zinc-100 shrink-0 border border-black/5">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                          {item.team}
                        </p>
                        <h3 className="font-black text-sm leading-tight uppercase truncate">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-zinc-100 px-2 py-0.5 text-gray-600">
                            Talla {item.size}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-end justify-between mt-3">
                        {/* Quantity controls */}
                        <div className="flex items-center border border-gray-200 h-8">
                          <button
                            onClick={() => updateQuantity(item.productId, item.size, -1)}
                            className="w-8 h-full flex items-center justify-center hover:bg-zinc-100 transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 h-full flex items-center justify-center text-xs font-black border-x border-gray-200">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.size, 1)}
                            className="w-8 h-full flex items-center justify-center hover:bg-zinc-100 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Price + delete */}
                        <div className="flex items-center gap-3">
                          <span className="font-black text-sm">{formatPrice(item.price * item.quantity)}</span>
                          <button
                            onClick={() => removeItem(item.productId, item.size)}
                            className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer / Checkout */}
            <div className="border-t-2 border-black bg-white">
              <div className="px-6 py-5 space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Subtotal</span>
                  <span className="text-xl font-black">{formatPrice(subtotal)}</span>
                </div>
                <p className="text-[10px] text-gray-400 font-medium text-center tracking-wide">
                  Impuestos y envío se calculan al finalizar la compra.
                </p>
                <Button
                  className="w-full bg-black text-white hover:bg-gray-900 rounded-none h-14 uppercase font-black tracking-widest text-xs transition-all hover:translate-y-[-1px] hover:shadow-lg active:translate-y-0 flex items-center justify-center gap-2"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? "Procesando..." : "Finalizar Compra"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-black rounded-none h-11 uppercase font-bold tracking-widest text-[10px]"
                  size="lg"
                  onClick={() => setIsOpen(false)}
                >
                  Seguir Comprando
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
