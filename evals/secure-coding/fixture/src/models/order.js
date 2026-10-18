const mongoose = require("mongoose");

module.exports = mongoose.model("Order", new mongoose.Schema({
  userId: String,
  amount: Number,
  status: { type: String, enum: ["pending", "paid"], default: "pending" },
  paidAt: Date,
}));
