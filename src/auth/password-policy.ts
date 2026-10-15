export const PASSWORD_LOGIN = '/_emdash/admin/login/password';
export const PASSWORD_SETUP = `${PASSWORD_LOGIN}/setup`;

export function safeAuthRedirect(value: unknown): string {
  const fallback = '/_emdash/admin/';
  if (typeof value !== 'string' || value.length > 4096 || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020\u007f]/.test(value)) return fallback;
  try {
    const url = new URL(value, 'https://auth.invalid');
    const decoded = decodeURIComponent(url.pathname);
    if (/[\\\u0000-\u0020\u007f]/.test(decoded) || decoded.includes('//')) return fallback;
    if (url.origin !== 'https://auth.invalid') return fallback;
    if ((url.pathname === '/_emdash/admin' || url.pathname.startsWith('/_emdash/admin/')) && !url.pathname.startsWith('/_emdash/admin/login') && !url.pathname.startsWith('/_emdash/admin/setup')) return url.pathname + url.search;
    if (url.pathname === '/_emdash/oauth/authorize') return url.pathname + url.search;
  } catch { /* Invalid escape/URL: use dashboard. */ }
  return fallback;
}

export function passwordLoginRedirect(request: Request): Response | undefined {
  const url = new URL(request.url);
  if (!['GET', 'HEAD'].includes(request.method) || !/^\/_emdash\/admin\/login\/?$/.test(url.pathname) || url.searchParams.get('method') === 'passkey') return undefined;
  const target = new URL(PASSWORD_LOGIN, url);
  if (url.searchParams.has('redirect')) target.searchParams.set('redirect', safeAuthRedirect(url.searchParams.get('redirect')));
  return new Response(null, { status: 302, headers: { Location: target.pathname + target.search, 'Cache-Control': 'private, no-store' } });
}

export function passwordRequestAllowed(request: Request, origin: string) {
  return request.headers.get('origin') === origin && request.headers.get('x-emdash-request') === '1'
    && request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() === 'application/json';
}

export async function readPasswordBody(request: Request): Promise<Record<string, unknown> | undefined> {
  if (Number(request.headers.get('content-length') || 0) > 8192 || !request.body) return undefined;
  const reader = request.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8192) { await reader.cancel(); return undefined; }
      chunks.push(value);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    return body && typeof body === 'object' && !Array.isArray(body) ? body : undefined;
  } catch { return undefined; } finally { reader.releaseLock(); }
}
