/**
 * routes/statusRoutes.js
 * -----------------------------------------------------------------------
 * GET /api/status -> cek apakah backend berjalan
 * -----------------------------------------------------------------------
 */
const express = require("express");
const { getStatus } = require("../controllers/statusController");

const router = express.Router();

router.get("/", getStatus);

module.exports = router;
