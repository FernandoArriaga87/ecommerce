"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateAddressAction(formData: FormData) {
  const addressId = formData.get("addressId") as string;
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const zipCode = formData.get("zipCode") as string;
  const isDefault = formData.get("isDefault") === "on";

  if (!name || name.trim().split(/\s+/).length < 2) {
    return { error: "Por favor, ingresa tu nombre y apellido completo (ej. Juan Pérez)." };
  }

  if (!phone || !address || !city || !state || !zipCode) {
    return { error: "Todos los campos obligatorios deben estar llenos." };
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return { error: "No autorizado" };
  }

  try {
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false }
      });
    }

    if (addressId) {
      await prisma.address.update({
        where: { id: addressId, userId: session.user.id },
        data: { name, phone, address, city, state, zipCode, isDefault }
      });
    } else {
      await prisma.address.create({
        data: {
          userId: session.user.id,
          label: "Domicilio",
          name, phone, address, city, state, zipCode, isDefault
        }
      });
    }

    revalidatePath("/profile/addresses");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Hubo un error guardando la dirección." };
  }
}

export async function deleteAddressAction(formData: FormData) {
  const addressId = formData.get("addressId") as string;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return { error: "No autorizado" };
  }

  try {
    await prisma.address.delete({
      where: { id: addressId, userId: session.user.id }
    });

    revalidatePath("/profile/addresses");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "No se pudo eliminar la dirección." };
  }
}
