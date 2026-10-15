/** Run privately as the service user; never prints a token or password. */
import { DatabaseSync } from 'node:sqlite';
import { writeFileSync, chmodSync } from 'node:fs';
import { resolve } from 'node:path';
import { PasswordStore } from '../src/auth/password-store.ts';

const origin = process.env.EMDASH_SITE_URL || process.env.SITE_URL;
const database = process.env.EMDASH_DATABASE_URL;
const state = process.env.MYJOURNEY_PASSWORD_DB;
const output = process.argv.find((arg) => arg.startsWith('--output='))?.slice(9);
if (!origin || !database?.startsWith('file:') || !state || !output) throw new Error('Set EMDASH_SITE_URL, EMDASH_DATABASE_URL, MYJOURNEY_PASSWORD_DB and --output=/private/path.html.');
if (new URL(origin).protocol !== 'https:' && new URL(origin).hostname !== '127.0.0.1') throw new Error('HTTPS is required.');
const db = new DatabaseSync(database.slice(5), { readOnly: true });
const owners = db.prepare('SELECT id,email FROM users WHERE role>=50 AND disabled=0').all() as Array<{ id: string; email: string }>;
db.close();
if (owners.length !== 1) throw new Error('Expected exactly one active owner; select the owner explicitly before proceeding.');
const store = new PasswordStore(state);
const token = store.issueEnrollment(owners[0].id, { reset: process.argv.includes('--reset') });
store.close();
const link = new URL('/_emdash/admin/login/password/setup', origin);
link.hash = new URLSearchParams({ token }).toString();
const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const html = `<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="referrer" content="no-referrer"><title>Atur password MyJourney — privat</title><style>body{font:18px/1.6 system-ui;background:#f8f7f2;color:#202f34;max-width:600px;margin:10vh auto;padding:24px}a{display:inline-block;background:#294c3d;color:white;padding:16px 24px;border-radius:6px}strong{overflow-wrap:anywhere}</style><h1>Atur password MyJourney</h1><p>Akun pemilik: <strong>${escape(owners[0].email)}</strong>.</p><p>Tautan privat ini berlaku satu jam dan hanya bisa dipakai sekali. Isi password sendiri di website HTTPS.</p><p><a href="${escape(link.href)}" rel="noreferrer">Buat password dan masuk</a></p><p>Jangan unggah atau bagikan berkas ini. Hapus setelah password tersimpan.</p></html>`;
writeFileSync(resolve(output), html, { mode: 0o600 });
chmodSync(resolve(output), 0o600);
console.log('Private one-time password setup file created; expires in one hour. Token not printed.');
