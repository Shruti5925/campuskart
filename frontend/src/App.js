import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";

import Signup from "./pages/Signup";
import Home from "./pages/Home";
import ForgotPassword from "./pages/ForgotPassword";
import SellerGate from "./pages/SellerGate";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import ProductView from "./pages/ProductView";
import Wishlist from "./pages/Wishlist";
import Guidelines from "./pages/Guidelines";
import Cart from "./pages/Cart";
import Messages from "./pages/Messages";
import Orders from "./pages/Orders";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogs from "./pages/AdminLogs";
import AdminNotifications from "./pages/AdminNotifications";
import Notifications from "./pages/Notifications";
import Support from "./pages/Support";
import { useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";
import ScrollToTop from "./Components/ScrollToTop";
import Navbar from "./Components/Navbar";
import { ModalProvider } from "./context/ModalContext";
import CustomModal from "./Components/CustomModal";


const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const token = sessionStorage.getItem("token");
  const location = useLocation();
  
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.role !== 'admin') return <Navigate to="/dashboard" replace />;
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const HomeRoute = () => {
    return <Home />;
};

const AppContent = () => {
  const location = useLocation();
  const token = sessionStorage.getItem("token");
  let isAdmin = false;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      isAdmin = payload.role === 'admin';
    } catch (e) {}
  }

  const showNavbarPaths = ["/", "/login", "/signup", "/products", "/wishlist", "/guidelines", "/cart"];
  const shouldShowNavbar = (showNavbarPaths.includes(location.pathname) ||
    location.pathname.startsWith("/product/")) && 
    location.pathname !== "/admin" && 
    !(location.pathname === "/" && isAdmin);

  return (
    <>
      <CustomModal />
      {shouldShowNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/product/:id" element={<ProductView />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/sell-gate" element={<SellerGate />} />
        <Route path="/products" element={<Products isSeller={false} />} />
        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/want-to-sell"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-product"
          element={
            <ProtectedRoute>
              <AddProduct />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit/:id"
          element={
            <ProtectedRoute>
              <EditProduct />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/logs"
          element={
            <AdminRoute>
              <AdminLogs />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <AdminRoute>
              <AdminNotifications />
            </AdminRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route path="/guidelines" element={<Guidelines />} />
        <Route path="/support" element={<Support />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <ModalProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AppContent />
      </BrowserRouter>
    </ModalProvider>
  );
}

export default App;
