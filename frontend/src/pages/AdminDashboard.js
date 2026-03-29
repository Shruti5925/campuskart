import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useModal } from '../context/ModalContext';
import ProductCard from '../Components/ProductCard';
import Messages from './Messages';
import Footer from '../Components/Footer';
import femaleAvatar from '../assets/female-avatar.png';
import maleAvatar from '../assets/male-avatar.png';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'overview');
    const [searchTerm, setSearchTerm] = useState("");
    
    // Add effect to reset search when tab changes if needed
    useEffect(() => {
        setSearchTerm("");
    }, [activeTab]);
    const [queueTab, setQueueTab] = useState('pending'); // pending, approved, flagged
    const [pendingProducts, setPendingProducts] = useState([]);
    const [approvedProductsList, setApprovedProductsList] = useState([]);
    const [flaggedProductsList, setFlaggedProductsList] = useState([]);
    const [allReviews, setAllReviews] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingApprovals: 0,
        approvedProducts: 0,
        flaggedProducts: 0,
        totalRevenue: 0
    });
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null); 
    const [targetChatUser, setTargetChatUser] = useState(null);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [growthTimeframe, setGrowthTimeframe] = useState('7days');
    const [showGrowthMenu, setShowGrowthMenu] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);
    const [filterStatus, setFilterStatus] = useState('all'); // all, verified, pending, suspended
    const [filterRole, setFilterRole] = useState('all'); // all, student, staff, admin
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [selectedUserDir, setSelectedUserDir] = useState(null);
    const [isEditingUser, setIsEditingUser] = useState(false);
    const [editUserData, setEditUserData] = useState(null);
    const [reviewTimeRange, setReviewTimeRange] = useState('all'); // all, 30days
    const [reportFilterStatus, setReportFilterStatus] = useState('all'); // all, pending, resolved, dismissed
    const token = sessionStorage.getItem('token');
    const { showModal } = useModal();
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
        setModalImageIndex(0);
    }, [selectedItem]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        console.log("Fetching Admin Data [Robust Mode]...");
        
        const fetchData = async (url, setter, label, defaultValue = []) => {
            try {
                const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
                setter(res.data || defaultValue);
                console.log(`[SUCCESS] ${label}`);
                return res.data;
            } catch (err) {
                console.error(`[ERROR] ${label}:`, err.message);
                setter(defaultValue);
                return defaultValue;
            }
        };

        try {
            await Promise.all([
                fetchData('http://localhost:5001/api/products/admin/stats', setStats, 'Stats', { totalUsers: 0, pendingApprovals: 0, approvedProducts: 0, flaggedProducts: 0, totalRevenue: 0 }),
                fetchData('http://localhost:5001/api/products/admin/pending', setPendingProducts, 'Pending Products'),
                fetchData('http://localhost:5001/api/products/admin/approved', setApprovedProductsList, 'Approved Products'),
                fetchData('http://localhost:5001/api/products/admin/flagged', setFlaggedProductsList, 'Flagged Products'),
                fetchData('http://localhost:5001/api/products/admin/reviews', setAllReviews, 'Reviews'),
                fetchData('http://localhost:5001/api/auth/users', setAllUsers, 'Users'),
                fetchData('http://localhost:5001/api/reports', setReports, 'Reports'),
                fetchData('http://localhost:5001/api/admin-activities', setActivities, 'Activities')
            ]);
            console.log("Admin Dashboard Load Complete");
        } catch (globalErr) {
            console.error("Global Admin Fetch Error:", globalErr);
        } finally {
            setLoading(false);
        }
    };

    const getJoiningDate = (user) => {
        if (!user) return 'N/A';
        const date = user.createdAt ? new Date(user.createdAt) : null;
        
        if (date && !isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        }

        // Fallback: Try extracting from MongoDB ObjectId
        if (user._id && user._id.length === 24) {
            try {
                const timestamp = parseInt(user._id.substring(0, 8), 16) * 1000;
                const oidDate = new Date(timestamp);
                if (!isNaN(oidDate.getTime())) {
                    return oidDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
                }
            } catch (e) {
                console.error("ObjectId parse error:", e);
            }
        }
        
        return 'N/A';
    };

    const getProfileIcon = (user) => {
        if (user?.profilePhoto) return `http://localhost:5001${user.profilePhoto}`;
        if (!user || !user.gender) return maleAvatar;
        if (user.gender === "Female") return femaleAvatar;
        return maleAvatar;
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditUserData(prev => ({ ...prev, [name]: value }));
    };

    const handleCancelEdit = () => {
        setIsEditingUser(false);
        setEditUserData(null);
    };

    const handleSaveUser = async () => {
        try {
            const res = await axios.put(`http://localhost:5001/api/auth/users/${editUserData._id}`, editUserData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showModal({ title: 'Success', message: 'User profile updated successfully!', type: 'alert' });
            
            // Update local states
            setAllUsers(prev => prev.map(u => u._id === editUserData._id ? res.data.user : u));
            setSelectedUserDir(res.data.user);
            setIsEditingUser(false);
            setEditUserData(null);
            
            // Update stats if needed (role might have changed affecting filtered counts)
            fetchInitialData();
        } catch (err) {
            console.error("Error saving user:", err);
            showModal({ title: 'Error', message: err.response?.data?.message || 'Failed to update user profile', type: 'alert' });
        }
    };

    const handleDeleteReview = async (id) => {
        try {
            await axios.delete(`http://localhost:5001/api/products/admin/reviews/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAllReviews(prev => prev.filter(r => r._id !== id));
            showModal({ title: 'Success', message: 'Review deleted successfully', type: 'alert' });
            fetchInitialData();
        } catch (err) {
            console.error("Error deleting review:", err);
            showModal({ title: 'Error', message: 'Failed to delete review', type: 'alert' });
        }
    };

    const handleToggleReviewFlag = async (id) => {
        try {
            const res = await axios.patch(`http://localhost:5001/api/products/admin/reviews/${id}/flag`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAllReviews(prev => prev.map(r => r._id === id ? { ...r, isFlagged: res.data.isFlagged } : r));
            showModal({ title: 'Review Flagged', message: res.data.message, type: 'alert' });
        } catch (err) {
            console.error("Error toggling review flag:", err);
            showModal({ title: 'Error', message: 'Failed to toggle review flag', type: 'alert' });
        }
    };

    const handleUpdateReportStatus = async (reportId, status, adminNotes = "") => {
        try {
            await axios.patch(`http://localhost:5001/api/reports/${reportId}/status`, { 
                status, 
                adminNotes 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setReports(prev => prev.map(r => r._id === reportId ? { ...r, status, adminNotes } : r));
            showModal({ title: 'Report Updated', message: `Report marked as ${status}`, type: 'alert' });
            
            // Refresh stats/activities
            fetchInitialData();
        } catch (err) {
            console.error("Error updating report status:", err);
            showModal({ title: 'Error', message: 'Failed to update report status', type: 'alert' });
        }
    };

    const handleToggleReviewHelpful = async (id) => {
        try {
            const res = await axios.patch(`http://localhost:5001/api/products/admin/reviews/${id}/helpful`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAllReviews(prev => prev.map(r => r._id === id ? { ...r, isHelpful: res.data.isHelpful } : r));
        } catch (err) {
            console.error("Error toggling review helpful status:", err);
            showModal({ title: 'Error', message: 'Failed to update review status.', type: 'alert' });
        }
    };

    const handleApprove = async (id) => {
        try {
            await axios.patch(`http://localhost:5001/api/products/${id}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingProducts(pendingProducts.filter(p => p._id !== id));
            if (selectedItem && selectedItem._id === id) {
                setSelectedItem({ ...selectedItem, status: 'approved' });
            }
            fetchInitialData(); 
            showModal({ title: 'Success', message: "Product approved successfully", type: 'alert' });
        } catch (err) {
            showModal({ title: 'Error', message: "Approval Failed", type: 'alert' });
        }
    };

    const handleReject = async (id) => {
        showModal({
            title: 'Reject Item',
            message: "Reason for rejection (this will be sent to the seller):",
            type: 'prompt',
            onConfirm: async (reason) => {
                if (!reason || !reason.trim()) {
                    showModal({ title: 'Error', message: 'Please provide a reason for rejection.', type: 'alert' });
                    return;
                }
                console.log("REJECTING with reason:", reason);
                try {
                    await axios.patch(`http://localhost:5001/api/products/${id}/reject`, { reason }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setPendingProducts(pendingProducts.filter(p => p._id !== id));
                    setSelectedItem(null);
                    fetchInitialData();
                    showModal({ title: 'Success', message: "Product rejected and seller notified", type: 'alert' });
                } catch (err) {
                    showModal({ title: 'Error', message: "Rejection Failed", type: 'alert' });
                }
            }
        });
    };

    const handleStartChat = (user) => {
        setTargetChatUser(user._id);
        setActiveTab('messages');
    };

    const toggleUserStatus = async (userId, currentStatus, type) => {
        try {
            const update = type === 'verify' ? { isVerified: !currentStatus } : { isSuspended: !currentStatus };
            await axios.patch(`http://localhost:5001/api/auth/users/${userId}/status`, update, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAllUsers(allUsers.map(u => u._id === userId ? { ...u, ...update } : u));
            fetchInitialData(); 
            showModal({ title: 'Success', message: "User status updated", type: 'alert' });
        } catch (err) {
            showModal({ title: 'Error', message: "Update Failed", type: 'alert' });
        }
    };

    const handleToggleFlag = async (productId) => {
        try {
            const res = await axios.patch(`http://localhost:5001/api/products/${productId}/toggle-flag`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (selectedItem && selectedItem._id === productId) {
                setSelectedItem({ ...selectedItem, isFlagged: res.data.isFlagged });
            }
            fetchInitialData();
            showModal({ title: 'Success', message: "Product flag toggled", type: 'alert' });
        } catch (err) {
            showModal({ title: 'Error', message: "Flagging failed", type: 'alert' });
        }
    };

    const getCategorySummary = () => {
        const categories = [
            { name: 'Book', icon: '📖' },
            { name: 'Cycle', icon: '🚲' },
            { name: 'Fan', icon: '💨' },
            { name: 'Trunk', icon: '🧳' },
            { name: 'Others', icon: '✨' }
        ];

        return categories.map(cat => {
            const filterFn = (p) => {
                const pCat = p.category?.toLowerCase() || '';
                const matchTerm = cat.name.toLowerCase();
                
                if (cat.name === 'Others') {
                    const knownCats = categories
                        .filter(c => c.name !== 'Others')
                        .map(c => c.name.toLowerCase());
                    return !knownCats.includes(pCat);
                }
                
                // Check for exact match or plural version just in case
                return pCat === matchTerm || pCat === matchTerm + 's';
            };

            const pendingCount = pendingProducts.filter(filterFn).length;
            const approvedCount = approvedProductsList.filter(filterFn).length;
            
            const total = pendingCount + approvedCount;
            const completionRate = total > 0 ? (approvedCount / total) * 100 : 0;

            return { 
                ...cat, 
                pendingCount, 
                approvedCount, 
                total,
                completionRate 
            };
        });
    };

    const getUserGrowthData = () => {
        const dataArr = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (growthTimeframe === '7days') {
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                dataArr.push({
                    date: date,
                    label: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    dateLabel: `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`,
                    count: 0
                });
            }
        } else if (growthTimeframe === 'yearly') {
            for (let i = 11; i >= 0; i--) {
                const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                dataArr.push({
                    date: date,
                    label: date.toLocaleDateString('en-US', { month: 'short' }),
                    dateLabel: `'${date.getFullYear().toString().slice(-2)}`,
                    count: 0,
                    isMonth: true
                });
            }
        }

        allUsers.forEach(user => {
            if (!user.createdAt) return;
            const createdDate = new Date(user.createdAt);

            if (growthTimeframe === 'yearly') {
                const monthYear = createdDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                const monthObj = dataArr.find(d => d.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) === monthYear);
                if (monthObj) monthObj.count++;
            } else {
                createdDate.setHours(0, 0, 0, 0);
                const dayObj = dataArr.find(d => d.date.getTime() === createdDate.getTime());
                if (dayObj) dayObj.count++;
            }
        });

        const maxCount = Math.max(...dataArr.map(d => d.count), 1);

        return dataArr.map(d => ({
            ...d,
            heightPercent: (d.count / maxCount) * 100
        }));
    };


    const renderOverview = () => (
        <div className="tab-content overview-view">
            <header className="view-header">
                <h1>Dashboard Overview</h1>
                <p>Welcome back. Here's what's happening at Campuskart on <strong>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>.</p>
            </header>

            <div className="stats-grid">
                <div className="admin-stat-card">
                    <div className="card-icon users">👥</div>
                    <div className="card-info">
                        <span className="label">Total Users</span>
                        <h2 className="value">{allUsers.length.toLocaleString()}</h2>
                        <span className="trend positive">Active</span>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="card-icon pending">📦</div>
                    <div className="card-info">
                        <span className="label">Product's Pending Approvals</span>
                        <h2 className="value">{pendingProducts.length}</h2>
                        {pendingProducts.length > 0 ? (
                            <span className="tag high">Action Needed</span>
                        ) : (
                            <span className="tag" style={{ color: '#10b981', backgroundColor: '#d1fae5' }}>All Clear</span>
                        )}
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="card-icon pending">👤</div>
                    <div className="card-info">
                        <span className="label">User's Pending Approvals</span>
                        <h2 className="value">{allUsers.filter(u => !u.isVerified).length}</h2>
                        {allUsers.filter(u => !u.isVerified).length > 0 ? (
                            <span className="tag high">Action Needed</span>
                        ) : (
                            <span className="tag" style={{ color: '#10b981', backgroundColor: '#d1fae5' }}>All Clear</span>
                        )}
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="card-icon flagged">🚩</div>
                    <div className="card-info">
                        <span className="label">Flagged Reports</span>
                        <h2 className="value">{flaggedProductsList.length}</h2>
                        {flaggedProductsList.length > 0 ? (
                            <span className="tag alert">{flaggedProductsList.length} Alert{flaggedProductsList.length !== 1 && 's'}</span>
                        ) : (
                            <span className="tag" style={{ color: '#10b981', backgroundColor: '#d1fae5' }}>Safe</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="overview-row">
                <div className="chart-placeholder card">
                    <div className="card-header">
                        <div className="card-title-group">
                            <h3>User Growth</h3>
                            <p className="card-subtitle">
                                {growthTimeframe === '7days' ? 'Signups for the last 7 days' : 'Signups for the last 12 months'}
                            </p>
                        </div>
                        <div className="growth-dropdown-container">
                            <span className="filter-label">
                                {growthTimeframe === '7days' ? 'Last 7 Days' : 'Last 12 Months'}
                                <span 
                                    className="arrow-trigger" 
                                    onClick={() => setShowGrowthMenu(!showGrowthMenu)}
                                    style={{ cursor: 'pointer', marginLeft: '0.5rem', position: 'relative' }}
                                >
                                    ▾
                                    {showGrowthMenu && (
                                        <div className="growth-menu" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => { setGrowthTimeframe('7days'); setShowGrowthMenu(false); }}>Last 7 Days</button>
                                            <button onClick={() => { setGrowthTimeframe('yearly'); setShowGrowthMenu(false); }}>Last 12 Months</button>
                                        </div>
                                    )}
                                </span>
                            </span>
                        </div>
                    </div>
                    <div className={`mock-chart ${growthTimeframe}`}>
                        {getUserGrowthData().map((day, idx) => (
                            <div key={idx} className="bar-group">
                                <div className="bar-wrapper">
                                    <div 
                                        className="bar" 
                                        style={{ 
                                            height: `${Math.max(day.heightPercent, 3)}%`,
                                            transition: 'height 0.5s ease-out',
                                        }}
                                    ></div>
                                </div>
                                <span className="bar-label">
                                    {day.label}
                                    {day.dateLabel && <><br /><span style={{fontSize: '0.65rem', opacity: 0.7, fontWeight: '700'}}>{day.dateLabel}</span></>}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="summary-card neon card">
                    <h3>Approval Summary</h3>
                    <div className="summary-list">
                        {getCategorySummary().map(cat => (
                            <div key={cat.name} className="summary-item" style={{ color: 'black' }}>
                                <span className="icon">{cat.icon}</span>
                                <div className="label-bar">
                                    <p style={{ color: 'white', fontWeight: '500' }}>{cat.name} <span style={{fontSize: '0.7rem', opacity: 0.8}}>({cat.approvedCount} approved)</span></p>
                                    <div className="progress" style={{ backgroundColor: 'white' }}>
                                        <div 
                                            className="fill" 
                                            style={{ 
                                                width: `${cat.completionRate}%`,
                                                backgroundColor: '#22c55e' // Green color for approved
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                <span className="count" style={{ color: 'black' }}>+{cat.pendingCount}</span>
                            </div>
                        ))}
                    </div>
                    <button className="review-btn" onClick={() => setActiveTab('marketplace')}>Review All Items</button>
                </div>
            </div>

            <div className="activity-section card">
                <div className="activity-header">
                    <h3>Recent Admin Activity</h3>
                    <button className="view-all-logs-btn" onClick={() => navigate('/admin/logs')}>VIEW ALL LOGS →</button>
                </div>
                <div className="activity-list">
                    {activities.length === 0 ? (
                        <div className="activity-item" style={{ justifyContent: 'center', opacity: 0.6 }}>
                            No recent activity found.
                        </div>
                    ) : (
                        activities.slice(0, 5).map((act) => (
                            <div key={act._id} className="activity-item">
                                <div className="activity-icon-wrapper" style={{background: act.action.includes('REJECT') || act.action.includes('SUSPEND') ? '#fee2e2' : '#e2e8f0'}}>
                                    {act.action.includes('APPROVE') || act.action.includes('VERIF') ? '🛡️' : (act.action.includes('REJECT') || act.action.includes('SUSPEND') ? '🚫' : (act.action.includes('FLAG') ? '🚩' : '📑'))}
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
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })}
                                    </span>
                                </div>
                                <div className={`status-pill ${act.status === 'SUCCESSFUL' ? 'success' : (act.status === 'ENFORCEMENT' ? 'danger' : 'neutral')}`}>
                                    {act.status}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    const renderApprovalQueue = () => (
        <div className="tab-content queue-view">
            <header className="view-header">
                <h1>Product's Approval Queue</h1>
                <p>Review and moderate recently submitted campus listings.</p>
            </header>

            <div className="queue-layout">
                <div className="queue-main">
                    <div className="queue-filters">
                        <div className="stat-pills">
                            <div className={`pill ${queueTab === 'pending' ? 'active' : ''}`} onClick={() => setQueueTab('pending')}>
                                Pending <span>{pendingProducts.length}</span>
                            </div>
                            <div className={`pill ${queueTab === 'approved' ? 'active' : ''}`} onClick={() => setQueueTab('approved')}>
                                Approved <span>{approvedProductsList.length}</span>
                            </div>
                            <div className={`pill ${queueTab === 'flagged' ? 'active' : ''}`} onClick={() => setQueueTab('flagged')}>
                                Flagged <span>{flaggedProductsList.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ITEM DETAILS</th>
                                    <th>SELLER</th>
                                    <th>CATEGORY</th>
                                    <th>PRICE</th>
                                    {queueTab !== 'pending' && <th>STATUS</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {(queueTab === 'pending' ? pendingProducts : 
                                  queueTab === 'approved' ? approvedProductsList : 
                                  flaggedProductsList).map(product => (
                                    <tr 
                                        key={product._id} 
                                        className={selectedItem?._id === product._id ? 'selected' : ''}
                                        onClick={() => setSelectedItem(product)}
                                    >
                                        <td>
                                            <div className="table-item-cell">
                                                <img src={product.images?.[0] || '/assets/image.webp'} alt="" />
                                                <div>
                                                    <p className="item-title">{product.title}</p>
                                                    <span className="item-id">ID: #{product._id.slice(-4).toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="table-seller-cell" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div className="table-seller-avatar-container">
                                                    <img src={getProfileIcon(product.seller)} alt="" className="table-seller-avatar" />
                                                </div>
                                                <p className="seller-name">{product.seller?.firstName || 'Unknown'} {product.seller?.lastName || ''}</p>
                                            </div>
                                        </td>
                                        <td><span className={`cat-tag cat-${(product.category || 'other').toLowerCase().replace(/\s+/g, '-')}`}>{product.category || 'Other'}</span></td>
                                        <td><p className="item-price">₹{product.price?.toLocaleString() || 0}</p></td>
                                        {queueTab !== 'pending' && (
                                            <td>
                                                <span className={`status-pill ${product.status}`}>
                                                    {product.status?.toUpperCase()}
                                                </span>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {(queueTab === 'pending' ? pendingProducts : 
                          queueTab === 'approved' ? approvedProductsList : 
                          flaggedProductsList).length === 0 && (
                            <div className="empty-table">
                                <p>No products found in this category.</p>
                            </div>
                        )}
                    </div>
                </div>

                {selectedItem && (
                    <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
                        <div className="product-modal-card" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close-btn" onClick={() => setSelectedItem(null)}>✕</button>
                            
                            <div className="modal-content-grid">
                                <div className="modal-gallery-section">
                                    <div className="modal-main-image">
                                        <img src={selectedItem.images?.[modalImageIndex] || '/assets/image.webp'} alt="" />
                                        {selectedItem.images?.length > 1 && (
                                            <div className="modal-carousel-nav">
                                                <button onClick={() => setModalImageIndex((modalImageIndex - 1 + selectedItem.images.length) % selectedItem.images.length)}>‹</button>
                                                <button onClick={() => setModalImageIndex((modalImageIndex + 1) % selectedItem.images.length)}>›</button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="modal-thumbnails">
                                        {selectedItem.images?.map((img, i) => (
                                            <img 
                                                key={i} 
                                                src={img} 
                                                alt="" 
                                                className={i === modalImageIndex ? 'active' : ''} 
                                                onClick={() => setModalImageIndex(i)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="modal-details-section">
                                    <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                            <h2 className="modal-title" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900 }}>{selectedItem.title}</h2>
                                            <span className={`cat-tag cat-${(selectedItem.category || 'other').toLowerCase().replace(/\s+/g, '-')}`}>
                                                {selectedItem.category || 'Other'}
                                            </span>
                                        </div>
                                        <p className="modal-price" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-color)' }}>₹{selectedItem.price?.toLocaleString()}</p>
                                    </div>

                                    <div className="modal-specs-grid">
                                        <div className="spec-item">
                                            <span className="spec-label">Condition</span>
                                            <span className="spec-value">{selectedItem.condition}</span>
                                        </div>
                                        <div className="spec-item">
                                            <span className="spec-label">Years Used</span>
                                            <span className="spec-value">{selectedItem.yearsUsed} Years</span>
                                        </div>
                                        <div className="spec-item">
                                            <span className="spec-label">Pickup Point</span>
                                            <span className="spec-value">{selectedItem.pickupPoint}</span>
                                        </div>
                                        <div className="spec-item">
                                            <span className="spec-label">Listed On</span>
                                            <span className="spec-value">{new Date(selectedItem.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="modal-description">
                                        <h4>Description</h4>
                                        <p>{selectedItem.description}</p>
                                    </div>

                                    <div className="modal-seller-card">
                                        <div className="seller-avatar-container">
                                            <img 
                                                src={getProfileIcon(selectedItem.seller)} 
                                                alt="Seller" 
                                                className="modal-seller-avatar"
                                            />
                                        </div>
                                        <div className="seller-info">
                                            <p className="seller-name">{selectedItem.seller?.firstName} {selectedItem.seller?.lastName}</p>
                                            <p className="seller-meta">Hostel {selectedItem.seller?.address || 'N/A'} • Verified Student</p>
                                        </div>
                                    </div>

                                    <div className="modal-actions">
                                        <button className="btn-chat-seller" onClick={() => { handleStartChat(selectedItem.seller); setSelectedItem(null); }}>💬 Message Seller</button>
                                        <button className="btn-reject" onClick={() => handleReject(selectedItem._id)}>Reject Item</button>
                                        <button className="btn-flag" onClick={() => handleToggleFlag(selectedItem._id)}>
                                            {selectedItem.isFlagged ? 'Unflag' : 'Flag for Review'}
                                        </button>
                                        {(selectedItem.status !== 'approved' && selectedItem.status !== 'active') && (
                                            <button className="btn-approve" onClick={() => handleApprove(selectedItem._id)}>Approve Item</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderUserDirectory = () => {
        // Filter users based on search term
        const filteredUsers = allUsers.filter(user => {
            const name = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
            const email = (user.email || '').toLowerCase();
            const search = searchTerm.toLowerCase();
            const matchesSearch = name.includes(search) || email.includes(search);
            
            const matchesStatus = filterStatus === 'all' || 
                (filterStatus === 'verified' && user.isVerified && !user.isSuspended) ||
                (filterStatus === 'pending' && !user.isVerified && !user.isSuspended) ||
                (filterStatus === 'suspended' && user.isSuspended);
                
            const matchesRole = filterRole === 'all' || user.role?.toLowerCase() === filterRole.toLowerCase();
            
            return matchesSearch && matchesStatus && matchesRole;
        });

        const stats = [
            { label: 'Total Users', value: allUsers.length, icon: '👥', type: 'total' },
            { label: 'Verified', value: allUsers.filter(u => u.isVerified).length, icon: '🛡️', type: 'verified' },
            { label: 'Pending', value: allUsers.filter(u => !u.isVerified).length, icon: '📋', type: 'pending' },
            { label: 'Suspended', value: allUsers.filter(u => u.isSuspended).length, icon: '🚫', type: 'suspended' }
        ];

        return (
            <div className="tab-content user-directory-view">
                <header className="directory-header">
                    <div className="directory-title">
                        <h1>User Directory</h1>
                        <p>Manage and audit {allUsers.length.toLocaleString()} registered campus members</p>
                    </div>
                    <div className="header-actions">
                        <div className="filter-dropdown-container" style={{ position: 'relative' }}>
                            <button className={`filter-btn ${filterStatus !== 'all' || filterRole !== 'all' ? 'active' : ''}`} onClick={() => setShowFilterMenu(!showFilterMenu)}>
                                <span>三</span> Filter {(filterStatus !== 'all' || filterRole !== 'all') && <span className="filter-dot"></span>}
                            </button>
                            {showFilterMenu && (
                                <div className="filter-menu user-dir-filters premium-menu">
                                    <div className="filter-section">
                                        <label>Account Status</label>
                                        <div className="filter-options grid">
                                            <button className={filterStatus === 'all' ? 'active' : ''} onClick={() => setFilterStatus('all')}>
                                                <span className="opt-icon">🌎</span> All
                                            </button>
                                            <button className={filterStatus === 'verified' ? 'active' : ''} onClick={() => setFilterStatus('verified')}>
                                                <span className="opt-icon">🛡️</span> Verified
                                            </button>
                                            <button className={filterStatus === 'pending' ? 'active' : ''} onClick={() => setFilterStatus('pending')}>
                                                <span className="opt-icon">⏳</span> Pending
                                            </button>
                                            <button className={filterStatus === 'suspended' ? 'active' : ''} onClick={() => setFilterStatus('suspended')}>
                                                <span className="opt-icon">🚫</span> Suspended
                                            </button>
                                        </div>
                                    </div>
                                    <div className="filter-section">
                                        <label>Campus Role</label>
                                        <div className="filter-options grid">
                                            <button className={filterRole === 'all' ? 'active' : ''} onClick={() => setFilterRole('all')}>
                                                <span className="opt-icon">👥</span> All Roles
                                            </button>
                                            <button className={filterRole === 'student' ? 'active' : ''} onClick={() => setFilterRole('student')}>
                                                <span className="opt-icon">🎓</span> Student
                                            </button>
                                            <button className={filterRole === 'staff' ? 'active' : ''} onClick={() => setFilterRole('staff')}>
                                                <span className="opt-icon">🏢</span> Staff
                                            </button>
                                            <button className={filterRole === 'admin' ? 'active' : ''} onClick={() => setFilterRole('admin')}>
                                                <span className="opt-icon">🛡️</span> Admin
                                            </button>
                                        </div>
                                    </div>
                                    <div className="filter-footer">
                                        <button className="reset-link" onClick={() => { setFilterStatus('all'); setFilterRole('all'); setShowFilterMenu(false); }}>Reset All</button>
                                        <button className="apply-btn" onClick={() => setShowFilterMenu(false)}>Apply Filters</button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button className="export-btn" onClick={() => {
                            const escapeCSV = (str) => {
                                if (!str) return '""';
                                const stringified = String(str);
                                if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
                                    return `"${stringified.replace(/"/g, '""')}"`;
                                }
                                return stringified;
                            };

                            const headers = ['Name', 'Email', 'Gender', 'Verified', 'Suspended', 'Joining Date'];
                            const rows = filteredUsers.map(u => [
                                escapeCSV(`${u.firstName} ${u.lastName}`),
                                escapeCSV(u.email),
                                escapeCSV(u.gender || 'N/A'),
                                u.isVerified ? 'Yes' : 'No',
                                u.isSuspended ? 'Yes' : 'No',
                                escapeCSV(u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
                            ]);

                            const csvContent = [
                                headers.join(','),
                                ...rows.map(r => r.join(','))
                            ].join('\n');

                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.setAttribute('href', url);
                            link.setAttribute('download', `campuskart_users_${new Date().toISOString().split('T')[0]}.csv`);
                            link.style.visibility = 'hidden';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}>
                            <span>📥</span> Export Data
                        </button>
                    </div>
                </header>

                <div className="directory-stats-grid">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="dir-stat-card">
                            <div className={`icon-box ${stat.type}`}>{stat.icon}</div>
                            <div className="stat-info">
                                <span className="label">{stat.label}</span>
                                <h2 className="value">{stat.value.toLocaleString()}</h2>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="directory-table-container">
                    <table className="dir-table">
                        <thead>
                            <tr>
                                <th>USER DETAILS</th>
                                <th>STATUS</th>
                                <th>JOINING DATE</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '3rem' }}>
                                        No users found matching "{searchTerm}"
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user._id}>
                                        <td>
                                            <div className="user-profile-cell">
                                                <div className="user-avatar-rect">
                                                    <img src={getProfileIcon(user)} alt="" className="dir-user-avatar" />
                                                    {user.isVerified && <span className="verified-dot">✓</span>}
                                                </div>
                                                <div className="user-meta">
                                                    <h4>
                                                        {user.firstName || 'Unknown'} {user.lastName || ''}
                                                        <span className={`role-pill ${user.role?.toLowerCase() || 'student'}`}>
                                                            {user.role?.toLowerCase() === 'student' ? '🎓' : 
                                                             user.role?.toLowerCase() === 'staff' ? '💼' : 
                                                             user.role?.toLowerCase() === 'admin' ? '🛡️' : '👤'} {user.role?.toUpperCase() || 'STUDENT'}
                                                        </span>
                                                    </h4>
                                                    <p>{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={`status-indicator ${user.isSuspended ? 'suspended' : (user.isVerified ? 'verified' : 'pending')}`}>
                                                <span className="dot"></span>
                                                {user.isSuspended ? 'Suspended' : (user.isVerified ? 'Verified' : 'Pending')}
                                            </div>
                                        </td>
                                        <td className="join-date-cell">
                                            {getJoiningDate(user)}
                                        </td>
                                        <td>
                                            <div className="dir-action-group">
                                                {user.isSuspended ? (
                                                    <button className="dir-reactivate-btn" onClick={() => toggleUserStatus(user._id, true, 'suspend')}>
                                                        Reactivate
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button className="icon-action" title="View details" onClick={() => setSelectedUserDir(user)}>👁</button>
                                                        <button className="icon-action" title="Suspend user" onClick={() => toggleUserStatus(user._id, false, 'suspend')}>⊘</button>
                                                        {user.isVerified ? (
                                                            <button className="dir-edit-btn" onClick={() => setSelectedUserDir(user)}>Edit</button>
                                                        ) : (
                                                            <button className="dir-verify-btn" onClick={() => toggleUserStatus(user._id, false, 'verify')}>
                                                                Verify Identity
                                                            </button>
                                                        )}
                                                         <button className="icon-action chat" title="Chat with user" onClick={() => handleStartChat(user)}>💬</button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    <div className="table-footer">
                        <span className="showing-text">
                            Showing {filteredUsers.length} of {allUsers.length} users
                        </span>
                        <div className="pagination-group">
                            <button className="pag-btn arrow">‹</button>
                            <button className="pag-btn active">1</button>
                            <button className="pag-btn">2</button>
                            <button className="pag-btn">3</button>
                            <span style={{ color: '#94A3B8', padding: '0 0.5rem' }}>...</span>
                            <button className="pag-btn arrow">›</button>
                        </div>
                    </div>
                </div>

                {selectedUserDir && (
                    <div className="modal-overlay" onClick={() => { setSelectedUserDir(null); setIsEditingUser(false); }}>
                        <div className="user-modal-card side-by-side" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close-btn" onClick={() => { setSelectedUserDir(null); setIsEditingUser(false); }}>✕</button>
                            
                            <div className="user-modal-container">
                                <div className="user-modal-left">
                                    <div className="user-modal-image-container">
                                        <img src={getProfileIcon(selectedUserDir)} alt="User Profile" />
                                    </div>
                                    <div className="user-modal-actions">
                                        {isEditingUser ? (
                                            <>
                                                <button className="action-btn verify" onClick={handleSaveUser}>
                                                    💾 Save Changes
                                                </button>
                                                <button className="action-btn suspend" onClick={handleCancelEdit}>
                                                    ✕ Cancel Edit
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button className="action-btn chat" onClick={() => { handleStartChat(selectedUserDir); setSelectedUserDir(null); setActiveTab('messages'); }}>
                                                    💬 Message User
                                                </button>
                                                {!selectedUserDir.isVerified && !selectedUserDir.isSuspended && (
                                                    <button className="action-btn verify" onClick={() => { toggleUserStatus(selectedUserDir._id, false, 'verify'); setSelectedUserDir(null); }}>
                                                        🛡️ Verify Now
                                                    </button>
                                                )}
                                                {!selectedUserDir.isSuspended ? (
                                                    <button className="action-btn suspend" onClick={() => { toggleUserStatus(selectedUserDir._id, false, 'suspend'); setSelectedUserDir(null); }}>
                                                        ⊘ Suspend Account
                                                    </button>
                                                ) : (
                                                    <button className="action-btn reactivate" onClick={() => { toggleUserStatus(selectedUserDir._id, true, 'suspend'); setSelectedUserDir(null); }}>
                                                        ⚡ Reactivate
                                                    </button>
                                                )}
                                                <button className="action-btn edit-trigger" onClick={() => { setEditUserData({ ...selectedUserDir }); setIsEditingUser(true); }}>
                                                    ✏️ Edit Profile
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="user-modal-right">
                                    <div className="user-info-header">
                                        {isEditingUser ? (
                                            <div className="edit-name-group">
                                                <input 
                                                    className="edit-input name-input" 
                                                    name="firstName" 
                                                    value={editUserData.firstName} 
                                                    onChange={handleEditChange} 
                                                    placeholder="First Name"
                                                />
                                                <input 
                                                    className="edit-input name-input" 
                                                    name="lastName" 
                                                    value={editUserData.lastName} 
                                                    onChange={handleEditChange} 
                                                    placeholder="Last Name"
                                                />
                                            </div>
                                        ) : (
                                            <h2>{selectedUserDir.firstName} {selectedUserDir.middleName ? selectedUserDir.middleName + ' ' : ''}{selectedUserDir.lastName}</h2>
                                        )}
                                        <div className="user-pills">
                                            {isEditingUser ? (
                                                <select 
                                                    className="edit-select role-select" 
                                                    name="role" 
                                                    value={editUserData.role} 
                                                    onChange={handleEditChange}
                                                >
                                                    <option value="student">STUDENT</option>
                                                    <option value="staff">STAFF</option>
                                                    <option value="admin">ADMIN</option>
                                                </select>
                                            ) : (
                                                <span className={`role-pill ${selectedUserDir.role?.toLowerCase()}`}>
                                                    {selectedUserDir.role?.toLowerCase() === 'student' ? '🎓' : 
                                                     selectedUserDir.role?.toLowerCase() === 'staff' ? '💼' : 
                                                     selectedUserDir.role?.toLowerCase() === 'admin' ? '🛡️' : '👤'} {selectedUserDir.role?.toUpperCase()}
                                                </span>
                                            )}
                                            {!isEditingUser && (
                                                selectedUserDir.isSuspended ? (
                                                    <span className="status-pill suspended">Suspended</span>
                                                ) : selectedUserDir.isVerified ? (
                                                    <span className="verified-text-label">🛡️ Verified Member</span>
                                                ) : (
                                                    <span className="status-pill pending">Pending Verification</span>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    <div className="user-details-scrollable">
                                        <div className="user-details-grid">
                                            <div className="detail-item">
                                                <label>Email Address</label>
                                                <p>{selectedUserDir.email}</p>
                                            </div>
                                            <div className="detail-item">
                                                <label>Mobile Number</label>
                                                {isEditingUser ? (
                                                    <input 
                                                        className="edit-input" 
                                                        name="mobileNumber" 
                                                        value={editUserData.mobileNumber || ''} 
                                                        onChange={handleEditChange} 
                                                    />
                                                ) : (
                                                    <p>{selectedUserDir.mobileNumber || 'N/A'}</p>
                                                )}
                                            </div>
                                            <div className="detail-item">
                                                <label>College ID</label>
                                                {isEditingUser ? (
                                                    <input 
                                                        className="edit-input" 
                                                        name="collegeId" 
                                                        value={editUserData.collegeId || ''} 
                                                        onChange={handleEditChange} 
                                                    />
                                                ) : (
                                                    <p>{selectedUserDir.collegeId || 'N/A'}</p>
                                                )}
                                            </div>
                                            <div className="detail-item">
                                                <label>Department</label>
                                                {isEditingUser ? (
                                                    <input 
                                                        className="edit-input" 
                                                        name="department" 
                                                        value={editUserData.department || ''} 
                                                        onChange={handleEditChange} 
                                                    />
                                                ) : (
                                                    <p>{selectedUserDir.department || 'N/A'}</p>
                                                )}
                                            </div>
                                            <div className="detail-item">
                                                <label>Gender</label>
                                                <p>{selectedUserDir.gender || 'Not Specified'}</p>
                                            </div>
                                            <div className="detail-item">
                                                <label>Joining Date</label>
                                                <p>{getJoiningDate(selectedUserDir)}</p>
                                            </div>
                                            <div className="detail-item full-width">
                                                <label>Hostel / Address</label>
                                                {isEditingUser ? (
                                                    <input 
                                                        className="edit-input" 
                                                        name="address" 
                                                        value={editUserData.address || ''} 
                                                        onChange={handleEditChange} 
                                                    />
                                                ) : (
                                                    <p>{selectedUserDir.address || 'No address provided'}</p>
                                                )}
                                            </div>
                                            <div className="detail-item full-width">
                                                <label>Account ID</label>
                                                <p style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>#{selectedUserDir._id.toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderMarketplaceView = () => {
        const allProducts = [...approvedProductsList, ...pendingProducts, ...flaggedProductsList];

        return (
            <div className="tab-content marketplace-view">
                <header className="view-header">
                    <h1>Marketplace View</h1>
                    <p>Live look at how users experience the campus marketplace.</p>
                </header>

                <div className="admin-products-grid">
                    {allProducts.length === 0 ? (
                        <div className="empty-state">
                            <p>No products currently in the marketplace.</p>
                        </div>
                    ) : (
                        allProducts.map(product => (
                            <div key={product._id} className="admin-product-wrapper">
                                <div className={`status-badge ${product.status}`}>
                                    {product.status?.toUpperCase() || 'PENDING'}
                                </div>
                                <ProductCard
                                    product={product}
                                    isSeller={false}
                                    showContactBtn={true}
                                    isAdmin={true}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    const renderReports = () => {
        const filteredReports = reports.filter(report => {
            const searchLower = searchTerm.toLowerCase();
            const reason = report.reason?.toLowerCase() || "";
            const description = report.description?.toLowerCase() || "";
            const reporterName = report.reporter ? `${report.reporter.firstName} ${report.reporter.lastName}`.toLowerCase() : "";
            
            const matchesSearch = reason.includes(searchLower) || description.includes(searchLower) || reporterName.includes(searchLower);
            const matchesStatus = reportFilterStatus === 'all' || report.status === reportFilterStatus;
            
            return matchesSearch && matchesStatus;
        });

        const reportStats = [
            { label: 'Total Reports', value: reports.length, icon: '📊', color: 'blue' },
            { label: 'Pending', value: reports.filter(r => r.status === 'pending').length, icon: '⏳', color: 'orange' },
            { label: 'Resolved', value: reports.filter(r => r.status === 'resolved').length, icon: '✅', color: 'green' },
            { label: 'Dismissed', value: reports.filter(r => r.status === 'dismissed').length, icon: '🚫', color: 'gray' }
        ];

        return (
            <div className="tab-content reports-view">
                <header className="view-header">
                    <h1>Platform Reports</h1>
                    <p>Monitor and resolve user-submitted reports for products, users, and reviews.</p>
                </header>

                <div className="reports-stats-grid">
                    {reportStats.map((stat, i) => (
                        <div key={i} className={`report-stat-card ${stat.color}`}>
                            <span className="stat-icon">{stat.icon}</span>
                            <div className="stat-info">
                                <span className="label">{stat.label}</span>
                                <h2 className="value">{stat.value}</h2>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="reports-filter-bar">
                    <div className="filter-pills">
                        <button className={reportFilterStatus === 'all' ? 'active' : ''} onClick={() => setReportFilterStatus('all')}>All</button>
                        <button className={reportFilterStatus === 'pending' ? 'active' : ''} onClick={() => setReportFilterStatus('pending')}>Pending</button>
                        <button className={reportFilterStatus === 'resolved' ? 'active' : ''} onClick={() => setReportFilterStatus('resolved')}>Resolved</button>
                        <button className={reportFilterStatus === 'dismissed' ? 'active' : ''} onClick={() => setReportFilterStatus('dismissed')}>Dismissed</button>
                    </div>
                </div>

                <div className="reports-list">
                    {filteredReports.length === 0 ? (
                        <div className="empty-state">No reports found matching your criteria.</div>
                    ) : (
                        <div className="admin-table-container">
                            <table className="admin-table reports-table">
                                <thead>
                                    <tr>
                                        <th>TYPE</th>
                                        <th>TARGET ID</th>
                                        <th>REPORTER</th>
                                        <th>REASON</th>
                                        <th>STATUS</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReports.map(report => (
                                        <tr key={report._id}>
                                            <td>
                                                <span className={`type-tag ${report.targetType}`}>
                                                    {report.targetType.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="id-cell">#{report.targetId ? report.targetId.toString().slice(-4) : 'N/A'}</td>
                                            <td>
                                                <div className="reporter-cell">
                                                    <p className="name">{report.reporter ? `${report.reporter.firstName} ${report.reporter.lastName}` : 'Anonymous'}</p>
                                                    <p className="email">{report.reporter?.email || ''}</p>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="reason-cell">
                                                    <p className="reason-text">{report.reason}</p>
                                                    <p className="desc-text">{report.description}</p>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-pill ${report.status}`}>
                                                    {report.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-cell">
                                                    {report.status === 'pending' ? (
                                                        <>
                                                            <button 
                                                                className="action-btn resolve"
                                                                onClick={() => {
                                                                    showModal({
                                                                        title: 'Resolve Report',
                                                                        message: 'Add admin notes for this resolution:',
                                                                        type: 'prompt',
                                                                        onConfirm: (notes) => handleUpdateReportStatus(report._id, 'resolved', notes)
                                                                    });
                                                                }}
                                                            >
                                                                Take Action
                                                            </button>
                                                            <button 
                                                                className="action-btn dismiss"
                                                                onClick={() => handleUpdateReportStatus(report._id, 'dismissed', 'Reason irrelevant or false positive.')}
                                                            >
                                                                Dismiss
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="handled-text">Resolved on {new Date(report.updatedAt).toLocaleDateString()}</span>
                                                    )}
                                                    {report.reporter && (
                                                        <button 
                                                            className="action-btn chat-mini" 
                                                            title="Message Reporter"
                                                            onClick={() => handleStartChat(report.reporter)}
                                                        >
                                                            💬 Reporter
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderReviews = () => {
        const filteredReviews = allReviews.filter(review => {
            const searchLower = searchTerm.toLowerCase();
            const productTitle = review.product?.title?.toLowerCase() || "";
            const userName = `${review.user?.firstName} ${review.user?.lastName}`.toLowerCase();
            const comment = review.comment?.toLowerCase() || "";
            
            // Time filtering logic
            const reviewDate = new Date(review.createdAt);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const matchesTime = reviewTimeRange === 'all' || reviewDate >= thirtyDaysAgo;
            
            return (productTitle.includes(searchLower) || userName.includes(searchLower) || comment.includes(searchLower)) && matchesTime;
        });

        const statsData = [
            { label: 'Total Reviews', value: allReviews.length.toLocaleString(), icon: '💬', color: 'green', change: '+12% VS LY' },
            { label: 'Average Rating', value: (allReviews.reduce((acc, r) => acc + r.rating, 0) / (allReviews.length || 1)).toFixed(1), icon: '⭐', color: 'yellow', change: 'STEADY' },
            { label: 'Flagged Reviews', value: allReviews.filter(r => r.isFlagged).length, icon: '🚩', color: 'red', change: 'NEEDS ACTION' },
            { label: 'Recent Activity', value: '156 hr', icon: '⚡', color: 'blue', change: 'REAL-TIME' }
        ];

        return (
            <div className="tab-content reviews-moderation-view">
                <header className="view-header">
                    <div className="header-top">
                        <div className="header-left">
                            <h1>Review Moderation</h1>
                        </div>
                        <div className="header-right">
                            <div className="time-filters">
                                <button 
                                    className={reviewTimeRange === 'all' ? 'active' : ''} 
                                    onClick={() => setReviewTimeRange('all')}
                                >
                                    All Time
                                </button>
                                <button 
                                    className={reviewTimeRange === '30days' ? 'active' : ''} 
                                    onClick={() => setReviewTimeRange('30days')}
                                >
                                    Last 30 Days
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="header-desc">Manage student feedback and maintain marketplace integrity.</p>
                </header>

                <div className="reviews-stats-grid">
                    {statsData.map((stat, i) => (
                        <div key={i} className={`rev-stat-card ${stat.color}`}>
                            <div className="stat-header">
                                <span className="stat-icon">{stat.icon}</span>
                                <span className="stat-change">{stat.change}</span>
                            </div>
                            <div className="stat-body">
                                <span className="stat-label">{stat.label}</span>
                                <span className="stat-value">{stat.value}{stat.label === 'Average Rating' && <small>/ 5</small>}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="reviews-filter-bar">
                    <div className="filter-pills">
                        <button className="active">All Reviews ({filteredReviews.length})</button>
                        <button onClick={() => setSearchTerm("1")}>1-Star Only</button>
                        <button onClick={() => { /* Toggle Flagged */ }}>Flagged</button>
                    </div>
                    <div className="filter-search">
                        <input 
                            type="text" 
                            placeholder="Search by product, user or content..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button className="filter-settings-btn" onClick={() => setSearchTerm("")}>✕</button>
                    </div>
                </div>

                <div className="reviews-list">
                    {filteredReviews.length === 0 ? (
                        <div className="empty-state">No reviews found matching "{searchTerm}".</div>
                    ) : (
                        filteredReviews.map(review => (
                            <div key={review._id} className={`review-mod-card ${review.isFlagged ? 'is-flagged' : ''}`}>
                                <div className="rev-card-left">
                                    <div className="rev-prod-img-container">
                                        <img 
                                            src={review.product?.images?.[0] 
                                                ? (review.product.images[0].startsWith('http') ? review.product.images[0] : `http://localhost:5001${review.product.images[0]}`) 
                                                : '/assets/image.webp'} 
                                            alt="" 
                                            className="rev-prod-img" 
                                        />
                                        <div className="rev-card-badges">
                                            <span className={`product-category cat-${(review.product?.category || 'others').toLowerCase().replace(/\s+/g, '-')}`}>
                                                {review.product?.category || 'Others'}
                                            </span>
                                            <span className="rev-prod-id">#{review.product?._id.slice(-4).toUpperCase() || 'ITM'}</span>
                                        </div>
                                    </div>
                                    <div className="rev-prod-info">
                                        <h4>{review.product?.title || 'Unknown Product'}</h4>
                                        <p>₹{review.product?.price}</p>
                                    </div>
                                </div>
                                <div className="rev-card-right">
                                    <div className="rev-user-header">
                                        <div className="rev-user-meta">
                                            <div className="rev-user-avatar">
                                                <img src={getProfileIcon(review.user)} alt="" />
                                            </div>
                                            <div className="rev-user-details">
                                                <h5>{review.user?.firstName} {review.user?.lastName}</h5>
                                                <div className="rev-user-sub">
                                                    <span className={`role-pill ${review.user?.role ? review.user.role.toLowerCase() : 'unknown'}`}>
                                                        {review.user?.role?.toLowerCase() === 'student' ? '🎓' : 
                                                         review.user?.role?.toLowerCase() === 'staff' ? '💼' : 
                                                         review.user?.role?.toLowerCase() === 'admin' ? '🛡️' : '👤'} 
                                                        {(review.user?.role || 'UNKNOWN').toUpperCase()}
                                                    </span>
                                                    <span className="rev-date"> • {new Date(review.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="rev-rating-status">
                                            <div className="stars">{'⭐'.repeat(review.rating)}</div>
                                            {review.isFlagged && <span className="rev-status flagged">FLAGGED</span>}
                                        </div>
                                    </div>

                                    <div className="rev-content">
                                        <p>"{review.comment}"</p>
                                    </div>

                                    <div className="rev-actions">
                                        <div className="action-left">
                                            {review.isFlagged ? (
                                                <>
                                                    <button 
                                                        className="btn-confirm-delete"
                                                        onClick={() => {
                                                            showModal({
                                                                title: 'Delete Review',
                                                                message: 'Are you sure you want to delete this flagged review?',
                                                                type: 'confirm',
                                                                onConfirm: () => handleDeleteReview(review._id)
                                                            });
                                                        }}
                                                    >
                                                        <span className="icon">🗑️</span> Confirm Removal
                                                    </button>
                                                    <button 
                                                        className="btn-dismiss"
                                                        onClick={() => handleToggleReviewFlag(review._id)}
                                                    >
                                                        Dismiss Flag
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button 
                                                        className={`btn-helpful ${review.isHelpful ? 'active' : ''}`}
                                                        onClick={() => handleToggleReviewHelpful(review._id)}
                                                    >
                                                        <span className="icon">👍</span> {review.isHelpful ? 'Helpful' : 'Mark as Helpful'}
                                                    </button>
                                                    <button 
                                                        className="btn-reply" 
                                                        onClick={() => handleStartChat(review.user)}
                                                    >
                                                        <span className="icon">💬</span> Reply to Review
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        <div className="action-right">
                                            {!review.isFlagged && (
                                                <button 
                                                    className="btn-utility-flag" 
                                                    title="Flag for moderation"
                                                    onClick={() => handleToggleReviewFlag(review._id)}
                                                >
                                                    🚩
                                                </button>
                                            )}
                                            <button 
                                                className="btn-utility-delete" 
                                                title="Delete Review"
                                                onClick={() => {
                                                    showModal({
                                                        title: 'Delete Review',
                                                        message: 'Are you sure you want to delete this review?',
                                                        type: 'confirm',
                                                        onConfirm: () => handleDeleteReview(review._id)
                                                    });
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="admin-page-container">
            <div className="admin-layout-wrapper">
                <aside className="admin-sidebar">
                    <div className="sidebar-brand brand-logo-shared">
                        <div className="logo-box-shared">C</div>
                        <div className="brand-text">
                            <h3>CampusKart Admin</h3>
                        </div>
                    </div>

                    <nav className="sidebar-nav">
                        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
                            <span className="icon">🔳</span> DASHBOARD
                        </button>
                        <button className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setActiveTab('reviews')}>
                            <span className="icon">📝</span> REVIEWS
                        </button>
                        <button className={activeTab === 'queue' ? 'active' : ''} onClick={() => setActiveTab('queue')}>
                            <span className="icon">📦</span> PRODUCTS
                        </button>
                        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
                            <span className="icon">👤</span> USERS
                        </button>
                        <button className={activeTab === 'marketplace' ? 'active' : ''} onClick={() => setActiveTab('marketplace')}>
                            <span className="icon">🏪</span> MARKETPLACE
                        </button>
                        <button className={activeTab === 'messages' ? 'active' : ''} onClick={() => setActiveTab('messages')}>
                            <span className="icon">💬</span> MESSAGES
                        </button>
                        <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>
                            <span className="icon">📊</span> REPORTS
                        </button>
                        <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>
                            <span className="icon">⚙️</span> SETTINGS
                        </button>
                    </nav>

                    {/* Sidebar footer removed as per request (Logout and other buttons) */}
                </aside>

                <main className="admin-main">
                    <header className="admin-top-nav">
                        <div className="search-bar">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder={activeTab === 'users' ? "Search users by name or email..." : "Search analytics or items..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="nav-actions">
                            <button className="nav-btn notification" title="Messages" onClick={() => setActiveTab('messages')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>🔔</button>
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
                                                setShowProfileDropdown(false);
                                                showModal({
                                                    title: 'Logout',
                                                    message: 'Are you sure you want to logout from Admin?',
                                                    type: 'confirm',
                                                    onConfirm: () => {
                                                        sessionStorage.removeItem('token');
                                                        window.location.href='/login';
                                                    }
                                                });
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '0.6rem',
                                                borderRadius: '8px',
                                                border: '1px solid #fee2e2',
                                                backgroundColor: 'white',
                                                color: '#ef4444',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                                            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
                                        >
                                            LOGOUT
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    <div className="admin-content-area">
                        {loading ? (
                            <div className="admin-loading">
                                <div className="spinner"></div>
                                <p>Loading Management Suite...</p>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'overview' && renderOverview()}
                                {activeTab === 'reviews' && renderReviews()}
                                {activeTab === 'queue' && renderApprovalQueue()}
                                {activeTab === 'users' && renderUserDirectory()}
                                {activeTab === 'marketplace' && renderMarketplaceView()}
                                {activeTab === 'messages' && (
                                    <div className="tab-content messages-admin-view">
                                         <Messages hideSidebar={true} isAdmin={true} propTargetUserId={targetChatUser} />
                                    </div>
                                )}
                                {activeTab === 'reports' && renderReports()}
                                {activeTab === 'settings' && (
                                    <div className="tab-content settings-view">
                                        <header className="view-header">
                                            <h1>Settings</h1>
                                            <p>Configure platform-wide parameters and admin access.</p>
                                        </header>
                                        <div className="card">
                                            <p>Settings configuration coming soon...</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>
            <Footer isAdmin={true} />
        </div>
    );
};

export default AdminDashboard;
