// Audius free music API layer — legal full-track streaming, no API key needed.
const HOST = "https://discoveryprovider.audius.co";
const APP = "MusicAppClone";

export const GENRES = [
  "Electronic",
  "Hip-Hop/Rap",
  "Alternative",
  "Pop",
  "Rock",
  "R&B/Soul",
  "Country",
  "Folk",
  "Jazz",
  "Classical",
  "Reggae",
  "Metal",
  "Punk",
  "Ambient",
  "House",
  "Techno",
  "Trance",
  "Dubstep",
  "Drum & Bass",
  "Lo-Fi",
] as const;

export type AudiusTrack = {
  id: string;
  title: string;
  user: { id: string; handle: string; name: string };
  artwork?: { "150x150"?: string; "480x480"?: string; "1000x1000"?: string };
  duration: number; // seconds
  genre: string;
  mood?: string;
  play_count: number;
  repost_count?: number;
  favorite_count?: number;
  description?: string;
  release_date?: string;
  permalink?: string;
};

export type AudiusUser = {
  id: string;
  handle: string;
  name: string;
  profile_picture?: { "150x150"?: string; "480x480"?: string; "1000x1000"?: string };
  track_count?: number;
  follower_count?: number;
  bio?: string;
};

export type AudiusPlaylist = {
  id: string;
  playlist_name: string;
  user: { id: string; handle: string; name: string };
  artwork?: { "150x150"?: string; "480x480"?: string; "1000x1000"?: string };
  description?: string;
  total_play_count?: number;
  playlist_contents?: { track_ids: { track: string }[] };
};

export type UiTrack = {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  artwork: string;
  duration: number;
  genre: string;
  plays: number;
  streamUrl: string;
  // Optional second source. Absent/"audius" = raw MP3 via <audio>.
  // "youtube" = full popular song played through the YouTube IFrame player.
  source?: "audius" | "youtube";
  youtubeId?: string;
};

export function isYouTube(t: UiTrack): boolean {
  return t.source === "youtube" || !!t.youtubeId;
}

function art(
  a?: { "150x150"?: string; "480x480"?: string; "1000x1000"?: string },
  size: "150x150" | "480x480" | "1000x1000" = "480x480"
): string {
  return a?.[size] || a?.["480x480"] || a?.["150x150"] || "/placeholder-album.svg";
}

export function streamUrl(trackId: string): string {
  return `${HOST}/v1/tracks/${trackId}/stream?app_name=${APP}`;
}

export function toUiTrack(t: AudiusTrack): UiTrack {
  return {
    id: t.id,
    title: t.title || "Unknown Title",
    artist: t.user?.name || t.user?.handle || "Unknown Artist",
    artistId: t.user?.id || "",
    artwork: art(t.artwork),
    duration: t.duration || 0,
    genre: t.genre || "Unknown",
    plays: t.play_count || 0,
    streamUrl: streamUrl(t.id),
    source: "audius",
  };
}

async function getJson<T>(path: string, revalidate = 300): Promise<T> {
  const res = await fetch(`${HOST}${path}${path.includes("?") ? "&" : "?"}app_name=${APP}`, {
    next: { revalidate },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Audius ${res.status} for ${path}`);
  const json = await res.json();
  return json.data as T;
}

export async function getTrending(limit = 30, genre?: string): Promise<UiTrack[]> {
  const g = genre ? `&genre=${encodeURIComponent(genre)}` : "";
  const tracks = await getJson<AudiusTrack[]>(`/v1/tracks/trending?limit=${limit}&time=week${g}`, 600);
  return (tracks || []).map(toUiTrack);
}

export async function searchTracks(query: string, limit = 25): Promise<UiTrack[]> {
  if (!query.trim()) return [];
  const tracks = await getJson<AudiusTrack[]>(
    `/v1/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}`,
    120
  );
  return (tracks || []).map(toUiTrack);
}

export async function searchArtists(query: string, limit = 12): Promise<AudiusUser[]> {
  if (!query.trim()) return [];
  return getJson<AudiusUser[]>(
    `/v1/users/search?query=${encodeURIComponent(query)}&limit=${limit}`,
    120
  );
}

export async function searchPlaylists(query: string, limit = 12): Promise<AudiusPlaylist[]> {
  if (!query.trim()) return [];
  return getJson<AudiusPlaylist[]>(
    `/v1/playlists/search?query=${encodeURIComponent(query)}&limit=${limit}`,
    120
  );
}

export async function getTrack(id: string): Promise<UiTrack | null> {
  try {
    const t = await getJson<AudiusTrack>(`/v1/tracks/${id}`, 600);
    return toUiTrack(t);
  } catch {
    return null;
  }
}

export async function getArtist(id: string): Promise<AudiusUser | null> {
  try {
    return await getJson<AudiusUser>(`/v1/users/${id}`, 600);
  } catch {
    return null;
  }
}

export async function getArtistTracks(id: string, limit = 30): Promise<UiTrack[]> {
  try {
    const tracks = await getJson<AudiusTrack[]>(`/v1/users/${id}/tracks?limit=${limit}&sort=plays`, 300);
    return (tracks || []).map(toUiTrack);
  } catch {
    return [];
  }
}

export async function getTrendingPlaylists(limit = 12): Promise<AudiusPlaylist[]> {
  return getJson<AudiusPlaylist[]>(`/v1/playlists/trending?limit=${limit}&time=week`, 600);
}

export async function getPlaylist(id: string): Promise<{ meta: AudiusPlaylist; tracks: UiTrack[] } | null> {
  try {
    const pl = await getJson<AudiusPlaylist>(`/v1/playlists/${id}`, 600);
    const ids = (pl.playlist_contents?.track_ids?.map((t) => t.track) ?? []).slice(0, 30);
    // Bounded parallelism: 30 sequential fetches took ~30x one RTT.
    // 6 at a time keeps it fast without hammering the discovery node.
    const out: UiTrack[] = [];
    for (let i = 0; i < ids.length; i += 6) {
      const batch = await Promise.all(ids.slice(i, i + 6).map((tid) => getTrack(tid)));
      for (const t of batch) if (t) out.push(t);
    }
    return { meta: pl, tracks: out };
  } catch {
    return null;
  }
}

export function artistArt(u: AudiusUser): string {
  return (
    u.profile_picture?.["480x480"] ||
    u.profile_picture?.["150x150"] ||
    "/placeholder-artist.svg"
  );
}

export function playlistArt(p: AudiusPlaylist): string {
  return art(p.artwork);
}

export function formatTime(sec: number): string {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatPlays(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}
