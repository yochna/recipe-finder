require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await mongoose.connection.db.collection("favorites").drop();
  console.log("✅ favorites collection dropped");
  process.exit(0);
}).catch(err => {
  console.error(err.message);
  process.exit(1);
});