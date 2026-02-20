import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import ProductCard from "../Components/ProductCard";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";
import "../styles/Products.css";

const Products = ({ isSeller = false }) => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  // ✅ Read category & search from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryFromURL = params.get("category");
    const searchFromURL = params.get("search");

    if (categoryFromURL) {
      setSelectedCategory(categoryFromURL);
    }

    if (searchFromURL) {
      setSearchTerm(searchFromURL);
    }
  }, [location.search]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/products");
      setProducts(res.data);
    } catch (err) {
      console.error("Error fetching products:", err);
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

  // Dynamic categories from DB
  const categories = [
    "All",
    ...new Set(products.filter(p => p && p.category).map(p => p.category))
  ];

  // Filtering logic
  const filteredProducts = products.filter(p => {
    if (!p || !p.title) return false;

    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description &&
        p.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === "All" || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <Navbar />

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
          {filteredProducts.length === 0 ? (
            <p className="no-results">
              🚫 No products available
            </p>
          ) : (
            filteredProducts.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                isSeller={isSeller}
                onDelete={deleteProduct}
              />
            ))
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Products;