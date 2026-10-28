const express = require("express");
const Scan = require("../models/Scan");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// Whitelist + normalise the ingredient list exactly like POST /api/scan does,
// so a raw client body can never stuff arbitrary fields into the document.
const pickScanFields = (b) => {
  const ingredients = [...new Set(
    (Array.isArray(b.ingredients) ? b.ingredients : [])
      .filter(x => typeof x === "string")
      .map(x => x.trim().toLowerCase().slice(0, 60))
      .filter(Boolean)
  )].slice(0, 25);
  const n = Number(b.recipeCount);
  const recipeCount = Number.isFinite(n) ? Math.max(0, Math.min(999, Math.round(n))) : 0;
  return { ingredients, recipeCount };
};

router.post("/", authenticate, async (req, res) => {
  try {
    const { ingredients, recipeCount } = pickScanFields(req.body || {});
    if (!ingredients.length) return res.status(400).json({ error: "No ingredients to save" });
    const doc = await new Scan({ userId: req.user.id, ingredients, recipeCount }).save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scans            -> recent scans
// GET /api/scans?days=7     -> "this week" window
router.get("/", authenticate, async (req, res) => {
  try {
    const filter = { userId: req.user.id };
    const days = Number(req.query.days);
    if (Number.isFinite(days) && days > 0) {
      filter.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
    }
    const scans = await Scan.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json(scans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    await Scan.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
