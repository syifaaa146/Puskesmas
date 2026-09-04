/**
 * pages/layanan.js
 * -----------------------------------------------------------------------
 * Menampilkan daftar layanan, cluster ILP, jadwal dokter (dengan filter),
 * alur pelayanan, dan persyaratan dokumen — seluruhnya dari database
 * (tabel site_content, bagian `layanan`). Untuk mengubah konten: login
 * admin -> halaman "Kelola Konten" -> tab Layanan -> edit -> Simpan.
 * -----------------------------------------------------------------------
 */
(function (window, document) {
  "use strict";

  const { escapeHtml, setMessage } = window.AppUtils;

  let allServices = [];
  let allSchedule = [];
  let activeCategory = "semua";
  let searchTerm = "";

  /* --------------------------- Kartu Layanan --------------------------- */
  function renderServiceCard(item) {
    const persyaratan = Array.isArray(item.persyaratan) ? item.persyaratan : [];
    const alur = Array.isArray(item.alur) ? item.alur : [];
    return `
      <div class="col-md-4">
        <div class="card-soft service-card">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="mb-0">${escapeHtml(item.nama)}</h5>
            ${item.kategori ? `<span class="card-tag mb-0">${escapeHtml(item.kategori)}</span>` : ""}
          </div>
          <p class="text-muted small">${escapeHtml(item.deskripsi || "")}</p>
          <div class="service-meta">
            ${item.jadwal ? `<span><i class="fa-regular fa-clock me-1"></i>${escapeHtml(item.jadwal)}</span>` : ""}
            ${item.lokasi ? `<span><i class="fa-solid fa-location-dot me-1"></i>${escapeHtml(item.lokasi)}</span>` : ""}
          </div>
          ${
            persyaratan.length || alur.length
              ? `<details>
                  <summary>Persyaratan &amp; Alur Pelayanan</summary>
                  <div class="mt-3">
                    ${
                      persyaratan.length
                        ? `<strong class="d-block mb-2 small text-brand">Persyaratan</strong>
                           <ul class="small ps-3">${persyaratan.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>`
                        : ""
                    }
                    ${
                      alur.length
                        ? `<strong class="d-block mb-2 small text-brand">Alur Pelayanan</strong>
                           <ol class="small ps-3">${alur.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ol>`
                        : ""
                    }
                  </div>
                </details>`
              : ""
          }
        </div>
      </div>`;
  }

  function renderServices() {
    const container = document.getElementById("services-container");
    if (!container) return;

    const filtered = allServices.filter((item) => {
      const matchCategory =
        activeCategory === "semua" ||
        (item.kategori || "").toLowerCase() === activeCategory.toLowerCase();
      const matchSearch =
        !searchTerm ||
        (item.nama || "").toLowerCase().includes(searchTerm) ||
        (item.deskripsi || "").toLowerCase().includes(searchTerm);
      return matchCategory && matchSearch;
    });

    if (!filtered.length) {
      setMessage(container, "Tidak ada layanan yang sesuai dengan pencarian/filter Anda.");
      return;
    }
    container.innerHTML = filtered.map(renderServiceCard).join("");
  }

  function renderCategoryFilters(categories) {
    const container = document.getElementById("service-category-filters");
    if (!container || !categories || !categories.length) return;

    const buttons = categories
      .map((cat) => `<button class="filter-pill" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`)
      .join("");
    container.insertAdjacentHTML("beforeend", buttons);

    container.querySelectorAll(".filter-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".filter-pill").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeCategory = btn.dataset.category;
        renderServices();
      });
    });
  }

  function loadServices() {
    const container = document.getElementById("services-container");
    const items = (window.SITE_CONTENT && window.SITE_CONTENT.layanan && window.SITE_CONTENT.layanan.services) || [];
    allServices = items;

    if (!items.length) {
      setMessage(container, "Belum ada layanan yang dipublikasikan.");
      return;
    }

    const categories = [...new Set(items.map((i) => i.kategori).filter(Boolean))];
    renderCategoryFilters(categories);
    renderServices();
  }

  /* --------------------------- Cluster ILP --------------------------- */
  function renderCluster(item, index) {
    return `
      <div class="col-md-4">
        <div class="card-soft">
          <span class="card-tag">Cluster ${index + 1}</span>
          <h5>${escapeHtml(item.nama)}</h5>
          <p class="text-muted small mb-2"><strong>Sasaran</strong><br>${escapeHtml(item.sasaran || "-")}</p>
          <p class="text-muted small mb-2"><strong>Jenis Pelayanan</strong><br>${escapeHtml(item.jenis_pelayanan || "-")}</p>
          <p class="text-muted small mb-0"><strong>Jadwal</strong><br>${escapeHtml(item.jadwal || "-")}</p>
        </div>
      </div>`;
  }

  function loadClusters() {
    const container = document.getElementById("clusters-container");
    const clusters = (window.SITE_CONTENT && window.SITE_CONTENT.layanan && window.SITE_CONTENT.layanan.clusters) || [];
    if (!clusters.length) {
      setMessage(container, "Belum ada data cluster pelayanan ILP.");
      return;
    }
    container.innerHTML = clusters.map(renderCluster).join("");
  }

  /* --------------------------- Jadwal Dokter --------------------------- */
  function renderScheduleRows() {
    const tbody = document.getElementById("schedule-table-body");
    if (!tbody) return;

    const hari = document.getElementById("filter-hari").value;
    const poli = document.getElementById("filter-poli").value;

    const filtered = allSchedule.filter((row) => {
      const matchHari = !hari || row.hari === hari;
      const matchPoli = !poli || row.poli === poli;
      return matchHari && matchPoli;
    });

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="state-message">Tidak ada jadwal yang sesuai dengan filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered
      .map(
        (row) => `
        <tr>
          <td>${escapeHtml(row.nama_petugas)}</td>
          <td>${escapeHtml(row.poli)}</td>
          <td>${escapeHtml(row.hari)}</td>
          <td>${escapeHtml(row.jam)}</td>
        </tr>`
      )
      .join("");
  }

  function loadSchedule() {
    const tbody = document.getElementById("schedule-table-body");
    const items = (window.SITE_CONTENT && window.SITE_CONTENT.layanan && window.SITE_CONTENT.layanan.schedule) || [];
    allSchedule = items;

    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="state-message">Belum ada data jadwal dokter yang dipublikasikan.</td></tr>`;
      return;
    }

    const poliOptions = [...new Set(items.map((i) => i.poli).filter(Boolean))];
    const poliSelect = document.getElementById("filter-poli");
    poliOptions.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p;
      opt.textContent = p;
      poliSelect.appendChild(opt);
    });

    renderScheduleRows();
  }

  /* --------------------------- Alur & Persyaratan --------------------------- */
  function loadAlurPersyaratan() {
    const alurContainer = document.getElementById("alur-container");
    const syaratContainer = document.getElementById("persyaratan-container");

    const layanan = (window.SITE_CONTENT && window.SITE_CONTENT.layanan) || {};
    const alur = layanan.alur_umum || [];
    const syarat = layanan.persyaratan_umum || [];

    if (!alur.length) {
      setMessage(alurContainer, "Belum ada data alur pelayanan.");
    } else {
      alurContainer.innerHTML = alur
        .map(
          (a, i) => `
          <div class="timeline-flow-item" data-step="${i + 1}">
            <h6>${escapeHtml(a.judul || a)}</h6>
            ${a.deskripsi ? `<p class="text-muted small mb-0">${escapeHtml(a.deskripsi)}</p>` : ""}
          </div>`
        )
        .join("");
    }

    if (!syarat.length) {
      syaratContainer.innerHTML = `<li class="state-message">Belum ada data persyaratan.</li>`;
    } else {
      syaratContainer.innerHTML = syarat
        .map(
          (s) => `<li class="persyaratan-item"><i class="fa-solid fa-circle-check"></i><span>${escapeHtml(s)}</span></li>`
        )
        .join("");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    window.SiteContentReady.then(function () {
      loadServices();
      loadClusters();
      loadSchedule();
      loadAlurPersyaratan();
    });

    const searchInput = document.getElementById("service-search");
    searchInput.addEventListener("input", (e) => {
      searchTerm = e.target.value.trim().toLowerCase();
      renderServices();
    });

    document.getElementById("filter-hari").addEventListener("change", renderScheduleRows);
    document.getElementById("filter-poli").addEventListener("change", renderScheduleRows);

    document.querySelector('.filter-pill[data-category="semua"]').addEventListener("click", function () {
      document.querySelectorAll("#service-category-filters .filter-pill").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      activeCategory = "semua";
      renderServices();
    });
  });
})(window, document);
