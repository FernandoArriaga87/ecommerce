"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "@phosphor-icons/react";
import { useWishlist } from "@/lib/wishlist-context";
import { getWishlistProductsAction } from "@/app/actions/wishlist";
import { formatPrice } from "@/lib/data";
import { WishlistHeart } from "@/components/wishlist-heart";

interface Product {
  id: string;
  name: string;
  slug: string;
  team: string;
  price: number;
  image: string;
  badge?: string;
}

export function WishlistClient() {
  const { ids, count, isLoggedIn } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      const idArray = Array.from(ids);
      if (idArray.length === 0) {
        if (!cancelled) {
          setProducts([]);
          setLoading(false);
        }
        return;
      }
      const result = await getWishlistProductsAction(idArray);
      if (!cancelled) {
        setProducts(result);
        setLoading(false);
      }
    };
    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  return (
    <div className="container mx-auto px-6 md:px-12 py-16 min-h-[60dvh]">
      <div className="mb-12">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase mb-3">
          Mis favoritos
        </h1>
        <p className="text-[#111111]/50 text-sm">
          {count === 0
            ? "Aún no has guardado ningún jersey."
            : `Tienes ${count} ${count === 1 ? "jersey guardado" : "jerseys guardados"}.`}
        </p>
        {!isLoggedIn && count > 0 && (
          <p className="mt-3 text-xs text-[#111111]/60 bg-[#111111]/5 inline-block px-4 py-2 rounded-full">
            <Link href="/login" className="underline font-bold">
              Inicia sesión
            </Link>{" "}
            para sincronizarlos con tu cuenta.
          </p>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[4/5] bg-[#F3F3F3] rounded-[2.5rem] animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-[#111111]/10 rounded-[2rem]">
          <Heart size={48} className="mx-auto text-[#111111]/20 mb-6" weight="bold" />
          <p className="text-2xl font-black uppercase tracking-tight mb-3">
            Tu lista está vacía
          </p>
          <p className="text-sm text-[#111111]/50 max-w-md mx-auto mb-8">
            Toca el corazón en cualquier jersey para guardarlo aquí.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#111111] text-white px-8 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-[#222222] transition-colors"
          >
            <ShoppingBag size={14} weight="bold" />
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {products.map((product) => (
            <div key={product.id} className="relative group">
              <Link href={`/producto/${product.id}`} className="block">
                <div className="relative aspect-[4/5] bg-[#F3F3F3] rounded-[2.5rem] overflow-hidden mb-6 transition-all duration-500 group-hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)]">
                  {product.badge && (
                    <div className="absolute top-6 left-6 z-10">
                      <span className="bg-white/80 backdrop-blur-md text-[#111111] text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-sm">
                        {product.badge}
                      </span>
                    </div>
                  )}
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover transition-transform duration-1000 ease-[0.23,1,0.32,1] group-hover:scale-110"
                  />
                </div>
                <div className="px-2">
                  <span className="text-[10px] font-bold text-[#111111]/40 uppercase tracking-[0.2em]">
                    {product.team}
                  </span>
                  <h3 className="font-bold text-xl leading-[1.1] mt-2 mb-2 text-[#111111] tracking-tight">
                    {product.name}
                  </h3>
                  <span className="font-bold text-base text-[#111111]">
                    {formatPrice(product.price)}
                  </span>
                </div>
              </Link>
              <WishlistHeart productId={product.id} variant="overlay" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
