/**
 * controllers/healthController.js
 * -----------------------------------------------------------------------
 * Menangani:
 *   POST /api/health/upload    -> upload & proses file Excel
 *   GET  /api/health/visits    -> data grafik tren kunjungan pasien
 *   GET  /api/health/diseases  -> data grafik penyakit terbanyak
 *   GET  /api/health/summary   -> ringkasan data kesehatan
 *   GET  /api/health/status    -> cek backend berjalan
 * -----------------------------------------------------------------------
 */
const healthService = require("../services/healthService");
const { processExcelBuffer } = require("../utils/excelProcessor");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");

const VALID_JENIS_DATA = ["kunjungan_pasien", "penyakit_terbanyak", "lainnya"];

const uploadHealthData = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError("File Excel wajib diunggah.", 400);
  }

  const jenisData = req.body.jenis_data;
  if (!VALID_JENIS_DATA.includes(jenisData)) {
    throw new ApiError(
      `Jenis data tidak valid. Pilihan yang tersedia: ${VALID_JENIS_DATA.join(", ")}.`,
      400
    );
  }

  const { jenis, rows } = await processExcelBuffer(  req.file.buffer,  jenisData);
  
  let result;
  if (jenis === "kunjungan_pasien") {
    result = await healthService.saveKunjunganPasien(rows, req.file.originalname);
  } else if (jenis === "penyakit_terbanyak") {
    result = await healthService.savePenyakitTerbanyak(rows, req.file.originalname);
  } else {
    result = await healthService.saveGenericHealthData(rows, jenis, req.file.originalname);
  }

  return sendSuccess(res, {
    message: `Data berhasil diunggah dan diproses (${result.inserted} baris tersimpan).`,
    data: result,
    status: 201,
  });
});

const getVisits = asyncHandler(async (req, res) => {
  const data = await healthService.getVisitsChartData();
  return sendSuccess(res, { data });
});

const getDiseases = asyncHandler(async (req, res) => {
  const data = await healthService.getDiseasesChartData();
  return sendSuccess(res, { data });
});

const getSummary = asyncHandler(async (req, res) => {
  const data = await healthService.getHealthSummary();
  return sendSuccess(res, { data });
});

const getHealthStatus = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    data: { status: "ok", timestamp: new Date().toISOString() },
    message: "Layanan data kesehatan berjalan normal.",
  });
});

module.exports = { uploadHealthData, getVisits, getDiseases, getSummary, getHealthStatus };
