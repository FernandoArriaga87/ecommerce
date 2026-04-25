import Link from "next/link";
import { Suspense } from "react";
import { ForgotPasswordForm } from "./forgot-password-form";
import { TurnstileScript } from "@/components/turnstile-script";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12">
      <TurnstileScript />
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2">Recuperar Acceso</h1>
          <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">
            Te enviamos un enlace para crear una nueva contraseña.
          </p>
        </div>

        <Suspense fallback={<div className="h-40 flex items-center justify-center">Cargando...</div>}>
          <ForgotPasswordForm />
        </Suspense>

        <div className="text-center text-sm font-medium">
          <Link href="/login" className="font-bold underline uppercase tracking-widest text-xs">
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
