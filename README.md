# 🎓 CampusKart - University Peer-to-Peer Marketplace

**CampusKart** is a full-stack, real-time peer-to-peer (P2P) marketplace web application tailored for university campus communities. It empowers students, faculty, and staff to securely buy, sell, trade, and donate campus items—including textbooks, electronics, dorm supplies, clothing, and stationery.

The platform includes **real-time Socket.io chat**, **email OTP authentication**, **AI-assisted listing generation and quality verification**, **automated background cleanup and listing expiry**, and a comprehensive **Admin Moderation Suite**.

---

## 📸 Key Features

### 🔐 1. Authentication & Security
* **Email OTP Verification**: Registration and sensitive account operations require a 6-digit One-Time Password sent via Nodemailer (with console log fallback for development).
* **Campus Domain & User Directory Verification**: Restricts and verifies student/faculty campus affiliation against university records.
* **Math CAPTCHA Verification**: Protects signup and account recovery against automated bot submissions.
* **JWT & Session Security**: Secure JSON Web Token authentication with session storage scoping (auto-logout on window/tab close).
* **Password Recovery**: Secure password reset flow backed by email OTP validation.

### 📦 2. Marketplace & Product Discovery
* **Rich Product Catalog**: Multi-image product listings with condition tags (New, Like New, Good, Fair), categories, and pricing.
* **Advanced Search & Filtering**: Instant search by title/description, category filtering, price range limits, and sorting options.
* **Product Management**: Multi-image upload support powered by Multer, listing edit capability, and item status tracking (Available, Pending, Sold).
* **Wishlist & Cart System**: Save items for later or proceed through a streamlined checkout order workflow.
* **Seller Ratings & Reviews**: Interactive rating system for completed transactions.

### 🤖 3. AI-Powered Smart Tools
* **AI Description Generation**: Uses AI integration to generate optimized product titles and engaging item descriptions automatically.
* **Image Quality & Verification**: Evaluates uploaded listing images for clarity, policy compliance, and visual quality scores.

### 💬 4. Real-Time Chat & Notifications
* **Instant Buyer-Seller Messaging**: Socket.io-powered real-time chat with online status indicators and unread counters.
* **In-App Notification Center**: Instant alerts for order updates, new messages, price drops, and administrative announcements.

### 🛡️ 5. Admin Dashboard & Content Moderation
* **Admin Dashboard (`/admin`)**: Real-time analytics, user metrics, active listings count, and system overview.
* **Content Moderation & Reports**: Review reported products and flag/remove listings that violate campus guidelines.
* **User Management**: Search, promote, suspend, or ban user accounts.
* **Broadcast Announcements**: Send platform-wide notifications to all registered campus users.
* **System Audit Logs (`AdminLogs`)**: Detailed tracking of administrative actions for compliance and safety.

### ⏰ 6. Automated Background Tasks
* **Listing Expiry Scheduler**: Automated cron job (`expiryScheduler.js`) that tracks inactive listings and expires them according to platform rules.
* **Uploads Directory Cleanup**: Utility script (`cleanup_uploads.js`) to clear orphaned images and keep disk storage clean.

---

## 🛠️ Technology Stack

| Domain | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, React Router DOM v7, Socket.io Client, Axios, Custom CSS (Dark/Light Design System), Context API |
| **Backend** | Node.js, Express.js (v5), Socket.io, Multer (File Uploads), JWT, BcryptJS |
| **Database** | MongoDB & Mongoose (v9) |
| **Integrations & Utilities** | Nodemailer (SMTP Email Service), OpenAI / HuggingFace API (AI Tools), Node-Cron (Scheduled Tasks) |

---

## 📁 Repository Structure

```
campuskart/
├── backend/
│   ├── controllers/            # Request handlers for auth, products, chat, orders, admin, AI
│   ├── middleware/             # Auth JWT verification, file upload, error handling
│   ├── models/                 # Mongoose schemas (User, Product, Order, Chat, OTP, Report, etc.)
│   ├── routes/                 # Express API routes definition
│   ├── scripts/                # Utility scripts (SeedAdmin, seedUsers, cleanup_uploads)
│   ├── uploads/                # Static storage for product images and user avatars
│   ├── utils/                  # Email OTP service, captcha, expiry scheduler, quality score
│   ├── server.js               # Express application & Socket.io server entry point
│   └── package.json
│
├── frontend/
│   ├── public/                 # Static assets & index.html
│   ├── src/
│   │   ├── Components/         # Reusable UI components (Navbar, Sidebar, ProductCard, Modals)
│   │   ├── context/            # Global React Context providers (ModalContext, AuthContext)
│   │   ├── pages/              # Top-level application pages (Home, Products, AdminDashboard, Chat, etc.)
│   │   ├── styles/             # Modular CSS stylesheets and visual themes
│   │   ├── App.js              # Main route definitions & protected route guards
│   │   └── index.js            # React root renderer
│   └── package.json
│
└── README.md
```

---

## 🚀 Quick Start & Installation

### Prerequisites
* **Node.js**: v16.x or higher
* **npm**: v8.x or higher
* **MongoDB**: A running local instance (`mongodb://localhost:27017`) or a MongoDB Atlas URI connection string.

---

### 1️⃣ Backend Setup

1. Open terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file inside the `backend/` directory:
   ```env
   PORT=5001
   MONGO_URI=mongodb://localhost:27017/campuskart
   JWT_SECRET=your_super_secret_jwt_key
   
   # SMTP Email Configuration (Nodemailer)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_specific_password

   # Optional AI API Key (For AI title & description generation)
   OPENAI_API_KEY=your_openai_api_key
   ```
   > 💡 *Note: If `SMTP_USER` and `SMTP_PASS` are omitted, the backend runs in **Development Mode** and prints OTP codes directly to the terminal console.*

4. **Seed Administrative User**:
   Run the seeding script to create the initial admin account:
   ```bash
   node scripts/SeedAdmin.js
   ```

5. **Seed Campus User Directory** *(Optional)*:
   ```bash
   node scripts/seedUsers.js
   ```

6. **Cleanup Unused Uploads** *(Optional)*:
   ```bash
   npm run cleanup
   ```

7. **Start Backend Server**:
   ```bash
   npm start
   # Or using node directly:
   node server.js
   ```
   Server will start on `http://localhost:5001`.

---

### 2️⃣ Frontend Setup

1. Open a new terminal window and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

4. Open your browser and visit:
   ```
   http://localhost:3000
   ```

---

## 🔑 Default Credentials

### Administrator Account
* **Email**: `admin@banasthali.in`
* **Password**: `admin123`
* **Role**: `admin`
* **Access**: Can log in via `/login` and access `/admin` dashboard.

---

## 📡 API Endpoint Summary

| Module | Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- | :---: |
| **Auth** | `POST` | `/api/auth/send-otp` | Generate & send email verification OTP | ❌ |
| | `POST` | `/api/auth/verify-otp` | Verify OTP code | ❌ |
| | `POST` | `/api/auth/register` | Register new student/faculty account | ❌ |
| | `POST` | `/api/auth/login` | Authenticate user & return JWT | ❌ |
| | `GET` | `/api/auth/profile` | Get current user profile details | ✅ |
| **Products**| `GET` | `/api/products` | Fetch listing catalog with search & filters | ❌ |
| | `GET` | `/api/products/:id` | Get detailed product information | ❌ |
| | `POST` | `/api/products` | Create a new product listing (with images) | ✅ |
| | `PUT` | `/api/products/:id` | Update product details | ✅ |
| | `DELETE`| `/api/products/:id` | Delete product listing | ✅ |
| **Chat** | `GET` | `/api/chat/conversations` | Get user chat threads | ✅ |
| | `GET` | `/api/chat/messages/:id` | Get message history for a conversation | ✅ |
| **Orders** | `POST` | `/api/orders` | Place a new item order | ✅ |
| | `GET` | `/api/orders/my-orders` | Fetch user purchase/sales history | ✅ |
| **Admin** | `GET` | `/api/admin/users` | List and search registered users | ✅ (Admin) |
| | `PUT` | `/api/admin/users/:id/status`| Ban or update user status | ✅ (Admin) |
| | `GET` | `/api/admin-activities` | Retrieve system activity logs | ✅ (Admin) |
| **AI** | `POST` | `/api/ai/generate-description` | AI smart title & description generator | ✅ |
| | `POST` | `/api/ai/verify-images` | AI image quality inspection | ✅ |

---

## 📜 License & Guidelines

This project is built for university campus community trading. All users must adhere to campus trading guidelines. Inappropriate listings, harassment, or counterfeit items are subject to immediate removal and user account suspension by platform administrators.
