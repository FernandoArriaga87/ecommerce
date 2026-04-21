import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/data";
import { StatusSelector } from "./status-selector";
import { RefundButton } from "./refund-button";
import { BulkSelectionProvider } from "@/components/admin/bulk/bulk-provider";
import { BulkCheckbox, BulkHeaderCheckbox } from "@/components/admin/bulk/bulk-checkbox";
import { BulkActionsBar } from "@/components/admin/bulk/bulk-actions-bar";
import { OrderBulkActions } from "@/components/admin/bulk/order-bulk-actions";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      items: true
    }
  });

  const eligibleIds = orders
    .filter((o) => o.status === "PAID" || o.status === "SHIPPED")
    .map((o) => o.id);

  return (
    <BulkSelectionProvider>
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight">Registro de Pedidos</h1>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Control de envíos y pagos</p>
          </div>
        </div>

        <BulkActionsBar label="pedido(s) seleccionado(s)">
          <OrderBulkActions />
        </BulkActionsBar>

        <div className="bg-white border border-gray-200 overflow-x-auto shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 border-b border-gray-200 text-[10px] text-gray-400 uppercase tracking-widest font-black">
              <tr>
                <th className="px-4 py-4 w-10">
                  <BulkHeaderCheckbox ids={eligibleIds} />
                </th>
                <th className="px-6 py-4">Referencia</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Artículos</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Estado (Actualizar)</th>
                <th className="px-6 py-4">Reembolso</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest">
                    No hay pedidos en el sistema
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const selectable = order.status === "PAID" || order.status === "SHIPPED";
                  return (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-4 w-10">
                        {selectable ? (
                          <BulkCheckbox id={order.id} label={`Seleccionar ${order.orderNumber}`} />
                        ) : (
                          <span className="inline-block h-4 w-4" aria-hidden />
                        )}
                      </td>
                      <td className="px-6 py-4 font-black uppercase text-xs">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-gray-700">{order.user.name}</div>
                        <div className="text-[10px] text-gray-500">{order.user.email}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-600">
                        {order.items.reduce((acc, item) => acc + item.quantity, 0)} items
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-black text-xs">{formatPrice(Number(order.total))}</div>
                        <div className="text-[9px] font-bold tracking-widest text-gray-400 uppercase">{order.paymentMethod}</div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusSelector orderId={order.id} currentStatus={order.status} />
                      </td>
                      <td className="px-6 py-4">
                        <RefundButton
                          orderId={order.id}
                          orderNumber={order.orderNumber}
                          status={order.status}
                          total={formatPrice(Number(order.total))}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </BulkSelectionProvider>
  );
}
