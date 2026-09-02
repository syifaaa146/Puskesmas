# Website UPTD Puskesmas Kutawaluya

Satu project (frontend statis + backend API) yang siap di-push ke GitHub
dan di-deploy langsung ke Vercel. Database menggunakan **Turso**
(SQLite terdistribusi), menggantikan Supabase.

## Struktur folder

```
.
├── index.html, login.html, dst.   -> halaman frontend (statis)
├── css/, js/, assets/, data/      -> aset frontend
├── api/
│   ├── index.js                  -> entry point serverless Vercel (/api/*)
│   └── _lib/                     -> backend Express (controllers, routes,
│                                     services, middleware, utils, config)
├── sql/schema.sql                -> skema database (dialek SQLite/Turso)
├── server.js                     -> entry point untuk development LOKAL
├── vercel.json                   -> konfigurasi routing Vercel
└── package.json
```

> Kenapa backend ada di `api/_lib/` bukan langsung di `api/`? Karena
> Vercel menganggap SETIAP file `.js` langsung di dalam `api/` sebagai
> endpoint terpisah. Folder yang diawali `_` (underscore) diabaikan dari
> aturan itu, jadi struktur backend (controllers/services/routes) tetap
> bisa dipakai sebagai satu Express app lewat `api/index.js`.

## 1. Buat database Turso (lewat dashboard, tanpa install CLI)

1. Buka **[turso.tech](https://turso.tech)** → sign up / login (bisa pakai akun GitHub).
2. Klik **Create Database**, kasih nama bebas (misal `puskesmas-kutawaluya`),
   pilih region terdekat, lalu buat.
3. Di halaman database yang baru dibuat, cari:
   - **Database URL** (bentuknya `libsql://nama-db-org.turso.io`) → ini untuk `TURSO_DATABASE_URL`
   - Tombol **Create Token** (atau "Generate Token") → ini untuk `TURSO_AUTH_TOKEN`
4. Salin dua nilai itu, akan dipakai di langkah 2.

Database masih kosong (belum ada tabel) — tabelnya dibuat otomatis lewat
script Node di langkah 3, jadi tidak perlu buka SQL editor manual.

## 2. Setup environment variable

```bash
cp .env.example .env
```

Isi semua nilai di `.env`:
- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` — dari langkah 1.
- `JWT_SECRET` — string acak bebas, contoh: `openssl rand -hex 32`.
- `ADMIN_USERNAME` — username admin bebas.
- `ADMIN_PASSWORD_HASH` — jalankan:
  ```bash
  npm install
  npm run hash-password -- "password_admin_anda"
  ```
  lalu salin hasilnya ke `.env`.
- `MAIL_HOST`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_TO` — untuk fitur
  kirim email pengaduan (Gmail: gunakan App Password, bukan password akun biasa).

## 3. Buat tabel-tabel di database (sekali saja)

Setelah `.env` terisi `TURSO_DATABASE_URL` & `TURSO_AUTH_TOKEN`, jalankan:

```bash
npm install
npm run migrate
```

Script ini (`scripts/migrate.js`) membaca `sql/schema.sql` dan membuat
semua tabel + index langsung dari Node — tidak perlu install Turso CLI
atau buka SQL editor manual. Aman dijalankan berkali-kali (statement-nya
pakai `IF NOT EXISTS`).

## 4. Jalankan di lokal

```bash
npm install
npm run dev
```

Backend jalan di `http://localhost:5000`. Buka `index.html` langsung
di browser, atau pakai ekstensi "Live Server" — `js/config.js` otomatis
mengarah ke `http://localhost:5000/api` saat hostname-nya `localhost`.

## 5. Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit: migrasi ke Turso, satu project untuk Vercel"
git branch -M main
git remote add origin <url-repo-github-anda>
git push -u origin main
```

`.env` sudah masuk `.gitignore`, jadi tidak akan ter-push (kredensial aman).

## 6. Deploy ke Vercel

1. Buka https://vercel.com → **Add New Project** → import repo GitHub ini.
2. Framework preset: pilih **Other** (Vercel akan otomatis mendeteksi
   `api/` sebagai serverless functions dan file HTML/CSS/JS lain sebagai
   static assets — tidak perlu build command).
3. Di bagian **Environment Variables**, isi semua variabel yang sama
   seperti di `.env` lokal (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`,
   `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `MAIL_*`, dst).
   `FRONTEND_URL` boleh dikosongkan (frontend & backend satu domain).
4. Klik **Deploy**.

Setelah deploy, frontend otomatis memakai path relatif `/api` (lihat
`js/config.js`), jadi tidak perlu ubah apa pun di frontend — semuanya
satu domain Vercel.

## Ringkasan perubahan dari versi asli

- Database: **Supabase (Postgres) → Turso (libSQL/SQLite)**.
  - `src/config/supabase.js` → `api/_lib/config/db.js`
  - Query Supabase JS SDK di `healthService.js` dan `surveyService.js`
    diganti jadi SQL mentah lewat `@libsql/client` (`db.execute`, `db.batch`).
  - `sql/schema.sql` ditulis ulang ke dialek SQLite (tipe data, index,
    auto-increment, tanpa RLS Postgres).
  - Kolom `jsonb` di Postgres → kolom `TEXT` berisi JSON string
    (di-serialize/parse manual di kode Node).
  - `id` UUID pada `survey_responses` sekarang dibuat di aplikasi
    (`crypto.randomUUID()`), bukan `gen_random_uuid()` bawaan Postgres.
  - Setup database sekarang lewat dashboard web Turso + `npm run migrate`
    (`scripts/migrate.js`), tidak perlu install Turso CLI sama sekali.
- Struktur: frontend (`frontend/`) dan backend (`backend/`) yang
  sebelumnya dua folder terpisah, digabung jadi satu repo siap deploy
  Vercel (frontend di root, backend di `api/_lib/`, entry point
  serverless di `api/index.js`).
- Tidak ada logika bisnis yang diubah — validasi, endpoint, response
  format, dan alur autentikasi admin tetap sama persis seperti sebelumnya.
