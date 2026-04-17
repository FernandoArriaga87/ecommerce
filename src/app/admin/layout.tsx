import Link from "next/link";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
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
