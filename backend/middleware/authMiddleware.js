const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  const fs = require('fs');
  const path = require('path');
  const logFile = path.join(__dirname, "../debug_api.log");

  if (!authHeader) {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] AUTH FAILED: No token header\n`);
    return res.status(401).json({ message: "No token, access denied" });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    const User = require("../models/User");
    const user = await User.findById(decoded.id);
    if (!user) {
      fs.appendFileSync(logFile, `[${new Date().toISOString()}] AUTH FAILED: User not found in DB\n`);
      return res.status(401).json({ message: "User not found, access denied" });
    }

    if (user.accountStatus === 'expired') {
      return res.status(403).json({ message: "Your CampusKart account has expired.", isExpired: true });
    }

    if (user.role === 'student') {
      const now = new Date();
      if (now > user.accountExpiryDate) {
        if (user.accountStatus !== 'expired') {
          user.accountStatus = 'expired';
          await user.save();
          
          try {
            const Notification = require("../models/Notification");
            const expiryNotification = new Notification({
              user: user._id,
              type: "info",
              title: "Account Expired ❌",
              message: "Your CampusKart account has expired as your graduation year has passed.",
              link: "/profile"
            });
            await expiryNotification.save();
          } catch (notifErr) {
            console.error("Failed to save middleware-triggered expiry notification:", notifErr);
          }
        }
        return res.status(403).json({ message: "Your CampusKart account has expired.", isExpired: true });
      }
    }

    next();
  } catch (err) {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] AUTH FAILED: ${err.message} Token: ${token.substring(0, 20)}...\n`);
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: "Access denied: Admin only" });
  }
};

module.exports.checkSuspended = async (req, res, next) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isSuspended) {
      return res.status(403).json({ 
        message: "Your account is suspended. You cannot perform this action.",
        isSuspended: true 
      });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: "Server error checking status" });
  }
};

module.exports.checkVerified = async (req, res, next) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Always allow admins to perform actions
    if (user.role === 'admin') return next();

    // Removed manual verification block since users are verified upon signup
    next();
  } catch (err) {
    res.status(500).json({ message: "Server error checking verification status" });
  }
};
