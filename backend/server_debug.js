const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[DEBUG_SERVER] ${req.method} ${req.url}`);
    next();
});

// Routes
console.log("[DEBUG_SERVER] Mounting /api/auth...");
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

// Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("[DEBUG_SERVER] MongoDB connected"))
    .catch(err => console.log("[DEBUG_SERVER] MongoDB connection error:", err));

const PORT = 5001; // Use 5001 to avoid conflict
app.listen(PORT, () => console.log(`[DEBUG_SERVER] Running on port ${PORT}`));
