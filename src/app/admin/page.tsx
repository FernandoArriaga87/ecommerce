import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/data";

export default async function AdminDashboardPage() {
  // Fetch real data from Prisma
  const [userCount, orderCount, totalSales, recentOrders] = await Promise.all([
    prisma.user.count(),
    prisma.order.count({ where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] as any } } }),
    prisma.order.aggregate({
      where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] as any } },
      _sum: { total: true }
    }),

    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } }
      }
    })
  ]);

  const salesAmount = Number(totalSales?._sum?.total || 0);

  return (
    <div className="w-full">
      <h1 className="text-4xl font-black uppercase tracking-tight mb-8">DASHBOARD GENERAL</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Real Stat Cards */}
        <div className="bg-white border border-gray-200 p-6 rounded-none shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Ventas Históricas</p>
          <p className="text-3xl font-black">{formatPrice(salesAmount)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-6 rounded-none shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Órdenes Pagadas</p>
          <p className="text-3xl font-black">{orderCount}</p>
        </div>
        <div className="bg-white border border-gray-200 p-6 rounded-none shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Usuarios Activos</p>
          <p className="text-3xl font-black">{userCount}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 p-8 rounded-none">
        <h2 className="text-xl font-black uppercase tracking-tight mb-6 flex justify-between items-center">
          ÚLTIMOS PEDIDOS 
          <span className="bg-black text-white text-[10px] px-2 py-1 tracking-widest">REAL-TIME</span>
        </h2>
        
        {recentOrders.length === 0 ? (
          <div className="text-sm font-medium text-gray-400 p-8 text-center border-2 border-dashed border-gray-200">
            No hay órdenes recientes.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex justify-between items-center border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <div className="flex flex-col">
                  <span className="font-bold text-sm">{order.orderNumber}</span>
                  <span className="text-xs text-gray-500">{order.user.name} ({order.user.email})</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-black">{formatPrice(Number(order.total))}</span>
                  <span className="text-[10px] font-bold tracking-widest uppercase bg-zinc-100 px-2 py-1 mt-1">
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
