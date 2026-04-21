"use client";

import { useTransition } from "react";
import { bulkProductAction } from "@/app/actions/admin-bulk";
import { useBulkSelection } from "./bulk-provider";

export function ProductBulkActions() {
  const { selected, clear } = useBulkSelection();
  const [isPending, startTransition] = useTransition();

  const run = (action: "activate" | "deactivate" | "delete") => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (action === "delete" && !confirm(`¿Eliminar ${ids.length} producto(s)? Se archivarán (soft-delete).`)) return;
    startTransition(async () => {
      const result = await bulkProductAction(ids, action);
      if ("error" in result && result.error) alert(result.error);
      else clear();
    });
  };

  const base =
    "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => run("activate")}
        className={`${base} border-white/20 hover:bg-white hover:text-black`}
      >
        Activar
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => run("deactivate")}
        className={`${base} border-white/20 hover:bg-white hover:text-black`}
      >
        Ocultar
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => run("delete")}
        className={`${base} border-red-400/40 text-red-300 hover:bg-red-500 hover:text-white hover:border-red-500`}
      >
        Archivar
      </button>
    </>
  );
}
