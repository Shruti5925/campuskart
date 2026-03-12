const express = require("express");
const router = express.Router();

const {
    login,
    signup,
    getSecurityQuestion,
    resetPassword,
    getCurrentUser,
    getCaptcha,
    toggleWishlist,
    getWishlist,
    testWishlist,
    updateAvatar
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

console.log("Loading authRoutes...");

router.get("/test", (req, res) => {
    res.json({ message: "Auth route is working" });
});

// User routes
router.get("/me", protect, getCurrentUser);
router.get("/captcha", getCaptcha);
router.post("/get-security-question", getSecurityQuestion);
router.post("/reset-password", resetPassword);
router.post("/signup", signup);
router.post("/login", login);

// ✅ Avatar update route (FIXED)
router.put("/update-avatar", protect, updateAvatar);

// Wishlist Routes
router.post("/wishlist/:productId", protect, toggleWishlist);
router.get("/wishlist", protect, getWishlist);
router.get("/wishlist-test", protect, testWishlist);

module.exports = router;