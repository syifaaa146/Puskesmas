-- =============================================================================
-- SKEMA DATABASE — UPTD PUSKESMAS KUTAWALUYA (Turso / libSQL, dialek SQLite)
--
-- Cara menjalankan (pilih salah satu):
--   1. Turso CLI   : turso db shell <nama-db> < sql/schema.sql
--   2. Turso CLI   : turso db shell <nama-db>
--                    lalu paste isi file ini satu per satu.
--   3. Lokal (dev) : gunakan file SQLite lokal, jalankan lewat sqlite3 atau
--                    lewat client Node (lihat README.md).
-- =============================================================================

-- -----------------------------------------------------------------------
-- 1. survey_responses
--    Jawaban disimpan sebagai TEXT berisi JSON (`answers`) — BUKAN kolom
--    tetap question_1..question_n — supaya jumlah pertanyaan pada form
--    survei dapat berubah kapan saja tanpa perlu migrasi skema database.
--    Contoh isi kolom answers: {"q1": 5, "q2": 4, "q3": 3, ...}
--    id dibuat di sisi aplikasi (UUID v4, lihat services/surveyService.js).
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS survey_responses (
  id           TEXT PRIMARY KEY,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  name         TEXT,                     -- opsional, boleh kosong (anonim)
  age          INTEGER,                  -- opsional
  service      TEXT NOT NULL,            -- jenis layanan yang diterima
  visit_date   TEXT NOT NULL,            -- tanggal kunjungan (yyyy-mm-dd)
  answers      TEXT NOT NULL,            -- JSON: { "q1": 5, "q2": 4, ... } skala 1-5
  suggestion   TEXT,                     -- saran (opsional)
  liked_aspect TEXT                      -- hal yang disukai (opsional)
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at
  ON survey_responses (created_at);

-- -----------------------------------------------------------------------
-- 2. health_visits
--    Hasil olahan Excel untuk jenis data "kunjungan_pasien".
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS health_visits (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  tanggal          TEXT NOT NULL,            -- yyyy-mm-dd
  poli             TEXT,                     -- boleh null jika Excel tidak memiliki kolom poli
  jumlah_kunjungan INTEGER NOT NULL CHECK (jumlah_kunjungan >= 0),
  source_file      TEXT                      -- nama file Excel asal data, untuk audit/trace
);

CREATE INDEX IF NOT EXISTS idx_health_visits_tanggal
  ON health_visits (tanggal);

-- -----------------------------------------------------------------------
-- 3. health_diseases
--    Hasil olahan Excel untuk jenis data "penyakit_terbanyak".
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS health_diseases (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  nama_penyakit TEXT NOT NULL,
  jumlah_kasus  INTEGER NOT NULL CHECK (jumlah_kasus >= 0),
  periode       TEXT,                  -- misal "Januari 2026", opsional
  source_file   TEXT
);

CREATE INDEX IF NOT EXISTS idx_health_diseases_nama
  ON health_diseases (nama_penyakit);

-- -----------------------------------------------------------------------
-- 4. health_data
--    Penyimpanan generik untuk jenis data "lainnya" yang belum memiliki
--    tabel khusus. Menyimpan setiap baris Excel apa adanya sebagai TEXT
--    berisi JSON supaya struktur kolom Excel apa pun tetap dapat
--    ditampung.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS health_data (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  jenis_data  TEXT NOT NULL,
  row_data    TEXT NOT NULL,           -- JSON
  source_file TEXT
);

CREATE INDEX IF NOT EXISTS idx_health_data_jenis
  ON health_data (jenis_data);

-- -----------------------------------------------------------------------
-- 5. site_content
--    Penyimpanan konten yang dulunya statis di data/content.js (Informasi
--    & Berita, Agenda, Profil, Layanan, Program) — sekarang dikelola lewat
--    halaman admin "Kelola Konten", bukan diedit langsung di kode.
--
--    Satu baris = satu "bagian" konten (section_key), isinya JSON persis
--    seperti struktur yang dulu ada di data/content.js. Pendekatan ini
--    dipilih (bukan tabel terpisah per jenis konten) supaya struktur
--    bersarang (misalnya daftar layanan yang masing-masing punya daftar
--    persyaratan & alur sendiri) tidak perlu dipecah ke banyak tabel.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_content (
  section_key  TEXT PRIMARY KEY,     -- 'news' | 'agenda' | 'profile' | 'layanan' | 'programs'
  content_json TEXT NOT NULL,        -- JSON — bentuknya persis seperti field yang sama di data/content.js lama
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =============================================================================
-- CATATAN KEAMANAN
--
-- Backend mengakses Turso menggunakan auth token yang hanya disimpan di
-- environment variable server (TURSO_AUTH_TOKEN), tidak pernah dikirim
-- ke frontend/browser. Tidak ada akses langsung dari klien ke database —
-- seluruh baca/tulis WAJIB lewat backend Express (lihat api/_lib).
-- =============================================================================
