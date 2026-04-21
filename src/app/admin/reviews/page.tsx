import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StarDisplay } from "@/components/star-rating";
import { ReviewVisibilityToggle } from "./visibility-toggle";
import { BulkSelectionProvider } from "@/components/admin/bulk/bulk-provider";
import { BulkCheckbox, BulkHeaderCheckbox } from "@/components/admin/bulk/bulk-checkbox";
import { BulkActionsBar } from "@/components/admin/bulk/bulk-actions-bar";
import { ReviewBulkActions } from "@/components/admin/bulk/review-bulk-actions";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { id: true, name: true } },
    },
  });

  const reviewIds = reviews.map((r) => r.id);

  return (
    <BulkSelectionProvider>
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight">Reseñas</h1>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">
              Moderación · {reviews.length} en total
            </p>
          </div>
        </div>

        <BulkActionsBar label="reseña(s) seleccionada(s)">
          <ReviewBulkActions />
        </BulkActionsBar>

        <div className="bg-white border border-gray-200 overflow-x-auto shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 border-b border-gray-200 text-[10px] text-gray-400 uppercase tracking-widest font-black">
              <tr>
                <th className="px-4 py-4 w-10">
                  <BulkHeaderCheckbox ids={reviewIds} />
                </th>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Reseña</th>
                <th className="px-6 py-4">Visible</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest">
                    Aún no hay reseñas
                  </td>
                </tr>
              ) : (
                reviews.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-b border-gray-100 hover:bg-zinc-50 transition-colors ${
                      r.isHidden ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-4 py-4 w-10">
                      <BulkCheckbox id={r.id} label={`Seleccionar reseña de ${r.user.name}`} />
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <Link
                        href={`/producto/${r.product.id}`}
                        target="_blank"
                        className="text-xs font-bold text-gray-700 hover:underline line-clamp-2"
                      >
                        {r.product.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-gray-700">{r.user.name}</div>
                      <div className="text-[10px] text-gray-500">{r.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <StarDisplay rating={r.rating} size={14} />
                    </td>
                    <td className="px-6 py-4 max-w-[400px]">
                      {r.title && (
                        <p className="text-xs font-bold text-gray-700 mb-1">{r.title}</p>
                      )}
                      <p className="text-xs text-gray-600 line-clamp-3">{r.body}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {r.createdAt.toLocaleDateString("es-MX")}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <ReviewVisibilityToggle reviewId={r.id} isHidden={r.isHidden} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </BulkSelectionProvider>
  );
}
