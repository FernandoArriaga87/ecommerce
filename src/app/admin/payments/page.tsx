import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/data";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      items: true
    }
  });

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight">Registro de Pedidos</h1>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Control de envíos y pagos</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 overflow-x-auto rounded-none">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 border-b border-gray-200 text-xs text-gray-600 uppercase tracking-widest font-bold">
            <tr>
              <th className="px-6 py-4">Referencia</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Artículos</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest">
                  No hay pedidos en el sistema
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-bold uppercase text-xs">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                    {order.user.name} <br/> <span className="text-[10px] text-gray-400">{order.user.email}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold">
                    {order.items.reduce((acc, item) => acc + item.quantity, 0)} items
                  </td>
                  <td className="px-6 py-4 font-black text-xs">
                    {formatPrice(Number(order.total))} <br/>
                    <span className="text-[10px] font-normal tracking-widest text-gray-400">{order.paymentMethod}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-zinc-100 border border-gray-200 text-black text-[10px] px-2 py-1 font-bold tracking-widest">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[10px] font-bold tracking-widest uppercase border-b-2 border-black hover:text-gray-500 hover:border-gray-500 transition-colors">
                      Gestionar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
