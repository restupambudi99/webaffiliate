import type { APIRoute } from 'astro';
import { settings } from '../lib/settings';
export const GET: APIRoute = () => new Response(settings.preview ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nDisallow: /_emdash/\nDisallow: /search/\n${settings.siteUrl ? `Sitemap: ${new URL('/sitemap.xml',settings.siteUrl).href}\n` : ''}`, {headers:{'Content-Type':'text/plain; charset=utf-8'}});
