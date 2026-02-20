import React, { useState, useEffect } from 'react';
import Navbar from '../Components/Navbar';
import Footer from '../Components/Footer';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Home.css';

const Home = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All Items');
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [recentProducts, setRecentProducts] = useState([]);

    const categories = [
  { name: "All", icon: "田", id: "all" },
  { name: "book", icon: "📚", id: "book" },
  { name: "fan", icon: "🌬️", id: "fan" },
  { name: "electronics", icon: "💻", id: "electronics" },
  { name: "bicycle", icon: "🚲", id: "bicycle" },
  { name: "others", icon: "⋯", id: "others" }
];


    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get('http://localhost:5001/api/products');
                const products = res.data;
                // Just take some sample data for trending and recent
                setTrendingProducts(products.slice(0, 4));
                setRecentProducts(products.slice(-4).reverse());
            } catch (err) {
                console.error('Error fetching products:', err);
            }
        };
        fetchProducts();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        navigate(`/products?search=${searchTerm}`);
    };

    const renderProductCard = (product) => (
        <div className="item-card" key={product._id}>
            <div className="item-image-wrapper">
                <img
                    src={product.image || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop"}
                    alt={product.title}
                    className="item-image"
                />
                <span className="price-tag">₹{product.price}</span>
            </div>
            <div className="item-info">
                <div className="item-header">
                    <h3 className="item-name">{product.title}</h3>
                </div>
                <div className="item-meta">
                    <span>📍 {product.sellerYear || "3rd Year, CS"}</span>
                </div>
                <button className="contact-btn" onClick={() => navigate(`/product/${product._id}`)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    Contact Seller
                </button>
            </div>
        </div>
    );

    return (
        <div className="home-container">
            <Navbar />

            <header className="hero">
                <div className="hero-content">
                    <h1>Buy and Sell within your <span>Campus.</span></h1>
                    <p>The trusted student-to-student marketplace for all your college needs.</p>

                    <form className="search-container" onSubmit={handleSearch}>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search for books, cycles, or study tables..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit" className="search-btn">Search</button>
                    </form>
                </div>
            </header>

            <section className="categories-section">
                {categories.map((cat) => (
                    <div
                        key={cat.id}
                        className={`category-card ${activeCategory === cat.name ? 'active' : ''}`}
                        onClick={() => {
    setActiveCategory(cat.name);

    if (cat.name === "All") {
        navigate("/products");
    } else {
        navigate(`/products?category=${cat.name}`);
    }
}}
                    >
                        <div className="category-icon">{cat.icon}</div>
                        <span className="category-label">{cat.name}</span>
                    </div>
                ))}
            </section>

            <section className="products-section">
                <div className="section-header">
                    <h2 className="section-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                        Trending in your Campus
                    </h2>
                    <Link to="/products" className="view-all">View all <span style={{ fontSize: '1.2rem' }}>›</span></Link>
                </div>
                <div className="product-grid">
                    {trendingProducts.length > 0 ? (
                        trendingProducts.map(renderProductCard)
                    ) : (
                        // Fallback skeleton or placeholders
                        [1, 2, 3, 4].map(i => (
                            <div className="item-card" key={i} style={{ opacity: 0.5 }}>
                                <div className="item-image" style={{ height: '200px' }}></div>
                                <div className="item-info">
                                    <div className="item-name" style={{ height: '20px', background: '#eee', width: '60%' }}></div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            <section className="products-section">
                <div className="section-header">
                    <h2 className="section-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        Recent Arrivals
                    </h2>
                </div>
                <div className="product-grid">
                    {recentProducts.length > 0 ? (
                        recentProducts.map(renderProductCard)
                    ) : (
                        [1, 2, 3, 4].map(i => (
                            <div className="item-card" key={i} style={{ opacity: 0.5 }}>
                                <div className="item-image" style={{ height: '200px' }}></div>
                                <div className="item-info">
                                    <div className="item-name" style={{ height: '20px', background: '#eee', width: '60%' }}></div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Home;

