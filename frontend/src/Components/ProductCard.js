import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useModal } from '../context/ModalContext';

import itemStandard from '../assets/image.webp';
import '../styles/ProductCard.css';


const ProductCard = ({ product, isSeller, onDelete, isWishlistPage, onRemove, showContactBtn, initialIsWishlisted, isAdmin, variant = 'grid' }) => {
    const navigate = useNavigate();
    const token = sessionStorage.getItem('token');
    const { showModal } = useModal();
    let currentUser = null;
    if (token) {
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                currentUser = JSON.parse(atob(parts[1]));
            }
        } catch (e) {
            console.error("JWT Decode Error:", e);
        }
    }
    const isSuspended = sessionStorage.getItem('isSuspended') === 'true';
    const isUnverified = false;
    const currentUserId = currentUser?.id || currentUser?._id;
    const isOwnProduct = currentUserId && (product.seller?._id || product.seller) === currentUserId;

    const [isWishlisted, setIsWishlisted] = React.useState(initialIsWishlisted || false);
    const hasSyncOnce = React.useRef(false);

    React.useEffect(() => {
        // Only sync from parent if it's the first time OR if we didn't just toggle locally
        if (initialIsWishlisted !== undefined && !hasSyncOnce.current) {
            setIsWishlisted(initialIsWishlisted);
            hasSyncOnce.current = true;
            return;
        }

        // Parent prop changed (e.g. after fetch), sync it
        if (initialIsWishlisted !== undefined && initialIsWishlisted !== isWishlisted) {
            setIsWishlisted(initialIsWishlisted);
            return;
        }

        const checkWishlist = async () => {
            if (token && product?._id && initialIsWishlisted === undefined) {
                try {
                    const res = await axios.get('http://localhost:5001/api/auth/wishlist', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const isItemWishlisted = res.data.some(item => item && item._id === product._id);
                    setIsWishlisted(isItemWishlisted);
                } catch (err) {
                    console.error("Error checking wishlist status:", err);
                }
            }
        };
        checkWishlist();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product?._id, token, initialIsWishlisted]);

    const handleWishlistToggle = async (e) => {
        e.stopPropagation();
        if (!token) {
            navigate('/login');
            return;
        }
        if (isUnverified && currentUser?.role !== 'admin') {
            showModal({
                title: 'Account Pending Approval',
                message: 'Your account is currently under review. You will be able to wishlist items once an administrator approves your account.',
                type: 'alert'
            });
            return;
        }
        try {
            if (isWishlistPage && onRemove) {
                // Let the wishlist page handle both API and state update
                onRemove(product._id);
                return;
            }

            const res = await axios.post(`http://localhost:5001/api/auth/wishlist/${product._id}`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setIsWishlisted(res.data.isWishlisted);
            window.dispatchEvent(new Event('wishlistUpdated'));
        } catch (err) {
            console.error("Wishlist error:", err);
        }
    };

    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
    const images = (product.images && product.images.length > 0)
        ? product.images
        : (product.image ? [product.image] : [itemStandard]);

    const nextImage = (e) => {
        if (e) e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    React.useEffect(() => {
        if (images.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [images.length]);

    const handleChat = async (e) => {
        e.stopPropagation();
        if (!token) {
            navigate('/login');
            return;
        }
        if (isUnverified && currentUser?.role !== 'admin') {
            showModal({
                title: 'Account Pending Approval',
                message: 'Your account is currently under review. You will be able to message sellers once an administrator approves your account.',
                type: 'alert'
            });
            return;
        }
        try {
            const sellerId = product.seller?._id || product.seller;
            await axios.post('http://localhost:5001/api/chat/send', {
                receiverId: sellerId,
                productId: product._id,
                content: `Hi, I'm interested in "${product.title}".`
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate(`/messages?userId=${sellerId}&productId=${product._id}`);
        } catch (err) {
            console.error("Chat error:", err);
            const sellerId = product.seller?._id || product.seller;
            navigate(`/messages?userId=${sellerId}&productId=${product._id}`);
        }
    };

    const handleAddToCart = async (e) => {
        e.stopPropagation();
        if (!token) {
            navigate('/login');
            return;
        }
        if (isUnverified && currentUser?.role !== 'admin') {
            showModal({
                title: 'Account Pending Approval',
                message: 'Your account is currently under review. You will be able to add items to your cart once an administrator approves your account.',
                type: 'alert'
            });
            return;
        }
        try {
            await axios.post(`http://localhost:5001/api/auth/cart/${product._id}`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            window.dispatchEvent(new Event('cartUpdated'));
            showModal({ title: 'Success', message: "Added to cart! 🛒", type: 'alert' });
        } catch (err) {
            console.error("Cart error:", err);
            const msg = err.response?.data?.message || "Error adding to cart";
            showModal({ title: 'Error', message: msg, type: 'alert' });
        }
    };

    if (variant === 'row') {
        return (
            <div 
                className={`product-card-row ${isAdmin ? 'admin-view' : ''}`} 
                onClick={!isAdmin ? () => navigate(`/product/${product._id}`) : undefined}
                style={isAdmin ? { cursor: 'default' } : { cursor: 'pointer' }}
            >
                <div className="row-image-container">
                    <img src={images[currentImageIndex]} alt={product.title} className="row-image" />
                    {images.length > 1 && (
                        <div className="row-image-overlay">
                            <span>{images.length} Photos</span>
                        </div>
                    )}
                </div>

                <div className="row-details-container">
                    <div className="row-main-info">
                        <div className="row-header-top">
                            <span className={`row-category cat-${(product.category || 'others').toLowerCase().replace(/\s+/g, '-')}`}>
                                {product.category}
                            </span>
                            <span className="row-price">₹{product.price}</span>
                        </div>
                        <h3 className="row-title">{product.title}</h3>
                        <p className="row-description">
                            {product.description?.length > 120 ? `${product.description.substring(0, 120)}...` : product.description}
                        </p>
                        
                        <div className="row-meta-tags">
                            {product.condition && <span className="row-meta-tag">🏷️ {product.condition}</span>}
                            {product.yearsUsed !== undefined && <span className="row-meta-tag">⏳ {product.yearsUsed} Years Used</span>}
                            {product.pickupPoint && <span className="row-meta-tag">📍 {product.pickupPoint}</span>}
                        </div>
                    </div>

                    <div className="row-actions-container">
                        <div className="row-action-btns">
                            {showContactBtn && (
                                <button 
                                    className="row-action-btn contact"
                                    onClick={(e) => { e.stopPropagation(); !isAdmin && !isSuspended && !isOwnProduct && handleChat(e); }}
                                    disabled={isAdmin || isSuspended || isOwnProduct}
                                    title={isAdmin ? "Disabled for Admin" : isSuspended ? "Account Suspended" : isOwnProduct ? "Cannot contact yourself" : "Contact Seller"}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                    Message
                                </button>
                            )}
                            {!isSeller && (
                                <button 
                                    className="row-action-btn cart"
                                    onClick={(e) => { e.stopPropagation(); !isAdmin && !isSuspended && !isUnverified && !isOwnProduct && handleAddToCart(e); }}
                                    disabled={isAdmin || isSuspended || (isUnverified && currentUser?.role !== 'admin') || isOwnProduct}
                                    title={isAdmin ? "Disabled for Admin" : isSuspended ? "Account Suspended" : (isUnverified && currentUser?.role !== 'admin') ? "Pending Approval" : isOwnProduct ? "Cannot add own item to cart" : "Add to Cart"}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                                    Add to Cart
                                </button>
                            )}
                        </div>
                        {isWishlistPage && onRemove && (
                            <button 
                                className="row-remove-btn"
                                onClick={(e) => { e.stopPropagation(); onRemove(product._id); }}
                                title="Remove from Wishlist"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    <line x1="9" y1="11" x2="9" y2="17" />
                                    <line x1="12" y1="11" x2="12" y2="17" />
                                    <line x1="15" y1="11" x2="15" y2="17" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="product-card" onClick={!isAdmin ? () => navigate(`/product/${product._id}`) : undefined} style={isAdmin ? { cursor: 'default' } : { cursor: 'pointer' }}>
            <div className="product-image-wrapper">
                <img
                    src={images[currentImageIndex]}
                    alt={product.title}
                    className="product-image"
                />

                {images.length > 1 && (
                    <div className="carousel-controls">
                        <button className="carousel-btn prev" onClick={prevImage}>‹</button>
                        <button className="carousel-btn next" onClick={nextImage}>›</button>
                        <div className="carousel-dots">
                            {images.map((_, idx) => (
                                <span key={idx} className={`dot ${idx === currentImageIndex ? 'active' : ''}`}></span>
                            ))}
                        </div>
                    </div>
                )}

                {!isSeller && (
                    <button
                        className={`wishlist-heart-btn ${isWishlisted || isWishlistPage ? 'active' : ''}`}
                        onClick={!isAdmin && !isSuspended && !isUnverified && !isOwnProduct ? handleWishlistToggle : undefined}
                        disabled={isAdmin || isSuspended || (isUnverified && currentUser?.role !== 'admin') || isOwnProduct}
                        style={(isAdmin || isSuspended || (isUnverified && currentUser?.role !== 'admin') || isOwnProduct) ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                        title={isAdmin ? "Interaction disabled for Admin" : isSuspended ? "Account suspended" : (isUnverified && currentUser?.role !== 'admin') ? "Pending Approval" : isOwnProduct ? "Cannot wishlist own item" : (isWishlisted || isWishlistPage ? "Remove from Wishlist" : "Add to Wishlist")}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={(isWishlisted || isWishlistPage) ? "#22c55e" : "none"} stroke={(isWishlisted || isWishlistPage) ? "#22c55e" : "white"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                )}
            </div>

            <div className="product-content">
                <span className={`product-category cat-${(product.category || 'others').toLowerCase().replace(/\s+/g, '-')}`}>
                    {product.category}
                </span>
                <div className="product-header-row">
                    <h3 className="product-title">{product.title}</h3>
                </div>

                <div className="product-footer">
                    <div className="footer-main-row">
                        <span className="product-price">₹{product.price}</span>
                        {product.averageRating > 0 && (
                            <div className="rating-summary">
                                <span className="star-icon">★</span>
                                <span className="rating-val">{product.averageRating.toFixed(1)}</span>
                                <span className="rating-count">({product.reviewCount})</span>
                            </div>
                        )}
                    </div>
                    <div className="product-tags" style={{ display: 'flex', flexWrap: 'nowrap', gap: '0.35rem', alignItems: 'center', overflow: 'hidden' }}>
                        {product.yearsUsed !== undefined && product.yearsUsed !== null && (
                            <span className="years-used-tag" style={{ fontSize: '0.7rem', padding: '2px 6px', whiteSpace: 'nowrap', flexShrink: 0 }}>⏳ {product.yearsUsed} yrs</span>
                        )}
                        {product.condition && <span className="condition-tag" style={{ fontSize: '0.7rem', padding: '2px 6px', whiteSpace: 'nowrap', flexShrink: 0 }}>🏷️ {product.condition}</span>}
                    </div>
                </div>
                {product.pickupPoint && (
                    <div className="pickup-info">
                        <span>📍 Pickup: {product.pickupPoint}</span>
                    </div>
                )}

                {showContactBtn && (
                    <div className="card-action-btns">
                        <button 
                            className="contact-seller-btn" 
                            onClick={!isAdmin && !isSuspended && !isUnverified && !isOwnProduct ? handleChat : undefined}
                            disabled={isAdmin || isSuspended || (isUnverified && currentUser?.role !== 'admin') || isOwnProduct}
                            style={(isAdmin || isSuspended || (isUnverified && currentUser?.role !== 'admin') || isOwnProduct) ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                            title={isOwnProduct ? "Cannot contact yourself" : (isUnverified && currentUser?.role !== 'admin') ? "Pending Approval" : ""}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                            Contact
                        </button>
                        {!isSeller && (
                            <button 
                                className="add-to-cart-btn" 
                                onClick={!isAdmin && !isSuspended && !isUnverified && !isOwnProduct ? handleAddToCart : undefined}
                                disabled={isAdmin || isSuspended || (isUnverified && currentUser?.role !== 'admin') || isOwnProduct}
                                style={(isAdmin || isSuspended || (isUnverified && currentUser?.role !== 'admin') || isOwnProduct) ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                                title={isOwnProduct ? "Cannot add own item to cart" : (isUnverified && currentUser?.role !== 'admin') ? "Pending Approval" : ""}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                                Cart
                            </button>
                        )}
                    </div>
                )}

                {isSeller && (
                    <div className="management-actions">
                        <button
                            className="edit-btn"
                            onClick={(e) => { e.stopPropagation(); navigate(`/edit/${product._id}`); }}
                        >
                            Edit
                        </button>
                        <button
                            className="remove-btn"
                            onClick={(e) => { e.stopPropagation(); onDelete(product._id); }}
                        >
                            Remove
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductCard;
