const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    middleName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"]
    },
    address: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["student", "staff", "admin"],
      required: true
    },
    collegeId: {
      type: String,
      required: true
    },
    department: {
      type: String,
      required: true
    },
    mobileNumber: {
      type: String,
      required: true
    },
    securityQuestion: {
      type: String,
      required: true
    },
    securityAnswer: {
      type: String,
      required: true
    },

    // ✅ Avatar (Saved permanently)
    avatar: {
      type: String,
      default: "Aneka"
    },

    // ✅ Wishlist
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);