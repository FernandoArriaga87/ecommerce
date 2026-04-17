"use client";

import Link from "next/link";
import { CartDrawer } from "./cart-drawer";
import { MagnifyingGlass, User, Football } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-[60] w-full bg-[#FAFAFA]/80 backdrop-blur-xl border-b border-[#111111]/5">
      <div className="px-6 md:px-12 h-20 flex items-center justify-between">
        {/* Left side: Logo & Nav Links */}
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-[#111111] p-2 rounded-xl text-white group-hover:rotate-12 transition-transform duration-500">
              <Football weight="fill" size={24} />
            </div>
            <span className="font-black text-xl tracking-tighter text-[#111111]">
              DEPORTIVOSTORE
            </span>
          </Link>
          <nav className="hidden lg:flex gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-[#111111]/50">
            {["Liga MX", "Europeos", "Selecciones", "Retro", "Ofertas"].map((item) => (
              <Link 
                key={item} 
                href="/" 
                className="hover:text-[#111111] transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-[#111111] transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Right side: Actions */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center bg-[#111111]/5 px-4 h-11 rounded-full border border-[#111111]/5 focus-within:bg-white focus-within:border-[#111111]/10 transition-all group">
            <MagnifyingGlass size={18} className="text-[#111111]/30 group-focus-within:text-[#111111]" />
            <input 
              type="text" 
              placeholder="BUSCAR EQUIPO..." 
              className="bg-transparent border-none outline-none text-[10px] font-bold tracking-widest px-3 w-32 focus:w-48 transition-all placeholder:text-[#111111]/20 text-[#111111]"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <CartDrawer />
            <Link 
              href="/profile" 
              className="p-3 hover:bg-[#111111]/5 rounded-full transition-colors text-[#111111]"
            >
              <User size={22} weight="bold" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

