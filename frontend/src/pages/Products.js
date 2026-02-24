import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import ProductCard from "../Components/ProductCard";
import "../styles/Products.css";

const Products = ({ isSeller = false }) => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  // Get category from URL
  const queryParams = new URLSearchParams(location.search);
  const categoryFromUrl = queryParams.get("category") || "All";

  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);

  useEffect(() => {
    setSelectedCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  useEffect(() => {
    fetchProducts();
    fetchWishlist();
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
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`http://localhost:5001/api/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchProducts();
      } catch (err) {
        console.error("Error deleting product:", err);
      }
    }
  };

  const categories = ["All", ...new Set(products.filter(p => p && p.category).map(p => p.category))];

  const isCategoryMatch = (pCat, selectedCat) => {
    if (!pCat || !selectedCat) return false;
    const p = pCat.toLowerCase();
    const s = selectedCat.toLowerCase();
    return p === s || p === s.replace(/s$/, '') || s === p.replace(/s$/, '');
  };

  const filteredProducts = products.filter(p => {
    if (!p || !p.title) return false;
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || isCategoryMatch(p.category, selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="products-container">
      <div className="products-header">
        <h2>{isSeller ? "Seller Console" : "Discover CampusKart"}</h2>

        <div className="search-filter-bar">
          <input
            type="text"
            placeholder="What are you looking for?"
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

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
  );
};

export default Products;
