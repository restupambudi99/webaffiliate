import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PasswordStore, hashPassword, verifyPassword, validNewPassword } from '../src/auth/password-store.ts';
import { passwordRequestAllowed, passwordLoginRedirect, safeAuthRedirect, readPasswordBody } from '../src/auth/password-policy.ts';

test('password KDF supports spaces/Unicode and never normalizes the secret', async () => {
  const secret = ' cerita kopi senja 🏡 ';
  const credential = await hashPassword(secret);
  assert.equal(await verifyPassword(secret, credential), true);
  assert.equal(await verifyPassword(secret.trim(), credential), false);
  assert.equal(await verifyPassword(secret), false);
  assert.equal(validNewPassword('short'), false);
  assert.equal(validNewPassword('x'.repeat(129)), false);
});

test('enrollment is owner-bound, expiring, atomic, single use and cannot silently replace passwords', () => {
  const store = new PasswordStore(':memory:');
  const credential = { salt: 'ab'.repeat(32), hash: 'cd'.repeat(64) };
  const token = store.issueEnrollment('owner', { now: 1000, ttlMs: 1000 });
  assert.equal(store.consumeEnrollment(token, 'other', credential, 1500), false);
  assert.equal(store.consumeEnrollment(token, 'owner', credential, 2000), false);
  assert.equal(store.consumeEnrollment(token, 'owner', credential, 1500), true);
  assert.equal(store.consumeEnrollment(token, 'owner', credential, 1500), false);
  assert.throws(() => store.issueEnrollment('owner'), /explicit reset/);
  const reset = store.issueEnrollment('owner', { reset: true });
  assert.equal(store.consumeEnrollment(reset, 'owner', credential), true);
  assert.equal(JSON.stringify(store.db.prepare('SELECT * FROM enrollments').all()).includes(token), false);
  store.close();
});

test('throttle persists across connections and applies before work without trusting proxy headers', () => {
  const dir = mkdtempSync(join(tmpdir(), 'myjourney-auth-'));
  const path = join(dir, 'auth.db');
  try {
    let store = new PasswordStore(path);
    for (let i = 0; i < 8; i++) assert.equal(store.allowAttempt('Owner@Example.test', 'login', 1000), true);
    store.close();
    store = new PasswordStore(path);
    assert.equal(store.allowAttempt(' owner@example.test ', 'login', 1000), false);
    for (let i = 0; i < 32; i++) assert.equal(store.allowAttempt(`other${i}@example.test`, 'login', 1000), true);
    assert.equal(store.allowAttempt('another@example.test', 'login', 1000), false);
    assert.equal(store.allowAttempt('owner@example.test', 'login', 901001), true);
    store.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('login requires exact browser Origin, JSON and custom request header', () => {
  const origin = 'https://affiliate.restupambudi.my.id';
  const request = (headers) => new Request(`${origin}/_emdash/api/auth/password/login`, { method: 'POST', headers });
  const good = { Origin: origin, 'Content-Type': 'application/json', 'X-EmDash-Request': '1' };
  assert.equal(passwordRequestAllowed(request(good), origin), true);
  for (const headers of [{ ...good, Origin: 'https://evil.test' }, { ...good, Origin: '' }, { ...good, 'Content-Type': 'text/plain' }, { ...good, 'X-EmDash-Request': '' }]) assert.equal(passwordRequestAllowed(request(headers), origin), false);
});

test('redirects preserve native OAuth consent query while blocking external URLs and login loops', () => {
  const oauth = '/_emdash/oauth/authorize?client_id=example&state=xyz&redirect_uri=http%3A%2F%2Flocalhost%3A9999%2Fcallback';
  assert.equal(safeAuthRedirect(oauth), oauth);
  assert.equal(safeAuthRedirect('/_emdash/admin/content?collection=guides'), '/_emdash/admin/content?collection=guides');
  for (const value of ['https://evil.test', '//evil.test', '/\\evil.test', '/%5cevil', '/_emdash/admin/login', '/_emdash/admin/setup', '/guides/', '/_emdash/admin/%0afoo', '/_emdash/admin/%2f%2fevil']) assert.equal(safeAuthRedirect(value), '/_emdash/admin/');
  const redirect = passwordLoginRedirect(new Request('https://affiliate.restupambudi.my.id/_emdash/admin/login?redirect=' + encodeURIComponent(oauth)));
  assert.equal(new URL(redirect.headers.get('location'), 'https://example.test').searchParams.get('redirect'), oauth);
  assert.equal(passwordLoginRedirect(new Request('https://example.test/_emdash/admin/login?method=passkey')), undefined);
});

test('oversized and malformed login input is rejected without parsing an unlimited body', async () => {
  assert.equal(await readPasswordBody(new Request('https://example.test', { method: 'POST', body: 'x'.repeat(8193) })), undefined);
  assert.equal(await readPasswordBody(new Request('https://example.test', { method: 'POST', body: '[]' })), undefined);
  assert.deepEqual(await readPasswordBody(new Request('https://example.test', { method: 'POST', body: '{"email":"example@test"}' })), { email: 'example@test' });
});
