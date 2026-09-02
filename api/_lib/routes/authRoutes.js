/**
 * routes/authRoutes.js
 * -----------------------------------------------------------------------
 * POST /api/auth/login -> login admin (dibatasi rate limit ketat untuk
 * mencegah brute-force menebak password).
 * -----------------------------------------------------------------------
 */
const express = require("express");
const { login } = require("../controllers/authController");
const rateLimit = require("express-rate-limit");

const router = express.Router();

/** Limiter ekstra ketat khusus login untuk mencegah brute-force. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.",
  },
});

router.post("/login", loginLimiter, login);

module.exports = router;
