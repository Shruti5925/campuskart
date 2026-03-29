const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Product = require("../models/Product");
const User = require("../models/User");

const cleanup = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected. Scanning database for used files...");

    // 1. Collect all referenced files from Products
    const products = await Product.find({}, "images image");
    const usedFiles = new Set();

    products.forEach(p => {
      if (p.images && p.images.length > 0) {
        p.images.forEach(img => {
          // Extract filename from URL (e.g. http://localhost:5001/uploads/123.jfif)
          const parts = img.split("/");
          usedFiles.add(parts[parts.length - 1]);
        });
      }
      if (p.image) {
        const parts = p.image.split("/");
        usedFiles.add(parts[parts.length - 1]);
      }
    });

    // 2. Collect all referenced files from Users (avatars)
    const users = await User.find({}, "profilePhoto");
    users.forEach(u => {
      if (u.profilePhoto) {
        const parts = u.profilePhoto.split("/");
        usedFiles.add(parts[parts.length - 1]);
      }
    });

    console.log(`Found ${usedFiles.size} unique files referenced in database.`);

    // 3. Scan directories and delete orphans
    const directories = [
      path.join(__dirname, "../uploads"),
      path.join(__dirname, "../uploads/avatars")
    ];

    let deletedCount = 0;
    let keptCount = 0;

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        
        // Skip subdirectories (like avatars/)
        if (fs.lstatSync(filePath).isDirectory()) return;

        if (!usedFiles.has(file)) {
          console.log(`Deleting orphaned file: ${file}`);
          fs.unlinkSync(filePath);
          deletedCount++;
        } else {
          keptCount++;
        }
      });
    });

    console.log("-----------------------------------------");
    console.log(`Cleanup complete!`);
    console.log(`Kept: ${keptCount} files`);
    console.log(`Deleted: ${deletedCount} orphaned files`);
    console.log("-----------------------------------------");

    process.exit(0);
  } catch (err) {
    console.error("Cleanup Error:", err);
    process.exit(1);
  }
};

cleanup();
