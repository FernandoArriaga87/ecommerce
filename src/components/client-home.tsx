"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ShoppingCart, ArrowRight, Play, TrendUp, Sparkle, Globe } from "@phosphor-icons/react";
import { formatPrice } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  team: string;
  price: number;
  image: string;
  badge?: string;
  slug: string;
}

export function ClientHome({ products, initialCategory = "all" }: { products: Product[], initialCategory?: string }) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  // Sync state if initialCategory changes (e.g. via browser navigation)
  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };


  return (
    <div className="w-full bg-[#FAFAFA]">
      {/* Asymmetric Premium Hero */}
      <section className="relative min-h-[90dvh] flex items-center overflow-hidden bg-[#FAFAFA]">
        {/* Background Image - Now covering everything */}
        <motion.div
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
          className="absolute inset-0 w-full h-full z-0"
        >
          <Image
            src="/ImgHerol.jpg"
            alt="Aficionado con jersey deportivo inspirado en su equipo favorito"
            fill
            sizes="100vw"
            quality={85}
            priority
            fetchPriority="high"
            className="object-cover object-center"
          />
          {/* Enhanced Gradient Overlay for readability: darker on the left where the text is */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAFAFA] via-[#FAFAFA]/60 to-transparent z-10" />
        </motion.div>

        {/* Content Layer */}
        <div className="container mx-auto px-8 md:px-16 lg:px-24 py-20 z-20 relative">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring" as const, stiffness: 50, damping: 20 }}
            className="max-w-xl"
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="h-[1px] w-12 bg-[#111111]/20" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#111111]/60">Colección 2026</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-[-0.04em] leading-[0.9] text-[#111111] mb-8">
              PURA<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#111111] to-[#666666]">PASIÓN</span><br />
              DEPORTIVA.
            </h1>

            <p className="text-lg md:text-xl text-[#111111]/60 font-medium mb-12 leading-relaxed tracking-tight max-w-md">
              Jerseys de aficionado inspirados en tus equipos favoritos. Calidad premium para vivir el juego en cada entrenamiento y cada grito de gol.
            </p>

            <div className="flex flex-wrap gap-5">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="rounded-full bg-[#111111] text-white hover:bg-[#222222] px-10 h-16 text-sm font-bold uppercase tracking-widest shadow-2xl shadow-black/20 flex gap-3 group">
                  Explorar Equipos
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" className="rounded-full border-[#111111]/10 bg-white/50 backdrop-blur-md text-[#111111] px-8 h-16 text-sm font-bold uppercase tracking-widest flex gap-3">
                  <Play weight="fill" size={20} />
                  Ver Trailer
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Floating Aesthetic Badge */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-12 right-12 bg-white/10 backdrop-blur-2xl border border-white/20 p-6 rounded-[2rem] shadow-2xl hidden md:block z-30"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Sparkle weight="fill" className="text-white" size={24} />
            </div>
            <div className="text-white">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Quality</p>
              <p className="font-bold text-sm">Calidad Premium</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 border-y border-[#111111]/5 bg-white">
        <div className="container mx-auto px-6 overflow-hidden">
          <motion.div
            animate={{ x: [0, -1000] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-24 whitespace-nowrap"
          >
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 text-[#111111]/30 font-bold uppercase tracking-[0.4em] text-xs">
                <Globe size={18} />
                <span>Envíos a todo el mundo</span>
                <span className="opacity-20">•</span>
                <TrendUp size={18} />
                <span>Tendencia Semanal</span>
                <span className="opacity-20">•</span>
                <Sparkle size={18} />
                <span>Calidad Premium</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-6 md:px-12 py-24">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl"
          >
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6 uppercase">
              DOMINA EL<br />TERRENO DE JUEGO
            </h2>
            <p className="text-[#111111]/50 font-medium text-lg max-w-sm">
              Seleccionamos lo mejor de la temporada para que vistas como un profesional.
            </p>
          </motion.div>

          <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
            {["all", "liga-mx", "europeos", "selecciones", "retro", "ofertas"].map((cat) => (
              <Link
                key={cat}
                href={`/?category=${cat}`}
                className={`px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border ${activeCategory === cat
                  ? "bg-[#111111] border-[#111111] text-white shadow-xl shadow-black/10"
                  : "bg-transparent border-[#111111]/10 text-[#111111]/40 hover:border-[#111111]/30 hover:text-[#111111]"
                  }`}
              >
                {cat.replace("-", " ")}
              </Link>
            ))}
          </div>
        </div>

        {/* Bento-Inspired Product Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10"
        >
          {products.map((product) => (
            <motion.div key={product.id} variants={itemVariants}>
              <Link href={`/producto/${product.id}`} className="group block">
                <div className="relative aspect-[4/5] bg-[#F3F3F3] rounded-[2.5rem] overflow-hidden mb-6 transition-all duration-500 group-hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)]">
                  {product.badge && (
                    <div className="absolute top-6 left-6 z-10">
                      <span className="bg-white/80 backdrop-blur-md text-[#111111] text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-sm">
                        {product.badge}
                      </span>
                    </div>
                  )}

                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover transition-transform duration-1000 ease-[0.23,1,0.32,1] group-hover:scale-110"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-x-6 bottom-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <Button className="w-full rounded-2xl bg-white/95 backdrop-blur-md text-[#111111] hover:bg-white border-none py-6 h-auto font-bold uppercase tracking-widest text-[10px] shadow-xl">
                      Añadir al Carrito
                    </Button>
                  </div>
                </div>

                <div className="px-2">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <span className="text-[10px] font-bold text-[#111111]/40 uppercase tracking-[0.2em]">
                      {product.team}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#111111]/5 text-[#111111]/60">
                      26' Edition
                    </span>
                  </div>
                  <h3 className="font-bold text-xl leading-[1.1] mb-2 text-[#111111] group-hover:translate-x-1 transition-transform tracking-tight">
                    {product.name}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-base text-[#111111]">{formatPrice(product.price)}</span>
                    <span className="text-xs font-medium text-[#111111]/30 line-through">{formatPrice(product.price * 1.2)}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Liquid Glass Sticky Widget */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, type: "spring" as const, damping: 15 }}
        className="fixed bottom-8 left-8 z-[100]"
      >
        <button className="group relative bg-[#111111] text-white p-5 rounded-full shadow-2xl hover:bg-[#222222] transition-colors">
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#FAFAFA]">
            2
          </div>
          <ShoppingCart weight="bold" size={24} />

          {/* Tooltip */}
          <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-white text-[#111111] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl border border-[#111111]/5">
            20% Cupón: GOL20
          </span>
        </button>
      </motion.div>

      {/* Decorative Blur Elements */}
      <div className="fixed top-[-10%] right-[-10%] w-[50%] aspect-square bg-[#111111]/[0.02] rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40%] aspect-square bg-[#111111]/[0.03] rounded-full blur-[100px] pointer-events-none -z-10" />
    </div>
  );
}
