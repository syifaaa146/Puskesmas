/**
 * routes/complaintRoutes.js
 * -----------------------------------------------------------------------
 * POST /api/complaints -> kirim pengaduan masyarakat via email
 *                         (lampiran opsional, field "lampiran")
 * -----------------------------------------------------------------------
 */
const express = require("express");
const { createComplaint } = require("../controllers/complaintController");
const { attachmentUpload } = require("../middleware/uploadMiddleware");
const { writeLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// attachmentUpload aman dipanggil meski request berupa JSON biasa
// (tanpa lampiran) — Multer akan melewatinya jika content-type bukan
// multipart/form-data.
router.post("/", writeLimiter, attachmentUpload, createComplaint);

module.exports = router;
