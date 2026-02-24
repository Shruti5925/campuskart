import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import defaultProduct from '../assets/default-product.svg';
import itemStandard from '../assets/image.webp';
import ProductCard from '../Components/ProductCard';

import Footer from '../Components/Footer';
import '../styles/ProductView.css';


const ProductView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [similarItems, setSimilarItems] = useState([]);
    const [wishlisted, setWishlisted] = useState(false);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchProductData = async () => {
            try {
                const res = await axios.get(`http://localhost:5001/api/products/${id}`);
                setProduct(res.data);

                // Fetch similar items (same category)
                const allRes = await axios.get('http://localhost:5001/api/products');
                const similar = allRes.data.filter(p => p.category === res.data.category && p._id !== res.data._id);
                setSimilarItems(similar.slice(0, 4));

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
                setLoading(false);
            }
        };
        fetchProductData();
    }, [id, token]);

    const toggleWishlist = async () => {
        if (!token) {
            navigate('/login');
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

    if (loading) return <div className="loading">Loading Product...</div>;
    if (!product) return <div className="error">Product not found</div>;

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
                            <img src={itemStandard} alt={product.title} />

                        </div>
                        <div className="thumbnail-grid">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={`thumb ${i === 1 ? 'active' : ''}`}>
                                    <img src={itemStandard} alt="thumb" />

                                </div>
                            ))}
                            <div className="thumb more-thumb">
                                <img src={product.image || defaultProduct} alt="thumb" />

                                <div className="more-overlay">+2 More</div>
                            </div>
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>Description</h3>
                        <p className="description-text">{product.description}</p>
                        <ul className="spec-list">
                            <li>• Well-maintained, no major scratches or structural issues</li>
                            <li>• Pickup only from Hostel Block B (3rd Floor). Elevator available.</li>
                        </ul>
                        <div className="note-card">
                            <p><strong>Note:</strong> Pickup only from Hostel Block B (3rd Floor). Elevator available.</p>
                        </div>
                    </div>
                </div>

                <div className="view-right">
                    <div className="pricing-card">
                        <div className="pricing-header">
                            <span className="cat-tag">{product.category} & Decor</span>
                            <span className="post-time">🕒 Posted 2 hours ago</span>
                        </div>
                        <h2>{product.title} - Excellent Condition</h2>
                        <div className="price-row">
                            <span className="current-price">₹{product.price}</span>
                            <span className="old-price">₹{Math.floor(product.price * 1.5)}</span>
                            <span className="discount">50% OFF</span>
                        </div>

                        <div className="info-grid">
                            <div className="info-item">
                                <span className="icon">🕒</span>
                                <div>
                                    <p className="label">USED FOR</p>
                                    <p className="val">2 Years</p>
                                </div>
                            </div>
                            <div className="info-item">
                                <span className="icon">📍</span>
                                <div>
                                    <p className="label">LOCATION</p>
                                    <p className="val">Hostel Block B</p>
                                </div>
                            </div>
                        </div>

                        <button className="chat-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                            Chat with Seller
                        </button>
                        <div className="action-row">
                            <button
                                className={`wishlist-btn ${wishlisted ? 'active' : ''}`}
                                onClick={toggleWishlist}
                                style={{ color: wishlisted ? '#22c55e' : 'inherit', border: wishlisted ? '1px solid #22c55e' : '1px solid #e2e8f0' }}
                            >
                                {wishlisted ? '💚 Saved' : '❤️ Wishlist'}
                            </button>
                            <button className="share-btn">🔗</button>
                        </div>
                    </div>

                    <div className="seller-card">
                        <p className="sold-by">SOLD BY</p>
                        <div className="seller-info">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" alt="seller" />
                            <div className="seller-details">
                                <h4>{product.seller?.fullName || "Aryan K."} ✅</h4>
                                <p>Computer Science Dept • 4th Year</p>
                                <div className="seller-meta">
                                    <span className="rating">⭐ 4.8</span>
                                    <span className="sold-count">12 Items sold</span>
                                </div>
                            </div>
                        </div>
                        <div className="location-hint">
                            📍 Meets usually at Central Library or Food Court
                        </div>
                    </div>

                    <div className="safety-card">
                        <div className="safety-header">
                            <span className="safety-icon">🛡️</span>
                            <p><strong>Campus Safety Tips</strong></p>
                        </div>
                        <p className="safety-text">Always meet in well-lit public areas on campus. Verify the item condition before any payment.</p>
                    </div>
                </div>
            </main>

            <section className="similar-section">
                <div className="section-header">
                    <h2>Similar Items from your Campus</h2>
                    <Link to="/products" className="view-all">View all <span>→</span></Link>
                </div>
                <div className="products-grid"> {/* Use products-grid for consistency if same styles apply */}
                    {similarItems.map(item => (
                        <ProductCard
                            key={item._id}
                            product={item}
                        />
                    ))}
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default ProductView;
