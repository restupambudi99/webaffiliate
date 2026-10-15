import { mkdir, readFile, readdir, copyFile, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { guides } from '../src/data/guides.ts';

// A read-only snapshot of the real Astro/EmDash staging site. This export is
// a visual preview; it does not replace the server application or CMS.
const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(project, 'dist-preview');
const base = new URL(process.env.PREVIEW_SOURCE_URL || 'http://127.0.0.1:4321');
if (!['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname)) {
  throw new Error('PREVIEW_SOURCE_URL must point to the local staging server.');
}

const publicPaths = [
  '/', '/guides/', '/comparisons/', '/reviews/', '/search/', '/about/',
  '/contact/', '/privacy/', '/affiliate-disclosure/', '/editorial-policy/',
  ...guides.map((guide) => `/articles/${guide.slug}/`), '/404/',
];
const pages = new Map();
const normalizeCss = (css) => css.replaceAll('\r\n', '\n').trim();
const styles = new Set([normalizeCss(await readFile(resolve(project, 'src/styles/global.css'), 'utf8'))]);
for (const path of publicPaths) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(20000) });
  if (response.status !== (path === '/404/' ? 404 : 200)) {
    throw new Error(`${path}: staging server returned ${response.status}. Start npm run dev:staging before exporting.`);
  }
  const html = await response.text();
  if (!/<meta\s+name="robots"\s+content="noindex, nofollow"/i.test(html)) {
    throw new Error(`${path}: refusing to export a page without private preview noindex metadata.`);
  }
  pages.set(path, html);
  const renderedMarkup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  for (const match of renderedMarkup.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi)) {
    // Astro dev can inline imported CMS admin assets even on public routes.
    // Keep portable-text component styles, but omit admin and JS URL imports.
    if (/@emdash-cms\/admin|\/routes\/admin\.astro/.test(match[1]) || /^\s*export\s+default\b/.test(match[2])) continue;
    styles.add(normalizeCss(match[2]));
  }
}

const htmlText = (html) => html.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const sourceBySlug = new Map(guides.map((guide) => [guide.slug, guide]));
const cards = [...pages.get('/guides/').matchAll(/<article\b[^>]*class="guide-card(?:\s[^\"]*)?"[^>]*>[\s\S]*?<\/article>/gi)].map((match) => {
  const html = match[0];
  const slug = html.match(/href="\/articles\/([^/]+)\//)?.[1];
  const source = sourceBySlug.get(slug);
  if (!source) throw new Error(`Unrecognized staging guide: ${slug}`);
  const article = pages.get(`/articles/${slug}/`);
  const prose = article.match(/<article\b[^>]*class="prose"[^>]*>([\s\S]*?)<\/article>/i)?.[1] || '';
  return { slug, category: source.category, title: htmlText(html.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i)?.[1] || source.title), text: htmlText(html + ' ' + prose), html };
});
if (cards.length !== guides.length) throw new Error(`Expected ${guides.length} staging guide cards, received ${cards.length}.`);

function staticHtml(html) {
  return html
    .replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi, (tag, attributes) => /type=["']application\/ld\+json["']/i.test(attributes) ? tag : '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<link\b[^>]*rel=["'](?:stylesheet|modulepreload)["'][^>]*>/gi, '')
    .replace(/<astro-dev-toolbar\b[^>]*>[\s\S]*?<\/astro-dev-toolbar>/gi, '')
    .replace(/\sdata-(?:astro-source-[\w-]+|vite-dev-id)="[^"]*"/gi, '')
    .replace('</head>', '<meta name="desk-edit-preview" content="Static visual snapshot; the EmDash CMS runs in the server application"><link rel="stylesheet" href="/assets/preview.css"><script src="/assets/preview.js" defer></script></head>');
}

await mkdir(resolve(output, 'assets'), { recursive: true });
for (const [path, html] of pages) {
  const destination = resolve(output, path === '/' ? 'index.html' : `${path.slice(1)}index.html`);
  if (!destination.startsWith(output + sep)) throw new Error('Invalid export path.');
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, staticHtml(html));
}
await writeFile(resolve(output, '404.html'), staticHtml(pages.get('/404/')));
await writeFile(resolve(output, 'assets/preview.css'), [...styles].join('\n') + '\n[hidden]{display:none!important}\n');
await writeFile(resolve(output, 'assets/preview-data.json'), JSON.stringify(cards));
await copyFile(resolve(project, 'scripts/preview-client.js'), resolve(output, 'assets/preview.js'));

async function copyPublic(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const source = resolve(directory, entry.name);
    if (entry.isDirectory()) await copyPublic(source);
    else if (entry.isFile() && extname(source).toLowerCase() !== '.png') {
      const destination = resolve(output, relative(resolve(project, 'public'), source));
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(source, destination);
    }
  }
}
await copyPublic(resolve(project, 'public'));
await writeFile(resolve(output, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
const manifest = {
  generatedAt: new Date().toISOString(), type: 'private-static-visual-preview',
  pages: publicPaths, articleCount: cards.length, robots: 'noindex, nofollow; disallow all',
  cms: 'EmDash remains in the main Astro SSR application; this preview does not include admin or CMS APIs.',
  affiliateLinks: 'Inactive in editorial draft preview',
};
await writeFile(resolve(output, 'preview-manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Exported ${pages.size} staging pages and ${cards.length} guide cards to ${output}.`);
