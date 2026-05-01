const express = require("express");
const router = express.Router();

const { login, signup, verifyStudent, getSecurityQuestion, verifySecurityAnswer, resetPassword, getCurrentUser, updateProfile, getCaptcha, uploadProfilePhoto, removeProfilePhoto, avatarUploadMiddleware, getSupportAdmin, getUserById, updateAccountSettings, deleteCurrentUser } = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");
const { adminOnly, checkSuspended, checkVerified } = protect;

console.log("Loading authRoutes...");

router.get("/test", (req, res) => {
    res.json({ message: "Auth route is working" });
});

router.get("/me", protect, getCurrentUser);
router.delete("/me", protect, deleteCurrentUser);
router.put("/me", protect, checkVerified, updateProfile);
router.put("/account-settings", protect, updateAccountSettings);
router.post("/verify-security-answer", protect, verifySecurityAnswer);
router.post("/avatar", protect, avatarUploadMiddleware, uploadProfilePhoto);
router.delete("/avatar", protect, removeProfilePhoto);
router.get("/captcha", getCaptcha);
router.post("/get-security-question", getSecurityQuestion);
router.post("/reset-password", resetPassword);
router.post("/signup", (req, res, next) => {
    console.log("Hit /signup route");
    signup(req, res, next);
});
router.post("/verify-student", verifyStudent);
router.post("/login", login);

// Wishlist Routes
router.post("/wishlist/:productId", protect, checkVerified, (req, res) => {
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
router.post("/cart/:productId", protect, checkSuspended, checkVerified, (req, res) => {
    const { addToCart } = require("../controllers/authController");
    addToCart(req, res);
});

router.delete("/cart/:productId", protect, (req, res) => {
    const { removeFromCart } = require("../controllers/authController");
    removeFromCart(req, res);
});

router.patch("/cart/:productId", protect, checkSuspended, checkVerified, (req, res) => {
    const { updateCartQuantity } = require("../controllers/authController");
    updateCartQuantity(req, res);
});

router.get("/cart", protect, (req, res) => {
    const { getCart } = require("../controllers/authController");
    getCart(req, res);
});

// Admin User Management
router.get("/users", protect, adminOnly, (req, res) => {
    const { getAllUsers } = require("../controllers/authController");
    getAllUsers(req, res);
});
router.patch("/users/:id/status", protect, adminOnly, (req, res) => {
    const { updateUserStatus } = require("../controllers/authController");
    updateUserStatus(req, res);
});

router.put("/users/:id", protect, adminOnly, (req, res) => {
    const { adminUpdateUser } = require("../controllers/authController");
    adminUpdateUser(req, res);
});

router.get("/users/:id", protect, getUserById);
router.get("/support-admin", protect, getSupportAdmin);

module.exports = router;

console.log("login function:", login);
