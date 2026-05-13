require("dotenv").config();

const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { URL } = require("url");

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.SPOONACULAR_KEY;
const MONGO_URI = process.env.MONGO_URI;
const GROQ_KEY = process.env.GROQ_KEY;
const JWT_SECRET = process.env.JWT_SECRET || "saffron-stove-secret-key";
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;

if (!API_KEY)   { console.error("❌ Missing SPOONACULAR_KEY in .env"); process.exit(1); }
if (!MONGO_URI) { console.error("❌ Missing MONGO_URI in .env");        process.exit(1); }
if (!GROQ_KEY)  { console.error("❌ Missing GROQ_KEY in .env");         process.exit(1); }

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
app.use(cookieParser());

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
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
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
    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie('token', token, cookieOptions);
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email } });
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
    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie('token', token, cookieOptions);
    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/auth/me", authenticate, (req, res) => {
  res.json({ user: req.user });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// ---------- Forgot Password ----------

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  console.log("📧 Forgot password for:", email);
  console.log("📧 GMAIL_USER:", GMAIL_USER);
  console.log("📧 GMAIL_PASS length:", GMAIL_PASS?.length);
  if (!email) return res.status(400).json({ error: "Email is required" });
  try {
    const user = await User.findOne({ email });
    // Always return success even if email not found (security)
    if (!user) return res.json({ success: true });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 1000 * 60 * 60; // 1 hour
    await user.save();

    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;

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
    console.error("Forgot password error:", err.message);
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
    const user = await User.findOne({
      resetToken: token,
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

app.get("/api/image-proxy", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url" });
  try {
    const response = await fetch(decodeURIComponent(url));
    if (!response.ok) return res.status(response.status).end();
    const contentType = response.headers.get("content-type");
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

// ---------- Favorites Routes ----------

app.get("/api/favorites", authenticate, async (req, res) => {
  try {
    res.json(await Favorite.find({ userId: req.user.id }).sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/favorites", authenticate, async (req, res) => {
  try {
    const doc = await new Favorite({ ...req.body, userId: req.user.id }).save();
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

app.listen(PORT, () => console.log(`🚀 API running → http://localhost:${PORT}`));