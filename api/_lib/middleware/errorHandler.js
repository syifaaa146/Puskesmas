/**
 * middleware/errorHandler.js
 * -----------------------------------------------------------------------
 * Middleware error-handling terpusat (4 argumen, khas Express).
 * Semua controller melempar ApiError (atau error biasa) lewat next(err)
 * atau asyncHandler — middleware ini yang bertanggung jawab mengubahnya
 * menjadi response JSON yang konsisten dan TIDAK membocorkan detail
 * internal server (stack trace, query, dsb) ke client.
 * -----------------------------------------------------------------------
 */
const { ApiError } = require("../utils/apiResponse");

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isApiError = err instanceof ApiError;
  const status = isApiError ? err.status : 500;
  const message = isApiError ? err.message : "Terjadi kesalahan pada server.";

  if (!isApiError) {
    // Error tak terduga: catat detail lengkap di log server saja.
    // eslint-disable-next-line no-console
    console.error("[UNHANDLED ERROR]", err);
  }

  const body = { success: false, message };
  if (isApiError && err.details !== undefined) {
    body.details = err.details;
  }
  if (process.env.NODE_ENV === "development" && !isApiError) {
    body.debug = err.message;
  }

  res.status(status).json(body);
}

/** Middleware untuk rute yang tidak ditemukan (404). */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`,
  });
}

module.exports = { errorHandler, notFoundHandler };
