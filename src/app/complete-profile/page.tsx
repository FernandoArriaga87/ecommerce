"use client";

import { useActionState, useEffect } from "react";
import { completeProfileAction, ProfileFormState } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchParams, useRouter } from "next/navigation";

export default function CompleteProfilePage() {
  const initialState: ProfileFormState = { error: "", success: false, returnUrl: "" };
  const [state, formAction, pending] = useActionState(completeProfileAction, initialState);
  const searchParams = useSearchParams();
  const router = useRouter();
  const returnUrl = searchParams.get("returnUrl") || "/profile";

  useEffect(() => {
    if (state.success && state.returnUrl) {
      router.push(state.returnUrl);
    }
  }, [state, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12">
      <div className="w-full max-w-lg flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2">Completar Perfil</h1>
          <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">
            Casi listo. Necesitamos unos datos más para enviar tus pedidos.
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-5 bg-zinc-50 border border-gray-200 p-8">
          {state?.error && (
            <div className="bg-red-50 text-red-600 p-3 text-xs font-bold uppercase tracking-widest text-center border-l-4 border-red-600">
              {state.error}
            </div>
          )}

          <input type="hidden" name="returnUrl" value={returnUrl} />

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-600">Nombre Completo (Nombre y Apellido)</label>
            <Input name="fullName" type="text" placeholder="Ej. Juan Pérez" required className="h-12 rounded-none border-gray-300 focus-visible:ring-black focus-visible:border-black font-medium" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-600">Teléfono (Celular)</label>
            <Input name="phone" type="tel" placeholder="Ej. 55 1234 5678" required className="h-12 rounded-none border-gray-300 focus-visible:ring-black focus-visible:border-black font-medium" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-600">Calle</label>
            <Input name="calle" type="text" placeholder="Ej. Av. Reforma" required className="h-12 rounded-none border-gray-300 focus-visible:ring-black focus-visible:border-black font-medium" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-600">Número Ext.</label>
              <Input name="numeroExt" type="text" placeholder="Ej. 123" required className="h-12 rounded-none border-gray-300 focus-visible:ring-black focus-visible:border-black font-medium" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-600">Número Int. <span className="text-gray-400 lowercase text-[10px]">(Opcional)</span></label>
              <Input name="numeroInt" type="text" placeholder="Ej. A, B, 4" className="h-12 rounded-none border-gray-300 focus-visible:ring-black focus-visible:border-black font-medium" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-600">Colonia</label>
            <Input name="colonia" type="text" placeholder="Ej. Centro" required className="h-12 rounded-none border-gray-300 focus-visible:ring-black focus-visible:border-black font-medium" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-600">Ciudad</label>
              <Input name="city" type="text" placeholder="Ej. Monterrey" required className="h-12 rounded-none border-gray-300 focus-visible:ring-black focus-visible:border-black font-medium" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-600">Estado</label>
              <Input name="state" type="text" placeholder="Ej. Nuevo León" required className="h-12 rounded-none border-gray-300 focus-visible:ring-black focus-visible:border-black font-medium" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-600">Código Postal</label>
            <Input name="zipCode" type="text" placeholder="Ej. 64000" required className="h-12 rounded-none border-gray-300 focus-visible:ring-black focus-visible:border-black font-medium w-1/2" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-600">Referencias <span className="text-gray-400 lowercase text-[10px]">(Opcional pero recomendado)</span></label>
            <textarea 
              name="referencias" 
              placeholder="Ej. Entre calles X y Y, casa con portón verde..." 
              className="min-h-24 p-3 rounded-none border border-gray-300 focus-visible:outline-none focus:border-black focus:ring-1 focus:ring-black font-medium text-sm" 
            />
          </div>

          <Button type="submit" disabled={pending} className="h-14 mt-4 rounded-none bg-black text-white hover:bg-gray-800 uppercase font-black tracking-widest text-sm w-full disabled:opacity-50">
            {pending ? "GUARDANDO..." : "Guardar mis datos"}
          </Button>
        </form>
      </div>
    </div>
  );
}
