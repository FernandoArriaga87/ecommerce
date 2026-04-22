import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/data";
import { 
  CurrencyCircleDollar, 
  Package, 
  Users, 
  WarningCircle, 
  Clock, 
  TrendUp,
  TShirt
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default async function AdminDashboardPage() {
  // Fetch real data from Prisma in parallel for performance
  const [
    userCount, 
    orderCount, 
    totalSales, 
    recentOrders,
    productCount,
    lowStockVariants
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count({ where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] as any } } }),
    prisma.order.aggregate({
      where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] as any } },
      _sum: { total: true }
    }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        items: true
      }
    }),
    prisma.product.count({ where: { isActive: true, isDeleted: false } }),
    prisma.variant.findMany({
      where: { stock: { lt: 5 }, product: { isDeleted: false } }, // Alertas de inventario menor a 5 unidades
      take: 5,
      include: { product: { select: { name: true, images: true } } },
      orderBy: { stock: 'asc' }
    })
  ]);

  const salesAmount = Number(totalSales?._sum?.total || 0);

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-[#111111] leading-none mb-2">
            Panel <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#111111] to-[#111111]/40">General</span>
          </h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
            Control central de AuraSport
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-green-600 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Sistemas Online
        </div>
      </div>
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 bg-green-50 text-green-500 p-6 rounded-full opacity-50 group-hover:scale-110 transition-transform">
            <CurrencyCircleDollar weight="fill" size={48} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 relative z-10">Ingresos Totales</p>
          <p className="text-3xl font-black tracking-tighter text-[#111111] relative z-10">{formatPrice(salesAmount)}</p>
        </div>

        <div className="bg-white border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 bg-blue-50 text-blue-500 p-6 rounded-full opacity-50 group-hover:scale-110 transition-transform">
            <Package weight="fill" size={48} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 relative z-10">Pedidos Exitosos</p>
          <p className="text-3xl font-black tracking-tighter text-[#111111] relative z-10">{orderCount}</p>
        </div>

        <div className="bg-white border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 bg-orange-50 text-amber-500 p-6 rounded-full opacity-50 group-hover:scale-110 transition-transform">
            <TShirt weight="fill" size={48} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 relative z-10">Productos Activos</p>
          <p className="text-3xl font-black tracking-tighter text-[#111111] relative z-10">{productCount}</p>
        </div>

        <div className="bg-white border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 bg-purple-50 text-purple-500 p-6 rounded-full opacity-50 group-hover:scale-110 transition-transform">
            <Users weight="fill" size={48} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 relative z-10">Clientes Registrados</p>
          <p className="text-3xl font-black tracking-tighter text-[#111111] relative z-10">{userCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white border border-gray-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-zinc-50/50">
            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Clock weight="bold" className="text-gray-400" />
              Últimos Pedidos
            </h2>
            <Link href="/admin/payments" className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors">
              Ver Todos &rarr;
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-white text-[9px] uppercase tracking-widest text-gray-400">
                  <th className="px-6 py-4 font-bold">Ref. Pedido</th>
                  <th className="px-6 py-4 font-bold">Cliente</th>
                  <th className="px-6 py-4 font-bold">Monto</th>
                  <th className="px-6 py-4 font-bold text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                      No hay pedidos recientes
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-xs font-black text-[#111111]">{order.orderNumber}</span>
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                          {order.items.reduce((acc, item) => acc + item.quantity, 0)} artículos
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-gray-700">{order.user.name}</div>
                        <div className="text-[10px] text-gray-500">{order.user.email}</div>
                      </td>
                      <td className="px-6 py-4 font-black text-xs text-[#111111]">
                        {formatPrice(Number(order.total))}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${
                          order.status === 'PAID' ? 'bg-green-100 text-green-700' :
                          order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-gray-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center gap-2 bg-red-50/30">
            <WarningCircle weight="fill" className="text-red-500" size={20} />
            <h2 className="text-sm font-black uppercase tracking-widest text-red-600">
              Alertas de Inventario
            </h2>
          </div>
          
          <div className="p-6 flex-1">
            {lowStockVariants.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 gap-3">
                <TrendUp weight="light" size={40} className="text-green-500 opacity-50" />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  Inventario Saludable.<br/>No hay escasez detectada.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {lowStockVariants.map((variant) => (
                  <div key={variant.id} className="flex items-center gap-4">
                    <div className="w-12 h-14 bg-zinc-100 border border-gray-200 shrink-0 relative overflow-hidden">
                      {/* Assuming first image exists, fallback to gray box */}
                      {variant.product.images[0] ? (
                        <img src={variant.product.images[0]} alt="" className="object-cover w-full h-full" />
                      ) : (
                        <TShirt className="absolute inset-0 m-auto text-gray-300" size={24} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black uppercase truncate text-[#111111]" title={variant.product.name}>
                        {variant.product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 bg-gray-100 px-2 py-0.5">
                          {variant.size}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-xl font-black leading-none ${variant.stock === 0 ? 'text-red-600' : 'text-orange-500'}`}>
                        {variant.stock}
                      </div>
                      <div className="text-[8px] font-black uppercase tracking-widest text-gray-400 mt-1">
                        Unidades
                      </div>
                    </div>
                  </div>
                ))}
                
                <Link href="/admin/products" className="mt-4 block text-center text-[10px] font-bold uppercase tracking-widest text-[#111111] hover:text-blue-600 border border-gray-200 py-3 transition-colors hover:bg-gray-50">
                  Gestionar Inventario &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
