"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email y contraseña son obligatorios." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  let needsCompletion = false;
  if (error) {
    return { error: "Credenciales inválidas." };
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { addresses: true }
      });
      if (dbUser && (!dbUser.phone || dbUser.addresses.length === 0)) {
        needsCompletion = true;
      }
    }
  }

  revalidatePath("/", "layout");
  if (needsCompletion) {
    redirect("/complete-profile?returnUrl=/profile");
  } else {
    redirect("/profile");
  }
}

export async function registerAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !name) {
    return { error: "Todos los campos son obligatorios." };
  }

  const supabase = await createClient();

  // 1. Crear el usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  // 2. Insertarlo oficialmente en la tabla de Prisma
  if (authData.user) {
    try {
      await prisma.user.create({
        data: {
          id: authData.user.id, // Forzamos que nuestro UUID sea igual al de Supabase
          email: authData.user.email!,
          password: "ENCRYPTED_BY_SUPABASE", // No guardamos pass, Supabase lo hace, pero el campo string lo pide el modelo (si no lo pusiste optional).
          name: name,
        },
      });
    } catch (dbError) {
      console.error("Error copiando usuario a Prisma:", dbError);
      return { error: "Usuario creado en Auth pero falló el registro temporal en DB." };
    }
  }

  revalidatePath("/", "layout");
  redirect("/complete-profile?returnUrl=/profile");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
