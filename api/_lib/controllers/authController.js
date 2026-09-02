/**
 * controllers/authController.js
 * -----------------------------------------------------------------------
 * POST /api/auth/login -> login admin, mengembalikan JWT.
 * -----------------------------------------------------------------------
 */
const authService = require("../services/authService");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");
const { isNonEmptyString } = require("../utils/validators");

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body || {};

  if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
    throw new ApiError("Username dan password wajib diisi.", 400);
  }

  const result = await authService.login(username.trim(), password);

  return sendSuccess(res, {
    message: "Login berhasil.",
    data: { token: result.token, username: result.username, role: result.role },
  });
});

module.exports = { login };
