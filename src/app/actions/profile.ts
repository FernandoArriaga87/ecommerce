"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ProfileFormState = {
  error?: string;
  success?: boolean;
  returnUrl?: string;
};

export async function completeProfileAction(prevState: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const fullName = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;
  const calle = formData.get("calle") as string;
  const numeroExt = formData.get("numeroExt") as string;
  const numeroInt = formData.get("numeroInt") as string;
  const colonia = formData.get("colonia") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const zipCode = formData.get("zipCode") as string;
  const referencias = formData.get("referencias") as string;
  const returnUrl = (formData.get("returnUrl") as string) || "/profile";

  if (!fullName || fullName.trim().split(/\s+/).length < 2) {
    return { error: "Por favor, ingresa tu nombre completo (nombre y apellido)." };
  }

  if (!phone || !calle || !numeroExt || !colonia || !city || !state || !zipCode) {
    return { error: "Todos los campos principales son obligatorios." };
  }

  const fullAddress = `${calle} #${numeroExt}${numeroInt ? ` Int. ${numeroInt}` : ""}, Col. ${colonia}${referencias ? ` (Ref: ${referencias})` : ""}`;

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return { error: "No autorizado." };
  }

  try {
    const userId = authUser.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        return { error: "No se encontro el usuario en la base de datos oficial" };
    }

    // Update user's name and phone
    await prisma.user.update({
      where: { id: userId },
      data: { 
        name: fullName,
        phone 
      },
    });

    // Check for existing addresses
    const existingAddresses = await prisma.address.findMany({
      where: { userId }
    });

    if (existingAddresses.length > 0) {
      // Update the first address
      await prisma.address.update({
        where: { id: existingAddresses[0].id },
        data: {
          phone,
          address: fullAddress,
          city,
          state,
          zipCode,
          isDefault: true,
        }
      });
    } else {
      // Create the default address
      await prisma.address.create({
        data: {
          userId,
          label: "Domicilio Principal",
          name: fullName,
          phone,
          address: fullAddress,
          city,
          state,
          zipCode,
          isDefault: true,
        },
      });
    }

    revalidatePath("/profile", "layout");
    return { success: true, returnUrl };
  } catch (error) {
    console.error("Error completing profile:", error);
    return { error: "Hubo un error al guardar tu información." };
  }
}

export async function updateProfileSettingsAction(prevState: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;

  if (!name || name.trim().split(/\s+/).length < 2) {
    return { error: "Por favor, ingresa tu nombre completo (nombre y apellido)." };
  }

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return { error: "No autorizado." };
  }

  try {
    const userId = authUser.id;

    await prisma.user.update({
      where: { id: userId },
      data: { name, phone },
    });

    revalidatePath("/profile", "layout");
    return { success: true };
  } catch (error) {
    console.error("Error updating profile settings:", error);
    return { error: "Hubo un error al actualizar tu perfil." };
  }
}

