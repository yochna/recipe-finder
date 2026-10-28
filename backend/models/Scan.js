const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ingredients: [{ type: String }],
  recipeCount: { type: Number, default: 0 },
}, { timestamps: true });

scanSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.Scan || mongoose.model("Scan", scanSchema);
