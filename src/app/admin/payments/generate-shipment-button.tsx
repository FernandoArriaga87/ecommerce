"use client";

import { useTransition } from "react";
import { createShipmentForOrderAction } from "@/app/actions/admin";
import { Package, Loader2 } from "lucide-react";

export function GenerateShipmentButton({
  orderId,
  orderNumber,
}: {
  orderId: string;
  orderNumber: string;
}) {
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    if (!confirm(`¿Generar rastreo Skydropx para ${orderNumber}? Esta acción cobra el envío con la paquetería elegida en checkout.`)) return;
    startTransition(async () => {
      const result = await createShipmentForOrderAction(orderId);
      if (result?.error) {
        alert(result.error);
      } else if (result?.trackingNumber) {
        alert(`Rastreo generado. Número: ${result.trackingNumber}`);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="flex items-center gap-1 px-2 py-1 text-[10px] font-black tracking-widest uppercase bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 w-fit"
      title="El rastreo no se creó automáticamente tras el pago. Genera manualmente."
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Package className="h-3 w-3" />}
      {isPending ? "Generando..." : "Generar rastreo"}
    </button>
  );
}
