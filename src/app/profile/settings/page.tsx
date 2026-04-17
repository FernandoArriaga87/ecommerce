import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileSettingsForm } from "./profile-settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
    }
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-black uppercase tracking-tight mb-8 border-b-2 border-gray-100 pb-4">
        Configuración
      </h1>

      <ProfileSettingsForm initialData={user} />
    </div>
  );
}
