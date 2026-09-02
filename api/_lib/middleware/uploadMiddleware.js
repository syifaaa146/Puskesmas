/**
 * middleware/uploadMiddleware.js
 * -----------------------------------------------------------------------
 * Konfigurasi Multer untuk dua kebutuhan berbeda:
 *   1. excelUpload      — upload file Excel (.xlsx/.xls) di /api/health/upload
 *   2. attachmentUpload — upload lampiran bukti pengaduan (jpg/png/pdf)
 *                         di /api/complaints (opsional)
 *
 * Keduanya memakai memory storage (file tidak pernah ditulis ke disk),
 * karena:
 *   - File Excel hanya dibaca sekali lalu datanya disimpan ke Supabase,
 *     file mentahnya tidak perlu disimpan.
 *   - Lampiran pengaduan langsung dilampirkan ke email lalu dibuang.
 * -----------------------------------------------------------------------
 */
const multer = require("multer");
const { ApiError } = require("../utils/apiResponse");
const { hasAllowedExtension } = require("../utils/excelProcessor");

const MAX_EXCEL_SIZE_BYTES =
  Number(process.env.MAX_EXCEL_FILE_SIZE_MB || 10) * 1024 * 1024;
const MAX_ATTACHMENT_SIZE_BYTES =
  Number(process.env.MAX_ATTACHMENT_FILE_SIZE_MB || 5) * 1024 * 1024;

const EXCEL_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
];

const ATTACHMENT_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];

const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_EXCEL_SIZE_BYTES },
  fileFilter(req, file, cb) {
    const extensionOk = hasAllowedExtension(file.originalname);
    const mimeOk = EXCEL_MIME_TYPES.includes(file.mimetype);
    if (!extensionOk || !mimeOk) {
      return cb(
        new ApiError(
          "Format file tidak sesuai. Hanya file .xlsx yang diperbolehkan.",
          400
        )
      );
    }
    cb(null, true);
  },
}).single("file");

const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ATTACHMENT_SIZE_BYTES },
  fileFilter(req, file, cb) {
    if (!ATTACHMENT_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        new ApiError(
          "Format lampiran tidak didukung. Gunakan JPG, PNG, atau PDF.",
          400
        )
      );
    }
    cb(null, true);
  },
}).single("lampiran");

/**
 * Bungkus middleware Multer agar error (ukuran/format file) diteruskan
 * secara konsisten ke errorHandler.js, bukan bocor sebagai stack trace.
 */
function wrapMulter(multerMiddleware, maxSizeMb) {
  return function (req, res, next) {
    multerMiddleware(req, res, (err) => {
      if (!err) return next();

      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(
            new ApiError(`Ukuran file melebihi batas maksimum ${maxSizeMb}MB.`, 400)
          );
        }
        return next(new ApiError(`Gagal memproses file: ${err.message}`, 400));
      }

      return next(err);
    });
  };
}

module.exports = {
  excelUpload: wrapMulter(excelUpload, process.env.MAX_EXCEL_FILE_SIZE_MB || 10),
  attachmentUpload: wrapMulter(
    attachmentUpload,
    process.env.MAX_ATTACHMENT_FILE_SIZE_MB || 5
  ),
};
