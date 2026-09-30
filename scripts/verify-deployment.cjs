/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { loadEnvConfig } = require('@next/env');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const base = process.argv[2];
if (!base || new URL(base).protocol !== 'https:') {
  throw new Error('Pass the HTTPS deployment URL to verify.');
}
const prisma = new PrismaClient();
const suffix = randomBytes(12).toString('hex');
const emails = [`security-check-a-${suffix}@example.invalid`,
  `security-check-b-${suffix}@example.invalid`];
const password = randomBytes(24).toString('hex');

async function request(route, { method = 'GET', cookie, body } = {}) {
  const response = await fetch(new URL(route, base), {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20000),
  });
  assert.match(response.headers.get('content-type') || '', /application\/json/,
    `Expected JSON: ${method} ${route} (${response.status})`);
  return { status: response.status, body: await response.json(),
    setCookie: response.headers.get('set-cookie') };
}

async function main() {
  assert.equal((await request('/api/likes')).status, 401);
  assert.equal((await request('/api/auth/me')).body.user, null);
  const accounts = [];
  for (const email of emails) {
    const result = await request('/api/auth/signup', {
      method: 'POST', body: { email, password, name: 'Temporary security check' },
    });
    assert.equal(result.status, 200, 'Signup must work after the database fix');
    assert.equal(result.body.user.email, email);
    assert.equal(result.body.user.passwordHash, undefined);
    assert.match(result.setCookie || '', /HttpOnly/i);
    assert.match(result.setCookie || '', /Secure/i);
    assert.match(result.setCookie || '', /SameSite=Lax/i);
    const record = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    assert.equal(record?.id, result.body.user.id,
      'The production app and local verification must use the same database');
    accounts.push({ user: result.body.user, cookie: result.setCookie.split(';')[0] });
  }
  const [a, b] = accounts;
  const badLogin = await request('/api/auth/login', {
    method: 'POST', body: { email: emails[0], password: 'incorrect-test-password' },
  });
  assert.equal(badLogin.status, 401);
  const login = await request('/api/auth/login', {
    method: 'POST', body: { email: emails[0], password },
  });
  assert.equal(login.status, 200);
  a.cookie = login.setCookie.split(';')[0];
  assert.equal((await request('/api/auth/me', { cookie: a.cookie })).body.user.id, a.user.id);
  const forged = jwt.sign(a.user, 'dev-secret-change-me', { expiresIn: '1h' });
  assert.equal((await request('/api/likes', { cookie: `music_session=${forged}` })).status, 401);

  const track = { trackId: `security-check-${suffix}`, title: 'Temporary security check',
    artist: 'Test fixture', source: 'audius' };
  assert.equal((await request('/api/likes', {
    method: 'POST', cookie: a.cookie, body: track,
  })).status, 200);
  assert.equal((await request(`/api/likes?trackId=${track.trackId}`, { cookie: a.cookie })).body.liked, true);
  assert.equal((await request(`/api/likes?trackId=${track.trackId}`, { cookie: b.cookie })).body.liked, false);
  await request(`/api/likes?trackId=${track.trackId}`, { method: 'DELETE', cookie: b.cookie });
  assert.equal((await request(`/api/likes?trackId=${track.trackId}`, { cookie: a.cookie })).body.liked, true);

  const created = await request('/api/playlists', {
    method: 'POST', cookie: a.cookie, body: { name: 'Temporary security check' },
  });
  assert.equal(created.status, 200);
  const playlistRoute = `/api/playlists/${created.body.playlist.id}`;
  assert.equal((await request(playlistRoute, { cookie: b.cookie })).status, 404);
  assert.equal((await request(playlistRoute, {
    method: 'PATCH', cookie: b.cookie, body: { name: 'Unauthorized change' },
  })).body.ok, false);
  await request(playlistRoute, { method: 'DELETE', cookie: b.cookie });
  assert.equal((await request(playlistRoute, { cookie: a.cookie })).body.playlist.name,
    'Temporary security check');
  assert.equal((await request(`${playlistRoute}/tracks`, {
    method: 'POST', cookie: b.cookie, body: track,
  })).status, 404);
  assert.equal((await request(`${playlistRoute}/tracks?trackId=${track.trackId}`, {
    method: 'DELETE', cookie: b.cookie,
  })).status, 404);
  assert.equal((await request(`${playlistRoute}/tracks`, {
    method: 'POST', cookie: a.cookie, body: track,
  })).status, 200);
  assert.equal((await request(playlistRoute, { cookie: a.cookie })).body.playlist.tracks.length, 1);
  assert.equal((await request(playlistRoute, {
    method: 'PATCH', cookie: a.cookie, body: { name: 'Updated security check' },
  })).body.ok, true);
  assert.equal((await request(`${playlistRoute}/tracks?trackId=${track.trackId}`, {
    method: 'DELETE', cookie: a.cookie,
  })).status, 200);
  assert.equal((await request(playlistRoute, { cookie: a.cookie })).body.playlist.tracks.length, 0);
  assert.equal((await request(playlistRoute, { method: 'DELETE', cookie: a.cookie })).body.ok, true);
  assert.equal((await request(playlistRoute, { cookie: a.cookie })).status, 404);
  await request(`/api/likes?trackId=${track.trackId}`, { method: 'DELETE', cookie: a.cookie });
  assert.equal((await request(`/api/likes?trackId=${track.trackId}`, { cookie: a.cookie })).body.liked, false);
  const logout = await request('/api/auth/logout', { method: 'POST', cookie: a.cookie });
  assert.equal(logout.status, 200);
  assert.match(logout.setCookie || '', /music_session=;/);
  console.log('PASS: production signup, login, secure cookies, forged-token rejection, likes, playlists, tracks, logout, and isolation between two accounts.');
}

main().catch(error => {
  console.error(error instanceof assert.AssertionError ? error.message :
    'Deployment verification failed; inspect the API response or database connectivity.');
  process.exitCode = 1;
}).finally(async () => {
  try {
    // Delete only the two uniquely named fixtures this run generated; cascading
    // relations remove their test likes and playlists. Existing users are untouched.
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    assert.equal(await prisma.user.count({ where: { email: { in: emails } } }), 0);
    console.log('PASS: temporary test accounts and their saved data were cleaned up.');
  } catch {
    console.error('Temporary fixture cleanup failed; remove security-check accounts from this run.');
    process.exitCode = 1;
  } finally { await prisma.$disconnect(); }
});
