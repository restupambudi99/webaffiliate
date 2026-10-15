import { productionOrigin } from '../../site.config.mjs';

const env = (name: string): string => (import.meta.env?.[name] as string | undefined) || process.env[name] || '';
export const settings = {
  brand: 'Desk Edit',
  tagline: 'Make room for better work.',
  description: 'Thoughtful guides to a calmer, more useful home workspace. Understand the choices before you buy.',
  contactEmail: env('CONTACT_EMAIL') || 'nikolasjuan34@gmail.com',
  affiliateMode: env('AFFILIATE_MODE') === 'affiliate' ? 'affiliate' : 'editorial_only',
  associateTag: env('AMAZON_ASSOCIATE_TAG'),
  siteRegistered: env('AMAZON_SITE_REGISTERED') === 'true',
  disclosure: 'As an Amazon Associate I earn from qualifying purchases.',
  preview: env('STAGING_PREVIEW') === 'true',
  siteUrl: env('SITE_URL') || productionOrigin,
} as const;

export type ProductReference = {
  label: string;
  destinationUrl: string;
  verifiedAt: string;
  active: boolean;
  eligibilityReviewed: boolean;
};

export function affiliateHref(product: ProductReference): string | null {
  if (settings.affiliateMode !== 'affiliate' || !settings.associateTag || !settings.siteRegistered || !product.active || !product.eligibilityReviewed || !product.verifiedAt) return null;
  try {
    const url = new URL(product.destinationUrl);
    if (url.protocol !== 'https:' || url.username || url.password || !['amazon.com', 'www.amazon.com'].includes(url.hostname) || !/^\/(?:dp|gp\/product)\/[A-Z0-9]{10}(?:\/|$)/.test(url.pathname)) return null;
    if (url.searchParams.get('tag') !== settings.associateTag) return null;
    return url.href;
  } catch { return null; }
}
