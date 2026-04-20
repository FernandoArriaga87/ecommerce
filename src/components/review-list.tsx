import { prisma } from "@/lib/prisma";
import { StarDisplay } from "@/components/star-rating";

function formatDate(d: Date) {
  return d.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function ReviewList({ productId }: { productId: string }) {
  const reviews = await prisma.review.findMany({
    where: { productId, isHidden: false },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      user: { select: { name: true } },
    },
  });

  if (reviews.length === 0) {
    return (
      <section className="mt-16 pt-16 border-t border-[#111111]/5">
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-4">
          Reseñas
        </h2>
        <p className="text-sm text-[#111111]/50">
          Aún no hay reseñas para este producto. Compra y sé el primero en reseñar.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-16 pt-16 border-t border-[#111111]/5">
      <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-10">
        Reseñas de clientes
      </h2>

      <div className="space-y-8">
        {reviews.map((r) => {
          const initials = r.user.name
            .split(" ")
            .map((s) => s[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase();

          return (
            <article key={r.id} className="flex gap-4">
              <div className="shrink-0 w-11 h-11 rounded-full bg-[#111111]/5 flex items-center justify-center text-[10px] font-black tracking-widest text-[#111111]/60">
                {initials || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <header className="flex flex-wrap items-center gap-3 mb-1.5">
                  <StarDisplay rating={r.rating} size={14} />
                  <span className="text-xs font-bold text-[#111111]">
                    {r.user.name.split(" ")[0]}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    Compra verificada
                  </span>
                  <time className="text-[10px] text-[#111111]/40">
                    {formatDate(r.createdAt)}
                  </time>
                </header>
                {r.title && (
                  <h3 className="text-sm font-bold text-[#111111] mb-1">{r.title}</h3>
                )}
                <p className="text-sm text-[#111111]/70 leading-relaxed whitespace-pre-line break-words">
                  {r.body}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
