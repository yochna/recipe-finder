const express = require("express");
const fetch = require("node-fetch");
const env = require("../config/env");
const { authenticate } = require("../middleware/auth");
const { detectIngredients, isScanImage } = require("../services/gemini");

const router = express.Router();

// Fridge Scan: photo → ingredient names via Gemini vision.
router.post("/scan", authenticate, async (req, res) => {
  const { image } = req.body || {};
  if (!isScanImage(image))
    return res.status(400).json({ error: "image must be a base64 jpeg/png/webp data URL" });
  try {
    const ingredients = await detectIngredients(image);
    res.json({ ingredients });
  } catch (err) {
    console.error("Gemini scan error:", err.message);
    res.status(502).json({ error: "Could not read the photo — try again with better light." });
  }
});

// AI Chef: chat completion via Groq/LLaMA.
router.post("/chat", authenticate, async (req, res) => {
  const { messages, system } = req.body;
  if (!messages || !Array.isArray(messages))
    return res.status(400).json({ error: "Missing messages array" });
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: env.GROQ_MODEL,
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

module.exports = router;
