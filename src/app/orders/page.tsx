"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/data";
import {
  ShoppingBag,
  Truck,
  CheckCircle,
  Clock,
  CaretRight,
  ArrowLeft,
  MapPin,
  XCircle,
  Receipt,
  ArrowsDownUp,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

/* ───────────── status config ─────────────── */
const statusConfig: Record<
  string,
  {
    icon: any;
    color: string;
    label: string;
    bg: string;
    ring: string;
    gradient: string;
  }
> = {
  PENDING: {
    icon: Clock,
    color: "text-amber-600",
    label: "Pendiente",
    bg: "bg-amber-50",
    ring: "ring-amber-200",
    gradient: "from-amber-400 to-orange-400",
  },
  PAID: {
    icon: CheckCircle,
    color: "text-green-600",
    label: "Pagado",
    bg: "bg-green-50",
    ring: "ring-green-200",
    gradient: "from-green-400 to-emerald-500",
  },
  SHIPPED: {
    icon: Truck,
    color: "text-blue-600",
    label: "Enviado",
    bg: "bg-blue-50",
    ring: "ring-blue-200",
    gradient: "from-blue-400 to-indigo-500",
  },
  DELIVERED: {
    icon: MapPin,
    color: "text-[#111111]",
    label: "Entregado",
    bg: "bg-zinc-100",
    ring: "ring-zinc-300",
    gradient: "from-zinc-600 to-zinc-800",
  },
  CANCELLED: {
    icon: XCircle,
    color: "text-red-500",
    label: "Cancelado",
    bg: "bg-red-50",
    ring: "ring-red-200",
    gradient: "from-red-400 to-rose-500",
  },
};

/* ───────────── timeline logic ─────────────── */
const orderStages = ["PENDING", "PAID", "SHIPPED", "DELIVERED"];
function getProgressPercent(status: string) {
  if (status === "CANCELLED") return 0;
  const idx = orderStages.indexOf(status);
  if (idx < 0) return 0;
  return Math.round((idx / (orderStages.length - 1)) * 100);
}

const stageIcons = [
  { icon: Clock, label: "Pendiente" },
  { icon: CheckCircle, label: "Pagado" },
  { icon: Truck, label: "Enviado" },
  { icon: MapPin, label: "Entregado" },
];

/* ───────────── filter options ─────────────── */
const filterOptions = [
  { value: "ALL", label: "Todos" },
  { value: "PENDING", label: "Pendientes" },
  { value: "PAID", label: "Pagados" },
  { value: "SHIPPED", label: "Enviados" },
  { value: "DELIVERED", label: "Entregados" },
  { value: "CANCELLED", label: "Cancelados" },
];

/* ═══════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════ */
export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");
  const [sortNewest, setSortNewest] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        if (data.orders) {
          setOrders(data.orders);
          if (data.orders.length > 0) setExpandedOrder(data.orders[0].id);
        }
      } catch (e) {
        console.error("Failed to fetch orders", e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  /* derived data */
  const filtered = orders
    .filter((o) => filter === "ALL" || o.status === filter)
    .sort((a, b) => {
      const d = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sortNewest ? d : -d;
    });

  const stats = {
    total: orders.length,
    active: orders.filter((o) =>
      ["PENDING", "PAID", "SHIPPED"].includes(o.status)
    ).length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
  };

  /* ───── loading state ───── */
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#111111]/[0.06] rounded-full" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-[#111111] rounded-full animate-spin" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#111111]/30">
          Cargando tu historial...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] relative overflow-hidden">
      {/* ─── bg blobs ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[30%] -right-[15%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-50/40 to-purple-50/20 blur-3xl" />
        <div className="absolute -bottom-[25%] -left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-amber-50/30 to-green-50/20 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-10 md:py-20 max-w-6xl">
        {/* ═══════ Header ═══════ */}
        <div className="mb-10 md:mb-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#111111]/30 hover:text-[#111111] mb-8 transition-colors group"
          >
            <ArrowLeft
              weight="bold"
              className="group-hover:-translate-x-1 transition-transform"
            />{" "}
            Volver a la tienda
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-[#111111] leading-[0.9]"
              >
                MIS{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#111111] to-[#111111]/35">
                  PEDIDOS
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-[#111111]/35 font-medium text-base md:text-lg mt-5 max-w-md"
              >
                Rastrea tus envíos y revisa el historial de tus compras.
              </motion.p>
            </div>

            {/* ── stat pills ── */}
            {orders.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-3"
              >
                {[
                  { label: "Total", value: stats.total, accent: "bg-[#111111]/[0.04]" },
                  { label: "Activos", value: stats.active, accent: "bg-blue-50" },
                  { label: "Entregados", value: stats.delivered, accent: "bg-green-50" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={`${s.accent} border border-[#111111]/[0.04] px-6 py-3 rounded-2xl`}
                  >
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#111111]/25 mb-0.5">
                      {s.label}
                    </div>
                    <div className="text-xl font-black text-[#111111] tracking-tighter">
                      {s.value}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* ═══════ Toolbar ═══════ */}
        {orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
          >
            {/* filters */}
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((opt) => {
                const isActive = filter === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                      isActive
                        ? "bg-[#111111] text-white border-[#111111]"
                        : "bg-white text-[#111111]/40 border-[#111111]/[0.06] hover:border-[#111111]/15 hover:text-[#111111]/60"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* sort */}
            <button
              onClick={() => setSortNewest(!sortNewest)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-[#111111]/[0.06] text-[10px] font-black uppercase tracking-widest text-[#111111]/40 hover:text-[#111111]/60 hover:border-[#111111]/15 transition-all"
            >
              <ArrowsDownUp size={14} />
              {sortNewest ? "Más reciente" : "Más antiguo"}
            </button>
          </motion.div>
        )}

        {/* ═══════ Content ═══════ */}
        <div className="space-y-6">
          {filtered.length === 0 && orders.length > 0 ? (
            /* filtered-empty */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 flex flex-col items-center text-center"
            >
              <MagnifyingGlass
                weight="light"
                size={48}
                className="text-[#111111]/15 mb-6"
              />
              <h3 className="text-lg font-black uppercase tracking-tight mb-2">
                Sin resultados
              </h3>
              <p className="text-sm text-[#111111]/35 font-medium">
                No hay pedidos con el filtro seleccionado.
              </p>
            </motion.div>
          ) : filtered.length === 0 ? (
            /* no orders at all */
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-28 md:py-36 flex flex-col items-center text-center"
            >
              <div className="w-28 h-28 bg-gradient-to-br from-[#111111]/[0.03] to-[#111111]/[0.07] rounded-[3rem] flex items-center justify-center mb-8">
                <ShoppingBag
                  weight="light"
                  size={56}
                  className="text-[#111111]/15"
                />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-3">
                Aún no tienes pedidos
              </h3>
              <p className="text-sm text-[#111111]/35 font-medium max-w-xs mb-10">
                Explora nuestra colección y estrena el jersey de tus sueños hoy
                mismo.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#111111] text-white h-14 px-14 uppercase font-black tracking-widest text-[10px] hover:bg-[#222] shadow-xl shadow-black/10 transition-all duration-300 group"
              >
                Empezar a comprar
                <ArrowLeft
                  weight="bold"
                  size={14}
                  className="rotate-180 group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((order, idx) => {
                const config = statusConfig[order.status] || statusConfig.PENDING;
                const isExpanded = expandedOrder === order.id;
                const progress = getProgressPercent(order.status);
                const stageIdx = orderStages.indexOf(order.status);

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: idx * 0.06, layout: { duration: 0.35 } }}
                    className="group bg-white rounded-[2rem] md:rounded-[2.5rem] border border-[#111111]/[0.05] overflow-hidden hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] transition-all duration-700"
                  >
                    {/* ─── card header (always visible, clickable) ─── */}
                    <button
                      onClick={() =>
                        setExpandedOrder(isExpanded ? null : order.id)
                      }
                      className="w-full text-left px-6 sm:px-8 md:px-12 py-7 md:py-9 flex flex-col md:flex-row md:items-center justify-between gap-5 cursor-pointer group/header"
                    >
                      <div className="flex items-center gap-5 min-w-0">
                        {/* ─ status dot ─ */}
                        <div
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shrink-0 shadow-lg shadow-black/[0.06]`}
                        >
                          <config.icon
                            weight="fill"
                            size={22}
                            className="text-white"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm md:text-base font-black text-[#111111] tracking-tight">
                              {order.orderNumber}
                            </span>
                            <div
                              className={`${config.bg} ${config.color} px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest`}
                            >
                              {config.label}
                            </div>
                          </div>
                          <p className="text-xs text-[#111111]/30 font-medium mt-1">
                            {new Date(order.createdAt).toLocaleDateString(
                              "es-MX",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }
                            )}
                            {" · "}
                            {order.items.length}{" "}
                            {order.items.length === 1 ? "artículo" : "artículos"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-[9px] font-black uppercase tracking-widest text-[#111111]/20 mb-0.5">
                            Total
                          </div>
                          <div className="text-xl md:text-2xl font-black text-[#111111] tracking-tighter">
                            {formatPrice(Number(order.total))}
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.25 }}
                          className="text-[#111111]/15 group-hover/header:text-[#111111]/35 transition-colors hidden md:block"
                        >
                          <CaretRight weight="bold" size={20} />
                        </motion.div>
                      </div>
                    </button>

                    {/* ─── expanded detail ─── */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: [0.25, 0.1, 0, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-[#111111]/[0.04]">
                            {/* ── timeline ── */}
                            {order.status !== "CANCELLED" && (
                              <div className="px-6 sm:px-8 md:px-12 py-8 md:py-10 bg-[#FAFAFA]/60 border-b border-[#111111]/[0.04]">
                                <div className="flex items-center justify-between relative max-w-xl mx-auto">
                                  {/* track bg */}
                                  <div className="absolute top-5 left-[8%] right-[8%] h-[3px] bg-[#111111]/[0.05] rounded-full" />
                                  {/* track fill */}
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress * 0.84}%` }}
                                    transition={{
                                      duration: 1.2,
                                      ease: "easeOut",
                                      delay: 0.2,
                                    }}
                                    className={`absolute top-5 left-[8%] h-[3px] bg-gradient-to-r ${config.gradient} rounded-full`}
                                  />

                                  {stageIcons.map((stage, i) => {
                                    const reached = i <= stageIdx;
                                    const current = i === stageIdx;
                                    return (
                                      <div
                                        key={i}
                                        className="flex flex-col items-center gap-2.5 z-10 w-1/4"
                                      >
                                        <div
                                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                                            current
                                              ? `bg-gradient-to-br ${config.gradient} text-white shadow-lg shadow-black/10 scale-110`
                                              : reached
                                              ? `bg-gradient-to-br ${config.gradient} text-white/80`
                                              : "bg-white border-2 border-[#111111]/[0.08] text-[#111111]/20"
                                          }`}
                                        >
                                          <stage.icon weight="fill" size={17} />
                                        </div>
                                        <span
                                          className={`text-[9px] font-black uppercase tracking-wider ${
                                            reached
                                              ? "text-[#111111]/70"
                                              : "text-[#111111]/20"
                                          }`}
                                        >
                                          {stage.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* ── items ── */}
                            <div className="px-6 sm:px-8 md:px-12 py-8">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#111111]/25 mb-6">
                                Artículos del pedido
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {order.items.map((item: any) => (
                                  <div
                                    key={item.id}
                                    className="flex gap-4 items-center p-3 rounded-2xl hover:bg-[#111111]/[0.015] transition-colors group/item"
                                  >
                                    <div className="relative w-[68px] h-[68px] rounded-xl overflow-hidden bg-[#F3F3F3] border border-[#111111]/[0.04] shrink-0 group-hover/item:shadow-md transition-shadow duration-500">
                                      <Image
                                        src={item.variant.product.images[0]}
                                        alt={item.variant.product.name}
                                        fill
                                        className="object-cover group-hover/item:scale-105 transition-transform duration-700"
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h5 className="font-bold text-[13px] text-[#111111] leading-tight truncate">
                                        {item.variant.product.name}
                                      </h5>
                                      <div className="flex items-center gap-2.5 mt-1.5">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-[#111111]/30 bg-[#111111]/[0.04] px-2 py-0.5 rounded-full">
                                          Talla {item.variant.size}
                                        </span>
                                        <span className="text-[9px] font-bold text-[#111111]/20">
                                          ×{item.quantity}
                                        </span>
                                      </div>
                                      <p className="text-xs font-black text-[#111111] mt-1.5 tracking-tight">
                                        {formatPrice(Number(item.price))}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* ── totals row ── */}
                            <div className="px-6 sm:px-8 md:px-12 py-6 bg-[#FAFAFA]/60 border-t border-[#111111]/[0.04] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-2 text-[#111111]/20">
                                <Receipt weight="duotone" size={16} />
                                <span className="text-[10px] font-bold">
                                  Pagado vía Stripe
                                </span>
                              </div>

                              <div className="flex items-center gap-8">
                                <div className="text-right">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-[#111111]/20 mr-3">
                                    Subtotal
                                  </span>
                                  <span className="text-sm font-bold text-[#111111]/50">
                                    {formatPrice(Number(order.subtotal))}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-[#111111]/20 mr-3">
                                    Envío
                                  </span>
                                  <span className="text-sm font-bold text-[#111111]/50">
                                    {formatPrice(Number(order.shipping))}
                                  </span>
                                </div>
                                <div className="text-right border-l border-[#111111]/[0.06] pl-8">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-[#111111]/30 mr-3">
                                    Total
                                  </span>
                                  <span className="text-lg font-black text-[#111111] tracking-tighter">
                                    {formatPrice(Number(order.total))}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
