/**
 * services/emailService.js
 * -----------------------------------------------------------------------
 * Mengirim email pengaduan masyarakat menggunakan Nodemailer.
 * Seluruh konfigurasi SMTP diambil dari environment variable (.env),
 * TIDAK PERNAH ditulis langsung di source code.
 * -----------------------------------------------------------------------
 */
const nodemailer = require("nodemailer");
const { ApiError } = require("../utils/apiResponse");

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASSWORD, MAIL_SECURE } = process.env;

  if (!MAIL_HOST || !MAIL_USER || !MAIL_PASSWORD) {
    throw new ApiError(
      "Konfigurasi email server belum lengkap. Hubungi administrator.",
      500
    );
  }

  cachedTransporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: Number(MAIL_PORT) || 587,
    secure: MAIL_SECURE === "true", // true untuk port 465, false untuk port lain (STARTTLS)
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASSWORD,
    },
  });

  return cachedTransporter;
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Kirim email pengaduan masyarakat ke alamat tujuan Puskesmas (MAIL_TO).
 * @param {object} complaint - { nama, email, no_hp, kategori, subjek, isi }
 * @param {{buffer: Buffer, originalname: string, mimetype: string}|null} attachment
 */
async function sendComplaintEmail(complaint, attachment) {
  const mailTo = process.env.MAIL_TO;
  if (!mailTo) {
    throw new ApiError(
      "Alamat email tujuan pengaduan belum dikonfigurasi. Hubungi administrator.",
      500
    );
  }

  const transporter = getTransporter();

  const textBody = [
    "PENGADUAN MASYARAKAT",
    "UPTD Puskesmas Kutawaluya",
    "",
    `Nama       : ${complaint.nama}`,
    `Email      : ${complaint.email}`,
    `No. HP     : ${complaint.no_hp}`,
    `Kategori   : ${complaint.kategori}`,
    `Subjek     : ${complaint.subjek}`,
    "",
    "Isi Pengaduan:",
    complaint.isi,
  ].join("\n");

  const htmlBody = `
    <h2>Pengaduan Masyarakat</h2>
    <p>UPTD Puskesmas Kutawaluya</p>
    <table cellpadding="4" cellspacing="0" border="0">
      <tr><td><strong>Nama</strong></td><td>: ${escapeHtml(complaint.nama)}</td></tr>
      <tr><td><strong>Email</strong></td><td>: ${escapeHtml(complaint.email)}</td></tr>
      <tr><td><strong>No. HP</strong></td><td>: ${escapeHtml(complaint.no_hp)}</td></tr>
      <tr><td><strong>Kategori</strong></td><td>: ${escapeHtml(complaint.kategori)}</td></tr>
      <tr><td><strong>Subjek</strong></td><td>: ${escapeHtml(complaint.subjek)}</td></tr>
    </table>
    <p><strong>Isi Pengaduan:</strong></p>
    <p>${escapeHtml(complaint.isi).replace(/\n/g, "<br>")}</p>
  `;

  const mailOptions = {
    from: `"Website Puskesmas Kutawaluya" <${process.env.MAIL_USER}>`,
    to: mailTo,
    replyTo: complaint.email,
    subject: `[Pengaduan] ${complaint.subjek}`,
    text: textBody,
    html: htmlBody,
  };

  if (attachment) {
    mailOptions.attachments = [
      {
        filename: attachment.originalname,
        content: attachment.buffer,
        contentType: attachment.mimetype,
      },
    ];
  }

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    throw new ApiError(
      "Gagal mengirim email pengaduan. Silakan coba lagi nanti.",
      502,
      process.env.NODE_ENV === "development" ? err.message : undefined
    );
  }
}

module.exports = { sendComplaintEmail };
