import assert from 'node:assert/strict';
import { test } from 'node:test';

test('editorial mode hides every affiliate CTA', async () => {
  process.env.AFFILIATE_MODE='editorial_only';
  const { affiliateHref }=await import('../src/lib/settings.ts?editorial-test');
  assert.equal(affiliateHref({label:'Reference',destinationUrl:'https://www.amazon.com/dp/B012345678?tag=owned-20',verifiedAt:'2026-10-14',active:true,eligibilityReviewed:true}),null);
});

test('affiliate mode only exposes an explicitly verified product URL and matching owner tag', async () => {
  process.env.AFFILIATE_MODE='affiliate'; process.env.AMAZON_ASSOCIATE_TAG='owned-20'; process.env.AMAZON_SITE_REGISTERED='true';
  const { affiliateHref }=await import('../src/lib/settings.ts?affiliate-test');
  const product={label:'Reference',destinationUrl:'https://www.amazon.com/dp/B012345678?tag=owned-20',verifiedAt:'2026-10-14',active:true,eligibilityReviewed:true};
  assert.equal(affiliateHref(product),product.destinationUrl);
  for(const destinationUrl of ['https://www.amazon.com/dp/B012345678?tag=other-20','https://www.amazon.com.evil.test/dp/B012345678?tag=owned-20','javascript:alert(1)','https://www.amazon.com/s?k=lamp&tag=owned-20','http://www.amazon.com/dp/B012345678?tag=owned-20','https://user@www.amazon.com/dp/B012345678?tag=owned-20']) assert.equal(affiliateHref({...product,destinationUrl}),null);
  assert.equal(affiliateHref({...product,active:false}),null);
  assert.equal(affiliateHref({...product,eligibilityReviewed:false}),null);
  assert.equal(affiliateHref({...product,verifiedAt:''}),null);
});

test('CMS publication rejects incomplete evidence and unsupported testing claims', async () => {
  const { validatePublication }=await import('../src/plugins/editorial-gate.ts');
  const valid={title:'A guide',summary:'Reader benefit',author_name:'Owner',editor_name:'Editor',reader_question:'Fit?',analysis_limitations:'Compatibility varies',image_rights:'Original art',conflict_statement:'None declared',workflow_state:'compliance_review',editorial_approved:true,rights_confirmed:true,research_sources:[{label:'Official specification',url:'https://example.com/specification'}],content:[{_type:'block',children:[{_type:'span',text:'Measure the usable desk space and compare the exact accessory footprint before choosing.'}]}],evidence_type:'Desk research',reviewed_at:'2026-01-01T00:00:00Z'};
  const event=(data)=>({collection:'guides',content:{data}});
  assert.equal(validatePublication(event(valid)),undefined);
  for(const data of [{...valid,author_name:''},{...valid,rights_confirmed:false},{...valid,research_sources:[]},{...valid,workflow_state:'draft'},{...valid,evidence_type:'Hands-on tested',test_notes:''},{...valid,reviewed_at:'2999-01-01'},{...valid,content:[]}]) assert.equal(validatePublication(event(data))?.cancel,true);
});
