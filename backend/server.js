// ✅ Load environment variables
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

// ✅ Import routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const chatRoutes = require("./routes/chatRoutes");
const orderRoutes = require("./routes/orderRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminActivityRoutes = require("./routes/adminActivityRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const reportRoutes = require("./routes/reportRoutes");

// ✅ NEW AI ROUTE
const aiRoutes = require("./routes/aiRoutes");

const app = express();
const server = http.createServer(app);

// ✅ Socket.io setup
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
        console.log("User disconnected:", userId);
        break;
      }
    }
  });
});

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Make socket available in routes
app.use((req, res, next) => {
  req.io = io;
  req.users = users;
  next();
});

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin-activities", adminActivityRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin/users", adminUserRoutes);

// ✅ ADD THIS (AI ROUTE)
app.use("/api/ai", aiRoutes);

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));



// ✅ Start server
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});