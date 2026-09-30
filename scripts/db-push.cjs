/* eslint-disable @typescript-eslint/no-require-imports */
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { loadEnvConfig } = require('@next/env');

// Use the same environment precedence as the app for both schema and security.
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production', {
  info() {}, error() {},
});
const push = spawnSync(process.execPath,
  [require.resolve('prisma/build/index.js'), 'db', 'push', ...process.argv.slice(2)],
  { stdio: 'inherit', env: process.env });
if (push.error || push.status !== 0) {
  console.error('Schema push failed; no follow-up security changes were attempted.');
  process.exit(push.status || 1);
}
const secure = spawnSync(process.execPath,
  [path.join(__dirname, 'db-security.cjs'), '--apply'],
  { stdio: 'inherit', env: process.env });
if (secure.error || secure.status !== 0) {
  console.error('Schema pushed, but security verification failed. Fix this before deployment.');
  process.exit(secure.status || 1);
}
