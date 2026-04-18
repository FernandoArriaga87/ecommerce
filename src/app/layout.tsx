import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { CartProvider } from "@/lib/cart-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  padding: "unset",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeportivoStore | Playeras Originales",
  description: "El mejor e-commerce para comprar playeras de tus equipos favoritos. Envío rápido y seguro.",
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
          <div className="bg-[#111111] text-[10px] font-bold text-center py-2 text-white w-full tracking-[0.2em] uppercase">
            ENVÍO GRATIS EN PEDIDOS SUPERIORES A $1499 MXN <span className="underline cursor-pointer ml-1 opacity-70 hover:opacity-100 transition-opacity">VER DETALLES</span>
          </div>
          <Navbar />
          <main className="flex-1 w-full flex flex-col">
            {children}
          </main>
          <footer className="bg-[#0A0A0A] text-white/50 py-24 mt-auto border-t border-white/[0.05]">
            <div className="container mx-auto px-6 text-center text-sm font-medium tracking-tight">
              <p className="text-white/80">&copy; {new Date().getFullYear()} DeportivoStore. Todos los derechos reservados.</p>
              <p className="mt-4 text-xs opacity-40">Pagos seguros procesados a través de Stripe.</p>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}

