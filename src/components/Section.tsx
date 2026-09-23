"use client";

import Link from "next/link";

export function Section({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-xl font-bold text-white sm:text-2xl">{title}</h2>
        {href && (
          <Link href={href} className="text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white">
            Show all
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

const GENRE_COLORS = [
  "from-pink-600 to-rose-400", "from-green-600 to-emerald-300", "from-indigo-600 to-blue-400",
  "from-orange-600 to-amber-300", "from-purple-600 to-fuchsia-400", "from-red-600 to-orange-400",
  "from-teal-600 to-cyan-300", "from-yellow-600 to-lime-300", "from-blue-700 to-sky-400",
  "from-fuchsia-700 to-pink-400",
];

export function GenreGrid({ genres }: { genres: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {genres.map((g, i) => (
        <Link
          key={g}
          href={`/genre/${encodeURIComponent(g)}`}
          className={`relative h-24 overflow-hidden rounded-lg bg-gradient-to-br p-4 ${GENRE_COLORS[i % GENRE_COLORS.length]}`}
        >
          <span className="text-lg font-extrabold text-white">{g}</span>
          <span className="absolute -bottom-3 -right-3 h-16 w-16 rotate-12 rounded-md bg-black/30" />
          <span className="absolute -bottom-2 -right-2 grid h-14 w-14 rotate-12 place-items-center rounded-md bg-black/40 text-2xl text-white/80">♪</span>
        </Link>
      ))}
    </div>
  );
}
