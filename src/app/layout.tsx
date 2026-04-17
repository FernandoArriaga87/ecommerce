import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { CartProvider } from "@/lib/cart-context";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} min-h-full flex flex-col bg-white text-black`}>
        <CartProvider>
          <div className="bg-[#f0f0f0] text-xs font-bold text-center py-2 text-black w-full tracking-wide">
            ENVÍO GRATIS EN PEDIDOS SUPERIORES A $1499 MXN <span className="underline cursor-pointer ml-1">VER DETALLES</span>
          </div>
          <Navbar />
          <main className="flex-1 w-full flex flex-col">
            {children}
          </main>
          <footer className="bg-black text-white py-12 mt-auto">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} DeportivoStore. Todos los derechos reservados.</p>
              <p className="mt-2 text-xs">Aceptamos Mercado Pago, Aplazo y Stripe.</p>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
