"use client";

import Link from "next/link";
import { CheckCircle, ShoppingBag, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useEffect } from "react";
import { motion } from "framer-motion";

export default function CheckoutSuccessPage() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[85dvh] px-8 py-20 text-center bg-[#FAFAFA]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="flex flex-col items-center max-w-xl bg-white p-12 md:p-20 rounded-[3rem] border border-[#111111]/5 shadow-2xl shadow-black/[0.03]"
      >
        <div className="w-24 h-24 bg-green-50 rounded-[2rem] flex items-center justify-center mb-10">
          <CheckCircle weight="fill" className="h-12 w-12 text-green-600" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 text-[#111111] leading-none">
          ¡PAGO<br />CONFIRMADO!
        </h1>
        
        <p className="text-sm md:text-base text-[#111111]/40 font-medium tracking-tight mb-12 max-w-sm">
          Tu equipo ya está preparando tu pedido. En breve recibirás un correo con todos los detalles y el enlace de rastreo oficial.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-5 w-full justify-center">
          <Link href="/orders" className="w-full">
            <Button className="w-full h-16 px-10 rounded-full bg-[#111111] text-white hover:bg-[#222222] uppercase font-black tracking-widest text-[10px] shadow-xl shadow-black/10 flex gap-3">
              Ver Mis Pedidos
              <ArrowRight weight="bold" />
            </Button>
          </Link>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full h-16 px-10 rounded-full border-[#111111]/10 text-[#111111] hover:bg-[#111111]/5 uppercase font-black tracking-widest text-[10px] flex gap-3">
              <ShoppingBag size={20} />
              Seguir Comprando
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Decorative details */}
      <div className="mt-12">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#111111]/20">Gracias por elegir DeportivoStore</p>
      </div>
    </div>
  );
}


