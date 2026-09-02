/**
 * controllers/complaintController.js
 * -----------------------------------------------------------------------
 * Menangani POST /api/complaints.
 * Pengaduan TIDAK disimpan ke Supabase — backend memvalidasi lalu
 * meneruskannya sebagai email ke alamat tujuan Puskesmas (MAIL_TO)
 * menggunakan services/emailService.js.
 *
 * Field body yang diterima (sesuai payload dari frontend
 * js/pages/pengaduan.js): nama, email, no_hp, kategori, subjek, isi,
 * dan lampiran opsional (multipart, field "lampiran").
 * -----------------------------------------------------------------------
 */
const emailService = require("../services/emailService");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");
const {
  isValidEmail,
  isValidPhone,
  isLengthWithin,
  sanitizeText,
  ValidationResult,
} = require("../utils/validators");

const MAX_ISI_LENGTH = 2000;

function validateComplaintPayload(body) {
  const result = new ValidationResult();

  result.check(
    typeof body.nama === "string" && body.nama.trim().length >= 3,
    "Nama lengkap wajib diisi (minimal 3 karakter)."
  );
  result.check(isValidEmail(body.email), "Alamat email tidak valid.");
  result.check(isValidPhone(body.no_hp), "Nomor HP/WhatsApp tidak valid.");
  result.check(
    typeof body.kategori === "string" && body.kategori.trim().length > 0,
    "Kategori pengaduan wajib dipilih."
  );
  result.check(
    typeof body.subjek === "string" && body.subjek.trim().length >= 3,
    "Subjek pengaduan wajib diisi (minimal 3 karakter)."
  );
  result.check(
    typeof body.isi === "string" && isLengthWithin(body.isi, 20, MAX_ISI_LENGTH),
    `Isi pengaduan wajib diisi (20-${MAX_ISI_LENGTH} karakter).`
  );

  return result;
}

const createComplaint = asyncHandler(async (req, res) => {
  const body = req.body || {};

  const validation = validateComplaintPayload(body);
  if (!validation.isValid) {
    throw new ApiError(validation.firstError, 400, validation.errors);
  }

  const complaint = {
    nama: sanitizeText(body.nama).slice(0, 100),
    email: sanitizeText(body.email).slice(0, 150),
    no_hp: sanitizeText(body.no_hp).slice(0, 20),
    kategori: sanitizeText(body.kategori).slice(0, 50),
    subjek: sanitizeText(body.subjek).slice(0, 150),
    isi: sanitizeText(body.isi).slice(0, MAX_ISI_LENGTH),
  };

  const attachment = req.file
    ? {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
      }
    : null;

  await emailService.sendComplaintEmail(complaint, attachment);

  return sendSuccess(res, { message: "Pengaduan berhasil dikirim", status: 201 });
});

module.exports = { createComplaint };
