import assert from 'node:assert/strict';
import { test } from 'node:test';
import { editorialBodyForDisplay, hasBlockedAmazonBodyLink, hasEditorialBodyText, productReferencesFrom, safeBodyHref, safeResearchHref } from '../src/lib/cms-policy.ts';
import { createPlugin, validatePublication } from '../src/plugins/editorial-gate.ts';
import { createHookPipeline } from 'emdash';
import { Kysely } from 'kysely';
import { createDialect } from 'emdash/db/sqlite';

const paragraph = { _type: 'block', style: 'normal', children: [{ _type: 'span', text: 'Editorial guidance with a concrete purpose.' }], markDefs: [] };
const valid = {
  title: 'A guide', summary: 'Reader benefit', author_name: 'Owner', editor_name: 'Editor',
  reader_question: 'Fit?', analysis_limitations: 'Compatibility varies', image_rights: 'Original art',
  conflict_statement: 'None declared', workflow_state: 'compliance_review', editorial_approved: true,
  rights_confirmed: true, research_sources: [{ label: 'Official specification', url: 'https://example.com/specification' }],
  content: [paragraph], evidence_type: 'Desk research', reviewed_at: '2026-01-01T00:00:00Z',
};
const event = (data) => ({ collection: 'guides', content: { data }, origin: { source: 'api' } });

test('CMS body links cannot bypass the verified affiliate CTA', () => {
  for (const href of ['https://www.amazon.com/dp/B012345678?tag=other-20', 'https://amazon.co.uk/product', 'https://smile.amazon.de/product', 'https://amzn.to/short', 'https://a.co/short', 'https://amzn.eu/short', 'https://amazon.com./dp/B012345678']) {
    assert.equal(safeBodyHref(href), undefined);
    const content = [{ ...paragraph, markDefs: [{ _key: 'link', _type: 'link', href }] }];
    assert.equal(hasBlockedAmazonBodyLink(content), true);
    assert.equal(validatePublication(event({ ...valid, content }))?.cancel, true);
  }
  for (const href of ['javascript:alert(1)', 'data:text/html,unsafe', 'https://user:pass@example.com']) assert.equal(safeBodyHref(href), undefined);
  assert.equal(safeBodyHref('https://example.com/advice'), 'https://example.com/advice');
});

test('research sources exclude retail, shortened, and tagged Amazon links', () => {
  for (const url of ['https://amazon.com/dp/B012345678', 'https://amzn.to/product', 'https://a.co/product', 'https://affiliate-program.amazon.com/help/operating/agreement?tag=other-20']) {
    assert.equal(safeResearchHref(url), undefined);
    assert.equal(validatePublication(event({ ...valid, research_sources: [{ label: 'Unsafe source', url }] }))?.cancel, true);
  }
  assert.equal(safeResearchHref('https://affiliate-program.amazon.com/help/operating/agreement'), 'https://affiliate-program.amazon.com/help/operating/agreement');
  assert.equal(safeResearchHref('https://example.com/specifications'), 'https://example.com/specifications');
});

test('empty Portable Text blocks cannot be published', () => {
  assert.equal(hasEditorialBodyText([paragraph]), true);
  for (const content of [[], [{ _type: 'block' }], [{ ...paragraph, children: [{ _type: 'span', text: ' \n\t ' }] }]]) {
    assert.equal(hasEditorialBodyText(content), false);
    assert.equal(validatePublication(event({ ...valid, content }))?.cancel, true);
  }
  assert.equal(validatePublication(event(valid)), undefined);
});

test('CMS product references preserve explicit verification and never activate defaults', () => {
  assert.deepEqual(productReferencesFrom(undefined), []);
  assert.deepEqual(productReferencesFrom([]), []);
  const inactive = { label: 'Reference', destinationUrl: 'https://www.amazon.com/dp/B012345678?tag=owned-20', verifiedAt: '', active: false, eligibilityReviewed: false };
  assert.equal(productReferencesFrom([inactive])[0].active, false);
  for (const product of [{ ...inactive, active: 'true' }, { ...inactive, active: true }, { ...inactive, verifiedAt: 'invalid' }, { ...inactive, destinationUrl: 'https://amzn.to/product' }]) assert.deepEqual(productReferencesFrom([product]), []);
});

test('existing CMS imports cannot render unsafe block or table links', () => {
  const linked = { ...paragraph, markDefs: [{ _type: 'link', _key: 'affiliate', href: 'https://amazon.com/dp/B012345678?tag=other-20' }], children: [{ _type: 'span', text: 'Product name', marks: ['affiliate'] }] };
  const input = [linked, { _type: 'htmlBlock', html: '<a href="https://amazon.com">Click</a>' }, { _type: 'button', url: 'https://a.co/short' }, { _type: 'iframe', src: 'https://example.com/embed' }, { _type: 'image', asset: { _ref: 'image', provider: 'local', url: 'https://amazon.com/image.jpg' } }, { _type: 'image', asset: { _ref: 'uploaded', provider: 'local', url: 'uploaded.jpg' } }];
  const output = editorialBodyForDisplay(input);
  assert.equal(output.length, 2);
  assert.deepEqual(output[0].markDefs, []);
  assert.deepEqual(output[0].children[0].marks, []);
  assert.equal(output[1]._type, 'image');
  assert.equal(hasBlockedAmazonBodyLink(output), false);
  assert.equal(validatePublication(event({ ...valid, content: [paragraph, { _type: 'htmlBlock', html: '<p>Unsupported</p>' }] }))?.cancel, true);
});

test('real EmDash hook pipeline registers and enforces publish and schedule policies', async () => {
  const database = new Kysely({ dialect: createDialect({ url: ':memory:' }) });
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args.join(' '));
  try {
    const plugin = createPlugin();
    assert.ok(plugin.capabilities.includes('hooks.content-policy:register'));
    const pipeline = createHookPipeline([plugin], { db: database });
    assert.equal(pipeline.hasHooks('content:beforePublish'), true);
    assert.equal(pipeline.hasHooks('content:beforeSchedule'), true);
    const rejected = await pipeline.runContentPolicy('content:beforePublish', event({ ...valid, editorial_approved: false }));
    assert.equal(rejected.cancellation?.pluginId, 'desk-edit-editorial-gate');
    assert.equal(rejected.results.length, 1);
    assert.equal(rejected.results[0].success, true);
    const accepted = await pipeline.runContentPolicy('content:beforePublish', event(valid));
    assert.equal(accepted.cancellation, undefined);
    assert.equal(accepted.results.length, 1);
    const scheduled = await pipeline.runContentPolicy('content:beforeSchedule', { ...event({ ...valid, rights_confirmed: false }), scheduledAt: '2030-01-01T00:00:00Z' });
    assert.equal(scheduled.cancellation?.pluginId, 'desk-edit-editorial-gate');
    assert.equal(warnings.some((warning) => warning.includes('capability') && warning.includes('skipping')), false);
  } finally {
    console.warn = originalWarn;
    await database.destroy();
  }
});
