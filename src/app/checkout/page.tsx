"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Truck, CreditCard, ArrowLeft, Check, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart, totalItems } = useCart();
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [stockErrors, setStockErrors] = useState<string[]>([]);

  useEffect(() => {
    async function initialize() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        // If authenticated, fetch profile + address from DB
        if (session?.user) {
          const res = await fetch("/api/profile");
          if (res.ok) {
            const data = await res.json();
            setProfile(data);
          }
        }
      } catch (error) {
        console.error("Auth/profile check error:", error);
      } finally {
        setCheckingAuth(false);
      }
    }
    initialize();
  }, []);

  const shipping = subtotal >= 1499 ? 0 : 149;
  const total = subtotal + shipping;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStockErrors([]);

    const formData = new FormData(e.currentTarget);
    const body = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      city: formData.get("city"),
      state: formData.get("state"),
      zipCode: formData.get("zipCode"),
      items: items.map((i) => ({
        productId: i.productId,
        name: i.name,
        size: i.size,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
      })),
      subtotal,
      shipping,
      total,
    };

    try {
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.code === "STOCK_ERROR" && data.stockErrors) {
        setStockErrors(data.stockErrors);
      } else {
        alert(data.error || "Error al iniciar el pago con Stripe.");
      }
    } catch (error) {
      console.error("Checkout connection error:", error);
      alert("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="container mx-auto px-4 py-24 text-center flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-black mb-4" />
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Verificando sesión...</p>
      </div>
    );
  }

  if (!user && step === "form") {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-lg">
        <Lock className="h-16 w-16 mx-auto text-black mb-6" />
        <h1 className="text-3xl font-black uppercase tracking-tight mb-4">Inicia sesión para continuar</h1>
        <p className="text-gray-500 font-medium mb-10 uppercase tracking-wide text-sm">
          Para garantizar la seguridad de tu compra y facilitar el seguimiento de tu pedido, es necesario estar registrado.
        </p>
        <div className="flex flex-col gap-4">
          <Link href="/login?returnUrl=/checkout">
            <Button className="w-full h-14 rounded-none bg-black text-white hover:bg-gray-800 uppercase font-black tracking-widest text-xs translate-y-0 hover:-translate-y-1 transition-transform">
              Iniciar Sesión
            </Button>
          </Link>
          <Link href="/register?returnUrl=/checkout">
            <Button variant="outline" className="w-full h-14 rounded-none border-black text-black hover:bg-gray-100 uppercase font-black tracking-widest text-xs">
              Crear una cuenta
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (totalItems === 0 && step === "form") {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Tu carrito está vacío</p>
        <Link href="/">
          <Button className="rounded-none bg-black text-white hover:bg-gray-800 uppercase font-black tracking-widest text-xs h-12 px-10">
            Volver a la Tienda
          </Button>
        </Link>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">¡Pedido Confirmado!</h1>
        <p className="text-gray-500 font-medium mb-6">
          Tu número de orden es:
        </p>
        <div className="bg-black text-white px-6 py-4 mb-8 inline-block">
          <span className="text-xl font-black tracking-widest">{orderNumber}</span>
        </div>
        <p className="text-sm text-gray-400 mb-8">
          Recibirás un correo de confirmación con los detalles de tu pedido y la información de rastreo.
        </p>
        <Link href="/">
          <Button className="rounded-none bg-black text-white hover:bg-gray-800 uppercase font-black tracking-widest text-xs h-14 px-12">
            Seguir Comprando
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver a la Tienda
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* Left: Form */}
        <div className="lg:col-span-7">
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-8">Finalizar Compra</h1>

          {/* Stock error banner */}
          {stockErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 p-4 mb-6 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-600">
                ⚠ Stock insuficiente
              </p>
              {stockErrors.map((err, i) => (
                <p key={i} className="text-xs text-red-600/80 font-medium leading-snug">{err}</p>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Contact */}
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest mb-4 pb-2 border-b border-gray-200">
                Datos de Contacto
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Nombre Completo</label>
                  <Input
                    name="name"
                    required
                    defaultValue={profile?.name || user?.user_metadata?.name || user?.user_metadata?.full_name || ""}
                    placeholder="Juan Pérez"
                    className="h-12 rounded-none border-gray-300 font-medium focus-visible:ring-black"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Correo Electrónico</label>
                  <Input
                    name="email"
                    type="email"
                    required
                    defaultValue={profile?.email || user?.email || ""}
                    placeholder="juan@email.com"
                    className="h-12 rounded-none border-gray-300 font-medium focus-visible:ring-black"
                  />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Teléfono</label>
                  <Input
                    name="phone"
                    type="tel"
                    required
                    defaultValue={profile?.phone || ""}
                    placeholder="+52 555 123 4567"
                    className="h-12 rounded-none border-gray-300 font-medium focus-visible:ring-black"
                  />
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest mb-4 pb-2 border-b border-gray-200">
                Dirección de Envío
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Dirección Completa</label>
                  <Input
                    name="address"
                    required
                    defaultValue={profile?.address || ""}
                    placeholder="Calle, Número, Colonia"
                    className="h-12 rounded-none border-gray-300 font-medium focus-visible:ring-black"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Ciudad</label>
                    <Input
                      name="city"
                      required
                      defaultValue={profile?.city || ""}
                      placeholder="CDMX"
                      className="h-12 rounded-none border-gray-300 font-medium focus-visible:ring-black"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Estado</label>
                    <Input
                      name="state"
                      required
                      defaultValue={profile?.state || ""}
                      placeholder="Estado"
                      className="h-12 rounded-none border-gray-300 font-medium focus-visible:ring-black"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Código Postal</label>
                    <Input
                      name="zipCode"
                      required
                      defaultValue={profile?.zipCode || ""}
                      placeholder="01000"
                      className="h-12 rounded-none border-gray-300 font-medium focus-visible:ring-black"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-16 rounded-none bg-black text-white hover:bg-gray-900 uppercase font-black tracking-widest transition-all hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  PROCESANDO...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  CONFIRMAR PEDIDO · {formatPrice(total)}
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-gray-400">
              <ShieldCheck className="h-4 w-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest">
                Transacción Segura y Encriptada
              </p>
            </div>
          </form>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-zinc-50 border border-zinc-100 p-6 lg:p-8 sticky top-24">
            <h2 className="text-xs font-black uppercase tracking-widest mb-6 pb-3 border-b border-gray-200">
              Resumen del Pedido
            </h2>

            <div className="space-y-5 mb-6">
              {items.map((item) => (
                <div key={`${item.productId}-${item.size}`} className="flex gap-4">
                  <div className="relative h-20 w-16 bg-zinc-200 shrink-0 overflow-hidden border border-black/5">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                    <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black uppercase truncate">{item.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                      Talla {item.size} · {item.team}
                    </p>
                    <p className="text-sm font-black mt-1">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                <span>Subtotal</span>
                <span className="text-black">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                <span className="flex items-center gap-1">
                  <Truck className="w-3 h-3" /> Envío
                </span>
                <span className={shipping === 0 ? "text-green-600" : "text-black"}>
                  {shipping === 0 ? "GRATIS" : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-black pt-3 border-t border-gray-200">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
