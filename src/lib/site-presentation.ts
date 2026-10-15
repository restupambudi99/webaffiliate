import { getSiteSettingsWithCacheHint } from 'emdash';
import { settings } from './settings.ts';

type SettingsRead = Awaited<ReturnType<typeof getSiteSettingsWithCacheHint>>;

export type PresentationImage = {
  url: string;
  alt: string;
  contentType?: string;
  width?: number;
  height?: number;
};

export type SitePresentation = {
  brand: string;
  tagline: string;
  description: string;
  titleSeparator: string;
  logo?: PresentationImage;
  favicon?: PresentationImage;
  defaultOgImage?: PresentationImage;
  cacheHint?: SettingsRead['cacheHint'];
};

const imageTypes = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif',
  'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon',
]);

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function imageUrl(value: unknown): string | undefined {
  const url = typeof value === 'string' ? value.trim() : '';
  if (!url || /[\\\s\x00-\x1f\x7f]/.test(url) || url.startsWith('//')) return undefined;
  if (url.startsWith('/')) return url;
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password ? parsed.href : undefined;
  } catch { return undefined; }
}

function dimension(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

function image(value: unknown, brand: string): PresentationImage | undefined {
  const reference = object(value);
  const url = imageUrl(reference.url);
  const contentType = text(reference.contentType).toLowerCase();
  // A deleted media reference has no resolved URL. Non-images never become
  // a logo/favicon, even if malformed stored settings contain a URL for one.
  if (!url || (contentType && !imageTypes.has(contentType))) return undefined;
  return {
    url, alt: text(reference.alt) || brand,
    contentType: contentType || undefined,
    width: dimension(reference.width), height: dimension(reference.height),
  };
}

/** Normalize only identity properties supported by EmDash's public settings API. */
export function normalizeSitePresentation(value: unknown): SitePresentation {
  const configured = object(value);
  const seo = object(configured.seo);
  const brand = text(configured.title) || settings.brand;
  const tagline = typeof configured.tagline === 'string' ? text(configured.tagline) : settings.tagline;
  const separator = text(seo.titleSeparator);
  return {
    brand, tagline,
    // EmDash 1.2 has no defaultDescription setting. Its documented site-wide
    // description source is the tagline; explicit page descriptions still win.
    description: text(configured.tagline) || settings.description,
    titleSeparator: separator ? ` ${separator} ` : ' — ',
    logo: image(configured.logo, brand),
    favicon: image(configured.favicon, brand),
    defaultOgImage: image(seo.defaultOgImage, brand),
  };
}

/** Public request-cached reads; native settings updates invalidate EmDash's cache. */
export async function getSitePresentation(): Promise<SitePresentation> {
  try {
    const { data, cacheHint } = await getSiteSettingsWithCacheHint();
    return { ...normalizeSitePresentation(data), cacheHint };
  } catch {
    // Keep identity available during initial setup or an unavailable settings read.
    return normalizeSitePresentation(undefined);
  }
}
