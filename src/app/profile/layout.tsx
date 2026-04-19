import Link from "next/link";
import { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SidebarNav from "./sidebar-nav";

export default async function ProfileLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id }
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-12 min-h-[60vh]">
      {/* Profile Sidebar */}
      <aside className="w-full md:w-64 flex flex-col gap-8 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-black tracking-tight uppercase">MI CUENTA</h2>
          <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-widest">{user.name}</p>
        </div>
        
        <SidebarNav isAdmin={user.role === "ADMIN" || user.role === "MODERATOR"} />
      </aside>
      
      {/* Profile Main Content */}
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}
