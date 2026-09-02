/**
 * middleware/authMiddleware.js
 * -----------------------------------------------------------------------
 * Middleware untuk melindungi endpoint yang hanya boleh diakses admin
 * yang sudah login (contoh: POST /api/health/upload).
 *
 * Mengharapkan header:
 *   Authorization: Bearer <token>
 * -----------------------------------------------------------------------
 */
const authService = require("../services/authService");
const { ApiError } = require("../utils/apiResponse");

function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new ApiError("Anda harus login sebagai admin untuk mengakses fitur ini.", 401);
    }

    const payload = authService.verifyToken(token);
    req.admin = payload; // tersedia untuk controller berikutnya jika diperlukan
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAdmin };
