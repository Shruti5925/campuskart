const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  markAsSold,
  addReview,
  getMyReviews,
  deleteReview
} = require("../controllers/productController");
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// READ (ALL)
router.get("/", getProducts);

// REVIEWS
router.get("/my-reviews", protect, getMyReviews);

// READ (ONE)
router.get("/:id", getProduct);

// CREATE
router.post("/", protect, upload.array('images', 5), createProduct);

// UPDATE
router.put("/:id", protect, upload.array('images', 5), updateProduct);

// MARK AS SOLD
router.patch("/:id/sold", protect, markAsSold);

// DELETE
router.delete("/:id", protect, deleteProduct);

// REVIEWS
router.post("/:id/reviews", protect, addReview);
router.delete("/reviews/:id", protect, deleteReview);

module.exports = router;
