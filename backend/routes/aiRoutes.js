const express = require("express");
const router = express.Router();

const { generateDescription } = require("../controllers/aiController");

router.post("/generate-description", generateDescription);

module.exports = router;