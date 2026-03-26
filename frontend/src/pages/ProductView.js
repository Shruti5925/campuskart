import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useModal } from '../context/ModalContext';
import defaultProduct from '../assets/default-product.svg';
import itemStandard from '../assets/image.webp';
import ProductCard from '../Components/ProductCard';
import femaleAvatar from '../assets/female-avatar.png';
import maleAvatar from '../assets/male-avatar.png';
import ReportModal from '../Components/ReportModal';

import Footer from '../Components/Footer';
import '../styles/ProductView.css';


const StarRating = ({ rating, interactive, onRatingChange }) => {
    return (
        <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={`star ${star <= rating ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
                    onClick={() => interactive && onRatingChange(star)}
                >
                    ★
                </span>
            ))}
        </div>
    );
};

const ProductView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [similarItems, setSimilarItems] = useState([]);
    const [wishlisted, setWishlisted] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    // Review state
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reporting, setReporting] = useState(false);
    const [isFlaggedError, setIsFlaggedError] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const { showModal } = useModal();
    

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
    const isSuspended = localStorage.getItem('isSuspended') === 'true';
    const isVerified = localStorage.getItem('isVerified') !== 'false'; // Default to true if not set (to avoid blocking on load), but Navbar will set it precisely
    const isUnverified = localStorage.getItem('isVerified') === 'false';

    const fetchProductData = async () => {
        try {
            const res = await axios.get(`http://localhost:5001/api/products/${id}`);
            const productData = res.data;
            setProduct(productData);

            // Set initial image
            const images = (productData.images && productData.images.length > 0)
                ? productData.images
                : (productData.image ? [productData.image] : [itemStandard]);
            setSelectedImage(images[0]);

            // Fetch all other active items and shuffle
            const allRes = await axios.get('http://localhost:5001/api/products');

            const otherItems = allRes.data
                .filter(p =>
                    p._id.toString() !== id.toString() &&
                    (p.status === 'active' || !p.status)
                )
                .sort(() => 0.5 - Math.random());

            setSimilarItems(otherItems.slice(0, 4));

            // Check wishlist status
            if (token) {
                const wishRes = await axios.get('http://localhost:5001/api/auth/wishlist', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setWishlisted(wishRes.data.some(p => p._id === id));
            }

            setLoading(false);
        } catch (err) {
            console.error("Error fetching product:", err);
            if (err.response && err.response.status === 403) {
                setIsFlaggedError(true);
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProductData();
    }, [id, token]);

    const handleChat = async () => {
        if (!product || !product.seller) return;
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
            await axios.post('http://localhost:5001/api/chat/send', {
                receiverId: product.seller._id,
                productId: product._id,
                content: `Hi, I'm interested in "${product.title}". Is it still available?`
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/messages');
        } catch (err) {
            console.error("Chat error:", err);
            navigate('/messages'); // Still navigate if failed (maybe conv exists)
        }
    };

    const toggleWishlist = async () => {
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
            const res = await axios.post(`http://localhost:5001/api/auth/wishlist/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWishlisted(res.data.isWishlisted);
        } catch (err) {
            console.error("Error toggling wishlist:", err);
        }
    };

    const handleAddToCart = async () => {
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
            await axios.post(`http://localhost:5001/api/auth/cart/${id}`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            window.dispatchEvent(new Event('cartUpdated'));
            showModal({
                title: 'Cart Updated',
                message: "Added to cart! 🛒",
                type: 'alert'
            });
        } catch (err) {
            console.error("Cart error:", err);
            const msg = err.response?.data?.message || "Error adding to cart";
            showModal({
                title: 'Cart Error',
                message: msg,
                type: 'alert'
            });
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!token) {
            navigate('/login');
            return;
        }

        if (!newComment.trim()) {
            showModal({
                title: 'Review Error',
                message: "Please provide a comment.",
                type: 'alert'
            });
            return;
        }

        setSubmittingReview(true);
        try {
            await axios.post(`http://localhost:5001/api/products/${id}/reviews`, {
                rating: newRating,
                comment: newComment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setNewRating(5);
            setNewComment('');
            fetchProductData(); // Refresh product data to show new review
            showModal({
                title: 'Review Submitted',
                message: "Review submitted successfully!",
                type: 'alert'
            });
        } catch (err) {
            console.error("Error submitting review:", err);
            showModal({
                title: 'Submission Failed',
                message: err.response?.data?.message || "Failed to submit review",
                type: 'alert'
            });
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleActionClick = (e, callback) => {
        if (isSuspended) {
            showModal({
                title: 'Account Suspended',
                message: "Your account is suspended. You cannot perform this action.",
                type: 'alert'
            });
            return;
        }
        callback(e);
    };

    const handleReport = () => {
        if (!token) {
            navigate('/login');
            return;
        }
        setIsReportModalOpen(true);
    };

    if (loading) return <div className="loading">Loading Product...</div>;

    if (isFlaggedError) {
        return (
            <div className="product-view-container">
                <main className="product-main">
                    <div className="error-state-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🚩</div>
                        <h2 style={{ color: '#111827', marginBottom: '10px' }}>Item Under Review</h2>
                        <p style={{ color: '#6b7280', maxWidth: '500px', margin: '0 auto 30px' }}>
                            This product has been flagged by an administrator and is currently under review. 
                            It is temporarily unavailable for viewing or purchase.
                        </p>
                        <button onClick={() => navigate('/products')} className="back-btn" style={{ background: '#3b82f6', color: 'white', padding: '10px 25px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                            Browse Other Products
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!product) return <div className="error">Product not found</div>;

    const sellerAvatar = product.seller?.gender === 'Female' ? femaleAvatar : maleAvatar;
    const canReview = token && product.seller?._id !== currentUser?.id && !product.reviews?.some(r => r.user?._id === currentUser?.id);

    return (
        <div className="product-view-container">


            <nav className="breadcrumb">
                <Link to="/">Home</Link>
                <span>›</span>
                <Link to={`/products?category=${product.category}`}>{product.category}</Link>
                <span>›</span>
                <span className="current">{product.title}</span>
            </nav>

            <main className="product-view-content">
                <div className="view-left">
                    <div className="image-gallery">
                        <div className="main-image">
                            <span className="verified-badge">VERIFIED ITEM</span>
                            <img src={selectedImage} alt={product.title} />
                        </div>
                        <div className="thumbnail-grid">
                            {(product.images && product.images.length > 0 ? product.images : [selectedImage]).map((img, i) => (
                                <div
                                    key={i}
                                    className={`thumb ${img === selectedImage ? 'active' : ''}`}
                                    onClick={() => setSelectedImage(img)}
                                >
                                    <img src={img} alt={`thumb-${i}`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>Description</h3>
                        <p className="description-text">{product.description}</p>
                        <div className="note-card">
                            <p><strong>Safe Exchange:</strong> Meet the seller in person at {product.pickupPoint || 'the campus'} to inspect the item before buying.</p>
                        </div>
                    </div>

                    <div className="reviews-section">
                        <div className="reviews-header">
                            <h3>Reviews & Ratings ({product.reviewCount || 0})</h3>
                            {product.averageRating > 0 && (
                                <div className="avg-rating-display">
                                    <StarRating rating={Math.round(product.averageRating)} />
                                    <span>{product.averageRating.toFixed(1)} out of 5</span>
                                </div>
                            )}
                        </div>

                        {canReview && (
                            <form className="add-review-form" onSubmit={handleReviewSubmit}>
                                <h4>Add your review</h4>
                                <div className="rating-input">
                                    <label>Rate this item:</label>
                                    <StarRating rating={newRating} interactive={true} onRatingChange={setNewRating} />
                                </div>
                                <textarea
                                    placeholder="Write your experience with this item..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    rows="3"
                                />
                                <button type="submit" className="submit-review-btn" disabled={submittingReview || isSuspended}>
                                    {isSuspended ? 'Account Suspended' : submittingReview ? 'Submitting...' : 'Post Review'}
                                </button>
                            </form>
                        )}

                        <div className="reviews-list">
                            {product.reviews && product.reviews.length > 0 ? (
                                product.reviews.map((review) => (
                                    <div key={review._id} className="review-item">
                                        <div className="review-user">
                                            <img
                                                src={review.user?.gender === 'Female' ? femaleAvatar : maleAvatar}
                                                alt="user"
                                                className="review-user-avatar"
                                            />
                                            <div className="review-user-info">
                                                <p className="user-name">{review.user?.firstName} {review.user?.lastName}</p>
                                                <StarRating rating={review.rating} />
                                            </div>
                                            <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="review-comment">{review.comment}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="no-reviews">No reviews yet. Be the first to review!</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="view-right">
                    <div className="pricing-card">
                        <div className="pricing-header">
                            <span className={`cat-tag cat-${(product.category || 'other').toLowerCase().replace(/\s+/g, '-')}`}>{product.category || 'Other'}</span>
                            {product.averageRating > 0 && (
                                <div className="rating-pill">
                                    ★ {product.averageRating.toFixed(1)}
                                </div>
                            )}
                        </div>
                        <h2>{product.title} {product.condition ? `(${product.condition})` : ''}</h2>
                        <div className="price-row">
                            <span className="current-price">₹{product.price}</span>
                        </div>

                        <div className="info-grid">
                            {product.yearsUsed !== undefined && product.yearsUsed !== null && (
                                <div className="info-item">
                                    <span className="icon">⏳</span>
                                    <div>
                                        <p className="label">USED FOR</p>
                                        <p className="val">{product.yearsUsed} Years</p>
                                    </div>
                                </div>
                            )}
                            <div className="info-item">
                                <span className="icon">📍</span>
                                <div>
                                    <p className="label">PICKUP POINT</p>
                                    <p className="val">{product.pickupPoint || 'Campus'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="view-action-btns">
                            {product.status === 'sold' ? (
                                <button className="view-add-to-cart-btn sold-out-btn" disabled>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                    Item Sold Out
                                </button>
                            ) : (
                                <button 
                                    className={`view-add-to-cart-btn ${isSuspended || (isUnverified && currentUser?.role !== 'admin') ? 'disabled' : ''}`} 
                                    onClick={() => !isSuspended && handleAddToCart()}
                                    style={isSuspended || (isUnverified && currentUser?.role !== 'admin') ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                                    {isSuspended ? 'Account Suspended' : (isUnverified && currentUser?.role !== 'admin') ? 'Pending Approval' : 'Add to Cart'}
                                </button>
                            )}
                        </div>
                        <div className="action-row">
                            <button
                                className={`wishlist-btn ${wishlisted ? 'active' : ''}`}
                                onClick={toggleWishlist}
                                style={{ color: wishlisted ? '#22c55e' : 'inherit', border: wishlisted ? '1px solid #22c55e' : '1px solid #e2e8f0' }}
                            >
                                {wishlisted ? '💚 Saved to Wishlist' : '❤️ Wishlist'}
                            </button>
                            <button
                                className="wishlist-btn"
                                onClick={() => !isSuspended && handleChat()}
                                disabled={isSuspended}
                                style={{ color: 'inherit', border: '1px solid #e2e8f0', opacity: isSuspended ? 0.6 : 1, cursor: isSuspended ? 'not-allowed' : 'pointer' }}
                                title={isSuspended ? "Account Suspended" : "Chat with seller"}
                            >
                                💬 Chat
                            </button>
                        </div>

                        <div className="return-policy-badge">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="policy-icon"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
                            <span>3 Days Easy Return Policy</span>
                        </div>
                    </div>

                    <div className="seller-card">
                        <p className="sold-by">SOLD BY</p>
                        <div className="seller-info">
                            <img src={sellerAvatar} alt="seller" />
                            <div className="seller-details">
                                <h4>{product.seller?.firstName} {product.seller?.lastName} ✅</h4>
                                <p>{product.seller?.email}</p>
                            </div>
                        </div>
                        {product.pickupPoint && (
                            <div className="location-hint">
                                📍 Pick up at {product.pickupPoint}
                            </div>
                        )}
                    </div>

                    <div className="safety-card">
                        <div className="safety-header">
                            <span className="safety-icon">🛡️</span>
                            <p><strong>Campus Safety Tips</strong></p>
                        </div>
                        <p className="safety-text">Always meet in well-lit public areas on campus. Verify the item condition before any payment.</p>
                        <button 
                            className="report-item-btn" 
                            onClick={() => !isSuspended && handleReport()}
                            disabled={reporting || isSuspended}
                        >
                            <span className="icon">🚩</span> {reporting ? 'Reporting...' : 'Report this item'}
                        </button>
                    </div>
                </div>
            </main>

            <section className="similar-section">
                <div className="section-header">
                    <h2>Similar Items from your Campus</h2>
                    <Link to="/products" className="view-all">View all <span>→</span></Link>
                </div>
                <div className="similar-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '1.25rem'
                }}>
                    {similarItems.length > 0 ? (
                        similarItems.slice(0, 4).map(item => (
                            <ProductCard
                                key={item._id}
                                product={item}
                            />
                        ))
                    ) : (
                        <p className="no-results">No similar items found from your campus yet.</p>
                    )}
                </div>
            </section>

            <Footer />
            
            <ReportModal 
                isOpen={isReportModalOpen} 
                onClose={() => setIsReportModalOpen(false)} 
                targetId={product._id} 
                targetType="product"
                targetName={product.title}
            />
        </div>
    );
};

export default ProductView;
