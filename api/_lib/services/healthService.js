/**
 * services/healthService.js
 * -----------------------------------------------------------------------
 * Logika bisnis untuk data kesehatan:
 *   - menyimpan hasil olahan Excel ke Turso (health_visits /
 *     health_diseases / health_data, tergantung jenis data)
 *   - menyediakan data agregasi untuk grafik (GET /api/health/visits,
 *     /api/health/diseases) dan ringkasan (GET /api/health/summary)
 *
 * Agregasi dilakukan di sisi Node (bukan SQL view) demi kesederhanaan —
 * cukup untuk skala data Puskesmas. Jika volume data sudah besar,
 * pertimbangkan memindahkan agregasi ke query SQL agregat langsung.
 * -----------------------------------------------------------------------
 */
const db = require("../config/db");
const { ApiError } = require("../utils/apiResponse");

const TABLE_VISITS = "health_visits";
const TABLE_DISEASES = "health_diseases";
const TABLE_GENERIC = "health_data";

const BULAN_INDONESIA = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** Ambil "yyyy-mm" dari "yyyy-mm-dd" — dipakai sebagai kunci pengelompokan per bulan. */
function toMonthKey(isoDate) {
  return isoDate.slice(0, 7); // "yyyy-mm"
}

/** Ubah "yyyy-mm" menjadi label "Nama Bulan yyyy", contoh "Januari 2026". */
function formatMonthLabel(monthKey) {
  const [y, m] = monthKey.split("-");
  return `${BULAN_INDONESIA[Number(m) - 1]} ${y}`;
}

/* ------------------------------------------------------------------- */
/* Penyimpanan hasil olahan Excel                                       */
/* ------------------------------------------------------------------- */

async function saveKunjunganPasien(rows, sourceFile) {
  const statements = rows.map((r) => ({
    sql: `INSERT INTO ${TABLE_VISITS} (tanggal, poli, jumlah_kunjungan, source_file) VALUES (?, ?, ?, ?)`,
    args: [r.tanggal, r.poli, r.jumlah_kunjungan, sourceFile],
  }));

  try {
    await db.batch(statements, "write");
  } catch (error) {
    throw new ApiError("Gagal menyimpan data kunjungan pasien ke database.", 500, error.message);
  }
  return { inserted: rows.length };
}

async function savePenyakitTerbanyak(rows, sourceFile) {
  const statements = rows.map((r) => ({
    sql: `INSERT INTO ${TABLE_DISEASES} (nama_penyakit, jumlah_kasus, periode, source_file) VALUES (?, ?, ?, ?)`,
    args: [r.nama_penyakit, r.jumlah_kasus, r.periode, sourceFile],
  }));

  try {
    await db.batch(statements, "write");
  } catch (error) {
    throw new ApiError("Gagal menyimpan data penyakit terbanyak ke database.", 500, error.message);
  }
  return { inserted: rows.length };
}

async function saveGenericHealthData(rows, jenisData, sourceFile) {
  const statements = rows.map((r) => ({
    sql: `INSERT INTO ${TABLE_GENERIC} (jenis_data, row_data, source_file) VALUES (?, ?, ?)`,
    args: [jenisData, JSON.stringify(r.data), sourceFile],
  }));

  try {
    await db.batch(statements, "write");
  } catch (error) {
    throw new ApiError("Gagal menyimpan data kesehatan ke database.", 500, error.message);
  }
  return { inserted: rows.length };
}

/* ------------------------------------------------------------------- */
/* Data untuk grafik (Beranda)                                          */
/* ------------------------------------------------------------------- */

/** GET /api/health/visits -> { labels: [Nama Bulan yyyy...], values: [...] } */
async function getVisitsChartData() {
  let result;
  try {
    result = await db.execute(
      `SELECT tanggal, jumlah_kunjungan FROM ${TABLE_VISITS} ORDER BY tanggal ASC`
    );
  } catch (error) {
    throw new ApiError("Gagal mengambil data kunjungan pasien.", 500, error.message);
  }

  const data = result.rows;

  if (!data.length) {
    return { labels: [], values: [] };
  }

  // Jumlahkan seluruh kunjungan (semua poli, semua tanggal) dalam bulan yang sama
  // agar grafik menampilkan tren bulanan, bukan tanggal per tanggal.
  const totalsByMonth = new Map();
  data.forEach((row) => {
    const monthKey = toMonthKey(row.tanggal);
    const current = totalsByMonth.get(monthKey) || 0;
    totalsByMonth.set(monthKey, current + (Number(row.jumlah_kunjungan) || 0));
  });

  const sortedMonths = [...totalsByMonth.keys()].sort();
  return {
    labels: sortedMonths.map(formatMonthLabel),
    values: sortedMonths.map((m) => totalsByMonth.get(m)),
  };
}

/** GET /api/health/diseases -> { labels: [...], values: [...] } (top 10) */
async function getDiseasesChartData() {
  let result;
  try {
    result = await db.execute(
      `SELECT nama_penyakit, jumlah_kasus FROM ${TABLE_DISEASES}`
    );
  } catch (error) {
    throw new ApiError("Gagal mengambil data penyakit terbanyak.", 500, error.message);
  }

  const data = result.rows;

  if (!data.length) {
    return { labels: [], values: [] };
  }

  const totalsByDisease = new Map();
  data.forEach((row) => {
    const current = totalsByDisease.get(row.nama_penyakit) || 0;
    totalsByDisease.set(row.nama_penyakit, current + (Number(row.jumlah_kasus) || 0));
  });

  const sorted = [...totalsByDisease.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return {
    labels: sorted.map(([name]) => name),
    values: sorted.map(([, total]) => total),
  };
}

/** GET /api/health/summary -> ringkasan umum data kesehatan. */
async function getHealthSummary() {
  let visitsResult;
  let diseasesResult;

  try {
    [visitsResult, diseasesResult] = await Promise.all([
      db.execute(`SELECT tanggal, jumlah_kunjungan FROM ${TABLE_VISITS}`),
      db.execute(`SELECT nama_penyakit, jumlah_kasus FROM ${TABLE_DISEASES}`),
    ]);
  } catch (error) {
    throw new ApiError("Gagal mengambil ringkasan data kesehatan.", 500, error.message);
  }

  const visits = visitsResult.rows;
  const diseases = diseasesResult.rows;

  const totalVisits = visits.reduce((sum, row) => sum + (Number(row.jumlah_kunjungan) || 0), 0);

  let topDisease = null;
  if (diseases.length) {
    const totalsByDisease = new Map();
    diseases.forEach((row) => {
      const current = totalsByDisease.get(row.nama_penyakit) || 0;
      totalsByDisease.set(row.nama_penyakit, current + (Number(row.jumlah_kasus) || 0));
    });
    topDisease = [...totalsByDisease.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  let period = null;
  if (visits.length) {
    const latestDate = visits.map((v) => v.tanggal).sort().slice(-1)[0];
    const [y, m] = latestDate.split("-");
    period = `${BULAN_INDONESIA[Number(m) - 1]} ${y}`;
  }

  return {
    total_visits: totalVisits,
    top_disease: topDisease,
    period,
  };
}

module.exports = {
  saveKunjunganPasien,
  savePenyakitTerbanyak,
  saveGenericHealthData,
  getVisitsChartData,
  getDiseasesChartData,
  getHealthSummary,
};
