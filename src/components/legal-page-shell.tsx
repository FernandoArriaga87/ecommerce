import { ReactNode } from "react";

export function LegalPageShell({
  title,
  subtitle,
  lastUpdated,
  children,
}: {
  title: string;
  subtitle: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div className="container mx-auto px-6 py-16 lg:py-24 max-w-3xl">
      <div className="border-b border-[#111111]/10 pb-10 mb-12">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#111111]/40 mb-4">
          {subtitle}
        </p>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-[#111111] leading-[0.95]">
          {title}
        </h1>
        <p className="text-xs text-[#111111]/50 font-bold uppercase tracking-widest mt-6">
          Última actualización: {lastUpdated}
        </p>
      </div>

      <article className="prose prose-zinc max-w-none text-[#111111]/80 leading-relaxed space-y-8">
        {children}
      </article>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-[#111111]">
        {title}
      </h2>
      <div className="space-y-3 text-sm md:text-base">{children}</div>
    </section>
  );
}
