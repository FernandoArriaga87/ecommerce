import Link from "next/link";
import { Suspense } from "react";
import { RegisterForm } from "./register-form";
import { TurnstileScript } from "@/components/turnstile-script";

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12">
      <TurnstileScript />
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2">Registro</h1>
          <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">Crea tu cuenta.</p>
        </div>

        <Suspense fallback={<div className="h-40 flex items-center justify-center">Cargando...</div>}>
          <RegisterForm />
        </Suspense>

        <div className="text-center text-sm font-medium">
          <span className="text-gray-500 uppercase tracking-widest text-xs">¿Ya tienes cuenta?</span>{" "}
          <Link href="/login" className="font-bold underline uppercase tracking-widest text-xs">
            Inicia Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
