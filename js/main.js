/**
 * main.js
 * -----------------------------------------------------------------------
 * Logika umum yang dipakai di semua halaman:
 *  - menandai menu navbar yang aktif sesuai halaman
 *  - mengisi tahun berjalan di footer
 *  - helper kecil yang dipakai lintas halaman (escapeHtml, formatDate, dsb)
 * -----------------------------------------------------------------------
 */
(function (window, document) {
  "use strict";

  /** Escape string sebelum disisipkan ke innerHTML, mencegah XSS dari data API. */
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /** Format tanggal ISO menjadi format Indonesia singkat, contoh: 12 Agu 2026 */
  function formatDate(isoString) {
    if (!isoString) return "-";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return isoString;
    }
  }

  /** Tandai link navbar yang cocok dengan halaman saat ini. */
  function markActiveNav() {
    const current = (document.body.dataset.page || "").toLowerCase();
    document.querySelectorAll(".nav-pill[data-page]").forEach((link) => {
      if (link.dataset.page.toLowerCase() === current) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  /** Isi tahun berjalan pada elemen berid `footer-year`. */
  function fillFooterYear() {
    document.querySelectorAll("[data-footer-year]").forEach((el) => {
      el.textContent = window.APP_CONFIG.CURRENT_YEAR;
    });
  }

  /** Tampilkan state loading (skeleton) pada sebuah container. */
  function setLoading(container, message) {
    if (!container) return;
    container.innerHTML = `<div class="state-message">${escapeHtml(
      message || "Memuat data..."
    )}</div>`;
  }

  /** Tampilkan pesan error/empty state seragam pada sebuah container. */
  function setMessage(container, message, isError) {
    if (!container) return;
    container.innerHTML = `<div class="state-message${
      isError ? " is-error" : ""
    }">${escapeHtml(message)}</div>`;
  }

  document.addEventListener("DOMContentLoaded", function () {
    markActiveNav();
    fillFooterYear();
  });

  window.AppUtils = {
    escapeHtml,
    formatDate,
    setLoading,
    setMessage,
  };
})(window, document);
