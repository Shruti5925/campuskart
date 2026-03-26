const User = require("../models/User");
const Product = require("../models/Product");
const Notification = require("../models/Notification");
const AdminActivity = require("../models/AdminActivity");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateCaptcha, verifyCaptcha } = require("../utils/captcha");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Multer config for profile photo uploads
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/avatars");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
  }
});
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  }
});

exports.avatarUploadMiddleware = avatarUpload.single("profilePhoto");

exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const photoUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePhoto: photoUrl },
      { new: true }
    ).select("-password -securityAnswer");
    res.json({ message: "Profile photo updated", profilePhoto: photoUrl, user });
  } catch (err) {
    console.error("Upload Photo Error:", err);
    res.status(500).json({ message: "Server error uploading photo" });
  }
};

exports.removeProfilePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    // Delete the old file if it exists
    if (user.profilePhoto) {
      const filePath = path.join(__dirname, "..", user.profilePhoto);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    user.profilePhoto = null;
    await user.save();
    res.json({ message: "Profile photo removed", user });
  } catch (err) {
    res.status(500).json({ message: "Server error removing photo" });
  }
};

exports.signup = async (req, res) => {
  console.log("Signup Request Body:", req.body);
  const {
    firstName,
    middleName,
    lastName,
    gender,
    address,
    email: rawEmail,
    password: rawPassword,
    role,
    collegeId,
    department,
    mobileNumber,
    securityQuestion,
    securityAnswer: rawSecurityAnswer,
    captchaToken,
    captchaAnswer,
  } = req.body;

  const email = rawEmail?.trim().toLowerCase();
  const password = rawPassword?.trim();
  const securityAnswer = rawSecurityAnswer?.trim();

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
      role: role === 'admin' ? 'student' : (role || 'student'), // Restrict admin role from signup
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
    const { email: rawEmail, password: rawPassword } = req.body;
    const email = rawEmail?.trim().toLowerCase();
    const password = rawPassword?.trim();

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

    res.json({ message: "Login successful", token, role: user.role, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getSecurityQuestion = async (req, res) => {
  try {
    const { email: rawEmail } = req.body;
    const email = rawEmail?.trim().toLowerCase();
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
    const { email: rawEmail, securityAnswer: rawSecurityAnswer, newPassword: rawNewPassword } = req.body;
    const email = rawEmail?.trim().toLowerCase();
    const securityAnswer = rawSecurityAnswer?.trim();
    const newPassword = rawNewPassword?.trim();
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

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, middleName, lastName, mobileNumber, address, avatarUrl } = req.body;
    
    // Create an object with only the fields we want to allow updating
    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (middleName !== undefined) updateFields.middleName = middleName;
    if (lastName) updateFields.lastName = lastName;
    if (mobileNumber) updateFields.mobileNumber = mobileNumber;
    if (address) updateFields.address = address;
    if (avatarUrl) updateFields.avatarUrl = avatarUrl;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password -securityAnswer");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ message: "Server error updating profile" });
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
      await User.updateOne(
        { _id: req.user.id },
        { $addToSet: { wishlist: productId } }
      );
      console.log("Item added to wishlist successfully");
      res.json({ message: "Added to wishlist 💖", isWishlisted: true });
    } else {
      await User.updateOne(
        { _id: req.user.id },
        { $pull: { wishlist: productId } }
      );
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

// Cart Controllers
exports.addToCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const Product = require("../models/Product");
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Prevent seller from buying their own product
    if (product.seller.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot add your own product to the cart" });
    }

    console.log(`[DEBUG] Adding to cart. User: ${req.user.id}, Product: ${productId}`);

    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user.id, "cart.product": { $ne: productId } },
      { $push: { cart: { product: productId, quantity: 1 } } },
      { new: true }
    );

    if (!updatedUser) {
      // Either user does not exist or product is already in cart
      const existingUser = await User.findById(req.user.id);
      if (!existingUser) return res.status(404).json({ message: "User not found" });
      return res.status(400).json({ message: "Product is already in your cart" });
    }

    console.log(`[DEBUG] Cart after save:`, JSON.stringify(updatedUser.cart, null, 2));
    res.json({ message: "Added to cart 🛒", cart: updatedUser.cart });
  } catch (err) {
    console.error("Add to Cart Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.cart) user.cart = [];
    user.cart = user.cart.filter(item => item.product && item.product.toString() !== productId);
    await user.save();
    res.json({ message: "Removed from cart 🗑️", cart: user.cart });
  } catch (err) {
    console.error("Remove from Cart Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getCart = async (req, res) => {
  try {
    console.log(`[DEBUG] Fetching cart for User: ${req.user.id}`);
    const user = await User.findById(req.user.id).populate({
      path: "cart.product",
      populate: { path: "seller", select: "firstName lastName gender email mobileNumber department" }
    });
    console.log(`[DEBUG] Populated user cart:`, JSON.stringify(user?.cart, null, 2));
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.cart) user.cart = [];

    // Filter out items where product no longer exists and remove duplicates
    const validCart = [];
    const seenProducts = new Set();

    for (const item of user.cart) {
      if (item.product && item.product._id) {
        const productIdStr = item.product._id.toString();
        if (!seenProducts.has(productIdStr)) {
          seenProducts.add(productIdStr);
          validCart.push(item);
        }
      }
    }

    if (validCart.length !== user.cart.length) {
      user.cart = validCart;
      await user.save();
    }

    res.json(user.cart);
  } catch (err) {
    console.error("Get Cart Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) return res.status(400).json({ message: "Quantity must be at least 1" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const cartItem = user.cart.find(item => item.product && item.product.toString() === productId);
    if (!cartItem) return res.status(404).json({ message: "Product not in cart" });

    cartItem.quantity = quantity;
    await user.save();

    res.json({ message: "Quantity updated", cart: user.cart });
  } catch (err) {
    console.error("Update Cart Quantity Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -securityAnswer").sort("-createdAt");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { isVerified, isSuspended } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isVerified, isSuspended } },
      { new: true }
    ).select("-password -securityAnswer");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Create notification for status change
    let notifTitle = "Account Update";
    let notifMessage = "Your account status has been updated.";
    
    if (isSuspended !== undefined) {
        notifTitle = isSuspended ? "Account Suspended" : "Account Reactivated";
        notifMessage = isSuspended 
            ? "Your account has been suspended for violating community guidelines." 
            : "Your account has been reactivated. You can now resume using the marketplace.";
    } else if (isVerified !== undefined) {
        notifTitle = isVerified ? "Identity Verified" : "Verification Status Updated";
        notifMessage = isVerified
            ? "Your identity has been successfully verified! You've earned the verified badge."
            : "Your verification status has been updated.";
    }

    const notification = new Notification({
        user: req.params.id,
        type: isSuspended ? "suspension" : "info",
        title: notifTitle,
        message: notifMessage,
        link: "/profile"
    });
    await notification.save();
    console.log(`Notification created for user ${req.params.id}: ${notifTitle}`);

    // Emit via socket if user is online
    // Emit via socket if user is online
    const userSocketId = req.users?.get(req.params.id.toString());
    console.log(`Socket lookup for user ${req.params.id}: ${userSocketId || 'Not Online'}`);
    
    if (userSocketId && req.io) {
        req.io.to(userSocketId).emit('new_notification', notification);
        console.log(`Socket emission sent to ${userSocketId}`);
    }

    // Log Activity
    console.log("Attempting to log activity for user status update...");
    let actionType = "UPDATED";
    let activityStatus = "SUCCESSFUL";

    if (isSuspended !== undefined) {
        actionType = isSuspended ? "SUSPENDED" : "REACTIVATED";
        activityStatus = "ENFORCEMENT";
    } else if (isVerified !== undefined) {
        actionType = "VERIFIED";
        activityStatus = "SUCCESSFUL";
    }

    const activity = new AdminActivity({
        admin: req.user.id,
        action: actionType,
        targetType: "User",
        targetId: user._id,
        targetName: `${user.firstName} ${user.lastName}`,
        status: activityStatus
    });
    try {
        await activity.save();
        console.log(`Activity logged successfully: ${actionType}`);
    } catch (actErr) {
        console.error("FAILED to save Activity Log (Auth):", actErr);
    }

    res.json({ message: "User status updated", user });
  } catch (err) {
    console.error("Update User Status Error:", err);
    res.status(500).json({ message: "Server error updating status" });
  }
};
exports.adminUpdateUser = async (req, res) => {
  try {
    const { firstName, middleName, lastName, role, department, collegeId, mobileNumber, address } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update fields if provided
    if (firstName) user.firstName = firstName;
    if (middleName !== undefined) user.middleName = middleName;
    if (lastName) user.lastName = lastName;
    if (role) user.role = role;
    if (department) user.department = department;
    if (collegeId) user.collegeId = collegeId;
    if (mobileNumber) user.mobileNumber = mobileNumber;
    if (address) user.address = address;

    await user.save();

    // Log Activity
    try {
        const activity = new AdminActivity({
            admin: req.user.id,
            action: "UPDATED_USER_PROFILE",
            targetType: "User",
            targetId: user._id,
            targetName: `${user.firstName} ${user.lastName}`,
            status: "SUCCESSFUL"
        });
        await activity.save();
    } catch (logErr) {
        console.error("Activity log error (adminUpdateUser):", logErr);
    }

    res.json({ message: "User profile updated successfully", user: {
      _id: user._id,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      role: user.role,
      department: user.department,
      collegeId: user.collegeId,
      mobileNumber: user.mobileNumber,
      address: user.address,
      isVerified: user.isVerified,
      isSuspended: user.isSuspended
    }});
  } catch (err) {
    console.error("Admin Update User Error:", err);
    res.status(500).json({ message: "Server error updating user profile" });
  }
};

exports.getSupportAdmin = async (req, res) => {
  try {
    // Find the first user with 'admin' role
    const admin = await User.findOne({ role: 'admin' }).select('firstName lastName avatar gender');
    
    if (!admin) {
      return res.status(404).json({ message: "No administration staff found." });
    }

    res.json({
      adminId: admin._id,
      productId: null,
      adminName: `${admin.firstName} ${admin.lastName}`
    });
  } catch (err) {
    console.error("Get Support Admin Error:", err);
    res.status(500).json({ message: "Server error retrieving support staff" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -securityAnswer");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Error fetching user" });
  }
};
