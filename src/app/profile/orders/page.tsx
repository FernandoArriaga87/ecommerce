import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatPrice } from "@/lib/data";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="w-full">
      <h1 className="text-3xl font-black uppercase tracking-tight mb-8 border-b-2 border-gray-100 pb-4">
        Mis Pedidos
      </h1>

      {orders.length === 0 ? (
        <div className="bg-zinc-50 border border-gray-200 p-8 text-center">
          <p className="text-gray-500 font-medium tracking-wide uppercase text-sm">
            Aún no has realizado ninguna compra.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-zinc-50 border border-gray-200 p-6 flex flex-col md:flex-row gap-6 justify-between md:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                  Pedido Nº
                </p>
                <p className="text-lg font-black uppercase tracking-tight">
                  {order.orderNumber}
                </p>
                <p className="text-sm font-medium text-gray-500 mt-2">
                  {new Date(order.createdAt).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              
              <div className="flex flex-col gap-2">
                <span className="inline-block px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest w-fit">
                  {order.status === "PENDING" ? "Pendiente" : 
                   order.status === "CONFIRMED" ? "Confirmado" : 
                   order.status === "PROCESSING" ? "Procesando" : 
                   order.status === "SHIPPED" ? "Enviado" : 
                   order.status === "DELIVERED" ? "Entregado" : "Cancelado"}
                </span>
                <p className="font-black text-lg">
                  {formatPrice(Number(order.total))}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
