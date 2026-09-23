import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/playlists/[id]">) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const pl = await prisma.playlist.findFirst({
    where: { id, userId: user.id },
    include: { tracks: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] } },
  });
  if (!pl) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ playlist: pl });
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/playlists/[id]">) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const b = await req.json().catch(() => ({}));
  const pl = await prisma.playlist.updateMany({
    where: { id, userId: user.id },
    data: {
      ...(b.name ? { name: String(b.name) } : {}),
      ...(b.description !== undefined ? { description: b.description ? String(b.description) : null } : {}),
    },
  });
  return NextResponse.json({ ok: pl.count > 0 });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/playlists/[id]">) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await prisma.playlist.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
