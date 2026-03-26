const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  reporter: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  targetType: { 
    type: String, 
    enum: ["product", "user", "review"], 
    required: true 
  },
  targetId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    refPath: "targetModel"
  },
  targetModel: {
    type: String,
    required: true,
    enum: ["Product", "User", "Review"]
  },
  reason: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ["pending", "resolved", "dismissed"], 
    default: "pending" 
  },
  adminNotes: {
    type: String
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

module.exports = mongoose.model("Report", reportSchema);
