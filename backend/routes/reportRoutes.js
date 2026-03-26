const express = require("express");
const router = express.Router();
const { createReport, getReports, updateReportStatus } = require("../controllers/reportController");
const protect = require("../middleware/authMiddleware");
const { adminOnly, checkVerified } = require("../middleware/authMiddleware");

// CREATE REPORT (Protected)
router.post("/", protect, checkVerified, createReport);

// ADMIN ONLY ROUTES
router.get("/", protect, adminOnly, getReports);
router.patch("/:id/status", protect, adminOnly, updateReportStatus);

module.exports = router;
