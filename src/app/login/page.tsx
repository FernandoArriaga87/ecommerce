import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { TurnstileScript } from "@/components/turnstile-script";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12">
      <TurnstileScript />
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2">Acceso</h1>
          <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">Ingresa a tu cuenta para gestionar tus compras.</p>
        </div>

        <Suspense fallback={<div className="h-40 flex items-center justify-center">Cargando...</div>}>
          <LoginForm />
        </Suspense>

        <div className="text-center text-sm font-medium">
          <span className="text-gray-500 uppercase tracking-widest text-xs">¿No tienes cuenta?</span>{" "}
          <Link href="/register" className="font-bold underline uppercase tracking-widest text-xs">
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
