"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/data";
import { ShoppingBag, Package, Truck, CheckCircle, Clock, CaretRight, ArrowLeft } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const statusConfig: Record<string, { icon: any, color: string, label: string, bg: string }> = {
  PENDING: { icon: Clock, color: "text-amber-500", label: "Pendiente", bg: "bg-amber-50" },
  PAID: { icon: CheckCircle, color: "text-green-600", label: "Pagado", bg: "bg-green-50" },
  SHIPPED: { icon: Truck, color: "text-blue-600", label: "Enviado", bg: "bg-blue-50" },
  DELIVERED: { icon: CheckCircle, color: "text-[#111111]", label: "Entregado", bg: "bg-zinc-100" },
  CANCELLED: { icon: Clock, color: "text-red-500", label: "Cancelado", bg: "bg-red-50" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        if (data.orders) {
          setOrders(data.orders);
        }
      } catch (e) {
        console.error("Failed to fetch orders", e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#111111]/10 border-t-[#111111] rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#111111]/40">Cargando tu historial...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-20 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#111111]/40 hover:text-[#111111] mb-8 transition-colors">
            <ArrowLeft weight="bold" /> Volver a la tienda
          </Link>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-[#111111] leading-none">
            MIS <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#111111] to-[#111111]/40">PEDIDOS</span>
          </h1>
          <p className="text-[#111111]/40 font-medium text-lg mt-6 max-w-md">
            Rastrea tus envíos y revisa el historial de tus compras premium.
          </p>
        </div>
        
        <div className="bg-white border border-[#111111]/5 px-8 py-4 rounded-[2rem] shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-widest text-[#111111]/30 mb-1">Total de órdenes</div>
          <div className="text-3xl font-black text-[#111111]">{orders.length}</div>
        </div>
      </div>

      <div className="space-y-12">
        {orders.length === 0 ? (
          <div className="py-32 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-[#111111]/5 rounded-[2.5rem] flex items-center justify-center mb-8">
              <ShoppingBag weight="light" size={48} className="text-[#111111]/20" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-4">Aún no tienes pedidos</h3>
            <p className="text-sm text-[#111111]/40 font-medium max-w-xs mb-8">
              Explora nuestra colección y estrena el jersey de tus sueños hoy mismo.
            </p>
            <Button asChild className="rounded-full bg-[#111111] h-14 px-12 uppercase font-black tracking-widest text-[10px]">
              <Link href="/">Empezar a comprar</Link>
            </Button>
          </div>
        ) : (
          <AnimatePresence>
            {orders.map((order, idx) => {
              const config = statusConfig[order.status] || statusConfig.PENDING;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group bg-white rounded-[2.5rem] border border-[#111111]/5 overflow-hidden hover:shadow-[0_48px_80px_-24px_rgba(0,0,0,0.08)] transition-all duration-700"
                >
                  <div className="p-8 md:p-12">
                    {/* Order Header */}
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-12">
                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#111111]/40">Pedido {order.orderNumber}</span>
                          <div className={`${config.bg} ${config.color} px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2`}>
                            <config.icon weight="fill" size={14} />
                            {config.label}
                          </div>
                        </div>
                        <p className="text-sm font-bold text-[#111111]/40">
                          {new Date(order.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      
                      <div className="text-left md:text-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#111111]/30 mb-1">Monto Total</div>
                        <div className="text-3xl font-black text-[#111111] tracking-tighter">
                          {formatPrice(Number(order.total))}
                        </div>
                      </div>
                    </div>

                    {/* Order Status Progress */}
                    <div className="mb-12 relative">
                      <div className="h-1 w-full bg-[#111111]/5 rounded-full" />
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: order.status === 'PAID' ? '25%' : order.status === 'SHIPPED' ? '65%' : order.status === 'DELIVERED' ? '100%' : '5%' }}
                        className="absolute top-0 h-1 bg-[#111111] rounded-full"
                      />
                    </div>

                    {/* Order Items */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="flex gap-5 items-center">
                          <div className="relative w-20 aspect-square rounded-2xl overflow-hidden bg-[#F3F3F3] border border-[#111111]/5 shrink-0">
                            <Image 
                              src={item.variant.product.images[0]} 
                              alt={item.variant.product.name} 
                              fill 
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-[#111111] leading-tight truncate">
                              {item.variant.product.name}
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[9px] font-black uppercase tracking-widest text-[#111111]/40">Talla {item.variant.size}</span>
                              <span className="text-[9px] font-bold text-[#111111]/20">x{item.quantity}</span>
                            </div>
                            <p className="text-xs font-black text-[#111111] mt-1">{formatPrice(Number(item.price))}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer Action */}
                    <div className="mt-12 flex justify-end pt-8 border-t border-[#111111]/5">
                      <Button variant="ghost" className="rounded-full flex gap-3 text-[10px] font-black uppercase tracking-widest text-[#111111]/40 hover:text-[#111111] hover:bg-[#111111]/5 py-6 px-10 h-auto self-end">
                        Ver detalles de orden
                        <CaretRight weight="bold" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
