// Runs before the app module is imported. server.js validates these at import
// time, so they must exist here. dotenv never overrides vars already set, so
// these win over any local .env. MONGO_URI is provided by globalSetup.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-value";
process.env.SPOONACULAR_KEY = "test-spoonacular-key";
process.env.GROQ_KEY = "test-groq-key";
process.env.GEMINI_KEY = "test-gemini-key";
process.env.FRONTEND_URL = "http://localhost:3000";
