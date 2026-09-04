/**
 * routes/contentRoutes.js
 * -----------------------------------------------------------------------
 * GET    /api/content            -> seluruh konten situs (publik, dipakai
 *                                    Beranda/Profil/Layanan/Program)
 * GET    /api/content/:section   -> satu bagian konten (admin only)
 * PUT    /api/content/:section   -> simpan satu bagian konten (admin only)
 * -----------------------------------------------------------------------
 */
const express = require("express");
const { getAllContent, getSection, putSection } = require("../controllers/contentController");
const { requireAdmin } = require("../middleware/authMiddleware");
const { writeLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.get("/", getAllContent);
router.get("/:section", requireAdmin, getSection);
router.put("/:section", writeLimiter, requireAdmin, putSection);

module.exports = router;
