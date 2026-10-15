import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import emdash from 'emdash/astro';
import { d1, r2 } from '@emdash-cms/cloudflare';
import { fileURLToPath } from 'node:url';

try { process.loadEnvFile('.env'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const site = process.env.SITE_URL || process.env.EMDASH_SITE_URL;

export default defineConfig({
  output: 'server',
  outDir: './dist-cloudflare',
  site: site || undefined,
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  adapter: cloudflare({ imageService: 'passthrough' }),
  integrations: [
    react(),
    emdash({
      database: d1({ binding: 'DB' }),
      storage: r2({ binding: 'MEDIA' }),
      siteUrl: site || undefined,
      mcp: false,
      plugins: [{
        id: 'desk-edit-editorial-gate',
        version: '1.0.0',
        capabilities: ['hooks.content-policy:register'],
        entrypoint: fileURLToPath(new URL('./src/plugins/editorial-gate.ts', import.meta.url)).replaceAll('\\', '/'),
        format: 'native',
      }],
    }),
  ],
});
