const mongoose = require("mongoose");
const env = require("./config/env");
const app = require("./app");
const models = require("./models");

// ---------- Bootstrap ----------
// Only connect + listen when run directly (`node server.js`). When required by
// the test suite, the caller controls the connection and uses the exported app.
async function start() {
  if (!env.API_KEY)    { console.error("❌ Missing SPOONACULAR_KEY in .env"); process.exit(1); }
  if (!env.MONGO_URI)  { console.error("❌ Missing MONGO_URI in .env");         process.exit(1); }
  if (!env.GROQ_KEY)   { console.error("❌ Missing GROQ_KEY in .env");          process.exit(1); }
  if (!env.JWT_SECRET) { console.error("❌ Missing JWT_SECRET in .env");        process.exit(1); }
  if (!env.GEMINI_KEY) { console.error("❌ Missing GEMINI_KEY in .env");        process.exit(1); }

  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("MongoDB error:", err);
    process.exit(1);
  }
  app.listen(env.PORT, () => console.log(`🚀 API running → http://localhost:${env.PORT}`));
}

if (require.main === module) start();

module.exports = { app, mongoose, models };
