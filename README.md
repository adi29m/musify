# Musify — Spotify Clone (End to End)

## 🌐 Live App

**https://musify-adi29ms-projects.vercel.app** — open the link and play, no setup needed.

Full-stack Spotify clone: Next.js + Tailwind + Prisma/Postgres + Audius free legal streaming.

## What it plays
- **Not** copyrighted Spotify catalog (can't bundle every major-label singer/band legally).
- Plays the **open Audius catalog**: thousands of independent singers, artists, bands across 20 genres with full-track MP3 streaming, search, trending, artist & playlist pages.

## Run (local — needs a Postgres URL, e.g. free Supabase project)
```bash
npm install
# put your Postgres connection string in .env as DATABASE_URL
npm run db:push
npm run dev
```

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
npm run db:push      # creates tables and applies/verifies database security
npx vercel --prod
```

Build command on Vercel: `prisma generate && next build` (from `package.json`).

## Database security

The app uses server-side Prisma and its own JWT sessions. The four app tables
must have Row Level Security enabled and no grants to Supabase's `anon` or
`authenticated` roles. `npm run db:push` reapplies and verifies this protection
after schema changes, using the same environment precedence as Next.js. The
server database role must own the tables or have BYPASSRLS.

- `npm run db:security` checks live RLS, client permissions, and denied reads.
- `npm run db:secure` applies the transaction and then verifies protection.
- `npm run test:security` tests session security without connecting to a database.
- `npm run test:deployment -- https://your-app.vercel.app` checks deployed auth
  and ownership using two temporary accounts, then removes those fixtures from
  the configured database. Use it only with the matching app/database pair.

Set a private, random `JWT_SECRET`; authentication refuses a missing secret or
the old development default. Database and authentication modules are marked
server-only to prevent accidental browser imports.

See [the security notes](prisma/security/README.md) for details and SQL.
