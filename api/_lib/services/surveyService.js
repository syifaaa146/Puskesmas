/**
 * services/surveyService.js
 * -----------------------------------------------------------------------
 * Logika bisnis untuk survei kepuasan masyarakat:
 *   - menyimpan hasil survei ke Turso (tabel survey_responses)
 *   - menghitung persentase kepuasan dari SELURUH data survei yang masuk
 *
 * Struktur jawaban disimpan sebagai TEXT berisi JSON (`answers`), bukan
 * kolom tetap question_1..question_n — supaya jumlah pertanyaan bisa
 * berubah di masa depan tanpa perlu migrasi skema database
 * (lihat sql/schema.sql).
 * -----------------------------------------------------------------------
 */
const crypto = require("node:crypto");
const db = require("../config/db");
const { ApiError } = require("../utils/apiResponse");

const TABLE = "survey_responses";
const SCALE_MAX = 5; // skala penilaian 1-5 sesuai form survei di frontend

/**
 * Simpan satu respons survei.
 * @param {object} payload - sudah divalidasi & disanitasi oleh controller
 */
async function saveSurveyResponse(payload) {
  const id = crypto.randomUUID();

  try {
    await db.execute({
      sql: `INSERT INTO ${TABLE}
              (id, name, age, service, visit_date, answers, suggestion, liked_aspect)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        payload.nama,
        payload.usia,
        payload.layanan,
        payload.tanggal_kunjungan,
        JSON.stringify(payload.penilaian), // { q1: 5, q2: 4, ... }
        payload.saran,
        payload.hal_disukai,
      ],
    });
  } catch (error) {
    throw new ApiError("Gagal menyimpan survei ke database.", 500, error.message);
  }

  return { id };
}

/**
 * Hitung persentase kepuasan masyarakat berdasarkan SELURUH jawaban
 * survei yang tersimpan.
 *
 * Rumus (skala 1-5, jumlah pertanyaan per responden bisa berbeda-beda —
 * dihitung otomatis dari jumlah jawaban yang benar-benar terisi):
 *
 *   skor_maksimum = total_jawaban_terisi * SCALE_MAX
 *   skor_aktual   = jumlah seluruh nilai jawaban
 *   persentase    = (skor_aktual / skor_maksimum) * 100
 */
async function calculateSatisfaction() {
  let result;
  try {
    result = await db.execute(`SELECT answers FROM ${TABLE}`);
  } catch (error) {
    throw new ApiError("Gagal mengambil data survei dari database.", 500, error.message);
  }

  const rows = result.rows;
  const totalResponses = rows.length;

  if (totalResponses === 0) {
    return { percentage: null, total_responses: 0 };
  }

  let totalScore = 0;
  let totalAnswered = 0;

  rows.forEach((row) => {
    let answers = {};
    try {
      answers = row.answers ? JSON.parse(row.answers) : {};
    } catch (err) {
      answers = {};
    }
    Object.values(answers).forEach((value) => {
      const num = Number(value);
      if (Number.isFinite(num) && num >= 1 && num <= SCALE_MAX) {
        totalScore += num;
        totalAnswered += 1;
      }
    });
  });

  if (totalAnswered === 0) {
    return { percentage: null, total_responses: totalResponses };
  }

  const maxScore = totalAnswered * SCALE_MAX;
  const percentage = Math.round((totalScore / maxScore) * 1000) / 10; // 1 desimal

  return { percentage, total_responses: totalResponses };
}

module.exports = { saveSurveyResponse, calculateSatisfaction };
