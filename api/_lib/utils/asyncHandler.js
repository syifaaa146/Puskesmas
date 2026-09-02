/**
 * utils/asyncHandler.js
 * -----------------------------------------------------------------------
 * Membungkus fungsi controller async agar setiap error (termasuk
 * rejected promise) otomatis diteruskan ke next(err) -> errorHandler.js,
 * tanpa perlu menulis try/catch berulang di setiap controller.
 * -----------------------------------------------------------------------
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
