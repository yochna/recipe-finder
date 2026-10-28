const mongoose = require("mongoose");

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

module.exports = mongoose.models.Favorite || mongoose.model("Favorite", favoriteSchema);
