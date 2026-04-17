"use client";

import { useActionState, useEffect, useState } from "react";
import { updateProfileSettingsAction, ProfileFormState } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProfileSettingsForm({ initialData }: { initialData: { name: string, email: string, phone: string | null } }) {
  const [state, formAction, pending] = useActionState(updateProfileSettingsAction, { success: false, error: "" });
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.success]);

  return (
    <div className="bg-zinc-50 border border-gray-200 p-8">
      <form action={formAction} className="flex flex-col gap-6">
        {state.error && (
          <div className="bg-red-50 text-red-600 p-3 text-xs font-bold uppercase tracking-widest text-center border-l-4 border-red-600">
            {state.error}
          </div>
        )}

        {showSuccess && (
          <div className="bg-green-50 text-green-600 p-3 text-xs font-bold uppercase tracking-widest text-center border-l-4 border-green-600">
            ¡Perfil actualizado con éxito!
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-600">Email (No editable)</label>
          <Input value={initialData.email} disabled className="h-12 rounded-none border-gray-200 bg-gray-100 font-medium opacity-60" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-600">Nombre Completo</label>
          <Input name="name" defaultValue={initialData.name} required className="h-12 rounded-none border-gray-300 focus-visible:ring-black focus-visible:border-black font-medium" />
          <p className="text-[10px] text-gray-400 italic">Debe incluir nombre y apellido para envíos válidos.</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-600">Teléfono</label>
          <Input name="phone" type="tel" defaultValue={initialData.phone || ""} required className="h-12 rounded-none border-gray-300 focus-visible:ring-black focus-visible:border-black font-medium" />
        </div>

        <Button type="submit" disabled={pending} className="h-14 mt-4 rounded-none bg-black text-white hover:bg-gray-800 uppercase font-black tracking-widest text-sm w-full disabled:opacity-50">
          {pending ? "GUARDANDO..." : "Actualizar mis datos"}
        </Button>
      </form>
    </div>
  );
}
