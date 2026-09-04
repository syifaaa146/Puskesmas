/**
 * pages/login.js
 * -----------------------------------------------------------------------
 * Menangani form login admin:
 *  - validasi input dasar
 *  - panggil POST /api/auth/login lewat ApiService.adminLogin
 *  - simpan token di sessionStorage lewat AdminAuth
 *  - redirect ke halaman tujuan (default: input-data.html)
 *
 * Jika admin sudah login (token masih ada di sessionStorage), halaman
 * ini langsung redirect ke tujuan tanpa perlu login ulang.
 * -----------------------------------------------------------------------
 */
(function (window, document) {
  "use strict";

  const ALLOWED_NEXT_PAGES = ["input-data.html", "kelola-konten.html"];

  function getNextPage() {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    // Whitelist sederhana supaya parameter "next" tidak bisa dipakai
    // untuk redirect ke luar situs (open redirect).
    return ALLOWED_NEXT_PAGES.includes(next) ? next : "input-data.html";
  }

  function clearFieldErrors(form) {
    form.querySelectorAll(".field-error.show").forEach((el) => el.classList.remove("show"));
    form.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
  }

  function showFieldError(id) {
    const el = document.querySelector(`.field-error[data-error-for="${id}"]`);
    if (el) el.classList.add("show");
    const input = document.getElementById(id);
    if (input) input.classList.add("is-invalid");
  }

  function toggleAlert(id, show, message) {
    const el = document.getElementById(id);
    if (!el) return;
    if (message) {
      const span = el.querySelector("span");
      if (span) span.textContent = message;
    }
    el.classList.toggle("show", show);
  }

  function setupPasswordToggle() {
    const toggleBtn = document.getElementById("password-toggle");
    const passwordInput = document.getElementById("login-password");
    toggleBtn.addEventListener("click", () => {
      const isHidden = passwordInput.type === "password";
      passwordInput.type = isHidden ? "text" : "password";
      toggleBtn.innerHTML = isHidden
        ? '<i class="fa-solid fa-eye-slash"></i>'
        : '<i class="fa-solid fa-eye"></i>';
      toggleBtn.setAttribute("aria-label", isHidden ? "Sembunyikan password" : "Tampilkan password");
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;
    const submitBtn = document.getElementById("login-submit-btn");
    const submitLabel = document.getElementById("login-submit-label");

    clearFieldErrors(form);
    toggleAlert("login-alert-error", false);

    let valid = true;
    if (!username) {
      showFieldError("login-username");
      valid = false;
    }
    if (!password) {
      showFieldError("login-password");
      valid = false;
    }
    if (!valid) return;

    submitBtn.disabled = true;
    submitLabel.textContent = "Memeriksa...";

    try {
      const result = await window.ApiService.adminLogin(username, password);
      window.AdminAuth.saveSession(result);
      window.location.href = getNextPage();
    } catch (err) {
      const message =
        err && err.message ? err.message : "Gagal login. Silakan periksa koneksi Anda dan coba lagi.";
      toggleAlert("login-alert-error", true, message);
    } finally {
      submitBtn.disabled = false;
      submitLabel.textContent = "Masuk";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Jika sudah login, langsung lempar ke halaman tujuan.
    if (window.AdminAuth.isLoggedIn()) {
      window.location.href = getNextPage();
      return;
    }

    setupPasswordToggle();
    document.getElementById("login-form").addEventListener("submit", handleSubmit);
  });
})(window, document);
