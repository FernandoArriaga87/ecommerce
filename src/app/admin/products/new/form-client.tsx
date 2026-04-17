"use client";

import { useActionState } from "react";
import { createProductAction, updateProductAction } from "@/app/actions/admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ProductFormClient({ categories, teams, product }: { categories: any[]; teams: any[]; product?: any }) {
  const isEditing = !!product;
  const targetAction = isEditing ? updateProductAction : createProductAction;
  const [state, formAction, pending] = useActionState(targetAction as any, { error: "" });

  return (
    <form action={formAction} className="bg-white border border-gray-200 p-8 flex flex-col gap-6">
      {state?.error && (
        <div className="bg-red-50 text-red-600 p-3 text-xs font-bold uppercase tracking-widest text-center border-l-4 border-red-600">
          {state.error}
        </div>
      )}

      {isEditing && <input type="hidden" name="id" value={product.id} />}
      {isEditing && <input type="hidden" name="existingImageUrl" value={product.images[0] || ""} />}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-600">Nombre del Producto</label>
          <Input name="name" defaultValue={product?.name || ""} type="text" placeholder="Ej. Jersey Local 24/25" required className="h-12 rounded-none border-gray-300 focus-visible:ring-black focus-visible:border-black font-medium" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-600">Identificador URL (Slug)</label>
          <Input name="slug" defaultValue={product?.slug || ""} type="text" placeholder="ej-jersey-local-2425" required className="h-12 rounded-none border-gray-300 focus-visible:ring-black focus-visible:border-black font-medium" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-600">Precio (MXN)</label>
          <Input name="price" defaultValue={product?.price || ""} type="number" min="0" step="0.01" placeholder="1899.00" required className="h-12 rounded-none border-gray-300 focus-visible:ring-black focus-visible:border-black font-medium" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-600">Equipo</label>
          <select name="teamId" defaultValue={product?.teamId || ""} required className="h-12 rounded-none border border-gray-300 focus-visible:ring-black focus-visible:border-black px-3 font-medium bg-transparent">
            <option value="">Selecciona Equipo...</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-600">Categoría</label>
          <select name="categoryId" defaultValue={product?.categoryId || ""} required className="h-12 rounded-none border border-gray-300 focus-visible:ring-black focus-visible:border-black px-3 font-medium bg-transparent">
            <option value="">Selecciona Categoría...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-widest text-gray-600">
          Fotografías de la Playera {isEditing && "(Sube fotos nuevas para reemplazar las actuales)"}
        </label>
        <Input name="imageFiles" type="file" accept="image/png, image/jpeg, image/webp" multiple required={!isEditing} className="h-12 rounded-none border-gray-300 focus-visible:ring-black focus-visible:border-black font-medium file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-zinc-100 file:text-black hover:file:bg-zinc-200 cursor-pointer pt-3" />
        {isEditing && product?.images?.length > 0 && (
          <p className="text-[10px] uppercase font-bold text-gray-400">{product.images.length} Imagen(es) Actual(es) Guardada(s)</p>
        )}
      </div>

      <div className="flex gap-8 border border-gray-200 p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured} className="w-4 h-4 accent-black" />
          <span className="text-xs font-bold uppercase tracking-widest mt-1">Marcar como "Más Vendido"</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="isNew" defaultChecked={product?.isNew} className="w-4 h-4 accent-black" />
          <span className="text-xs font-bold uppercase tracking-widest mt-1">Marcar como "Nuevo"</span>
        </label>
      </div>

      <div className="pt-4 border-t border-gray-200 flex justify-end">
        <Button type="submit" disabled={pending} className="h-14 rounded-none bg-black text-white hover:bg-gray-800 uppercase font-black tracking-widest px-12 disabled:opacity-50">
          {pending ? "GUARDANDO..." : isEditing ? "Actualizar Producto" : "Guardar Producto"}
        </Button>
      </div>
    </form>
  );
}
