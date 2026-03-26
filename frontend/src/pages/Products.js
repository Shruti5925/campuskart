import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useModal } from "../context/ModalContext";
import ProductCard from "../Components/ProductCard";
import Footer from "../Components/Footer";
import "../styles/Products.css";
import "../styles/Dashboard.css";

const Products = ({ isSeller = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const searchInputRef = useRef(null);
  const { showModal } = useModal();

  // Products and loading state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);

  // State managed by URL (synchronized via useEffect)
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Sync state with URL params
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const categoryFromUrl = queryParams.get("category") || "All";
    const searchFromUrl = queryParams.get("search") || "";
    const maxPriceFromUrl = queryParams.get("maxPrice") || "";

    setSelectedCategory(categoryFromUrl);
    setSearchTerm(searchFromUrl);
    setMaxPrice(maxPriceFromUrl);
  }, [location.search]);

  useEffect(() => {
    fetchProducts();
    fetchWishlist();
    
    window.addEventListener('wishlistUpdated', fetchWishlist);
    return () => window.removeEventListener('wishlistUpdated', fetchWishlist);
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/products");
      setProducts(res.data);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const queryParams = new URLSearchParams(location.search);
    if (searchTerm) {
      queryParams.set("search", searchTerm);
    } else {
      queryParams.delete("search");
    }
    navigate(`/products?${queryParams.toString()}`);

    // Remove focus from search input
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  const handleCategoryChange = (category) => {
    const queryParams = new URLSearchParams(location.search);
    if (category !== "All") {
      queryParams.set("category", category);
    } else {
      queryParams.delete("category");
    }
    // Deep link category usually clears the search for better UX
    queryParams.delete("search");
    navigate(`/products?${queryParams.toString()}`);
  };

  const fetchWishlist = async () => {
    if (!token) return;
    try {
      const res = await axios.get("http://localhost:5001/api/auth/wishlist", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWishlist(res.data.map(item => item._id));
    } catch (err) {
      console.error("Error fetching wishlist:", err);
    }
  };

  const deleteProduct = async (id) => {
    showModal({
      title: 'Delete Product',
      message: "Are you sure you want to delete this product?",
      type: 'confirm',
      onConfirm: async () => {
        try {
          await axios.delete(`http://localhost:5001/api/products/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchProducts();
          showModal({ title: 'Deleted', message: "Product deleted successfully", type: 'alert' });
        } catch (err) {
          console.error("Error deleting product:", err);
          showModal({ title: 'Error', message: "Failed to delete product", type: 'alert' });
        }
      }
    });
  };

  const categories = ["All", "Books", "Fan", "Trunk", "Cycles", "Others"];


  const isCategoryMatch = (pCat, selectedCat) => {
    if (!pCat || !selectedCat) return false;
    const p = pCat.toLowerCase();
    const s = selectedCat.toLowerCase();
    return p === s || p === s.replace(/s$/, '') || s === p.replace(/s$/, '');
  };

  const filteredProducts = products.filter(p => {
    if (!p || !p.title) return false;

    const matchesSearch = !searchTerm ||
      p.title.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .some(word => word.startsWith(searchTerm.toLowerCase()));

    const isPubliclyVisible = (p.status === 'active' || !p.status) && !p.isFlagged;
    const matchesCategory = selectedCategory === "All" || isCategoryMatch(p.category, selectedCategory);
    const matchesPrice = !maxPrice || p.price <= parseInt(maxPrice);
    return matchesSearch && matchesCategory && matchesPrice && isPubliclyVisible;
  });

  return (
    <div className="dashboard-page-container">
      <div className="products-container">
      <div className="products-header">
        <h2>{isSeller ? "Seller Console" : "Discover CampusKart"}</h2>

        <form className="search-filter-bar" onSubmit={handleSearch}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="What are you looking for?"
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </form>

        {isSeller && (
          <button
            className="add-product-btn"
            onClick={() => navigate("/add-product")}
          >
            + Add New Product
          </button>
        )}
      </div>

      <div className="products-grid">
        {loading ? (
          <div className="loading-state" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem' }}>
            <p style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: '600' }}>Fetching latest arrivals...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <p className="no-results">No matches found for your search.</p>
        ) : (
          filteredProducts.map((p) => (
            <ProductCard
              key={p._id}
              product={p}
              isSeller={isSeller}
              onDelete={deleteProduct}
              initialIsWishlisted={wishlist.includes(p._id)}
            />
          ))
        )}
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default Products;
