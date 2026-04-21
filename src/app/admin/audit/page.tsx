import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 50;

const ENTITY_LABEL: Record<string, string> = {
  PRODUCT: "Productos",
  ORDER: "Pedidos",
  REVIEW: "Reseñas",
  USER: "Usuarios",
};

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const skip = (currentPage - 1) * PAGE_SIZE;

  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: { actor: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight">Auditoría</h1>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">
            Registro de acciones administrativas · {totalCount} entradas
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 overflow-x-auto shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 border-b border-gray-200 text-[10px] text-gray-400 uppercase tracking-widest font-black">
            <tr>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Admin</th>
              <th className="px-6 py-4">Entidad</th>
              <th className="px-6 py-4">Acción</th>
              <th className="px-6 py-4">Afectados</th>
              <th className="px-6 py-4">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest">
                  Aún no hay actividad registrada
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-zinc-50 transition-colors align-top">
                  <td className="px-6 py-4 text-[11px] text-gray-500 font-mono whitespace-nowrap">
                    {log.createdAt.toLocaleString("es-MX")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-gray-700">{log.actor.name}</div>
                    <div className="text-[10px] text-gray-500">{log.actor.email}</div>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-600">
                    {ENTITY_LABEL[log.entityType] ?? log.entityType}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block bg-black text-white text-[10px] px-2 py-1 font-bold tracking-widest">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-bold text-gray-700">
                    {log.entityIds.length}
                  </td>
                  <td className="px-6 py-4 text-[10px] font-mono text-gray-500 max-w-[300px] truncate">
                    {log.metadata ? JSON.stringify(log.metadata) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 text-[10px] font-black uppercase tracking-widest text-gray-500">
          <span>
            Página {currentPage} / {totalPages}
          </span>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <a
                href={`/admin/audit?page=${currentPage - 1}`}
                className="border border-gray-300 px-3 py-1.5 hover:bg-black hover:text-white hover:border-black transition-colors"
              >
                ← Anterior
              </a>
            )}
            {currentPage < totalPages && (
              <a
                href={`/admin/audit?page=${currentPage + 1}`}
                className="border border-gray-300 px-3 py-1.5 hover:bg-black hover:text-white hover:border-black transition-colors"
              >
                Siguiente →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
