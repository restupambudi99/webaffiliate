import { defineConfig, sessionDrivers } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import emdash, { local } from 'emdash/astro';
import { sqlite } from 'emdash/db';
import { fileURLToPath } from 'node:url';
import { productionOrigin, productionHostname } from './site.config.mjs';

try { process.loadEnvFile('.env'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const site = process.env.SITE_URL || process.env.EMDASH_SITE_URL || productionOrigin;

export default defineConfig({
  output: 'server',
  site: site || undefined,
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  security: { allowedDomains: [{ hostname: productionHostname, protocol: 'https' }] },
  adapter: node({ mode: 'standalone' }),
  session: { driver: sessionDrivers.fsLite({ base: process.env.EMDASH_SESSIONS_DIR || './.emdash/sessions' }) },
  integrations: [
    react(),
    emdash({
      database: sqlite({ url: process.env.EMDASH_DATABASE_URL || 'file:./data.db' }),
      storage: local({ directory: process.env.EMDASH_UPLOADS_DIR || './uploads', baseUrl: '/_emdash/api/media/file' }),
      maxUploadSize: 5 * 1024 * 1024,
      siteUrl: site || undefined,
      // OAuth/PAT authentication and per-user scopes are enforced by EmDash.
      mcp: true,
      plugins: [{
        id: 'desk-edit-editorial-gate',
        version: '1.0.0',
        capabilities: ['hooks.content-policy:register'],
        entrypoint: fileURLToPath(new URL('./src/plugins/editorial-gate.ts', import.meta.url)).replaceAll('\\', '/'),
        format: 'native',
      }],
    }),
  ],
  vite: { server: { strictPort: true } },
});
