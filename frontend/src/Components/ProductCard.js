import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import defaultProduct from '../assets/default-product.svg';
import itemStandard from '../assets/image.webp';
import '../styles/ProductCard.css';


const ProductCard = ({ product, isSeller, onDelete, isWishlistPage, onRemove, showContactBtn, initialIsWishlisted }) => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
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

    return (
        <div className="product-card" onClick={() => navigate(`/product/${product._id}`)}>
            <div className="product-image-wrapper">
                <img
                    src={itemStandard}
                    alt={product.title}
                    className="product-image"
                />
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
                <span className="product-category">{product.category}</span>
                <div className="product-header-row">
                    <h3 className="product-title">{product.title}</h3>
                </div>
                <p className="product-description">{product.description}</p>

                <div className="product-footer">
                    <span className="product-price">₹{product.price}</span>
                    <span className="seller-year-tag">🎓 {product.sellerYear || "3rd Year"}</span>
                </div>

                {showContactBtn && (
                    <button className="contact-seller-btn" onClick={(e) => { e.stopPropagation(); /* Logic for contact */ }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        Contact Seller
                    </button>
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
