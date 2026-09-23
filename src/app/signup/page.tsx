"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const r = await fetch("/api/auth/signup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const j = await r.json().catch(() => ({}));
    setLoading(false);
    if (!r.ok) {
      setErr(j.error || "Signup failed");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="mb-6 text-center text-3xl font-black">Sign up for Musify</h1>
      <form onSubmit={submit} className="space-y-3 rounded-lg bg-[#121212] p-6">
        {err && <p className="rounded bg-red-900/50 p-2 text-sm text-red-200">{err}</p>}
        <label className="block text-sm font-bold">Name
          <input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full rounded bg-[#242424] px-3 py-2 outline-none focus:ring-1 focus:ring-green-500" />
        </label>
        <label className="block text-sm font-bold">Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full rounded bg-[#242424] px-3 py-2 outline-none focus:ring-1 focus:ring-green-500" />
        </label>
        <label className="block text-sm font-bold">Password (min 6)
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} className="mt-1 w-full rounded bg-[#242424] px-3 py-2 outline-none focus:ring-1 focus:ring-green-500" />
        </label>
        <button disabled={loading} className="w-full rounded-full bg-green-500 py-3 text-sm font-bold text-black hover:scale-[1.02] disabled:opacity-50">
          {loading ? "Creating…" : "Sign up"}
        </button>
        <p className="text-center text-sm text-zinc-400">Have an account? <Link href="/login" className="text-white underline">Log in</Link></p>
      </form>
    </div>
  );
}
