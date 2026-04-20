"use client";

import { useState, useTransition } from "react";
import { refundOrderAction } from "@/app/actions/admin";

type Reason = "requested_by_customer" | "duplicate" | "fraudulent";

const REASON_LABELS: Record<Reason, string> = {
  requested_by_customer: "Solicitado por el cliente",
  duplicate: "Cargo duplicado",
  fraudulent: "Fraudulento",
};

const REFUNDABLE = ["PAID", "SHIPPED", "DELIVERED", "DISPUTED"] as const;
type RefundableStatus = (typeof REFUNDABLE)[number];

export function RefundButton({
  orderId,
  orderNumber,
  status,
  total,
}: {
  orderId: string;
  orderNumber: string;
  status: string;
  total: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason>("requested_by_customer");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canRefund = (REFUNDABLE as readonly string[]).includes(status);

  if (!canRefund) {
    return (
      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-300">
        —
      </span>
    );
  }

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const res = await refundOrderAction(orderId, reason);
      if (res?.error) {
        setError(res.error);
      } else {
        setOpen(false);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[10px] font-black uppercase tracking-widest border border-red-200 text-red-700 hover:bg-red-50 px-3 py-1.5 transition-colors"
      >
        Reembolsar
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="refund-title"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
          onClick={() => !isPending && setOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md p-8 border border-gray-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="refund-title"
              className="text-xl font-black uppercase tracking-tight mb-2"
            >
              Confirmar reembolso
            </h2>
            <p className="text-xs text-gray-600 mb-6">
              Reembolso total de <strong>{total}</strong> para el pedido{" "}
              <strong>{orderNumber}</strong>. Esta acción es irreversible.
            </p>

            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
              Motivo
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as Reason)}
              disabled={isPending}
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black mb-4"
            >
              {(Object.keys(REASON_LABELS) as Reason[]).map((key) => (
                <option key={key} value={key}>
                  {REASON_LABELS[key]}
                </option>
              ))}
            </select>

            {error && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="text-[10px] font-bold uppercase tracking-widest border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="text-[10px] font-bold uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 px-4 py-2 transition-colors disabled:opacity-50"
              >
                {isPending ? "Procesando..." : "Reembolsar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
