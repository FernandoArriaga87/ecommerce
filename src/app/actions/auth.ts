"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(ip: string) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  // Cleanup old entries
  if (Math.random() < 0.1) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetAt) rateLimitMap.delete(k);
    }
  }

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return false;
  }

  entry.count++;
  return true;
}

export async function loginAction(prevState: any, formData: FormData) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip)) {
    return { error: "Demasiados intentos. Por favor, intenta de nuevo en un minuto." };
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
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip)) {
    return { error: "Demasiados intentos. Por favor, intenta de nuevo en un minuto." };
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
    return { error: authError.message };
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
