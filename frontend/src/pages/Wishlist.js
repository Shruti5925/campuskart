import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useModal } from '../context/ModalContext';
import ProductCard from '../Components/ProductCard';
import Footer from '../Components/Footer';
import '../styles/Home.css'; // Reusing Home grid styles
import '../styles/Products.css';
import '../styles/Wishlist.css';

const Wishlist = () => {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = sessionStorage.getItem('token');
    const { showModal } = useModal();

    useEffect(() => {
        fetchWishlist();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchWishlist = async () => {
        try {
            const res = await axios.get('http://localhost:5001/api/auth/wishlist', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWishlist(res.data);
        } catch (err) {
            console.error("Error fetching wishlist:", err);
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (productId) => {
        showModal({
            title: 'Remove from Wishlist',
            message: 'Are you sure you want to remove this item from your saved items?',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await axios.post(`http://localhost:5001/api/auth/wishlist/${productId}`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setWishlist(prev => prev.filter(p => p._id !== productId));
                    window.dispatchEvent(new Event('wishlistUpdated'));
                } catch (err) {
                    console.error("Error removing from wishlist:", err);
                    showModal({ title: 'Error', message: 'Failed to remove from wishlist', type: 'alert' });
                }
            }
        });
    };

    if (loading) return <div className="loading-state" style={{ padding: '10rem', textAlign: 'center' }}>Loading your wishlist...</div>;

    return (
        <div className="dashboard-page-container">
            <div className="wishlist-page-container">
            <div className="section-header" style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#1e293b' }}>
                    My Saved <span style={{ color: '#22c55e' }}>Items</span> 💚
                </h1>
                <p style={{ color: '#64748b', marginTop: '0.5rem' }}>You have {wishlist.length} items in your wishlist</p>
            </div>

            <div className="products-grid">
                {wishlist.length === 0 ? (
                    <div className="empty-wishlist" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '6rem 2rem', background: '#f8fafc', borderRadius: '24px' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🛍️</div>
                        <h2 style={{ fontSize: '1.5rem', color: '#334155', marginBottom: '0.8rem' }}>Your wishlist is empty</h2>
                        <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 2rem' }}>Save items you're interested in while browsing and they'll appear here for quick access later.</p>
                        <a href="/products" className="browse-btn" style={{ background: '#22c55e', color: 'white', padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none' }}>Start Exploring</a>
                    </div>
                ) : (
                    wishlist.filter(p => p !== null).map(product => (
                        <ProductCard
                            key={product._id}
                            product={product}
                            isWishlistPage={true}
                            onRemove={removeFromWishlist}
                            showContactBtn={true}
                        />
                    ))
                )}
            </div>
            </div>
            <Footer />
        </div>
    );
};

export default Wishlist;
