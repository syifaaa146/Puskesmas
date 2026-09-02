const bcrypt = require("bcryptjs");

const plainPassword = process.argv[2];

if (!plainPassword) {
  console.error("Cara pakai: node src/utils/hashPassword.js \"password_anda\"");
  process.exit(1);
}

if (plainPassword.length < 8) {
  console.error("Gunakan password minimal 8 karakter untuk keamanan yang wajar.");
  process.exit(1);
}

const hash = bcrypt.hashSync(plainPassword, 12);

console.log("\nSalin baris berikut ke file .env Anda:\n");
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
