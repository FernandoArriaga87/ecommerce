"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActionState } from "react";
import { requestPasswordResetAction } from "@/app/actions/auth";
import { TurnstileWidget } from "@/components/turnstile-widget";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, {
    error: "",
    success: "",
  } as { error?: string; success?: string });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state?.error && (
        <div className="bg-red-50 text-red-600 p-3 text-xs font-bold uppercase tracking-widest text-center border-l-4 border-red-600">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="bg-green-50 text-green-700 p-3 text-xs font-bold uppercase tracking-widest text-center border-l-4 border-green-600">
          {state.success}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-widest text-gray-600">Correo Electrónico</label>
        <Input
          name="email"
          type="email"
          placeholder="tucorreo@ejemplo.com"
          required
          className="h-12 rounded-none border-gray-300 focus-visible:ring-black focus-visible:border-black font-medium"
        />
      </div>

      <TurnstileWidget />

      <Button
        type="submit"
        disabled={pending}
        className="h-14 mt-4 rounded-none bg-black text-white hover:bg-gray-800 uppercase font-black tracking-widest text-sm w-full disabled:opacity-50"
      >
        {pending ? "ENVIANDO..." : "Enviar enlace"}
      </Button>
    </form>
  );
}
