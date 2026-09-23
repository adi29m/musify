import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ playlists: [] });
  const playlists = await prisma.playlist.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { tracks: true } } },
  });
  return NextResponse.json({ playlists });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (!b.name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const pl = await prisma.playlist.create({
    data: { userId: user.id, name: String(b.name), description: b.description ? String(b.description) : null },
  });
  return NextResponse.json({ playlist: pl });
}
