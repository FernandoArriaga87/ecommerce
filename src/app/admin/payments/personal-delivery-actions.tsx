"use client";

import { useTransition } from "react";
import { updateOrderStatusAction } from "@/app/actions/admin";
import { Truck, Check, Loader2 } from "lucide-react";

export function PersonalDeliveryActions({
  orderId,
  orderNumber,
  status,
}: {
  orderId: string;
  orderNumber: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  const run = (next: "SHIPPED" | "DELIVERED", label: string) => {
    if (!confirm(`¿Marcar ${orderNumber} como ${label}?`)) return;
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, next);
      if (result?.error) alert(result.error);
    });
  };

  if (status === "DELIVERED" || status === "CANCELLED" || status === "DISPUTED") {
    return (
      <span className="text-[9px] font-bold tracking-widest uppercase text-gray-400">
        Sin acciones
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[9px] font-black tracking-widest uppercase text-amber-600">
        Entrega personal (NL)
      </span>
      <div className="flex gap-1.5">
        {status === "PAID" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => run("SHIPPED", "enviada")}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-black tracking-widest uppercase bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Truck className="h-3 w-3" />}
            Enviar
          </button>
        )}
        {(status === "PAID" || status === "SHIPPED") && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => run("DELIVERED", "entregada")}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-black tracking-widest uppercase bg-black text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Entregar
          </button>
        )}
      </div>
    </div>
  );
}
