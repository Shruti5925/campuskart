const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateCaptcha, verifyCaptcha } = require("../utils/captcha");

exports.signup = async (req, res) => {
  console.log("Signup Request Body:", req.body);
  const {
    firstName,
    middleName,
    lastName,
    gender,
    address,
    email,
    password,
    role,
    collegeId,
    department,
    mobileNumber,
    securityQuestion,
    securityAnswer,
    captchaToken,
    captchaAnswer,
  } = req.body;

  // CAPTCHA Verification
  if (!captchaToken || !captchaAnswer || !verifyCaptcha(captchaToken, captchaAnswer)) {
    return res.status(400).json({ message: "Invalid or expired CAPTCHA ❌" });
  }

  // Validation: Email Domain
  if (!email.endsWith("@banasthali.in")) {
    return res.status(400).json({ message: "Only @banasthali.in email addresses are accepted" });
  }

  // Validation: Mobile Number (10 digits)
  const mobileRegex = /^\d{10}$/;
  if (!mobileRegex.test(mobileNumber)) {
    return res.status(400).json({ message: "Mobile number must be exactly 10 digits" });
  }
  try {
    console.log("Checking if user exists:", email);
    let user = await User.findOne({ email });
    if (user) {
      console.log("User already exists:", email);
      return res.status(400).json({ message: "User already exists" });
    }

    console.log("Hashing password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log("Creating user object...");
    user = new User({
      firstName,
      middleName,
      lastName,
      gender,
      address,
      email,
      password: hashedPassword,
      role,
      collegeId,
      department,
      mobileNumber,
      securityQuestion,
      securityAnswer
    });

    console.log("Saving user to database...");
    await user.save();

    console.log("Generating token...");
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log("Signup successful for:", email);
    res.status(201).json({ message: "User registered successfully", token });
  } catch (err) {
    console.error("FATAL Signup Error:", err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation: Email Domain
    if (!email.endsWith("@banasthali.in")) {
      return res.status(400).json({ message: "Invalid email domain. Please use @banasthali.in" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getSecurityQuestion = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ question: user.securityQuestion });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, securityAnswer, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.securityAnswer !== securityAnswer) {
      return res.status(400).json({ message: "Incorrect security answer" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -securityAnswer");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getCaptcha = async (req, res) => {
  try {
    const captcha = generateCaptcha();
    res.json(captcha);
  } catch (err) {
    res.status(500).json({ message: "Error generating CAPTCHA" });
  }
};

exports.toggleWishlist = async (req, res) => {
  console.log("Toggle Wishlist Request - User ID:", req.user?.id, "Product ID:", req.params.productId);
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.id);
    console.log("Searching for user in DB:", user ? "Found" : "Not Found");

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.wishlist) user.wishlist = [];

    const index = user.wishlist.findIndex(id => id.toString() === productId);
    console.log("Current wishlist index of item:", index);

    if (index === -1) {
      user.wishlist.push(productId);
      await user.save();
      console.log("Item added to wishlist successfully");
      res.json({ message: "Added to wishlist 💖", isWishlisted: true });
    } else {
      user.wishlist.splice(index, 1);
      await user.save();
      console.log("Item removed from wishlist successfully");
      res.json({ message: "Removed from wishlist 💔", isWishlisted: false });
    }
  } catch (err) {
    console.error("Wishlist Toggle Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getWishlist = async (req, res) => {
  console.log("Get Wishlist Request - User ID:", req.user?.id);
  try {
    const user = await User.findById(req.user.id).populate("wishlist");
    console.log("Wishlist items count:", user?.wishlist?.length || 0);
    res.json(user?.wishlist || []);
  } catch (err) {
    console.error("Get Wishlist Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.testWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ 
      userId: req.user.id,
      wishlistLength: user?.wishlist?.length || 0,
      userExists: !!user,
      schemaHasWishlist: !!User.schema.path('wishlist')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
