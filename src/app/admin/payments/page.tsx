import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/data";
import { StatusSelector } from "./status-selector";
import { RefundButton } from "./refund-button";
import { PersonalDeliveryActions } from "./personal-delivery-actions";
import { GenerateShipmentButton } from "./generate-shipment-button";
import { ManualShippingActions } from "./manual-shipping-actions";
import { BulkSelectionProvider } from "@/components/admin/bulk/bulk-provider";
import { BulkCheckbox, BulkHeaderCheckbox } from "@/components/admin/bulk/bulk-checkbox";
import { BulkActionsBar } from "@/components/admin/bulk/bulk-actions-bar";
import { OrderBulkActions } from "@/components/admin/bulk/order-bulk-actions";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      items: true,
      address: true
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
          <a
            href="/api/admin/export/orders"
            className="inline-flex items-center h-12 px-6 bg-black text-white hover:bg-gray-800 uppercase font-black tracking-widest text-xs transition-colors"
          >
            Exportar CSV
          </a>
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
                <th className="px-6 py-4">Destino</th>
                <th className="px-6 py-4">Artículos</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Estado (Actualizar)</th>
                <th className="px-6 py-4">Reembolso</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest">
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
                      <td className="px-6 py-4 max-w-[200px]">
                        <div className="text-xs font-medium text-gray-700 break-words">
                          {order.address?.address}, {order.address?.city}, {order.address?.state} {order.address?.zipCode}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold">
                          {order.isPersonalDelivery ? 'Entrega Personal' : (order.carrier || 'Envío')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-600">
                        {order.items.reduce((acc, item) => acc + item.quantity, 0)} items
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-black text-xs">{formatPrice(Number(order.total))}</div>
                        <div className="text-[9px] font-bold tracking-widest text-gray-400 uppercase">{order.paymentMethod}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <StatusSelector orderId={order.id} currentStatus={order.status} />

                          {/* NL personal delivery: admin handles in person, no tracking. */}
                          {order.isPersonalDelivery && (
                            <PersonalDeliveryActions
                              orderId={order.id}
                              orderNumber={order.orderNumber}
                              status={order.status}
                            />
                          )}

                          {/* Free shipping (non-NL): admin generates guide externally,
                              captures tracking here and triggers the email. */}
                          {!order.isPersonalDelivery && order.isFreeShipping && (
                            <ManualShippingActions
                              orderId={order.id}
                              orderNumber={order.orderNumber}
                              status={order.status}
                              currentCarrier={order.carrier}
                              currentTrackingNumber={order.trackingNumber}
                              shippedEmailSent={!!order.shippedEmailSentAt}
                            />
                          )}

                          {/* Paid shipping via Skydropx: show saved tracking + retry button
                              if label never got created. */}
                          {!order.isPersonalDelivery && !order.isFreeShipping && order.trackingNumber && (
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold tracking-widest uppercase text-gray-400">
                                {order.carrier || "Paquetería"}
                              </span>
                              {order.trackingUrl ? (
                                <a
                                  href={order.trackingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold text-blue-600 hover:underline truncate max-w-[160px]"
                                >
                                  {order.trackingNumber}
                                </a>
                              ) : (
                                <span className="text-[10px] font-bold text-gray-700 truncate max-w-[160px]">
                                  {order.trackingNumber}
                                </span>
                              )}
                            </div>
                          )}
                          {!order.isPersonalDelivery &&
                            !order.isFreeShipping &&
                            order.skydropxRateId &&
                            !order.skydropxShipmentId &&
                            order.status === "PAID" && (
                              <GenerateShipmentButton
                                orderId={order.id}
                                orderNumber={order.orderNumber}
                              />
                            )}
                        </div>
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
