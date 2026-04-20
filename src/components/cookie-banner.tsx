"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "deportivo-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!stored) setVisible(true);
  }, []);

  const accept = (value: "all" | "essential") => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ value, date: new Date().toISOString() })
      );
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto max-w-4xl bg-[#111111] text-white border border-white/10 shadow-2xl">
        <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex-1 text-sm leading-relaxed">
            <p className="font-black uppercase tracking-[0.2em] text-[10px] text-white/60 mb-2">
              Cookies
            </p>
            <p className="text-white/90">
              Usamos cookies esenciales para que el sitio funcione, y opcionales para entender cómo se
              usa. Puedes aceptar todas o solo las esenciales.{" "}
              <Link href="/cookies" className="underline font-bold hover:text-white">
                Más información
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={() => accept("essential")}
              className="h-11 px-5 text-[10px] font-black uppercase tracking-[0.2em] border-2 border-white/20 text-white hover:border-white transition-colors"
            >
              Solo esenciales
            </button>
            <button
              onClick={() => accept("all")}
              className="h-11 px-5 text-[10px] font-black uppercase tracking-[0.2em] bg-white text-[#111111] hover:bg-white/90 transition-colors"
            >
              Aceptar todas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
