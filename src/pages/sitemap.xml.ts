import type { APIRoute } from 'astro';
import { getGuides } from '../lib/content';
import { settings } from '../lib/settings';
const escape=(value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export const GET: APIRoute = async () => {
  if (!settings.siteUrl || settings.preview) return new Response('Sitemap is available on the configured public site.',{status:404,headers:{'Content-Type':'text/plain'}});
  const paths=['/','/guides/','/comparisons/','/reviews/','/about/','/contact/','/privacy/','/editorial-policy/','/affiliate-disclosure/',...(await getGuides()).map(guide=>`/articles/${guide.slug}/`)];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path=>`<url><loc>${escape(new URL(path,settings.siteUrl).href)}</loc></url>`).join('')}</urlset>`,{headers:{'Content-Type':'application/xml; charset=utf-8'}});
};
