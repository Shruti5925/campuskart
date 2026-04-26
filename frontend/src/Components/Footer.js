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

                    <div className="footer-column support-column">
                        <h4>Support Center</h4>
                        <p>Have questions or need assistance? Our team is here to help you with any issues.</p>
                        <div className="support-links">
                            <Link to="/support" className="support-btn">
                                <span>🎧</span> Visit support page
                            </Link>
                            <div className="support-info">
                                <p>Email: support@banasthali.in</p>
                            </div>
                        </div>
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
