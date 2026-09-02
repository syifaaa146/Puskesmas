/**
 * services/authService.js
 * -----------------------------------------------------------------------
 * Autentikasi admin sederhana (single-admin, tanpa tabel user di
 * database) — cukup untuk kebutuhan "hanya admin yang boleh input data
 * kesehatan". Kredensial admin disimpan di environment variable:
 *   ADMIN_USERNAME       (teks biasa)
 *   ADMIN_PASSWORD_HASH  (hash bcrypt, dibuat lewat utils/hashPassword.js)
 *
 * Jika kebutuhan berkembang (banyak admin, role berbeda, dsb), ganti
 * implementasi ini dengan tabel `admins` di Supabase tanpa mengubah
 * controller/route yang memanggilnya.
 * -----------------------------------------------------------------------
 */
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/apiResponse");

function assertAuthConfigured() {
  const { JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD_HASH } = process.env;
  if (!JWT_SECRET || !ADMIN_USERNAME || !ADMIN_PASSWORD_HASH) {
    throw new ApiError(
      "Konfigurasi autentikasi admin belum lengkap di server. Hubungi administrator.",
      500
    );
  }
}

/**
 * Verifikasi username/password admin, kembalikan JWT jika valid.
 * @throws {ApiError} 401 jika username/password salah
 */
async function login(username, password) {
  assertAuthConfigured();

  const { JWT_SECRET, JWT_EXPIRES_IN, ADMIN_USERNAME, ADMIN_PASSWORD_HASH } = process.env;

  // Bandingkan username dengan waktu-konstan sederhana (hindari kebocoran
  // info lewat timing yang jelas berbeda antara "user salah" vs "password salah").
  const isUsernameValid = username === ADMIN_USERNAME;
  const isPasswordValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

  if (!isUsernameValid || !isPasswordValid) {
    throw new ApiError("Username atau password salah.", 401);
  }

  const token = jwt.sign({ sub: "admin", username: ADMIN_USERNAME, role: "admin" }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN || "8h",
  });

  return { token, username: ADMIN_USERNAME, role: "admin" };
}

/**
 * Verifikasi token JWT, kembalikan payload jika valid.
 * @throws {ApiError} 401 jika token tidak ada/tidak valid/kedaluwarsa
 */
function verifyToken(token) {
  const { JWT_SECRET } = process.env;
  if (!JWT_SECRET) {
    throw new ApiError("Konfigurasi autentikasi belum lengkap di server.", 500);
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError("Sesi login telah berakhir. Silakan login kembali.", 401);
    }
    throw new ApiError("Token autentikasi tidak valid.", 401);
  }
}

module.exports = { login, verifyToken };
