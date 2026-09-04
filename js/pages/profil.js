/**
 * pages/profil.js
 * -----------------------------------------------------------------------
 * Menampilkan data Profil Puskesmas dari database (tabel site_content,
 * bagian `profile`). Untuk mengubah konten: login admin -> halaman
 * "Kelola Konten" -> tab Profil -> edit -> Simpan.
 * -----------------------------------------------------------------------
 */
(function (window, document) {
  "use strict";

  const { escapeHtml, setMessage } = window.AppUtils;

  function renderHighlights(highlights) {
    const container = document.getElementById("profile-highlights");
    if (!container) return;
    if (!highlights || !highlights.length) {
      container.innerHTML = "";
      return;
    }
    container.innerHTML = highlights
      .map(
        (h) => `
        <div class="d-flex align-items-center gap-2">
          <i class="fa-solid ${escapeHtml(h.icon || "fa-circle-check")} text-brand"></i>
          <span>${escapeHtml(h.text)}</span>
        </div>`
      )
      .join("");
  }

  function renderValues(values) {
    const container = document.getElementById("profile-values-container");
    if (!container) return;
    if (!values || !values.length) {
      setMessage(container, "Belum ada data tata nilai organisasi.");
      return;
    }
    container.innerHTML = values
      .map(
        (v) => `
        <div class="col-6 col-md-3">
          <div class="value-chip">
            <div class="quote">&ldquo;${escapeHtml(v.nilai)}&rdquo;</div>
            <div class="caption">${escapeHtml(v.arti || "")}</div>
          </div>
        </div>`
      )
      .join("");
  }

  function renderAccreditations(list) {
    const container = document.getElementById("profile-accreditations-container");
    if (!container) return;
    if (!list || !list.length) {
      setMessage(container, "Belum ada data akreditasi atau sertifikasi yang dipublikasikan.");
      return;
    }
    container.innerHTML = list
      .map(
        (a) => `
        <div class="col-md-6">
          <div class="accreditation-card">
            <div class="accreditation-icon"><i class="fa-solid fa-certificate"></i></div>
            <div>
              <h6 class="mb-1">${escapeHtml(a.nama)}</h6>
              <p class="text-muted small mb-2">${escapeHtml(a.penyelenggara || "")}</p>
              <span class="badge-soft">${escapeHtml(a.tmt || "TMT -")}</span>
              <span class="badge-soft">${escapeHtml(a.berlaku_hingga || "Masa berlaku -")}</span>
              ${
                a.file
                  ? `<a href="${escapeHtml(window.resolveFileUrl(a.file))}" target="_blank" rel="noopener" class="card-link d-block mt-2">
                       <i class="fa-solid fa-file-pdf me-1"></i>Lihat Sertifikat (PDF)
                     </a>`
                  : ""
              }
            </div>
          </div>
        </div>`
      )
      .join("");
  }

  function loadProfile() {
    const descEl = document.getElementById("profile-description");
    const visionEl = document.getElementById("profile-vision");
    const missionEl = document.getElementById("profile-mission");
    const mottoEl = document.getElementById("profile-motto");

    const data = (window.SITE_CONTENT && window.SITE_CONTENT.profile) || {};

    descEl.textContent = data.deskripsi || "Belum ada deskripsi profil yang dipublikasikan.";
    renderHighlights(data.highlights);

    if (data.visi) {
      visionEl.innerHTML = `&ldquo;${escapeHtml(data.visi)}&rdquo;`;
    } else {
      visionEl.textContent = "Belum ada data visi yang dipublikasikan.";
    }

    const misi = Array.isArray(data.misi) ? data.misi : [];
    if (misi.length) {
      missionEl.innerHTML = misi.map((m) => `<li class="mb-2">${escapeHtml(m)}</li>`).join("");
    } else {
      missionEl.innerHTML = `<li class="text-muted" style="list-style:none;">Belum ada data misi yang dipublikasikan.</li>`;
    }

    if (data.tata_nilai_judul) {
      mottoEl.innerHTML = `&ldquo;${escapeHtml(data.tata_nilai_judul)}&rdquo;`;
    }
    renderValues(data.tata_nilai);
    renderAccreditations(data.akreditasi);
  }

  document.addEventListener("DOMContentLoaded", function () {
    window.SiteContentReady.then(loadProfile);
  });
})(window, document);
