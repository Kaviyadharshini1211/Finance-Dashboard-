require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const connectDB = require("./config/db");
const errorHandler = require("./middlewares/errorHandler");
const { apiLimiter, authLimiter } = require("./middlewares/rateLimiter");

// Route imports
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const recordRoutes = require("./routes/record.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const app = express();

// ── Connect to MongoDB ────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

// ── Global Middleware ─────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Rate Limiting ─────────────────────────────────────────────
// Skipped in test environment to avoid interfering with test runs
if (process.env.NODE_ENV !== "test") {
  app.use("/api/", apiLimiter);             // 100 req / 15 min on all API routes
  app.use("/api/auth/login", authLimiter);  // 10 req / 15 min on auth routes
  app.use("/api/auth/register", authLimiter);
}

// ── Swagger Docs ──────────────────────────────────────────────
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Finance Dashboard API",
    customCss: ".swagger-ui .topbar { display: none }",
  })
);

// ── Health Check ──────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Finance Dashboard API is running.",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ── API Routes ────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ── Global Error Handler ──────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📄 API Docs available at http://localhost:${PORT}/api-docs\n`);
  });
}

module.exports = app;