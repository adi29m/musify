-- Musify uses server-side Prisma and custom JWT authentication, not Supabase Auth.
-- Run in the Supabase SQL Editor only after checking the deployed DATABASE_URL
-- role: it must own these tables (without FORCE RLS), have BYPASSRLS, or be a
-- superuser. A normal non-owner role without policies would lose access.
-- This targets the four tables in prisma/schema.prisma, not other project tables.
-- No rows are read, changed, or deleted. All changes succeed or roll back together.

BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Like" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Playlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PlaylistTrack" ENABLE ROW LEVEL SECURITY;

-- Block direct Data API access, including if permissive policies already exist.
-- The trusted Prisma connection retains its own database privileges.
REVOKE ALL PRIVILEGES ON TABLE
  public."User", public."Like", public."Playlist", public."PlaylistTrack"
  FROM PUBLIC, anon, authenticated;

-- Prevent tables subsequently created by this database role from receiving
-- automatic client grants. New tables still need RLS enabled explicitly.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL PRIVILEGES ON TABLES FROM PUBLIC, anon, authenticated;

COMMIT;
