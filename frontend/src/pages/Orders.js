import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useModal } from '../context/ModalContext';
import Sidebar from '../Components/Sidebar';
import Footer from '../Components/Footer';
import itemStandard from '../assets/image.webp';
import '../styles/Orders.css';

const Orders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All Orders');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const token = sessionStorage.getItem('token');
    const { showModal } = useModal();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await axios.get('http://localhost:5001/api/orders/my-orders', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrders(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching orders:", err);
                setLoading(false);
            }
        };
        if (token) fetchOrders();
    }, [token]);

    const tabs = ['All Orders', 'Active', 'Completed', 'Cancelled'];

    // Consolidate valid orders (Remove broken entries immediately)
    const validOrders = orders.filter(o => {
        const firstItem = o.products[0];
        return firstItem && (firstItem.product || firstItem.productTitle);
    });

    const getFilteredOrders = (status) => {
        let filtered = validOrders;
        
        if (status === 'active') filtered = filtered.filter(o => o.status === 'pending');
        else if (status === 'completed') filtered = filtered.filter(o => o.status === 'completed');
        else if (status === 'cancelled') filtered = filtered.filter(o => o.status === 'cancelled');

        if (searchTerm) {
            filtered = filtered.filter(o => 
                o.products.some(p => {
                    const title = p.productTitle || p.product?.title || '';
                    return title.toLowerCase().includes(searchTerm.toLowerCase());
                })
            );
        }
        return filtered;
    };

    const handleReturn = async (orderId) => {
        showModal({
            title: 'Return Item',
            message: "Are you sure you want to return this item?",
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await axios.patch(`http://localhost:5001/api/orders/${orderId}/return`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const res = await axios.get('http://localhost:5001/api/orders/my-orders', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setOrders(res.data);
                    showModal({ title: 'Success', message: "Order return initiated successfully! 📦", type: 'alert' });
                } catch (err) {
                    console.error("Return Error:", err);
                    showModal({ title: 'Error', message: err.response?.data?.message || "Failed to initiate return", type: 'alert' });
                }
            }
        });
    };

    const handleCancel = async (orderId) => {
        showModal({
            title: 'Cancel Order',
            message: "Are you sure you want to cancel this order?",
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await axios.patch(`http://localhost:5001/api/orders/${orderId}/cancel`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const res = await axios.get('http://localhost:5001/api/orders/my-orders', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setOrders(res.data);
                    showModal({ title: 'Success', message: "Order cancelled successfully! ❌", type: 'alert' });
                } catch (err) {
                    console.error("Cancel Error:", err);
                    showModal({ title: 'Error', message: err.response?.data?.message || "Failed to cancel order", type: 'alert' });
                }
            }
        });
    };

    const getStatusInfo = (status) => {
        if (!status) return { label: 'UNKNOWN', class: '' };
        switch (status.toLowerCase()) {
            case 'completed':
                return { label: 'PICKED UP', class: 'status-picked-up' };
            case 'pending':
                return { label: 'PENDING PICKUP', class: 'status-pending' };
            case 'cancelled':
                return { label: 'CANCELLED', class: 'status-cancelled' };
            case 'returned':
                return { label: 'RETURNED', class: 'status-returned' };
            default:
                return { label: status.toUpperCase(), class: '' };
        }
    };

    const renderOrderCard = (order) => {
        const statusInfo = getStatusInfo(order.status);
        const firstItem = order.products[0];
        const mainProduct = firstItem?.product;
        const displayTitle = firstItem?.productTitle || mainProduct?.title || 'Product Deleted';
        
        // Determine image
        const displayImage = firstItem?.productImage || 
                            ((mainProduct?.images && mainProduct.images.length > 0) ? mainProduct.images[0] : (mainProduct?.image || itemStandard));

        const orderDate = new Date(order.createdAt);
        const isCancelled = order.status === 'cancelled';

        const orderIdDisplay = order?._id ? (order._id.toString().slice(-4).toUpperCase()) : '????';

        return (
            <div key={order._id} className="order-card-large" onClick={() => mainProduct?._id && navigate(`/product/${mainProduct._id}`)}>
                <div className="order-card-left">
                    <img 
                        src={displayImage} 
                        alt={displayTitle} 
                        className="order-img-large" 
                    />
                </div>
                
                <div className="order-card-center">
                    <div className="order-header-row">
                        <span className={`order-status-badge ${statusInfo.class}`}>{statusInfo.label}</span>
                        <span className="order-id-label">Order #CK-{orderIdDisplay}</span>
                    </div>
                    <h2 className="order-title-large">{displayTitle}</h2>
                    <p className="order-seller">Seller: <span>{mainProduct?.seller?.firstName || 'Banasthali Student'}</span></p>
                    
                    <div className="order-actions">
                        {isCancelled ? (
                            <>
                                <button className="reorder-btn" onClick={(e) => { e.stopPropagation(); navigate(`/product/${mainProduct?._id}`); }}>
                                    Reorder Item
                                </button>
                                <button className="view-reason-btn" onClick={(e) => {
                                    e.stopPropagation();
                                    showModal({
                                        title: 'Cancellation Reason',
                                        message: order.cancellationReason || "This order was cancelled because the associated product was flagged or reported by an Administrator.",
                                        type: 'alert'
                                    });
                                }}>
                                    View Cancellation Reason
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="view-details-btn" onClick={(e) => { e.stopPropagation(); navigate(`/product/${mainProduct?._id}`); }}>
                                    {order.status === 'pending' ? 'View Pickup Details ' : 'View Details '} 
                                    {order.status === 'pending' ? '📍' : '>'}
                                </button>
                                <button className="contact-seller-pill" onClick={(e) => { e.stopPropagation(); navigate('/messages'); }}>
                                    💬 Contact Seller
                                </button>
                                {order.status === 'pending' && (
                                    <button className="cancel-order-btn" onClick={(e) => { e.stopPropagation(); handleCancel(order._id); }} style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '0.6rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', transition: 'background 0.2s', alignSelf: 'center' }} onMouseEnter={(e) => e.target.style.background = '#fee2e2'} onMouseLeave={(e) => e.target.style.background = '#fef2f2'}>
                                        ❌ Cancel Order
                                    </button>
                                )}
                                {order.status === 'completed' && (() => {
                                    const diff = Date.now() - orderDate.getTime();
                                    const threeDays = 3 * 24 * 60 * 60 * 1000;
                                    const isExpired = diff > threeDays;
                                    
                                    return (
                                        <div className="return-action-wrapper" onClick={(e) => e.stopPropagation()}>
                                            <button 
                                                className={`return-btn ${isExpired ? 'inactive' : ''}`}
                                                disabled={isExpired}
                                                onClick={() => handleReturn(order._id)}
                                            >
                                                📦 Return Item
                                            </button>
                                            {isExpired && <span className="return-msg">Closed</span>}
                                        </div>
                                    );
                                })()}
                            </>
                        )}
                    </div>
                </div>
                
                <div className="order-card-right">
                    <div className={`order-price-large ${isCancelled ? 'cancelled-price' : ''}`}>
                        ₹{(order?.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="order-date-large">
                        {orderDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                </div>
            </div>
        );
    };

    const renderEmptyState = () => (
        <div className="empty-orders-state">
            <div className="empty-icon">🛍️</div>
            <p>No orders found in this category.</p>
        </div>
    );

    if (loading) return <div className="loading">Loading Orders...</div>;

    const displayedSearchOrders = searchTerm 
        ? validOrders.filter(o => o.products.some(p => {
            const title = p.productTitle || p.product?.title || '';
            return title.toLowerCase().includes(searchTerm.toLowerCase());
        })) 
        : validOrders;

    return (
        <div className="dashboard-page-container">
            <div className="dashboard-layout">
                <Sidebar />

                <main className="dashboard-main">
                    <header className="dashboard-header">
                        <div className="search-pill" style={{ position: 'relative' }}>
                            <span className="search-icon">🔍</span>
                            <input 
                                type="text" 
                                placeholder="Search my orders..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            />
                            {isSearchFocused && (
                                <div className="search-dropdown">
                                    {displayedSearchOrders.length > 0 ? (
                                        displayedSearchOrders.map(o => (
                                            <div 
                                                key={o._id} 
                                                onClick={() => {
                                                    setSearchTerm('');
                                                }}
                                                className="search-item"
                                            >
                                                <img src={o.products[0]?.productImage || ((o.products[0]?.product?.images && o.products[0].product.images.length > 0) ? o.products[0].product.images[0] : (o.products[0]?.product?.image || itemStandard))} alt="Order" />
                                                <div>
                                                    <p className="search-title">{o.products?.[0]?.productTitle || o.products?.[0]?.product?.title || 'Product Deleted'}</p>
                                                    <p className="search-subtitle">
                                                        ₹{o.totalAmount || 0} • {(o.status || 'Order').charAt(0).toUpperCase() + (o.status || 'Order').slice(1)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="search-no-results">No order found</div>
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
                            <h1>Order History</h1>
                            <p>Track and manage your past college essential purchases</p>
                        </div>

                        <div className="orders-container">
                            <div className="orders-tabs-wrapper">
                                <div className="orders-tabs">
                                    {tabs.map(tab => (
                                        <button
                                            key={tab}
                                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                                            onClick={() => setActiveTab(tab)}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="orders-list">
                                {(() => {
                                    let statusKey = 'all';
                                    if (activeTab === 'Active') statusKey = 'active';
                                    else if (activeTab === 'Completed') statusKey = 'completed';
                                    else if (activeTab === 'Cancelled') statusKey = 'cancelled';
                                    
                                    const filtered = getFilteredOrders(statusKey);
                                    return filtered.length > 0 ? (
                                        filtered.map(order => renderOrderCard(order))
                                    ) : renderEmptyState();
                                })()}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default Orders;
