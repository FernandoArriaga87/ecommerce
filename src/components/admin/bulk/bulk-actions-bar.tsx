"use client";

import { ReactNode } from "react";
import { X } from "@phosphor-icons/react";
import { useBulkSelection } from "./bulk-provider";

export function BulkActionsBar({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const { size, clear } = useBulkSelection();

  if (size === 0) return null;

  return (
    <div className="sticky top-0 z-20 -mx-6 md:-mx-12 mb-6 px-6 md:px-12 py-4 bg-black text-white border-b border-white/10 flex flex-wrap items-center gap-4">
      <button
        type="button"
        onClick={clear}
        className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-colors"
        aria-label="Limpiar selección"
      >
        <X size={14} weight="bold" />
        Limpiar
      </button>
      <span className="text-xs font-black uppercase tracking-widest">
        {size} {label}
      </span>
      <div className="flex flex-wrap gap-2 ml-auto">{children}</div>
    </div>
  );
}
