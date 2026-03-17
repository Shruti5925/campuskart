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
import { useLocation, Navigate } from "react-router-dom";
import ScrollToTop from "./Components/ScrollToTop";
import Navbar from "./Components/Navbar";


const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
};

const AppContent = () => {
  const location = useLocation();
  const showNavbarPaths = ["/", "/login", "/signup", "/products", "/wishlist", "/guidelines", "/cart"];
  const shouldShowNavbar = showNavbarPaths.includes(location.pathname) ||
    location.pathname.startsWith("/product/");

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
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
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route path="/guidelines" element={<Guidelines />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

