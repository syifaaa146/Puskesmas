/**
 * config.js
 * -----------------------------------------------------------------------
 * Konfigurasi environment frontend.
 * Ubah nilai di bawah ini (atau override lewat build-tool / server config)
 * untuk mengarahkan frontend ke backend yang sesuai (local / staging / prod).
 *
 * Frontend TIDAK boleh melakukan hardcode URL produksi di file lain.
 * Semua file JS lain wajib membaca base URL dari window.APP_CONFIG.
 * -----------------------------------------------------------------------
 */
(function (window) {
  "use strict";

  // Deteksi otomatis: kalau dijalankan di localhost/127.0.0.1 pakai backend lokal,
  // selain itu pakai path relatif "/api" (asumsikan backend & frontend satu domain,
  // atau sudah di-proxy lewat reverse proxy / Nginx).
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  window.APP_CONFIG = Object.freeze({
    // Base URL REST API backend.
    API_BASE_URL: isLocal ? `http://${window.location.hostname}:5000/api` : "/api",

    // Timeout default untuk request fetch (ms).
    REQUEST_TIMEOUT: 15000,

    // Nama instansi (dipakai di beberapa tempat sebagai fallback teks).
    APP_NAME: "UPTD Puskesmas Kutawaluya",

    // Tahun berjalan untuk footer (fallback jika JS tanggal gagal).
    CURRENT_YEAR: new Date().getFullYear(),
  });

  /**
   * URL file yang dikembalikan backend (misalnya file PDF akreditasi hasil
   * upload) berbentuk path relatif ("/api/content/files/xxx"). Di produksi
   * (Vercel), frontend & backend satu domain jadi path relatif langsung
   * berfungsi. Tapi saat development lokal lewat Live Server, halaman
   * dibuka dari port BERBEDA (misal :5500) dari backend (:5000) — path
   * relatif akan salah arah (nyasar ke Live Server, bukan ke backend).
   * Fungsi ini menambahkan origin backend yang benar HANYA saat
   * diperlukan (dev lokal); di produksi path relatif dikembalikan apa adanya.
   */
  window.resolveFileUrl = function (relativeUrl) {
    if (!relativeUrl) return relativeUrl;
    const base = window.APP_CONFIG.API_BASE_URL;
    const isAbsoluteBase = /^https?:\/\//i.test(base);
    if (!isAbsoluteBase) return relativeUrl;
    const origin = base.replace(/\/api\/?$/, "");
    return origin + relativeUrl;
  };
})(window);
