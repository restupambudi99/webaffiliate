import { DatabaseSync } from 'node:sqlite';
import { randomBytes, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { mkdirSync, chmodSync } from 'node:fs';
import { dirname } from 'node:path';

const KDF = { N: 65536, r: 8, p: 2, maxmem: 96 * 1024 * 1024 };
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export const validNewPassword = (value: string) => value.length >= 15 && value.length <= 128 && Buffer.byteLength(value) <= 512;
type Credential = { salt: string; hash: string };
type Enrollment = { user_id: string; expires_at: number; allow_reset: number };

async function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password, Buffer.from(salt, 'hex'), 64, KDF, (error, key) => error ? reject(error) : resolve(key)));
}

export async function hashPassword(password: string): Promise<Credential> {
  if (!validNewPassword(password)) throw new Error('Password must contain 15–128 characters.');
  const salt = randomBytes(32).toString('hex');
  return { salt, hash: (await derive(password, salt)).toString('hex') };
}

export async function verifyPassword(password: string, credential?: Credential): Promise<boolean> {
  // Same KDF work for an unknown email. Never trim or normalize a password.
  const expected = credential ?? { salt: '00'.repeat(32), hash: '00'.repeat(64) };
  if (!/^[a-f0-9]{64}$/.test(expected.salt) || !/^[a-f0-9]{128}$/.test(expected.hash)) return false;
  const actual = await derive(password, expected.salt);
  return timingSafeEqual(actual, Buffer.from(expected.hash, 'hex')) && credential !== undefined;
}

/** Separate private SQLite state: not exposed through CMS content/settings APIs. */
export class PasswordStore {
  db: DatabaseSync;
  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    if (path !== ':memory:') chmodSync(path, 0o600);
    this.db.exec(`PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS passwords (user_id TEXT PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL, created_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS enrollments (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE, expires_at INTEGER NOT NULL, allow_reset INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS attempts (bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);`);
  }
  close() { this.db.close(); }
  credential(userId: string): Credential | undefined {
    return this.db.prepare('SELECT salt, hash FROM passwords WHERE user_id=?').get(userId) as Credential | undefined;
  }
  enrollment(token: string, now = Date.now()): Enrollment | undefined {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return undefined;
    return this.db.prepare('SELECT user_id, expires_at, allow_reset FROM enrollments WHERE token_hash=? AND expires_at>?').get(digest(token), now) as Enrollment | undefined;
  }
  issueEnrollment(userId: string, options: { reset?: boolean; ttlMs?: number; now?: number } = {}): string {
    if (this.credential(userId) && !options.reset) throw new Error('Password already exists; an explicit reset is required.');
    const token = randomBytes(32).toString('base64url');
    const now = options.now ?? Date.now();
    this.db.prepare('INSERT INTO enrollments(token_hash,user_id,expires_at,allow_reset) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET token_hash=excluded.token_hash,expires_at=excluded.expires_at,allow_reset=excluded.allow_reset')
      .run(digest(token), userId, now + (options.ttlMs ?? 60 * 60 * 1000), options.reset ? 1 : 0);
    return token;
  }
  consumeEnrollment(token: string, userId: string, credential: Credential, now = Date.now()): boolean {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const enrollment = this.enrollment(token, now);
      if (!enrollment || enrollment.user_id !== userId || (!enrollment.allow_reset && this.credential(userId))) {
        this.db.exec('ROLLBACK'); return false;
      }
      this.db.prepare('INSERT INTO passwords(user_id,salt,hash,created_at) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET salt=excluded.salt,hash=excluded.hash,created_at=excluded.created_at')
        .run(userId, credential.salt, credential.hash, now);
      this.db.prepare('DELETE FROM enrollments WHERE token_hash=?').run(digest(token));
      this.db.exec('COMMIT'); return true;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  allowAttempt(email: string, kind: 'login' | 'setup', now = Date.now()): boolean {
    // Durable global ceiling works even without trusted proxy/IP headers.
    // Email bucket keys are hashes, and expired counters are pruned.
    const buckets = [
      { key: 'global', limit: 40, window: 60_000 },
      { key: `${kind}:${digest(normalizeEmail(email))}`, limit: 8, window: 15 * 60_000 },
    ];
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare('DELETE FROM attempts WHERE expires_at<=?').run(now);
      for (const bucket of buckets) {
        const row = this.db.prepare('SELECT count FROM attempts WHERE bucket=?').get(bucket.key) as { count: number } | undefined;
        if (row && row.count >= bucket.limit) { this.db.exec('ROLLBACK'); return false; }
      }
      for (const bucket of buckets) this.db.prepare('INSERT INTO attempts(bucket,count,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1').run(bucket.key, now + bucket.window);
      this.db.exec('COMMIT'); return true;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
}

let store: PasswordStore | undefined;
export function getPasswordStore() {
  return store ??= new PasswordStore(process.env.MYJOURNEY_PASSWORD_DB || './.emdash/password-auth.db');
}

let activeKdfs = 0;
export async function withPasswordWork<T>(work: () => Promise<T>): Promise<T | undefined> {
  if (activeKdfs >= 2) return undefined;
  activeKdfs++;
  try { return await work(); } finally { activeKdfs--; }
}
