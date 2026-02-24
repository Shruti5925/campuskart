import React, { useState, useEffect } from 'react';
import defaultProduct from '../assets/default-product.svg';
import itemStandard from '../assets/item-standard.webp';

import Footer from '../Components/Footer';
import ProductCard from '../Components/ProductCard';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Home.css';


const Home = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All Items');
    const [allProducts, setAllProducts] = useState([]);
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [recentProducts, setRecentProducts] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const token = localStorage.getItem('token');

    const categories = [
        { name: 'All Items', icon: '📦', id: 'all' },
        { name: 'Books', icon: '📖', id: 'books' },
        { name: 'Fan', icon: '💨', id: 'fan' },
        { name: 'Electronics', icon: '⚡', id: 'electronics' },
        { name: 'Cycles', icon: '🚲', id: 'cycles' },
        { name: 'Others', icon: '✨', id: 'others' }
    ];

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get('http://localhost:5001/api/products');
                const products = res.data;
                setAllProducts(products);

                // Initial load: show all trending and recent
                setTrendingProducts(products.slice(0, 4));
                setRecentProducts(products.slice(-4).reverse());
            } catch (err) {
                console.error('Error fetching products:', err);
            }
        };

        const fetchWishlist = async () => {
            if (!token) return;
            try {
                const res = await axios.get('http://localhost:5001/api/auth/wishlist', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setWishlist(res.data.map(item => item._id));
            } catch (err) {
                console.error("Error fetching wishlist:", err);
            }
        };

        fetchProducts();
        fetchWishlist();
    }, [token]);

    const handleSearch = (e) => {
        e.preventDefault();
        navigate(`/products?search=${searchTerm}`);
    };

    useEffect(() => {
        if (allProducts.length === 0) return;

        const isCategoryMatch = (pCat, activeCat) => {
            if (!pCat || !activeCat) return false;
            const p = pCat.toLowerCase();
            const a = activeCat.toLowerCase();
            return p === a || p === a.replace(/s$/, '') || a === p.replace(/s$/, '');
        };

        let filtered = allProducts;
        if (activeCategory !== 'All Items') {
            filtered = allProducts.filter(p => isCategoryMatch(p.category, activeCategory));
        }

        setTrendingProducts(filtered.slice(0, 4));
        setRecentProducts(filtered.slice(-4).reverse());
    }, [activeCategory, allProducts]);

    return (
        <div className="home-container">
            <header className="hero">
                <div className="hero-content">
                    <h1>Buy and Sell within your <span>Campus.</span></h1>
                    <p>The trusted student-to-student marketplace for all your college needs. Safe, fast, and local.</p>

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
                <div className="categories-container">
                    {categories.map((cat) => (
                        <div
                            key={cat.id}
                            className={`category-card ${activeCategory === cat.name ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat.name)}
                        >
                            <div className="category-icon">{cat.icon}</div>
                            <span className="category-label">{cat.name}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="products-section">
                <div className="section-header">
                    <h2 className="section-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                        {activeCategory === 'All Items' ? 'Trending in your Campus' : `${activeCategory} for Sale`}
                    </h2>
                    <Link to={activeCategory === 'All Items' ? "/products" : `/products?category=${activeCategory}`} className="view-all">View all <span style={{ fontSize: '1.2rem' }}>›</span></Link>
                </div>
                <div className="product-grid">
                    {trendingProducts.length > 0 ? (
                        trendingProducts.map(product => (
                            <ProductCard
                                key={product._id}
                                product={product}
                                showContactBtn={true}
                                initialIsWishlisted={wishlist.includes(product._id)}
                            />
                        ))
                    ) : (
                        <p className="no-products-hint" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#6b7280', fontWeight: 'bold' }}>
                            No {activeCategory.toLowerCase()} available right now. Check back later!
                        </p>
                    )}
                </div>
            </section>

            <section className="products-section">
                <div className="section-header">
                    <h2 className="section-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        {activeCategory === 'All Items' ? 'Recent Arrivals' : `More in ${activeCategory}`}
                    </h2>
                </div>
                <div className="product-grid">
                    {recentProducts.length > 0 ? (
                        recentProducts.map(product => (
                            <ProductCard
                                key={product._id}
                                product={product}
                                showContactBtn={true}
                                initialIsWishlisted={wishlist.includes(product._id)}
                            />
                        ))
                    ) : (
                        [1, 2, 3, 4].map(i => (
                            <div className="product-card" key={i} style={{ opacity: 0.5 }}>
                                <div className="product-image-wrapper" style={{ height: '200px' }}></div>
                                <div className="product-content">
                                    <div className="product-title" style={{ height: '20px', background: '#eee', width: '60%' }}></div>
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

