const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    const adminEmail = "admin@banasthali.in";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      existingAdmin.password = await bcrypt.hash("admin123", salt);
      await existingAdmin.save();
      console.log("Admin account password updated to admin123! 🚀");
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    const adminUser = new User({
      firstName: "System",
      lastName: "Admin",
      gender: "Other",
      address: "Campus View",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      collegeId: "ADMIN001",
      department: "Administration",
      mobileNumber: "0000000000",
      securityQuestion: "What is your role?",
      securityAnswer: "Administrator"
    });

    await adminUser.save();
    console.log("Admin account created successfully! 🚀");
    console.log("Email: admin@banasthali.in");
    console.log("Password: admin123");
    process.exit(0);
  } catch (err) {
    console.error("Seeding Error:", err);
    process.exit(1);
  }
};

seedAdmin();
