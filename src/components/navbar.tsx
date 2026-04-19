"use client";

import Link from "next/link";
import { CartDrawer } from "./cart-drawer";
import { MagnifyingGlass, User, Football } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { logoutAction } from "@/app/actions/auth";

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
            {[
              { name: "Liga MX", slug: "liga-mx" },
              { name: "Europeos", slug: "europeos" },
              { name: "Selecciones", slug: "selecciones" },
              { name: "Retro", slug: "retro" },
              { name: "Ofertas", slug: "ofertas" }
            ].map((item) => (
              <Link 
                key={item.name} 
                href={`/?category=${item.slug}`} 
                className="hover:text-[#111111] transition-colors relative group"
              >
                {item.name}
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
            <div className="relative group">
              <Link 
                href="/profile" 
                className="p-3 hover:bg-[#111111]/5 rounded-full transition-colors text-[#111111] flex items-center"
              >
                <User size={22} weight="bold" />
              </Link>

              {/* Dropdown Menu (Desktop Hover) */}
              <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-56 z-50">
                <div className="bg-white border border-[#111111]/10 rounded-2xl shadow-xl flex flex-col p-2 gap-1 relative overflow-hidden">
                  {user ? (
                    <>
                      <Link href="/profile" className="px-4 py-3 hover:bg-[#111111]/5 rounded-xl text-xs font-bold uppercase tracking-widest text-[#111111] transition-colors">
                        Resumen
                      </Link>
                      <Link href="/orders" className="px-4 py-3 hover:bg-[#111111]/5 rounded-xl text-xs font-bold uppercase tracking-widest text-[#111111] transition-colors">
                        Mis Pedidos
                      </Link>
                      <Link href="/profile/addresses" className="px-4 py-3 hover:bg-[#111111]/5 rounded-xl text-xs font-bold uppercase tracking-widest text-[#111111] transition-colors">
                        Direcciones
                      </Link>
                      <Link href="/profile/settings" className="px-4 py-3 hover:bg-[#111111]/5 rounded-xl text-xs font-bold uppercase tracking-widest text-[#111111] transition-colors">
                        Configuración
                      </Link>
                      <form action={logoutAction} className="w-full mt-2 pt-2 border-t border-[#111111]/10">
                        <button type="submit" className="w-full text-left px-4 py-3 hover:bg-red-50 rounded-xl text-xs font-bold uppercase tracking-widest text-red-500 transition-colors">
                          Cerrar Sesión
                        </button>
                      </form>
                    </>
                  ) : (
                    <Link href="/login" className="px-4 py-3 hover:bg-[#111111]/5 rounded-xl text-xs font-bold uppercase tracking-widest text-[#111111] transition-colors text-center">
                      Iniciar Sesión
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

