"use client";

import { useTransition } from "react";
import { deleteProductAction } from "@/app/actions/admin";

export function DeleteProductButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm("¿Estás seguro de que deseas ELIMINAR este producto y todas sus tallas? Esta acción es irreversible.")) {
      startTransition(async () => {
        await deleteProductAction(id);
      });
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      className="text-[10px] font-bold tracking-widest uppercase text-red-500 border-b-2 border-red-500 hover:text-red-700 hover:border-red-700 transition-colors ml-4 disabled:opacity-50"
    >
      {isPending ? "..." : "Eliminar"}
    </button>
  );
}
