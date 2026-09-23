import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(req: NextRequest, ctx: RouteContext<"/api/playlists/[id]/tracks">) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const pl = await prisma.playlist.findFirst({ where: { id, userId: user.id } });
  if (!pl) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  if (!b.trackId || !b.title || !b.artist)
    return NextResponse.json({ error: "trackId, title, artist required" }, { status: 400 });

  const count = await prisma.playlistTrack.count({ where: { playlistId: id } });
  const t = await prisma.playlistTrack.create({
    data: {
      playlistId: id, trackId: String(b.trackId), title: String(b.title), artist: String(b.artist),
      artwork: b.artwork ?? null, genre: b.genre ?? null, duration: b.duration ?? null, position: count,
      source: b.source === "youtube" ? "youtube" : "audius",
      youtubeId: b.youtubeId ? String(b.youtubeId) : null,
    },
  });
  await prisma.playlist.update({ where: { id }, data: { updatedAt: new Date() } });
  return NextResponse.json({ track: t });
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/playlists/[id]/tracks">) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const pl = await prisma.playlist.findFirst({ where: { id, userId: user.id } });
  if (!pl) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const trackId = req.nextUrl.searchParams.get("trackId");
  const entryId = req.nextUrl.searchParams.get("entryId");
  if (entryId) {
    await prisma.playlistTrack.deleteMany({ where: { id: entryId, playlistId: id } });
  } else if (trackId) {
    await prisma.playlistTrack.deleteMany({ where: { playlistId: id, trackId } });
  } else {
    return NextResponse.json({ error: "trackId or entryId required" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
