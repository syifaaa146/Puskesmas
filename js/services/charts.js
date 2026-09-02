/**
 * charts.js
 * -----------------------------------------------------------------------
 * Logika pembuatan grafik (Chart.js) untuk data kesehatan.
 * Semua data grafik WAJIB berasal dari backend (lihat services/api.js),
 * modul ini tidak boleh menyimpan data statistik secara hardcode.
 * -----------------------------------------------------------------------
 */
(function (window) {
  "use strict";

  const PRIMARY = "#1a915e";
  const PRIMARY_LIGHT = "rgba(26, 145, 94, 0.15)";
  const PRIMARY_DARK = "#0b6642";

  let visitsChartInstance = null;
  let diseasesChartInstance = null;

  /**
   * Render grafik tren kunjungan pasien (Line Chart).
   * @param {HTMLCanvasElement} canvas
   * @param {{labels: string[], values: number[]}} data
   */
  function renderVisitsChart(canvas, data) {
    if (!canvas || !window.Chart) return;
    if (visitsChartInstance) visitsChartInstance.destroy();

    visitsChartInstance = new Chart(canvas, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Jumlah Kunjungan Pasien",
            data: data.values,
            borderColor: PRIMARY,
            backgroundColor: PRIMARY_LIGHT,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: PRIMARY_DARK,
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: { beginAtZero: true, grid: { color: "#eef4f0" } },
          x: { grid: { display: false } },
        },
      },
    });
  }

  /**
   * Render grafik penyakit terbanyak (Bar Chart horizontal).
   * @param {HTMLCanvasElement} canvas
   * @param {{labels: string[], values: number[]}} data
   */
  function renderDiseasesChart(canvas, data) {
    if (!canvas || !window.Chart) return;
    if (diseasesChartInstance) diseasesChartInstance.destroy();

    diseasesChartInstance = new Chart(canvas, {
      type: "bar",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Jumlah Kasus",
            data: data.values,
            backgroundColor: PRIMARY,
            borderRadius: 6,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: { beginAtZero: true, grid: { color: "#eef4f0" } },
          y: { grid: { display: false } },
        },
      },
    });
  }

  window.ChartService = {
    renderVisitsChart,
    renderDiseasesChart,
  };
})(window);
