import { Suspense } from "react";
import { LibraryClient } from "./LibraryClient";

export default function LibraryPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
      <LibraryClient />
    </Suspense>
  );
}
