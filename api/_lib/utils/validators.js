/**
 * utils/validators.js
 * -----------------------------------------------------------------------
 * Kumpulan fungsi validasi & sanitasi input yang dipakai lintas
 * controller. Tidak bergantung pada library eksternal supaya ringan.
 * -----------------------------------------------------------------------
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{8,20}$/;

/** True jika value adalah string non-kosong (setelah di-trim). */
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/** True jika format email valid secara umum. */
function isValidEmail(value) {
  return isNonEmptyString(value) && EMAIL_REGEX.test(value.trim());
}

/** True jika format nomor telepon/HP valid secara umum. */
function isValidPhone(value) {
  return isNonEmptyString(value) && PHONE_REGEX.test(value.trim());
}

/** True jika panjang string berada dalam rentang [min, max]. */
function isLengthWithin(value, min, max) {
  if (typeof value !== "string") return false;
  const len = value.trim().length;
  return len >= min && len <= max;
}

/** True jika value adalah angka finite di dalam rentang [min, max]. */
function isNumberInRange(value, min, max) {
  const num = Number(value);
  return Number.isFinite(num) && num >= min && num <= max;
}

/**
 * Hilangkan tag HTML/script dasar dan rapikan whitespace agar input teks
 * bebas lebih aman disimpan/ditampilkan. Ini bukan pengganti output
 * encoding di sisi presentasi, hanya lapisan pertahanan tambahan.
 */
function sanitizeText(value) {
  if (value === null || value === undefined) return null;
  return String(value)
    .replace(/<[^>]*>/g, "")
    .trim();
}

/** Bungkus beberapa hasil validasi menjadi satu daftar pesan error. */
class ValidationResult {
  constructor() {
    this.errors = [];
  }

  check(condition, message) {
    if (!condition) this.errors.push(message);
    return this;
  }

  get isValid() {
    return this.errors.length === 0;
  }

  get firstError() {
    return this.errors[0] || null;
  }
}

module.exports = {
  isNonEmptyString,
  isValidEmail,
  isValidPhone,
  isLengthWithin,
  isNumberInRange,
  sanitizeText,
  ValidationResult,
};
