const express = require("express");
const router = express.Router();
const adminUserController = require("../controllers/adminUserController");
const protect = require("../middleware/authMiddleware");
const { adminOnly } = protect;

// POST /api/admin/users
router.post("/", protect, adminOnly, adminUserController.addUserToDirectory);

module.exports = router;
