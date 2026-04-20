"use client";

import { useState, useTransition } from "react";
import { createReviewAction } from "@/app/actions/reviews";
import { StarInput } from "@/components/star-rating";

interface Props {
  productId: string;
  productName: string;
  existingReview?: {
    id: string;
    rating: number;
    title: string | null;
    body: string;
  } | null;
  onClose: () => void;
}

export function ReviewForm({ productId, productName, existingReview, onClose }: Props) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [title, setTitle] = useState(existingReview?.title ?? "");
  const [body, setBody] = useState(existingReview?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (rating < 1) {
      setError("Elige una calificación de 1 a 5 estrellas.");
      return;
    }
    if (body.trim().length < 10) {
      setError("Escribe al menos 10 caracteres.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("productId", productId);
    formData.set("rating", String(rating));

    startTransition(async () => {
      const res = await createReviewAction(formData);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(onClose, 1200);
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-title"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={() => !isPending && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg p-8 rounded-[2rem] shadow-2xl"
      >
        <h2 id="review-title" className="text-2xl font-black uppercase tracking-tight mb-1">
          {existingReview ? "Editar reseña" : "Escribir reseña"}
        </h2>
        <p className="text-xs text-[#111111]/50 mb-6 truncate">{productName}</p>

        <div className="mb-6">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#111111]/60 mb-2">
            Tu calificación
          </label>
          <StarInput value={rating} onChange={setRating} disabled={isPending} />
        </div>

        <div className="mb-4">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#111111]/60 mb-2">
            Título <span className="text-[#111111]/30 lowercase font-medium">(opcional)</span>
          </label>
          <input
            type="text"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            disabled={isPending}
            className="w-full border border-[#111111]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#111111]"
          />
        </div>

        <div className="mb-4">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#111111]/60 mb-2">
            Tu opinión
          </label>
          <textarea
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            minLength={10}
            maxLength={2000}
            disabled={isPending}
            required
            rows={5}
            placeholder="¿Qué te pareció el jersey? Calidad, ajuste, envío..."
            className="w-full border border-[#111111]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#111111] resize-none"
          />
          <p className="text-[10px] text-[#111111]/40 mt-1">{body.length} / 2000</p>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 px-3 py-2 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl">
            ¡Gracias por tu reseña!
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-[10px] font-bold uppercase tracking-widest border border-[#111111]/10 px-4 py-2 rounded-full hover:bg-[#111111]/5 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending || success}
            className="text-[10px] font-bold uppercase tracking-widest bg-[#111111] text-white hover:bg-[#222222] px-6 py-2 rounded-full transition-colors disabled:opacity-50"
          >
            {isPending ? "Enviando..." : existingReview ? "Actualizar" : "Publicar"}
          </button>
        </div>
      </form>
    </div>
  );
}
