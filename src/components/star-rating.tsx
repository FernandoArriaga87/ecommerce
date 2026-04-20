"use client";

import { Star } from "@phosphor-icons/react";

export function StarDisplay({
  rating,
  size = 16,
  className = "",
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  const rounded = Math.round(rating);
  return (
    <div className={`flex items-center gap-0.5 ${className}`} aria-label={`${rating.toFixed(1)} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= rounded;
        return (
          <Star
            key={i}
            size={size}
            weight={filled ? "fill" : "regular"}
            className={filled ? "text-yellow-500" : "text-[#111111]/20"}
          />
        );
      })}
    </div>
  );
}

export function StarInput({
  value,
  onChange,
  size = 28,
  disabled = false,
}: {
  value: number;
  onChange: (next: number) => void;
  size?: number;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Calificación" className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= value;
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={i === value}
            aria-label={`${i} ${i === 1 ? "estrella" : "estrellas"}`}
            disabled={disabled}
            onClick={() => onChange(i)}
            className={`p-1 rounded transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#111111]/20 ${
              disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <Star
              size={size}
              weight={filled ? "fill" : "regular"}
              className={filled ? "text-yellow-500" : "text-[#111111]/20"}
            />
          </button>
        );
      })}
    </div>
  );
}
