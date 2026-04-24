"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Truck, CreditCard, ArrowLeft, Check, Loader2, Lock, Package } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { ShippingOption } from "@/lib/skydropx";
import { qualifiesForFreeShipping, FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
import { track } from "@vercel/analytics";

const supabase = createClient();

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  addresses?: SavedAddress[];
}

interface SavedAddress {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [address, setAddress] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string>("");
  const [quoteId, setQuoteId] = useState<string>("");
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string>("");

  // The persisted quote is bound to a specific (zip, totalItems) snapshot. If
  // any of those change after cotizar, the saved quoteId is no longer valid —
  // force the user to re-quote so the server-side validation passes.
  useEffect(() => {
    if (quoteId && selectedAddressId === null) {
      setQuoteId("");
      setShippingOptions([]);
      setSelectedRateId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zipCode, totalItems, selectedAddressId]);

  // Auto-fetch shipping quotes when a saved address is selected or preloaded
  useEffect(() => {
    if (qualifiesForFreeShipping(subtotal)) {
      setQuoteId("free_shipping");
      setSelectedRateId("free_shipping");
      setShippingOptions([]);
      return;
    }

    if (selectedAddressId && zipCode && city && state && address && totalItems > 0) {
      const t = setTimeout(() => {
        fetchQuotes();
      }, 300);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddressId, subtotal]);

  useEffect(() => {
    async function initialize() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        // If authenticated, fetch profile + address from DB
        if (session?.user) {
          const res = await fetch("/api/profile");
          if (res.ok) {
            const data: UserProfile = await res.json();
            setProfile(data);
            const addrs = data.addresses || [];
            setSavedAddresses(addrs);

            // Preselect the default address (or the first one) so the
            // returning user lands on the form already filled in.
            const preselected = addrs.find((a) => a.isDefault) || addrs[0];
            if (preselected) {
              setSelectedAddressId(preselected.id);
              setName(preselected.name);
              setPhone(preselected.phone);
              setAddress(preselected.address);
              setCity(preselected.city);
              setState(preselected.state);
              setZipCode(preselected.zipCode);
            } else {
              // No saved addresses — fall back to whatever the profile flat
              // fields gave us (legacy shape).
              setName(data.name || session.user.user_metadata?.name || "");
              setPhone(data.phone || "");
              if (data.address) setAddress(data.address);
              if (data.city) setCity(data.city);
              if (data.state) setState(data.state);
              if (data.zipCode) setZipCode(data.zipCode);
            }
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

  const fetchQuotes = async () => {
    const zip = zipCode.trim();
    if (!/^\d{5}$/.test(zip) || totalItems === 0) {
      alert("Ingresa un código postal mexicano válido (5 dígitos) antes de cotizar.");
      return;
    }
    if (!city.trim() || !state.trim() || !address.trim()) {
      alert("Por favor completa toda tu dirección (Calle, Ciudad y Estado) antes de cotizar el envío.");
      return;
    }

    setLoadingShipping(true);
    setShippingError("");
    try {
      const res = await fetch("/api/checkout/shipping-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip, city, state, address, totalItems }),
      });
      const data = await res.json();
      if (!res.ok) {
        setShippingError(data.error || "No pudimos cotizar el envío.");
        setShippingOptions([]);
        setSelectedRateId("");
      } else {
        const opts: ShippingOption[] = data.options || [];
        setShippingOptions(opts);
        setQuoteId(data.quoteId || "");
        // Auto-select cheapest
        if (opts.length > 0) {
          const cheapest = opts.reduce((a, b) => (a.price < b.price ? a : b));
          setSelectedRateId(cheapest.rateId);
        } else {
          setSelectedRateId("");
        }
      }
    } catch (err) {
      console.error("Quote fetch error:", err);
      setShippingError("Error de conexión al cotizar.");
    } finally {
      setLoadingShipping(false);
    }
  };

  const selectedOption = shippingOptions.find((o) => o.rateId === selectedRateId);
  const freeShipping = qualifiesForFreeShipping(subtotal);
  const rawShipping = selectedOption?.price ?? 0;
  const shipping = freeShipping ? 0 : rawShipping;
  const total = subtotal + shipping;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStockErrors([]);

    if (!selectedRateId || !quoteId) {
      alert("Cotiza el envío antes de continuar.");
      setLoading(false);
      return;
    }

    // Los inputs del form solo se renderizan cuando selectedAddressId === null,
    // así que no podemos depender de FormData. Leemos de los state vars que
    // siempre se actualizan (tanto al elegir saved address como al teclear).
    // El email viene de la sesión auth — el server-side check anti-spoofing
    // (route.ts) lo valida contra authUser.email.
    const body = {
      name,
      email: user?.email || profile?.email || "",
      phone,
      address,
      city,
      state,
      zipCode,
      addressId: selectedAddressId,
      quoteId,
      shippingRateId: selectedRateId,
      items: items.map((i) => ({
        productId: i.productId,
        size: i.size,
        quantity: i.quantity,
      })),
    };

    try {
      track("checkout_started", {
        itemCount: items.reduce((acc, i) => acc + i.quantity, 0),
        subtotal,
        freeShipping: qualifiesForFreeShipping(subtotal),
      });
      const res = await fetch("/api/checkout/quick-stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.url) {
        // Vaciamos el estado local del carrito antes de redirigir a Stripe.
        // El servidor ya borró el Cart en BD dentro de la transacción de la
        // orden, así esto solo refleja el cambio en la UI por si el usuario
        // regresa con el botón "atrás" desde Stripe.
        clearCart();
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
            {/* Shipping */}
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest mb-4 pb-2 border-b border-gray-200">
                Dirección de Envío
              </h2>

              {savedAddresses.length > 0 && (
                <div className="mb-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
                    Direcciones Guardadas
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {savedAddresses.map((a) => {
                      const active = selectedAddressId === a.id;
                      return (
                        <button
                          type="button"
                          key={a.id}
                          onClick={() => {
                            setSelectedAddressId(a.id);
                            setName(a.name);
                            setPhone(a.phone);
                            setAddress(a.address);
                            setCity(a.city);
                            setState(a.state);
                            setZipCode(a.zipCode);
                          }}
                          className={`text-left p-4 border transition-all ${
                            active
                              ? "border-black bg-black text-white"
                              : "border-gray-200 bg-white hover:border-black"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest truncate">
                              {a.label || "Envío"}
                            </span>
                            {a.isDefault && (
                              <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 ${
                                active ? "bg-white text-black" : "bg-black text-white"
                              }`}>
                                Predet.
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold truncate">{a.name}</p>
                          <p className={`text-[11px] mt-0.5 truncate ${active ? "text-white/70" : "text-gray-500"}`}>
                            {a.address}
                          </p>
                          <p className={`text-[11px] truncate ${active ? "text-white/70" : "text-gray-500"}`}>
                            {a.city}, {a.state} {a.zipCode}
                          </p>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAddressId(null);
                        setName("");
                        setPhone("");
                        setAddress("");
                        setCity("");
                        setState("");
                        setZipCode("");
                      }}
                      className={`text-left p-4 border-2 border-dashed transition-all flex items-center justify-center ${
                        selectedAddressId === null
                          ? "border-black bg-zinc-50"
                          : "border-gray-300 bg-white hover:border-black"
                      }`}
                    >
                      <span className="text-[11px] font-black uppercase tracking-widest">
                        + Usar una nueva dirección
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {selectedAddressId === null && (
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Nombre de quien recibe</label>
                      <Input
                        name="name"
                        required
                        value={name}
                        onChange={(e) => { setName(e.target.value); setSelectedAddressId(null); }}
                        placeholder="Juan Pérez"
                        className="h-12 rounded-none border-gray-300 font-medium focus-visible:ring-black"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Teléfono</label>
                      <Input
                        name="phone"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); setSelectedAddressId(null); }}
                        placeholder="+52 555 123 4567"
                        className="h-12 rounded-none border-gray-300 font-medium focus-visible:ring-black"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Dirección Completa</label>
                    <Input
                      name="address"
                      required
                      value={address}
                      onChange={(e) => { setAddress(e.target.value); setSelectedAddressId(null); }}
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
                        value={city}
                        onChange={(e) => { setCity(e.target.value); setSelectedAddressId(null); }}
                        placeholder="CDMX"
                        className="h-12 rounded-none border-gray-300 font-medium focus-visible:ring-black"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Estado</label>
                      <Input
                        name="state"
                        required
                        value={state}
                        onChange={(e) => { setState(e.target.value); setSelectedAddressId(null); }}
                        placeholder="Estado"
                        className="h-12 rounded-none border-gray-300 font-medium focus-visible:ring-black"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Código Postal</label>
                      <Input
                        name="zipCode"
                        required
                        value={zipCode}
                        onChange={(e) => { setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5)); setSelectedAddressId(null); }}
                        placeholder="01000"
                        inputMode="numeric"
                        className="h-12 rounded-none border-gray-300 font-medium focus-visible:ring-black"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Shipping Options */}
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest mb-4 pb-2 border-b border-gray-200">
                Opciones de Envío
              </h2>

              {freeShipping ? (
                <div className="p-4 border border-green-300 bg-green-50">
                  <p className="text-xs font-black uppercase tracking-widest text-green-700 mb-1">
                    ✓ Envío Gratis Aplicado
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-green-600/80">
                    Tu pedido califica para envío gratuito. Se asignará la mejor paquetería automáticamente.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-4">
                    {selectedAddressId === null && (
                      <Button 
                        type="button" 
                        onClick={fetchQuotes} 
                        disabled={loadingShipping || !zipCode || !city || !state || !address}
                        className="w-full bg-black hover:bg-gray-800 text-white rounded-none h-12 text-xs font-bold uppercase tracking-widest"
                      >
                        Confirmar Dirección y Cotizar Envío
                      </Button>
                    )}

                    {shippingOptions.length === 0 && !loadingShipping && !shippingError && (
                      <div className="p-4 border border-dashed border-gray-300 bg-white flex items-center gap-3">
                        <Package className="h-5 w-5 text-gray-400" />
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {selectedAddressId 
                            ? "Calculando opciones de envío para esta dirección..." 
                            : "Ingresa tu dirección completa y presiona el botón para ver las opciones de envío."}
                        </p>
                      </div>
                    )}
                  </div>

                  {loadingShipping && (
                    <div className="p-4 border border-gray-200 bg-white flex items-center gap-3 mt-4">
                      <Loader2 className="h-5 w-5 animate-spin text-black" />
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-600">
                        Cotizando opciones de envío...
                      </p>
                    </div>
                  )}

                  {!loadingShipping && shippingError && (
                    <div className="p-4 border border-red-200 bg-red-50 mt-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-red-600">{shippingError}</p>
                    </div>
                  )}

                  {!loadingShipping && !shippingError && shippingOptions.length > 0 && (
                    <div className="space-y-3 mt-4">
                      {shippingOptions.map((opt) => {
                        const active = selectedRateId === opt.rateId;
                        return (
                          <button
                            type="button"
                            key={opt.rateId}
                            onClick={() => setSelectedRateId(opt.rateId)}
                            className={`w-full text-left p-4 border transition-all flex items-center gap-4 ${
                              active
                                ? "border-black bg-black text-white"
                                : "border-gray-200 bg-white hover:border-black"
                            }`}
                          >
                            <div className={`h-4 w-4 rounded-full border-2 shrink-0 ${
                              active ? "border-white bg-white" : "border-gray-400"
                            }`}>
                              {active && <div className="h-full w-full rounded-full bg-black scale-50" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black uppercase tracking-wide truncate">
                                {opt.carrier}
                              </p>
                              <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${
                                active ? "text-white/70" : "text-gray-500"
                              }`}>
                                {opt.serviceLevel} · {opt.daysMin === opt.daysMax
                                  ? `${opt.daysMin} día${opt.daysMin > 1 ? "s" : ""}`
                                  : `${opt.daysMin}-${opt.daysMax} días`}
                              </p>
                            </div>
                            <div className="text-sm font-black whitespace-nowrap flex flex-col items-end">
                              {formatPrice(opt.price)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {!loadingShipping && !shippingError && shippingOptions.length === 0 && /^\d{5}$/.test(zipCode.trim()) && selectedAddressId === null && (
                    <div className="p-4 border border-gray-200 bg-white mt-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                        No hay opciones de envío disponibles para este código postal.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Disclosure + consent (chargeback defense) */}
            <label className="flex gap-3 items-start cursor-pointer select-none p-4 border border-gray-200 bg-white">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-black cursor-pointer"
                required
              />
              <span className="text-xs text-gray-700 leading-relaxed">
                Entiendo que estas prendas son <strong>camisas y prendas usadas</strong> de segunda mano importadas.
                He leído y acepto los{" "}
                <Link href="/terminos" className="underline font-bold hover:text-black" target="_blank">
                  Términos
                </Link>,{" "}
                el{" "}
                <Link href="/privacidad" className="underline font-bold hover:text-black" target="_blank">
                  Aviso de Privacidad
                </Link>
                {" "}y la{" "}
                <Link href="/devoluciones" className="underline font-bold hover:text-black" target="_blank">
                  Política de Devoluciones
                </Link>
                .
              </span>
            </label>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || !acceptedTerms || !selectedRateId || !quoteId}
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
                <span className={freeShipping ? "text-green-600" : "text-black"}>
                  {selectedOption
                    ? freeShipping
                      ? "GRATIS"
                      : formatPrice(shipping)
                    : "—"}
                </span>
              </div>
              {selectedOption && (
                <div className="flex justify-between text-[10px] font-medium text-gray-400 tracking-wide -mt-1">
                  <span className="truncate">{selectedOption.carrier}</span>
                  <span className="whitespace-nowrap">
                    {selectedOption.daysMin === selectedOption.daysMax
                      ? `${selectedOption.daysMin} día${selectedOption.daysMin > 1 ? "s" : ""}`
                      : `${selectedOption.daysMin}-${selectedOption.daysMax} días`}
                  </span>
                </div>
              )}
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
