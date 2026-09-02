/**
 * services/auth.js
 * -----------------------------------------------------------------------
 * Helper autentikasi admin di sisi frontend:
 *  - menyimpan/membaca token JWT dari sessionStorage (hilang saat tab
 *    ditutup — cukup untuk sesi kerja admin, tidak tersimpan permanen
 *    di perangkat publik/bersama)
 *  - AuthGuard.protect() dipanggil di halaman yang butuh login (Input
 *    Data Kesehatan) — otomatis redirect ke login.html jika belum login
 *  - logout() menghapus sesi & kembali ke halaman login
 *
 * Token TIDAK divalidasi ulang di sini (itu tugas backend saat token
 * dipakai memanggil endpoint terproteksi) — guard ini hanya mencegah
 * halaman terbuka tanpa token sama sekali. Jika token sudah kedaluwarsa,
 * backend akan menolak (401) saat request dikirim, dan halaman
 * menampilkan pesan untuk login kembali (lihat js/pages/input-data.js).
 * -----------------------------------------------------------------------
 */
(function (window) {
  "use strict";

  const STORAGE_KEY = "puskesmas_admin_session";

  function saveSession({ token, username, role }) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token, username, role }));
  }

  function getSession() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function getToken() {
    const session = getSession();
    return session ? session.token : null;
  }

  function clearSession() {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  function isLoggedIn() {
    return Boolean(getToken());
  }

  function logout(redirectTo) {
    clearSession();
    window.location.href = redirectTo || "login.html";
  }

  /**
   * Panggil di awal halaman yang wajib login. Jika belum ada sesi,
   * langsung redirect ke halaman login (membawa parameter `next` supaya
   * setelah login berhasil, admin dikembalikan ke halaman semula).
   */
  function protect() {
    if (!isLoggedIn()) {
      const nextPage = encodeURIComponent(window.location.pathname.split("/").pop());
      window.location.href = `login.html?next=${nextPage}`;
    }
  }

  window.AdminAuth = { saveSession, getSession, getToken, clearSession, isLoggedIn, logout, protect };
})(window);
