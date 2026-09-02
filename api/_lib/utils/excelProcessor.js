/**
 * utils/excelProcessor.js
 * -----------------------------------------------------------------------
 * Membaca file Excel (.xlsx/.xls) dan mengubahnya menjadi data terstruktur.
 *
 * Jenis data:
 *   - kunjungan_pasien
 *   - penyakit_terbanyak
 *   - lainnya
 * -----------------------------------------------------------------------
 */

const ExcelJS = require("exceljs");
const { ApiError } = require("./apiResponse");

const ALLOWED_EXTENSIONS = [".xlsx"];

/**
 * Normalisasi nama kolom:
 * lowercase, trim, spasi/underscore/dash disamakan.
 */
function normalizeHeader(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[\s._-]+/g, "_");
}

/**
 * Alias nama kolom yang diterima.
 */
const COLUMN_ALIASES = {
  kunjungan_pasien: {
    tanggal: ["tanggal", "date", "tgl", "tanggal_kunjungan"],
    poli: ["poli", "layanan", "poli_layanan", "unit_layanan"],
    jumlah_kunjungan: [
      "jumlah_kunjungan",
      "jumlah_pasien",
      "jumlah",
      "kunjungan",
      "total_kunjungan",
    ],
  },

  penyakit_terbanyak: {
    nama_penyakit: [
      "nama_penyakit",
      "penyakit",
      "diagnosis",
      "nama_diagnosis",
      "jenis_penyakit",
    ],
    jumlah_kasus: [
      "jumlah_kasus",
      "jumlah",
      "kasus",
      "total_kasus",
    ],
    periode: ["periode", "bulan", "period"],
  },
};

/**
 * Mencari mapping nama kolom Excel.
 */
function resolveColumnMapping(originalHeaders, aliasesConfig) {
  const normalizedToOriginal = {};

  originalHeaders.forEach((h) => {
    normalizedToOriginal[normalizeHeader(h)] = h;
  });

  const mapping = {};
  const missing = [];

  Object.entries(aliasesConfig).forEach(([fieldKey, aliases]) => {
    const found = aliases.find(
      (alias) => normalizedToOriginal[normalizeHeader(alias)] !== undefined
    );

    if (found) {
      mapping[fieldKey] =
        normalizedToOriginal[normalizeHeader(found)];
    } else {
      missing.push(fieldKey);
    }
  });

  return { mapping, missing };
}

/**
 * Mengubah tanggal Excel menjadi yyyy-mm-dd.
 */
function parseExcelDate(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  // Jika sudah Date
  if (value instanceof Date && !isNaN(value.getTime())) {
    return toIsoDate(value);
  }

  // Jika ExcelJS memberikan object rich date/value
  if (typeof value === "object") {
    if (value instanceof Date && !isNaN(value.getTime())) {
      return toIsoDate(value);
    }

    if (value.result instanceof Date && !isNaN(value.result.getTime())) {
      return toIsoDate(value.result);
    }

    if (value.text) {
      return parseExcelDate(value.text);
    }

    if (value.result !== undefined) {
      return parseExcelDate(value.result);
    }
  }

  // Jika angka
  if (typeof value === "number" && Number.isFinite(value)) {
    // Excel serial date.
    // 25569 = 1970-01-01
    const milliseconds =
      Math.round((value - 25569) * 86400 * 1000);

    const date = new Date(milliseconds);

    if (!isNaN(date.getTime())) {
      return toIsoDate(date);
    }

    return null;
  }

  // Jika string
  if (typeof value === "string") {
    const trimmed = value.trim();

    // dd/mm/yyyy atau dd-mm-yyyy
    let match = trimmed.match(
      /^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/
    );

    if (match) {
      const [, dd, mm, yyyy] = match;

      const date = new Date(
        Date.UTC(
          Number(yyyy),
          Number(mm) - 1,
          Number(dd)
        )
      );

      return toIsoDate(date);
    }

    // yyyy-mm-dd
    match = trimmed.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );

    if (match) {
      const [, yyyy, mm, dd] = match;

      const date = new Date(
        Date.UTC(
          Number(yyyy),
          Number(mm) - 1,
          Number(dd)
        )
      );

      return toIsoDate(date);
    }

    // Fallback JavaScript
    const fallback = new Date(trimmed);

    if (!isNaN(fallback.getTime())) {
      return toIsoDate(fallback);
    }
  }

  return null;
}

function toIsoDate(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().split("T")[0];
}

/**
 * Mengubah nilai menjadi integer non-negatif.
 */
function parseNonNegativeInt(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  // ExcelJS bisa memberikan object value
  if (typeof value === "object") {
    if (value.result !== undefined) {
      return parseNonNegativeInt(value.result);
    }

    if (value.text !== undefined) {
      return parseNonNegativeInt(value.text);
    }
  }

  const num = Number(
    String(value).replace(/[^\d.-]/g, "")
  );

  if (!Number.isFinite(num) || num < 0) {
    return null;
  }

  return Math.round(num);
}

/**
 * Validasi extension file.
 */
function hasAllowedExtension(filename) {
  const lower = String(filename || "").toLowerCase();

  return ALLOWED_EXTENSIONS.some((ext) =>
    lower.endsWith(ext)
  );
}

/**
 * Mengambil nilai asli dari cell ExcelJS.
 */
function getCellValue(cell) {
  const value = cell.value;

  if (value === null || value === undefined) {
    return null;
  }

  // Formula
  if (typeof value === "object" && value.result !== undefined) {
    return value.result;
  }

  // Rich text
  if (typeof value === "object" && Array.isArray(value.richText)) {
    return value.richText
      .map((item) => item.text || "")
      .join("");
  }

  // Hyperlink
  if (typeof value === "object" && value.text !== undefined) {
    return value.text;
  }

  return value;
}

/**
 * Baca buffer Excel menggunakan ExcelJS.
 */
async function readWorkbookRows(buffer) {
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(buffer);
  } catch (err) {
    throw new ApiError(
      "File Excel tidak dapat dibaca atau rusak.",
      400
    );
  }

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new ApiError(
      "File Excel tidak memiliki worksheet.",
      400
    );
  }

  const rows = [];

  // Ambil header dari baris pertama
  const headerRow = worksheet.getRow(1);

  const headers = [];

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber] = String(
      getCellValue(cell) ?? ""
    ).trim();
  });

  if (!headers.some((header) => header)) {
    throw new ApiError(
      "File Excel tidak memiliki header kolom.",
      400
    );
  }

  // Ambil data mulai baris kedua
  worksheet.eachRow(
    { includeEmpty: false },
    (row, rowNumber) => {
      if (rowNumber === 1) return;

      const data = {};

      headers.forEach((header, colNumber) => {
        if (!header) return;

        const cell = row.getCell(colNumber);

        data[header] = getCellValue(cell);
      });

      const hasData = Object.values(data).some(
        (value) =>
          value !== null &&
          value !== undefined &&
          value !== ""
      );

      if (hasData) {
        rows.push(data);
      }
    }
  );

  if (!rows.length) {
    throw new ApiError(
      "File Excel tidak memiliki data (worksheet kosong).",
      400
    );
  }

  return rows;
}

/**
 * Proses data kunjungan pasien.
 */
function processKunjunganPasien(rows) {
  const originalHeaders = Object.keys(rows[0]);

  const { mapping, missing } =
    resolveColumnMapping(
      originalHeaders,
      COLUMN_ALIASES.kunjungan_pasien
    );

  if (
    missing.includes("tanggal") ||
    missing.includes("jumlah_kunjungan")
  ) {
    throw new ApiError(
      "Format file tidak sesuai. Kolom wajib untuk data kunjungan pasien: Tanggal dan Jumlah Kunjungan.",
      400,
      { missing }
    );
  }

  const result = [];

  rows.forEach((row, index) => {
    const tanggal = parseExcelDate(
      row[mapping.tanggal]
    );

    const jumlah = parseNonNegativeInt(
      row[mapping.jumlah_kunjungan]
    );

    const poli = mapping.poli
      ? String(
          row[mapping.poli] || ""
        ).trim() || null
      : null;

    if (!tanggal || jumlah === null) {
      return;
    }

    result.push({
      tanggal,
      poli,
      jumlah_kunjungan: jumlah,
      baris_excel: index + 2,
    });
  });

  if (!result.length) {
    throw new ApiError(
      "Tidak ada baris data valid yang dapat diproses dari file Excel.",
      400
    );
  }

  return result;
}

/**
 * Proses data penyakit terbanyak.
 */
function processPenyakitTerbanyak(rows) {
  const originalHeaders = Object.keys(rows[0]);

  const { mapping, missing } =
    resolveColumnMapping(
      originalHeaders,
      COLUMN_ALIASES.penyakit_terbanyak
    );

  if (
    missing.includes("nama_penyakit") ||
    missing.includes("jumlah_kasus")
  ) {
    throw new ApiError(
      "Format file tidak sesuai. Kolom wajib untuk data penyakit terbanyak: Nama Penyakit dan Jumlah Kasus.",
      400,
      { missing }
    );
  }

  const result = [];

  rows.forEach((row, index) => {
    const nama = String(
      row[mapping.nama_penyakit] || ""
    ).trim();

    const jumlah = parseNonNegativeInt(
      row[mapping.jumlah_kasus]
    );

    const periode = mapping.periode
      ? String(
          row[mapping.periode] || ""
        ).trim() || null
      : null;

    if (!nama || jumlah === null) {
      return;
    }

    result.push({
      nama_penyakit: nama,
      jumlah_kasus: jumlah,
      periode,
      baris_excel: index + 2,
    });
  });

  if (!result.length) {
    throw new ApiError(
      "Tidak ada baris data valid yang dapat diproses dari file Excel.",
      400
    );
  }

  return result;
}

/**
 * Untuk jenis lainnya.
 */
function processGeneric(rows) {
  return rows.map((row, index) => {
    const cleaned = {};

    Object.entries(row).forEach(
      ([key, value]) => {
        cleaned[key] =
          typeof value === "string"
            ? value.trim()
            : value;
      }
    );

    return {
      data: cleaned,
      baris_excel: index + 2,
    };
  });
}

/**
 * Fungsi utama.
 *
 * PERHATIAN:
 * Karena ExcelJS membaca file secara asynchronous,
 * fungsi ini juga harus asynchronous.
 */
async function processExcelBuffer(
  buffer,
  jenisData
) {
  const rows = await readWorkbookRows(buffer);

  switch (jenisData) {
    case "kunjungan_pasien":
      return {
        jenis: "kunjungan_pasien",
        rows: processKunjunganPasien(rows),
      };

    case "penyakit_terbanyak":
      return {
        jenis: "penyakit_terbanyak",
        rows: processPenyakitTerbanyak(rows),
      };

    default:
      return {
        jenis: "lainnya",
        rows: processGeneric(rows),
      };
  }
}

module.exports = {
  hasAllowedExtension,
  processExcelBuffer,
  parseExcelDate,
  parseNonNegativeInt,
  normalizeHeader,
};