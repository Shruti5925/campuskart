const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET seller by ID
router.get("/:id", async (req, res) => {
  try {
    const seller = await User.findById(req.params.id).select("-password");

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.json(seller);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
