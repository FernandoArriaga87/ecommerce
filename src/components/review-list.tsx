import { prisma } from "@/lib/prisma";
import { StarDisplay } from "@/components/star-rating";
import { getPlaceholderReviews } from "@/lib/placeholder-reviews";

function formatDate(d: Date) {
  return d.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function relativeDate(d: Date) {
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return "hoy";
  if (diffDays < 7) return `hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;
  if (diffDays < 30) {
    const w = Math.floor(diffDays / 7);
    return `hace ${w} ${w === 1 ? "semana" : "semanas"}`;
  }
  if (diffDays < 365) {
    const m = Math.floor(diffDays / 30);
    return `hace ${m} ${m === 1 ? "mes" : "meses"}`;
  }
  return formatDate(d);
}

const AVATAR_COLORS = [
  "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
  "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500",
  "bg-orange-500",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function avatarColor(name: string) {
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
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
    const placeholders = getPlaceholderReviews(productId);
    const avg = placeholders.reduce((a, r) => a + r.rating, 0) / placeholders.length;

    return (
      <section className="mt-16 pt-16 border-t border-[#111111]/5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
              Reseñas de clientes
            </h2>
            <div className="flex items-center gap-3 mt-3">
              <StarDisplay rating={avg} size={16} />
              <span className="text-sm font-bold text-[#111111]">
                {avg.toFixed(1)}
              </span>
              <span className="text-xs text-[#111111]/50">
                · basado en {placeholders.length} reseñas
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {placeholders.map((r) => (
            <article key={r.id} className="flex gap-4">
              <div className={`shrink-0 w-11 h-11 rounded-full ${avatarColor(r.name)} flex items-center justify-center text-[11px] font-black tracking-widest text-white`}>
                {getInitials(r.name)}
              </div>
              <div className="flex-1 min-w-0">
                <header className="flex flex-wrap items-center gap-3 mb-1.5">
                  <span className="text-sm font-bold text-[#111111]">
                    {r.name}
                  </span>
                  <time className="text-[10px] text-[#111111]/40">
                    {relativeDate(r.createdAt)}
                  </time>
                </header>
                <div className="flex items-center gap-2 mb-2">
                  <StarDisplay rating={r.rating} size={14} />
                </div>
                {r.title && (
                  <h3 className="text-sm font-bold text-[#111111] mb-1">{r.title}</h3>
                )}
                <p className="text-sm text-[#111111]/70 leading-relaxed whitespace-pre-line break-words">
                  {r.body}
                </p>
              </div>
            </article>
          ))}
        </div>
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
          const initials = getInitials(r.user.name);

          return (
            <article key={r.id} className="flex gap-4">
              <div className={`shrink-0 w-11 h-11 rounded-full ${avatarColor(r.user.name)} flex items-center justify-center text-[11px] font-black tracking-widest text-white`}>
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
