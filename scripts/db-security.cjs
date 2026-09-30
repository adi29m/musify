/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const { loadEnvConfig } = require('@next/env');
const { PrismaClient } = require('@prisma/client');

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production', {
  info() {}, error() {},
});

const apply = process.argv.includes('--apply');
const prisma = new PrismaClient();
const tableNames = ['User', 'Like', 'Playlist', 'PlaylistTrack'];

async function inspect(db) {
  const [identity] = await db.$queryRaw`
    SELECT current_user AS role, rolbypassrls, rolsuper
    FROM pg_roles WHERE rolname = current_user
  `;
  const tables = await db.$queryRaw`
    SELECT c.relname AS table_name, pg_get_userbyid(c.relowner) AS owner,
           c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
      AND c.relname IN ('User', 'Like', 'Playlist', 'PlaylistTrack')
    ORDER BY c.relname
  `;
  const privileges = await db.$queryRaw`
    SELECT r.role_name, t.table_name, p.operation,
           has_table_privilege(r.role_name, t.table_name, p.operation) AS allowed
    FROM (VALUES ('anon'), ('authenticated')) AS r(role_name)
    CROSS JOIN (VALUES ('public."User"'), ('public."Like"'),
                       ('public."Playlist"'), ('public."PlaylistTrack"')) AS t(table_name)
    CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'),
                       ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) AS p(operation)
  `;
  return { identity, tables, privileges };
}

function assertServerAccess({ identity, tables }) {
  if (tables.length !== tableNames.length) {
    throw new Error('Expected all four app tables. Create/check the schema before applying security.');
  }
  if (!identity.rolbypassrls && !identity.rolsuper &&
      tables.some(t => t.owner !== identity.role || t.force_rls)) {
    throw new Error('The configured server role cannot bypass RLS on every app table. No changes applied.');
  }
}

function assertProtected({ tables, privileges }) {
  if (tables.length !== tableNames.length || tables.some(t => !t.rls_enabled) ||
      privileges.some(p => p.allowed)) {
    throw new Error('Security check failed: an app table lacks RLS or a client role still has privileges.');
  }
}

async function main() {
  const before = await inspect(prisma);
  assertServerAccess(before);
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'check',
    databaseRole: before.identity.role, tables: before.tables,
    clientGrantCount: before.privileges.filter(p => p.allowed).length }, null, 2));

  if (apply) {
    const sql = fs.readFileSync(path.join(__dirname,
      '../prisma/security/lock-down-data-api.sql'), 'utf8');
    const statements = sql.replace(/^--.*$/gm, '').split(';')
      .map(s => s.trim()).filter(s => s && !/^(BEGIN|COMMIT)$/i.test(s));
    await prisma.$transaction(async tx => {
      // Recheck the role and schema inside the same transaction as the fix.
      assertServerAccess(await inspect(tx));
      for (const statement of statements) await tx.$executeRawUnsafe(statement);
      assertProtected(await inspect(tx));
    }, { timeout: 30000 });
  }

  const after = await inspect(prisma);
  assertProtected(after);
  // Check both client roles with actual zero-row queries. Never return user data.
  for (const role of ['anon', 'authenticated']) {
    for (const table of tableNames) {
      let denied = false;
      try {
        await prisma.$transaction(async tx => {
          await tx.$executeRawUnsafe(`SET LOCAL ROLE "${role}"`);
          await tx.$queryRawUnsafe(`SELECT 1 FROM public."${table}" LIMIT 0`);
        });
      } catch (error) {
        if (error.code === 'P2010' && error.meta?.code === '42501') denied = true;
        else throw error;
      }
      if (!denied) throw new Error(`Unexpected direct read access: ${role} on ${table}.`);
    }
  }
  console.log('PASS: all four tables have RLS; both API client roles are denied; server access is preserved.');
}

main().catch(error => {
  // Prisma errors can contain connection details: keep raw error messages private.
  const message = error.code ? `Database operation failed (${error.code}).` :
    error.name === 'PrismaClientInitializationError' ? 'Database connection failed.' : error.message;
  console.error(message);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
