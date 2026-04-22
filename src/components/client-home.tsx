"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowRight, Play, TrendUp, Sparkle, Globe, CaretLeft, CaretRight, ShoppingBag, MapPin } from "@phosphor-icons/react";
import { formatPrice } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WishlistHeart } from "@/components/wishlist-heart";
import { BLUR_DATA_URL } from "@/lib/blur-placeholder";

interface Product {
  id: string;
  name: string;
  team: string;
  price: number;
  image: string;
  badge?: string;
  slug: string;
}

type SortKey = "newest" | "featured";

const SORT_LABELS: Record<SortKey, string> = {
  "newest": "Nuevo",
  "featured": "Más Vendido",
};

const FAKE_NAMES = [
  "Fernando A.", "Sofía R.", "Diego M.", "Valeria L.", "Santiago H.",
  "Renata G.", "Mateo P.", "Regina V.", "Emilio C.", "Ximena B.",
  "Leonardo T.", "Camila F.", "Alejandro S.", "Natalia O.", "Iker D.",
  "Paola N.", "Rodrigo E.", "Isabella Q.", "Sebastián J.", "Fernanda Z.",
  "Andrés K.", "Mariana U.", "Héctor Y.", "Daniela I.", "Luis A.",
  "Aitana W.", "Bruno X.", "Ximena A.", "Javier R.", "Carla M.",
];

const FAKE_STATES = [
  "Tijuana, BC", "Guadalajara, JAL", "Monterrey, NL", "CDMX",
  "Puebla, PUE", "Mérida, YUC", "Querétaro, QRO", "León, GTO",
  "Cancún, QROO", "Toluca, EDOMEX", "San Luis Potosí, SLP", "Aguascalientes, AGS",
  "Morelia, MICH", "Hermosillo, SON", "Chihuahua, CHIH", "Culiacán, SIN",
  "Saltillo, COAH", "Veracruz, VER", "Tuxtla Gutiérrez, CHIS", "Oaxaca, OAX",
  "Pachuca, HGO", "Durango, DGO", "Tepic, NAY", "Villahermosa, TAB",
  "Campeche, CAMP", "Colima, COL", "Zacatecas, ZAC", "Tlaxcala, TLX",
  "La Paz, BCS", "Chetumal, QROO", "Cuernavaca, MOR",
];

const COPY_VARIANTS = [
  (name: string, qty: number) => `${name} acaba de comprar ${qty} ${qty === 1 ? "playera" : "playeras"}`,
  (name: string, qty: number) => `${name} se llevó ${qty} ${qty === 1 ? "jersey" : "jerseys"} a casa`,
  (name: string, qty: number) => `${name} ordenó ${qty} ${qty === 1 ? "jersey" : "jerseys"} hace un momento`,
  (name: string, qty: number) => `${name} acaba de unirse al equipo con ${qty} ${qty === 1 ? "playera" : "playeras"}`,
];

function randomPurchase() {
  const name = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
  const state = FAKE_STATES[Math.floor(Math.random() * FAKE_STATES.length)];
  const qty = Math.floor(Math.random() * 6) + 1;
  const copy = COPY_VARIANTS[Math.floor(Math.random() * COPY_VARIANTS.length)];
  return { text: copy(name, qty), state, id: Date.now() + Math.random() };
}

function buildHref(params: {
  category?: string;
  sort?: SortKey;
  search?: string;
  page?: number;
}) {
  const sp = new URLSearchParams();
  if (params.category && params.category !== "all") sp.set("category", params.category);
  if (params.sort && params.sort !== "newest") sp.set("sort", params.sort);
  if (params.search) sp.set("search", params.search);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const q = sp.toString();
  return q ? `/?${q}` : "/";
}

export function ClientHome({
  products,
  initialCategory = "all",
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
  currentSort = "newest",
  currentSearch,
}: {
  products: Product[];
  initialCategory?: string;
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  currentSort?: SortKey;
  currentSearch?: string;
}) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  const [purchaseNotif, setPurchaseNotif] = useState<ReturnType<typeof randomPurchase> | null>(null);

  useEffect(() => {
    let hideTimeout: ReturnType<typeof setTimeout>;
    let nextTimeout: ReturnType<typeof setTimeout>;

    const cycle = () => {
      setPurchaseNotif(randomPurchase());
      hideTimeout = setTimeout(() => {
        setPurchaseNotif(null);
        nextTimeout = setTimeout(cycle, 6000 + Math.random() * 4000);
      }, 5000);
    };

    const startTimeout = setTimeout(cycle, 3000);
    return () => {
      clearTimeout(startTimeout);
      clearTimeout(hideTimeout);
      clearTimeout(nextTimeout);
    };
  }, []);

  const handleSortChange = (sort: SortKey) => {
    router.push(buildHref({ category: activeCategory, sort, search: currentSearch, page: 1 }) + "#catalog", { scroll: false });
  };

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
      <section className="relative min-h-[75dvh] flex items-center overflow-hidden bg-[#FAFAFA]">
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
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
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
                <Button 
                  onClick={() => {
                    const target = document.getElementById("catalog");
                    if (target) {
                      target.scrollIntoView({ behavior: "smooth" });
                      window.history.pushState(null, "", "#catalog");
                    }
                  }}
                  className="rounded-full bg-[#111111] text-white hover:bg-[#222222] px-10 h-16 text-sm font-bold uppercase tracking-widest shadow-2xl shadow-black/20 flex gap-3 group"
                >
                  Explorar Equipos
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
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
      <div id="catalog" className="container mx-auto px-6 md:px-12 py-24 scroll-mt-20">
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

          <div className="flex flex-col gap-4 md:items-end w-full md:w-auto">
            <div className="flex flex-wrap gap-2 md:gap-4 pb-2">
              {["all", "liga-mx", "europeos", "selecciones", "retro"].map((cat) => (
                <Link
                  key={cat}
                  href={buildHref({ category: cat, sort: currentSort, search: currentSearch, page: 1 }) + "#catalog"}
                  className={`px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border ${activeCategory === cat
                    ? "bg-[#111111] border-[#111111] text-white shadow-xl shadow-black/10"
                    : "bg-transparent border-[#111111]/10 text-[#111111]/40 hover:border-[#111111]/30 hover:text-[#111111]"
                    }`}
                >
                  {cat.replace("-", " ")}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="sort" className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#111111]/40">
                Ordenar
              </label>
              <select
                id="sort"
                value={currentSort}
                onChange={(e) => handleSortChange(e.target.value as SortKey)}
                className="bg-white border border-[#111111]/10 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-[#111111] focus:outline-none focus:border-[#111111]/30 cursor-pointer"
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <option key={key} value={key}>{SORT_LABELS[key]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {currentSearch && (
          <div className="mb-8 flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-[#111111]/60">
            <span>Resultados para</span>
            <span className="bg-[#111111] text-white px-4 py-1.5 rounded-full">&ldquo;{currentSearch}&rdquo;</span>
            <Link
              href={buildHref({ category: activeCategory, sort: currentSort, page: 1 }) + "#catalog"}
              scroll={false}
              className="text-[#111111]/40 hover:text-[#111111] underline"
            >
              Limpiar
            </Link>
          </div>
        )}

        {products.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-[#111111]/10 rounded-[2rem]">
            <p className="text-2xl font-black uppercase tracking-tight text-[#111111] mb-3">
              Sin resultados
            </p>
            <p className="text-sm text-[#111111]/50 max-w-md mx-auto mb-8">
              {currentSearch
                ? `No encontramos jerseys para "${currentSearch}". Prueba con otro equipo.`
                : "Aún no hay jerseys en esta categoría. Vuelve pronto."}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#111111] text-white px-8 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-[#222222] transition-colors"
            >
              Ver todo el catálogo
            </Link>
          </div>
        ) : (
          <>
            {/* Bento-Inspired Product Grid */}
            <motion.div
              key={`${activeCategory}-${currentSort}-${currentSearch}-${currentPage}`}
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10"
            >
              {products.map((product, idx) => (
                <motion.div key={product.id} variants={itemVariants} className="relative">
                  <WishlistHeart productId={product.id} variant="overlay" />
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
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                        loading={idx < 4 ? "eager" : "lazy"}
                        className="object-cover transition-transform duration-1000 ease-[0.23,1,0.32,1] group-hover:scale-110"
                      />

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
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-bold text-base text-[#111111]">{formatPrice(product.price)}</span>
                        <span className="text-xs font-medium text-[#111111]/30 line-through">{formatPrice(product.price * 2.5)}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest bg-red-500 text-white px-2 py-0.5 rounded-full">-60%</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {totalPages > 1 && (
              <nav
                aria-label="Paginación"
                className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-6"
              >
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#111111]/40">
                  {totalCount > 0 && (
                    <>
                      Mostrando {(currentPage - 1) * 12 + 1}–
                      {Math.min(currentPage * 12, totalCount)} de {totalCount}
                    </>
                  )}
                </p>

                <div className="flex items-center gap-2">
                  {currentPage > 1 ? (
                    <Link
                      href={buildHref({
                        category: activeCategory,
                        sort: currentSort,
                        search: currentSearch,
                        page: currentPage - 1,
                      }) + "#catalog"}
                      scroll={false}
                      className="flex items-center gap-2 px-5 h-11 rounded-full border border-[#111111]/10 text-[10px] font-bold uppercase tracking-widest text-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
                    >
                      <CaretLeft size={14} weight="bold" />
                      Anterior
                    </Link>
                  ) : (
                    <span className="flex items-center gap-2 px-5 h-11 rounded-full border border-[#111111]/5 text-[10px] font-bold uppercase tracking-widest text-[#111111]/20 cursor-not-allowed">
                      <CaretLeft size={14} weight="bold" />
                      Anterior
                    </span>
                  )}

                  <span className="px-5 h-11 flex items-center rounded-full bg-[#111111] text-white text-[10px] font-bold uppercase tracking-widest">
                    {currentPage} / {totalPages}
                  </span>

                  {currentPage < totalPages ? (
                    <Link
                      href={buildHref({
                        category: activeCategory,
                        sort: currentSort,
                        search: currentSearch,
                        page: currentPage + 1,
                      }) + "#catalog"}
                      scroll={false}
                      className="flex items-center gap-2 px-5 h-11 rounded-full border border-[#111111]/10 text-[10px] font-bold uppercase tracking-widest text-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
                    >
                      Siguiente
                      <CaretRight size={14} weight="bold" />
                    </Link>
                  ) : (
                    <span className="flex items-center gap-2 px-5 h-11 rounded-full border border-[#111111]/5 text-[10px] font-bold uppercase tracking-widest text-[#111111]/20 cursor-not-allowed">
                      Siguiente
                      <CaretRight size={14} weight="bold" />
                    </span>
                  )}
                </div>
              </nav>
            )}
          </>
        )}
      </div>

      {/* Social proof — live purchase notifications */}
      <div className="fixed bottom-8 left-8 z-[100] pointer-events-none max-w-[calc(100vw-4rem)]">
        <AnimatePresence mode="wait">
          {purchaseNotif && (
            <motion.div
              key={purchaseNotif.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring" as const, stiffness: 200, damping: 22 }}
              className="pointer-events-auto flex items-center gap-4 bg-white border border-[#111111]/5 rounded-full shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] pl-3 pr-6 py-3 backdrop-blur-xl"
            >
              <div className="shrink-0 bg-[#111111] text-white w-11 h-11 rounded-full flex items-center justify-center">
                <ShoppingBag weight="fill" size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-[13px] font-bold text-[#111111] leading-tight truncate">
                  {purchaseNotif.text}
                </p>
                <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#111111]/40 mt-1">
                  <MapPin weight="fill" size={10} className="text-red-500" />
                  {purchaseNotif.state}
                  <span className="opacity-40">•</span>
                  <span>Hace instantes</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Decorative Blur Elements */}
      <div className="fixed top-[-10%] right-[-10%] w-[50%] aspect-square bg-[#111111]/[0.02] rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40%] aspect-square bg-[#111111]/[0.03] rounded-full blur-[100px] pointer-events-none -z-10" />
    </div>
  );
}
