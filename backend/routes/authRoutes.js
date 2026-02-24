const express = require("express");
const router = express.Router();

const { login, signup, getSecurityQuestion, resetPassword, getCurrentUser, getCaptcha } = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");

console.log("Loading authRoutes...");

router.get("/test", (req, res) => {
    res.json({ message: "Auth route is working" });
});

router.get("/me", protect, getCurrentUser);
router.get("/captcha", getCaptcha);
router.post("/get-security-question", getSecurityQuestion);
router.post("/reset-password", resetPassword);
router.post("/signup", (req, res, next) => {
    console.log("Hit /signup route");
    signup(req, res, next);
});
router.post("/login", login);

// Wishlist Routes
router.post("/wishlist/:productId", protect, (req, res) => {
    const { toggleWishlist } = require("../controllers/authController");
    toggleWishlist(req, res);
});

router.get("/wishlist", protect, (req, res) => {
    const { getWishlist } = require("../controllers/authController");
    getWishlist(req, res);
});

router.get("/wishlist-test", protect, (req, res) => {
    const { testWishlist } = require("../controllers/authController");
    testWishlist(req, res);
});

module.exports = router;

console.log("login function:", login);
