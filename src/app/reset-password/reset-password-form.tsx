"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActionState } from "react";
import { updatePasswordAction } from "@/app/actions/auth";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, { error: "" });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state?.error && (
        <div className="bg-red-50 text-red-600 p-3 text-xs font-bold uppercase tracking-widest text-center border-l-4 border-red-600">
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-widest text-gray-600">Nueva Contraseña</label>
        <Input
          name="password"
          type="password"
          minLength={8}
          placeholder="••••••••"
          required
          className="h-12 rounded-none border-gray-300 focus-visible:ring-black focus-visible:border-black font-medium"
        />
        <p className="text-[10px] text-gray-500 font-medium tracking-wide">
          Mínimo 8 caracteres, incluyendo al menos una letra y un número.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-widest text-gray-600">Confirmar Contraseña</label>
        <Input
          name="confirmPassword"
          type="password"
          minLength={8}
          placeholder="••••••••"
          required
          className="h-12 rounded-none border-gray-300 focus-visible:ring-black focus-visible:border-black font-medium"
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="h-14 mt-4 rounded-none bg-black text-white hover:bg-gray-800 uppercase font-black tracking-widest text-sm w-full disabled:opacity-50"
      >
        {pending ? "ACTUALIZANDO..." : "Guardar Contraseña"}
      </Button>
    </form>
  );
}
