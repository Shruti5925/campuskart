import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from '../Components/Footer';
import { useModal } from '../context/ModalContext';
import { formatNumericDate } from '../utils/dateUtils';
import '../styles/AdminDashboard.css';
import '../styles/Notifications.css';

const AdminNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    const token = sessionStorage.getItem('token');
    const profileDropdownRef = useRef(null);
    // eslint-disable-next-line no-unused-vars
    const { showModal } = useModal();

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };

        if (showProfileDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProfileDropdown]);

    useEffect(() => {
        fetchNotifications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5001/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data || []);
            setLoading(false);
        } catch (err) {
            console.error("Fetch Notifications Error:", err);
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notifId) => {
        try {
            await axios.patch(`http://localhost:5001/api/notifications/${notifId}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error('Mark read error:', err.message);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await axios.patch('http://localhost:5001/api/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Mark all read error:', err.message);
        }
    };

    const formatTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return "Just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        const days = Math.floor(hours / 24);
        if (days === 1) return "Yesterday";
        if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
        return formatNumericDate(date);
    };

    const getSenderName = (notification) => {
        if (notification.type !== 'message') {
            return notification.title || 'Administrator';
        }
        
        let senderName = notification.title;
        
        if (!senderName || senderName === 'New Message') {
            const senderMatch = notification.message?.match(/^(.+?) sent you a message:/i) || 
                                notification.message?.match(/^You have a new message from (.+?):/i);
            senderName = senderMatch ? senderMatch[1] : 'New Message';
        }
        
        if (senderName === 'System' || senderName === 'Someone') {
            return 'Administrator';
        }
        
        return senderName;
    };

    const getIconDetails = (type) => {
        switch (type) {
            case 'message': return { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>, color: 'notif-blue' };
            case 'suspension': return { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>, color: 'notif-red' };
            case 'approval': return { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>, color: 'notif-green' };
            case 'rejection': return { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>, color: 'notif-orange' };
            case 'info': return { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>, color: 'notif-purple' };
            default: return { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>, color: 'notif-gray' };
        }
    };

    const adminUnreadCount = notifications.filter(n => !n.isRead).length;

    const filteredNotifications = notifications.filter(notif => 
        (notif.title && notif.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (notif.message && notif.message.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="admin-page-container">
            <div className="admin-layout-wrapper">
                <aside className="admin-sidebar">
                    <div className="sidebar-brand">
                        <div className="brand-logo">🎓</div>
                        <div className="brand-text">
                            <h3>CampusKart Admin</h3>
                        </div>
                    </div>

                    <nav className="sidebar-nav">
                        <button onClick={() => navigate('/admin')}>
                            <span className="icon">📊</span> Dashboard
                        </button>
                        <button onClick={() => navigate('/admin', { state: { activeTab: 'queue' } })}>
                            <span className="icon">📋</span> Approval Queue
                        </button>
                        <button onClick={() => navigate('/admin', { state: { activeTab: 'users' } })}>
                            <span className="icon">👥</span> User Management
                        </button>
                        <button onClick={() => navigate('/admin', { state: { activeTab: 'marketplace' } })}>
                            <span className="icon">🛍️</span> Marketplace View
                        </button>
                        <button onClick={() => navigate('/admin', { state: { activeTab: 'messages' } })}>
                            <span className="icon">💬</span> Messages
                        </button>
                        <button onClick={() => navigate('/admin', { state: { activeTab: 'reports' } })}>
                            <span className="icon">📈</span> Reports
                        </button>
                        <button onClick={() => navigate('/admin', { state: { activeTab: 'settings' } })}>
                            <span className="icon">⚙</span> Settings
                        </button>
                    </nav>
                </aside>

                <main className="admin-main">
                    <header className="admin-top-nav">
                        <div className="search-bar">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search notifications..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="nav-actions">
                            <button
                                className="admin-notif-bell"
                                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', position: 'relative' }}
                                title="Notifications"
                            >
                                🔔
                                {adminUnreadCount > 0 && (
                                    <span className="admin-notif-badge">{adminUnreadCount > 9 ? '9+' : adminUnreadCount}</span>
                                )}
                            </button>
                            <div className="admin-profile" ref={profileDropdownRef} style={{ position: 'relative' }}>
                                <div 
                                    className="profile-avatar" 
                                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    👨🏻‍💼
                                </div>
                                {showProfileDropdown && (
                                    <div className="profile-dropdown" style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: '0.5rem',
                                        backgroundColor: 'white',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                        border: '1px solid #f1f5f9',
                                        padding: '1rem',
                                        minWidth: '200px',
                                        zIndex: 100,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.75rem'
                                    }}>
                                        <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                                            <p className="name" style={{ margin: 0, fontWeight: '700', color: '#1e293b' }}>Admin Staff</p>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Administrator</p>
                                        </div>
                                        <button 
                                            className="logout-btn" 
                                            onClick={() => {
                                                sessionStorage.removeItem('token');
                                                window.location.href='/login';
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '0.6rem',
                                                borderRadius: '8px',
                                                border: '1px solid #fee2e2',
                                                backgroundColor: 'white',
                                                color: '#ef4444',
                                                fontWeight: '600',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            LOGOUT
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    <div className="admin-content-area notif-content-wrapper" style={{ margin: '0' }}>
                        <header className="notif-header">
                            <div className="notif-header-left">
                                <h1 className="notif-title">Notifications</h1>
                                <p className="notif-subtitle">Stay updated with the latest system alerts and administration activities.</p>
                            </div>
                            <button className="mark-all-read-btn-premium" onClick={handleMarkAllRead}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Mark all as read
                            </button>
                        </header>

                        {loading ? (
                            <div className="admin-loading">
                                <div className="spinner"></div>
                                <p>Fetching notifications...</p>
                            </div>
                        ) : (
                            <div className="notif-list-wrapper">
                                {filteredNotifications.length === 0 ? (
                                    <div className="empty-notif-state">
                                        <div className="empty-notif-icon">🔔</div>
                                        <p>No notifications found.</p>
                                    </div>
                                ) : (
                                    filteredNotifications.map(notification => {
                                        const { icon, color } = getIconDetails(notification.type);
                                        return (
                                            <div 
                                                key={notification._id} 
                                                className={`notif-premium-card ${notification.isRead ? 'is-read' : 'is-unread'}`}
                                                onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                                            >
                                                <div className={`notif-icon-box ${color}`}>
                                                        {icon}
                                                    </div>
                                                    <div className="notif-main-info">
                                                        <div className="notif-title-row-premium">
                                                            <span className="notif-sender">
                                                                {getSenderName(notification)}
                                                            </span>
                                                            <span className="notif-timestamp-premium">• {formatTimeAgo(notification.createdAt)}</span>
                                                        </div>
                                                        <p className="notif-message-premium">{notification.message}</p>
                                                    </div>
                                                    {!notification.isRead && <div className="notif-unread-indicator"></div>}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                        )}
                    </div>
                </main>
            </div>
            <Footer isAdmin={true} />
        </div>
    );
};

export default AdminNotifications;
