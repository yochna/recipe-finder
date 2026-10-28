const { GoogleGenerativeAI } = require("@google/generative-ai");
const env = require("../config/env");

const genAI = new GoogleGenerativeAI(env.GEMINI_KEY || "test-placeholder-key");

// Photo → ingredient names, via Gemini vision. The prompt forces a strict
// JSON contract so the client can render corrections as editable chips.
const SCAN_PROMPT = `You are a grocery-photo analysis engine for a recipe app.
Look at the image and identify every raw or packaged FOOD INGREDIENT a person could cook with.
Rules:
- Return ONLY a JSON object of the shape {"ingredients": ["tomato", "onion", ...]}
- Use simple lowercase singular pantry names ("chicken breast", "basil leaves", "soy sauce"), no quantities or brand labels.
- Ignore appliances, packaging graphics, and non-food items. If you see no identifiable ingredients, return {"ingredients": []}.
- Order by how certain you are. Cap at 25 items.`;

const DATA_URL_RE = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/;

const isScanImage = (value) => typeof value === "string" && DATA_URL_RE.test(value);

// Returns a normalised, de-duplicated, capped list of ingredient strings.
// Throws on any Gemini/parse failure so the caller can map it to a 502.
async function detectIngredients(dataUrl) {
  const m = DATA_URL_RE.exec(dataUrl);
  const model = genAI.getGenerativeModel({
    model: env.GEMINI_MODEL,
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
  return [...new Set(
    (Array.isArray(parsed.ingredients) ? parsed.ingredients : [])
      .filter(x => typeof x === "string")
      .map(x => x.trim().toLowerCase().slice(0, 60))
      .filter(Boolean)
  )].slice(0, 25);
}

module.exports = { detectIngredients, isScanImage };
