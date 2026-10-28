const express = require("express");
const Review = require("../models/Review");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// User-generated reviews sit in a moderation queue: new/edited reviews are
// "pending" and only become publicly visible ("approved") once an admin clears them.

// Public: approved reviews for a recipe + aggregate score.
router.get("/recipe/:id", async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: "Invalid recipe id" });
  try {
    const recipeId = Number(req.params.id);
    const reviews = await Review.find({ recipeId, status: "approved" })
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .limit(100);
    const count = reviews.length;
    const avg = count ? reviews.reduce((s, rv) => s + rv.rating, 0) / count : 0;
    res.json({ reviews, count, avg: Math.round(avg * 10) / 10 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Authenticated: the caller's own review for a recipe (any status), so the UI
// can prefill the form and show a "pending" badge.
router.get("/mine/:id", authenticate, async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: "Invalid recipe id" });
  try {
    const review = await Review.findOne({ recipeId: Number(req.params.id), userId: req.user.id });
    res.json(review || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", authenticate, async (req, res) => {
  const b = req.body || {};
  const recipeId = Number(b.recipeId);
  if (!Number.isFinite(recipeId)) return res.status(400).json({ error: "Invalid recipeId" });
  const rating = Number(b.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return res.status(400).json({ error: "Rating must be 1-5" });
  const comment = typeof b.comment === "string" ? b.comment.trim().slice(0, 1000) : "";
  const recipeTitle = typeof b.recipeTitle === "string" ? b.recipeTitle.slice(0, 300) : "";

  try {
    const existing = await Review.findOne({ recipeId, userId: req.user.id });
    if (existing) {
      existing.rating = rating;
      existing.comment = comment;
      existing.recipeTitle = recipeTitle || existing.recipeTitle;
      existing.status = "pending"; // re-edits go back through moderation
      await existing.save();
      return res.json(existing);
    }
    const doc = await new Review({ userId: req.user.id, recipeId, recipeTitle, rating, comment }).save();
    res.status(201).json(doc);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "You already reviewed this recipe" });
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    await Review.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
