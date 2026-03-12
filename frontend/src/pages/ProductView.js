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

                const allRes = await axios.get('http://localhost:5001/api/products');
                const similar = allRes.data.filter(
                    p => p.category === res.data.category && p._id !== res.data._id
                );
                setSimilarItems(similar.slice(0, 4));

                if (token) {
                    const wishRes = await axios.get(
                        'http://localhost:5001/api/auth/wishlist',
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
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

    if (loading) return <div className="loading">Loading Product...</div>;
    if (!product) return <div className="error">Product not found</div>;

    return (
        <div className="product-view-container">

            <nav className="breadcrumb">
                <Link to="/">Home</Link>
                <span>›</span>
                <Link to={`/products?category=${product.category}`}>
                    {product.category}
                </Link>
                <span>›</span>
                <span className="current">{product.title}</span>
            </nav>

            <main className="product-view-content">
                <div className="view-left">
                    <div className="main-image">
                        <img
                            src={product.image || defaultProduct}
                            alt={product.title}
                        />
                    </div>

                    <div className="detail-section">
                        <h3>Description</h3>
                        <p>{product.description}</p>
                    </div>
                </div>

                <div className="view-right">
                    <div className="pricing-card">
                        <h2>{product.title}</h2>
                        <p className="current-price">₹{product.price}</p>

                        {/* ✅ Updated Contact Seller Button */}
                        <button
                            className="chat-btn"
                            onClick={() => navigate(`/contact/${product._id}`)}
                        >
                            Contact Seller
                        </button>
                    </div>
                </div>
            </main>

            <section className="similar-section">
                <h2>Similar Items</h2>
                <div className="products-grid">
                    {similarItems.map(item => (
                        <ProductCard key={item._id} product={item} />
                    ))}
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default ProductView;