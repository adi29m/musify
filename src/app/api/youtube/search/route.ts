import { NextRequest, NextResponse } from "next/server";
import { searchYouTube, isYouTubeConfigured } from "@/lib/youtube";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 12), 25);
  if (!q.trim()) return NextResponse.json({ tracks: [] });
  if (!isYouTubeConfigured())
    return NextResponse.json({ error: "YouTube search is not configured on this server", tracks: [] }, { status: 503 });
  try {
    const tracks = await searchYouTube(q, limit);
    return NextResponse.json({ tracks });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "YouTube search failed", tracks: [] },
      { status: 502 }
    );
  }
}
