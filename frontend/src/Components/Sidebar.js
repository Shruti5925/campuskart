import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import socket, { connectSocket, disconnectSocket } from '../socket';
import '../styles/Sidebar.css';
import femaleAvatar from '../assets/female-avatar.png';
import maleAvatar from '../assets/male-avatar.png';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [hasActiveProducts, setHasActiveProducts] = useState(false);
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (token) {
            Promise.all([
                axios.get('http://localhost:5001/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:5001/api/products')
            ]).then(([userRes, prodRes]) => {
                setUserData(userRes.data);
                const currentUserId = userRes.data._id?.toString();
                const hasActive = prodRes.data.some(p => {
                    const sellerId = p.seller?._id?.toString() || p.seller?.toString();
                    return sellerId === currentUserId && (p.status === 'active' || !p.status);
                });
                setHasActiveProducts(hasActive);
            }).catch(err => console.error("Sidebar error:", err));
        }
    }, [token]);



    const menuItems = [
        { name: 'Home', path: '/', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> },
        { name: 'Profile', path: '/profile', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> },
        { name: 'Notifications', path: '#', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg> },
        { name: 'Messages', path: '/messages', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> },
        { name: 'Dashboard', path: '/dashboard', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2V15H6L11 19V5Z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg> },
        { name: 'Orders', path: '/orders', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg> },
        { name: 'Settings', path: '/settings', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> },
        { name: 'Support', path: '/support', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> }
    ];

    const avatarUrl = userData?.profilePhoto
        ? `http://localhost:5001${userData.profilePhoto}`
        : (userData?.gender === 'Female' ? femaleAvatar : maleAvatar);

    return (
        <aside className="app-sidebar">
            <div className="sidebar-logo brand-logo-shared">
                <div className="logo-box-shared">C</div>
                <span className="brand-text-shared">CampusKart</span>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map(item => (
                    <Link
                        key={item.name}
                        to={item.path}
                        className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                    >
                        <span className="sidebar-icon">{item.icon}</span>
                        {item.name}
                        {item.name === 'Dashboard' && hasActiveProducts && (
                            <span className="active-glow"></span>
                        )}
                    </Link>
                ))}
            </nav>

            <div className="sidebar-footer">
                <Link to="/add-product" className="post-ad-btn btn-green">
                    <span className="plus">+</span> Add Product
                </Link>
                {userData && (
                    <div className="user-pill-container">
                        <div className="user-avatar-wrapper">
                            <img
                                src={avatarUrl}
                                alt="avatar"
                            />
                        </div>
                        <div className="user-details">
                            <p className="user-name">{userData.firstName} {userData.lastName}</p>
                            <p className="user-campus">{userData.department} • {userData.collegeId || 'B.Tech'}</p>
                        </div>
                    </div>
                )}

                {/* Logout Button */}
                <button
                    onClick={() => {
                        if (window.confirm('Are you sure you want to logout?')) {
                            localStorage.removeItem('token');
                            navigate('/');
                        }
                    }}
                    style={{
                        width: '100%',
                        marginTop: '0.5rem',
                        padding: '0.65rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        background: 'none',
                        border: '1px solid #fee2e2',
                        borderRadius: '10px',
                        color: '#ef4444',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.15s, border-color 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = '#fee2e2'; }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
