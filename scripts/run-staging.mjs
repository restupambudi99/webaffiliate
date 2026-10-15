import { spawnSync } from 'node:child_process';

const mode = process.argv[2] || 'dev';
if (!['dev', 'build'].includes(mode)) throw new Error('Choose dev or build.');
if (mode === 'build') {
  const seed = spawnSync(process.execPath, ['scripts/build-seed.mjs'], { stdio: 'inherit' });
  if (seed.status !== 0) process.exit(seed.status || 1);
}
const command = mode === 'dev' ? ['dev', '--host', '127.0.0.1'] : ['build'];
const child = spawnSync(process.execPath, ['node_modules/astro/bin/astro.mjs', ...command], {
  env: { ...process.env, STAGING_PREVIEW: 'true' },
  stdio: 'inherit',
});
process.exit(child.status || 0);
