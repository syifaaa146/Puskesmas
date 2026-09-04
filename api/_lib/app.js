/**
 * app.js
 * -----------------------------------------------------------------------
 * Konfigurasi Express app: middleware keamanan, CORS, body parser,
 * routing, dan error handler. Dipisah dari server.js supaya app dapat
 * diimpor secara terpisah (misalnya untuk testing) tanpa perlu benar-benar
 * membuka port.
 * -----------------------------------------------------------------------
 */
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const statusRoutes = require("./routes/statusRoutes");
const authRoutes = require("./routes/authRoutes");
const surveyRoutes = require("./routes/surveyRoutes");
const healthRoutes = require("./routes/healthRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const contentRoutes = require("./routes/contentRoutes");

const { generalLimiter } = require("./middleware/rateLimiter");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();
app.set("etag", false);

/* --------------------------- Keamanan dasar --------------------------- */
app.use(helmet());
app.disable("x-powered-by");

/* --------------------------- CORS -------------------------------------
 * FRONTEND_URL bisa berisi lebih dari satu origin, dipisah koma.
 * Jika FRONTEND_URL kosong (mis. saat development lokal cepat),
 * fallback mengizinkan semua origin agar tidak menghalangi development,
 * namun untuk PRODUKSI wajib mengisi FRONTEND_URL secara eksplisit.
 * ----------------------------------------------------------------------*/
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin tidak diizinkan oleh kebijakan CORS."));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* --------------------------- Logging & body parser --------------------*/
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

/* --------------------------- Rate limiting global -----------------------*/
app.use("/api", generalLimiter);

/* --------------------------- Routes -------------------------------------*/
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend API UPTD Puskesmas Kutawaluya aktif. Lihat /api/status.",
  });
});

app.use("/api/status", statusRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/survey", surveyRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/content", contentRoutes);

/* --------------------------- 404 & Error handler -------------------------*/
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
