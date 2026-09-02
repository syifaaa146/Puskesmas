/**
 * api/index.js
 * -----------------------------------------------------------------------
 * Entry point serverless untuk Vercel. Semua request ke /api/* akan
 * di-rewrite ke file ini (lihat vercel.json), lalu ditangani oleh
 * Express app yang sama persis dengan yang dipakai untuk development
 * lokal (api/_lib/app.js).
 *
 * File di dalam folder `_lib/` TIDAK dianggap sebagai endpoint terpisah
 * oleh Vercel (folder diawali underscore), jadi struktur backend asli
 * (controllers/services/routes/dst) tetap utuh sebagai satu Express app.
 * -----------------------------------------------------------------------
 */
require("dotenv").config();

const app = require("./_lib/app");

module.exports = app;
