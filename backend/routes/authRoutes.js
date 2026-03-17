const express = require("express");
const router = express.Router();

const { login, signup, getSecurityQuestion, resetPassword, getCurrentUser, updateProfile, getCaptcha, uploadProfilePhoto, removeProfilePhoto, avatarUploadMiddleware } = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");

console.log("Loading authRoutes...");

router.get("/test", (req, res) => {
    res.json({ message: "Auth route is working" });
});

router.get("/me", protect, getCurrentUser);
router.put("/me", protect, updateProfile);
router.post("/avatar", protect, avatarUploadMiddleware, uploadProfilePhoto);
router.delete("/avatar", protect, removeProfilePhoto);
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

// Cart Routes
router.post("/cart/:productId", protect, (req, res) => {
    const { addToCart } = require("../controllers/authController");
    addToCart(req, res);
});

router.delete("/cart/:productId", protect, (req, res) => {
    const { removeFromCart } = require("../controllers/authController");
    removeFromCart(req, res);
});

router.patch("/cart/:productId", protect, (req, res) => {
    const { updateCartQuantity } = require("../controllers/authController");
    updateCartQuantity(req, res);
});

router.get("/cart", protect, (req, res) => {
    const { getCart } = require("../controllers/authController");
    getCart(req, res);
});

module.exports = router;

console.log("login function:", login);
