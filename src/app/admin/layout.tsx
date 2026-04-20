import Link from "next/link";
import { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-zinc-50 text-black">
      {/* Sidebar sidebar */}
      <aside className="w-full md:w-64 bg-black text-white flex flex-col p-6 border-r border-gray-800">
        <div className="mb-10 mt-4">
          <h2 className="text-2xl font-black tracking-tight uppercase">Admin Panel</h2>
          <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-widest">DeportivoStore</p>
        </div>
        
        <nav className="flex flex-col gap-4 font-bold text-sm tracking-widest uppercase">
          <Link href="/admin" className="text-white hover:text-gray-300 transition-colors">Dashboard</Link>
          <Link href="/admin/products" className="text-gray-400 hover:text-white transition-colors">Productos</Link>
          <Link href="/admin/payments" className="text-gray-400 hover:text-white transition-colors">Pedidos</Link>
          <Link href="/admin/reviews" className="text-gray-400 hover:text-white transition-colors">Reseñas</Link>
          <Link href="/admin/users" className="text-gray-400 hover:text-white transition-colors">Usuarios</Link>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto w-full">
        {children}
      </main>
    </div>
  );
}
