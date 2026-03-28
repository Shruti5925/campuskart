import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useModal } from '../context/ModalContext';
import Footer from '../Components/Footer';
import '../styles/Cart.css';
import '../styles/Dashboard.css';

const Cart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = sessionStorage.getItem('token');
    const navigate = useNavigate();
    const isSuspended = sessionStorage.getItem('isSuspended') === 'true';
    const { showModal } = useModal();

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchCart();
    }, [token]);

    const fetchCart = async () => {
        try {
            const res = await axios.get('http://localhost:5001/api/auth/cart', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCartItems(res.data);
        } catch (err) {
            console.error("Error fetching cart:", err);
        } finally {
            setLoading(false);
        }
    };

    const removeFromCart = async (productId) => {
        showModal({
            title: 'Remove Item',
            message: 'Are you sure you want to remove this item from your saved list?',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await axios.delete(`http://localhost:5001/api/auth/cart/${productId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setCartItems(prev => prev.filter(item => item.product._id !== productId));
                    window.dispatchEvent(new Event('cartUpdated'));
                } catch (err) {
                    console.error("Error removing from cart:", err);
                    showModal({ title: 'Error', message: 'Failed to remove item', type: 'alert' });
                }
            }
        });
    };

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => total + ((item.product?.price || 0) * (item.quantity || 1)), 0);
    };

    const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

    const handleChatWithSellers = async () => {
        if (!token) {
            navigate('/login');
            return;
        }

        if (cartItems.length === 0) return;

        try {
            let firstConvId = null;

            // Loop through all cart items to ping every seller and trigger auto-orders
            for (const item of cartItems) {
                if (item.product && item.product.seller) {
                    const response = await axios.post('http://localhost:5001/api/chat/send', {
                        receiverId: item.product.seller._id,
                        productId: item.product._id,
                        content: `Hi, I'm interested in purchasing ${item.product.title}`
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    if (!firstConvId && response.data?.conversationId) {
                        firstConvId = response.data.conversationId;
                    }
                }
            }

            if (firstConvId) {
                navigate(`/messages?convId=${firstConvId}`);
            } else {
                navigate('/messages');
            }
        } catch (err) {
            console.error("Chat & Checkout error:", err);
            navigate('/messages');
        }
    };

    const handleCheckout = async () => {
        if (cartItems.length === 0) return;
        
        showModal({
            title: 'Confirm Purchase',
            message: "Confirming purchase will move these items to your 'Previous Orders' history. Continue?",
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await axios.post('http://localhost:5001/api/orders/checkout', { status: 'completed' }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    showModal({
                        title: 'Success',
                        message: "Order recorded successfully! You can find it in your Previous Orders.",
                        type: 'alert'
                    });
                    window.dispatchEvent(new Event('cartUpdated'));
                    navigate('/orders');
                } catch (err) {
                    console.error("Checkout error:", err);
                    showModal({
                        title: 'Checkout Failed',
                        message: "Failed to record order. Please try again.",
                        type: 'alert'
                    });
                }
            }
        });
    };

    if (loading) return <div className="cart-loading">Loading your cart...</div>;

    return (
        <div className="dashboard-page-container">
            <div className="cart-container-v2">
            <div className="cart-main-layout">
                <div className="cart-left-section">
                    <div className="cart-title-block">
                        <h1>Interested Items</h1>
                        <p className="cart-subtitle">
                            <span className="cart-icon-mini">📌</span> {totalItems} {totalItems === 1 ? 'ITEM' : 'ITEMS'} SAVED FOR LATER
                        </p>
                    </div>

                    {cartItems.length === 0 ? (
                        <div className="empty-cart-v2">
                            <div className="empty-state-icon">👀</div>
                            <h2>You haven't saved any items yet</h2>
                            <p>Explore our campus marketplace and find great deals to save here!</p>
                            <Link to="/products" className="start-shopping-btn">Explore Campus</Link>
                        </div>
                    ) : (
                        <div className="cart-items-stack">
                            {cartItems.map((item) => (
                                <div key={item.product?._id} className="cart-item-card-v2">
                                    <div className="cart-item-img-box">
                                        <img src={item.product?.images?.[0] || item.product?.image} alt={item.product?.title} />
                                    </div>
                                    <div className="cart-item-info-box">
                                        <div className="item-main-details">
                                            <div className="item-title-row">
                                                <div className="item-title-col">
                                                    <h3 onClick={() => navigate(`/product/${item.product?._id}`)}>{item.product?.title}</h3>
                                                    <div className="item-badges-row">
                                                        <span className={`item-badge category-${item.product?.category?.toLowerCase()}`}>{item.product?.category}</span>
                                                        <span className="item-badge condition-badge">{item.product?.condition}</span>
                                                    </div>
                                                </div>
                                                <span className="item-price-tag">₹{item.product?.price?.toFixed(2)}</span>
                                            </div>
                                            <div className="item-description-preview">
                                                {item.product?.description?.length > 100 ? `${item.product.description.substring(0, 100)}...` : item.product?.description}
                                            </div>
                                            <div className="item-meta-row">
                                                <div className="meta-info seller-main">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                                    <span className="seller-name-label">Seller: {item.product?.seller?.firstName} {item.product?.seller?.lastName}</span>
                                                </div>
                                                <div className="seller-contact-details">
                                                    <div className="meta-info mini-meta">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                                        <span>{item.product?.seller?.email}</span>
                                                    </div>
                                                    <div className="meta-info mini-meta">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                                        <span>{item.product?.seller?.mobileNumber}</span>
                                                    </div>
                                                </div>
                                                <div className="meta-info">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                                    <span>Pickup: {item.product?.pickupPoint || 'Campus Pickup'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="item-controls-row">
                                            <button className="remove-link-btn" onClick={() => removeFromCart(item.product?._id)}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                Remove Item
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="cart-footer-actions">
                        <Link to="/products" className="continue-shopping">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                            Continue Shopping
                        </Link>
                    </div>
                </div>

                <div className="cart-right-section">
                    <div className="order-summary-card">
                        <h2>Meetup Summary</h2>
                        {isSuspended && (
                            <div className="suspension-warning-box" style={{ 
                                backgroundColor: '#fef2f2', 
                                border: '1px solid #fee2e2', 
                                padding: '1rem', 
                                borderRadius: '12px', 
                                marginBottom: '1.5rem',
                                display: 'flex',
                                gap: '0.75rem',
                                color: '#991b1b'
                            }}>
                                <span style={{ fontSize: '1.25rem' }}>🚫</span>
                                <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.4' }}>
                                    <strong>Checkout Restricted:</strong> Your account is currently suspended. You cannot initiate chats or confirm purchases.
                                </p>
                            </div>
                        )}
                        <div className="summary-list">
                            <div className="summary-item">
                                <span>Estimated Value ({totalItems} items)</span>
                                <span>₹{calculateTotal().toFixed(2)}</span>
                            </div>
                            <div className="summary-item">
                                <span>Platform Fee</span>
                                <span className="primary-text">Free</span>
                            </div>
                            <div className="summary-item">
                                <span>Seller Contact Details</span>
                                <span className="primary-text">Included</span>
                            </div>
                        </div>
                        <div className="summary-divider-v2"></div>
                        <div className="summary-total-row">
                            <span>Total Estimated Value</span>
                            <span className="total-price-v2">₹{calculateTotal().toFixed(2)}</span>
                        </div>
                        <div className="cart-action-buttons">
                            <button 
                                className="checkout-btn-v2" 
                                onClick={handleChatWithSellers}
                                disabled={isSuspended}
                                style={isSuspended ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                            >
                                {isSuspended ? 'Account Suspended' : 'Chat with Sellers'}
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                            </button>
                            <button 
                                className="confirm-order-btn" 
                                onClick={handleCheckout}
                                disabled={isSuspended}
                                style={isSuspended ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                            >
                                {isSuspended ? 'Restricted' : 'Confirm Purchase'}
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
                            </button>
                        </div>
                        <p className="checkout-disclaimer">Important: CampusKart does not process payments. All transactions happen directly between students during meetup.</p>
                        <div className="safety-badge">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                            <span>Always meet in public campus areas</span>
                        </div>
                    </div>
                </div>
            </div>
            </div>
            <Footer />
        </div>
    );
};

export default Cart;
