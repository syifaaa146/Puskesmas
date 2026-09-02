/**
 * pages/survei.js
 * -----------------------------------------------------------------------
 * Form Survei Kepuasan Masyarakat:
 *  - Generate 9 pertanyaan penilaian dengan skala 1-5
 *  - Validasi form di sisi frontend
 *  - Kirim data via Fetch API (POST /api/survey) ke backend -> Supabase
 *  - Notifikasi sukses/gagal, reset form setelah berhasil
 * -----------------------------------------------------------------------
 */
(function (window, document) {
  "use strict";

  const { escapeHtml } = window.AppUtils;

  const QUESTIONS = [
    { id: "q1", text: "Kemudahan persyaratan pelayanan" },
    { id: "q2", text: "Kemudahan prosedur pelayanan" },
    { id: "q3", text: "Kecepatan waktu pelayanan" },
    { id: "q4", text: "Kewajaran / kejelasan biaya pelayanan" },
    { id: "q5", text: "Kompetensi petugas" },
    { id: "q6", text: "Keramahan dan perilaku petugas" },
    { id: "q7", text: "Kualitas pelayanan" },
    { id: "q8", text: "Penanganan pengaduan" },
    { id: "q9", text: "Sarana dan prasarana" },
  ];

  function renderQuestions() {
    const container = document.getElementById("survey-questions-container");
    container.innerHTML = QUESTIONS.map(
      (q, index) => `
      <div class="survey-question-row">
        <span>${index + 1}. ${escapeHtml(q.text)}</span>
        <div class="rating-scale" data-question="${q.id}">
          ${[1, 2, 3, 4, 5]
            .map(
              (val) => `
            <label class="rating-opt">
              <input type="radio" name="${q.id}" value="${val}" required>
              ${val}
            </label>`
            )
            .join("")}
        </div>
      </div>`
    ).join("");
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

  function validateForm(form) {
    clearFieldErrors(form);
    let valid = true;

    const tanggal = form.querySelector("#survey-tanggal");
    if (!tanggal.value) {
      showFieldError("survey-tanggal");
      valid = false;
    }

    const layanan = form.querySelector("#survey-layanan");
    if (!layanan.value) {
      showFieldError("survey-layanan");
      valid = false;
    }

    let allRated = true;
    QUESTIONS.forEach((q) => {
      const checked = form.querySelector(`input[name="${q.id}"]:checked`);
      if (!checked) allRated = false;
    });
    if (!allRated) {
      const el = document.querySelector('.field-error[data-error-for="survey-questions"]');
      if (el) el.classList.add("show");
      valid = false;
    }

    return valid;
  }

  function buildPayload(form) {
    const formData = new FormData(form);
    const penilaian = {};
    QUESTIONS.forEach((q) => {
      penilaian[q.id] = Number(formData.get(q.id));
    });

    return {
      nama: formData.get("nama") || null,
      usia: formData.get("usia") ? Number(formData.get("usia")) : null,
      tanggal_kunjungan: formData.get("tanggal_kunjungan"),
      layanan: formData.get("layanan"),
      penilaian: penilaian,
      saran: formData.get("saran") || null,
      hal_disukai: formData.get("hal_disukai") || null,
    };
  }

  function toggleAlert(id, show) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle("show", show);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = document.getElementById("survey-submit-btn");
    const submitLabel = document.getElementById("survey-submit-label");

    toggleAlert("survey-alert-success", false);
    toggleAlert("survey-alert-error", false);

    if (!validateForm(form)) {
      const firstError = form.querySelector(".is-invalid, .field-error.show");
      if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const payload = buildPayload(form);

    submitBtn.disabled = true;
    submitLabel.textContent = "Mengirim...";

    try {
      await window.ApiService.submitSurvey(payload);
      toggleAlert("survey-alert-success", true);
      form.reset();
      clearFieldErrors(form);
      document.getElementById("survey-alert-success").scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      const errorTextEl = document.getElementById("survey-alert-error-text");
      errorTextEl.textContent =
        err && err.message
          ? err.message
          : "Survei gagal dikirim. Silakan periksa koneksi Anda dan coba lagi.";
      toggleAlert("survey-alert-error", true);
    } finally {
      submitBtn.disabled = false;
      submitLabel.textContent = "Kirim";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderQuestions();
    document.getElementById("survey-form").addEventListener("submit", handleSubmit);

    // Set batas tanggal kunjungan agar tidak melebihi hari ini.
    const tanggalInput = document.getElementById("survey-tanggal");
    tanggalInput.max = new Date().toISOString().split("T")[0];
  });
})(window, document);
