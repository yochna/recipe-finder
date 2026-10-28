const express = require("express");
const Favorite = require("../models/Favorite");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

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

router.get("/", authenticate, async (req, res) => {
  try {
    res.json(await Favorite.find({ userId: req.user.id }).sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", authenticate, async (req, res) => {
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

router.delete("/:id", authenticate, async (req, res) => {
  try {
    await Favorite.findOneAndDelete({ recipeId: Number(req.params.id), userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
