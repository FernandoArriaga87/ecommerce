"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";

export default function SidebarNav() {
  const pathname = usePathname();

  const links = [
    { href: "/profile", label: "Resumen" },
    { href: "/profile/orders", label: "Mis Pedidos" },
    { href: "/profile/addresses", label: "Direcciones" },
    { href: "/profile/settings", label: "Configuración" },
  ];

  return (
    <nav className="flex flex-col gap-4 font-bold text-sm tracking-widest uppercase">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link 
            key={link.href}
            href={link.href} 
            className={`${isActive ? "text-black" : "text-gray-400 hover:text-black"} transition-colors`}
          >
            {link.label}
          </Link>
        );
      })}
      
      <form action={logoutAction} className="mt-8">
        <button type="submit" className="text-red-500 hover:text-red-700 transition-colors uppercase font-bold text-sm tracking-widest text-left w-full">
          Cerrar Sesión
        </button>
      </form>
    </nav>
  );
}
