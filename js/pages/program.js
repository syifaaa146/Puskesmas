/**
 * pages/program.js
 * -----------------------------------------------------------------------
 * Menampilkan daftar program kesehatan Puskesmas dari data statis
 * (data/content.js, bagian `programs`), dengan pencarian dan filter
 * kategori di sisi frontend. Edit konten langsung di file itu, tidak
 * perlu backend/database untuk bagian ini.
 * -----------------------------------------------------------------------
 */
(function (window, document) {
  "use strict";

  const { escapeHtml, setMessage } = window.AppUtils;

  let allPrograms = [];
  let activeCategory = "semua";
  let searchTerm = "";

  function renderProgramCard(item) {
    return `
      <div class="col-md-4">
        <div class="card-soft">
          ${item.kategori ? `<span class="card-tag">${escapeHtml(item.kategori)}</span>` : ""}
          <h5>${escapeHtml(item.nama)}</h5>
          <p class="text-muted small">${escapeHtml(item.deskripsi || "")}</p>
          <hr>
          <div class="service-meta mb-0">
            ${item.sasaran ? `<span><i class="fa-solid fa-users me-1"></i>${escapeHtml(item.sasaran)}</span>` : ""}
            ${item.jadwal ? `<span><i class="fa-regular fa-calendar me-1"></i>${escapeHtml(item.jadwal)}</span>` : ""}
            ${item.lokasi ? `<span><i class="fa-solid fa-location-dot me-1"></i>${escapeHtml(item.lokasi)}</span>` : ""}
            ${item.petugas ? `<span><i class="fa-solid fa-user-nurse me-1"></i>${escapeHtml(item.petugas)}</span>` : ""}
          </div>
        </div>
      </div>`;
  }

  function renderPrograms() {
    const container = document.getElementById("programs-container");
    const filtered = allPrograms.filter((item) => {
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
      setMessage(container, "Tidak ada program yang sesuai dengan pencarian/filter Anda.");
      return;
    }
    container.innerHTML = filtered.map(renderProgramCard).join("");
  }

  function renderCategoryFilters(categories) {
    const container = document.getElementById("program-category-filters");
    if (!categories.length) return;
    container.innerHTML = categories
      .map((cat) => `<button class="filter-pill" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`)
      .join("");
    container.querySelectorAll(".filter-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-bar .filter-pill").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeCategory = btn.dataset.category;
        renderPrograms();
      });
    });
  }

  function loadPrograms() {
    const container = document.getElementById("programs-container");
    const items = (window.SITE_CONTENT && window.SITE_CONTENT.programs) || [];
    allPrograms = items;

    if (!items.length) {
      setMessage(container, "Belum ada program yang dipublikasikan.");
      return;
    }

    const categories = [...new Set(items.map((i) => i.kategori).filter(Boolean))];
    renderCategoryFilters(categories);
    renderPrograms();
  }

  document.addEventListener("DOMContentLoaded", function () {
    loadPrograms();

    document.getElementById("program-search").addEventListener("input", (e) => {
      searchTerm = e.target.value.trim().toLowerCase();
      renderPrograms();
    });

    document.querySelector('.filter-bar .filter-pill[data-category="semua"]').addEventListener("click", function () {
      document.querySelectorAll(".filter-bar .filter-pill").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      activeCategory = "semua";
      renderPrograms();
    });
  });
})(window, document);
