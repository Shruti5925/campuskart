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
  deleteReview,
  getAdminPendingProducts,
  approveProduct,
  rejectProduct,
  getMyProducts,
  reportProduct,
  getUserMarketplaceStats
} = require("../controllers/productController");
const protect = require("../middleware/authMiddleware");
const { adminOnly, checkSuspended, checkVerified } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// READ (ALL)
router.get("/", getProducts);

// REVIEWS
router.get("/my-reviews", protect, getMyReviews);
router.get("/my-products", protect, getMyProducts);

// READ (ONE)
router.get("/:id", getProduct);

// CREATE
router.post("/", protect, checkSuspended, checkVerified, upload.array('images', 5), createProduct);

// UPDATE
router.put("/:id", protect, checkSuspended, checkVerified, upload.array('images', 5), updateProduct);

// MARK AS SOLD
router.patch("/:id/sold", protect, checkSuspended, checkVerified, markAsSold);

// DELETE
router.delete("/:id", protect, checkSuspended, checkVerified, deleteProduct);

// REVIEWS
router.post("/:id/reviews", protect, checkSuspended, checkVerified, addReview);
router.delete("/reviews/:id", protect, deleteReview);

// REPORT
router.post("/:id/report", protect, checkVerified, reportProduct);

// ADMIN ROUTES
router.get("/admin/pending", protect, adminOnly, getAdminPendingProducts);
router.get("/admin/approved", protect, adminOnly, (req, res) => {
    const { getAdminApprovedProducts } = require("../controllers/productController");
    getAdminApprovedProducts(req, res);
});
router.get("/admin/flagged", protect, adminOnly, (req, res) => {
    const { getAdminFlaggedProducts } = require("../controllers/productController");
    getAdminFlaggedProducts(req, res);
});
router.get("/admin/reviews", protect, adminOnly, (req, res) => {
    const { getAllReviews } = require("../controllers/productController");
    getAllReviews(req, res);
});

router.delete("/admin/reviews/:id", protect, adminOnly, (req, res) => {
    const { adminDeleteReview } = require("../controllers/productController");
    adminDeleteReview(req, res);
});

router.patch("/admin/reviews/:id/flag", protect, adminOnly, (req, res) => {
    const { toggleReviewFlag } = require("../controllers/productController");
    toggleReviewFlag(req, res);
});
router.patch("/admin/reviews/:id/helpful", protect, adminOnly, (req, res) => {
    const { toggleReviewHelpful } = require("../controllers/productController");
    toggleReviewHelpful(req, res);
});
router.get("/admin/stats", protect, adminOnly, (req, res) => {
    const { getAdminStats } = require("../controllers/productController");
    getAdminStats(req, res);
});
router.patch("/:id/approve", protect, adminOnly, approveProduct);
router.patch("/:id/reject", protect, adminOnly, rejectProduct);
router.patch("/:id/toggle-flag", protect, adminOnly, (req, res) => {
    const { toggleFlag } = require("../controllers/productController");
    toggleFlag(req, res);
});

router.get("/admin/user-stats/:userId", protect, adminOnly, getUserMarketplaceStats);

module.exports = router;
