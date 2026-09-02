/**
 * controllers/surveyController.js
 * -----------------------------------------------------------------------
 * Menangani:
 *   POST /api/survey                -> simpan hasil survei
 *   GET  /api/survey/satisfaction   -> persentase kepuasan masyarakat
 *
 * Field body yang diterima (sesuai payload dari frontend js/pages/survei.js):
 *   nama (opsional), usia (opsional), tanggal_kunjungan (wajib),
 *   layanan (wajib), penilaian (wajib, object {q1..qN: 1-5}),
 *   saran (opsional), hal_disukai (opsional)
 * -----------------------------------------------------------------------
 */
const surveyService = require("../services/surveyService");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");
const { sanitizeText, isNumberInRange, ValidationResult } = require("../utils/validators");

const SCALE_MIN = 1;
const SCALE_MAX = 5;

function validateSurveyPayload(body) {
  const result = new ValidationResult();

  result.check(
    typeof body.tanggal_kunjungan === "string" && body.tanggal_kunjungan.trim().length > 0,
    "Tanggal kunjungan wajib diisi."
  );
  result.check(
    typeof body.layanan === "string" && body.layanan.trim().length > 0,
    "Jenis layanan wajib diisi."
  );

  const penilaian = body.penilaian;
  const isPlainObject =
    penilaian && typeof penilaian === "object" && !Array.isArray(penilaian);
  result.check(isPlainObject, "Penilaian kepuasan wajib diisi.");

  if (isPlainObject) {
    const values = Object.values(penilaian);
    result.check(values.length > 0, "Penilaian kepuasan wajib diisi.");
    const allValid = values.every((v) => isNumberInRange(v, SCALE_MIN, SCALE_MAX));
    result.check(allValid, `Setiap nilai penilaian harus berupa angka ${SCALE_MIN}-${SCALE_MAX}.`);
  }

  if (body.usia !== undefined && body.usia !== null && body.usia !== "") {
    result.check(isNumberInRange(body.usia, 0, 120), "Usia harus berupa angka yang wajar (0-120).");
  }

  return result;
}

const createSurvey = asyncHandler(async (req, res) => {
  const body = req.body || {};

  const validation = validateSurveyPayload(body);
  if (!validation.isValid) {
    throw new ApiError(validation.firstError, 400, validation.errors);
  }

  // Bersihkan jawaban penilaian menjadi angka bulat murni.
  const cleanedPenilaian = {};
  Object.entries(body.penilaian).forEach(([key, value]) => {
    cleanedPenilaian[sanitizeText(key)] = Number(value);
  });

  const payload = {
    nama: body.nama ? sanitizeText(body.nama).slice(0, 100) : null,
    usia: body.usia ? Math.round(Number(body.usia)) : null,
    tanggal_kunjungan: body.tanggal_kunjungan,
    layanan: sanitizeText(body.layanan).slice(0, 150),
    penilaian: cleanedPenilaian,
    saran: body.saran ? sanitizeText(body.saran).slice(0, 500) : null,
    hal_disukai: body.hal_disukai ? sanitizeText(body.hal_disukai).slice(0, 500) : null,
  };

  await surveyService.saveSurveyResponse(payload);

  return sendSuccess(res, { message: "Survei berhasil disimpan", status: 201 });
});

const getSatisfaction = asyncHandler(async (req, res) => {
  const result = await surveyService.calculateSatisfaction();
  return sendSuccess(res, { data: result });
});

module.exports = { createSurvey, getSatisfaction };
