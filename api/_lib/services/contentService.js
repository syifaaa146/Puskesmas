/**
 * services/contentService.js
 * -----------------------------------------------------------------------
 * Mengelola konten yang dulunya statis di data/content.js — sekarang
 * disimpan di tabel site_content (satu baris JSON per "bagian"), dan
 * diedit lewat halaman admin "Kelola Konten" (kelola-konten.html).
 *
 * Bagian yang tersedia (section_key): news, agenda, profile, layanan, programs.
 * Bentuk JSON tiap bagian PERSIS SAMA seperti field yang dulu ada di
 * window.SITE_CONTENT (data/content.js), supaya halaman publik (Beranda,
 * Profil, Layanan, Program) tidak perlu ditulis ulang logikanya — cuma
 * sumber datanya yang pindah dari file statis ke sini.
 * -----------------------------------------------------------------------
 */
const db = require("../config/db");
const { ApiError } = require("../utils/apiResponse");

const TABLE = "site_content";

const VALID_SECTIONS = ["news", "agenda", "profile", "layanan", "programs"];

// Struktur kosong default per section — dipakai kalau baris section belum
// ada di database sama sekali (misalnya sebelum seed pernah dijalankan),
// supaya halaman publik tetap menampilkan "Belum ada data ..." alih-alih error.
const EMPTY_DEFAULTS = {
  news: [],
  agenda: [],
  profile: {
    deskripsi: "", highlights: [], visi: "", misi: [],
    tata_nilai_judul: "", tata_nilai: [], akreditasi: [],
  },
  layanan: {
    services: [], clusters: [], alur_umum: [], persyaratan_umum: [], schedule: [],
  },
  programs: [],
};

function assertValidSection(section) {
  if (!VALID_SECTIONS.includes(section)) {
    throw new ApiError(
      `Bagian konten tidak valid. Pilihan yang tersedia: ${VALID_SECTIONS.join(", ")}.`,
      400
    );
  }
}

/** GET /api/content -> seluruh bagian sekaligus (dipakai halaman publik). */
async function getAllContent() {
  let result;
  try {
    result = await db.execute(`SELECT section_key, content_json FROM ${TABLE}`);
  } catch (error) {
    throw new ApiError("Gagal mengambil konten situs.", 500, error.message);
  }

  const combined = { ...EMPTY_DEFAULTS };
  result.rows.forEach((row) => {
    try {
      combined[row.section_key] = JSON.parse(row.content_json);
    } catch (err) {
      // Baris rusak/JSON tidak valid: biarkan default kosong untuk section itu
      // saja, jangan sampai satu baris rusak menjatuhkan seluruh halaman.
    }
  });
  return combined;
}

/** GET /api/content/:section -> satu bagian saja (dipakai form admin). */
async function getSection(section) {
  assertValidSection(section);

  let result;
  try {
    result = await db.execute({
      sql: `SELECT content_json FROM ${TABLE} WHERE section_key = ?`,
      args: [section],
    });
  } catch (error) {
    throw new ApiError("Gagal mengambil bagian konten.", 500, error.message);
  }

  if (!result.rows.length) {
    return EMPTY_DEFAULTS[section];
  }
  try {
    return JSON.parse(result.rows[0].content_json);
  } catch (err) {
    throw new ApiError("Data konten tersimpan dalam format yang rusak.", 500);
  }
}

/**
 * PUT /api/content/:section -> ganti seluruh isi satu bagian (admin only).
 * `content` sudah harus berupa objek/array JS valid (bukan string JSON)
 * — divalidasi bentuknya (array vs objek) sesuai section-nya di controller.
 */
async function setSection(section, content) {
  assertValidSection(section);

  const json = JSON.stringify(content);

  try {
    await db.execute({
      sql: `INSERT INTO ${TABLE} (section_key, content_json, updated_at)
            VALUES (?, ?, datetime('now'))
            ON CONFLICT(section_key) DO UPDATE SET
              content_json = excluded.content_json,
              updated_at = excluded.updated_at`,
      args: [section, json],
    });
  } catch (error) {
    throw new ApiError("Gagal menyimpan konten.", 500, error.message);
  }

  return { section, saved: true };
}

module.exports = { getAllContent, getSection, setSection, VALID_SECTIONS };
