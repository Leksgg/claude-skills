const express = require("express");
const User = require("../models/user");
const { requireAuth } = require("../lib/auth");

const router = express.Router();

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select("email name bio avatarUrl plan");
  res.json(user);
});

module.exports = router;
