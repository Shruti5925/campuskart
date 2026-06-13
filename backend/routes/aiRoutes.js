const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");
const { generateDescription, verifyImages } = require("../controllers/aiController");

router.post("/generate-description", generateDescription);
router.post("/verify-images", upload.array("images", 5), verifyImages);
router.post("/quality-image-verification", upload.array("images", 5), require("../controllers/qualityImageVerification").verifyQualityImages);

module.exports = router;