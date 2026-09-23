# Musify — Spotify Clone (End to End)

Full-stack Spotify clone: Next.js + Tailwind + Prisma/Postgres + Audius free legal streaming.

## What it plays
- **Not** copyrighted Spotify catalog (can't bundle every major-label singer/band legally).
- Plays the **open Audius catalog**: thousands of independent singers, artists, bands across 20 genres with full-track MP3 streaming, search, trending, artist & playlist pages.

## Run (local — needs a Postgres URL, e.g. free Supabase project)
```bash
npm install
# put your Postgres connection string in .env as DATABASE_URL
npx prisma db push
npm run dev
```
Open http://localhost:3000

Login/signup to get likes + playlists (stored in Postgres).

## Features
- Home: trending, 20 genres, trending playlists
- Search: songs, artists/bands, playlists
- Genre, track, artist, playlist pages with full playback
- Bottom player: queue, shuffle, repeat, volume, seek, Media Session API
- Auth (email/password, JWT cookie), Liked Songs, user playlists, add/remove tracks

## Music API
`src/lib/audius.ts` — `discoveryprovider.audius.co`, `app_name=MusicAppClone`.
Stream URL: `/v1/tracks/{id}/stream?app_name=MusicAppClone`.

## Deploy on Vercel (project `musify`, already linked via CLI)

Env vars required on Vercel: `DATABASE_URL` (Supabase direct connection string),
`JWT_SECRET` (long random string). Set with `vercel env add`, then:

```bash
npx prisma db push   # run once against the production DATABASE_URL to create tables
npx vercel --prod
```

Build command on Vercel: `prisma generate && next build` (from `package.json`).
