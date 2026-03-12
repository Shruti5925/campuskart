const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.header("Authorization");
  console.log("Auth Middleware - Header:", authHeader ? "Present" : "Missing");

  if (!authHeader)
    return res.status(401).json({ message: "No token, access denied" });

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id || decoded._id
    };

    console.log("Auth Middleware - Decoded User ID:", req.user.id);
    next();
  } catch (err) {
    console.log("Auth Middleware - JWT Error:", err.message);
    res.status(401).json({ message: "Invalid token" });
  }
};