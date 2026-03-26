const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
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

    if (!user.isVerified) {
      return res.status(403).json({ 
        message: "Your account is pending approval by an administrator. You will be able to perform this action once approved.",
        isUnverified: true 
      });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: "Server error checking verification status" });
  }
};
