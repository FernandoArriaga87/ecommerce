"use client";

import Link from "next/link";
// Force ts reload
import { CartDrawer } from "./cart-drawer";
import { Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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
    <header className="sticky top-0 z-50 w-full bg-[#18181b] text-white">
      <div className="px-6 h-16 flex items-center justify-between">
        {/* Left side: Logo & Nav Links */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2">
            {/* Minimalist icon instead of complex shape */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-white"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" x2="4" y1="22" y2="15"></line></svg>
            <span className="font-extrabold text-xl tracking-tight hidden md:inline-block">
              DEPORTIVOSTORE
            </span>
          </Link>
          <nav className="hidden lg:flex gap-6 text-[13px] font-bold uppercase tracking-wider">
            <Link href="/" className="hover:text-gray-300 transition-colors">Liga MX</Link>
            <Link href="/" className="hover:text-gray-300 transition-colors">Europeos</Link>
            <Link href="/" className="hover:text-gray-300 transition-colors">Selecciones</Link>
            <Link href="/" className="hover:text-gray-300 transition-colors">Retro</Link>
            <Link href="/" className="hover:text-gray-300 transition-colors">Ofertas</Link>
          </nav>
        </div>
        
        {/* Right side: Actions */}
        <div className="flex items-center gap-6">
          <Button variant="outline" className="hidden md:flex h-9 bg-transparent border-gray-600 text-white hover:bg-white/10 hover:text-white rounded-none px-4 gap-2 text-xs font-bold tracking-wider">
            <Search className="h-4 w-4" />
            BUSCAR
          </Button>
          
          <div className="flex items-center gap-4">
            <CartDrawer />
            <Link href="/profile" className="text-white hover:text-gray-300 transition-colors">
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
