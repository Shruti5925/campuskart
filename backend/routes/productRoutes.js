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
const upload = require("../middleware/uploadMiddleware");

// READ (ALL)
router.get("/", getProducts);

// READ (ONE)
router.get("/:id", getProduct);

// CREATE
router.post("/", protect, upload.single('image'), createProduct);

// UPDATE
router.put("/:id", protect, upload.single('image'), updateProduct);

// DELETE
router.delete("/:id", protect, deleteProduct);

//EDIT
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

router.put("/:id", upload.single("image"), updateProduct);

module.exports = router;
