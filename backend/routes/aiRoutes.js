const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");
const { generateDescription, verifyImages } = require("../controllers/aiController");

router.post("/generate-description", generateDescription);
router.post("/verify-images", upload.array("images", 5), verifyImages);

module.exports = router;