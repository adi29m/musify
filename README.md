# Musify

A Spotify-inspired music app built with Next.js, React, Tailwind CSS, Prisma,
and Supabase PostgreSQL. Users can discover music, save liked songs, and manage
personal playlists.

**[Open the live app](https://musify-adi29ms-projects.vercel.app)** ·
[Alternative live URL](https://musify-mauve-xi.vercel.app)

## Features

- Trending tracks, genre browsing, artist pages, and search through Audius.
- YouTube music search and playback through the official IFrame player when
  the server's YouTube API key is configured.
- Player queue, shuffle, repeat, volume, seeking, and Media Session controls.
- Email/password signup and login, liked songs, and personal playlists.
- User data stored in PostgreSQL and accessed through server-side API routes.

## Music sources

Audius provides discovery and audio streaming through
[`src/lib/audius.ts`](src/lib/audius.ts). YouTube discovery uses the Data API v3
through [`src/lib/youtube.ts`](src/lib/youtube.ts), with playback handled by the
official YouTube player. This project does not provide the Spotify catalog.

## Local setup

Use Node.js 24, npm, and a Supabase PostgreSQL project for development. The
database security scripts expect Supabase's `anon` and `authenticated` roles.

```bash
npm install
```

Create a local `.env` file with these settings:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/postgres?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/postgres?sslmode=require"
JWT_SECRET="YOUR_PRIVATE_RANDOM_SECRET"
# Optional: enables YouTube discovery and search
YOUTUBE_API_KEY="YOUR_YOUTUBE_DATA_API_KEY"
```

Use the appropriate Prisma connection strings from your Supabase project:
`DATABASE_URL` for application queries and `DIRECT_URL` for schema operations.
Generate a private signing secret, for example:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Then create the app tables, apply their access protection, and start the app:

```bash
npm run db:push
npm run dev
```

Open [localhost:3000](http://localhost:3000). Environment files are excluded from
Git and Vercel uploads; keep actual credentials out of the repository.

## Deployment

The Vercel project is `musify`. Configure `DATABASE_URL`, `DIRECT_URL`, and
`JWT_SECRET` in its production environment. Set `YOUTUBE_API_KEY` to enable
YouTube features. Production builds use Vercel's configured environment values.

```bash
npm run build
npx vercel deploy --prod
```

The build command is `prisma generate && next build`. Schema changes are a
separate operation: run `npm run db:push` against the intended database when
the schema needs updating. The wrapper loads the same environment precedence
as Next.js and applies the table protection after a successful schema push.

## Implemented security protections

The hosted database and app were secured on **30 September 2026**:

- Row Level Security is enabled on `User`, `Like`, `Playlist`, and
  `PlaylistTrack`.
- Table privileges are revoked from `PUBLIC`, `anon`, and `authenticated`,
  blocking direct client access through the Supabase Data API.
- Default client table grants are revoked for new tables created by the
  database role that applied the fix.
- Login sessions reject missing secrets and the old development default,
  accept only HS256 signatures, and validate expiry and user claim types.
- Session cookies use `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- Authentication checks select only public user fields. Database and
  authentication modules are marked `server-only`.
- Local `.env` files are explicitly excluded from Vercel uploads.
- Database security checks run after `npm run db:push`.

Authentication uses bcrypt password hashes and the app's own JWT sessions;
it does not use Supabase Auth. The server checks ownership for likes and
playlists. RLS and revoked grants block direct API access, while the trusted
Prisma role retains server access. The current protection requires that role
to own the tables without forced RLS, have BYPASSRLS, or be a superuser.

When adding models, extend the security SQL and verification script to cover
their tables. Prisma's schema does not itself describe RLS or SQL grants.

See [the security notes](prisma/security/README.md) and
[the SQL fix](prisma/security/lock-down-data-api.sql) for implementation details.

## Verification and maintenance

| Command | Purpose |
| --- | --- |
| `npm run test:security` | Run session-security tests without a database connection. |
| `npm run db:security` | Check RLS, client privileges, and denied reads on the configured database. |
| `npm run db:secure` | Apply the security SQL in a transaction, then verify protection. |
| `npm run db:push` | Update the schema, then apply and verify its access protection. |
| `npm run test:deployment -- https://your-app.vercel.app` | Verify deployed authentication and data isolation using temporary accounts. |
| `npm run build` | Generate Prisma Client and build the production app. |
| `npm run lint` | Run ESLint. |

Deployment tests must use a matching app/database pair. They create two
temporary accounts, exercise likes and playlists, and delete those generated
fixtures afterward.

Verification on 30 September 2026 passed all six session-security tests,
TypeScript and focused ESLint checks, the local and Vercel production builds,
and the deployed login-page check. Live tests passed for signup, login, logout,
secure cookies, forged-token rejection, likes, playlist/track changes, and
isolation between two accounts. Temporary fixtures were removed; the security
fix preserved existing user records.

The checks confirmed denied direct reads for both Supabase client roles.
Supabase's dashboard Advisor was not rerun because dashboard sign-in was
unavailable. The optional Data API disable setting was also left unchanged.

## Security roadmap

These improvements have been recommended but **are not implemented yet**:

- Shared rate limits for login, signup, and expensive API calls.
- Strict request validation, stronger password requirements, and
  breached-password checks.
- Revocable sessions with immediate invalidation on logout and password reset.
- Verified email ownership and secure password recovery.
- A database runtime role with fewer privileges, separate from the migration
  role, and compatible RLS access rules.
- Request-origin/CSRF protections, a Content Security Policy compatible with
  YouTube, and image-host restrictions.
- Automated dependency checks and security monitoring.

Account-level two-factor authentication on GitHub, Vercel, and Supabase, and
backup/restore readiness still need an audit. Disabling the unused Supabase
Data API is optional additional hardening and requires dashboard access.
