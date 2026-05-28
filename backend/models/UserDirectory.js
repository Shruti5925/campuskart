const mongoose = require("mongoose");

const userDirectorySchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  collegeId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
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
  role: {
    type: String,
    enum: ["student", "staff"],
    required: true,
    default: "student"
  }
}, { timestamps: true });

module.exports = mongoose.model("UserDirectory", userDirectorySchema);
