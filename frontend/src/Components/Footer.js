import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = ({ isAdmin }) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const response = await fetch('http://localhost:5001/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', message: data.message });
                setEmail('');
            } else {
                setStatus({ type: 'error', message: data.message });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Something went wrong. Please try again.' });
        } finally {
            setLoading(false);
            // Clear message after 5 seconds
            setTimeout(() => setStatus({ type: '', message: '' }), 5000);
        }
    };

    return (
        <footer className={`footer ${isAdmin ? 'admin-footer' : ''}`}>
            {!isAdmin && (
                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="logo brand-logo-shared">
                            <div className="logo-box-shared">C</div>
                            <span className="brand-text-shared">CampusKart</span>
                        </div>
                        <p>The safest way to buy and sell used<br />items within your college community.</p>
                    </div>

                    <div className="footer-column">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><Link to="/guidelines">Safety Guidelines</Link></li>
                            <li><Link to="/guidelines#selling-etiquette">Campus Rules</Link></li>
                            <li><Link to="/guidelines#safety-standards">Student Verification</Link></li>
                            <li><Link to="/guidelines#prohibited-items">Prohibited Items</Link></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h4>Categories</h4>
                        <ul>
                            <li><Link to="/products?category=Books">Books</Link></li>
                            <li><Link to="/products?category=Fan">Fan</Link></li>
                            <li><Link to="/products?category=Trunk">Trunk</Link></li>
                            <li><Link to="/products?category=Cycles">Cycles</Link></li>
                            <li><Link to="/products?category=Others">Others</Link></li>
                        </ul>
                    </div>

                    <div className="footer-column newsletter">
                        <h4>Stay Connected</h4>
                        <p>Get notified about the latest items in your campus.</p>
                        <form className="newsletter-form" onSubmit={handleSubmit}>
                            <input
                                type="email"
                                placeholder="Campus Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                            <button type="submit" className="newsletter-btn" disabled={loading}>
                                {loading ? (
                                    <div className="spinner"></div>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                )}
                            </button>
                        </form>
                        {status.message && (
                            <div className={`subscription-message ${status.type}`}>
                                {status.message}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="footer-bottom">
                <p>© 2026 CampusKart Inc. Built for Students.</p>
                <div className="footer-legal">
                    <Link to="/privacy">Privacy Policy</Link>
                    <Link to="/terms">Terms of Service</Link>
                    <Link to="/cookies">Cookie Policy</Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
