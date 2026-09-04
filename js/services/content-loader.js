/**
 * services/content-loader.js
 * -----------------------------------------------------------------------
 * Menggantikan data/content.js (yang dulu statis) sebagai sumber
 * window.SITE_CONTENT. Sekarang datanya diambil dari backend
 * (GET /api/content), yang isinya dikelola lewat halaman admin
 * "Kelola Konten" (kelola-konten.html) — bukan diedit langsung di kode.
 *
 * window.SITE_CONTENT tetap punya BENTUK YANG SAMA PERSIS seperti
 * sebelumnya (news, agenda, profile, layanan, programs), supaya kode
 * halaman publik (beranda.js, profil.js, layanan.js, program.js) tidak
 * perlu ditulis ulang — cuma menunggu window.SiteContentReady selesai
 * dulu sebelum membaca window.SITE_CONTENT.
 *
 * PENTING: script ini harus dimuat SETELAH js/config.js (butuh
 * window.APP_CONFIG.API_BASE_URL) dan SEBELUM script halaman spesifik
 * (beranda.js, profil.js, dst) di setiap file .html.
 * -----------------------------------------------------------------------
 */
(function (window) {
  "use strict";

  // Bentuk kosong default — dipakai sementara sebelum fetch selesai, dan
  // sebagai fallback kalau fetch gagal (misalnya backend sedang bermasalah),
  // supaya halaman menampilkan "Belum ada data ..." alih-alih error total.
  window.SITE_CONTENT = {
    news: [],
    agenda: [],
    profile: {},
    layanan: {},
    programs: [],
  };

  const BASE_URL = window.APP_CONFIG.API_BASE_URL;

  window.SiteContentReady = fetch(`${BASE_URL}/content`, { headers: { Accept: "application/json" } })
    .then((res) => res.json())
    .then((body) => {
      const data = (body && body.data) || {};
      window.SITE_CONTENT = {
        news: Array.isArray(data.news) ? data.news : [],
        agenda: Array.isArray(data.agenda) ? data.agenda : [],
        profile: data.profile && typeof data.profile === "object" ? data.profile : {},
        layanan: data.layanan && typeof data.layanan === "object" ? data.layanan : {},
        programs: Array.isArray(data.programs) ? data.programs : [],
      };
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error("Gagal memuat konten situs dari server:", err);
      // window.SITE_CONTENT tetap objek kosong bawaan di atas.
    });
})(window);
