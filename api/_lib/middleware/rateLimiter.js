/**
 * middleware/rateLimiter.js
 * -----------------------------------------------------------------------
 * Pembatasan jumlah request untuk mencegah penyalahgunaan/spam,
 * khususnya pada endpoint yang menulis data (survei, pengaduan, upload).
 * -----------------------------------------------------------------------
 */
const rateLimit = require("express-rate-limit");

/** Limiter umum untuk seluruh API (dipasang secara global). */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Terlalu banyak permintaan dari alamat ini. Silakan coba lagi nanti.",
  },
});

/** Limiter lebih ketat untuk endpoint yang menulis data / mengirim email. */
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Terlalu banyak permintaan. Silakan coba lagi dalam beberapa menit.",
  },
});

module.exports = { generalLimiter, writeLimiter };
