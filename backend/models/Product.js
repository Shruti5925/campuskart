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
  status: { type: String, default: "active", enum: ["active", "sold", "draft"] },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
