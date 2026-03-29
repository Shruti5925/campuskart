const Product = require("../models/Product");
const Review = require("../models/Review");
const Notification = require("../models/Notification");
const AdminActivity = require("../models/AdminActivity");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");


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
      status: req.body.status || "pending",
      seller: req.user.id
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error("Create Product Error:", err);
    // Cleanup: Delete uploaded files if DB save fails
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        try {
          const filePath = path.resolve(file.path);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (unlinkErr) {
          console.error("Failed to delete orphaned file:", file.path, unlinkErr);
        }
      });
    }
    res.status(500).json({ message: err.message });
  }
};

// READ ALL
exports.getProducts = async (req, res) => {
  try {
    // Regular users should only see active and explicitly unflagged items, excluding support markers
    const query = { 
      status: "active", 
      isFlagged: false,
      subCategory: { $ne: "support-marker" }
    };
    
    // If user is searching specifically for their own (handled in Dashboard, but good to have)
    // Actually, getProducts is used for the main marketplace.
    
    const products = await Product.find(query)
      .populate("seller", "firstName lastName email gender")
      .select("-__v")
      .sort("-createdAt");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ADMIN PENDING
exports.getAdminPendingProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: "pending" })
      .populate("seller", "firstName lastName email gender profilePhoto collegeId department mobileNumber address")
      .sort("-createdAt");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ADMIN APPROVED
exports.getAdminApprovedProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: { $in: ["approved", "active", "sold"] } })
      .populate("seller", "firstName lastName email gender profilePhoto address")
      .sort("-updatedAt");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ADMIN FLAGGED
exports.getAdminFlaggedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isFlagged: true })
      .populate("seller", "firstName lastName email gender profilePhoto address")
      .sort("-updatedAt");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// APPROVE PRODUCT
exports.approveProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Notify seller
    const notification = new Notification({
        user: product.seller,
        type: "approval",
        title: "Product Approved!",
        message: `Your product "${product.title}" has been approved and is now live on the marketplace.`,
        link: "/dashboard"
    });
    await notification.save();

    // Emit via socket
    const userSocketId = req.users?.get(product.seller.toString());
    if (userSocketId && req.io) {
        req.io.to(userSocketId).emit('new_notification', notification);
    }

    // Log Activity
    console.log("Attempting to log activity for approval...");
    const activity = new AdminActivity({
        admin: req.user.id,
        action: "APPROVED",
        targetType: "Product",
        targetId: product._id,
        targetName: product.title,
        status: "SUCCESSFUL"
    });
    try {
        await activity.save();
        console.log("Activity logged successfully");
    } catch (actErr) {
        console.error("FAILED to save Activity Log:", actErr);
    }

    res.json({ message: "Product approved successfully", product });
  } catch (err) {
    console.error("Approve Product Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// REJECT PRODUCT
exports.rejectProduct = async (req, res) => {
  try {
    const { reason } = req.body;
    console.log("BACKEND REJECT REASON RECEIVED:", reason);
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Notify seller
    const notification = new Notification({
        user: product.seller,
        type: "rejection",
        title: "Product Rejected",
        message: `Your product "${product.title}" was not approved. ${reason ? `Reason: ${reason}` : "Please review our guidelines and try again."}`,
        link: "/dashboard"
    });
    await notification.save();

    // Emit via socket
    const userSocketId = req.users?.get(product.seller.toString());
    if (userSocketId && req.io) {
        req.io.to(userSocketId).emit('new_notification', notification);
    }

    // Log Activity
    console.log("Attempting to log activity for rejection...");
    const activity = new AdminActivity({
        admin: req.user.id,
        action: "REJECTED",
        targetType: "Product",
        targetId: product._id,
        targetName: product.title,
        description: `Reason: ${reason || 'None specified'}`,
        status: "CLOSED"
    });
    try {
        await activity.save();
        console.log("Activity logged successfully");
    } catch (actErr) {
        console.error("FAILED to save Activity Log:", actErr);
    }

    res.json({ message: "Product rejected", product });
  } catch (err) {
    console.error("Reject Product Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// READ ONE
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("seller", "firstName lastName email gender address");

    if (!product) return res.status(404).json({ message: "Product not found" });
    
    // If flagged, only allow owner or admin to see it
    if (product.isFlagged) {
        const userId = req.user ? req.user.id : null;
        const isAdmin = req.user ? req.user.role === 'admin' : false;
        if (userId !== product.seller._id.toString() && !isAdmin) {
            return res.status(403).json({ message: "This product is currently under review by administrators." });
        }
    }

    // Fetch reviews separately to keep them manageable
    const reviews = await Review.find({ product: req.params.id })
      .populate("user", "firstName lastName gender")
      .sort("-createdAt");

    res.json({ ...product.toObject(), reviews });
  } catch (err) {
    console.error("Get Product Error:", err);
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
    console.error("Update Product Error:", err);
    // Cleanup: Delete newly uploaded files if DB update fails
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        try {
          const filePath = path.resolve(file.path);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (unlinkErr) {
          console.error("Failed to delete orphaned file:", file.path, unlinkErr);
        }
      });
    }
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

    // Notify seller about the new review
    const notification = new Notification({
        user: product.seller,
        type: 'info',
        title: 'New Review Received! ⭐',
        message: `Your product "${product.title}" has received a new ${rating}-star review.`,
        link: `/product/${productId}`
    });
    await notification.save();

    // Emit via socket
    const sellerSocketId = req.users?.get(product.seller.toString());
    if (sellerSocketId && req.io) {
        req.io.to(sellerSocketId).emit('new_notification', notification);
    }

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

exports.getAdminStats = async (req, res) => {
  try {
    const dateFilter = process.env.STATS_CUTOFF_DATE 
        ? { createdAt: { $gte: new Date(process.env.STATS_CUTOFF_DATE) } } 
        : {};

    const totalProducts = await Product.countDocuments(dateFilter);
    const pendingApprovals = await Product.countDocuments({ ...dateFilter, status: "pending" });
    const approvedProducts = await Product.countDocuments({ ...dateFilter, status: { $in: ["approved", "active", "sold"] } });
    const flaggedProducts = await Product.countDocuments({ ...dateFilter, isFlagged: true });
    
    // Simple revenue sum (if we have a price field)
    const result = await Product.aggregate([
      { $match: { ...dateFilter, status: "sold" } },
      { $group: { _id: null, totalRevenue: { $sum: "$price" } } }
    ]);
    const totalRevenue = result.length > 0 ? result[0].totalRevenue : 0;

    const User = require("../models/User");
    const totalUsers = await User.countDocuments(dateFilter);

    res.json({
      totalUsers,
      pendingApprovals,
      approvedProducts,
      flaggedProducts,
      totalRevenue
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching stats" });
  }
};

exports.toggleFlag = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    product.isFlagged = !product.isFlagged;
    await product.save();

    // Notify seller about flagging
    const notification = new Notification({
        user: product.seller,
        type: product.isFlagged ? 'rejection' : 'approval',
        title: product.isFlagged ? 'Product Flagged 🚩' : 'Product Unflagged ✅',
        message: product.isFlagged 
            ? `Your product "${product.title}" has been flagged by an administrator for review.`
            : `The flag on your product "${product.title}" has been removed.`,
        link: '/dashboard'
    });
    await notification.save();

    // Emit via socket
    const sellerSocketId = req.users?.get(product.seller.toString());
    if (sellerSocketId && req.io) {
        req.io.to(sellerSocketId).emit('new_notification', notification);
    }

    // Log Activity
    console.log("Attempting to log activity for toggle-flag...");
    const activity = new AdminActivity({
        admin: req.user.id,
        action: product.isFlagged ? "FLAGGED" : "UNFLAGGED",
        targetType: "Product",
        targetId: product._id,
        targetName: product.title,
        status: product.isFlagged ? "ENFORCEMENT" : "SUCCESSFUL"
    });
    try {
        await activity.save();
        console.log(`Activity logged successfully: ${activity.action}`);
    } catch (actErr) {
        console.error("FAILED to save Activity Log (Flag):", actErr);
    }

    res.json({ message: `Product ${product.isFlagged ? 'flagged' : 'unflagged'}`, isFlagged: product.isFlagged });
  } catch (err) {
    console.error("Toggle Flag Error:", err);
    res.status(500).json({ message: "Error toggling flag" });
  }
};

// REPORT PRODUCT (User action)
exports.reportProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Mark as flagged
    product.isFlagged = true;
    await product.save();

    // Notify Admins
    const User = require("../models/User");
    const admins = await User.find({ role: 'admin' });
    
    for (const admin of admins) {
        const notification = new Notification({
            user: admin._id,
            type: 'warning',
            title: 'Product Reported! 🚩',
            message: `The product "${product.title}" has been reported by a user as suspicious.`,
            link: '/admin'
        });
        await notification.save();

        // Socket emit to admin if online
        const adminSocketId = req.users?.get(admin._id.toString());
        if (adminSocketId && req.io) {
            req.io.to(adminSocketId).emit('new_notification', notification);
        }
    }

    res.json({ message: "Product successfully reported to administrators.", isFlagged: true });
  } catch (err) {
    console.error("Report Product Error:", err);
    res.status(500).json({ message: "Error reporting product" });
  }
};

// GET MY PRODUCTS (Personal Dashboard)
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.id })
      .populate("seller", "firstName lastName email")
      .sort("-createdAt");
    res.json(products);
  } catch (err) {
    console.error("Get My Products Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ADMIN: GET ALL REVIEWS
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate({
          path: "user",
          select: "firstName lastName email gender profilePhoto role"
      })
      .populate("product", "title images category price")
      .sort("-createdAt");
    res.json(reviews);
  } catch (err) {
    console.error("Get All Reviews Error:", err);
    res.status(500).json({ message: "Error fetching all reviews" });
  }
};

// ADMIN: DELETE REVIEW
exports.adminDeleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
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

    // Log Activity
    try {
        const activity = new AdminActivity({
            admin: req.user.id,
            action: "DELETED_REVIEW",
            targetType: "Review",
            targetId: review._id,
            description: `Review for product: ${product?.title || 'Unknown'}`,
            status: "SUCCESSFUL"
        });
        await activity.save();
    } catch (logErr) {
        console.error("Activity log error (adminDeleteReview):", logErr);
    }

    res.json({ message: "Review deleted successfully by administrator" });
  } catch (err) {
    console.error("Admin Delete Review Error:", err);
    res.status(500).json({ message: "Error deleting review" });
  }
};

// ADMIN: TOGGLE FLAG
exports.toggleReviewFlag = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    review.isFlagged = !review.isFlagged;
    await review.save();

    // Log Activity
    try {
        const activity = new AdminActivity({
            admin: req.user.id,
            action: review.isFlagged ? "FLAGGED_REVIEW" : "UNFLAGGED_REVIEW",
            targetType: "Review",
            targetId: review._id,
            status: review.isFlagged ? "ENFORCEMENT" : "SUCCESSFUL"
        });
        await activity.save();
    } catch (logErr) {
        console.error("Activity log error (toggleReviewFlag):", logErr);
    }

    res.json({ message: `Review ${review.isFlagged ? 'flagged' : 'unflagged'}`, isFlagged: review.isFlagged });
  } catch (err) {
    console.error("Toggle Review Flag Error:", err);
    res.status(500).json({ message: "Error toggling review flag" });
  }
};

// ADMIN: TOGGLE HELPFUL
exports.toggleReviewHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    review.isHelpful = !review.isHelpful;
    await review.save();

    // Log Activity
    try {
        const activity = new AdminActivity({
            admin: req.user.id,
            action: review.isHelpful ? "MARKED_REVIEW_HELPFUL" : "UNMARKED_REVIEW_HELPFUL",
            targetType: "Review",
            targetId: review._id,
            status: "SUCCESSFUL"
        });
        await activity.save();
    } catch (logErr) {
        console.error("Activity log error (toggleReviewHelpful):", logErr);
    }

    res.json({ message: `Review marked as ${review.isHelpful ? 'helpful' : 'normal'}`, isHelpful: review.isHelpful });
  } catch (err) {
    console.error("Toggle Review Helpful Error:", err);
    res.status(500).json({ message: "Error toggling review helpful status" });
  }
};

// GET USER MARKETPLACE STATS
exports.getUserMarketplaceStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const products = await Product.find({ seller: userId });
    
    const activeCount = products.filter(p => p.status === 'active').length;
    const soldCount = products.filter(p => p.status === 'sold').length;
    
    const totalReviews = products.reduce((acc, p) => acc + (p.reviewCount || 0), 0);
    const weightedRatingSum = products.reduce((acc, p) => acc + ((p.averageRating || 0) * (p.reviewCount || 0)), 0);
    const averageRating = totalReviews > 0 ? (weightedRatingSum / totalReviews).toFixed(1) : "0.0";

    res.json({
      activeCount,
      soldCount,
      averageRating
    });
  } catch (err) {
    console.error("Get User Marketplace Stats Error:", err);
    res.status(500).json({ message: "Error fetching user stats" });
  }
};
