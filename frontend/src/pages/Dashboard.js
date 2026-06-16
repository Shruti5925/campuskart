import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useModal } from '../context/ModalContext';
import Sidebar from '../Components/Sidebar';
import Footer from '../Components/Footer';
import itemStandard from '../assets/image.webp';
import { formatNumericDate, formatExpiryDate } from '../utils/dateUtils';
import '../styles/Dashboard.css';
import '../styles/AccountStatus.css';

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
    const token = sessionStorage.getItem('token');
    const [userData, setUserData] = useState(null);
    const { showModal } = useModal();



    useEffect(() => {
        const fetchData = async () => {
            console.log("Dashboard: Starting data fetch...");
            console.log("Dashboard: Token present:", !!token);

            try {
                const [prodRes, userRes, reviewsRes] = await Promise.all([
                    axios.get('http://localhost:5001/api/products/my-products', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
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

                // Use the products from the authenticated "my-products" endpoint directly
                setProducts(prodRes.data || []);
                setLoading(false);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const activeCount = products.filter(p => !p.isFlagged && (p.status === 'active' || !p.status)).length;
    const reviewCount = products.filter(p => p.isFlagged || p.status === 'pending').length;
    const soldCount = products.filter(p => p.status === 'sold').length;
    const totalEarnings = products.filter(p => p.status === 'sold').reduce((sum, p) => sum + (Number(p.price) || 0), 0);

    const stats = [
        { label: 'Total Earned', value: `₹${totalEarnings}`, icon: '💰', color: '#ecfdf5' },
        { label: 'Active Products', value: activeCount.toString(), icon: '📦', color: '#eff6ff' },
        { label: 'Total Sold', value: soldCount.toString(), icon: '🤝', color: '#f5f3ff' }
    ];

    const tabs = ['Active Listings', 'Sold Items', 'Drafts', 'Under Review', 'My Reviews'];

    const handleDelete = async (productId) => {
        showModal({
            title: 'Delete Listing',
            message: "Are you sure you want to delete this listing?",
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await axios.delete(`http://localhost:5001/api/products/${productId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setProducts(products.filter(p => p._id !== productId));
                    showModal({ title: 'Deleted', message: "Listing deleted successfully", type: 'alert' });
                } catch (err) {
                    console.error("Delete error:", err);
                    showModal({ title: 'Error', message: "Failed to delete listing. Please try again.", type: 'alert' });
                }
            }
        });
    };

    const handleDeleteReview = async (reviewId) => {
        showModal({
            title: 'Delete Review',
            message: "Are you sure you want to delete this review?",
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await axios.delete(`http://localhost:5001/api/products/reviews/${reviewId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setMyReviews(myReviews.filter(r => r._id !== reviewId));
                    showModal({ title: 'Deleted', message: "Review deleted successfully", type: 'alert' });
                } catch (err) {
                    console.error("Delete review error:", err);
                    showModal({ title: 'Error', message: "Failed to delete review. Please try again.", type: 'alert' });
                }
            }
        });
    };

    const handleMarkAsSold = async (productId) => {
        try {
            await axios.patch(`http://localhost:5001/api/products/${productId}/sold`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(products.map(p => p._id === productId ? { ...p, status: 'sold' } : p));
            showModal({ title: 'Success', message: "Item marked as sold!", type: 'alert' });
        } catch (err) {
            console.error("Mark as sold error:", err);
            showModal({ title: 'Error', message: "Failed to mark item as sold.", type: 'alert' });
        }
    };

    const getFilteredProducts = () => {
        if (!products) return [];
        
        switch (activeTab) {
            case 'Active Listings':
                return products.filter(p => !p.isFlagged && (p.status === 'active' || p.status === 'approved' || !p.status));
            case 'Sold Items':
                return products.filter(p => p.status === 'sold');
            case 'Drafts':
                return products.filter(p => p.status === 'draft' || p.status === 'Draft');
            case 'Under Review':
                return products.filter(p => p.status === 'pending' || p.status === 'Pending' || p.isFlagged);
            default:
                return [];
        }
    };

    const filteredProducts = getFilteredProducts();

    if (loading) return <div className="loading">Loading Dashboard...</div>;

    const displayedSearchProducts = searchTerm ? products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())) : products;

    return (
        <div className="dashboard-page-container">
            <div className="dashboard-layout">
                <Sidebar />

                <main className="dashboard-main">
                    <header className="dashboard-header">
                        {/* ... (rest of search/header content remains same) ... */}
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
                                                onMouseDown={() => {
                                                    navigate(`/product/${p._id}`);
                                                    setIsSearchFocused(false);
                                                    setSearchTerm('');
                                                }}
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
                                                    <p style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem', color: '#111827' }}>{p.title}</p>
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
                        <div className="header-actions" style={{ display: 'flex', gap: '8px' }}>
                            <Link to="/cart" className="pill-icon-btn cart-icon-btn" title="Cart">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                            </Link>
                            <Link to="/wishlist" className="pill-icon-btn wishlist-icon-btn" title="Wishlist">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                            </Link>
                        </div>
                    </header>

                    <div className="dashboard-content">
                        <div className="welcome-section">
                            <h1>Dashboard</h1>
                            <p>Manage your campus sales, active bids, and purchased items.</p>
                        </div>

                        {userData && userData.role === 'student' && (
                            <div className="expiry-panel" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe' }}>
                                <div className="expiry-panel-header" style={{ margin: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1.25rem' }}>🎓</span>
                                        <span className="expiry-panel-title">Marketplace Student Access Status</span>
                                    </div>
                                    <span className={`account-status-badge ${userData.accountStatus || 'active'}`} style={{ boxShadow: 'none' }}>
                                        {userData.accountStatus || 'active'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1rem' }}>
                                    <div className="expiry-date-info">
                                        <span className="expiry-date-label">Access Valid Until</span>
                                        <span className="expiry-date-value" style={{ color: '#1e40af' }}>
                                            {formatExpiryDate(userData.accountExpiryDate)}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: '700' }}>Graduation Year: {userData.graduationYear}</span>
                                </div>
                            </div>
                        )}

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
                                            {tab === 'Active Listings' && <span className="tab-count">{activeCount}</span>}
                                            {tab === 'Sold Items' && <span className="tab-count">{soldCount}</span>}
                                            {tab === 'Drafts' && <span className="tab-count">{products.filter(p => p.status === 'draft' || p.status === 'Draft').length}</span>}
                                            {tab === 'Under Review' && <span className="tab-count">{reviewCount}</span>}
                                            {tab === 'My Reviews' && <span className="tab-count">{myReviews.length}</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="listings-list">
                                {activeTab === 'My Reviews' ? (
                                    myReviews.length > 0 ? (
                                        myReviews.map(review => (
                                            <div key={review._id} className="listing-item-card review-dashboard-card">
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
                                                        <p className="review-date-text">Left on {formatNumericDate(review.createdAt)}</p>
                                                    </div>
                                                </div>
                                                <div className="listing-actions">
                                                    <span className="review-product-price">₹{review.product?.price || 0}</span>
                                                    <button
                                                        className="action-btn delete-btn"
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteReview(review._id); }}
                                                        title="Delete Review"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M3 6h18" />
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                             <line x1="9" y1="11" x2="9" y2="17" />
                                                             <line x1="12" y1="11" x2="12" y2="17" />
                                                             <line x1="15" y1="11" x2="15" y2="17" />
                                                        </svg>
                                                    </button>

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
                                                            <span className={`badge ${product.isFlagged ? 'badge-rejected' : (product.status === 'sold' ? 'badge-sold' : product.status === 'draft' ? 'badge-draft' : product.status === 'pending' ? 'badge-pending' : product.status === 'rejected' ? 'badge-rejected' : 'badge-live')}`}>
                                                                {product.isFlagged ? 'Flagged by Admin' : (product.status === 'sold' ? 'Sold' : product.status === 'draft' ? 'Draft' : product.status === 'pending' ? 'Pending' : product.status === 'rejected' ? 'Rejected' : 'Live')}
                                                            </span>
                                                            <span className="post-date">• Posted on {product.createdAt ? formatNumericDate(product.createdAt) : "05/03/2026"}</span>
                                                        </div>
                                                        <h4>{product.title}</h4>
                                                        <p className="listing-desc">{product.description?.substring(0, 80)}...</p>
                                                        <p className="listing-price">₹{product.price}</p>
                                                    </div>
                                                </div>
                                                <div className="listing-actions">
                                                    {(product.status === 'active' && !product.isFlagged) && (
                                                        <button
                                                            className="action-btn sold-btn"
                                                            onClick={(e) => { e.stopPropagation(); handleMarkAsSold(product._id); }}
                                                            style={{ backgroundColor: '#22c55e', color: 'white' }}
                                                        >
                                                            Mark as Sold
                                                        </button>
                                                    )}
                                                    {product.status !== 'sold' && (
                                                        <button
                                                            className="action-btn edit-btn"
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/edit/${product._id}`); }}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                                            Edit
                                                        </button>
                                                    )}
                                                    <button
                                                        className="action-btn delete-btn"
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(product._id); }}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M3 6h18" />
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                             <line x1="9" y1="11" x2="9" y2="17" />
                                                             <line x1="12" y1="11" x2="12" y2="17" />
                                                             <line x1="15" y1="11" x2="15" y2="17" />
                                                        </svg>
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
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default Dashboard;
