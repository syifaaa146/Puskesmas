/**
 * pages/pengaduan.js
 * -----------------------------------------------------------------------
 * Form Layanan Pengaduan Masyarakat:
 *  - Validasi form di sisi frontend
 *  - Kirim data via Fetch API (POST /api/complaints) ke backend
 *    (backend yang meneruskan ke email tujuan, TIDAK disimpan ke Supabase)
 *  - Notifikasi sukses/gagal, reset form setelah berhasil
 * -----------------------------------------------------------------------
 */
(function (window, document) {
  "use strict";

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

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

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validateForm(form, fileInput) {
    clearFieldErrors(form);
    let valid = true;

    const nama = form.querySelector("#complaint-nama");
    if (!nama.value.trim()) {
      showFieldError("complaint-nama");
      valid = false;
    }

    const hp = form.querySelector("#complaint-hp");
    if (!hp.value.trim() || hp.value.trim().length < 8) {
      showFieldError("complaint-hp");
      valid = false;
    }

    const email = form.querySelector("#complaint-email");
    if (!email.value.trim() || !isValidEmail(email.value.trim())) {
      showFieldError("complaint-email");
      valid = false;
    }

    const kategori = form.querySelector("#complaint-kategori");
    if (!kategori.value) {
      showFieldError("complaint-kategori");
      valid = false;
    }

    const subjek = form.querySelector("#complaint-subjek");
    if (!subjek.value.trim()) {
      showFieldError("complaint-subjek");
      valid = false;
    }

    const isi = form.querySelector("#complaint-isi");
    if (!isi.value.trim() || isi.value.trim().length < 20) {
      showFieldError("complaint-isi");
      valid = false;
    }

    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      if (file.size > MAX_FILE_SIZE || !ALLOWED_TYPES.includes(file.type)) {
        showFieldError("complaint-lampiran");
        valid = false;
      }
    }

    const confirm = form.querySelector("#complaint-confirm");
    if (!confirm.checked) {
      showFieldError("complaint-confirm");
      valid = false;
    }

    return valid;
  }

  function toggleAlert(id, show) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle("show", show);
  }

  function setupDropzone() {
    const dropzone = document.getElementById("complaint-dropzone");
    const fileInput = document.getElementById("complaint-lampiran");
    const filenameEl = document.getElementById("complaint-filename");

    dropzone.addEventListener("click", () => fileInput.click());

    ["dragenter", "dragover"].forEach((evt) => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropzone.classList.add("is-dragover");
      });
    });

    ["dragleave", "drop"].forEach((evt) => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropzone.classList.remove("is-dragover");
      });
    });

    dropzone.addEventListener("drop", (e) => {
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        updateFilename();
      }
    });

    fileInput.addEventListener("change", updateFilename);

    function updateFilename() {
      const file = fileInput.files[0];
      filenameEl.textContent = file ? file.name : "";
      const errorEl = document.querySelector('.field-error[data-error-for="complaint-lampiran"]');
      if (errorEl) errorEl.classList.remove("show");
      dropzone.classList.remove("is-invalid");
    }
  }

  function buildPayload(form, fileInput) {
    const hasFile = fileInput.files && fileInput.files[0];
    if (hasFile) {
      const fd = new FormData(form);
      return fd;
    }
    const formData = new FormData(form);
    const obj = {};
    formData.forEach((value, key) => {
      if (key === "lampiran" || key === "konfirmasi") return;
      obj[key] = value;
    });
    return obj;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const fileInput = document.getElementById("complaint-lampiran");
    const submitBtn = document.getElementById("complaint-submit-btn");
    const submitLabel = document.getElementById("complaint-submit-label");

    toggleAlert("complaint-alert-success", false);
    toggleAlert("complaint-alert-error", false);

    if (!validateForm(form, fileInput)) {
      const firstError = form.querySelector(".is-invalid");
      if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const payload = buildPayload(form, fileInput);

    submitBtn.disabled = true;
    submitLabel.textContent = "Mengirim...";

    try {
      await window.ApiService.submitComplaint(payload);
      toggleAlert("complaint-alert-success", true);
      form.reset();
      document.getElementById("complaint-filename").textContent = "";
      clearFieldErrors(form);
      document.getElementById("complaint-alert-success").scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      const errorTextEl = document.getElementById("complaint-alert-error-text");
      errorTextEl.textContent =
        err && err.message
          ? err.message
          : "Pengaduan gagal dikirim. Silakan periksa koneksi Anda dan coba lagi.";
      toggleAlert("complaint-alert-error", true);
    } finally {
      submitBtn.disabled = false;
      submitLabel.textContent = "Kirim";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupDropzone();
    document.getElementById("complaint-form").addEventListener("submit", handleSubmit);
  });
})(window, document);
