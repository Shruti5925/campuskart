const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");
const protect = require("../middleware/authMiddleware");

// READ (ALL)
router.get("/", getProducts);

// READ (ONE)
router.get("/:id", getProduct);

// CREATE
router.post("/", protect, createProduct);

// UPDATE
router.put("/:id", protect, updateProduct);

// DELETE
router.delete("/:id", protect, deleteProduct);

module.exports = router;
