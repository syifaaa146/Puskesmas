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

Setelah itu, isi konten awal (Informasi & Berita, Agenda, Profil,
Layanan, Program) supaya halaman publik tidak kosong:

```bash
npm run seed-content
```

Script ini (`scripts/seed-content.js`) mengisi data contoh awal. Setelah
dijalankan sekali, konten selanjutnya diubah lewat halaman admin
**Kelola Konten** (lihat bagian "Mengubah Konten Website" di bawah),
BUKAN dengan menjalankan script ini lagi — menjalankannya ulang akan
MENIMPA perubahan yang sudah dibuat lewat halaman admin.

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

## 7. Supaya muncul di Google (Search Console — gratis)

Situs yang baru deploy tidak otomatis muncul di hasil pencarian Google.
Ini cara mendaftarkannya (gratis, tanpa biaya sama sekali):

1. **Ganti placeholder domain** di dua file berikut dengan domain situs
   kamu yang sebenarnya (lihat di address bar browser setelah deploy,
   misal `https://puskesmas-kutawaluya.vercel.app`):
   - `sitemap.xml` — ganti semua `https://GANTI-DENGAN-DOMAIN-KAMU.vercel.app`
   - `robots.txt` — ganti baris `Sitemap:` di baris terakhir
2. Commit & push perubahan itu ke GitHub (lihat bagian "Kalau nanti
   mau ubah lagi" di bawah) supaya Vercel redeploy dengan file yang sudah
   benar.
3. Buka **https://search.google.com/search-console** → login dengan
   akun Google.
4. Pilih tipe properti **"URL prefix"**, masukkan domain situs kamu
   persis dengan `https://` di depannya.
5. Google akan minta verifikasi kepemilikan. Cara termudah untuk project
   ini: pilih metode **"HTML tag"** — Google akan kasih satu baris kode
   seperti:
   ```html
   <meta name="google-site-verification" content="abcXYZ123...">
   ```
   Salin kode itu, buka `index.html`, cari baris:
   ```html
   <!-- <meta name="google-site-verification" content="GANTI_DENGAN_KODE_DARI_GOOGLE"> -->
   ```
   Ganti dengan kode asli dari Google (hapus juga tanda `<!--` dan `-->`
   di awal/akhir supaya tidak lagi jadi komentar). Commit & push lagi.
6. Balik ke Search Console, klik **Verify**.
7. Setelah terverifikasi, buka menu **Sitemaps** di sidebar kiri,
   masukkan `sitemap.xml`, klik **Submit**.
8. (Opsional, biar lebih cepat) Buka menu **URL Inspection**, masukkan
   URL halaman utama situs kamu, klik **Request Indexing**.

Setelah ini, Google akan mulai meng-index situs kamu — biasanya muncul
di hasil pencarian dalam beberapa hari sampai beberapa minggu.

## Mengubah Konten Website (Informasi, Agenda, Profil, Layanan, Program)

Konten-konten ini **tidak lagi diedit lewat kode** — semuanya dikelola
dari halaman admin:

1. Login admin di `login.html` (kredensial `ADMIN_USERNAME`/password
   sesuai `ADMIN_PASSWORD_HASH`).
2. Buka halaman **`kelola-konten.html`** (ada tombol "Kelola Konten" di
   halaman Input Data Kesehatan, atau akses langsung URL-nya).
3. Pilih tab bagian yang ingin diubah: **Informasi & Berita**, **Agenda**,
   **Profil**, **Layanan**, atau **Program**.
4. Tambah/ubah/hapus item lewat form yang tersedia (tombol **Tambah**
   untuk menambah item baru, ikon tempat sampah untuk menghapus).
5. Klik **Simpan Perubahan** — hanya menyimpan tab yang sedang aktif.
6. Perubahan langsung tampil di halaman publik begitu di-refresh (tidak
   perlu `git push` atau redeploy, karena datanya di database, bukan kode).

Data teknisnya tersimpan di tabel `site_content` (satu baris JSON per
bagian) — lihat `api/_lib/services/contentService.js` jika suatu saat
perlu diubah lewat kode/SQL langsung.

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
- Konten situs (Informasi & Berita, Agenda, Profil, Layanan, Program):
  **file statis `data/content.js` → database (tabel `site_content`)**,
  dikelola lewat halaman admin baru `kelola-konten.html` — lihat bagian
  "Mengubah Konten Website" di atas. `data/content.js` tidak lagi dipakai
  oleh halaman publik (diganti `js/services/content-loader.js`), hanya
  disimpan sebagai arsip data awal.
