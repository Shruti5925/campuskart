import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/Sidebar.css';

const Sidebar = () => {
    const location = useLocation();
    const [userData, setUserData] = useState(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (token) {
            axios.get('http://localhost:5001/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => setUserData(res.data))
            .catch(err => console.error("Sidebar error:", err));
        }
    }, [token]);

    const menuItems = [
        { name: 'Home', path: '/', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> },
        { name: 'Profile', path: '/profile', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> },
        { name: 'Messages', path: '/messages', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> },
        { name: 'Dashboard', path: '/dashboard', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2V15H6L11 19V5Z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg> },
        { name: 'Settings', path: '/settings', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> },
        { name: 'Support', path: '/support', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> }
    ];

    return (
        <aside className="app-sidebar">

            <div className="sidebar-logo">
                <div className="logo-box">C</div>
                <span>Campuskart</span>
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
                        {item.name === 'Dashboard' && <span className="active-glow"></span>}
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
  src={
    userData?.avatar
      ? `${userData.avatar}?t=${Date.now()}`
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${
          userData?.gender === "Female" ? "Aneka" : "Felix"
        }`
  }
  alt="avatar"
  onError={(e) => {
    e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${
      userData?.gender === "Female" ? "Aneka" : "Felix"
    }`;
  }}
/>
                        </div>
                        <div className="user-details">
                            <p className="user-name">
                                {userData.firstName} {userData.lastName}
                            </p>
                            <p className="user-campus">
                                {userData.department} • {userData.collegeId || 'B.Tech'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

        </aside>
    );
};

export default Sidebar;