/**
 * pages/input-data.js
 * -----------------------------------------------------------------------
 * Halaman Input Data Kesehatan:
 *  - Pilih jenis data + upload file Excel (.xlsx/.xls) via drag & drop atau klik
 *  - Validasi ekstensi & ukuran file di frontend
 *  - Kirim file ke backend menggunakan multipart/form-data (POST /api/health/upload)
 *  - Backend yang memproses Excel & menyimpan hasil ke Supabase (bukan frontend)
 *  - Tampilkan progress upload, notifikasi sukses/error
 * -----------------------------------------------------------------------
 */
(function (window, document) {
  "use strict";

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_EXTENSIONS = [".xlsx", ".xls"];

  function clearFieldErrors(form) {
    form.querySelectorAll(".field-error.show").forEach((el) => el.classList.remove("show"));
    form.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
    document.getElementById("upload-dropzone").classList.remove("is-invalid");
  }

  function showFieldError(id) {
    const el = document.querySelector(`.field-error[data-error-for="${id}"]`);
    if (el) el.classList.add("show");
    const input = document.getElementById(id);
    if (input) input.classList.add("is-invalid");
    if (id === "upload-file") {
      document.getElementById("upload-dropzone").classList.add("is-invalid");
    }
  }

  function hasValidExtension(filename) {
    const lower = filename.toLowerCase();
    return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
  }

  function setupDropzone() {
    const dropzone = document.getElementById("upload-dropzone");
    const fileInput = document.getElementById("upload-file");
    const filenameEl = document.getElementById("upload-filename");

    dropzone.addEventListener("click", () => fileInput.click());
    dropzone.setAttribute("tabindex", "0");
    dropzone.setAttribute("role", "button");
    dropzone.setAttribute("aria-label", "Unggah file Excel data kesehatan");
    dropzone.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fileInput.click();
      }
    });

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
      filenameEl.textContent = file ? `${file.name} (${(file.size / 1024).toFixed(0)} KB)` : "";
      document.querySelector('.field-error[data-error-for="upload-file"]').classList.remove("show");
      dropzone.classList.remove("is-invalid");
    }
  }

  function validateForm(form, fileInput) {
    clearFieldErrors(form);
    let valid = true;

    const jenis = form.querySelector("#upload-jenis");
    if (!jenis.value) {
      showFieldError("upload-jenis");
      valid = false;
    }

    const file = fileInput.files[0];
    if (!file) {
      showFieldError("upload-file");
      valid = false;
    } else if (!hasValidExtension(file.name) || file.size > MAX_FILE_SIZE) {
      showFieldError("upload-file");
      valid = false;
    }

    return valid;
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

  function setProgress(percent) {
    const wrap = document.getElementById("upload-progress");
    const bar = document.getElementById("upload-progress-bar");
    if (percent === null) {
      wrap.classList.remove("active");
      bar.style.width = "0%";
      return;
    }
    wrap.classList.add("active");
    bar.style.width = `${percent}%`;
  }

  /**
   * Upload file dengan XMLHttpRequest agar progress bar dapat mengikuti
   * kemajuan pengiriman file (Fetch API belum mendukung upload progress
   * secara native di semua browser).
   */
  function uploadWithProgress(file, jenisData) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("jenis_data", jenisData);

      const xhr = new XMLHttpRequest();
      const baseUrl = window.APP_CONFIG.API_BASE_URL;
      xhr.open("POST", `${baseUrl}/health/upload`);

      const token = window.AdminAuth.getToken();
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.onload = () => {
        let data = null;
        try {
          data = JSON.parse(xhr.responseText);
        } catch (err) {
          /* respons bukan JSON, biarkan data null */
        }

        if (xhr.status === 401) {
          // Sesi admin tidak valid/kedaluwarsa: bersihkan sesi & kembali ke login.
          window.AdminAuth.clearSession();
          reject(new Error("SESSION_EXPIRED"));
          return;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data || {});
        } else {
          reject(new Error((data && (data.message || data.error)) || "Gagal mengunggah data ke server."));
        }
      };

      xhr.onerror = () => reject(new Error("Tidak dapat terhubung ke server."));
      xhr.ontimeout = () => reject(new Error("Permintaan ke server melebihi batas waktu."));
      xhr.timeout = window.APP_CONFIG.REQUEST_TIMEOUT;

      xhr.send(formData);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const fileInput = document.getElementById("upload-file");
    const submitBtn = document.getElementById("upload-submit-btn");
    const submitLabel = document.getElementById("upload-submit-label");

    toggleAlert("upload-alert-success", false);
    toggleAlert("upload-alert-error", false);

    if (!validateForm(form, fileInput)) {
      return;
    }

    const jenisData = document.getElementById("upload-jenis").value;
    const file = fileInput.files[0];

    submitBtn.disabled = true;
    submitLabel.textContent = "Mengunggah...";
    setProgress(0);

    try {
      const result = await uploadWithProgress(file, jenisData);
      setProgress(100);
      toggleAlert("upload-alert-success",  true,  
        (result && result.message) || "Data berhasil diunggah dan diproses. Grafik pada halaman Beranda akan otomatis diperbarui."
      );
      document.getElementById("upload-alert-success").scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById("upload-filename").textContent = "";
      setTimeout(() => {form.reset(); setProgress(null);}, 1500);
    } catch (err) {
      setProgress(null);
      if (err && err.message === "SESSION_EXPIRED") {
        window.location.href = "login.html?next=input-data.html";
        return;
      }
      toggleAlert(
        "upload-alert-error",
        true,
        (err && err.message) || "Gagal mengunggah data. Silakan periksa koneksi Anda dan coba lagi."
      );
    } finally {
      submitBtn.disabled = false;
      submitLabel.textContent = "Kirim";
    }
  }

  function setupAdminBar() {
    const session = window.AdminAuth.getSession();
    const usernameLabel = document.getElementById("admin-username-label");
    if (session && usernameLabel) {
      usernameLabel.textContent = session.username;
    }

    document.getElementById("logout-btn").addEventListener("click", () => {
      window.AdminAuth.logout("login.html");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupAdminBar();
    setupDropzone();
    document.getElementById("upload-form").addEventListener("submit", handleSubmit);
  });
})(window, document);
