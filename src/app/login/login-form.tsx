"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { TurnstileWidget } from "@/components/turnstile-widget";

const supabase = createClient();

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, { error: "" });
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/profile";

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?returnUrl=${encodeURIComponent(returnUrl)}`,
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Button
        onClick={handleGoogleLogin}
        variant="outline"
        className="h-14 rounded-none border-gray-300 font-black tracking-widest text-xs uppercase flex items-center justify-center gap-3 w-full hover:bg-gray-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="currentColor" d="M5.84 14.11c-.22-.67-.35-1.38-.35-2.11s.13-1.44.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.83c.87-2.6 3.3-4.51 6.16-4.51z" />
        </svg>
        Entrar con Google
      </Button>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
        <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest"><span className="bg-white px-4 text-gray-400">O con correo</span></div>
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="returnUrl" value={returnUrl} />
        {state?.error && (
          <div className="bg-red-50 text-red-600 p-3 text-xs font-bold uppercase tracking-widest text-center border-l-4 border-red-600">
            {state.error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-600">Correo Electrónico</label>
          <Input name="email" type="email" placeholder="tucorreo@ejemplo.com" required className="h-12 rounded-none border-gray-300 focus-visible:ring-black focus-visible:border-black font-medium" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-600">Contraseña</label>
            <Link href="#" className="text-xs font-bold uppercase tracking-widest text-black underline">¿Olvidaste tu contraseña?</Link>
          </div>
          <Input name="password" type="password" placeholder="••••••••" required className="h-12 rounded-none border-gray-300 focus-visible:ring-black focus-visible:border-black font-medium" />
        </div>

        <TurnstileWidget />

        <Button type="submit" disabled={pending} className="h-14 mt-4 rounded-none bg-black text-white hover:bg-gray-800 uppercase font-black tracking-widest text-sm w-full disabled:opacity-50">
          {pending ? "INICIANDO..." : "Iniciar Sesión"}
        </Button>
      </form>
    </div>
  );
}
