"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useEffect } from "react";

export default function CheckoutSuccessPage() {
  const { clearCart } = useCart();

  useEffect(() => {
    // Clear cart on mount if we've arrived at the success page
    clearCart();
  }, [clearCart]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12 text-center">
      <div className="flex flex-col items-center max-w-lg">
        <CheckCircle2 className="h-20 w-20 text-black mb-6" />
        <h1 className="text-4xl font-black uppercase tracking-tight mb-4">
          ¡PAGO EXITOSO!
        </h1>
        <p className="text-sm text-gray-500 font-medium tracking-wide uppercase mb-10">
          Tu orden ha sido procesada correctamente. Recibirás un correo electrónico con los detalles del envío y la guía de rastreo.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link href="/profile/orders" className="w-full sm:w-auto">
            <Button className="w-full h-14 px-8 rounded-none bg-black text-white hover:bg-gray-800 uppercase font-black tracking-widest text-xs">
              Ver Mis Pedidos
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full h-14 px-8 rounded-none border-black text-black hover:bg-gray-100 uppercase font-black tracking-widest text-xs">
              Seguir Comprando
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

