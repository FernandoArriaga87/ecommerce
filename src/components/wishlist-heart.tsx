"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "@phosphor-icons/react";
import { useWishlist } from "@/lib/wishlist-context";

interface Props {
  productId: string;
  variant?: "overlay" | "inline";
  className?: string;
}

export function WishlistHeart({ productId, variant = "overlay", className = "" }: Props) {
  const { isWishlisted, toggle } = useWishlist();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const active = isWishlisted(productId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      const res = await toggle(productId);
      if (res.requiresAuth) {
        router.push("/login");
      }
    });
  };

  const baseStyle =
    variant === "overlay"
      ? "absolute top-6 right-6 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm hover:bg-white transition-all"
      : "w-12 h-12 flex items-center justify-center rounded-full border border-[#111111]/10 hover:border-[#111111]/30 transition-all";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={active ? "Quitar de favoritos" : "Añadir a favoritos"}
      aria-pressed={active}
      className={`${baseStyle} ${isPending ? "opacity-60" : ""} ${className}`}
    >
      <Heart
        size={20}
        weight={active ? "fill" : "bold"}
        className={active ? "text-red-500" : "text-[#111111]"}
      />
    </button>
  );
}
