import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseOptions, runMcpSmoke } from './check-mcp.mjs';

const canonical = 'https://affiliate.restupambudi.my.id';
function fixture({ wrongOrigin = false, basicAuth = false } = {}) {
  const calls = [];
  const fetchImpl = async (input, init) => {
    const path = new URL(input).pathname;
    calls.push({ path, ...init });
    if (path === '/_emdash/api/mcp') return new Response('{}', { status: 401, headers: { 'WWW-Authenticate': basicAuth ? 'Basic realm="owner"' : `Bearer resource_metadata="${canonical}/.well-known/oauth-protected-resource"` } });
    if (path === '/.well-known/oauth-protected-resource') return Response.json({ resource: `${wrongOrigin ? 'http://localhost:4321' : canonical}/_emdash/api/mcp`, authorization_servers: [`${canonical}/_emdash`], bearer_methods_supported: ['header'] });
    if (path === '/.well-known/oauth-authorization-server/_emdash') return Response.json({
      issuer: `${canonical}/_emdash`, authorization_endpoint: `${canonical}/_emdash/oauth/authorize`, token_endpoint: `${canonical}/_emdash/api/oauth/token`, registration_endpoint: `${canonical}/_emdash/api/oauth/register`, device_authorization_endpoint: `${canonical}/_emdash/api/oauth/device/code`, code_challenge_methods_supported: ['S256'], token_endpoint_auth_methods_supported: ['none'], response_types_supported: ['code'], grant_types_supported: ['authorization_code', 'refresh_token', 'urn:ietf:params:oauth:grant-type:device_code'],
    });
    if (path.endsWith('/oauth/register')) return Response.json({ error: 'invalid_client_metadata' }, { status: 400 });
    if (path.endsWith('/oauth/token')) return Response.json({ error: 'invalid_request' }, { status: 400 });
    return new Response('Owner protection', { status: 401 });
  };
  return { calls, fetchImpl };
}

test('Smoke check sends only auth-negative MCP and malformed OAuth POSTs', async () => {
  const { calls, fetchImpl } = fixture();
  const result = await runMcpSmoke({ origin: 'http://127.0.0.1:4321', expectedOrigin: canonical, requireAdminProtection: true }, { fetchImpl });
  assert.equal(result.ok, true);
  assert.equal(result.results.filter(({ level }) => level === 'pass').length, 8);
  const posts = calls.filter(({ method }) => method === 'POST');
  assert.equal(posts.length, 4);
  assert.deepEqual(posts.filter(({ path }) => path.endsWith('/mcp')).map(({ body }) => JSON.parse(body).method), ['initialize', 'tools/list']);
  assert.equal(posts.find(({ path }) => path.endsWith('/register')).body, '{}');
  assert.equal(posts.find(({ path }) => path.endsWith('/token')).body, '');
  assert.ok(calls.every(({ redirect, credentials }) => redirect === 'manual' && credentials === 'omit'));
});

test('Smoke check catches an internal discovery origin and BasicAuth masking Bearer auth', async () => {
  const { fetchImpl } = fixture({ wrongOrigin: true, basicAuth: true });
  const result = await runMcpSmoke({ origin: canonical }, { fetchImpl });
  assert.equal(result.ok, false);
  assert.equal(result.results.filter(({ level }) => level === 'fail').length, 3);
});

test('Smoke CLI keeps canonical metadata distinct from a loopback transport target', () => {
  assert.equal(parseOptions(['--url', 'http://localhost:4321']).expectedOrigin, canonical);
  assert.equal(parseOptions(['--url=http://127.0.0.1:4321', '--expected-origin', 'http://localhost:4321']).origin, 'http://127.0.0.1:4321');
  for (const origin of ['http://public.example', 'https://user:password@example.com', `${canonical}/_emdash/api/mcp`, `${canonical}?token=secret`]) assert.throws(() => parseOptions(['--url', origin]));
});
