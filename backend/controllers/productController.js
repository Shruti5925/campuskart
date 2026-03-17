const Product = require("../models/Product");
const Review = require("../models/Review");

// CREATE
exports.createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };

    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => `http://localhost:5001/${file.path.replace(/\\/g, "/")}`);
    }

    // Clean up empty strings for Number fields or optional fields
    Object.keys(productData).forEach(key => {
      if (productData[key] === "") {
        delete productData[key];
      }
    });

    const product = new Product({
      ...productData,
      seller: req.user.id
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error("Create Product Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// READ ALL
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("seller", "firstName lastName email gender")
      .select("-__v");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// READ ONE
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("seller", "firstName lastName email gender");

    if (!product) return res.status(404).json({ message: "Product not found" });

    // Fetch reviews separately to keep them manageable
    const reviews = await Review.find({ product: req.params.id })
      .populate("user", "firstName lastName gender")
      .sort("-createdAt");

    res.json({ ...product.toObject(), reviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check ownership
    if (product.seller.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized to update this product" });
    }

    const productData = { ...req.body };
    let finalImages = [];

    // 1. Get existing images that the user kept (passed from frontend)
    if (req.body.existingImages) {
      finalImages = Array.isArray(req.body.existingImages)
        ? req.body.existingImages
        : [req.body.existingImages];
    }

    // 2. Add new uploaded files
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `http://localhost:5001/${file.path.replace(/\\/g, "/")}`);
      finalImages = [...finalImages, ...newImages];
    }

    // 3. Update the images field if we have a set of images (even if empty, maybe user deleted all?)
    // Actually, if the user didn't change anything, they won't send req.files,
    // and if they didn't touch images, req.body.existingImages should match DB.
    // If BOTH are missing, we assume no change to images unless specifically handled.
    if (req.body.existingImages !== undefined || (req.files && req.files.length > 0)) {
      productData.images = finalImages;
    }

    // Clean up empty strings
    Object.keys(productData).forEach(key => {
      if (productData[key] === "") {
        delete productData[key];
      }
    });

    // Remove existingImages from productData so it doesn't get saved as a separate field in DB if the model doesn't have it
    delete productData.existingImages;

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check ownership
    if (product.seller.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized to delete this product" });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// MARK AS SOLD
exports.markAsSold = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Check ownership
    if (product.seller.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized to update this product" });
    }

    product.status = "sold";
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ADD REVIEW
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    if (!rating || !comment) {
      return res.status(400).json({ message: "Rating and comment are required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user is the seller
    if (product.seller.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot review your own product" });
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({ product: productId, user: req.user.id });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    const review = new Review({
      product: productId,
      user: req.user.id,
      rating: Number(rating),
      comment
    });

    await review.save();

    // Update Product average rating and review count
    const reviews = await Review.find({ product: productId });
    product.reviewCount = reviews.length;
    product.averageRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    await product.save();

    const populatedReview = await review.populate("user", "firstName lastName gender");
    res.status(201).json(populatedReview);
  } catch (err) {
    console.error("Add Review Error:", err);
    res.status(500).json({ message: err.message });
  }
};
// GET MY REVIEWS
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate("product", "title price images image")
      .sort("-createdAt");
    res.json(reviews);
  } catch (err) {
    console.error("Get My Reviews Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE REVIEW
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check ownership
    if (review.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized to delete this review" });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(req.params.id);

    // Update Product average rating and review count
    const product = await Product.findById(productId);
    if (product) {
      const remainingReviews = await Review.find({ product: productId });
      product.reviewCount = remainingReviews.length;
      product.averageRating = remainingReviews.length > 0
        ? remainingReviews.reduce((acc, item) => item.rating + acc, 0) / remainingReviews.length
        : 0;
      await product.save();
    }

    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error("Delete Review Error:", err);
    res.status(500).json({ message: err.message });
  }
};
