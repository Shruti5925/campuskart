import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useModal } from '../context/ModalContext';
import Sidebar from '../Components/Sidebar';
import Footer from '../Components/Footer';
import '../styles/Support.css';

const Support = () => {
    const navigate = useNavigate();
    const { showModal } = useModal();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTopic, setActiveTopic] = useState(null);
    const token = sessionStorage.getItem('token');

    const handleLiveChat = async () => {
        try {
            // Check if user is admin
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    if (payload.role === 'admin') {
                        navigate('/admin', { state: { activeTab: 'messages' } });
                        return;
                    }
                } catch (e) {
                    console.error("Token decode error:", e);
                }
            }

            const res = await axios.get('http://localhost:5001/api/auth/support-admin', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const { adminId } = res.data;
            navigate(`/messages?userId=${adminId}`);
        } catch (err) {
            console.error("Support Chat Error:", err);
            showModal({
                title: "Support Unavailable",
                message: "Our live support chat is currently experiencing technical difficulties. Please try again in a few minutes or contact us via email.",
                type: 'info',
                confirmText: 'Understood'
            });
        }
    };

    const toggleTopic = (catIdx, topicIdx) => {
        const id = `${catIdx}-${topicIdx}`;
        setActiveTopic(activeTopic === id ? null : id);
    };

    const categories = [
        {
            title: 'Buying on Campuskart',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                    <path d="M3 6h18"></path>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
            ),
            topics: [
                { 
                    q: 'How can I safely contact and negotiate with a seller?', 
                    a: 'Security is our priority. To contact a seller, click the "Message" button on the product listing page. This opens a private chat within Campuskart. We recommend keeping all conversations inside the app for your safety. You can negotiate the price and discuss item details directly with the seller. Once you reach an agreement, use the "Buy" or "Interested" options to signal your intent.' 
                },
                { 
                    q: 'Where are the safest places to meet for item inspection?', 
                    a: 'Since Campuskart is a campus-exclusive marketplace, always choose well-lit, high-traffic public areas on campus. Ideal locations include the Main Library lobby, the Student Union building, or popular campus cafeterias like the Canteen. We strongly advise meeting during daylight hours and, if possible, bringing a friend along for added safety.' 
                },
                { 
                    q: 'What is the payment procedure and how am I protected?', 
                    a: 'Campuskart currently facilitates the connection between buyers and sellers. All payments are made directly from buyer to seller. To protect yourself, NEVER pay in advance (e.g., via bank transfer or UPI) before physically inspecting the item. Only hand over the payment once you have verified that the product matches the description and is in the promised condition.' 
                }
            ]
        },
        {
            title: 'Selling and Listings',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
            ),
            topics: [
                { 
                    q: 'How do I create a listing that sells quickly?', 
                    a: 'A great listing starts with high-quality visuals. Take at least 3-4 photos under good natural lighting, showing all sides and any flaws. Write an honest, detailed description including the brand, age of the item, and reason for selling. Set a fair price by checking what similar items are selling for on the "Explore" page. Listings with clear titles and accurate categories get 2x more views.' 
                },
                { 
                    q: 'How can I promote my ads to reach more students?', 
                    a: 'By default, your latest listings appear at the top of the "New Arrivals" and "Explore" sections. To increase visibility, ensure your listing is detailed so it shows up in search results. You can also use the "Share" feature to post your listing link on your college WhatsApp groups or social media profiles. Verified sellers also tend to get higher trust and more inquiries.' 
                },
                { 
                    q: 'How do I manage my active sales and pending inquiries?', 
                    a: 'You can manage everything from your personal "Dashboard". Go to the "My Ads" section to see a list of all your active, sold, and pending listings. You can edit, delete, or mark an item as "Sold" from there. Use the "Messages" tab to keep track of all potential buyers and respond quickly to increase your chances of a successful sale.' 
                }
            ]
        },
        {
            title: 'Safety and Trust',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
            ),
            topics: [
                { 
                    q: 'What should I do if I encounter a suspicious user or listing?', 
                    a: 'If you see an item that looks too good to be true, or a user who asks for advance payment or OTPs, report them immediately. You can find the "Report" button on both the product listing page and within the chat window. Our moderation team reviews all reports within 24 hours and takes strict action against scammers to keep the campus community safe.' 
                },
                { 
                    q: 'Why should I verify my profile and how do I do it?', 
                    a: 'Profile verification adds a "Verified Student" badge to your account, which significantly increases buyer and seller confidence. To verify, go to "Settings" > "Profile" and upload a clear photo of your college ID card. This ensures that only legitimate students from your university are using the platform. Your ID is only used for verification and is never shared with anyone else.' 
                },
                { 
                    q: 'What are the most common scams I should look out for?', 
                    a: 'Be wary of users asking for "courier" payments, advance deposits for "reserving" an item, or asking you to scan a QR code to receive money. These are common scam tactics. Remember: a legitimate buyer or seller will always be willing to meet you in person on campus for a fair transaction. Never share your account login details or OTPs with anyone claiming to be from our support team.' 
                }
            ]
        },
        {
            title: 'Platform and Technical Support',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
            ),
            topics: [
                { 
                    q: 'The app is feeling slow. How can I improve performance?', 
                    a: 'For the best experience, we recommend using the latest version of Chrome, Firefox, or Safari. If you experience lag, try clearing your browser cache and cookies for the Campuskart site. Ensure you have a stable campus Wi-Fi or mobile data connection, especially when uploading high-resolution product images which may take a few moments to process.' 
                },
                { 
                    q: 'How do I manage my notifications so I don\'t miss any messages?', 
                    a: 'You can customize your notification preferences in the "Account Settings" menu. We offer browser-based push notifications and email alerts for new messages, price drops on wishlisted items, and listing approvals. Keeping notifications enabled for "Messages" is crucial for responding to interested buyers before they move on to other listings.' 
                },
                { 
                    q: 'How do I recover my account if I\'ve forgotten my password?', 
                    a: 'If you\'re locked out, click the "Forgot Password" link on the login page. You will be prompted to enter your registered university email and answer the security question you set during signup. A password reset link will then be sent to your inbox. If you still have trouble, please contact our support team via the "Email Support" button below.' 
                }
            ]
        }
    ];

    const filteredCategories = categories.map(cat => ({
        ...cat,
        topics: cat.topics.filter(t => 
            t.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
            t.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(cat => cat.topics.length > 0);

    return (
        <div className="dashboard-page-container">
            <div className="dashboard-layout">
                <Sidebar />
                <main className="dashboard-main support-main">
                    <div className="support-content-wrapper">
                        <header className="support-hero">
                            <h1 className="support-title">How can we help?</h1>
                            <p className="support-subtitle">Search our knowledge base or browse categories below.</p>
                            
                            <div className="support-search-container">
                                <span className="search-icon-support">🔍</span>
                                <input 
                                    type="text" 
                                    placeholder="Search for help topics, safety tips, or selling guides..." 
                                    className="support-search-input"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </header>

                        <div className="support-grid">
                            {filteredCategories.length > 0 ? (
                                filteredCategories.map((category, catIdx) => (
                                    <div key={catIdx} className="support-card-premium">
                                        <div className="support-card-header">
                                            <div className="support-card-icon-box">
                                                {category.icon}
                                            </div>
                                            <h2 className="support-card-title">{category.title}</h2>
                                        </div>
                                        <div className="support-topic-list">
                                            {category.topics.map((topic, tIdx) => {
                                                const isActive = activeTopic === `${catIdx}-${tIdx}`;
                                                return (
                                                    <div 
                                                        key={tIdx} 
                                                        className={`support-topic-wrapper ${isActive ? 'active' : ''}`}
                                                    >
                                                        <div 
                                                            className="support-topic-item" 
                                                            onClick={() => toggleTopic(catIdx, tIdx)}
                                                        >
                                                            <span className="topic-name">{topic.q}</span>
                                                            <span className="topic-arrow">›</span>
                                                        </div>
                                                        <div className="support-topic-answer">
                                                            <p className="answer-text">{topic.a}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-support-results">
                                    <p>No help topics found for "{searchQuery}". Try a different keyword.</p>
                                </div>
                            )}
                        </div>

                        <section className="support-cta-banner">
                            <div className="cta-content">
                                <h2 className="cta-title">Still need help?</h2>
                                <p className="cta-text">Our dedicated support team is available to assist you with any questions or concerns.</p>
                            </div>
                            <div className="cta-actions">
                                <button className="cta-btn btn-chat-premium" onClick={handleLiveChat}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                    Start a Live Chat
                                </button>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.6rem', 
                                    background: 'rgba(255,255,255,0.6)', 
                                    padding: '0.5rem 0.8rem', 
                                    borderRadius: '14px', 
                                    border: '1px dashed #cbd5e1',
                                    backdropFilter: 'blur(4px)',
                                    width: 'fit-content'
                                }}>
                                    <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="3"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                    </div>
                                    <p style={{ margin: 0, fontWeight: '800', color: '#1e293b', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                        If any queries then email on this:<br />
                                        <span style={{ color: '#3B82F6' }}>support@banasthali.in</span>
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default Support;
