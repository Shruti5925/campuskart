import React from 'react';
import '../styles/Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-brand">
                    <div className="logo">
                        <div className="logo-box">C</div>
                        CampusKart
                    </div>
                    <p>The safest way to buy and sell used<br />items within your college community.</p>
                </div>

                <div className="footer-column">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="/guidelines">Safety Guidelines</a></li>
                        <li><a href="/rules">Campus Rules</a></li>
                        <li><a href="/verification">Student Verification</a></li>
                        <li><a href="/prohibited">Prohibited Items</a></li>
                    </ul>
                </div>

                <div className="footer-column">
                    <h4>Categories</h4>
                    <ul>
                        <li><a href="/products?category=Books">Textbooks & Notes</a></li>
                        <li><a href="/products?category=Fan">Fan</a></li>
                        <li><a href="/products?category=Electronics">Electronics</a></li>
                        <li><a href="/products?category=Bicycles">Bicycles</a></li>
                    </ul>
                </div>

                <div className="footer-column newsletter">
                    <h4>Stay Connected</h4>
                    <p>Get notified about the latest items in your campus.</p>
                    <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                        <input type="email" placeholder="Campus Email" />
                        <button type="submit" className="newsletter-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                    </form>
                </div>
            </div>

            <div className="footer-bottom">
                <p>© 2024 CampusKart Inc. Built for Students.</p>
                <div className="footer-legal">
                    <a href="/privacy">Privacy Policy</a>
                    <a href="/terms">Terms of Service</a>
                    <a href="/cookies">Cookie Policy</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
