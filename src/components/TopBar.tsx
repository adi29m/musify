"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, User } from "lucide-react";
import { useState } from "react";
import { useMe } from "@/hooks/useMe";

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { me, loading, refresh } = useMe();
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 bg-[#0a0a0a]/80 px-4 py-3 backdrop-blur">
      <div className="hidden gap-2 sm:flex">
        <button onClick={() => router.back()} className="rounded-full bg-black/60 p-2 text-zinc-300 hover:text-white" aria-label="Back">
          <ChevronLeft size={20} />
        </button>
        <button onClick={() => router.forward()} className="rounded-full bg-black/60 p-2 text-zinc-300 hover:text-white" aria-label="Forward">
          <ChevronRight size={20} />
        </button>
      </div>

      {(pathname?.startsWith("/search") || pathname === "/") && (
        <form
          className="flex max-w-md flex-1 items-center gap-2 rounded-full border border-transparent bg-[#242424] px-4 py-2 focus-within:border-white"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/search?q=${encodeURIComponent(q)}`);
          }}
        >
          <Search size={18} className="shrink-0 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="What do you want to play? Search songs, artists, bands…"
            data-gramm="false"
            data-gramm_editor="false"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
          />
        </form>
      )}

      <div className="ml-auto flex items-center gap-2">
        {!loading && !me && (
          <>
            <Link href="/signup" className="rounded-full px-4 py-2 text-sm font-bold text-zinc-300 hover:text-white">
              Sign up
            </Link>
            <Link href="/login" className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black hover:scale-105">
              Log in
            </Link>
          </>
        )}
        {!loading && me && (
          <div className="relative">
            <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-full bg-[#242424] p-1 pr-3 hover:bg-zinc-700">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-green-500 text-black">
                <User size={16} />
              </span>
              <span className="max-w-24 truncate text-sm font-semibold text-white">{me.name}</span>
            </button>
            {menu && (
              <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-md bg-[#282828] p-1 shadow-xl">
                <Link href="/library" className="block rounded px-3 py-2 text-sm text-white hover:bg-zinc-700" onClick={() => setMenu(false)}>
                  Your Library
                </Link>
                <button onClick={logout} className="block w-full rounded px-3 py-2 text-left text-sm text-white hover:bg-zinc-700">
                  Log out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* mobile nav */}
      <nav className="fixed bottom-24 left-1/2 z-20 flex -translate-x-1/2 gap-1 rounded-full bg-[#1a1a1a]/95 p-1 shadow-xl md:hidden">
        <Link href="/" className="rounded-full px-4 py-2 text-sm font-bold text-white">Home</Link>
        <Link href="/search" className="rounded-full px-4 py-2 text-sm font-bold text-white">Search</Link>
        <Link href="/library" className="rounded-full px-4 py-2 text-sm font-bold text-white">Library</Link>
      </nav>
    </header>
  );
}
