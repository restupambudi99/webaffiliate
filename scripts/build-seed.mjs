import { mkdir, writeFile } from 'node:fs/promises';
import { guides, categories } from '../src/data/guides.ts';

const textField = (slug, label, extra = {}) => ({ slug, label, type: 'string', ...extra });
const selectField = (slug, label, options, extra = {}) => ({ slug, label, type: 'select', validation: { options }, ...extra });
const block = (text, key, style = 'normal', extra = {}) => ({
  _type: 'block', _key: key, style, markDefs: [],
  children: [{ _type: 'span', _key: `${key}-text`, text, marks: [] }], ...extra,
});
const toPortableText = (sections) => sections.flatMap((section, index) => [
  block(section.heading, `section-${index}-heading`, 'h2'),
  ...section.paragraphs.map((paragraph, p) => block(paragraph, `section-${index}-p-${p}`)),
  ...(section.bullets || []).map((bullet, b) => block(bullet, `section-${index}-b-${b}`, 'normal', { listItem: 'bullet', level: 1 })),
]);

const seed = {
  $schema: 'https://emdashcms.com/seed.schema.json',
  version: '1',
  defaultLocale: 'en',
  meta: { name: 'MyJourney editorial theme', description: 'Independent workspace guides with an editorial publication gate.', author: 'MyJourney' },
  settings: { title: 'MyJourney', tagline: 'Make room for better work.', postsPerPage: 12, timezone: 'Asia/Bangkok' },
  collections: [
    {
      slug: 'guides', label: 'Editorial guides', labelSingular: 'Guide',
      description: 'Draft → research → editor review → compliance review. Publishing checks evidence and rights.',
      supports: ['drafts', 'revisions', 'preview', 'scheduling', 'search', 'seo'],
      urlPattern: '/articles/{slug}/', commentsEnabled: false, editLocking: true, titleField: 'title',
      admin: { listColumns: ['category', 'workflow_state'] },
      fields: [
        textField('title', 'Title', { required: true, searchable: true }),
        { slug: 'summary', label: 'Reader benefit / summary', type: 'text', required: true, searchable: true },
        selectField('category', 'Category', Object.keys(categories), { indexed: true }),
        { slug: 'content', label: 'Article body', type: 'portableText', searchable: true },
        { slug: 'sections', label: 'Legacy section data (optional)', type: 'json' },
        { slug: 'reading_minutes', label: 'Reading time in minutes', type: 'integer', defaultValue: 5, validation: { min: 1, max: 60 } },
        selectField('evidence_type', 'Type of evidence', ['Editorial guide', 'Desk research', 'Hands-on tested'], { defaultValue: 'Editorial guide' }),
        selectField('workflow_state', 'Editorial workflow', ['draft', 'research', 'editor_review', 'compliance_review', 'published', 'needs_update', 'archived'], { defaultValue: 'draft', indexed: true }),
        textField('author_name', 'Author name'),
        textField('editor_name', 'Reviewing editor'),
        { slug: 'research_sources', label: 'Research sources [{label, url}]', type: 'json' },
        { slug: 'product_references', label: 'Verified product references', type: 'json', defaultValue: [] },
        { slug: 'reader_question', label: 'Reader question and original value', type: 'text' },
        { slug: 'analysis_limitations', label: 'Limitations and recommendation reasoning', type: 'text' },
        { slug: 'test_notes', label: 'Testing notes (required for hands-on claims)', type: 'text' },
        { slug: 'image_rights', label: 'Media rights and provenance', type: 'text' },
        { slug: 'rights_confirmed', label: 'Rights to all media verified', type: 'boolean', defaultValue: false },
        { slug: 'conflict_statement', label: 'Conflicts of interest / sponsorship', type: 'text' },
        { slug: 'reviewed_at', label: 'Actual editorial review date', type: 'datetime' },
        { slug: 'editorial_approved', label: 'Editorial review approved', type: 'boolean', defaultValue: false },
        { slug: 'revision_reason', label: 'Reason for factual revision', type: 'text' },
      ],
    },
    {
      slug: 'pages', label: 'Site pages', labelSingular: 'Page', supports: ['drafts', 'revisions', 'preview', 'seo'],
      urlPattern: '/{slug}/', fields: [textField('title', 'Title', { required: true }), { slug: 'content', label: 'Content', type: 'portableText' }],
    },
    {
      slug: 'editorial_log', label: 'Editorial change log', labelSingular: 'Change', routable: false,
      supports: ['revisions'], group: 'Operations',
      fields: [textField('title', 'Change title', { required: true }), textField('article_slug', 'Article slug'), { slug: 'reason', label: 'Change reason', type: 'text' }, textField('reviewer', 'Reviewer'), { slug: 'reviewed_at', label: 'Actual change date', type: 'datetime' }],
    },
    {
      slug: 'site_register', label: 'Associates Site register', labelSingular: 'Site', routable: false,
      supports: ['revisions'], group: 'Operations',
      fields: [textField('title', 'Site name', { required: true }), { slug: 'site_url', label: 'Exact registered URL', type: 'url' }, textField('owner', 'Owner'), selectField('account_status', 'Associates Central status', ['not_registered', 'pending', 'active', 'removed'], { defaultValue: 'not_registered' }), { slug: 'added_at', label: 'Date added', type: 'datetime' }, { slug: 'traffic_sources', label: 'Traffic sources', type: 'text' }],
    },
  ],
  menus: [{ name: 'primary', label: 'Primary navigation', items: [{ type: 'custom', label: 'Guides', url: '/guides/' }, { type: 'custom', label: 'About', url: '/about/' }, { type: 'custom', label: 'Editorial policy', url: '/editorial-policy/' }] }],
  content: {
    guides: guides.map((guide) => ({
      id: `guide-${guide.slug}`, slug: guide.slug, status: 'draft',
      data: {
        title: guide.title, summary: guide.summary, category: guide.category,
        reading_minutes: guide.readingMinutes, evidence_type: guide.evidenceType,
        workflow_state: 'draft', content: toPortableText(guide.sections), sections: guide.sections,
        research_sources: guide.sources, product_references: [], rights_confirmed: false, editorial_approved: false,
      },
    })),
  },
};

await mkdir('seed', { recursive: true });
await writeFile('seed/seed.json', `${JSON.stringify(seed, null, 2)}\n`);
console.log(`Prepared EmDash content model and ${guides.length} private editorial drafts.`);
