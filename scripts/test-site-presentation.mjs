import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeSitePresentation } from '../src/lib/site-presentation.ts';
import { settings } from '../src/lib/settings.ts';

test('missing site settings preserve the theme identity and description', () => {
  const site = normalizeSitePresentation(undefined);
  assert.equal(site.brand, settings.brand);
  assert.equal(site.tagline, settings.tagline);
  assert.equal(site.description, settings.description);
  assert.equal(site.titleSeparator, ' — ');
  assert.equal(site.logo, undefined);
  assert.equal(site.favicon, undefined);
});

test('native CMS identity and resolved media override the theme without a schema extension', () => {
  const site = normalizeSitePresentation({
    title: '  Field Notes  ', tagline: 'Useful choices.\nEvery day.',
    logo: { mediaId: 'logo', url: '/_emdash/api/media/file/logo.webp', contentType: 'image/webp', width: 640, height: 160, alt: 'Field Notes logo' },
    favicon: { mediaId: 'icon', url: '/_emdash/api/media/file/icon.png', contentType: 'image/png' },
    seo: { titleSeparator: '|', defaultOgImage: { mediaId: 'social', url: 'https://cdn.example.com/social.jpg', contentType: 'image/jpeg' } },
  });
  assert.equal(site.brand, 'Field Notes');
  assert.equal(site.tagline, 'Useful choices. Every day.');
  assert.equal(site.description, 'Useful choices. Every day.');
  assert.equal(site.titleSeparator, ' | ');
  assert.equal(site.logo.url, '/_emdash/api/media/file/logo.webp');
  assert.equal(site.logo.alt, 'Field Notes logo');
  assert.equal(site.logo.width, 640);
  assert.equal(site.favicon.contentType, 'image/png');
  assert.equal(site.defaultOgImage.url, 'https://cdn.example.com/social.jpg');
});

test('cleared or deleted media references restore the wordmark and bundled favicon', () => {
  const site = normalizeSitePresentation({ title: ' ', tagline: '', logo: null, favicon: { mediaId: 'deleted' }, seo: { defaultOgImage: null } });
  assert.equal(site.brand, settings.brand);
  assert.equal(site.tagline, '');
  assert.equal(site.description, settings.description);
  assert.equal(site.logo, undefined);
  assert.equal(site.favicon, undefined);
  assert.equal(site.defaultOgImage, undefined);
});

test('unsafe URLs and non-image media cannot become public identity assets', () => {
  for (const url of ['javascript:alert(1)', 'data:image/svg+xml,<svg/>', '//untrusted.example/logo.png', '/\\untrusted.example/logo.png', 'https://user:password@example.com/logo.png', 'https://example.com/\nlogo.png']) {
    assert.equal(normalizeSitePresentation({ logo: { mediaId: 'bad', url, contentType: 'image/png' } }).logo, undefined, url);
  }
  assert.equal(normalizeSitePresentation({ favicon: { mediaId: 'html', url: '/_emdash/api/media/file/file.html', contentType: 'text/html' } }).favicon, undefined);
  const unknownSize = normalizeSitePresentation({ logo: { mediaId: 'logo', url: '/_emdash/api/media/file/logo.svg', contentType: 'image/svg+xml', width: -10, height: '40' } });
  assert.equal(unknownSize.logo.width, undefined);
  assert.equal(unknownSize.logo.height, undefined);
});
