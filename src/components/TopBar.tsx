"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, User, Home } from "lucide-react";
import { useState } from "react";
import { useMe } from "@/hooks/useMe";
import { usePlayer } from "@/context/PlayerContext";

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { me, loading, refresh } = useMe();
  const { current } = usePlayer();
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
    router.refresh();
  }

  const tab = (href: string, label: string, active: boolean) => (
    <Link
      key={href}
      href={href}
      className={`rounded-full px-4 py-2 text-sm font-bold transition ${
        active ? "bg-white text-black" : "text-white hover:bg-white/10"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <>
    <header className="sticky top-0 z-20 flex items-center gap-2 bg-[#0a0a0a]/80 px-3 py-3 backdrop-blur sm:gap-3 sm:px-4">
      <div className="hidden gap-2 sm:flex">
        <button onClick={() => router.back()} className="rounded-full bg-black/60 p-2 text-zinc-300 hover:text-white" aria-label="Back">
          <ChevronLeft size={20} />
        </button>
        <button onClick={() => router.forward()} className="rounded-full bg-black/60 p-2 text-zinc-300 hover:text-white" aria-label="Forward">
          <ChevronRight size={20} />
        </button>
      </div>

      <Link href="/" aria-label="Home" className={`hidden shrink-0 place-items-center rounded-full p-3 transition sm:grid ${pathname === "/" ? "bg-white/10 text-white" : "bg-white/5 text-zinc-300 hover:text-white"}`}>
        <Home size={20} />
      </Link>

      {(pathname?.startsWith("/search") || pathname === "/") && (
        <form
          className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-transparent bg-[#242424] px-3 py-2 focus-within:border-white sm:max-w-md sm:px-4"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/search?q=${encodeURIComponent(q)}`);
          }}
        >
          <Search size={18} className="shrink-0 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search songs, artists…"
            data-gramm="false"
            data-gramm_editor="false"
            className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
          />
        </form>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        {!loading && !me && (
          <>
            <Link href="/signup" className="hidden rounded-full px-3 py-2 text-sm font-bold text-zinc-300 hover:text-white min-[400px]:block sm:px-4">
              Sign up
            </Link>
            <Link href="/login" className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-black hover:scale-105 sm:px-5 sm:py-2">
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
    </header>
      {/* mobile nav — MUST live outside the header: backdrop-blur creates a
          containing block that traps `fixed` children (they'd stick to the
          header and overlap the search bar). As a sibling it anchors to the
          viewport. Sits just above the player bar when playing. */}
      <nav className={`fixed left-1/2 z-20 flex -translate-x-1/2 gap-1 rounded-full bg-[#1a1a1a]/95 p-1 shadow-xl transition-all md:hidden ${current ? "bottom-24" : "bottom-4"}`}>
        {tab("/", "Home", pathname === "/")}
        {tab("/search", "Search", pathname?.startsWith("/search") ?? false)}
        {tab("/library", "Library", pathname?.startsWith("/library") ?? false)}
      </nav>
    </>
  );
}
