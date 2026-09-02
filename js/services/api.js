/**
 * api.js
 * -----------------------------------------------------------------------
 * Lapisan komunikasi terpusat ke backend (Fetch API).
 * Semua pemanggilan endpoint HARUS lewat modul ini agar:
 *  - base URL konsisten (dari config.js)
 *  - error handling (network error, timeout, HTTP error) seragam
 *  - mudah diganti/di-mock saat backend belum tersedia
 *
 * Tidak ada logika bisnis (perhitungan statistik, dsb) di sini.
 * Modul ini murni transport layer.
 * -----------------------------------------------------------------------
 */
(function (window) {
  "use strict";

  const BASE_URL = window.APP_CONFIG.API_BASE_URL;
  const TIMEOUT = window.APP_CONFIG.REQUEST_TIMEOUT;

  /**
   * Kelas error khusus supaya pemanggil bisa membedakan
   * antara error jaringan, timeout, dan error dari server.
   */
  class ApiError extends Error {
    constructor(message, type, status) {
      super(message);
      this.name = "ApiError";
      this.type = type; // 'network' | 'timeout' | 'http' | 'parse'
      this.status = status || null;
    }
  }

  /**
   * Wrapper fetch dengan timeout + parsing JSON + error handling seragam.
   * @param {string} path - path relatif, contoh: '/survey/satisfaction'
   * @param {RequestInit} options - opsi fetch tambahan
   * @returns {Promise<any>} data JSON hasil parse
   */
  async function request(path, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    let response;
    try {
      response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...(options.body && !(options.body instanceof FormData)
            ? { "Content-Type": "application/json" }
            : {}),
          ...(options.headers || {}),
        },
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        throw new ApiError("Permintaan ke server melebihi batas waktu.", "timeout");
      }
      throw new ApiError("Tidak dapat terhubung ke server.", "network");
    }
    clearTimeout(timeoutId);

    let data = null;
    const contentType = response.headers.get("content-type") || "";
    try {
      if (contentType.includes("application/json")) {
        data = await response.json();
      }
    } catch (err) {
      throw new ApiError("Gagal membaca respons server.", "parse", response.status);
    }

    if (!response.ok) {
      const message =
        (data && (data.message || data.error)) ||
        `Terjadi kesalahan pada server (${response.status}).`;
      throw new ApiError(message, "http", response.status);
    }

    return data && Object.prototype.hasOwnProperty.call(data, "data") ? data.data : data;
  }

  /* ---------------------------------------------------------------------
   * Endpoint-endpoint spesifik
   * ------------------------------------------------------------------- */
  const ApiService = {
    ApiError,

    /* ---- Autentikasi Admin ---- */
    adminLogin(username, password) {
      return request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
    },

    /* ---- Informasi & Berita (Beranda) ---- */
    getNews() {
      return request("/news", { method: "GET" });
    },

    /* ---- Agenda / Kegiatan ---- */
    getAgenda() {
      return request("/agenda", { method: "GET" });
    },

    /* ---- Statistik kesehatan ---- */
    getPatientVisits() {
      return request("/health/visits", { method: "GET" });
    },
    getTopDiseases() {
      return request("/health/diseases", { method: "GET" });
    },

    /* ---- Survei Kepuasan ---- */
    getSatisfactionPercentage() {
      return request("/survey/satisfaction", { method: "GET" });
    },
    submitSurvey(payload) {
      return request("/survey", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    /* ---- Profil ---- */
    getProfile() {
      return request("/profile", { method: "GET" });
    },

    /* ---- Layanan ---- */
    getServices() {
      return request("/services", { method: "GET" });
    },
    getDoctorSchedule() {
      return request("/services/schedule", { method: "GET" });
    },

    /* ---- Program ---- */
    getPrograms() {
      return request("/programs", { method: "GET" });
    },

    /* ---- Pengaduan (tidak disimpan ke Supabase, diteruskan ke email) ---- */
    submitComplaint(payload) {
      const isFormData = payload instanceof FormData;
      return request("/complaints", {
        method: "POST",
        body: isFormData ? payload : JSON.stringify(payload),
      });
    },

    /* ---- Input Data Kesehatan (upload Excel) ---- */
    uploadHealthData(file, jenisData) {
      const formData = new FormData();
      formData.append("file", file);
      if (jenisData) formData.append("jenis_data", jenisData);
      return request("/health/upload", {
        method: "POST",
        body: formData,
      });
    },

    /* ---- Kelola file data kesehatan yang pernah diunggah (admin) ---- */
    getUploadedSources() {
      const token = window.AdminAuth && window.AdminAuth.getToken();
      return request("/health/sources", {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
    deleteUploadedSource({ kategori, source_file, jenis_data }) {
      const token = window.AdminAuth && window.AdminAuth.getToken();
      return request("/health/sources", {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify({ kategori, source_file, jenis_data }),
      });
    },
  };

  window.ApiService = ApiService;
})(window);
