"use client";

import { useTransition } from "react";
import { bulkOrderStatusAction } from "@/app/actions/admin-bulk";
import { useBulkSelection } from "./bulk-provider";

export function OrderBulkActions() {
  const { selected, clear } = useBulkSelection();
  const [isPending, startTransition] = useTransition();

  const run = (status: "SHIPPED" | "DELIVERED") => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    startTransition(async () => {
      const result = await bulkOrderStatusAction(ids, status);
      if ("error" in result && result.error) {
        alert(result.error);
        return;
      }
      if ("skipped" in result && result.skipped && result.skipped > 0) {
        alert(`${result.count} actualizado(s). ${result.skipped} omitido(s) por estado no elegible.`);
      }
      clear();
    });
  };

  const base =
    "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => run("SHIPPED")}
        className={`${base} border-white/20 hover:bg-white hover:text-black`}
      >
        Marcar enviado
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => run("DELIVERED")}
        className={`${base} border-white/20 hover:bg-white hover:text-black`}
      >
        Marcar entregado
      </button>
    </>
  );
}
