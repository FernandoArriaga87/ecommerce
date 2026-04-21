"use client";

import { useState, useTransition } from "react";
import { markManualShippedAction, updateOrderStatusAction } from "@/app/actions/admin";
import { Check, Loader2, Send } from "lucide-react";

/**
 * UI para órdenes con envío gratis (subtotal >= $1499) que NO son entrega
 * personal. El admin genera el rastreo con la paquetería manualmente y captura
 * aquí el tracking para que el cliente reciba el correo con los datos.
 */
export function ManualShippingActions({
  orderId,
  orderNumber,
  status,
  currentCarrier,
  currentTrackingNumber,
  shippedEmailSent,
}: {
  orderId: string;
  orderNumber: string;
  status: string;
  currentCarrier: string | null;
  currentTrackingNumber: string | null;
  shippedEmailSent: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [carrier, setCarrier] = useState(currentCarrier || "");
  const [trackingNumber, setTrackingNumber] = useState(currentTrackingNumber || "");

  if (status === "DELIVERED" || status === "CANCELLED" || status === "DISPUTED") {
    return (
      <span className="text-[9px] font-bold tracking-widest uppercase text-gray-400">
        Sin acciones
      </span>
    );
  }

  const submit = () => {
    if (!carrier.trim() || !trackingNumber.trim()) {
      alert("Captura paquetería y número de rastreo.");
      return;
    }
    const action = shippedEmailSent
      ? "¿Actualizar los datos de rastreo? (no se reenvía el correo)"
      : `¿Marcar ${orderNumber} como enviada y notificar al cliente con el número de rastreo?`;
    if (!confirm(action)) return;

    startTransition(async () => {
      const result = await markManualShippedAction({
        orderId,
        carrier: carrier.trim(),
        trackingNumber: trackingNumber.trim(),
      });
      if (result?.error) alert(result.error);
    });
  };

  const markDelivered = () => {
    if (!confirm(`¿Marcar ${orderNumber} como entregada?`)) return;
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, "DELIVERED");
      if (result?.error) alert(result.error);
    });
  };

  return (
    <div className="flex flex-col gap-2 p-2 border border-amber-300 bg-amber-50/50 w-full max-w-[260px]">
      <span className="text-[9px] font-black tracking-widest uppercase text-amber-700">
        Envío gratis · Manual
      </span>

      <input
        value={carrier}
        onChange={(e) => setCarrier(e.target.value)}
        placeholder="Paquetería (Estafeta, DHL...)"
        className="h-8 rounded-none border border-gray-300 px-2 text-[11px] font-medium focus:outline-none focus:border-black"
      />
      <input
        value={trackingNumber}
        onChange={(e) => setTrackingNumber(e.target.value)}
        placeholder="N° de rastreo"
        className="h-8 rounded-none border border-gray-300 px-2 text-[11px] font-medium focus:outline-none focus:border-black"
      />

      <button
        type="button"
        disabled={isPending}
        onClick={submit}
        className="flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-black tracking-widest uppercase bg-black text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Send className="h-3 w-3" />
        )}
        {shippedEmailSent
          ? "Actualizar tracking"
          : status === "SHIPPED"
          ? "Reintentar correo"
          : "Enviar y notificar"}
      </button>

      {shippedEmailSent && (
        <span className="text-[9px] font-bold tracking-widest uppercase text-green-700">
          ✓ Correo enviado
        </span>
      )}

      {(status === "PAID" || status === "SHIPPED") && shippedEmailSent && (
        <button
          type="button"
          disabled={isPending}
          onClick={markDelivered}
          className="flex items-center justify-center gap-1 px-2 py-1 text-[10px] font-black tracking-widest uppercase bg-green-700 text-white hover:bg-green-800 disabled:opacity-50"
        >
          <Check className="h-3 w-3" /> Entregada
        </button>
      )}
    </div>
  );
}
