const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number },
  category: { type: String },
  condition: { type: String },
  images: [{ type: String }],
  pickupPoint: { type: String },
  yearsUsed: { type: Number },
  status: { type: String, default: "pending", enum: ["pending", "approved", "rejected", "active", "sold", "draft"] },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  isFlagged: { type: Boolean, default: false },
  qualityScore: { type: Number, default: 0 },
  qualityRating: { type: String, default: "Needs Improvement" }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
