const express = require("express");
const router = express.Router();
const AdminActivity = require("../models/AdminActivity");
const protect = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/authMiddleware");

// Get all admin activities
router.get("/", protect, adminOnly, async (req, res) => {
    try {
        const activities = await AdminActivity.find()
            .sort({ createdAt: -1 })
            .populate("admin", "firstName lastName");
        res.json(activities);
    } catch (err) {
        res.status(500).json({ message: "Error fetching admin activities" });
    }
});

module.exports = router;
