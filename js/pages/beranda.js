/**
 * pages/beranda.js
 * -----------------------------------------------------------------------
 * Logika khusus halaman Beranda:
 *  - Informasi & Berita         -> database, dikelola via halaman admin "Kelola Konten"
 *  - Agenda / Kegiatan Mendatang -> database, dikelola via halaman admin "Kelola Konten"
 *  - Grafik Data Kesehatan       -> backend (dinamis dari hasil upload Excel)
 *  - Persentase Kepuasan         -> backend (dihitung dari data survei)
 * -----------------------------------------------------------------------
 */
(function (window, document) {
  "use strict";

  const { escapeHtml, formatDate, setMessage } = window.AppUtils;

  /* --------------------------- Informasi & Berita --------------------------- */
  function renderNewsCard(item) {
    return `
      <div class="col-md-4">
        <div class="card-soft">
          <span class="card-tag">${escapeHtml(item.kategori || "Informasi")}</span>
          <h5 class="mb-1">${escapeHtml(item.judul)}</h5>
          <p class="text-muted small mb-2">${escapeHtml(formatDate(item.tanggal))}</p>
          <p class="mb-3">${escapeHtml(item.ringkasan || "")}</p>
        </div>
      </div>`;
  }

  function loadNews() {
    const container = document.getElementById("news-container");
    if (!container) return;
    const items = (window.SITE_CONTENT && window.SITE_CONTENT.news) || [];
    if (!items.length) {
      setMessage(container, "Belum ada informasi atau berita yang dipublikasikan.");
      return;
    }
    container.innerHTML = items.slice(0, 3).map(renderNewsCard).join("");
  }

  /* --------------------------- Agenda / Kegiatan --------------------------- */
  function renderAgendaItem(item) {
    return `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          <div class="timeline-date">${escapeHtml(formatDate(item.tanggal))}</div>
          <h6 class="mb-2">${escapeHtml(item.judul)}</h6>
          <p class="small mb-0">${escapeHtml(item.deskripsi || "")}</p>
          <div class="timeline-meta">
            ${item.jam ? `<span><i class="fa-regular fa-clock me-1"></i>${escapeHtml(item.jam)}</span>` : ""}
            ${item.lokasi ? `<span><i class="fa-solid fa-location-dot me-1"></i>${escapeHtml(item.lokasi)}</span>` : ""}
          </div>
        </div>
      </div>`;
  }

  function loadAgenda() {
    const container = document.getElementById("agenda-container");
    if (!container) return;
    const items = (window.SITE_CONTENT && window.SITE_CONTENT.agenda) || [];
    if (!items.length) {
      setMessage(container, "Belum ada agenda kegiatan yang dijadwalkan.");
      return;
    }
    container.innerHTML = items.map(renderAgendaItem).join("");
  }

  /* --------------------------- Grafik Data Kesehatan --------------------------- */
  async function loadVisitsChart() {
    const wrapper = document.getElementById("visits-chart-wrapper");
    const canvas = document.getElementById("visitsChart");
    try {
      const data = await window.ApiService.getPatientVisits();
      const labels = data.labels || [];
      const values = data.values || [];
      if (!labels.length) {
        setMessage(wrapper, "Data kesehatan belum dapat dimuat.");
        return;
      }
      window.ChartService.renderVisitsChart(canvas, { labels, values });
    } catch (err) {
      setMessage(wrapper, "Data kesehatan belum dapat dimuat.", true);
    }
  }

  async function loadDiseasesChart() {
    const wrapper = document.getElementById("diseases-chart-wrapper");
    const canvas = document.getElementById("diseasesChart");
    try {
      const data = await window.ApiService.getTopDiseases();
      const labels = data.labels || [];
      const values = data.values || [];
      if (!labels.length) {
        setMessage(wrapper, "Data kesehatan belum dapat dimuat.");
        return;
      }
      window.ChartService.renderDiseasesChart(canvas, { labels, values });
    } catch (err) {
      setMessage(wrapper, "Data kesehatan belum dapat dimuat.", true);
    }
  }

  /* --------------------------- Persentase Kepuasan Masyarakat --------------------------- */
  async function loadSatisfaction() {
    const heroValueEl = document.getElementById("hero-satisfaction-value");
    const ringEl = document.getElementById("satisfaction-ring");
    const ringValueEl = document.getElementById("satisfaction-ring-value");
    const percentTextEl = document.getElementById("satisfaction-percentage-text");
    const respondenTextEl = document.getElementById("satisfaction-responden-text");

    try {
      const data = await window.ApiService.getSatisfactionPercentage();
      const percentage = typeof data.percentage === "number" ? data.percentage : null;
      const total = typeof data.total_responses === "number" ? data.total_responses : 0;

      if (percentage === null || total === 0) {
        if (heroValueEl) heroValueEl.innerHTML = `<span class="fs-6 text-muted">Belum ada data survei</span>`;
        if (percentTextEl) percentTextEl.textContent = "Belum ada data survei";
        if (respondenTextEl) respondenTextEl.textContent = "";
        if (ringValueEl) ringValueEl.textContent = "-";
        return;
      }

      const pctRounded = Math.round(percentage * 10) / 10;
      if (heroValueEl) heroValueEl.innerHTML = `${pctRounded}%`;
      if (ringEl) ringEl.style.setProperty("--pct", pctRounded);
      if (ringValueEl) ringValueEl.textContent = `${pctRounded}%`;
      if (percentTextEl) percentTextEl.textContent = `${pctRounded}% Kepuasan Masyarakat`;
      if (respondenTextEl) respondenTextEl.textContent = `${total} Responden`;
    } catch (err) {
      if (heroValueEl) heroValueEl.innerHTML = `<span class="fs-6 text-muted">Data belum dapat dimuat</span>`;
      if (percentTextEl) percentTextEl.textContent = "Data kepuasan belum dapat dimuat.";
      if (respondenTextEl) respondenTextEl.textContent = "";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Informasi & Berita, Agenda -> tunggu window.SITE_CONTENT terisi dari server.
    window.SiteContentReady.then(loadNews);
    window.SiteContentReady.then(loadAgenda);
    // Grafik & kepuasan -> panggilan API sendiri, tidak perlu menunggu konten situs.
    loadVisitsChart();
    loadDiseasesChart();
    loadSatisfaction();
  });
})(window, document);
