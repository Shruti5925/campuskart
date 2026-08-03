import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Footer from '../Components/Footer';
import '../styles/Guidelines.css';

const Guidelines = () => {
    const [activeTab, setActiveTab] = useState('Safety Tips');
    const location = useLocation();

    const menuItems = [
        { name: 'Safety Tips', icon: '🛡️', targetId: 'safety-standards' },
        { name: 'Selling Rules', icon: '🏷️', targetId: 'selling-etiquette' },
        { name: 'Prohibited Items', icon: '🚫', targetId: 'prohibited-items' },
        { name: 'Buying Guide', icon: '🛍️', targetId: 'buying-guide' },
        { name: 'ID Verification', icon: '🪪', targetId: 'safety-standards' }
    ];

    useEffect(() => {
        const hash = location.hash.replace('#', '');
        if (hash) {
            const item = menuItems.find(i => i.targetId === hash);
            if (item) {
                setActiveTab(item.name);
            }

            // Scroll to the hash ID regardless of whether it's in menuItems
            setTimeout(() => {
                const element = document.getElementById(hash);
                if (element) {
                    const headerOffset = 100;
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    window.scrollTo({ top: offsetPosition, behavior: "auto" });
                }
            }, 100);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

    const scrollToSection = (id, name) => {
        setActiveTab(name);
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "auto"
            });
        }
    };

    return (
        <div className="guidelines-page">
            <div className="guidelines-layout">
                {/* Left Sidebar */}
                <aside className="guidelines-sidebar">
                    <div className="sidebar-sticky">
                        <div className="sidebar-header">
                            <div className="icon-box">👥</div>
                            <div className="text-box">
                                <h3>Community</h3>
                                <p>Trust & Safety</p>
                            </div>
                        </div>

                        <nav className="sidebar-menu">
                            {menuItems.map(item => (
                                <button
                                    key={item.name}
                                    className={`menu-item ${activeTab === item.name ? 'active' : ''}`}
                                    onClick={() => scrollToSection(item.targetId, item.name)}
                                >
                                    <span className="menu-icon">{item.icon}</span>
                                    {item.name}
                                </button>
                            ))}
                        </nav>

                        <div className="help-card">
                            <h4>Need immediate help?</h4>
                            <p>If you encounter a suspicious user or feel unsafe, contact campus security or our 24/7 support.</p>
                            <button className="contact-support-btn">Contact Support</button>
                        </div>
                    </div>
                </aside>

                {/* Right Content Area */}
                <main className="guidelines-content">
                    <section className="hero-section">
                        <h1>Community Guidelines & <span>Safety</span></h1>
                        <p>CampusKart is built on trust. We are a college-exclusive community. Follow these rules to keep our marketplace safe, friendly, and reliable for everyone.</p>
                    </section>

                    <div className="content-section" id="safety-standards">
                        <div className="section-title-row">
                            <span className="dot-icon">✅</span>
                            <h2>Campus Safety Standards</h2>
                        </div>
                        <div className="cards-grid">
                            <div className="standard-card">
                                <div className="card-icon">📍</div>
                                <h4>Public Meetups Only</h4>
                                <p>Always meet in well-lit, high-traffic campus areas like the library foyer, student union, or near security desks.</p>
                            </div>
                            <div className="standard-card">
                                <div className="card-icon">🪪</div>
                                <h4>Verify Student IDs</h4>
                                <p>Before exchanging money or items, ask to see a valid student or staff ID card to confirm their identity.</p>
                            </div>
                            <div className="standard-card">
                                <div className="card-icon">💸</div>
                                <h4>Secure Payments</h4>
                                <p>Avoid wire transfers. Use UPI or cash in person once you have inspected the item. Never pay in advance.</p>
                            </div>
                        </div>
                    </div>

                    <div className="content-section" id="selling-etiquette">
                        <div className="section-title-row">
                            <span className="dot-icon">🛍️</span>
                            <h2>Selling Etiquette</h2>
                        </div>
                        <div className="etiquette-list">
                            <div className="etiquette-item">
                                <div className="number-badge">1</div>
                                <div className="item-text">
                                    <h4>Honest Descriptions</h4>
                                    <p>Be transparent about the condition of your books, furniture, or electronics. Disclose any scratches, missing pages, or defects.</p>
                                </div>
                            </div>
                            <div className="etiquette-item">
                                <div className="number-badge">2</div>
                                <div className="item-text">
                                    <h4>Quality Photos</h4>
                                    <p>Upload at least 3 clear, original photos of the actual item. Stock photos from the internet are not allowed.</p>
                                </div>
                            </div>
                            <div className="etiquette-item">
                                <div className="number-badge">3</div>
                                <div className="item-text">
                                    <h4>Fair Campus Pricing</h4>
                                    <p>Keep prices student-friendly. Research what similar items are selling for in the community.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="content-section" id="prohibited-items">
                        <div className="prohibited-box">
                            <div className="box-header">
                                <span className="box-icon">🛑</span>
                                <h3>Prohibited Items</h3>
                            </div>
                            <p className="box-desc">To maintain a safe academic environment, the following are strictly banned from CampusKart:</p>
                            <div className="prohibited-grid">
                                <span className="prohibited-item"><span className="dot">●</span> Illegal substances</span>
                                <span className="prohibited-item"><span className="dot">●</span> Weapons of any kind</span>
                                <span className="prohibited-item"><span className="dot">●</span> Alcohol or Tobacco</span>
                                <span className="prohibited-item"><span className="dot">●</span> Counterfeit goods</span>
                                <span className="prohibited-item"><span className="dot">●</span> Lab chemicals</span>
                                <span className="prohibited-item"><span className="dot">●</span> Used cosmetics</span>
                            </div>
                        </div>
                    </div>

                    <div className="content-section" id="buying-guide">
                        <div className="section-title-row">
                            <span className="dot-icon">📖</span>
                            <h2>Smart Buying Guide</h2>
                        </div>
                        <div className="guide-grid">
                            <div className="guide-card">
                                <div className="icon-side">🔍</div>
                                <div className="card-text">
                                    <h4>Inspect Before You Pay</h4>
                                    <p>Check for structural damage on study tables, battery health on laptops, and editions on textbooks. Once payment is made, returns are handled between you and the seller.</p>
                                </div>
                            </div>
                            <div className="guide-card">
                                <div className="icon-side">💬</div>
                                <div className="card-text">
                                    <h4>Keep Chats In-App</h4>
                                    <p>Always use CampusKart's internal messaging system. This helps us protect you if a dispute arises and keeps your personal phone number private.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default Guidelines;
