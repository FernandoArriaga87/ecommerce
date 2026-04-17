import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight">Usuarios</h1>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Directorio y Roles</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 overflow-x-auto rounded-none">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 border-b border-gray-200 text-xs text-gray-600 uppercase tracking-widest font-bold">
            <tr>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Correo</th>
              <th className="px-6 py-4">Rol</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acceso</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest">
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-bold uppercase text-xs">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {user.role === 'ADMIN' ? (
                      <span className="bg-black text-white text-[10px] px-2 py-1 font-bold tracking-widest">ADMIN</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 font-bold tracking-widest">CLIENTE</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.status === 'ACTIVE' ? (
                      <span className="text-green-600 text-[10px] font-black tracking-widest uppercase">Activo</span>
                    ) : (
                      <span className="text-red-600 text-[10px] font-black tracking-widest uppercase">{user.status}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-[10px] font-bold text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
