const express = require("express");
const { User, Favorite, Scan, Review } = require("../models");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// All routes require a valid login token AND role: "admin" on that user's DB record.

// Overview stats for the admin dashboard
router.get("/stats", authenticate, requireAdmin, async (req, res) => {
  try {
    const [userCount, favoriteCount, adminCount, scanCount, pendingReviewCount] = await Promise.all([
      User.countDocuments(),
      Favorite.countDocuments(),
      User.countDocuments({ role: "admin" }),
      Scan.countDocuments(),
      Review.countDocuments({ status: "pending" }),
    ]);
    res.json({ userCount, favoriteCount, adminCount, scanCount, pendingReviewCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Every registered user, straight from the real MongoDB users collection
router.get("/users", authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password -resetToken -resetTokenExpiry").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Every saved favorite across every user, with the owning user attached
router.get("/favorites", authenticate, requireAdmin, async (req, res) => {
  try {
    const favorites = await Favorite.find().populate("userId", "name email").sort({ createdAt: -1 });
    res.json(favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Review moderation queue — defaults to pending, or pass ?status=approved|rejected|all
router.get("/reviews", authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = ["pending", "approved", "rejected"].includes(status) ? { status } : {};
    const reviews = await Review.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve or reject a review
router.patch("/reviews/:id", authenticate, requireAdmin, async (req, res) => {
  const { status } = req.body || {};
  if (!["pending", "approved", "rejected"].includes(status))
    return res.status(400).json({ error: "status must be pending, approved or rejected" });
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate("userId", "name email");
    if (!review) return res.status(404).json({ error: "Review not found" });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove a review outright
router.delete("/reviews/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Promote/demote a user's role (e.g. hand out a second admin)
router.patch("/users/:id/role", authenticate, requireAdmin, async (req, res) => {
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

// Delete a user (and their favorites, scans and reviews) from the real database
router.delete("/users/:id", authenticate, requireAdmin, async (req, res) => {
  if (req.params.id === req.user.id)
    return res.status(400).json({ error: "You can't delete your own admin account" });
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    await Favorite.deleteMany({ userId: req.params.id });
    await Scan.deleteMany({ userId: req.params.id });
    await Review.deleteMany({ userId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
