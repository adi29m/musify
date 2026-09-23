// YouTube backend for popular songs — full-length playback via the official
// IFrame player. Server-side only: the Data API v3 key must never ship to clients.
import type { UiTrack } from "./audius";

const YT_API = "https://www.googleapis.com/youtube/v3";

export function isYouTubeConfigured(): boolean {
  return !!process.env.YOUTUBE_API_KEY;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function parseIsoDuration(iso: string): number {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || "");
  if (!m) return 0;
  return (Number(m[1] || 0) * 3600) + (Number(m[2] || 0) * 60) + Number(m[3] || 0);
}

type YtVideo = {
  id: string;
  snippet: { title: string; channelTitle: string; thumbnails?: { medium?: { url: string } } };
  contentDetails?: { duration: string };
  statistics?: { viewCount?: string };
};

async function ytFetch<T>(path: string, revalidate: number): Promise<T> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY not configured");
  const res = await fetch(`${YT_API}${path}${path.includes("?") ? "&" : "?"}key=${key}`, {
    next: { revalidate },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`YouTube API ${res.status}`);
  return res.json() as Promise<T>;
}

function toUi(v: YtVideo): UiTrack {
  const vid = v.id;
  return {
    id: `yt_${vid}`,
    title: decodeEntities(v.snippet?.title || "Unknown Title"),
    artist: decodeEntities(v.snippet?.channelTitle || "Unknown Artist"),
    artistId: "",
    artwork: v.snippet?.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
    duration: parseIsoDuration(v.contentDetails?.duration || ""),
    genre: "YouTube",
    plays: Number(v.statistics?.viewCount || 0),
    streamUrl: `https://www.youtube.com/watch?v=${vid}`,
    source: "youtube",
    youtubeId: vid,
  };
}

async function enrichWithDetails(ids: string[]): Promise<Map<string, YtVideo>> {
  const map = new Map<string, YtVideo>();
  if (ids.length === 0) return map;
  // videos.list takes up to 50 ids per call and costs ~1 quota unit.
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const j = await ytFetch<{ items: YtVideo[] }>(
      `/videos?part=snippet,contentDetails,statistics&id=${chunk.join(",")}`,
      3600
    );
    for (const v of j.items || []) {
      const id = typeof v.id === "string" ? v.id : (v.id as unknown as { videoId?: string })?.videoId || "";
      if (id) map.set(id, { ...v, id });
    }
  }
  return map;
}

// Full-length popular songs matching a query. Cached 30 min to protect quota
// (search.list costs ~100 units; the 10k/day free quota ≈ 90 searches/day).
export async function searchYouTube(query: string, limit = 12): Promise<UiTrack[]> {
  if (!query.trim() || !isYouTubeConfigured()) return [];
  const n = Math.min(Math.max(limit, 1), 25);
  const s = await ytFetch<{ items: { id: { videoId: string } }[] }>(
    `/search?part=snippet&type=video&videoCategoryId=10&maxResults=${n}&order=relevance&q=${encodeURIComponent(query)}`,
    1800
  );
  const ids = (s.items || []).map((i) => i.id?.videoId).filter(Boolean);
  const details = await enrichWithDetails(ids);
  return ids.map((id) => details.get(id)).filter(Boolean).map((v) => toUi(v as YtVideo));
}

// Popular music videos right now. Costs ~1 quota unit; cached 1h.
export async function getPopularMusic(limit = 12, region = "IN"): Promise<UiTrack[]> {
  if (!isYouTubeConfigured()) return [];
  const n = Math.min(Math.max(limit, 1), 25);
  const j = await ytFetch<{ items: YtVideo[] }>(
    `/videos?part=snippet,contentDetails,statistics&chart=mostPopular&videoCategoryId=10&regionCode=${region}&maxResults=${n}`,
    3600
  );
  return (j.items || [])
    .map((v) => ({ ...v, id: typeof v.id === "string" ? v.id : "" }))
    .filter((v) => v.id)
    .map(toUi);
}

export async function getYouTubeTrack(videoId: string): Promise<UiTrack | null> {
  if (!videoId || !isYouTubeConfigured()) return null;
  try {
    const details = await enrichWithDetails([videoId]);
    const v = details.get(videoId);
    return v ? toUi(v) : null;
  } catch {
    return null;
  }
}
