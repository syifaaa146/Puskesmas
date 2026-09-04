/**
 * controllers/contentController.js
 * -----------------------------------------------------------------------
 * GET    /api/content            -> seluruh konten situs (publik)
 * GET    /api/content/:section   -> satu bagian konten (admin, untuk form edit)
 * PUT    /api/content/:section   -> simpan satu bagian konten (admin)
 * -----------------------------------------------------------------------
 */
const contentService = require("../services/contentService");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");

// Section yang isinya berupa DAFTAR (array) vs OBJEK tunggal — dipakai
// untuk validasi bentuk data sebelum disimpan, supaya halaman publik
// tidak crash gara-gara admin tidak sengaja mengirim bentuk yang salah.
const ARRAY_SECTIONS = ["news", "agenda", "programs"];
const OBJECT_SECTIONS = ["profile", "layanan"];

const getAllContent = asyncHandler(async (req, res) => {
  const data = await contentService.getAllContent();
  return sendSuccess(res, { data });
});

const getSection = asyncHandler(async (req, res) => {
  const { section } = req.params;
  const data = await contentService.getSection(section);
  return sendSuccess(res, { data });
});

const putSection = asyncHandler(async (req, res) => {
  const { section } = req.params;
  const content = req.body;

  if (ARRAY_SECTIONS.includes(section) && !Array.isArray(content)) {
    throw new ApiError(`Bagian "${section}" harus berupa daftar (array).`, 400);
  }
  if (OBJECT_SECTIONS.includes(section) && (typeof content !== "object" || Array.isArray(content) || content === null)) {
    throw new ApiError(`Bagian "${section}" harus berupa objek.`, 400);
  }

  const result = await contentService.setSection(section, content);
  return sendSuccess(res, { message: "Konten berhasil disimpan.", data: result });
});

module.exports = { getAllContent, getSection, putSection };
