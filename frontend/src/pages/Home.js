import React, { useState, useEffect } from 'react';


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
        { name: 'Trunk', icon: '🧳', id: 'trunk' },
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

        let filtered = allProducts.filter(p => p.status === 'active' || !p.status);
        if (activeCategory !== 'All Items') {
            filtered = filtered.filter(p => isCategoryMatch(p.category, activeCategory));
        }

        setTrendingProducts(filtered.slice(0, 4));
        setRecentProducts(filtered.slice(-4).reverse());
    }, [activeCategory, allProducts]);

    const getPriceProducts = (maxPrice) => {
        let filtered = allProducts.filter(p => (p.status === 'active' || !p.status) && p.price <= maxPrice);
        if (activeCategory !== 'All Items') {
            const isCategoryMatch = (pCat, activeCat) => {
                if (!pCat || !activeCat) return false;
                const p = pCat.toLowerCase();
                const a = activeCat.toLowerCase();
                return p === a || p === a.replace(/s$/, '') || a === p.replace(/s$/, '');
            };
            filtered = filtered.filter(p => isCategoryMatch(p.category, activeCategory));
        }
        return filtered.slice(0, 4);
    };

    const budgetRanges = [
        { label: 'Under ₹199', max: 199, icon: '🏷️' },
        { label: 'Under ₹299', max: 299, icon: '🛒' },
        { label: 'Under ₹399', max: 399, icon: '🔥' },
        { label: 'Under ₹499', max: 499, icon: '💰' }
    ];

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

                    <div className="hero-features-bar">
                        <div className="feature-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="feature-icon"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
                            <span>3 Days Easy Return</span>
                        </div>
                        <div className="feature-divider"></div>
                        <div className="feature-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="feature-icon"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>
                            <span>Cash on Delivery</span>
                        </div>
                        <div className="feature-divider"></div>
                        <div className="feature-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="feature-icon"><path d="M6 9l6 6 6-6"></path></svg>
                            <span>Lowest Prices</span>
                        </div>
                    </div>
                </div>
            </header>

            <section className="categories-section">
                <div className="categories-container">
                    {categories.map((cat) => (
                        <div
                            key={cat.id}
                            className={`category-card category-${cat.id} ${activeCategory === cat.name ? 'active' : ''}`}
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

            <section className="budget-explorer-section">
                <div className="section-header">
                    <h2 className="section-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M16 8l-8 8"></path><path d="M12 16V8"></path></svg>
                        Shop by Budget
                    </h2>
                    <p className="section-subtitle">Find what you need within your price range</p>
                </div>

                <div className="budget-boxes-container">
                    {budgetRanges.map(range => (
                        <Link
                            key={range.max}
                            to={`/products?maxPrice=${range.max}`}
                            className="budget-box-card"
                        >
                            <div className="budget-box-icon">{range.icon}</div>
                            <div className="budget-box-info">
                                <span className="budget-box-label">{range.label}</span>
                                <span className="budget-box-count">View All Products →</span>
                            </div>
                        </Link>
                    ))}
                </div>

            </section>

            <Footer />
        </div>
    );
};

export default Home;

