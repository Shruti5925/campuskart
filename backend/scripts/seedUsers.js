const mongoose = require("mongoose");
const UserDirectory = require("../models/UserDirectory");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    const users = [
      {
        email: "test1@banasthali.in",
        collegeId: "BT2021001",
        firstName: "Anjali",
        lastName: "Sharma",
        gender: "Female",
        role: "student"
      },
      {
        email: "test2@banasthali.in",
        collegeId: "BT2021002",
        firstName: "Riya",
        lastName: "Verma",
        gender: "Female",
        role: "student"
      },
      {
        email: "test3@banasthali.in",
        collegeId: "BT2021003",
        firstName: "Sneha",
        lastName: "Gupta",
        gender: "Female",
        role: "student"
      },
      {
        email: "staff1@banasthali.in",
        collegeId: "EMP2021001",
        firstName: "Dr. Anita",
        lastName: "Mehta",
        gender: "Female",
        role: "staff"
      },
      {
        email: "staff2@banasthali.in",
        collegeId: "EMP2021002",
        firstName: "Prof. Rajesh",
        lastName: "Kumar",
        gender: "Male",
        role: "staff"
      }
    ];

    await UserDirectory.insertMany(users);
    console.log("User directory seeded successfully! ✅");
    process.exit();
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seedUsers();
