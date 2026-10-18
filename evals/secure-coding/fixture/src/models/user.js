const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  bio: String,
  avatarUrl: String,
  role: { type: String, enum: ["user", "admin"], default: "user" },
  plan: { type: String, enum: ["free", "pro"], default: "free" },
  credits: { type: Number, default: 0 },
});

module.exports = mongoose.model("User", userSchema);
