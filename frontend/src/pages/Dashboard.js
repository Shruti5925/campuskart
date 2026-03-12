import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import itemStandard from '../assets/image.webp';
import '../styles/Dashboard.css';
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Active Listings');
    const [userData, setUserData] = useState(null);
    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const fetchData = async () => {
        try {
            const [prodRes, userRes] = await Promise.all([
                axios.get('http://localhost:5001/api/products'),
                axios.get('http://localhost:5001/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setUserData(userRes.data);

            const myProducts = prodRes.data.filter(
                p =>
                    p.seller?._id === userRes.data._id ||
                    p.seller === userRes.data._id
            );

            setProducts(myProducts);
            setLoading(false);
        } catch (err) {
            console.error("Dashboard fetch error:", err);
            setLoading(false);
        }
    };

    // DELETE PRODUCT
    const deleteProduct = async (id) => {
        try {

            await axios.delete(
                `http://localhost:5001/api/products/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // remove deleted product from UI
            setProducts(products.filter(p => p._id !== id));

        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    const stats = [
        { label: 'Total Earned', value: '₹0', icon: '💰', color: '#ecfdf5' },
        { label: 'Active Ads', value: products.length.toString(), icon: '📦', color: '#eff6ff' },
        { label: 'Items Bought', value: '0', icon: '🛒', color: '#f5f3ff' }
    ];

    const tabs = ['Active Listings', 'Sold Items', 'Purchased Items'];

    if (loading) return <div className="loading">Loading Dashboard...</div>;

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">

                {/* HEADER */}
                <header className="dashboard-header">
                    <div className="search-pill">
                        <span className="search-icon">🔍</span>
                        <input type="text" placeholder="Search my listings..." />
                    </div>

                    <div className="header-actions">

                        <button className="header-btn notification-indicator">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                        </button>

                        <button className="header-btn theme-toggle">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 
                                7 7 0 0 0 21 12.79z"></path>
                            </svg>
                        </button>

                        {/* USER AVATAR */}
                        <div className="dashboard-user">
                            <img
                                src={
                                    userData?.avatar
                                        ? `${userData.avatar}?t=${new Date().getTime()}`
                                        : "/default-avatar.png"
                                }
                                alt="User Avatar"
                                className="dashboard-avatar"
                            />
                        </div>
                    </div>
                </header>

                <div className="dashboard-content">

                    <div className="welcome-section">
                        <h1>Dashboard</h1>
                        <p>Manage your campus sales, active bids, and purchased items.</p>
                    </div>

                    {/* STATS */}
                    <div className="stats-grid">
                        {stats.map(stat => (
                            <div key={stat.label} className="stat-card">
                                <div
                                    className="stat-card-inner"
                                    style={{ backgroundColor: stat.color }}
                                >
                                    <div className="stat-icon-wrapper">
                                        <span className="stat-icon-emoji">
                                            {stat.icon}
                                        </span>
                                    </div>

                                    <div className="stat-info">
                                        <h3 className="stat-value">{stat.value}</h3>
                                        <p className="stat-label">{stat.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* LISTINGS */}
                    <div className="listings-container">

                        <div className="listings-tabs-wrapper">
                            <div className="listings-tabs">

                                {tabs.map(tab => (
                                    <button
                                        key={tab}
                                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {tab}

                                        {tab === 'Active Listings' && (
                                            <span className="tab-count">
                                                {products.length}
                                            </span>
                                        )}

                                    </button>
                                ))}

                            </div>
                        </div>

                        <div className="listings-list">

                            {products.length > 0 ? (

                                products.map(product => (

                                    <div key={product._id} className="listing-item-card">

                                        <div className="listing-item-left">

                                            {/* PRODUCT IMAGE */}
                                            <img
                                                src={product.image || itemStandard}
                                                alt={product.title}
                                                className="listing-img"
                                            />

                                            <div className="listing-info">

                                                <div className="status-badge-row">
                                                    <span className="badge badge-live">Live</span>
                                                    <span className="post-date">
                                                        • Posted recently
                                                    </span>
                                                </div>

                                                <h4>{product.title}</h4>

                                                <p className="listing-desc">
                                                    {product.description?.substring(0, 80)}...
                                                </p>

                                                <p className="listing-price">
                                                    ₹{product.price}
                                                </p>

                                            </div>

                                        </div>

                                        <div className="listing-actions">

                                            <button
                                                className="action-btn edit-btn"
                                                onClick={() => navigate(`/edit-product/${product._id}`)}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="action-btn delete-btn"
                                                onClick={() => {
                                                    if (window.confirm("Delete this product?")) {
                                                        deleteProduct(product._id);
                                                    }
                                                }}
                                            >
                                                Delete
                                            </button>

                                        </div>

                                    </div>

                                ))

                            ) : (

                                <div className="empty-listings-state">
                                    <div className="empty-icon">📂</div>
                                    <p>No listings found in this category.</p>
                                </div>

                            )}

                        </div>

                    </div>

                </div>

                <footer className="dashboard-footer">
                    <p>© 2024 Campuskart • Exclusively for Students</p>

                    <div className="footer-links">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Use</a>
                    </div>
                </footer>

            </main>
        </div>
    );
};

export default Dashboard;