"use client";

import { useTransition } from "react";
import { updateOrderStatusAction } from "@/app/actions/admin";

export function StatusSelector({ 
  orderId, 
  currentStatus 
}: { 
  orderId: string, 
  currentStatus: string 
}) {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as any;
    startTransition(async () => {
      await updateOrderStatusAction(orderId, newStatus);
    });
  };

  return (
    <select
      disabled={isPending}
      value={currentStatus}
      onChange={handleStatusChange}
      className={`text-[10px] font-bold tracking-widest uppercase border px-2 py-1 outline-none focus:border-black cursor-pointer transition-colors
        ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
        ${currentStatus === 'PAID' ? 'bg-green-100 text-green-800 border-green-200' : ''}
        ${currentStatus === 'PENDING' ? 'bg-amber-100 text-amber-800 border-amber-200' : ''}
        ${currentStatus === 'SHIPPED' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
        ${currentStatus === 'DELIVERED' ? 'bg-zinc-800 text-white border-zinc-800' : ''}
        ${currentStatus === 'CANCELLED' ? 'bg-red-100 text-red-800 border-red-200' : ''}
      `}
    >
      <option value="PENDING">Pendiente</option>
      <option value="PAID">Pagado</option>
      <option value="SHIPPED">Enviado</option>
      <option value="DELIVERED">Entregado</option>
      <option value="CANCELLED">Cancelado</option>
    </select>
  );
}
