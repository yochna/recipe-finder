require("dotenv").config();

const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const rateLimit = require('express-rate-limit');
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { URL } = require("url");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.SPOONACULAR_KEY;
const MONGO_URI = process.env.MONGO_URI;
const GROQ_KEY = process.env.GROQ_KEY;
const JWT_SECRET = process.env.JWT_SECRET;
const GEMINI_KEY = process.env.GEMINI_KEY;
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;

if (!API_KEY)    { console.error("❌ Missing SPOONACULAR_KEY in .env"); process.exit(1); }
if (!MONGO_URI)  { console.error("❌ Missing MONGO_URI in .env");         process.exit(1); }
if (!GROQ_KEY)   { console.error("❌ Missing GROQ_KEY in .env");          process.exit(1); }
if (!JWT_SECRET) { console.error("❌ Missing JWT_SECRET in .env");        process.exit(1); }
if (!GEMINI_KEY) { console.error("❌ Missing GEMINI_KEY in .env");        process.exit(1); }

const genAI = new GoogleGenerativeAI(GEMINI_KEY);

// ---------- Dynamic CORS Configuration ----------
const allowedOrigins = [
  'https://recipe-finder-nu-seven.vercel.app', // Your production Vercel frontend
  'http://localhost:3000',                     // React local development port
  'http://localhost:5173'                      // Vite local development port
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow server-to-server or tools like Postman (no origin header)
    if (!origin) return callback(null, true);
    
    // Check if the origin matches our allowed list, or matches a local address during development
    if (allowedOrigins.indexOf(origin) !== -1 || (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost'))) {
      callback(null, true);
    } else {
      callback(new Error("Blocked by CORS policy"));
    }
  },
  credentials: true, // Crucial for passing cookies securely
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.options('*', cors());
// Camera scans arrive as base64 images — allow a larger body only on that route.
app.use('/api/scan', express.json({ limit: '8mb' }));
app.use(express.json());
app.use(cookieParser());

// ---------- Rate Limiters ----------

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Search limit reached, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI calls cost real quota — keep them well under the general limit
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 8,
  message: { error: 'You are using the kitchen too fast — try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);           // applies to all routes
app.use('/api/auth/', authLimiter);         // stricter on login/register
app.use('/api/recipes', searchLimiter);     // strictest on Spoonacular calls
app.use('/api/chat', aiLimiter);            // Groq quota protection
app.use('/api/scan', aiLimiter);            // Gemini quota protection

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => { console.error("MongoDB error:", err); process.exit(1); });

// ---------- Mailer ----------

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: GMAIL_USER, pass: GMAIL_PASS },
});

// ---------- Schemas ----------

const userSchema = new mongoose.Schema({
  name:              { type: String, required: true, trim: true },
  email:             { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:          { type: String, required: true },
  role:              { type: String, enum: ["user", "admin"], default: "user" },
  resetToken:        String,
  resetTokenExpiry:  Date,
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

const favoriteSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipeId:       { type: Number, required: true },
  title:          String,
  image:          String,
  readyInMinutes: Number,
  servings:       Number,
  sourceUrl:      String,
  vegetarian:     Boolean,
  vegan:          Boolean,
  glutenFree:     Boolean,
}, { timestamps: true });

favoriteSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

const Favorite = mongoose.model("Favorite", favoriteSchema);

// ---------- Cookie helper ----------
const cookieOptions = {
  httpOnly: true,
  // ✅ FIX: sameSite is 'none' only in production with secure: true
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: process.env.NODE_ENV === 'production', 
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ---------- Auth Middleware ----------

const authenticate = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// ---------- Admin Middleware ----------
// Must run AFTER `authenticate`. Blocks anyone whose token role isn't "admin".
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access only" });
  }
  next();
};

// ---------- Auth Routes ----------

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "Name, email and password are required" });
  if (password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email already registered" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await new User({ name, email, password: hashed }).save();
    const token = jwt.sign({ id: user._id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie('token', token, cookieOptions);
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid email or password" });
    const token = jwt.sign({ id: user._id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie('token', token, cookieOptions);
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/auth/me", authenticate, (req, res) => {
  res.json({ user: req.user });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie('token', cookieOptions); // Added options here to match creation layout
  res.json({ success: true });
});

// ---------- Forgot Password ----------

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: true });

    const token = crypto.randomBytes(32).toString("hex");
    // Only the hash is stored — a DB leak can't be replayed as reset links.
    user.resetToken = crypto.createHash("sha256").update(token).digest("hex");
    user.resetTokenExpiry = Date.now() + 1000 * 60 * 60; // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"Saffron & Stove" <${GMAIL_USER}>`,
      to: email,
      subject: "Reset your password — Saffron & Stove",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:2rem;">
          <h2 style="font-size:1.5rem;margin-bottom:0.5rem;">Reset your password</h2>
          <p style="color:#666;">You requested a password reset for your Saffron & Stove account.</p>
          <a href="${resetUrl}"
             style="display:inline-block;margin:1.5rem 0;padding:0.75rem 1.5rem;background:#c0392b;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
            Reset Password
          </a>
          <p style="color:#999;font-size:0.85rem;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Reset Password ----------

app.post("/api/auth/reset-password", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password)
    return res.status(400).json({ error: "Token and password are required" });
  if (password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ error: "Invalid or expired reset link" });

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Image Proxy ----------

// Only images we actually serve may pass through — blocks SSRF probing of
// internal/private networks via an attacker-supplied url param.
const IMAGE_PROXY_ALLOWED_HOSTS = new Set([
  "spoonacular.com",
  "media-sp00.spoonacular.com",
  "img.spoonacular.com",
  "images.unsplash.com",
]);

app.get("/api/image-proxy", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url" });
  let target;
  try {
    target = new URL(decodeURIComponent(url));
  } catch {
    return res.status(400).json({ error: "Invalid url" });
  }
  if (target.protocol !== "https:" || !IMAGE_PROXY_ALLOWED_HOSTS.has(target.hostname)) {
    return res.status(403).json({ error: "Host not allowed" });
  }
  try {
    const response = await fetch(target.toString());
    if (!response.ok) return res.status(response.status).end();
    const contentType = response.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    response.body.pipe(res);
  } catch (err) {
    res.status(500).end();
  }
});

// ---------- Recipe Routes ----------

app.get("/api/recipes", async (req, res) => {
  const { query, cuisine, diet, type, number = 12 } = req.query;
  if (!query) return res.status(400).json({ error: "Missing query" });
  try {
    const url = new URL("https://api.spoonacular.com/recipes/complexSearch");
    url.searchParams.append("query", query);
    url.searchParams.append("apiKey", API_KEY);
    url.searchParams.append("number", Math.min(Number(number), 20));
    url.searchParams.append("addRecipeInformation", "true");
    if (cuisine) url.searchParams.append("cuisine", cuisine);
    if (diet)    url.searchParams.append("diet", diet);
    if (type)    url.searchParams.append("type", type);
    const response = await fetch(url.toString());
    if (!response.ok) return res.status(response.status).json({ error: `Spoonacular error ${response.status}` });
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Fridge Scan Routes ----------

// Photo → ingredient names, via Gemini vision. The prompt forces a strict
// JSON contract so the client can render corrections as editable chips.
const SCAN_PROMPT = `You are a grocery-photo analysis engine for a recipe app.
Look at the image and identify every raw or packaged FOOD INGREDIENT a person could cook with.
Rules:
- Return ONLY a JSON object of the shape {"ingredients": ["tomato", "onion", ...]}
- Use simple lowercase singular pantry names ("chicken breast", "basil leaves", "soy sauce"), no quantities or brand labels.
- Ignore appliances, packaging graphics, and non-food items. If you see no identifiable ingredients, return {"ingredients": []}.
- Order by how certain you are. Cap at 25 items.`;

app.post("/api/scan", authenticate, async (req, res) => {
  const { image } = req.body || {};
  const m = typeof image === "string"
    && /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(image);
  if (!m) return res.status(400).json({ error: "image must be a base64 jpeg/png/webp data URL" });

  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 512,
      },
    });
    const result = await model.generateContent([
      { text: SCAN_PROMPT },
      { inlineData: { mimeType: `image/${m[1]}`, data: m[2] } },
    ]);
    const parsed = JSON.parse(result.response.text());
    const ingredients = [...new Set(
      (Array.isArray(parsed.ingredients) ? parsed.ingredients : [])
        .filter(x => typeof x === "string")
        .map(x => x.trim().toLowerCase().slice(0, 60))
        .filter(Boolean)
    )].slice(0, 25);
    res.json({ ingredients });
  } catch (err) {
    console.error("Gemini scan error:", err.message);
    res.status(502).json({ error: "Could not read the photo — try again with better light." });
  }
});

// Match a user-curated ingredient list against Spoonacular's finder.
app.get("/api/recipes/by-ingredients", async (req, res) => {
  const { ingredients } = req.query;
  if (!ingredients) return res.status(400).json({ error: "Missing ingredients" });
  const list = String(ingredients).split(",").map(s => s.trim()).filter(Boolean).slice(0, 20);
  if (!list.length) return res.status(400).json({ error: "No ingredients provided" });
  try {
    const url = new URL("https://api.spoonacular.com/recipes/findByIngredients");
    url.searchParams.append("ingredients", list.join(", "));
    url.searchParams.append("apiKey", API_KEY);
    url.searchParams.append("number", "10");
    url.searchParams.append("ranking", "2");   // fewest missing ingredients first
    url.searchParams.append("addRecipeInformation", "true");
    const response = await fetch(url.toString());
    if (!response.ok) {
      // Empty matches come back as a 404 from Spoonacular — treat it as zero results.
      if (response.status === 404) return res.json([]);
      return res.status(response.status).json({ error: `Spoonacular error ${response.status}` });
    }
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Cook Mode Route ----------

app.get("/api/recipes/:id/steps", async (req, res) => {
  try {
    const url = `https://api.spoonacular.com/recipes/${req.params.id}/analyzedInstructions?apiKey=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return res.status(response.status).json({ error: `Spoonacular error ${response.status}` });
    const data = await response.json();
    const steps = data?.[0]?.steps || [];
    res.json(steps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Recipe Detail Route ----------
// One Spoonacular call returns everything the detail page needs:
// extendedIngredients, nutrition, summary and analyzedInstructions.
app.get("/api/recipes/:id/details", async (req, res) => {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) return res.status(400).json({ error: "Invalid recipe id" });
  try {
    const url = new URL(`https://api.spoonacular.com/recipes/${id}/information`);
    url.searchParams.append("includeNutrition", "true");
    url.searchParams.append("apiKey", API_KEY);
    const response = await fetch(url.toString());
    if (!response.ok) return res.status(response.status).json({ error: `Spoonacular error ${response.status}` });
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Favorites Routes ----------

app.get("/api/favorites", authenticate, async (req, res) => {
  try {
    res.json(await Favorite.find({ userId: req.user.id }).sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Explicit whitelist — prevents field stuffing / schema injection from raw client bodies
const pickFavoriteFields = (b) => ({
  recipeId:       Number(b.recipeId ?? b.id),
  title:          typeof b.title === "string" ? b.title.slice(0, 300) : undefined,
  image:          typeof b.image === "string" ? b.image.slice(0, 500) : undefined,
  readyInMinutes: b.readyInMinutes != null ? Number(b.readyInMinutes) || undefined : undefined,
  servings:       b.servings != null ? Number(b.servings) || undefined : undefined,
  sourceUrl:      typeof b.sourceUrl === "string" ? b.sourceUrl.slice(0, 500) : undefined,
  vegetarian:     typeof b.vegetarian === "boolean" ? b.vegetarian : undefined,
  vegan:          typeof b.vegan === "boolean" ? b.vegan : undefined,
  glutenFree:     typeof b.glutenFree === "boolean" ? b.glutenFree : undefined,
});

app.post("/api/favorites", authenticate, async (req, res) => {
  const fields = pickFavoriteFields(req.body || {});
  if (!Number.isFinite(fields.recipeId))
    return res.status(400).json({ error: "recipeId must be a number" });
  try {
    const doc = await new Favorite({ ...fields, userId: req.user.id }).save();
    res.status(201).json(doc);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "Already saved" });
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/favorites/:id", authenticate, async (req, res) => {
  try {
    await Favorite.findOneAndDelete({ recipeId: Number(req.params.id), userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- AI Chef Route ----------

app.post("/api/chat", authenticate, async (req, res) => {
  const { messages, system } = req.body;
  if (!messages || !Array.isArray(messages))
    return res.status(400).json({ error: "Missing messages array" });
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1000,
        messages: [
          { role: "system", content: system || "" },
          ...messages,
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `Groq error ${response.status}`);
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't think of anything right now!";
    res.json({ content: [{ text: reply }] });
  } catch (err) {
    console.error("Groq error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------- Shopping List Route ----------

app.get("/api/recipes/:id/ingredients", async (req, res) => {
  try {
    const url = `https://api.spoonacular.com/recipes/${req.params.id}/ingredientWidget.json?apiKey=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return res.status(response.status).json({ error: `Spoonacular error ${response.status}` });
    const data = await response.json();
    res.json(data.ingredients || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Admin Routes ----------
// All routes below require a valid login token AND role: "admin" on that user's DB record.

// Overview stats for the admin dashboard
app.get("/api/admin/stats", authenticate, requireAdmin, async (req, res) => {
  try {
    const [userCount, favoriteCount, adminCount] = await Promise.all([
      User.countDocuments(),
      Favorite.countDocuments(),
      User.countDocuments({ role: "admin" }),
    ]);
    res.json({ userCount, favoriteCount, adminCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Every registered user, straight from the real MongoDB users collection
app.get("/api/admin/users", authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password -resetToken -resetTokenExpiry").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Every saved favorite across every user, with the owning user attached
app.get("/api/admin/favorites", authenticate, requireAdmin, async (req, res) => {
  try {
    const favorites = await Favorite.find().populate("userId", "name email").sort({ createdAt: -1 });
    res.json(favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Promote/demote a user's role (e.g. hand out a second admin)
app.patch("/api/admin/users/:id/role", authenticate, requireAdmin, async (req, res) => {
  const { role } = req.body;
  if (!["user", "admin"].includes(role))
    return res.status(400).json({ error: "role must be 'user' or 'admin'" });
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true })
      .select("-password -resetToken -resetTokenExpiry");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a user (and their favorites) from the real database
app.delete("/api/admin/users/:id", authenticate, requireAdmin, async (req, res) => {
  if (req.params.id === req.user.id)
    return res.status(400).json({ error: "You can't delete your own admin account" });
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    await Favorite.deleteMany({ userId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 API running → http://localhost:${PORT}`));