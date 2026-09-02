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

/* ------------------------------------------------------------------- */
/* Kelola file yang pernah diunggah (lihat & hapus per sumber file)     */
/* ------------------------------------------------------------------- */

const KATEGORI_LABEL = {
  kunjungan_pasien: "Data Kunjungan Pasien",
  penyakit_terbanyak: "Data Penyakit Terbanyak",
};

/**
 * GET /api/health/sources
 * Mengelompokkan data yang tersimpan berdasarkan nama file Excel asal
 * upload-nya, supaya admin bisa melihat "batch" mana saja yang pernah
 * diunggah dan memilih salah satu untuk dihapus sebelum mengunggah data
 * pengganti.
 */
async function listUploadedSources() {
  let visitsResult;
  let diseasesResult;
  let genericResult;

  try {
    [visitsResult, diseasesResult, genericResult] = await Promise.all([
      db.execute(
        `SELECT source_file, COUNT(*) as jumlah_baris, MAX(created_at) as diunggah_pada
         FROM ${TABLE_VISITS} WHERE source_file IS NOT NULL GROUP BY source_file`
      ),
      db.execute(
        `SELECT source_file, COUNT(*) as jumlah_baris, MAX(created_at) as diunggah_pada
         FROM ${TABLE_DISEASES} WHERE source_file IS NOT NULL GROUP BY source_file`
      ),
      db.execute(
        `SELECT source_file, jenis_data, COUNT(*) as jumlah_baris, MAX(created_at) as diunggah_pada
         FROM ${TABLE_GENERIC} WHERE source_file IS NOT NULL GROUP BY source_file, jenis_data`
      ),
    ]);
  } catch (error) {
    throw new ApiError("Gagal mengambil daftar file yang pernah diunggah.", 500, error.message);
  }

  const items = [
    ...visitsResult.rows.map((r) => ({
      kategori: "kunjungan_pasien",
      kategori_label: KATEGORI_LABEL.kunjungan_pasien,
      jenis_data: null,
      source_file: r.source_file,
      jumlah_baris: Number(r.jumlah_baris),
      diunggah_pada: r.diunggah_pada,
    })),
    ...diseasesResult.rows.map((r) => ({
      kategori: "penyakit_terbanyak",
      kategori_label: KATEGORI_LABEL.penyakit_terbanyak,
      jenis_data: null,
      source_file: r.source_file,
      jumlah_baris: Number(r.jumlah_baris),
      diunggah_pada: r.diunggah_pada,
    })),
    ...genericResult.rows.map((r) => ({
      kategori: "lainnya",
      kategori_label: `Lainnya (${r.jenis_data})`,
      jenis_data: r.jenis_data,
      source_file: r.source_file,
      jumlah_baris: Number(r.jumlah_baris),
      diunggah_pada: r.diunggah_pada,
    })),
  ];

  // Terbaru diunggah tampil paling atas.
  items.sort((a, b) => (a.diunggah_pada < b.diunggah_pada ? 1 : -1));

  return items;
}

/**
 * DELETE /api/health/sources
 * Menghapus seluruh baris yang berasal dari satu file/kategori tertentu.
 * @param {{kategori: string, sourceFile: string, jenisData?: string}} params
 */
async function deleteBySource({ kategori, sourceFile, jenisData }) {
  if (!sourceFile) {
    throw new ApiError("Nama file sumber wajib diisi.", 400);
  }

  let sql;
  let args;

  if (kategori === "kunjungan_pasien") {
    sql = `DELETE FROM ${TABLE_VISITS} WHERE source_file = ?`;
    args = [sourceFile];
  } else if (kategori === "penyakit_terbanyak") {
    sql = `DELETE FROM ${TABLE_DISEASES} WHERE source_file = ?`;
    args = [sourceFile];
  } else if (kategori === "lainnya") {
    if (!jenisData) {
      throw new ApiError("jenis_data wajib diisi untuk kategori \"lainnya\".", 400);
    }
    sql = `DELETE FROM ${TABLE_GENERIC} WHERE source_file = ? AND jenis_data = ?`;
    args = [sourceFile, jenisData];
  } else {
    throw new ApiError("Kategori tidak valid.", 400);
  }

  let result;
  try {
    result = await db.execute({ sql, args });
  } catch (error) {
    throw new ApiError("Gagal menghapus data.", 500, error.message);
  }

  const deletedCount = typeof result.rowsAffected === "number" ? result.rowsAffected : 0;

  if (deletedCount === 0) {
    throw new ApiError("Data dengan sumber file tersebut tidak ditemukan (mungkin sudah terhapus).", 404);
  }

  return { deleted: deletedCount };
}

module.exports = {
  saveKunjunganPasien,
  savePenyakitTerbanyak,
  saveGenericHealthData,
  getVisitsChartData,
  getDiseasesChartData,
  getHealthSummary,
  listUploadedSources,
  deleteBySource,
};
