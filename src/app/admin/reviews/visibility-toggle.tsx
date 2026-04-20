"use client";

import { useTransition } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { adminToggleReviewVisibilityAction } from "@/app/actions/reviews";

export function ReviewVisibilityToggle({
  reviewId,
  isHidden,
}: {
  reviewId: string;
  isHidden: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await adminToggleReviewVisibilityAction(reviewId);
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border px-3 py-1.5 transition-colors ${
        isHidden
          ? "border-red-200 text-red-700 bg-red-50 hover:bg-red-100"
          : "border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
      } ${isPending ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      {isHidden ? <EyeSlash size={12} weight="bold" /> : <Eye size={12} weight="bold" />}
      {isHidden ? "Oculta" : "Visible"}
    </button>
  );
}
