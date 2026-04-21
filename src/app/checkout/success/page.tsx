"use client";

import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle,
  ShoppingBag,
  ArrowRight,
  Package,
  Truck,
  MapPin,
  CreditCard,
  Receipt,
  Confetti,
  ShieldCheck,
} from "@phosphor-icons/react";
import { useCart } from "@/lib/cart-context";
import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { formatPrice } from "@/lib/data";
import { track } from "@vercel/analytics";

/* ───────────────  confetti canvas  ─────────────── */
function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = [
      "#111111",
      "#22C55E",
      "#3B82F6",
      "#F59E0B",
      "#EF4444",
      "#A855F7",
      "#EC4899",
    ];

    interface Particle {
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
      vx: number;
      vy: number;
      rot: number;
      rotSpeed: number;
      opacity: number;
    }

    const particles: Particle[] = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * -1 - 20,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 3 + 2,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.15,
      opacity: 1,
    }));

    let frame: number;
    let elapsed = 0;
    const maxDuration = 180; // frames

    const draw = () => {
      elapsed++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.rot += p.rotSpeed;
        if (elapsed > maxDuration - 60) {
          p.opacity = Math.max(0, p.opacity - 0.02);
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (elapsed < maxDuration) {
        frame = requestAnimationFrame(draw);
      }
    };

    frame = requestAnimationFrame(draw);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
}

/* ───────────────  order timeline steps  ─────────────── */
const timelineSteps = [
  {
    key: "confirmed",
    icon: CheckCircle,
    label: "Confirmado",
    description: "Pago recibido",
  },
  {
    key: "preparing",
    icon: Package,
    label: "Preparando",
    description: "Empacando tu pedido",
  },
  {
    key: "shipped",
    icon: Truck,
    label: "Enviado",
    description: "En camino",
  },
  {
    key: "delivered",
    icon: MapPin,
    label: "Entregado",
    description: "¡Disfrútalo!",
  },
];

function getTimelineIndex(status: string): 0 | 1 | 2 | 3 {
  switch (status) {
    case "PAID":
      return 1;
    case "SHIPPED":
      return 2;
    case "DELIVERED":
      return 3;
    default:
      return 0;
  }
}

/* ───────────────  main component pulled out for Suspense  ─────────────── */
function SuccessContent() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(!!orderId);
  const [showConfetti, setShowConfetti] = useState(true);

  const clearCartOnce = useRef(false);
  const stableClearCart = useCallback(clearCart, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!clearCartOnce.current) {
      stableClearCart();
      clearCartOnce.current = true;
    }
  }, [stableClearCart]);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (data.order) {
          setOrder(data.order);
          // Dedupe by orderId so a reload doesn't double-count revenue.
          const key = `purchase_tracked_${data.order.id}`;
          if (typeof window !== "undefined" && !sessionStorage.getItem(key)) {
            track("purchase_completed", {
              orderId: data.order.id,
              orderNumber: data.order.orderNumber,
              total: Number(data.order.total),
              itemCount: data.order.items.reduce(
                (acc: number, it: any) => acc + it.quantity,
                0
              ),
            });
            sessionStorage.setItem(key, "1");
          }
        }
      } catch {
        /* silently fail — page still works without order data */
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const activeStep = order ? getTimelineIndex(order.status) : 0;

  return (
    <>
      {/* Confetti overlay */}
      <AnimatePresence>{showConfetti && <ConfettiCanvas />}</AnimatePresence>

      <div className="min-h-[100dvh] bg-[#FAFAFA] relative overflow-hidden">
        {/* Decorative background patterns */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[40%] -right-[20%] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-green-100/60 to-emerald-50/30 blur-3xl" />
          <div className="absolute -bottom-[30%] -left-[15%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-50/40 to-purple-50/20 blur-3xl" />
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 md:py-20 max-w-4xl">
          {/* ─── Hero confirmation ─── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            className="text-center mb-12 md:mb-16"
          >
            {/* ─── animated icon ─── */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 12,
                delay: 0.2,
              }}
              className="relative w-28 h-28 mx-auto mb-8"
            >
              <div className="absolute inset-0 bg-green-100 rounded-[2.5rem] animate-pulse" />
              <div className="relative w-full h-full bg-gradient-to-br from-green-400 to-emerald-500 rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-green-500/20">
                <CheckCircle
                  weight="fill"
                  className="h-14 w-14 text-white"
                />
              </div>
              {/* sparkle accents */}
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute -top-2 -right-2"
              >
                <Confetti
                  weight="fill"
                  size={28}
                  className="text-amber-400"
                />
              </motion.div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter text-[#111111] leading-[0.9] mb-5"
            >
              ¡GRACIAS POR
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-400">
                TU COMPRA!
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="text-sm md:text-base text-[#111111]/40 font-medium max-w-md mx-auto leading-relaxed"
            >
              Tu pedido fue procesado exitosamente. Recibirás un correo de
              confirmación con los detalles de tu envío.
            </motion.p>
          </motion.div>

          {/* ─── Order summary card ─── */}
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-[2.5rem] border border-[#111111]/5 p-12 flex flex-col items-center gap-4"
            >
              <div className="w-10 h-10 border-3 border-[#111111]/10 border-t-[#111111] rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#111111]/30">
                Cargando detalles del pedido...
              </p>
            </motion.div>
          ) : order ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-[2.5rem] border border-[#111111]/[0.06] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] overflow-hidden"
            >
              {/* ─── Order header ─── */}
              <div className="px-6 sm:px-10 md:px-12 pt-10 pb-8 border-b border-[#111111]/[0.04]">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-5">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Receipt
                        weight="duotone"
                        size={18}
                        className="text-[#111111]/30"
                      />
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#111111]/40">
                        Pedido {order.orderNumber}
                      </span>
                    </div>
                    <p className="text-xs text-[#111111]/30 font-medium">
                      {new Date(order.createdAt).toLocaleDateString("es-MX", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-green-50 text-green-700 px-5 py-2.5 rounded-full">
                    <ShieldCheck weight="fill" size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Pago Verificado
                    </span>
                  </div>
                </div>
              </div>

              {/* ─── Timeline tracker ─── */}
              <div className="px-6 sm:px-10 md:px-12 py-10 border-b border-[#111111]/[0.04] bg-[#FAFAFA]/50">
                <div className="flex items-center justify-between relative">
                  {/* progress line background */}
                  <div className="absolute top-5 left-[10%] right-[10%] h-[2px] bg-[#111111]/[0.06]" />
                  {/* progress line filled */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width:
                        activeStep === 0
                          ? "0%"
                          : activeStep === 1
                          ? "27%"
                          : activeStep === 2
                          ? "53%"
                          : "80%",
                    }}
                    transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                    className="absolute top-5 left-[10%] h-[2px] bg-green-500"
                  />

                  {timelineSteps.map((step, i) => {
                    const isActive = i <= activeStep;
                    const isCurrent = i === activeStep;
                    return (
                      <motion.div
                        key={step.key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 + i * 0.12 }}
                        className="flex flex-col items-center gap-2 z-10 w-1/4"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                            isCurrent
                              ? "bg-green-500 text-white shadow-lg shadow-green-500/30 scale-110"
                              : isActive
                              ? "bg-green-500 text-white"
                              : "bg-white border-2 border-[#111111]/10 text-[#111111]/25"
                          }`}
                        >
                          <step.icon weight="fill" size={18} />
                        </div>
                        <span
                          className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-center ${
                            isActive
                              ? "text-[#111111]"
                              : "text-[#111111]/25"
                          }`}
                        >
                          {step.label}
                        </span>
                        <span className="text-[8px] sm:text-[9px] text-[#111111]/30 font-medium hidden sm:block">
                          {step.description}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* ─── Items grid ─── */}
              <div className="px-6 sm:px-10 md:px-12 py-10 border-b border-[#111111]/[0.04]">
                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#111111]/30 mb-8">
                  Artículos del pedido
                </h3>
                <div className="space-y-5">
                  {order.items.map((item: any, i: number) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                      className="flex items-center gap-5 group"
                    >
                      <div className="relative w-[72px] h-[72px] rounded-2xl overflow-hidden bg-[#F3F3F3] border border-[#111111]/[0.04] shrink-0 group-hover:shadow-lg transition-shadow duration-500">
                        <Image
                          src={item.variant.product.images[0]}
                          alt={item.variant.product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-[#111111] leading-tight truncate">
                          {item.variant.product.name}
                        </h4>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[9px] font-black uppercase tracking-widest text-[#111111]/35 bg-[#111111]/[0.04] px-2.5 py-1 rounded-full">
                            Talla {item.variant.size}
                          </span>
                          <span className="text-[9px] font-bold text-[#111111]/20">
                            ×{item.quantity}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-black text-[#111111] tracking-tight whitespace-nowrap">
                        {formatPrice(Number(item.price) * item.quantity)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ─── Totals ─── */}
              <div className="px-6 sm:px-10 md:px-12 py-8 bg-[#FAFAFA]/50">
                <div className="space-y-3 max-w-xs ml-auto">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#111111]/40 font-medium">
                      Subtotal
                    </span>
                    <span className="text-[#111111]/60 font-bold">
                      {formatPrice(Number(order.subtotal))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#111111]/40 font-medium flex items-center gap-2">
                      <Truck size={14} className="text-[#111111]/25" />
                      Envío
                    </span>
                    <span className="text-[#111111]/60 font-bold">
                      {formatPrice(Number(order.shipping))}
                    </span>
                  </div>
                  <div className="border-t border-[#111111]/[0.06] pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-widest text-[#111111]/50">
                        Total
                      </span>
                      <span className="text-2xl font-black text-[#111111] tracking-tighter">
                        {formatPrice(Number(order.total))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Payment badge ─── */}
              <div className="px-6 sm:px-10 md:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#111111]/[0.04]">
                <div className="flex items-center gap-3 text-[#111111]/30">
                  <CreditCard weight="duotone" size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-wide">
                    Pago procesado vía Stripe
                  </span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <ShieldCheck weight="fill" size={16} />
                  <span className="text-[10px] font-bold">
                    Transacción segura
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ─── fallback if no orderId ─── */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-[2.5rem] border border-[#111111]/5 p-10 md:p-16 text-center"
            >
              <Package
                weight="duotone"
                size={56}
                className="mx-auto text-[#111111]/15 mb-6"
              />
              <p className="text-[#111111]/40 font-medium text-sm max-w-sm mx-auto">
                Tu pago ha sido procesado exitosamente. Revisa tu correo
                electrónico para los detalles completos del pedido.
              </p>
            </motion.div>
          )}

          {/* ─── Action buttons ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/orders"
              className="group inline-flex items-center justify-center gap-3 h-16 px-12 rounded-full bg-[#111111] text-white uppercase text-[10px] font-black tracking-widest shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/15 hover:bg-[#222] transition-all duration-300"
            >
              Ver Mis Pedidos
              <ArrowRight
                weight="bold"
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-3 h-16 px-12 rounded-full bg-white border border-[#111111]/10 text-[#111111] uppercase text-[10px] font-black tracking-widest hover:bg-[#111111]/[0.03] hover:border-[#111111]/15 transition-all duration-300"
            >
              <ShoppingBag size={18} />
              Seguir Comprando
            </Link>
          </motion.div>

          {/* ─── Trust footer ─── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-16 text-center"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#111111]/15">
              Gracias por elegir AuraSport
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}

/* ───────────────  page root (wraps in Suspense for useSearchParams)  ─── */
export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-[#111111]/10 border-t-[#111111] rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
