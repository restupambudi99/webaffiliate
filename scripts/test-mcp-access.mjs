import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mcpCanonicalResponse } from '../src/lib/mcp-access.ts';

test('only the canonical MCP URL reaches the native Bearer-only guard', () => {
  for (const path of ['/_emdash/api/mcp/', '/%5Femdash/api/mcp', '/_emdash%2Fapi/mcp', '/_emdash//api/mcp', '/_emdash/api%2Fmcp', '/%255Femdash/api/mcp', '/_emdash%5Capi%5Cmcp']) {
    const response = mcpCanonicalResponse(new Request(`https://affiliate.restupambudi.my.id${path}`, {
      method: 'POST', headers: { Cookie: 'session=not-a-token' },
    }));
    assert.equal(response?.status, 400, path);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
  }
});

test('canonical requests retain native auth and other CMS/public routes are unaffected', () => {
  for (const path of ['/_emdash/api/mcp', '/_emdash/api/mcp?client=codex', '/_emdash/api/oauth/token', '/_emdash/admin/setup', '/guides/', '/_emdash/api/mcp/other']) {
    assert.equal(mcpCanonicalResponse(new Request(`https://affiliate.restupambudi.my.id${path}`)), undefined, path);
  }
});
