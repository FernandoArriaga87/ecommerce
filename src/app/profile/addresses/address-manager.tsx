"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateAddressAction, deleteAddressAction } from "@/app/actions/addresses";

type Address = {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
};

export function AddressManager({ initialAddresses }: { initialAddresses: Address[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await updateAddressAction(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setEditingId(null);
      setIsAdding(false);
      // Let server component re-fetch by triggering a refresh / revalidate via server action automatically
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta dirección?")) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("addressId", id);
    const result = await deleteAddressAction(formData);
    if (result.error) setError(result.error);
    setLoading(false);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8 border-b-2 border-gray-100 pb-4">
        <h1 className="text-3xl font-black uppercase tracking-tight">Mis Direcciones</h1>
        {!isAdding && !editingId && (
          <Button onClick={() => setIsAdding(true)} className="rounded-none bg-black text-white hover:bg-gray-800 font-bold uppercase tracking-widest text-xs">
            + Agregar Nueva
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 font-bold uppercase text-xs tracking-widest mb-6">
          {error}
        </div>
      )}

      {(isAdding || editingId) && (
        <div className="bg-zinc-50 border border-gray-200 p-8 mb-8">
          <h3 className="text-sm font-black uppercase tracking-widest mb-6">
            {isAdding ? "Nueva Dirección" : "Editar Dirección"}
          </h3>
          <form key={editingId || "new"} onSubmit={handleSubmit} className="flex flex-col gap-5">
            <input type="hidden" name="addressId" value={editingId || ""} />
            <p className="text-xs text-gray-500 mb-2 italic">Asegúrate de poner tu nombre y apellido correctos para que la paquetería lo acepte.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Nombre Completo</label>
                <Input name="name" defaultValue={initialAddresses.find(a => a.id === editingId)?.name || ""} required placeholder="Juan Pérez" className="rounded-none" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Teléfono</label>
                <Input name="phone" defaultValue={initialAddresses.find(a => a.id === editingId)?.phone || ""} required placeholder="5512345678" className="rounded-none" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Dirección Completa (Calle, No. Ext, No. Int)</label>
              <Input name="address" defaultValue={initialAddresses.find(a => a.id === editingId)?.address || ""} required className="rounded-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Ciudad</label>
                <Input name="city" defaultValue={initialAddresses.find(a => a.id === editingId)?.city || ""} required className="rounded-none" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Estado</label>
                <Input name="state" defaultValue={initialAddresses.find(a => a.id === editingId)?.state || ""} required className="rounded-none" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">C.P.</label>
                <Input name="zipCode" defaultValue={initialAddresses.find(a => a.id === editingId)?.zipCode || ""} required className="rounded-none" />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" name="isDefault" defaultChecked={initialAddresses.find(a => a.id === editingId)?.isDefault || isAdding} id="isDefault" />
              <label htmlFor="isDefault" className="text-xs font-medium">Establecer como dirección predeterminada</label>
            </div>

            <div className="flex gap-4 mt-6">
              <Button type="submit" disabled={loading} className="rounded-none bg-black text-white hover:bg-gray-800 font-bold uppercase tracking-widest text-xs">
                {loading ? "Guardando..." : "Guardar"}
              </Button>
              <Button type="button" disabled={loading} variant="outline" onClick={() => { setIsAdding(false); setEditingId(null); }} className="rounded-none font-bold uppercase tracking-widest text-xs">
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {initialAddresses.length === 0 && !isAdding && (
        <div className="bg-zinc-50 border border-gray-200 p-8 text-center">
          <p className="text-gray-500 font-medium tracking-wide uppercase text-sm">
            No tienes direcciones guardadas.
          </p>
        </div>
      )}

      {initialAddresses.length > 0 && !isAdding && !editingId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {initialAddresses.map((address) => (
            <div key={address.id} className="bg-zinc-50 border border-gray-200 p-6 relative flex flex-col items-start gap-4">
              {address.isDefault && (
                <span className="absolute top-4 right-4 bg-black text-white text-[9px] font-black uppercase tracking-widest px-2 py-1">
                  PREDETERMINADA
                </span>
              )}
              <div className="w-full">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4">{address.label || "Dirección"}</h3>
                <p className="text-gray-600 font-medium mb-1">{address.name}</p>
                <p className="text-gray-600 font-medium mb-1">{address.address}</p>
                <p className="text-gray-600 font-medium mb-1">{address.city}, {address.state} {address.zipCode}</p>
                <p className="text-gray-600 font-medium mb-0">Tel: {address.phone}</p>
              </div>
              <div className="flex gap-3 w-full border-t border-gray-200 pt-4 mt-auto">
                <Button variant="outline" size="sm" onClick={() => setEditingId(address.id)} className="rounded-none font-bold uppercase tracking-widest text-[10px] flex-1">
                  Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(address.id)} className="rounded-none text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 font-bold uppercase tracking-widest text-[10px] flex-1">
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
