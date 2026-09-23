import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const trackId = req.nextUrl.searchParams.get("trackId");
  if (trackId) {
    const like = await prisma.like.findUnique({
      where: { userId_trackId: { userId: user.id, trackId } },
    });
    return NextResponse.json({ liked: !!like });
  }
  // Lightweight variant for the app-wide liked store: just IDs, one request.
  if (req.nextUrl.searchParams.get("ids") === "1") {
    const rows = await prisma.like.findMany({
      where: { userId: user.id },
      select: { trackId: true },
    });
    return NextResponse.json({ ids: rows.map((r) => r.trackId) });
  }
  const likes = await prisma.like.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ likes });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (!b.trackId || !b.title || !b.artist)
    return NextResponse.json({ error: "trackId, title, artist required" }, { status: 400 });
  const like = await prisma.like.upsert({
    where: { userId_trackId: { userId: user.id, trackId: String(b.trackId) } },
    update: { title: String(b.title), artist: String(b.artist), artwork: b.artwork ?? null, genre: b.genre ?? null, duration: b.duration ?? null },
    create: {
      userId: user.id, trackId: String(b.trackId), title: String(b.title), artist: String(b.artist),
      artwork: b.artwork ?? null, genre: b.genre ?? null, duration: b.duration ?? null,
    },
  });
  return NextResponse.json({ like });
}

export async function DELETE(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const trackId = req.nextUrl.searchParams.get("trackId");
  if (!trackId) return NextResponse.json({ error: "trackId required" }, { status: 400 });
  await prisma.like.deleteMany({ where: { userId: user.id, trackId } });
  return NextResponse.json({ ok: true });
}
