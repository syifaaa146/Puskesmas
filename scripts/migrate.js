/**
 * scripts/migrate.js
 * -----------------------------------------------------------------------
 * Menjalankan sql/schema.sql ke database Turso — TANPA perlu install
 * Turso CLI. Cukup punya TURSO_DATABASE_URL & TURSO_AUTH_TOKEN di .env
 * (ambil dari dashboard https://turso.tech setelah bikin database),
 * lalu jalankan:
 *
 *   npm run migrate
 *
 * Aman dijalankan berkali-kali — seluruh statement di schema.sql pakai
 * "IF NOT EXISTS", jadi tabel yang sudah ada tidak akan error/tertimpa.
 * -----------------------------------------------------------------------
 */
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const db = require("../api/_lib/config/db");

const SCHEMA_PATH = path.join(__dirname, "..", "sql", "schema.sql");

/**
 * Pecah isi schema.sql menjadi daftar statement SQL siap eksekusi:
 * buang baris komentar ("-- ..."), lalu split per titik koma.
 */
function parseStatements(sqlText) {
  const withoutComments = sqlText
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  return withoutComments
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

async function migrate() {
  if (!process.env.TURSO_DATABASE_URL) {
    console.error(
      "[migrate] TURSO_DATABASE_URL belum diisi di .env. " +
        "Buat database dulu di https://turso.tech (dashboard), lalu salin URL & token-nya ke .env."
    );
    process.exit(1);
  }

  console.log(`[migrate] Membaca ${SCHEMA_PATH} ...`);
  const sqlText = fs.readFileSync(SCHEMA_PATH, "utf8");
  const statements = parseStatements(sqlText);

  console.log(`[migrate] Menjalankan ${statements.length} statement ke database ...`);

  for (const statement of statements) {
    const label = statement.split("\n")[0].slice(0, 70);
    try {
      await db.execute(statement);
      console.log(`[migrate] OK  - ${label}`);
    } catch (err) {
      console.error(`[migrate] GAGAL - ${label}`);
      console.error(err.message);
      process.exit(1);
    }
  }

  console.log("[migrate] Selesai. Semua tabel & index sudah siap dipakai.");
  process.exit(0);
}

migrate();
