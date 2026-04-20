import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-6 py-24">
      <div className="max-w-2xl w-full text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#111111]/40 mb-6">
          Error 404
        </p>

        <h1 className="text-[120px] md:text-[200px] font-black tracking-tighter leading-none text-[#111111]">
          404
        </h1>

        <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-[#111111] mt-6 mb-4">
          Página fuera de juego
        </h2>

        <p className="text-[#111111]/50 font-medium max-w-md mx-auto mb-12">
          La página que buscas no existe o fue retirada del catálogo. Vuelve al inicio y encuentra tu playera oficial.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center h-14 px-10 rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] bg-[#111111] text-white hover:bg-[#222222] transition-colors"
          >
            Volver al inicio
          </Link>
          <Link
            href="/?search="
            className="inline-flex items-center justify-center h-14 px-10 rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] border-2 border-[#111111]/10 text-[#111111] hover:border-[#111111] transition-colors"
          >
            Ver todo el catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}
