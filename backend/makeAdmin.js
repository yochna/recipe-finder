/**
 * One-time helper to promote an existing registered user to "admin"
 * in your real MongoDB database.
 *
 * Usage (from the backend/ folder):
 *   node makeAdmin.js youremail@example.com
 *
 * The user must already have registered normally through the app
 * (Sign In / Join) before you run this — this script only flips
 * their role, it doesn't create an account.
 */
require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;
const email = process.argv[2];

if (!email) {
  console.error("❌ Usage: node makeAdmin.js <email>");
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, enum: ["user", "admin"], default: "user" },
}, { timestamps: true, strict: false });

const User = mongoose.model("User", userSchema);

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { role: "admin" },
      { new: true }
    );
    if (!user) {
      console.error(`❌ No user found with email: ${email}`);
      process.exit(1);
    }
    console.log(`✅ ${user.email} is now an admin.`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
