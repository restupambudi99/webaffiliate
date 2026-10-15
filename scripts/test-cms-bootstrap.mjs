import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cmsBootstrapResponse } from '../src/lib/cms-bootstrap.ts';

test('Cloudflare CMS bootstrap defaults closed for admin, setup APIs, and media', async () => {
  for (const env of [undefined, null, {}, { CMS_ADMIN_ENABLED: 'false' }, { CMS_ADMIN_ENABLED: true }]) {
    for (const path of ['/_emdash', '/_emdash/', '/_emdash/admin/setup', '/_emdash/api/setup/admin/verify', '/_emdash/api/media/file/image', '/%5Femdash/api/setup', '/_emdash%2Fapi/setup']) {
      const response = cmsBootstrapResponse(new Request(`https://affiliate.restupambudi.my.id${path}`, { method: 'POST' }), env);
      assert.equal(response?.status, 503, `${path} should be held`);
      assert.equal(response.headers.get('cache-control'), 'private, no-store');
      assert.match(await response.text(), /CMS maintenance/);
    }
  }
});

test('Cloudflare CMS hold leaves public pages available and requires explicit enablement', () => {
  for (const path of ['/', '/articles/desk-lighting/', '/images/hero.webp', '/_emdashology']) {
    assert.equal(cmsBootstrapResponse(new Request(`https://affiliate.restupambudi.my.id${path}`), {}), undefined);
  }
  assert.equal(cmsBootstrapResponse(new Request('https://affiliate.restupambudi.my.id/_emdash/api/setup/admin'), { CMS_ADMIN_ENABLED: 'true' }), undefined);
});
