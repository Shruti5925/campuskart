const express = require("express");
const router = express.Router();

const { login, signup, getSecurityQuestion, resetPassword } = require("../controllers/authController");

console.log("Loading authRoutes...");

router.get("/test", (req, res) => {
    res.json({ message: "Auth route is working" });
});

router.post("/get-security-question", getSecurityQuestion);
router.post("/reset-password", resetPassword);
router.post("/signup", (req, res, next) => {
    console.log("Hit /signup route");
    signup(req, res, next);
});
router.post("/login", login);

module.exports = router;

console.log("login function:", login);
