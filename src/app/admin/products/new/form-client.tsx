"use client";

import { useActionState, useState } from "react";
import { createProductAction, updateProductAction } from "@/app/actions/admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "@phosphor-icons/react";

interface VariantInput {
  color: string;
  size: string;
  stock: number;
}

export function ProductFormClient({ categories, teams, product }: { categories: any[]; teams: any[]; product?: any }) {
  const isEditing = !!product;
  const targetAction = isEditing ? updateProductAction : createProductAction;
  const [state, formAction, pending] = useActionState(targetAction as any, { error: "" });

  const [variants, setVariants] = useState<VariantInput[]>(
    product?.variants.map((v: any) => ({
      color: v.color,
      size: v.size,
      stock: v.stock
    })) || [{ color: "Única", size: "M", stock: 10 }]
  );

  const addVariant = () => {
    setVariants([...variants, { color: "Única", size: "M", stock: 10 }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof VariantInput, value: string | number) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  return (
    <form action={formAction} className="bg-white border border-gray-200 p-8 flex flex-col gap-6">
      {state?.error && (
        <div className="bg-red-50 text-red-600 p-3 text-xs font-bold uppercase tracking-widest text-center border-l-4 border-red-600">
          {state.error}
        </div>
      )}

      {isEditing && <input type="hidden" name="id" value={product.id} />}
      {isEditing && <input type="hidden" name="existingImageUrl" value={product.images[0] || ""} />}
      
      {/* Pasar variantes como JSON */}
      <input type="hidden" name="variantsJson" value={JSON.stringify(variants)} />

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

      {/* Variantes Management */}
      <div className="flex flex-col gap-4 border border-zinc-100 p-4 bg-zinc-50/50">
        <div className="flex justify-between items-center">
          <label className="text-xs font-black uppercase tracking-widest text-black">Inventario y Variantes (Tallas/Stock)</label>
          <Button type="button" onClick={addVariant} variant="outline" className="h-8 rounded-none border-black text-[10px] font-black uppercase px-3 gap-2">
            <Plus size={14} weight="bold" /> Agregar Variante
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {variants.map((variant, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end bg-white p-3 border border-gray-200">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-gray-400">Color</span>
                <Input value={variant.color} onChange={(e) => updateVariant(index, 'color', e.target.value)} placeholder="Ej. Local" className="h-9 rounded-none text-xs border-gray-200" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-gray-400">Talla</span>
                <Input value={variant.size} onChange={(e) => updateVariant(index, 'size', e.target.value)} placeholder="S, M, L..." className="h-9 rounded-none text-xs border-gray-200" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-gray-400">Stock</span>
                <Input type="number" value={variant.stock} onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value))} placeholder="0" className="h-9 rounded-none text-xs border-gray-200" />
              </div>
              <Button type="button" onClick={() => removeVariant(index)} disabled={variants.length === 1} variant="ghost" className="h-9 rounded-none text-red-500 hover:text-red-700 hover:bg-red-50 gap-2 text-[10px] font-black uppercase">
                <Trash size={14} /> Eliminar
              </Button>
            </div>
          ))}
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
