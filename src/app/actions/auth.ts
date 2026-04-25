"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkActionRateLimit } from "@/lib/rate-limit-action";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { getSiteUrl } from "@/lib/site-url";

async function getClientIp(): Promise<string> {
  return (
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

// Defense-in-depth: la política "real" se configura en el dashboard de Supabase
// (Auth → Providers → Email → Minimum password length / complexity). Este check
// server-side garantiza un piso aunque alguien toque esa config por accidente.
const PASSWORD_MIN_LENGTH = 8;

function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (password.length > 72) {
    // bcrypt (usado por Supabase) trunca a 72 bytes — evita sorpresas al usuario.
    return "La contraseña es demasiado larga (máximo 72 caracteres).";
  }
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return "La contraseña debe incluir al menos una letra y un número.";
  }
  return null;
}

export async function loginAction(prevState: any, formData: FormData) {
  if (!(await checkActionRateLimit("auth"))) {
    return { error: "Demasiados intentos. Intenta de nuevo en un minuto." };
  }

  const captchaToken = (formData.get("cf-turnstile-response") as string) || null;
  const captchaOk = await verifyTurnstileToken(captchaToken, await getClientIp());
  if (!captchaOk) {
    return { error: "Verificación de seguridad fallida. Recarga la página e intenta de nuevo." };
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

  const captchaToken = (formData.get("cf-turnstile-response") as string) || null;
  const captchaOk = await verifyTurnstileToken(captchaToken, await getClientIp());
  if (!captchaOk) {
    return { error: "Verificación de seguridad fallida. Recarga la página e intenta de nuevo." };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !name) {
    return { error: "Todos los campos son obligatorios." };
  }

  const pwError = validatePassword(password);
  if (pwError) return { error: pwError };

  const returnUrl = (formData.get("returnUrl") as string) || "/profile";

  const supabase = await createClient();

  // PKCE: emailRedirectTo must point at the canonical /auth/callback origin
  // registered in the Supabase dashboard. The `next` param is what the
  // callback uses after exchangeCodeForSession to land the user in the right
  // place (here: /complete-profile, since this is a brand new account).
  const emailRedirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(
    `/complete-profile?returnUrl=${encodeURIComponent(returnUrl)}`
  )}`;

  const { error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo,
    },
  });

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

// ───────────── Password recovery ─────────────

export async function requestPasswordResetAction(prevState: any, formData: FormData) {
  if (!(await checkActionRateLimit("auth"))) {
    return { error: "Demasiados intentos. Intenta de nuevo en un minuto." };
  }

  const captchaToken = (formData.get("cf-turnstile-response") as string) || null;
  const captchaOk = await verifyTurnstileToken(captchaToken, await getClientIp());
  if (!captchaOk) {
    return { error: "Verificación de seguridad fallida. Recarga la página e intenta de nuevo." };
  }

  const email = formData.get("email") as string;
  if (!email) {
    return { error: "El correo es obligatorio." };
  }

  const supabase = await createClient();

  const redirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent("/reset-password")}`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    // Log internally but never leak whether the email exists or not.
    console.error("[requestPasswordResetAction] supabase error:", error.message);
  }

  // Always return success to avoid account enumeration.
  return {
    success: "Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y la carpeta de spam.",
  };
}

export async function updatePasswordAction(prevState: any, formData: FormData) {
  if (!(await checkActionRateLimit("auth"))) {
    return { error: "Demasiados intentos. Intenta de nuevo en un minuto." };
  }

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return { error: "Ambos campos son obligatorios." };
  }
  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  const pwError = validatePassword(password);
  if (pwError) return { error: pwError };

  const supabase = await createClient();

  // The recovery link landed in /auth/callback which already established a
  // session via exchangeCodeForSession. updateUser uses that session.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Tu sesión expiró. Solicita un nuevo enlace de recuperación." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("[updatePasswordAction] supabase error:", error.message);
    return { error: "No pudimos actualizar tu contraseña. Intenta de nuevo." };
  }

  revalidatePath("/", "layout");
  redirect("/profile?password_updated=1");
}
