const express = require("express");
const path = require("path");

const router = express.Router();
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");

module.exports = router;
module.exports.UPLOADS_DIR = UPLOADS_DIR;
