"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkActionRateLimit } from "@/lib/rate-limit-action";

export async function loginAction(prevState: any, formData: FormData) {
  if (!(await checkActionRateLimit("auth"))) {
    return { error: "Demasiados intentos. Intenta de nuevo en un minuto." };
  }

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

  if (error) {
    return { error: "Credenciales inválidas." };
  }

  revalidatePath("/", "layout");
  redirect("/profile");
}

export async function registerAction(prevState: any, formData: FormData) {
  if (!(await checkActionRateLimit("auth"))) {
    return { error: "Demasiados intentos. Intenta de nuevo en un minuto." };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !name) {
    return { error: "Todos los campos son obligatorios." };
  }

  const supabase = await createClient();

  const { error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  const returnUrl = formData.get("returnUrl") as string || "/profile";

  if (authError) {
    // Generic message to avoid account enumeration via error text
    // ("User already registered" vs "Invalid email", etc.).
    console.error("[registerAction] supabase error:", authError.message);
    return { error: "No pudimos crear tu cuenta. Verifica los datos o intenta más tarde." };
  }

  // Nota: La sincronización con Prisma se hace vía Webhook de Supabase
  // para garantizar consistencia incluso si falla la respuesta aquí.

  revalidatePath("/", "layout");
  redirect(`/complete-profile?returnUrl=${encodeURIComponent(returnUrl)}`);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
