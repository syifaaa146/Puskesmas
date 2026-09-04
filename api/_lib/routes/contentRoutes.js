/**
 * routes/contentRoutes.js
 * -----------------------------------------------------------------------
 * GET    /api/content            -> seluruh konten situs (publik, dipakai
 *                                    Beranda/Profil/Layanan/Program)
 * GET    /api/content/:section   -> satu bagian konten (admin only)
 * PUT    /api/content/:section   -> simpan satu bagian konten (admin only)
 * POST   /api/content/files      -> unggah file PDF (admin only)
 * GET    /api/content/files/:id  -> sajikan file yang sudah diunggah (publik)
 * -----------------------------------------------------------------------
 */
const express = require("express");
const {
  getAllContent, getSection, putSection, uploadContentFile, getContentFile,
} = require("../controllers/contentController");
const { requireAdmin } = require("../middleware/authMiddleware");
const { writeLimiter } = require("../middleware/rateLimiter");
const { documentUpload } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", getAllContent);
router.post("/files", writeLimiter, requireAdmin, documentUpload, uploadContentFile);
router.get("/files/:id", getContentFile);
router.get("/:section", requireAdmin, getSection);
router.put("/:section", writeLimiter, requireAdmin, putSection);

module.exports = router;
