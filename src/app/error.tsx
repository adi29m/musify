"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="mb-2 text-4xl">⚠️</p>
      <h2 className="mb-2 text-xl font-bold text-white">Something went wrong</h2>
      <p className="mb-1 text-sm text-zinc-400">
        {error.message || "This section failed to render."}
      </p>
      {error.digest && (
        <p className="mb-4 font-mono text-xs text-zinc-600">Error ID: {error.digest}</p>
      )}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => reset()}
          className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black hover:scale-105"
        >
          Try again
        </button>
        <button
          onClick={() => (window.location.href = "/")}
          className="rounded-full bg-zinc-800 px-5 py-2 text-sm font-bold text-white hover:bg-zinc-700"
        >
          Go home
        </button>
      </div>
    </div>
  );
}
