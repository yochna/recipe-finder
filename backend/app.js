const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const env = require("./config/env");
const {
  generalLimiter, authLimiter, searchLimiter, aiLimiter,
} = require("./middleware/rateLimit");

const authRoutes = require("./routes/auth");
const recipeRoutes = require("./routes/recipes");
const favoriteRoutes = require("./routes/favorites");
const scanRoutes = require("./routes/scans");
const reviewRoutes = require("./routes/reviews");
const aiRoutes = require("./routes/ai");
const imageProxyRoutes = require("./routes/imageProxy");
const adminRoutes = require("./routes/admin");

const app = express();

// ---------- CORS ----------
const allowedOrigins = [
  "https://recipe-finder-nu-seven.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || (!env.isProd && origin.startsWith("http://localhost"))) {
      return callback(null, true);
    }
    callback(new Error("Blocked by CORS policy"));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.options("*", cors());

// Camera scans arrive as base64 images — allow a larger body only on that route.
app.use("/api/scan", express.json({ limit: "8mb" }));
app.use(express.json());
app.use(cookieParser());

// ---------- Rate limiters (mounted at the same paths as the original monolith) ----------
app.use("/api/", generalLimiter);
app.use("/api/auth/", authLimiter);
app.use("/api/recipes", searchLimiter);
app.use("/api/chat", aiLimiter);
app.use("/api/scan", aiLimiter);

// ---------- Routers ----------
app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/scans", scanRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
// aiRoutes (/scan, /chat) and imageProxy (/image-proxy) are relative to /api.
app.use("/api", aiRoutes);
app.use("/api", imageProxyRoutes);

module.exports = app;
