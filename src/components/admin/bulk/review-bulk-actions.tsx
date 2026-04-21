"use client";

import { useTransition } from "react";
import { bulkReviewAction } from "@/app/actions/admin-bulk";
import { useBulkSelection } from "./bulk-provider";

export function ReviewBulkActions() {
  const { selected, clear } = useBulkSelection();
  const [isPending, startTransition] = useTransition();

  const run = (action: "hide" | "show" | "delete") => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (action === "delete" && !confirm(`¿Eliminar ${ids.length} reseña(s)? Esta acción no se puede deshacer.`)) return;
    startTransition(async () => {
      const result = await bulkReviewAction(ids, action);
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
        onClick={() => run("hide")}
        className={`${base} border-white/20 hover:bg-white hover:text-black`}
      >
        Ocultar
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => run("show")}
        className={`${base} border-white/20 hover:bg-white hover:text-black`}
      >
        Mostrar
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => run("delete")}
        className={`${base} border-red-400/40 text-red-300 hover:bg-red-500 hover:text-white hover:border-red-500`}
      >
        Eliminar
      </button>
    </>
  );
}
