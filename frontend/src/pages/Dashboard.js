import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import itemStandard from '../assets/image.webp';
import '../styles/Dashboard.css';

const StarRating = ({ rating }) => {
    return (
        <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={`star ${star <= rating ? 'filled' : ''}`}>★</span>
            ))}
        </div>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [myReviews, setMyReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Active Listings');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const token = localStorage.getItem('token');
    const [userData, setUserData] = useState(null);



    useEffect(() => {
        const fetchData = async () => {
            console.log("Dashboard: Starting data fetch...");
            console.log("Dashboard: Token present:", !!token);

            try {
                const [prodRes, userRes, reviewsRes] = await Promise.all([
                    axios.get('http://localhost:5001/api/products'),
                    axios.get('http://localhost:5001/api/auth/me', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get('http://localhost:5001/api/products/my-reviews', {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                console.log("Dashboard: User data received:", userRes.data?._id);
                console.log("Dashboard: Total products from API:", prodRes.data?.length);
                console.log("Dashboard: Total reviews from API:", reviewsRes.data?.length);

                setUserData(userRes.data);
                setMyReviews(reviewsRes.data);

                // Filter products by current user - ensuring strong string comparison
                const currentUserId = userRes.data._id?.toString();
                const myProducts = prodRes.data.filter(p => {
                    const sellerId = p.seller?._id?.toString() || p.seller?.toString();
                    return sellerId === currentUserId;
                });

                console.log("Dashboard: Filtered user products:", myProducts.map(p => ({ title: p.title, status: p.status })));
                setProducts(myProducts);
                setLoading(false);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const activeCount = products.filter(p => p.status === 'active' || !p.status).length;
    const soldCount = products.filter(p => p.status === 'sold').length;
    const totalEarnings = products.filter(p => p.status === 'sold').reduce((sum, p) => sum + (Number(p.price) || 0), 0);

    const stats = [
        { label: 'Total Earned', value: `₹${totalEarnings}`, icon: '💰', color: '#ecfdf5' },
        { label: 'Active Products', value: activeCount.toString(), icon: '📦', color: '#eff6ff' },
        { label: 'Total Sold', value: soldCount.toString(), icon: '🤝', color: '#f5f3ff' }
    ];

    const tabs = ['Active Listings', 'Sold Items', 'Drafts', 'My Reviews'];

    const handleDelete = async (productId) => {
        if (!window.confirm("Are you sure you want to delete this listing?")) return;

        try {
            await axios.delete(`http://localhost:5001/api/products/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state to remove the deleted product
            setProducts(products.filter(p => p._id !== productId));
            alert("Listing deleted successfully");
        } catch (err) {
            console.error("Delete error:", err);
            alert("Failed to delete listing. Please try again.");
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm("Are you sure you want to delete this review?")) return;

        try {
            await axios.delete(`http://localhost:5001/api/products/reviews/${reviewId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyReviews(myReviews.filter(r => r._id !== reviewId));
            alert("Review deleted successfully");
        } catch (err) {
            console.error("Delete review error:", err);
            alert("Failed to delete review. Please try again.");
        }
    };

    const handleMarkAsSold = async (productId) => {
        try {
            await axios.patch(`http://localhost:5001/api/products/${productId}/sold`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state: move from active to sold
            setProducts(products.map(p => p._id === productId ? { ...p, status: 'sold' } : p));
            alert("Item marked as sold!");
        } catch (err) {
            console.error("Mark as sold error:", err);
            alert("Failed to mark item as sold.");
        }
    };

    const getFilteredProducts = () => {
        if (activeTab === 'Active Listings') {
            return products.filter(p => p.status === 'active' || !p.status);
        }
        if (activeTab === 'Sold Items') {
            return products.filter(p => p.status === 'sold');
        }
        if (activeTab === 'Drafts') {
            return products.filter(p => p.status === 'draft');
        }
        return [];
    };

    const filteredProducts = getFilteredProducts();

    if (loading) return <div className="loading">Loading Dashboard...</div>;

    const displayedSearchProducts = searchTerm ? products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())) : products;

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="search-pill" style={{ position: 'relative' }}>
                        <span className="search-icon">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Search my listings..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                        />
                        {isSearchFocused && (
                            <div className="search-dropdown" style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '12px',
                                marginTop: '0.5rem',
                                maxHeight: '300px',
                                overflowY: 'auto',
                                zIndex: 100,
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                            }}>
                                {displayedSearchProducts.length > 0 ? (
                                    displayedSearchProducts.map(p => (
                                        <div 
                                            key={p._id} 
                                            onClick={() => navigate(`/product/${p._id}`)}
                                            style={{
                                                padding: '0.75rem 1rem',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #f3f4f6',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                        >
                                            <img src={(p.images && p.images.length > 0) ? p.images[0] : (p.image || itemStandard)} alt={p.title} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                                            <div>
                                                <p style={{ margin: 0, fontWeight: '600', fontSize: '0.9rem', color: '#111827' }}>{p.title}</p>
                                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>₹{p.price} • {p.status === 'sold' ? 'Sold' : (p.status === 'draft' ? 'Draft' : 'Active')}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                                        No product found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="header-actions">
                        <div className="header-btn notification-indicator" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'inherit' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                        </div>
                    </div>
                </header>

                <div className="dashboard-content">
                    <div className="welcome-section">
                        <h1>Dashboard</h1>
                        <p>Manage your campus sales, active bids, and purchased items.</p>
                    </div>

                    <div className="stats-grid">
                        {stats.map(stat => (
                            <div key={stat.label} className="stat-card">
                                <div className="stat-card-inner" style={{ backgroundColor: stat.color }}>
                                    <div className="stat-icon-wrapper">
                                        <span className="stat-icon-emoji">{stat.icon}</span>
                                    </div>
                                    <div className="stat-info">
                                        <h3 className="stat-value">{stat.value}</h3>
                                        <p className="stat-label">{stat.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

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
                                        {tab === 'Active Listings' && <span className="tab-count">{products.filter(p => p.status === 'active' || !p.status).length}</span>}
                                        {tab === 'Sold Items' && <span className="tab-count">{products.filter(p => p.status === 'sold').length}</span>}
                                        {tab === 'Drafts' && <span className="tab-count">{products.filter(p => p.status === 'draft').length}</span>}
                                        {tab === 'My Reviews' && <span className="tab-count">{myReviews.length}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="listings-list">
                            {activeTab === 'My Reviews' ? (
                                myReviews.length > 0 ? (
                                    myReviews.map(review => (
                                        <div key={review._id} className="listing-item-card review-dashboard-card" onClick={() => navigate(`/product/${review.product?._id}`)}>
                                            <div className="listing-item-left">
                                                <img
                                                    src={(review.product?.images && review.product.images.length > 0) ? review.product.images[0] : (review.product?.image || itemStandard)}
                                                    alt={review.product?.title}
                                                    className="listing-img"
                                                />
                                                <div className="listing-info">
                                                    <div className="review-product-header">
                                                        <h4>{review.product?.title || 'Deleted Product'}</h4>
                                                        <StarRating rating={review.rating} />
                                                    </div>
                                                    <p className="review-comment-text">"{review.comment}"</p>
                                                    <p className="review-date-text">Left on {new Date(review.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="listing-actions">
                                                <span className="review-product-price">₹{review.product?.price || 0}</span>
                                                <button
                                                    className="action-btn delete-btn"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteReview(review._id); }}
                                                    title="Delete Review"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                </button>
                                                <button className="view-product-btn">View Item</button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-listings-state">
                                        <div className="empty-icon">⭐</div>
                                        <p>You haven't left any reviews yet.</p>
                                    </div>
                                )
                            ) : (
                                filteredProducts.length > 0 ? (
                                    filteredProducts.map(product => (
                                        <div key={product._id} className="listing-item-card">
                                            <div className="listing-item-left">
                                                <img src={(product.images && product.images.length > 0) ? product.images[0] : (product.image || itemStandard)} alt={product.title} className="listing-img" />
                                                <div className="listing-info">
                                                    <div className="status-badge-row">
                                                        <span className={`badge ${product.status === 'sold' ? 'badge-sold' : product.status === 'draft' ? 'badge-draft' : 'badge-live'}`}>
                                                            {product.status === 'sold' ? 'Sold' : product.status === 'draft' ? 'Draft' : 'Live'}
                                                        </span>
                                                        <span className="post-date">• Posted on {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "05 Mar 2026"}</span>
                                                    </div>
                                                    <h4>{product.title}</h4>
                                                    <p className="listing-desc">{product.description?.substring(0, 80)}...</p>
                                                    <p className="listing-price">₹{product.price}</p>
                                                </div>
                                            </div>
                                            <div className="listing-actions">
                                                {product.status !== 'sold' && (
                                                    <>
                                                        <button
                                                            className="action-btn sold-btn"
                                                            onClick={(e) => { e.stopPropagation(); handleMarkAsSold(product._id); }}
                                                            style={{ backgroundColor: '#22c55e', color: 'white' }}
                                                        >
                                                            Mark as Sold
                                                        </button>
                                                        <button
                                                            className="action-btn edit-btn"
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/edit/${product._id}`); }}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                                            Edit
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    className="action-btn delete-btn"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(product._id); }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-listings-state">
                                        <div className="empty-icon">{activeTab === 'Sold Items' ? '🤝' : '📂'}</div>
                                        <p>{activeTab === 'Sold Items' ? 'no item sold yet' : 'No listings found in this category.'}</p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>

                <footer className="dashboard-footer">
                    <p>© 2026 CampusKart • Exclusively for Students</p>
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
