export function passwordAuth() {
  const entry = (name) => new URL(name, import.meta.url).href;
  return {
    id: 'myjourney-password',
    label: 'Email dan password',
    routes: [
      { pattern: '/_emdash/admin/login/password', entrypoint: entry('./password-login.astro') },
      { pattern: '/_emdash/admin/login/password/setup', entrypoint: entry('./password-setup.astro') },
      { pattern: '/_emdash/api/auth/password/login', entrypoint: entry('./password-api.ts') },
      { pattern: '/_emdash/api/auth/password/setup', entrypoint: entry('./password-api.ts') },
    ],
    publicRoutes: ['/_emdash/api/auth/password/login', '/_emdash/api/auth/password/setup'],
  };
}
