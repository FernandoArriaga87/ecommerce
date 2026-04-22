"use client";

import { useActionState, useState } from "react";
import { createProductAction, updateProductAction } from "@/app/actions/admin";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash, X, CaretLeft, CaretRight } from "@phosphor-icons/react";

interface VariantInput {
  size: string;
  stock: number;
}

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function ProductFormClient({ categories, teams, product }: { categories: any[]; teams: any[]; product?: any }) {
  const isEditing = !!product;
  const targetAction = isEditing ? updateProductAction : createProductAction;
  const [state, formAction, pending] = useActionState(targetAction as any, { error: "" });

  const [variants, setVariants] = useState<VariantInput[]>(
    product?.variants.map((v: any) => ({
      size: v.size,
      stock: v.stock
    })) || [{ size: "M", stock: 10 }]
  );

  const [imageUrls, setImageUrls] = useState<string[]>(product?.images || []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const addVariant = () => {
    setVariants([...variants, { size: "M", stock: 10 }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof VariantInput, value: string | number) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadError(null);
    setUploading(true);

    try {
      const supabase = createClient();
      const uploaded: string[] = [];

      for (const file of files) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setUploadError(`Formato no permitido en "${file.name}". Usa PNG, JPEG o WebP.`);
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          setUploadError(`"${file.name}" excede 8 MB.`);
          return;
        }

        const ext = (file.name.split(".").pop() || "bin").toLowerCase();
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;

        const { error } = await supabase.storage
          .from("products")
          .upload(fileName, file, { cacheControl: "3600", upsert: false });

        if (error) {
          setUploadError(`Fallo al subir "${file.name}": ${error.message}`);
          return;
        }

        const { data } = supabase.storage.from("products").getPublicUrl(fileName);
        uploaded.push(data.publicUrl);
      }

      setImageUrls((prev) => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: "left" | "right") => {
    const newUrls = [...imageUrls];
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newUrls.length) return;
    
    [newUrls[index], newUrls[targetIndex]] = [newUrls[targetIndex], newUrls[index]];
    setImageUrls(newUrls);
  };

  const canSubmit = !pending && !uploading && imageUrls.length > 0;

  return (
    <form action={formAction} className="bg-white border border-gray-200 p-8 flex flex-col gap-6">
      {state?.error && (
        <div className="bg-red-50 text-red-600 p-3 text-xs font-bold uppercase tracking-widest text-center border-l-4 border-red-600">
          {state.error}
        </div>
      )}

      {isEditing && <input type="hidden" name="id" value={product.id} />}

      <input type="hidden" name="variantsJson" value={JSON.stringify(variants)} />
      <input type="hidden" name="imageUrlsJson" value={JSON.stringify(imageUrls)} />

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
          <Input 
            name="price" 
            defaultValue={product?.price || ""} 
            type="number" 
            min="0" 
            step="0.01" 
            placeholder="1899.00" 
            required 
            disabled={isEditing}
            className="h-12 rounded-none border-gray-300 focus-visible:ring-black focus-visible:border-black font-medium disabled:bg-zinc-50 disabled:text-gray-400 cursor-not-allowed" 
          />
          {isEditing && <p className="text-[9px] uppercase font-bold text-gray-400">El precio no es editable por seguridad.</p>}
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
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-white p-3 border border-gray-200">
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

      <div className="flex flex-col gap-3">
        <label className="text-xs font-bold uppercase tracking-widest text-gray-600">
          Fotografías de la Playera {isEditing && "(Sube fotos nuevas para reemplazar las actuales)"}
        </label>
        <Input
          type="file"
          accept="image/png, image/jpeg, image/webp"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
          className="h-12 rounded-none border-gray-300 focus-visible:ring-black focus-visible:border-black font-medium file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-zinc-100 file:text-black hover:file:bg-zinc-200 cursor-pointer pt-3"
        />
        {uploading && <p className="text-[11px] uppercase font-bold tracking-widest text-gray-500">Subiendo imágenes…</p>}
        {uploadError && <p className="text-[11px] uppercase font-bold tracking-widest text-red-600">{uploadError}</p>}

        {imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-2">
            {imageUrls.map((url, i) => (
              <div key={url} className="group relative w-32 h-32 border border-gray-300 bg-zinc-50 rounded-lg overflow-hidden shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Imagen ${i + 1}`} className="w-full h-full object-cover" />
                
                {/* Delete button (Top Right) */}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-black/80 text-white w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-600 transition-colors z-10"
                  aria-label="Quitar imagen"
                >
                  <X size={12} weight="bold" />
                </button>

                {/* Move Controls (Bottom) */}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/40 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => moveImage(i, "left")}
                    className="text-white hover:text-blue-400 disabled:opacity-20"
                  >
                    <CaretLeft size={20} weight="bold" />
                  </button>
                  <span className="text-[10px] text-white font-black">{i + 1}</span>
                  <button
                    type="button"
                    disabled={i === imageUrls.length - 1}
                    onClick={() => moveImage(i, "right")}
                    className="text-white hover:text-blue-400 disabled:opacity-20"
                  >
                    <CaretRight size={20} weight="bold" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {imageUrls.length === 0 && (
          <p className="text-[10px] uppercase font-bold text-gray-400">Debes subir al menos una imagen.</p>
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
        <Button type="submit" disabled={!canSubmit} className="h-14 rounded-none bg-black text-white hover:bg-gray-800 uppercase font-black tracking-widest px-12 disabled:opacity-50">
          {pending ? "GUARDANDO..." : uploading ? "SUBIENDO..." : isEditing ? "Actualizar Producto" : "Guardar Producto"}
        </Button>
      </div>
    </form>
  );
}
