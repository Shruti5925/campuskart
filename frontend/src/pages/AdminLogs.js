import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Footer from '../Components/Footer';
import '../styles/AdminDashboard.css';

const AdminLogs = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    const token = sessionStorage.getItem('token');
    const profileDropdownRef = useRef(null);

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
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://127.0.0.1:5001/api/admin-activities', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setActivities(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Fetch Activities Error:", err);
            setLoading(false);
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'SUCCESSFUL': return 'success';
            case 'ENFORCEMENT': return 'danger';
            case 'CLOSED': return 'neutral';
            default: return 'neutral';
        }
    };

    const getActionIcon = (action) => {
        if (action.includes('APPROVE') || action.includes('VERIF')) return '🛡️';
        if (action.includes('REJECT') || action.includes('SUSPEND')) return '🚫';
        if (action.includes('FLAG')) return '🚩';
        return '📑';
    };

    const filteredActivities = activities.filter(act => 
        act.targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        act.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (act.admin && `${act.admin.firstName} ${act.admin.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()))
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
                                placeholder="Search activity logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="nav-actions">
                            <button className="nav-btn notification" title="Messages" onClick={() => navigate('/admin', { state: { activeTab: 'messages' } })} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>🔔</button>
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

                    <div className="admin-content-area">
                        <header className="view-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button 
                                    onClick={() => navigate(-1)} 
                                    className="back-btn-premium"
                                    title="Go Back"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                                <div>
                                    <h1>Activity Logs</h1>
                                    <p>Comprehensive history of all administrative actions taken on the platform.</p>
                                </div>
                            </div>
                        </header>

                        {loading ? (
                            <div className="admin-loading">
                                <div className="spinner"></div>
                                <p>Fetching audit logs...</p>
                            </div>
                        ) : (
                            <div className="card" style={{ padding: '0' }}>
                                <div className="activity-list" style={{ padding: '1.5rem' }}>
                                    {filteredActivities.length === 0 ? (
                                        <p style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No activity logs found.</p>
                                    ) : (
                                        filteredActivities.map((act) => (
                                            <div key={act._id} className="activity-item" style={{ marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '16px' }}>
                                                <div className="activity-icon-wrapper">
                                                    {getActionIcon(act.action)}
                                                </div>
                                                <div className="activity-info">
                                                    <p className="activity-main">
                                                        <strong>{act.admin ? `${act.admin.firstName} ${act.admin.lastName}` : 'System'}</strong> 
                                                        {` ${act.action.toLowerCase()} `}
                                                        <strong>{act.targetName}</strong>
                                                    </p>
                                                    <span className="activity-time">
                                                        {new Date(act.createdAt).toLocaleString('en-US', { 
                                                            month: 'short', 
                                                            day: 'numeric', 
                                                            header: false,
                                                            hour: '2-digit', 
                                                            minute: '2-digit' 
                                                        })}
                                                    </span>
                                                </div>
                                                <div className={`status-pill ${getStatusClass(act.status)}`}>
                                                    {act.status}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
            <Footer isAdmin={true} />
        </div>
    );
};

export default AdminLogs;
