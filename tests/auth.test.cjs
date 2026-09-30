/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { test, beforeEach, after } = require('node:test');
const { randomBytes } = require('node:crypto');
const ts = require('typescript');
const jwt = require('jsonwebtoken');

// Run the real auth implementation with only Next's request context and the
// database stubbed. Signing and signature verification use real jsonwebtoken.
const sourcePath = path.join(__dirname, '../src/lib/auth.ts');
const authModule = new Module(sourcePath, module);
authModule.paths = module.paths;
let cookieValue;
let cookieWrite;
let dbUser;
let dbQuery;
const realRequire = authModule.require.bind(authModule);
authModule.require = name => {
  if (name === 'server-only') return {};
  if (name === 'next/headers') return { cookies: async () => ({
    get: () => cookieValue ? { value: cookieValue } : undefined,
    set: (...args) => { cookieWrite = args; },
    delete: () => { cookieValue = undefined; },
  }) };
  if (name === './db') return { prisma: { user: {
    findUnique: async query => { dbQuery = query; return dbUser; },
  } } };
  return realRequire(name);
};
authModule._compile(ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText, sourcePath);
const auth = authModule.exports;
const originalSecret = process.env.JWT_SECRET;
const originalNodeEnv = process.env.NODE_ENV;
const secret = randomBytes(32).toString('hex');
const user = { id: 'test-user', email: 'test@example.invalid', name: 'Test user' };

beforeEach(() => {
  process.env.JWT_SECRET = secret;
  cookieValue = undefined;
  cookieWrite = undefined;
  dbUser = null;
  dbQuery = undefined;
});
after(() => {
  if (originalSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalSecret;
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
});

test('a signed session verifies and returns only public user fields', () => {
  assert.deepEqual(auth.verifyToken(auth.signToken(user)), user);
  const token = jwt.sign({ ...user, extra: 'private' }, secret, { expiresIn: '1h' });
  assert.deepEqual(auth.verifyToken(token), user);
});

test('missing and known default secrets cannot sign or accept sessions', () => {
  const token = auth.signToken(user);
  for (const value of [undefined, '', 'dev-secret-change-me']) {
    if (value === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = value;
    assert.throws(() => auth.signToken(user), /JWT_SECRET/);
    assert.equal(auth.verifyToken(token), null);
  }
});

test('forged signatures, unexpected algorithms, and expired sessions are denied', () => {
  const invalid = [
    'not-a-token',
    jwt.sign(user, randomBytes(32).toString('hex'), { expiresIn: '1h' }),
    jwt.sign(user, secret, { algorithm: 'HS384', expiresIn: '1h' }),
    jwt.sign(user, secret, { expiresIn: -1 }),
    jwt.sign({ ...user, iat: Math.floor(Date.now() / 1000) - 8 * 86400 }, secret, { expiresIn: '30d' }),
  ];
  for (const token of invalid) assert.equal(auth.verifyToken(token), null);
});

test('signed tokens without expiry or valid user claims are denied', () => {
  for (const payload of [user, { ...user, id: {} }, { ...user, email: '' },
    { ...user, name: null }]) {
    const options = payload === user ? {} : { expiresIn: '1h' };
    assert.equal(auth.verifyToken(jwt.sign(payload, secret, options)), null);
  }
});

test('authorization checks the current database user and never selects password hashes', async () => {
  cookieValue = auth.signToken(user);
  assert.equal(await auth.requireUser(), null);
  dbUser = { ...user, name: 'Current name' };
  assert.deepEqual(await auth.requireUser(), dbUser);
  assert.deepEqual(dbQuery, {
    where: { id: user.id }, select: { id: true, email: true, name: true },
  });
});

test('production session cookies remain secure and unavailable to browser JavaScript', async () => {
  process.env.NODE_ENV = 'production';
  await auth.setSessionCookie(user);
  const [name, token, options] = cookieWrite;
  assert.equal(name, 'music_session');
  assert.deepEqual(auth.verifyToken(token), user);
  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, true);
  assert.equal(options.sameSite, 'lax');
  assert.equal(options.maxAge, 7 * 86400);
});
