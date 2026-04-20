"use client";

import { useState } from "react";
import { Star } from "@phosphor-icons/react";
import { ReviewForm } from "@/components/review-form";

interface Props {
  productId: string;
  productName: string;
  hasExistingReview?: boolean;
}

export function OrderReviewButton({ productId, productName, hasExistingReview }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#111111]/60 hover:text-[#111111] transition-colors"
      >
        <Star size={12} weight={hasExistingReview ? "fill" : "bold"} className={hasExistingReview ? "text-yellow-500" : ""} />
        {hasExistingReview ? "Editar reseña" : "Escribir reseña"}
      </button>

      {open && (
        <ReviewForm
          productId={productId}
          productName={productName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
