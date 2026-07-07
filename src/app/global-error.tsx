"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Algo salió mal
        </h1>
        <p className="mb-6 max-w-md text-gray-600">
          Ha ocurrido un error inesperado. Puedes intentar de nuevo o volver más
          tarde.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-[#6B5BB6] px-6 py-3 font-medium text-white hover:bg-[#5B4BA5]"
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
