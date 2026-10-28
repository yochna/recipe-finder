require("dotenv").config();

// Single source of truth for configuration. Read once at load; every module
// imports from here instead of touching process.env directly.
module.exports = {
  NODE_ENV:     process.env.NODE_ENV,
  isProd:       process.env.NODE_ENV === "production",
  isTest:       process.env.NODE_ENV === "test",
  PORT:         process.env.PORT || 5000,
  API_KEY:      process.env.SPOONACULAR_KEY,
  MONGO_URI:    process.env.MONGO_URI,
  GROQ_KEY:     process.env.GROQ_KEY,
  JWT_SECRET:   process.env.JWT_SECRET,
  GEMINI_KEY:   process.env.GEMINI_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  GMAIL_USER:   process.env.GMAIL_USER,
  GMAIL_PASS:   process.env.GMAIL_PASS,
  FRONTEND_URL: process.env.FRONTEND_URL,
};
