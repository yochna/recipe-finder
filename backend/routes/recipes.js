const express = require("express");
const { spoonacular } = require("../services/spoonacular");

const router = express.Router();

// Search — Spoonacular complexSearch.
router.get("/", async (req, res) => {
  const { query, cuisine, diet, type, number = 12 } = req.query;
  if (!query) return res.status(400).json({ error: "Missing query" });
  try {
    const { ok, status, data } = await spoonacular("/recipes/complexSearch", {
      query,
      number: Math.min(Number(number), 20),
      addRecipeInformation: true,
      cuisine,
      diet,
      type,
    });
    if (!ok) return res.status(status).json({ error: `Spoonacular error ${status}` });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Match a user-curated ingredient list against Spoonacular's finder.
router.get("/by-ingredients", async (req, res) => {
  const { ingredients } = req.query;
  if (!ingredients) return res.status(400).json({ error: "Missing ingredients" });
  const list = String(ingredients).split(",").map(s => s.trim()).filter(Boolean).slice(0, 20);
  if (!list.length) return res.status(400).json({ error: "No ingredients provided" });
  try {
    const { ok, status, data } = await spoonacular("/recipes/findByIngredients", {
      ingredients: list.join(", "),
      number: 10,
      ranking: 2,               // fewest missing ingredients first
      addRecipeInformation: true,
    });
    // Empty matches come back as a 404 from Spoonacular — treat it as zero results.
    if (!ok) {
      if (status === 404) return res.json([]);
      return res.status(status).json({ error: `Spoonacular error ${status}` });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cook Mode steps.
router.get("/:id/steps", async (req, res) => {
  try {
    const { ok, status, data } = await spoonacular(`/recipes/${req.params.id}/analyzedInstructions`, {});
    if (!ok) return res.status(status).json({ error: `Spoonacular error ${status}` });
    res.json(data?.[0]?.steps || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Full detail. /information returns ingredients + nutrition + summary but NOT
// analyzedInstructions, so we fetch both and merge the steps into one response.
router.get("/:id/details", async (req, res) => {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) return res.status(400).json({ error: "Invalid recipe id" });
  try {
    const [info, instr] = await Promise.all([
      spoonacular(`/recipes/${id}/information`, { includeNutrition: true }),
      spoonacular(`/recipes/${id}/analyzedInstructions`, {}).catch(() => null),
    ]);
    if (!info.ok) return res.status(info.status).json({ error: `Spoonacular error ${info.status}` });

    const data = info.data;
    try {
      data.analyzedInstructions = instr && instr.ok && Array.isArray(instr.data) ? instr.data : [];
    } catch {
      data.analyzedInstructions = [];
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Shopping list ingredients.
router.get("/:id/ingredients", async (req, res) => {
  try {
    const { ok, status, data } = await spoonacular(`/recipes/${req.params.id}/ingredientWidget.json`, {});
    if (!ok) return res.status(status).json({ error: `Spoonacular error ${status}` });
    res.json(data.ingredients || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
