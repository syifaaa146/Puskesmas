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
})(window);
