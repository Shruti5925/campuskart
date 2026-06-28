const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  middleName: {
    type: String,
    required: false
  },
  lastName: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ["Male", "Female", "Other"]
  },
  address: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
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
    required: false
  },
  securityAnswer: {
    type: String,
    required: false,
    trim: true
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  cart: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    }
  }],
  profilePhoto: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  graduationYear: {
    type: Number,
    required: function() { return this.role === 'student'; }
  },
  accountExpiryDate: {
    type: Date,
    required: function() { return this.role === 'student'; }
  },
  accountStatus: {
    type: String,
    enum: ["active", "expired"],
    default: "active"
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
