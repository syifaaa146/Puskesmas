/**
 * config/db.js
 * -----------------------------------------------------------------------
 * Membuat satu instance Turso (libSQL) client yang dipakai di seluruh
 * backend. Turso adalah database SQLite terdistribusi — cocok untuk
 * deploy serverless di Vercel karena koneksinya ringan (HTTP-based),
 * tanpa perlu connection pooling khusus seperti Postgres.
 *
 * Environment variable yang dibutuhkan (lihat .env.example):
 *   TURSO_DATABASE_URL  - contoh: libsql://nama-db-org.turso.io
 *   TURSO_AUTH_TOKEN    - token autentikasi dari `turso db tokens create`
 *
 * Untuk development lokal, TURSO_DATABASE_URL juga boleh diisi
 * "file:local.db" (database SQLite lokal, tanpa auth token) — berguna
 * untuk mencoba backend tanpa harus punya akun Turso dulu.
 * -----------------------------------------------------------------------
 */
const { createClient } = require("@libsql/client");

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.error(
    "[FATAL] TURSO_DATABASE_URL wajib diisi di file .env. " +
      "Lihat .env.example untuk referensi."
  );
}

const db = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN || undefined,
});

module.exports = db;
