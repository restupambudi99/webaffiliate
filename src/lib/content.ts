import { getEmDashCollection, getEmDashEntry, search, type PortableTextBlock } from 'emdash';
import { guides as draftGuides, type Guide, type GuideCategory, type GuideSection } from '../data/guides';
import { editorialBodyForDisplay, productReferencesFrom, safeResearchHref } from './cms-policy';
import type { ProductReference } from './settings';

export type UnifiedGuide = Omit<Guide, 'reviewStatus' | 'evidenceType' | 'sections'> & {
  reviewStatus: string;
  evidenceType: string;
  body?: PortableTextBlock[];
  author?: string;
  editor?: string;
  publishedAt?: string;
  updatedAt?: string;
  isPreview?: boolean;
  productReferences?: ProductReference[];
  sections: (GuideSection & { anchorId?: string })[];
};

// The source examples remain drafts. This switch is deliberately explicit and
// must be false for a public, indexable production website.
export const isStagingPreview = import.meta.env.STAGING_PREVIEW === 'true' || process.env.STAGING_PREVIEW === 'true';

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function dateValue(value: unknown): string | undefined {
  const date = value instanceof Date ? value : typeof value === 'string' ? new Date(value) : undefined;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : undefined;
}

export function headingId(text: string, blockKey?: string): string {
  const heading = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
  const key = blockKey?.replace(/[^a-zA-Z0-9_-]/g, '');
  return key ? `${heading}-${key}` : heading;
}

function blockText(block: Record<string, unknown>): string {
  return Array.isArray(block.children) ? block.children.map((child) => child && typeof child === 'object' ? stringValue((child as Record<string, unknown>).text) : '').join('') : '';
}

/** Derive the table of contents from the edited body, instead of stale seed sections. */
function sectionsFromBody(body: unknown[]): UnifiedGuide['sections'] {
  const sections: UnifiedGuide['sections'] = [];
  for (const value of body) {
    if (!value || typeof value !== 'object') continue;
    const block = value as Record<string, unknown>;
    if (block._type !== 'block') continue;
    const text = blockText(block);
    if (block.style === 'h2') {
      sections.push({ heading: text, paragraphs: [], anchorId: headingId(text, stringValue(block._key)) });
    } else if (sections.length && text) {
      const section = sections[sections.length - 1];
      if (block.listItem) (section.bullets ||= []).push(text);
      else section.paragraphs.push(text);
    }
  }
  return sections;
}

function isCategory(value: unknown): value is GuideCategory {
  return value === 'workspace' || value === 'lighting' || value === 'accessories';
}

function sourcesFrom(value: unknown): Guide['sources'] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const source = item as Record<string, unknown>;
    if (typeof source.label !== 'string' || typeof source.url !== 'string') return [];
    const href = safeResearchHref(source.url);
    return href ? [{ label: source.label, url: href }] : [];
  });
}

function sectionsFrom(value: unknown): GuideSection[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const section = item as Record<string, unknown>;
    if (typeof section.heading !== 'string' || !Array.isArray(section.paragraphs)) return [];
    return [{
      heading: section.heading,
      paragraphs: section.paragraphs.filter((p): p is string => typeof p === 'string'),
      ...(Array.isArray(section.bullets) ? { bullets: section.bullets.filter((p): p is string => typeof p === 'string') } : {}),
    }];
  });
}

function mapEntry(entry: { id: string; data: Record<string, unknown> }): UnifiedGuide {
  const data = entry.data;
  const body = Array.isArray(data.content) ? editorialBodyForDisplay(data.content) : undefined;
  const publishedAt = dateValue(data.publishedAt);
  const reviewedAt = dateValue(data.reviewed_at);
  const updatedAt = publishedAt && reviewedAt && reviewedAt > publishedAt && stringValue(data.revision_reason).trim() ? reviewedAt : undefined;
  return {
    slug: entry.id,
    title: stringValue(data.title, 'Untitled guide'),
    category: isCategory(data.category) ? data.category : 'workspace',
    summary: stringValue(data.summary),
    readingMinutes: typeof data.reading_minutes === 'number' ? Math.max(1, data.reading_minutes) : 5,
    evidenceType: stringValue(data.evidence_type, 'Editorial guide'),
    reviewStatus: stringValue(data.workflow_state, 'published'),
    sections: body ? sectionsFromBody(body) : sectionsFrom(data.sections),
    sources: sourcesFrom(data.research_sources),
    productReferences: productReferencesFrom(data.product_references),
    ...(body ? { body: body as PortableTextBlock[] } : {}),
    author: stringValue(data.author_name),
    editor: stringValue(data.editor_name),
    publishedAt,
    updatedAt,
  };
}

/** Published revisions in production; explicit staging also reads CMS drafts. */
export async function getGuides(category?: GuideCategory): Promise<UnifiedGuide[]> {
  const { entries, error } = await getEmDashCollection<'guides', Record<string, unknown>>('guides', {
    status: 'published',
    limit: 100,
    orderBy: { published_at: 'desc' },
    ...(category ? { where: { category } } : {}),
  });
  if (error) {
    if (!isStagingPreview) throw error;
    console.warn('EmDash is unavailable in staging; showing explicitly labeled source drafts.');
  }
  if (isStagingPreview) {
    const drafts = await getEmDashCollection<'guides', Record<string, unknown>>('guides', {
      status: 'draft', limit: 100, orderBy: { created_at: 'asc' },
      ...(category ? { where: { category } } : {}),
    });
    if (drafts.error) console.warn('Unable to read CMS drafts in staging.');
    if (drafts.entries.length || entries.length) {
      const merged = new Map(entries.map((entry) => [entry.id, mapEntry(entry)]));
      drafts.entries.forEach((entry) => merged.set(entry.id, { ...mapEntry(entry), reviewStatus: 'draft', isPreview: true }));
      return [...merged.values()];
    }
  }
  if (entries.length) return entries.map(mapEntry);
  return isStagingPreview ? draftGuides.filter((guide) => !category || guide.category === category) : [];
}

/** A missing or draft CMS entry never falls through to demo content in production. */
export async function getGuide(slug: string): Promise<UnifiedGuide | undefined> {
  if (isStagingPreview) {
    const drafts = await getEmDashCollection<'guides', Record<string, unknown>>('guides', {
      status: 'draft', limit: 1, where: { slug },
    });
    if (drafts.entries[0]) return { ...mapEntry(drafts.entries[0]), reviewStatus: 'draft', isPreview: true };
    if (drafts.error) console.warn('Unable to read the CMS draft in staging.');
  }
  const { entry, error, isPreview } = await getEmDashEntry<'guides', Record<string, unknown>>('guides', slug);
  if (error) {
    if (!isStagingPreview) throw error;
    console.warn('EmDash is unavailable in staging; checking explicitly labeled source drafts.');
  }
  if (entry) return { ...mapEntry(entry), isPreview };
  return isStagingPreview ? draftGuides.find((guide) => guide.slug === slug) : undefined;
}

/** Full-text search stays within this site's editorial collection. */
export async function searchGuides(query: string): Promise<UnifiedGuide[]> {
  const trimmed = query.trim().slice(0, 120);
  if (!trimmed) return getGuides();
  if (isStagingPreview) {
    const entries = await getGuides();
    const needle = trimmed.toLowerCase();
    return entries.filter((guide) => `${guide.title} ${guide.summary} ${guide.sections.map((s) => s.paragraphs.join(' ')).join(' ')}`.toLowerCase().includes(needle));
  }
  const result = await search(trimmed, { collections: ['guides'], status: 'published', limit: 30 });
  const entries = await Promise.all(result.items.map((item) => getGuide(item.slug || item.id)));
  return entries.filter((entry): entry is UnifiedGuide => Boolean(entry));
}
