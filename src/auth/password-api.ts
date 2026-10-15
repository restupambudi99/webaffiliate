import type { APIRoute } from 'astro';
import { getPublicOrigin } from 'emdash/api/route-utils';
import { getPasswordStore, hashPassword, normalizeEmail, validNewPassword, verifyPassword, withPasswordWork } from './password-store';
import { passwordRequestAllowed, readPasswordBody, safeAuthRedirect } from './password-policy';

export const prerender = false;
const failure = 'Email atau password tidak sesuai. Coba lagi atau hubungi pengelola VPS.';
function reply(status: number, data: Record<string, unknown>) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', ...(status === 429 ? { 'Retry-After': '900' } : {}) } });
}

export const POST: APIRoute = async ({ request, locals, session, url }) => {
  const emdash = locals.emdash;
  if (!emdash?.db || !session) return reply(503, { ok: false, error: 'Login belum tersedia. Coba lagi beberapa saat.' });
  const origin = getPublicOrigin(new URL(request.url), emdash.config);
  if (!passwordRequestAllowed(request, origin)) return reply(403, { ok: false, error: 'Permintaan ditolak. Muat ulang halaman login.' });
  const body = await readPasswordBody(request);
  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string' || body.email.length > 320 || body.password.length > 128 || Buffer.byteLength(body.password) > 512) return reply(400, { ok: false, error: 'Periksa alamat email dan password.' });
  const email = normalizeEmail(body.email);
  const setup = url.pathname === '/_emdash/api/auth/password/setup';
  try {
    const store = getPasswordStore();
    if (!store.allowAttempt(email, setup ? 'setup' : 'login')) return reply(429, { ok: false, error: 'Terlalu banyak percobaan. Tunggu 15 menit sebelum mencoba lagi.' });
    const user = await emdash.db.selectFrom('users').select(['id', 'email', 'disabled', 'role']).where((eb) => eb(eb.fn<string>('lower', ['email']), '=', email)).executeTakeFirst();
    let authenticated = false;
    if (setup) {
      if (!validNewPassword(body.password)) return reply(400, { ok: false, error: 'Gunakan password sepanjang 15–128 karakter. Spasi dan frasa panjang boleh dipakai.' });
      const token = typeof body.token === 'string' ? body.token : '';
      const enrollment = store.enrollment(token);
      if (!enrollment || !user || user.disabled || user.role < 50 || user.id !== enrollment.user_id) return reply(400, { ok: false, error: 'Tautan atau email tidak sesuai, sudah dipakai, atau kedaluwarsa. Hubungi pengelola VPS untuk tautan baru.' });
      const credential = await withPasswordWork(() => hashPassword(body.password as string));
      if (!credential) return reply(503, { ok: false, error: 'Login sedang sibuk. Coba lagi sebentar.' });
      authenticated = store.consumeEnrollment(token, user.id, credential);
    } else {
      const verified = await withPasswordWork(() => verifyPassword(body.password as string, user && !user.disabled ? store.credential(user.id) : undefined));
      if (verified === undefined) return reply(503, { ok: false, error: 'Login sedang sibuk. Coba lagi sebentar.' });
      authenticated = Boolean(user && !user.disabled && verified);
    }
    if (!authenticated || !user) return reply(setup ? 400 : 401, { ok: false, error: setup ? 'Tautan sudah dipakai atau kedaluwarsa. Hubungi pengelola VPS.' : failure });
    await session.regenerate();
    session.set('user', { id: user.id }, { ttl: 8 * 60 * 60 });
    return reply(200, { ok: true, redirect: setup ? '/_emdash/admin/' : safeAuthRedirect(body.redirect) });
  } catch {
    // Do not log request bodies, password hashes, enrollment links, or cookies.
    console.error('[password-auth] Authentication could not be completed.');
    return reply(503, { ok: false, error: 'Login belum dapat diproses. Coba lagi atau hubungi pengelola VPS.' });
  }
};
