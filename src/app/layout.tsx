import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { CookieBanner } from "@/components/cookie-banner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AuraSport — Ropa Deportiva Usada Importada",
    template: "%s | AuraSport",
  },
  description:
    "Camisas y prendas deportivas usadas importadas. Piezas únicas importadas de Estados Unidos con envío seguro a toda la República Mexicana.",
  applicationName: "AuraSport",
  keywords: [
    "jerseys",
    "playeras de fútbol",
    "usado",
    "vintage",
    "Liga MX",
    "selección mexicana",
    "tienda deportiva",
    "México",
  ],
  authors: [{ name: "AuraSport" }],
  creator: "AuraSport",
  publisher: "AuraSport",
  formatDetection: { telephone: false, email: false, address: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: SITE_URL,
    siteName: "AuraSport",
    title: "AuraSport — Ropa Deportiva Usada Importada",
    description:
      "Ropa deportiva usada importada. Envío seguro a toda la República.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AuraSport — Ropa Deportiva Usada Importada",
    description:
      "Ropa deportiva usada importada. Envío seguro a toda la República.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-[100dvh] flex flex-col bg-[#FAFAFA] text-[#111111] font-sans selection:bg-black selection:text-white`}>
        <CartProvider>
         <WishlistProvider>
          <div className="bg-[#111111] text-[10px] font-bold text-center py-2 text-white w-full tracking-[0.2em] uppercase">
            ENVÍO GRATIS EN PEDIDOS SUPERIORES A $1499 MXN{" "}
            <Link href="/envios" className="underline ml-1 opacity-70 hover:opacity-100 transition-opacity">
              VER DETALLES
            </Link>
          </div>
          <Navbar />
          <main className="flex-1 w-full flex flex-col">
            {children}
          </main>
          <footer className="bg-[#0A0A0A] text-white/60 mt-auto border-t border-white/[0.05]">
            <div className="container mx-auto px-6 py-16">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-white mb-5">Comprar</h3>
                  <ul className="space-y-3 text-sm">
                    <li><Link href="/#catalog" className="hover:text-white transition-colors">Catálogo</Link></li>
                    <li><Link href="/?search=" className="hover:text-white transition-colors">Buscar</Link></li>
                    <li><Link href="/wishlist" className="hover:text-white transition-colors">Favoritos</Link></li>
                    <li><Link href="/orders" className="hover:text-white transition-colors">Mis pedidos</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-white mb-5">Ayuda</h3>
                  <ul className="space-y-3 text-sm">
                    <li><Link href="/envios" className="hover:text-white transition-colors">Envíos</Link></li>
                    <li><Link href="/devoluciones" className="hover:text-white transition-colors">Devoluciones</Link></li>
                    <li><Link href="/contacto" className="hover:text-white transition-colors">Contacto</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-white mb-5">Legal</h3>
                  <ul className="space-y-3 text-sm">
                    <li><Link href="/terminos" className="hover:text-white transition-colors">Términos</Link></li>
                    <li><Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link></li>
                    <li><Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-white mb-5">AuraSport</h3>
                  <p className="text-sm text-white/50 leading-relaxed">
                    Camisas y ropa deportiva usada importada. Selección vintage e importada. Envío seguro a toda la república.
                  </p>
                  <p className="text-[10px] text-white/30 leading-relaxed mt-4 uppercase tracking-widest">
                    Prendas únicas importadas. Promovemos la moda circular y sustentable.
                  </p>
                </div>
              </div>

              <div className="pt-8 border-t border-white/[0.05] flex flex-col md:flex-row md:justify-between md:items-center gap-3 text-xs">
                <p className="text-white/50">&copy; {new Date().getFullYear()} AuraSport. Todos los derechos reservados.</p>
                <p className="text-white/30">Pagos seguros procesados por Stripe.</p>
              </div>
            </div>
          </footer>
          <CookieBanner />
         </WishlistProvider>
        </CartProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}



