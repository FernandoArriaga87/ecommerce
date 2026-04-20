"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen flex items-center justify-center bg-white text-black p-8">
        <div className="max-w-md text-center">
          <p className="text-xs font-black uppercase tracking-widest text-red-600 mb-4">
            Error
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-3">
            Algo salió mal
          </h1>
          <p className="text-sm text-gray-600 mb-8">
            Hemos sido notificados del problema. Intenta recargar la página.
          </p>
          <a
            href="/"
            className="inline-block bg-black text-white text-xs font-black uppercase tracking-widest px-6 py-3 hover:bg-gray-800 transition-colors"
          >
            Volver al inicio
          </a>
        </div>
      </body>
    </html>
  );
}
