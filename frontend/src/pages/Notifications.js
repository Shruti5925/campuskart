import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useModal } from '../context/ModalContext';
import Sidebar from '../Components/Sidebar';
import Footer from '../Components/Footer';
import socket from '../socket';
import '../styles/Dashboard.css';
import '../styles/Notifications.css';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const token = sessionStorage.getItem('token');
    const navigate = useNavigate();
    const { showModal } = useModal();

    useEffect(() => {
        fetchNotifications();
        
        const handleNewNotification = (notification) => {
            setNotifications(prev => [notification, ...prev]);
        };

        if (socket) {
            socket.on('new_notification', handleNewNotification);
        }

        return () => {
            if (socket) socket.off('new_notification', handleNewNotification);
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get('http://localhost:5001/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching notifications:", err);
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await axios.patch(`http://localhost:5001/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error("Error marking as read:", err);
        }
    };

    const markAllRead = async () => {
        try {
            await axios.patch('http://localhost:5001/api/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error("Error marking all read:", err);
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
        return new Date(date).toLocaleDateString();
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

    const handleNotificationClick = (notification) => {
        if (!notification.isRead) markAsRead(notification._id);
        
        if (['suspension', 'approval', 'rejection', 'message', 'info'].includes(notification.type)) {
            let displayTitle = getSenderName(notification);
            if (notification.type === 'message' && displayTitle !== 'New Message') {
                displayTitle = `Message from ${displayTitle}`;
            }
            
            showModal({
                title: displayTitle,
                message: notification.message,
                type: 'alert'
            });
        } else if (notification.link) {
            navigate(notification.link);
        }
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

    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'All') return true;
        if (activeTab === 'Messages') return n.type === 'message';
        if (activeTab === 'Activity') return ['suspension', 'approval', 'rejection', 'info'].includes(n.type);
        return true;
    });

    const displayedSearchNotifications = searchTerm ? notifications.filter(n => {
        const term = searchTerm.toLowerCase();
        return (n.title && n.title.toLowerCase().includes(term)) || 
               (n.message && n.message.toLowerCase().includes(term));
    }) : [];

    if (loading) {
        return (
            <div className="dashboard-page-container">
                <div className="dashboard-layout">
                    <Sidebar />
                    <main className="dashboard-main">
                        <div className="loading-state">Loading notifications...</div>
                    </main>
                </div>
                <Footer />
            </div>
        );
    }

    const tabs = ['All', 'Messages', 'Activity'];

    return (
        <div className="dashboard-page-container">
            <div className="dashboard-layout">
                <Sidebar />
                <main className="dashboard-main">
                    <header className="dashboard-header">
                        <div className="search-pill" style={{ position: 'relative' }}>
                            <span className="search-icon">🔍</span>
                            <input 
                                type="text" 
                                placeholder="Search notifications..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            />
                            {isSearchFocused && searchTerm.trim() !== '' && (
                                <div className="search-dropdown" style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '12px',
                                    marginTop: '0.5rem',
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    zIndex: 100,
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                }}>
                                    {displayedSearchNotifications.length > 0 ? (
                                        displayedSearchNotifications.map(notification => (
                                            <div 
                                                key={notification._id} 
                                                onClick={() => handleNotificationClick(notification)}
                                                style={{
                                                    padding: '0.75rem 1rem',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid #f3f4f6',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.75rem'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                            >
                                                <div className={`notif-icon-box ${getIconDetails(notification.type).color}`} style={{ width: '32px', height: '32px', minWidth: '32px', padding: '6px' }}>
                                                    {React.cloneElement(getIconDetails(notification.type).icon, { width: 16, height: 16 })}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem', color: '#111827' }}>
                                                        {getSenderName(notification)}
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {notification.message}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                                            No notifications found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="header-actions" style={{ display: 'flex', gap: '8px' }}>
                            <Link to="/cart" className="pill-icon-btn cart-icon-btn" title="Cart">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                            </Link>
                            <Link to="/wishlist" className="pill-icon-btn wishlist-icon-btn" title="Wishlist">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                            </Link>
                        </div>
                    </header>
                    <div className="dashboard-content notif-content-wrapper">
                        <header className="notif-header">
                            <div className="notif-header-left">
                                <h1 className="notif-title">Notifications</h1>
                                <p className="notif-subtitle">Stay updated with your campus activity.</p>
                            </div>
                            <button className="mark-all-read-btn-premium" onClick={markAllRead}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Mark all as read
                            </button>
                        </header>

                        <div className="notif-tabs-container">
                            {tabs.map(tab => (
                                <button
                                    key={tab}
                                    className={`notif-tab-btn ${activeTab === tab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="notif-list-wrapper">
                            {filteredNotifications.length === 0 ? (
                                <div className="empty-notif-state">
                                    <div className="empty-notif-icon">🔔</div>
                                    <p>No notifications yet in this category.</p>
                                </div>
                            ) : (
                                filteredNotifications.map(notification => {
                                    const { icon, color } = getIconDetails(notification.type);
                                    return (
                                        <div 
                                            key={notification._id} 
                                            className={`notif-premium-card ${notification.isRead ? 'is-read' : 'is-unread'}`}
                                            onClick={() => handleNotificationClick(notification)}
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
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default Notifications;
