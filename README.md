# Musify — Spotify Clone (End to End)

Full-stack Spotify clone: Next.js + Tailwind + Prisma/SQLite + Audius free legal streaming.

## What it plays
- **Not** copyrighted Spotify catalog (can't bundle every major-label singer/band legally).
- Plays the **open Audius catalog**: thousands of independent singers, artists, bands across 20 genres with full-track MP3 streaming, search, trending, artist & playlist pages.

## Run
```bash
npm install
npx prisma db push
npm run dev
```
Open http://localhost:3000

Login/signup to get likes + playlists (stored in SQLite `prisma/dev.db`).

## Features
- Home: trending, 20 genres, trending playlists
- Search: songs, artists/bands, playlists
- Genre, track, artist, playlist pages with full playback
- Bottom player: queue, shuffle, repeat, volume, seek, Media Session API
- Auth (email/password, JWT cookie), Liked Songs, user playlists, add/remove tracks

## Music API
`src/lib/audius.ts` — `discoveryprovider.audius.co`, `app_name=MusicAppClone`.
Stream URL: `/v1/tracks/{id}/stream?app_name=MusicAppClone`.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
