import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import ContactSeller from "./pages/ContactSeller";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import ForgotPassword from "./pages/ForgotPassword";
import SellerGate from "./pages/SellerGate";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import ProductView from "./pages/ProductView";
import Wishlist from "./pages/Wishlist";
import Guidelines from "./pages/Guidelines";
import Navbar from "./Components/Navbar";



/* ================= PROTECTED ROUTE ================= */

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};


/* ================= MAIN APP CONTENT ================= */

const AppContent = () => {
  const location = useLocation();

  // Show navbar on all pages except auth pages
  const hideNavbarPaths = ["/login", "/signup", "/forgot-password"];
  const shouldShowNavbar = !hideNavbarPaths.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar />}

      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products isSeller={false} />} />
        <Route path="/product/:id" element={<ProductView />} />
        <Route path="/contact/:id" element={<ContactSeller />} />
        <Route path="/guidelines" element={<Guidelines />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/sell-gate" element={<SellerGate />} />

        {/* Protected Routes */}
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          }
        />

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
        <Route path="/edit-product/:id" element={<EditProduct />} />

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

      </Routes>
    </>
  );
};


/* ================= ROOT APP ================= */

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;