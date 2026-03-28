const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const PORT = process.env.PORT || 5001;

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const chatRoutes = require("./routes/chatRoutes");
const orderRoutes = require("./routes/orderRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminActivityRoutes = require("./routes/adminActivityRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT"]
  }
});

// Track connected users
const users = new Map();

io.on("connection", (socket) => {
  console.log("User connected to socket:", socket.id);

  socket.on("register", (userId) => {
    users.set(userId, socket.id);
    console.log("Registered user", userId, "with socket", socket.id);
  });

  socket.on("disconnect", () => {
    for (let [userId, socketId] of users.entries()) {
      if (socketId === socket.id) {
        users.delete(userId);
        console.log("User disconnected and removed from registry:", userId);
        break;
      }
    }
  });
});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Expose io and users map to API routes
app.use((req, res, next) => {
  req.io = io;
  req.users = users;
  next();
});

// Routes
console.log("Mounting /api/auth...");
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin-activities", adminActivityRoutes);
app.use("/api/reports", reportRoutes);

const Subscription = require("./models/Subscription");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err));

// Subscription API
app.post("/api/subscribe", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const newSubscription = new Subscription({ email });
    await newSubscription.save();
    res.status(201).json({ message: "Successfully subscribed!" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already subscribed" });
    }
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});


// Start Server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
