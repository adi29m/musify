"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <div className="mx-auto max-w-md py-16 text-center font-sans">
          <p className="mb-2 text-4xl">⚠️</p>
          <h2 className="mb-2 text-xl font-bold">Musify hit an error</h2>
          <p className="mb-1 text-sm text-zinc-400">
            {error.message || "The app crashed while rendering."}
          </p>
          {error.digest && (
            <p className="mb-4 font-mono text-xs text-zinc-600">Error ID: {error.digest}</p>
          )}
          <button
            onClick={() => reset()}
            className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
