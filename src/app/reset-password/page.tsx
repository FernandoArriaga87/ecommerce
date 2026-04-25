import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./reset-password-form";
import { TurnstileScript } from "@/components/turnstile-script";

// Belt-and-suspenders: middleware already gates /reset-password behind auth,
// but if someone hits this URL without coming through the email callback,
// bounce them to /login rather than rendering a form that would fail on submit.
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=link_expired");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12">
      <TurnstileScript />
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2">Nueva Contraseña</h1>
          <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">
            Elige una contraseña segura para tu cuenta.
          </p>
        </div>

        <ResetPasswordForm />
      </div>
    </div>
  );
}
