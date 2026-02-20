const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
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
  gender: {
   type: String,
   enum: ["male", "female", "other"],
   required: true
   },
  securityQuestion: {
    type: String,
    required: true
  },
  securityAnswer: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("User", userSchema);
