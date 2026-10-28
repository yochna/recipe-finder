require("dotenv").config();

// Keys pasted into the Render/Vercel dashboards often carry a trailing newline
// or space, which breaks HTTP headers (e.g. "Bearer <key>\n is not a legal
// HTTP header value"). Trim every string value once, at the source.
const str = (v) => (typeof v === "string" ? v.trim() : v);

const NODE_ENV = str(process.env.NODE_ENV);

// Single source of truth for configuration. Read once at load; every module
// imports from here instead of touching process.env directly.
module.exports = {
  NODE_ENV,
  isProd:       NODE_ENV === "production",
  isTest:       NODE_ENV === "test",
  PORT:         process.env.PORT || 5000,
  API_KEY:      str(process.env.SPOONACULAR_KEY),
  MONGO_URI:    str(process.env.MONGO_URI),
  GROQ_KEY:     str(process.env.GROQ_KEY),
  JWT_SECRET:   str(process.env.JWT_SECRET),
  GEMINI_KEY:   str(process.env.GEMINI_KEY),
  GEMINI_MODEL: str(process.env.GEMINI_MODEL) || "gemini-2.5-flash",
  GMAIL_USER:   str(process.env.GMAIL_USER),
  GMAIL_PASS:   str(process.env.GMAIL_PASS),
  FRONTEND_URL: str(process.env.FRONTEND_URL),
};
