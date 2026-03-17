import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import itemStandard from '../assets/image.webp';
import '../styles/Orders.css';

const Orders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All Orders');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const token = localStorage.getItem('token');

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

    const getFilteredOrders = (status) => {
        let filtered = orders;
        if (status === 'active') filtered = orders.filter(o => o.status === 'pending');
        else if (status === 'completed') filtered = orders.filter(o => o.status === 'completed');
        else if (status === 'cancelled') filtered = orders.filter(o => o.status === 'cancelled');

        if (searchTerm) {
            filtered = filtered.filter(o => 
                o.products.some(p => p.product?.title?.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        return filtered;
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
            default:
                return { label: status.toUpperCase(), class: '' };
        }
    };

    const renderOrderCard = (order) => {
        const statusInfo = getStatusInfo(order.status);
        const mainProduct = order.products[0]?.product;
        const orderDate = new Date(order.createdAt);
        const isCancelled = order.status === 'cancelled';

        const orderIdDisplay = order?._id ? (order._id.toString().slice(-4).toUpperCase()) : '????';

        return (
            <div key={order._id} className="order-card-large" onClick={() => mainProduct?._id && navigate(`/product/${mainProduct._id}`)}>
                <div className="order-card-left">
                    <img 
                        src={(mainProduct?.images && mainProduct.images.length > 0) ? mainProduct.images[0] : (mainProduct?.image || itemStandard)} 
                        alt="product" 
                        className="order-img-large" 
                    />
                </div>
                
                <div className="order-card-center">
                    <div className="order-header-row">
                        <span className={`order-status-badge ${statusInfo.class}`}>{statusInfo.label}</span>
                        <span className="order-id-label">Order #CK-{orderIdDisplay}</span>
                    </div>
                    <h2 className="order-title-large">{mainProduct?.title || 'Product Deleted'}</h2>
                    <p className="order-seller">Seller: <span>{mainProduct?.seller?.firstName || 'Unknown Seller'}</span></p>
                    
                    <div className="order-actions">
                        {isCancelled ? (
                            <>
                                <button className="reorder-btn" onClick={(e) => { e.stopPropagation(); navigate(`/product/${mainProduct?._id}`); }}>
                                    Reorder Item
                                </button>
                                <button className="view-reason-btn" onClick={(e) => e.stopPropagation()}>
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

    const displayedSearchOrders = searchTerm ? orders.filter(o => o.products.some(p => p.product?.title?.toLowerCase().includes(searchTerm.toLowerCase()))) : orders;

    return (
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
                                            <img src={(o.products[0]?.product?.images && o.products[0].product.images.length > 0) ? o.products[0].product.images[0] : (o.products[0]?.product?.image || itemStandard)} alt="Order" />
                                            <div>
                                                <p className="search-title">{o.products?.[0]?.product?.title || 'Product'}</p>
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

                <footer className="dashboard-footer">
                    <p>© 2026 Campuskart • Exclusively for Students</p>
                    <div className="footer-links">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Use</a>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default Orders;
