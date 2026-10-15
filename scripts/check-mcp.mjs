import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { productionOrigin } from '../site.config.mjs';

const MCP_PATH = '/_emdash/api/mcp';
const RESOURCE_PATH = '/.well-known/oauth-protected-resource';
const AUTH_METADATA_PATH = '/.well-known/oauth-authorization-server/_emdash';

const HELP = `Usage: node scripts/check-mcp.mjs [--url ORIGIN] [--expected-origin ORIGIN] [--require-admin-protection]

Checks public MCP/OAuth discovery and rejected unauthenticated requests.
No valid OAuth client registration, token issuance, or content write is sent.

  --url ORIGIN                   Request target; defaults to site.config.mjs productionOrigin.
  --expected-origin ORIGIN       Canonical metadata origin; defaults to productionOrigin.
                                HTTP is accepted only for localhost/loopback development.
  --require-admin-protection     Also require anonymous admin and setup responses to be 401.
                                Otherwise their status is reported without an assertion.
  --help                        Show this help.
`;

function originOnly(input, label) {
  let url;
  try { url = new URL(input); } catch { throw new Error(`${label} must be an absolute origin.`); }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash
    || (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback))) {
    throw new Error(`${label} must be an HTTPS origin without credentials, path, query, or fragment; loopback HTTP is allowed.`);
  }
  return url.origin;
}

export function parseOptions(args) {
  const options = { origin: productionOrigin, expectedOrigin: productionOrigin, requireAdminProtection: false, help: false };
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--help') { options.help = true; continue; }
    if (argument === '--require-admin-protection') { options.requireAdminProtection = true; continue; }
    const [name, ...inline] = argument.split('=');
    if (name !== '--url' && name !== '--expected-origin') throw new Error(`Unknown option: ${name}`);
    const value = inline.length ? inline.join('=') : args[++index];
    if (!value || value.startsWith('--')) throw new Error(`${name} requires an origin.`);
    if (name === '--url') options.origin = originOnly(value, name);
    else options.expectedOrigin = originOnly(value, name);
  }
  options.origin = originOnly(options.origin, '--url');
  options.expectedOrigin = originOnly(options.expectedOrigin, '--expected-origin');
  return options;
}

function assertUrl(actual, expectedOrigin, path, name) {
  assert.equal(actual, `${expectedOrigin}${path}`, `${name} must use the configured canonical origin and endpoint`);
}

function assertDiscoveryChallenge(response, expectedOrigin) {
  assert.equal(response.status, 401, 'MCP must reject the request with 401');
  const challenge = response.headers.get('www-authenticate') ?? '';
  assert.match(challenge, /\bBearer\b/i, 'MCP 401 must advertise Bearer auth, without a Basic-only proxy challenge');
  const metadata = /\bresource_metadata=(?:"([^"]+)"|([^\s,]+))/i.exec(challenge);
  assertUrl(metadata?.[1] ?? metadata?.[2], expectedOrigin, RESOURCE_PATH, 'resource_metadata');
}

/** All POST payloads below are auth-negative or invalid before any OAuth record is created. */
export async function runMcpSmoke(options, { fetchImpl = fetch, report = () => {} } = {}) {
  const origin = originOnly(options.origin ?? productionOrigin, '--url');
  const expectedOrigin = originOnly(options.expectedOrigin ?? productionOrigin, '--expected-origin');
  const results = [];
  const request = (path, init = {}) => fetchImpl(`${origin}${path}`, {
    redirect: 'manual', credentials: 'omit', cache: 'no-store',
    signal: AbortSignal.timeout(10_000), ...init,
  });
  const check = async (name, action) => {
    try {
      await action();
      const result = { level: 'pass', name };
      results.push(result); report(result);
    } catch (error) {
      const result = { level: 'fail', name, detail: error instanceof Error ? error.message : 'Check failed' };
      results.push(result); report(result);
    }
  };

  await check('MCP initialize without a token returns OAuth discovery 401', async () => {
    const response = await request(MCP_PATH, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'myjourney-mcp-smoke', version: '1.0.0' } } }),
    });
    assertDiscoveryChallenge(response, expectedOrigin);
    await response.arrayBuffer();
  });

  await check('MCP tools/list with a bogus Bearer token is rejected', async () => {
    const response = await request(MCP_PATH, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', Authorization: 'Bearer invalid-mcp-smoke-token' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
    });
    assertDiscoveryChallenge(response, expectedOrigin);
    await response.arrayBuffer();
  });

  await check('Protected resource metadata identifies the public MCP origin', async () => {
    const response = await request(RESOURCE_PATH);
    assert.equal(response.status, 200, 'Protected-resource discovery must be public');
    const metadata = await response.json();
    assertUrl(metadata.resource, expectedOrigin, MCP_PATH, 'resource');
    assert.deepEqual(metadata.authorization_servers, [`${expectedOrigin}/_emdash`]);
    assert.ok(metadata.bearer_methods_supported?.includes('header'), 'Bearer header authentication must be advertised');
  });

  await check('OAuth metadata advertises canonical endpoints, PKCE S256, and public client registration', async () => {
    const response = await request(AUTH_METADATA_PATH);
    assert.equal(response.status, 200, 'Authorization-server discovery must be public');
    const metadata = await response.json();
    for (const [field, path] of Object.entries({
      issuer: '/_emdash', authorization_endpoint: '/_emdash/oauth/authorize',
      token_endpoint: '/_emdash/api/oauth/token', registration_endpoint: '/_emdash/api/oauth/register',
      device_authorization_endpoint: '/_emdash/api/oauth/device/code',
    })) assertUrl(metadata[field], expectedOrigin, path, field);
    assert.ok(metadata.code_challenge_methods_supported?.includes('S256'), 'OAuth must support PKCE S256');
    assert.ok(metadata.token_endpoint_auth_methods_supported?.includes('none'), 'OAuth must accept public clients');
    assert.ok(metadata.response_types_supported?.includes('code'), 'OAuth authorization code flow must be advertised');
    for (const grant of ['authorization_code', 'refresh_token', 'urn:ietf:params:oauth:grant-type:device_code']) {
      assert.ok(metadata.grant_types_supported?.includes(grant), `OAuth must advertise ${grant}`);
    }
  });

  await check('Malformed registration is rejected before creating a client', async () => {
    const response = await request('/_emdash/api/oauth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(response.status, 400, 'Empty client metadata must be rejected, without a proxy login challenge');
    assert.equal((await response.json()).error, 'invalid_client_metadata');
  });

  await check('Malformed token request is rejected before issuing a token', async () => {
    const response = await request('/_emdash/api/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: '' });
    assert.equal(response.status, 400, 'A token request without grant_type must be rejected');
    assert.equal((await response.json()).error, 'invalid_request');
  });

  for (const [name, path] of [['admin', '/_emdash/admin/'], ['setup', '/_emdash/admin/setup']]) {
    if (options.requireAdminProtection) {
      await check(`Anonymous ${name} remains protected during owner onboarding`, async () => {
        const response = await request(path);
        assert.equal(response.status, 401, `Anonymous ${name} must remain behind the owner onboarding gate`);
        await response.arrayBuffer();
      });
    } else {
      try {
        const response = await request(path);
        const result = { level: 'info', name: `Anonymous ${name} status`, detail: String(response.status) };
        results.push(result); report(result);
        await response.arrayBuffer();
      } catch {
        const result = { level: 'info', name: `Anonymous ${name} status`, detail: 'unavailable' };
        results.push(result); report(result);
      }
    }
  }
  return { ok: !results.some((result) => result.level === 'fail'), results };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseOptions(process.argv.slice(2));
    if (options.help) console.log(HELP);
    else {
      console.log(`MCP smoke target: ${options.origin}; canonical origin: ${options.expectedOrigin}`);
      const { ok, results } = await runMcpSmoke(options, { report: ({ level, name, detail }) => console.log(`${level.toUpperCase()} ${name}${detail ? `: ${detail}` : ''}`) });
      console.log(`${results.filter((result) => result.level === 'pass').length} checks passed; ${results.filter((result) => result.level === 'fail').length} failed. No valid registration, token issuance, or content write was requested.`);
      process.exitCode = ok ? 0 : 1;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'MCP smoke check failed.');
    process.exitCode = 1;
  }
}
