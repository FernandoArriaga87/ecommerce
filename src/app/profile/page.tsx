import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      addresses: {
        where: { isDefault: true },
        take: 1
      }
    }
  });

  if (!user) {
    redirect("/login");
  }

  const defaultAddress = user.addresses[0];

  return (
    <div className="w-full">
      <h1 className="text-3xl font-black uppercase tracking-tight mb-8 border-b-2 border-gray-100 pb-4">
        Resumen de mi cuenta
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-zinc-50 border border-gray-200 p-8">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Información Personal</h3>
          <p className="text-gray-600 font-medium mb-1">{user.name}</p>
          <p className="text-gray-600 font-medium mb-6">{user.email}</p>
          
          <Link 
            href="/profile/settings" 
            className={buttonVariants({ variant: "outline", className: "rounded-none border-black text-black font-bold text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-colors" })}
          >
            Editar Perfil
          </Link>
        </div>

        <div className="bg-zinc-50 border border-gray-200 p-8">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Dirección Predeterminada</h3>
          {defaultAddress ? (
            <>
              <p className="text-gray-600 font-medium mb-1">{defaultAddress.address}</p>
              <p className="text-gray-600 font-medium mb-1">{defaultAddress.city}, {defaultAddress.state} {defaultAddress.zipCode}</p>
              <p className="text-gray-600 font-medium mb-6">Tel: {defaultAddress.phone}</p>
            </>
          ) : (
             <p className="text-gray-400 font-medium mb-6 italic">Aún no has registrado una dirección.</p>
          )}
          
          <Link 
            href="/profile/addresses" 
            className={buttonVariants({ variant: "outline", className: "rounded-none border-black text-black font-bold text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-colors" })}
          >
            Gestionar Direcciones
          </Link>
        </div>
      </div>
    </div>
  );
}
