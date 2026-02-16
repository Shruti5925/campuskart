const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));

const seedUser = async () => {
    try {
        // Check if user exists
        const existingUser = await User.findOne({ email: "admin@example.com" });
        if (existingUser) {
            console.log("User already exists");
            process.exit();
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);

        // Create user
        const newUser = new User({
            name: "Admin User",
            email: "admin@example.com",
            password: hashedPassword,
            role: "admin",
        });

        await newUser.save();
        console.log("User seeded successfully");
        console.log("Email: admin@example.com");
        console.log("Password: password123");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedUser();
