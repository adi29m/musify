# Supabase Data API security

Applied to the hosted `musify` database on 30 September 2026. All four app tables
now have RLS enabled, with no client role grants. Actual zero-row read attempts
under `anon` and `authenticated` were denied. The server's `postgres` role
retains access. No existing user records were modified by the security SQL.

Musify accesses PostgreSQL through server-side Prisma. Login uses bcrypt password
hashes in `public."User"` and a custom JWT cookie. It does not use Supabase Auth or
the Supabase Data API. Supabase `auth.uid()` policies therefore do not correspond
to this app's sessions.

## Apply

1. Open the Supabase dashboard directly, select the `musify` project, and inspect
   **Security Advisor**. Check the exact table names in the RLS findings against
   `User`, `Like`, `Playlist`, and `PlaylistTrack`. The email does not name the
   affected table; any additional tables need their own review.
2. Check the database role used by **Vercel's production `DATABASE_URL`**. Do not
   share the connection string or its password. Pooler usernames may include a
   project suffix; use the database role name without that suffix. Run this
   metadata-only query in Supabase's SQL Editor:

   ```sql
   SELECT c.relname AS table_name,
          pg_get_userbyid(c.relowner) AS owner,
          c.relrowsecurity AS rls_enabled,
          c.relforcerowsecurity AS force_rls
   FROM pg_class c
   JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind IN ('r', 'p')
     AND c.relname IN ('User', 'Like', 'Playlist', 'PlaylistTrack');

   SELECT rolname, rolsuper, rolbypassrls
   FROM pg_roles
   WHERE rolname NOT LIKE 'pg_%';
   ```

   Proceed only if the production role owns all four tables with `force_rls`
   false, or has `rolbypassrls` or `rolsuper` true. Otherwise first design access
   for that specific server role. The SQL Editor's current role is not proof of
   the role used by Vercel.
3. Run `lock-down-data-api.sql` in the SQL Editor. It enables RLS and removes
   direct access for `PUBLIC`, `anon`, and `authenticated` on the four app tables.
   It intentionally adds no client policies: all app access goes through the
   server, which checks the signed-in user's ownership. If any table is missing
   or a statement fails, the transaction does not apply a partial fix.
4. As optional additional hardening, since this app solely uses Prisma, disable the **Data API** in Supabase's
   API Settings, provided no other app or integration uses it. Supabase's Prisma
   guide recommends this configuration. This does not disable PostgreSQL. This
   setting was not changed: dashboard sign-in is required, while the table-level
   protection was applied directly using the existing PostgreSQL connection.

## Verify after applying

Rerun the table metadata query above; all four tables should have `rls_enabled`
true. Run this query; every permission should be false for both client roles:

```sql
SELECT r.role_name, t.table_name, p.operation,
       has_table_privilege(r.role_name, t.table_name, p.operation) AS allowed
FROM (VALUES ('anon'), ('authenticated')) AS r(role_name)
CROSS JOIN (VALUES ('public."User"'), ('public."Like"'),
                   ('public."Playlist"'), ('public."PlaylistTrack"')) AS t(table_name)
CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) AS p(operation);
```

Rerun Security Advisor and confirm the findings disappear. On the deployed app,
verify login, signup with a test account, liking/unliking a song, and creating,
editing, and deleting a test playlist. With a second test account, confirm the
first account's saved data remains inaccessible. SQL review alone cannot verify
production behavior.

These database changes do not need a Vercel redeployment. The session hardening
does require deploying the changed app code. Use `npm run db:push` for schema
changes: it applies and checks this protection after the push. New models need
to be added to the security SQL and verification script; Prisma's schema does
not describe RLS or these PostgreSQL grants. Default client table grants were
also revoked for tables created by the connected database role.

The app's authentication code now rejects the known default signing secret and
missing secrets, restricts tokens to HS256, enforces expiry and user claim types,
and selects only public user fields when checking a session. Existing correctly
signed sessions remain compatible. Both database and auth modules are marked
server-only. Six automated session-security tests pass.

The email reports exposure, not confirmed data access. If logs or other evidence
show access to `User` rows, investigate exposure of email addresses and bcrypt
password hashes and plan a user password reset and session invalidation.

## References

- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Prisma guide](https://supabase.com/docs/guides/database/prisma)
- [Supabase Security Advisor](https://supabase.com/docs/guides/observability/advisors)
