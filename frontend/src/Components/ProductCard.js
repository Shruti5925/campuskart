import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import itemStandard from '../assets/image.webp';
import '../styles/ProductCard.css';


const ProductCard = ({ product, isSeller, onDelete, isWishlistPage, onRemove, showContactBtn, initialIsWishlisted }) => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
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
        if (initialIsWishlisted !== undefined) {
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
    }, [product?._id, token, initialIsWishlisted]);

    const handleWishlistToggle = async (e) => {
        e.stopPropagation();
        if (!token) {
            navigate('/login');
            return;
        }
        try {
            const res = await axios.post(`http://localhost:5001/api/auth/wishlist/${product._id}`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setIsWishlisted(res.data.isWishlisted);
            if (isWishlistPage && onRemove) {
                onRemove(product._id);
            }
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
            nextImage();
        }, 3000);

        return () => clearInterval(interval);
    }, [images.length]);

    const categorySlug = (product.category || 'others').toLowerCase().replace(/\s+/g, '-');

    const handleChat = async (e) => {
        e.stopPropagation();
        if (!token) {
            navigate('/login');
            return;
        }
        try {
            await axios.post('http://localhost:5001/api/chat/send', {
                receiverId: product.seller?._id || product.seller,
                productId: product._id,
                content: `Hi, I'm interested in "${product.title}".`
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/messages');
        } catch (err) {
            console.error("Chat error:", err);
            navigate('/messages');
        }
    };

    const handleAddToCart = async (e) => {
        e.stopPropagation();
        if (!token) {
            navigate('/login');
            return;
        }
        try {
            await axios.post(`http://localhost:5001/api/auth/cart/${product._id}`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            window.dispatchEvent(new Event('cartUpdated'));
            alert("Added to cart! 🛒");
        } catch (err) {
            console.error("Cart error:", err);
            const msg = err.response?.data?.message || "Error adding to cart";
            alert(msg);
        }
    };

    return (
        <div className="product-card" onClick={() => navigate(`/product/${product._id}`)}>
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
                        onClick={handleWishlistToggle}
                        title={isWishlisted || isWishlistPage ? "Remove from Wishlist" : "Add to Wishlist"}
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
                        <button className="contact-seller-btn" onClick={handleChat}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                            Contact
                        </button>
                        {!isSeller && (product.seller?._id || product.seller) !== currentUser?.id && (
                            <button className="add-to-cart-btn" onClick={handleAddToCart}>
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
