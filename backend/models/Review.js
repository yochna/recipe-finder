const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipeId:    { type: Number, required: true },
  recipeTitle: { type: String, default: "" },
  rating:      { type: Number, required: true, min: 1, max: 5 },
  comment:     { type: String, default: "", maxlength: 1000 },
  status:      { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
}, { timestamps: true });

reviewSchema.index({ recipeId: 1, status: 1 });
reviewSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

module.exports = mongoose.models.Review || mongoose.model("Review", reviewSchema);
