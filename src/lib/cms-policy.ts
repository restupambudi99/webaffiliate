import type { ProductReference } from './settings';

/** Covers Amazon marketplace domains and their subdomains, plus short links. */
export function isAmazonHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  return host === 'amzn.to' || host.endsWith('.amzn.to') || host === 'a.co' || host.endsWith('.a.co')
    || /(?:^|\.)amazon\.(?:[a-z0-9-]+\.)*[a-z0-9-]+$/.test(host)
    || /(?:^|\.)amzn\.(?:[a-z0-9-]+\.)*[a-z0-9-]+$/.test(host);
}

function webUrl(value: unknown): URL | undefined {
  if (typeof value !== 'string' || !value.trim()) return;
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return;
    return url;
  } catch { return; }
}

function amazonUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  try { return isAmazonHost(new URL(value.trim()).hostname); } catch { return false; }
}

/** Amazon links belong exclusively to the verified, disclosed CTA component. */
export function safeBodyHref(value: unknown): string | undefined {
  const url = webUrl(value);
  return url && !isAmazonHost(url.hostname) ? url.href : undefined;
}

/** Sources can cite Amazon policy docs, but never retail or tracking links. */
export function safeResearchHref(value: unknown): string | undefined {
  const url = webUrl(value);
  if (!url) return;
  const tracking = [...url.searchParams.keys()].some((key) => ['tag', 'ascsubtag', 'linkcode', 'camp', 'creative', 'creativeasin', 'ref_', 'ref'].includes(key.toLowerCase()));
  if (tracking) return;
  if (!isAmazonHost(url.hostname)) return url.href;
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  return url.protocol === 'https:' && host === 'affiliate-program.amazon.com'
    && (url.pathname.startsWith('/help/') || url.pathname.startsWith('/creatorsapi/docs/'))
    ? url.href : undefined;
}

/** Walk nested Portable Text as well as top-level mark definitions. */
export function hasBlockedAmazonBodyLink(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasBlockedAmazonBodyLink);
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  for (const [key, item] of Object.entries(record)) {
    if (['href', 'url', 'src', 'link'].includes(key) && typeof item === 'string') {
      if (amazonUrl(item)) return true;
    }
    if (item && typeof item === 'object' && hasBlockedAmazonBodyLink(item)) return true;
  }
  return false;
}

const EDITORIAL_BLOCKS = new Set(['block', 'table', 'code', 'image', 'gallery', 'video', 'break']);
const INTERACTIVE_BLOCKS = new Set(['htmlBlock', 'iframe', 'embed', 'button', 'buttons', 'file', 'cover', 'columns', 'section', 'widget']);

export function hasUnsupportedBodyBlocks(value: unknown): boolean {
  if (!Array.isArray(value)) return true;
  return value.some((block) => !block || typeof block !== 'object' || !EDITORIAL_BLOCKS.has(String((block as Record<string, unknown>)._type)));
}

/** Protect existing imports too: no raw HTML, embeds, buttons, or bypass links. */
export function editorialBodyForDisplay(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  const blockedMarkKeys = new Set<string>();
  const collectBlockedMarks = (item: unknown): void => {
    if (Array.isArray(item)) { item.forEach(collectBlockedMarks); return; }
    if (!item || typeof item !== 'object') return;
    const record = item as Record<string, unknown>;
    if (record._type === 'link' && !safeBodyHref(record.href) && typeof record._key === 'string') blockedMarkKeys.add(record._key);
    Object.values(record).forEach(collectBlockedMarks);
  };
  collectBlockedMarks(value);
  const scrub = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(scrub).filter((part) => part !== undefined);
    if (!item || typeof item !== 'object') return item;
    const record = item as Record<string, unknown>;
    if (INTERACTIVE_BLOCKS.has(String(record._type))) return;
    if (record._type === 'link' && !safeBodyHref(record.href)) return;
    const cleaned: Record<string, unknown> = {};
    for (const [key, part] of Object.entries(record)) {
      if (['html', 'css', 'js'].includes(key)) continue;
      // Linked images are outside the MVP; table links need the same policy as marks.
      if (key === 'link' && record._type === 'image') continue;
      if (['href', 'url', 'src', 'link'].includes(key) && amazonUrl(part)) continue;
      if (key === 'marks' && Array.isArray(part)) { cleaned[key] = part.filter((mark) => !blockedMarkKeys.has(String(mark))); continue; }
      const result = scrub(part);
      if (result !== undefined) cleaned[key] = result;
    }
    return cleaned;
  };
  const uploadedMedia = (block: Record<string, unknown>): boolean => {
    const asset = block.asset;
    if (!asset || typeof asset !== 'object') return false;
    const reference = asset as Record<string, unknown>;
    return typeof reference._ref === 'string' && Boolean(reference._ref)
      && (!reference.provider || reference.provider === 'local') && !hasBlockedAmazonBodyLink(block);
  };
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const block = item as Record<string, unknown>;
    if (!EDITORIAL_BLOCKS.has(String(block._type))) return [];
    if (['image', 'video'].includes(String(block._type)) && !uploadedMedia(block)) return [];
    if (block._type === 'gallery') {
      const images = Array.isArray(block.images) ? block.images.filter((image) => image && typeof image === 'object' && uploadedMedia(image as Record<string, unknown>)) : [];
      return images.length ? [scrub({ ...block, images }) as Record<string, unknown>] : [];
    }
    return [scrub(block) as Record<string, unknown>];
  });
}

export function hasEditorialBodyText(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasEditorialBodyText);
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (record._type === 'span' && typeof record.text === 'string' && record.text.trim()) return true;
  return Object.values(record).some((item) => item && typeof item === 'object' && hasEditorialBodyText(item));
}

/** Malformed or unverified data can never become an active CTA implicitly. */
export function productReferencesFrom(value: unknown): ProductReference[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const product = item as Record<string, unknown>;
    if (typeof product.label !== 'string' || !product.label.trim() || typeof product.destinationUrl !== 'string'
      || typeof product.verifiedAt !== 'string' || typeof product.active !== 'boolean' || typeof product.eligibilityReviewed !== 'boolean') return [];
    const url = webUrl(product.destinationUrl);
    if (!url || url.protocol !== 'https:' || !['amazon.com', 'www.amazon.com'].includes(url.hostname)
      || !/^\/(?:dp|gp\/product)\/[A-Z0-9]{10}(?:\/|$)/.test(url.pathname)) return [];
    const verificationTime = product.verifiedAt ? Date.parse(product.verifiedAt) : undefined;
    if (verificationTime !== undefined && (Number.isNaN(verificationTime) || verificationTime > Date.now())) return [];
    if (product.active && verificationTime === undefined) return [];
    return [{
      label: product.label.trim().slice(0, 200), destinationUrl: url.href,
      verifiedAt: product.verifiedAt, active: product.active, eligibilityReviewed: product.eligibilityReviewed,
    }];
  });
}
