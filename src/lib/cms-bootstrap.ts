/** Keep the first-owner wizard private until the owner is ready to register a passkey. */
export function cmsBootstrapResponse(request: Request, env: unknown): Response | undefined {
  const enabled = typeof env === 'object' && env !== null
    && 'CMS_ADMIN_ENABLED' in env && env.CMS_ADMIN_ENABLED === 'true';
  if (enabled) return undefined;

  let pathname = new URL(request.url).pathname;
  try { pathname = decodeURIComponent(pathname); } catch { /* Keep malformed paths unchanged. */ }
  pathname = pathname.replaceAll('\\', '/').replace(/\/{2,}/g, '/');
  if (pathname !== '/_emdash' && !pathname.startsWith('/_emdash/')) return undefined;

  return new Response('CMS maintenance. The owner will enable access when setup is ready.', {
    status: 503,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
