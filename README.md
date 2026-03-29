# 🎓 CampusKart - University Marketplace

A premium, real-time marketplace designed for university campuses. Buy, sell, and trade items securely with your fellow students.

## 🚀 Quick Start Guide

Follow these steps to get the project running on your local machine.

### 📋 Prerequisites
* **Node.js**: v16+ recommended
* **MongoDB**: A local instance or MongoDB Atlas URI
* **npm**: Installed with Node.js

---

### 🛠️ 1. Backend Setup

1. **Navigate to backend**:
   ```bash
   cd backend
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment**:
   Create a `.env` file in the `backend` folder and add:
   ```env
   PORT=5001
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   ```
4. **Seed Administrative User**:
   Run this to create the default admin account:
   ```bash
   node scripts/SeedAdmin.js
   ```
   *Default Admin: `admin@banasthali.in` / `Admin@CampusKart2026`*

5. **Cleanup Orphaned Files** (*Optional*):
   If you notice unexpected images in the `uploads` folder, run:
   ```bash
   npm run cleanup
   ```

6. **Start the server**:
   ```bash
   node server.js
   ```

---

### 🎨 2. Frontend Setup

1. **Navigate to frontend** (in a new terminal):
   ```bash
   cd frontend
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the application**:
   ```bash
   npm start
   ```
   The site will open at `http://localhost:3000`.

---

## ✨ Features
* **Modern Dashboard**: Clean management interface for admins and students.
* **Real-time Chat**: Connect instantly with sellers.
* **Review System**: Rate and review products and sellers.
* **Session Security**: Fresh start logout (clears on tab close).

## 🔒 Administrative Access
To access the Admin Panel:
1. Login with the seeded admin credentials.
2. Navigate to the "Admin Dashboard" from the sidebar.
