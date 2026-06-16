import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useModal } from '../context/ModalContext';
import ProductCard from '../Components/ProductCard';
import Messages from './Messages';
import Footer from '../Components/Footer';
import femaleAvatar from '../assets/female-avatar.png';
import maleAvatar from '../assets/male-avatar.png';
import itemStandard from '../assets/image.webp';
import { formatNumericDate, formatExpiryDate } from '../utils/dateUtils';
import ModerationModal from '../Components/ModerationModal';
import '../styles/AdminDashboard.css';
import '../styles/AccountStatus.css';


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
    const [filterStatus, setFilterStatus] = useState('all'); // all, registered, unregistered
    const [filterRole, setFilterRole] = useState('all'); // all, student, staff, admin
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [selectedUserDir, setSelectedUserDir] = useState(null);
    const [isEditingUser, setIsEditingUser] = useState(false);
    const [editUserData, setEditUserData] = useState({});
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [newUserData, setNewUserData] = useState({
      email: '',
      firstName: '',
      lastName: '',
      gender: '',
      collegeId: '',
      role: '',
      graduationYear: ''
    });
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [userCurrentPage, setUserCurrentPage] = useState(1);


    const profileDropdownRef = useRef(null);
    const growthDropdownRef = useRef(null);
    const [reviewTimeRange, setReviewTimeRange] = useState('all'); // all, 30days
    const [reviewRatingFilter, setReviewRatingFilter] = useState('all'); // all, 1, 2, 3, 4, 5
    const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
    const token = sessionStorage.getItem('token');
    const { showModal } = useModal();

    const resetAddUserForm = () => {
        setNewUserData({ email: '', firstName: '', lastName: '', gender: '', collegeId: '', role: '', graduationYear: '' });
    };

    const handleAddUserSubmit = async (e) => {
        e.preventDefault();
        if (isAddingUser) return;

        setIsAddingUser(true);
        try {
            const res = await axios.post('http://localhost:5001/api/auth/users', newUserData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showModal({ title: 'Success', message: res.data.message, type: 'confirm' });
            setShowAddUserModal(false);
            resetAddUserForm();
            await fetchInitialData();
        } catch (err) {
            showModal({ title: 'Error', message: err.response?.data?.message || 'Failed to add user', type: 'alert' });
        } finally {
            setIsAddingUser(false);
        }
    };

    // Admin Account Settings state
    const [adminEmailData, setAdminEmailData] = useState({ newEmail: '', currentPassword: '' });
    const [adminPasswordData, setAdminPasswordData] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    const [isUpdatingAdminEmail, setIsUpdatingAdminEmail] = useState(false);
    const [isUpdatingAdminPassword, setIsUpdatingAdminPassword] = useState(false);

    // Admin Notifications state
    const [adminNotifications, setAdminNotifications] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const notifDropdownRef = useRef(null);
    const adminUnreadCount = adminNotifications.filter(n => !n.isRead).length;

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
    
    // Close growth dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (growthDropdownRef.current && !growthDropdownRef.current.contains(event.target)) {
                setShowGrowthMenu(false);
            }
        };

        if (showGrowthMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showGrowthMenu]);
    
    useEffect(() => {
        setModalImageIndex(0);
    }, [selectedItem]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        setUserCurrentPage(1);
    }, [searchTerm, filterStatus, filterRole, activeTab]);

    // Fetch admin notifications
    useEffect(() => {
        const fetchAdminNotifications = async () => {
            if (!token) return;
            try {
                const res = await axios.get('http://localhost:5001/api/notifications', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAdminNotifications(res.data || []);
            } catch (err) {
                console.error('[Admin] Notification fetch error:', err.message);
            }
        };
        fetchAdminNotifications();
    }, [token]);

    // Close notification dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
                setShowNotifDropdown(false);
            }
        };
        if (showNotifDropdown) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showNotifDropdown]);

    const handleMarkAdminNotifRead = async (notifId) => {
        try {
            await axios.put(`http://localhost:5001/api/notifications/${notifId}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAdminNotifications(prev => prev.map(n => n._id === notifId ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error('Mark read error:', err.message);
        }
    };

    const handleMarkAllAdminRead = async () => {
        try {
            await axios.put('http://localhost:5001/api/notifications/mark-all-read', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAdminNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Mark all read error:', err.message);
        }
    };

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
        if (user?.profilePhoto) {
            if (user.profilePhoto.startsWith('http')) return user.profilePhoto;
            const separator = user.profilePhoto.startsWith('/') ? '' : '/';
            return `http://localhost:5001${separator}${user.profilePhoto}`;
        }
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
            setAllUsers(prev => prev.map(u => u._id === editUserData._id ? { ...u, ...res.data.user } : u));
            setSelectedUserDir(prev => prev ? { ...prev, ...res.data.user } : res.data.user);
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
            let update = {};
            if (type === 'suspend') {
                update = { isSuspended: !currentStatus };
            } else if (type === 'expiry') {
                update = { accountStatus: currentStatus ? 'expired' : 'active' };
            }
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

    const handleDeleteUser = async (userId, userName) => {
        console.log("handleDeleteUser called on frontend with:", userId, userName);
        showModal({
            title: 'Delete User',
            message: `Are you sure you want to permanently delete ${userName}? This action cannot be undone and will delete all their listings.`,
            type: 'confirm',
            onConfirm: async () => {
                try {
                    const res = await axios.delete(`http://localhost:5001/api/auth/users/${userId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    showModal({ title: 'Success', message: res.data.message, type: 'alert' });
                    fetchInitialData();
                } catch (err) {
                    console.error("Error deleting user:", err);
                    showModal({ title: 'Error', message: err.response?.data?.message || 'Failed to delete user', type: 'alert' });
                }
            }
        });
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
                    <div className="card-icon flagged">🚩</div>
                    <div className="card-info">
                        <span className="label">Flagged Items</span>
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
                        <div className="growth-dropdown-container" ref={growthDropdownRef}>
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
                                <div className="bar-wrapper" style={{ overflow: 'visible' }}>
                                    <div 
                                        className="bar" 
                                        style={{ 
                                            height: `${Math.max(day.heightPercent, 3)}%`,
                                            transition: 'height 0.5s ease-out',
                                            position: 'relative',
                                            borderRadius: '10px 10px 2px 2px'
                                        }}
                                    >
                                        <span style={{
                                            position: 'absolute',
                                            bottom: '100%',
                                            width: '100%',
                                            textAlign: 'center',
                                            marginBottom: '4px',
                                            fontSize: '0.75rem',
                                            fontWeight: '800',
                                            color: '#1e40af',
                                            lineHeight: 1
                                        }}>
                                            {day.count > 0 ? day.count : ''}
                                        </span>
                                    </div>
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
                        activities.slice(0, 4).map((act) => (
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
                                  flaggedProductsList)
                                  .filter(product => {
                                      const searchLower = searchTerm.toLowerCase();
                                      const title = (product.title || '').toLowerCase();
                                      const seller = `${product.seller?.firstName || ''} ${product.seller?.lastName || ''}`.toLowerCase();
                                      const category = (product.category || '').toLowerCase();
                                      return title.includes(searchLower) || seller.includes(searchLower) || category.includes(searchLower);
                                  })
                                  .map(product => (
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
                          flaggedProductsList)
                          .filter(product => {
                              const searchLower = searchTerm.toLowerCase();
                              const title = (product.title || '').toLowerCase();
                              const seller = `${product.seller?.firstName || ''} ${product.seller?.lastName || ''}`.toLowerCase();
                              const category = (product.category || '').toLowerCase();
                              return title.includes(searchLower) || seller.includes(searchLower) || category.includes(searchLower);
                          })
                          .length === 0 && (
                            <div className="empty-table">
                                <p>{searchTerm ? `No products matching "${searchTerm}"` : 'No products found in this category.'}</p>
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                            <h2 className="modal-title" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900 }}>{selectedItem.title}</h2>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <span className={`cat-tag cat-${(selectedItem.category || 'other').toLowerCase().replace(/\s+/g, '-')}`}>
                                                    {selectedItem.category || 'Other'}
                                                </span>
                                                <span className={`status-pill ${selectedItem.status || 'pending'}`} style={{ fontSize: '0.7rem', height: 'fit-content', padding: '4px 10px' }}>
                                                    {(selectedItem.status || 'PENDING').toUpperCase()}
                                                </span>
                                            </div>
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
                                            <span className="spec-value">{formatNumericDate(selectedItem.createdAt)}</span>
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
                (filterStatus === 'registered' && user.isRegistered && !user.isSuspended && user.accountStatus !== 'expired') ||
                (filterStatus === 'unregistered' && !user.isRegistered) ||
                (filterStatus === 'suspended' && user.isSuspended) ||
                (filterStatus === 'expired' && user.accountStatus === 'expired');
                
            const matchesRole = filterRole === 'all' || user.role?.toLowerCase() === filterRole.toLowerCase();
            
            return matchesSearch && matchesStatus && matchesRole;
        });

        // Pagination calculations
        const USERS_PER_PAGE = 10;
        const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
        const activeUserPage = Math.min(userCurrentPage, Math.max(totalPages, 1));
        const startIndex = (activeUserPage - 1) * USERS_PER_PAGE;
        const endIndex = startIndex + USERS_PER_PAGE;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

        const stats = [
            { label: 'Total Users', value: allUsers.length, icon: '👥', type: 'total' },
            { label: 'Registered', value: allUsers.filter(u => u.isRegistered && !u.isSuspended).length, icon: '🛡️', type: 'verified' },
            { label: 'Unregistered', value: allUsers.filter(u => !u.isRegistered).length, icon: '⏳', type: 'pending' },
            { label: 'Suspended', value: allUsers.filter(u => u.isSuspended).length, icon: '🚫', type: 'suspended' }
        ];

        // Pagination buttons renderer helper
        const renderPaginationButtons = () => {
            const buttons = [];
            const maxVisiblePages = 5;

            if (totalPages <= maxVisiblePages) {
                for (let i = 1; i <= totalPages; i++) {
                    buttons.push(i);
                }
            } else {
                buttons.push(1);
                
                let start = Math.max(2, activeUserPage - 1);
                let end = Math.min(totalPages - 1, activeUserPage + 1);

                if (activeUserPage <= 3) {
                    end = 4;
                }
                if (activeUserPage >= totalPages - 2) {
                    start = totalPages - 3;
                }

                if (start > 2) {
                    buttons.push('...');
                }

                for (let i = start; i <= end; i++) {
                    buttons.push(i);
                }

                if (end < totalPages - 1) {
                    buttons.push('...');
                }

                buttons.push(totalPages);
            }

            return (
                <div className="pagination-group">
                    <button 
                        className="pag-btn arrow" 
                        onClick={() => setUserCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={activeUserPage === 1}
                    >
                        ‹
                    </button>
                    {buttons.map((btn, index) => {
                        if (btn === '...') {
                            return <span key={`dots-${index}`} style={{ color: '#94A3B8', padding: '0 0.5rem', userSelect: 'none' }}>...</span>;
                        }
                        return (
                          <button 
                            key={btn}
                            className={`pag-btn ${activeUserPage === btn ? 'active' : ''}`}
                            onClick={() => setUserCurrentPage(btn)}
                          >
                            {btn}
                          </button>
                        );
                    })}
                    <button 
                        className="pag-btn arrow" 
                        onClick={() => setUserCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={activeUserPage === totalPages || totalPages === 0}
                    >
                        ›
                    </button>
                </div>
            );
        };

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
                                            <button className={filterStatus === 'registered' ? 'active' : ''} onClick={() => setFilterStatus('registered')}>
                                                <span className="opt-icon">🛡️</span> Registered
                                            </button>
                                            <button className={filterStatus === 'unregistered' ? 'active' : ''} onClick={() => setFilterStatus('unregistered')}>
                                                <span className="opt-icon">⏳</span> Unregistered
                                            </button>
                                            <button className={filterStatus === 'suspended' ? 'active' : ''} onClick={() => setFilterStatus('suspended')}>
                                                <span className="opt-icon">🚫</span> Suspended
                                            </button>
                                            <button className={filterStatus === 'expired' ? 'active' : ''} onClick={() => setFilterStatus('expired')}>
                                                <span className="opt-icon">⏰</span> Expired
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

                            const headers = ['Name', 'Email', 'Gender', 'Registered', 'Suspended', 'Joining Date', 'Graduation Year', 'Expiry Date', 'Account Status'];
                            const rows = filteredUsers.map(u => [
                                escapeCSV(`${u.firstName} ${u.lastName}`),
                                escapeCSV(u.email),
                                escapeCSV(u.gender || 'N/A'),
                                u.isRegistered ? 'Yes' : 'No',
                                u.isSuspended ? 'Yes' : 'No',
                                escapeCSV(formatNumericDate(u.createdAt || new Date())),
                                escapeCSV(u.graduationYear || 'N/A'),
                                escapeCSV(u.accountExpiryDate ? formatExpiryDate(u.accountExpiryDate) : (u.graduationYear ? `31 July ${u.graduationYear}` : 'N/A')),
                                escapeCSV(u.accountStatus || (u.isRegistered ? 'active' : 'N/A'))
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
                        <button className="filter-btn add-user-btn" onClick={() => setShowAddUserModal(true)}>
                            <span>➕ Add User</span>
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
                                <th>GRADUATION & EXPIRY</th>
                                <th>STATUS</th>
                                <th>JOINING DATE</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>
                                        No users found matching "{searchTerm}"
                                    </td>
                                </tr>
                            ) : (
                                paginatedUsers.map(user => (
                                    <tr key={user._id}>
                                        <td>
                                            <div className="user-profile-cell">
                                                <div className="user-avatar-rect">
                                                    <img src={getProfileIcon(user)} alt="" className="dir-user-avatar" />
                                                    {user.isRegistered && <span className="verified-dot">✓</span>}
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
                                            {user.role === 'student' ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>Class of {user.graduationYear || 'N/A'}</span>
                                                    <span style={{ fontSize: '0.75rem', opacity: 0.8 }} title="Account Expiry Date">
                                                        {user.accountExpiryDate ? formatExpiryDate(user.accountExpiryDate) : (user.graduationYear ? `31 July ${user.graduationYear}` : 'Not Registered')}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>N/A</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className={`status-indicator ${user.accountStatus === 'expired' ? 'suspended' : (user.isSuspended ? 'suspended' : (user.isRegistered ? 'verified' : 'pending'))}`}>
                                                <span className="dot"></span>
                                                {user.accountStatus === 'expired' ? 'Expired' : (user.isSuspended ? 'Suspended' : (user.isRegistered ? 'Registered' : 'Unregistered'))}
                                            </div>
                                        </td>
                                        <td className="join-date-cell">
                                            {getJoiningDate(user)}
                                        </td>
                                        <td>
                                            <div className="dir-action-group">
                                                {!user.isRegistered ? (
                                                    <>
                                                        <button className="icon-action" title="View details" onClick={() => setSelectedUserDir(user)}>👁</button>
                                                        <button className="dir-edit-btn" onClick={() => { setSelectedUserDir(user); setIsEditingUser(true); setEditUserData({ ...user }); }}>Edit</button>
                                                        <button className="icon-action delete" title="Delete from directory" onClick={() => handleDeleteUser(user._id, `${user.firstName} ${user.lastName}`)}>
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                <path d="M3 6h18" />
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                <line x1="9" y1="11" x2="9" y2="17" />
                                                                <line x1="12" y1="11" x2="12" y2="17" />
                                                                <line x1="15" y1="11" x2="15" y2="17" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                ) : user.isSuspended ? (
                                                    <button className="dir-reactivate-btn" onClick={() => toggleUserStatus(user._id, true, 'suspend')}>
                                                        Reactivate
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button className="icon-action" title="View details" onClick={() => setSelectedUserDir(user)}>👁</button>
                                                        <button className="icon-action" title="Suspend user" onClick={() => toggleUserStatus(user._id, false, 'suspend')}>⊘</button>
                                                        <button className="dir-edit-btn" onClick={() => { setSelectedUserDir(user); setIsEditingUser(true); setEditUserData({ ...user }); }}>Edit</button>
                                                         <button className="icon-action chat" title="Chat with user" onClick={() => handleStartChat(user)}>💬</button>
                                                         <button className="icon-action delete" title="Delete user" onClick={() => handleDeleteUser(user._id, `${user.firstName} ${user.lastName}`)}>
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                                <path d="M3 6h18" />
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                <line x1="9" y1="11" x2="9" y2="17" />
                                                                <line x1="12" y1="11" x2="12" y2="17" />
                                                                <line x1="15" y1="11" x2="15" y2="17" />
                                                            </svg>
                                                        </button>
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
                            Showing {paginatedUsers.length === 0 ? 0 : `${startIndex + 1}-${Math.min(endIndex, filteredUsers.length)}`} of {filteredUsers.length} users
                        </span>
                        {renderPaginationButtons()}
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
                                                {selectedUserDir.isRegistered && (
                                                    <>
                                                        <button className="action-btn chat" onClick={() => { handleStartChat(selectedUserDir); setSelectedUserDir(null); setActiveTab('messages'); }}>
                                                            💬 Message User
                                                        </button>

                                                        {!selectedUserDir.isSuspended ? (
                                                            <button className="action-btn suspend" onClick={() => { toggleUserStatus(selectedUserDir._id, false, 'suspend'); setSelectedUserDir(null); }}>
                                                                ⊘ Suspend Account
                                                            </button>
                                                        ) : (
                                                            <button className="action-btn reactivate" onClick={() => { toggleUserStatus(selectedUserDir._id, true, 'suspend'); setSelectedUserDir(null); }}>
                                                                ⚡ Reactivate
                                                            </button>
                                                        )}

                                                        {selectedUserDir.accountStatus === 'expired' ? (
                                                            <button className="action-btn verify" onClick={() => { toggleUserStatus(selectedUserDir._id, false, 'expiry'); setSelectedUserDir(null); }}>
                                                                ⚡ Reactivate Account
                                                            </button>
                                                        ) : (
                                                            <button className="action-btn suspend" onClick={() => { toggleUserStatus(selectedUserDir._id, true, 'expiry'); setSelectedUserDir(null); }}>
                                                                ⏰ Expire Account
                                                            </button>
                                                        )}
                                                    </>
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
                                                <>
                                                    {selectedUserDir.isRegistered ? (
                                                        <span className="status-pill verified">Registered</span>
                                                    ) : (
                                                        <span className="status-pill pending">Unregistered</span>
                                                    )}
                                                    {selectedUserDir.accountStatus === 'expired' ? (
                                                        <span className="status-pill expired">Expired</span>
                                                    ) : (
                                                        <span className="status-pill active">Active</span>
                                                    )}
                                                    {selectedUserDir.isSuspended && (
                                                        <span className="status-pill suspended">Suspended</span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="user-details-scrollable">
                                        <div className="user-details-grid">
                                            <div className="detail-item">
                                                <label>Email Address</label>
                                                <p>{selectedUserDir.email}</p>
                                            </div>
                                            {(!isEditingUser || editUserData.isRegistered) && (
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
                                            )}
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
                                            {(!isEditingUser || editUserData.isRegistered) && (
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
                                            )}
                                            <div className="detail-item">
                                                <label>Gender</label>
                                                {isEditingUser ? (
                                                    <select 
                                                        className="edit-select" 
                                                        name="gender" 
                                                        value={editUserData.gender || ''} 
                                                        onChange={handleEditChange}
                                                    >
                                                        <option value="">Select Gender</option>
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                ) : (
                                                    <p>{selectedUserDir.gender || 'Not Specified'}</p>
                                                )}
                                            </div>
                                            <div className="detail-item">
                                                <label>Joining Date</label>
                                                <p>{getJoiningDate(selectedUserDir)}</p>
                                            </div>
                                            {(selectedUserDir.role === 'student' || (isEditingUser && editUserData.role === 'student')) && (
                                                <>
                                                    <div className="detail-item">
                                                        <label>Graduation Year</label>
                                                        {isEditingUser ? (
                                                            <input 
                                                                type="number"
                                                                className="edit-input" 
                                                                name="graduationYear" 
                                                                value={editUserData.graduationYear || ''} 
                                                                onChange={handleEditChange} 
                                                                min={new Date().getFullYear() - 5}
                                                                max={new Date().getFullYear() + 10}
                                                                onWheel={(e) => e.target.blur()}
                                                            />
                                                        ) : (
                                                            <p>{selectedUserDir.graduationYear || 'N/A'}</p>
                                                        )}
                                                    </div>
                                                    <div className="detail-item">
                                                        <label>Access Valid Until</label>
                                                        <p>
                                                            {selectedUserDir.accountExpiryDate 
                                                                ? formatExpiryDate(selectedUserDir.accountExpiryDate) 
                                                                : (selectedUserDir.graduationYear ? `31 July ${selectedUserDir.graduationYear}` : 'Not Registered')}
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                            {(!isEditingUser || editUserData.isRegistered) && (
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
                                            )}
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

                {showAddUserModal && (
                    <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
                        <div className="add-user-modal-card" onClick={e => e.stopPropagation()}>
                            <button className="modal-close-btn" onClick={() => setShowAddUserModal(false)}>✕</button>
                            <div className="add-user-modal-content">
                                <h2 className="add-user-modal-title">Add New User</h2>
                                <p className="add-user-modal-subtitle">Enter the user's campus details to grant them access to the marketplace.</p>
                                <form className="add-user-form" onSubmit={handleAddUserSubmit}>
                                    <div className="add-user-form-row">
                                        <div className="add-user-form-group">
                                            <label className="add-user-label">FIRST NAME</label>
                                            <input 
                                                className="add-user-input" 
                                                name="firstName" 
                                                value={newUserData.firstName} 
                                                onChange={e => setNewUserData({ ...newUserData, firstName: e.target.value })} 
                                                required 
                                            />
                                        </div>
                                        <div className="add-user-form-group">
                                            <label className="add-user-label">LAST NAME</label>
                                            <input 
                                                className="add-user-input" 
                                                name="lastName" 
                                                value={newUserData.lastName} 
                                                onChange={e => setNewUserData({ ...newUserData, lastName: e.target.value })} 
                                                required 
                                            />
                                        </div>
                                    </div>

                                    <div className="add-user-form-row">
                                        <div className="add-user-form-group">
                                            <label className="add-user-label">GENDER</label>
                                            <select className="add-user-select" value={newUserData.gender} onChange={e => setNewUserData({ ...newUserData, gender: e.target.value })} required>
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="add-user-form-group">
                                            <label className="add-user-label">ROLE</label>
                                            <select className="add-user-select" name="role" value={newUserData.role} onChange={e => setNewUserData({ ...newUserData, role: e.target.value })} required>
                                                <option value="">Select Role</option>
                                                <option value="student">Student</option>
                                                <option value="staff">Staff</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="add-user-form-row">
                                        <div className="add-user-form-group full-width">
                                            <label className="add-user-label">EMAIL ADDRESS</label>
                                            <div className="add-user-icon-field">
                                                <svg className="add-user-field-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                    <polyline points="22,6 12,13 2,6"></polyline>
                                                </svg>
                                                <input 
                                                    className="add-user-input" 
                                                    name="email" 
                                                    type="email"
                                                    value={newUserData.email} 
                                                    onChange={e => setNewUserData({ ...newUserData, email: e.target.value })} 
                                                    required 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="add-user-form-row">
                                        <div className={`add-user-form-group ${newUserData.role === 'student' ? '' : 'full-width'}`}>
                                            <label className="add-user-label">COLLEGE ID</label>
                                            <div className="add-user-icon-field">
                                                <svg className="add-user-field-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                    <rect x="5" y="6" width="14" height="15" rx="2" ry="2"></rect>
                                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                                                    <line x1="9" y1="10" x2="15" y2="10"></line>
                                                    <circle cx="12" cy="14" r="1.5"></circle>
                                                    <path d="M10 18c0-1 1-1.5 2-1.5s2 .5 2 1.5"></path>
                                                </svg>
                                                <input 
                                                    className="add-user-input" 
                                                    name="collegeId" 
                                                    value={newUserData.collegeId} 
                                                    onChange={e => setNewUserData({ ...newUserData, collegeId: e.target.value })} 
                                                    required 
                                                />
                                            </div>
                                        </div>
                                        {newUserData.role === 'student' && (
                                            <div className="add-user-form-group">
                                                <label className="add-user-label">GRADUATION YEAR</label>
                                                <input 
                                                    type="number"
                                                    className="add-user-input" 
                                                    placeholder="e.g. 2027"
                                                    value={newUserData.graduationYear || ''} 
                                                    onChange={e => setNewUserData({ ...newUserData, graduationYear: e.target.value })} 
                                                    min={new Date().getFullYear() - 5}
                                                    max={new Date().getFullYear() + 10}
                                                    onWheel={(e) => e.target.blur()}
                                                    required
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="add-user-modal-footer">
                                        <button type="button" className="add-user-btn cancel" onClick={() => setShowAddUserModal(false)}>Cancel</button>
                                        <button type="submit" className="add-user-btn primary" disabled={isAddingUser}>
                                            {isAddingUser ? 'Creating User...' : 'Create User'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        ); 
    };

    const renderMarketplaceView = () => {
        // A "Live look" should only show products that users see: Status === approved/active AND not flagged
        const liveProducts = [...approvedProductsList, ...flaggedProductsList]
            .filter(product => {
                const searchLower = searchTerm.toLowerCase();
                const title = (product.title || '').toLowerCase();
                const seller = `${product.seller?.firstName || ''} ${product.seller?.lastName || ''}`.toLowerCase();
                const category = (product.category || '').toLowerCase();
                const matchesSearch = title.includes(searchLower) || seller.includes(searchLower) || category.includes(searchLower);
                
                // For "Live Look", only show what users actually see
                const isLive = (product.status === 'approved' || product.status === 'active') && !product.isFlagged;
                
                return matchesSearch && isLive;
            });

        const mktStats = [
            { label: 'Total Live Items', value: approvedProductsList.filter(p => !p.isFlagged && p.status !== 'sold').length, icon: '🌟', color: 'blue' },
            { label: 'Recently Sold', value: approvedProductsList.filter(p => p.status === 'sold').length, icon: '🤝', color: 'green' },
            { label: 'Flagged (Hidden)', value: flaggedProductsList.length, icon: '🚩', color: 'red' },
            { label: 'Available Value', value: `₹${approvedProductsList.filter(p => p.status !== 'sold').reduce((acc, p) => acc + (p.price || 0), 0).toLocaleString()}`, icon: '💰', color: 'gold' }
        ];

        return (
            <div className="tab-content marketplace-view">
                <header className="view-header">
                    <h1>Marketplace View</h1>
                    <p>Live look at how users experience the campus marketplace.</p>
                </header>

                <div className="marketplace-stats-grid">
                    {mktStats.map((stat, i) => (
                        <div key={i} className={`mkt-stat-card ${stat.color}`}>
                            <div className="stat-icon">{stat.icon}</div>
                            <div className="stat-info">
                                <span className="label">{stat.label}</span>
                                <span className="value">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="admin-products-grid">
                    {liveProducts.length === 0 ? (
                        <div className="empty-state">
                            <p>No live products currently match your search.</p>
                        </div>
                    ) : (
                        liveProducts.map(product => (
                            <div key={product._id} className="admin-product-wrapper">
                                <ProductCard
                                    product={product}
                                    isSeller={false}
                                    showContactBtn={true}
                                    isAdmin={true}
                                    variant="grid"
                                />
                            </div>
                        ))
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
            
            // Rating filtering logic
            const matchesRating = reviewRatingFilter === 'all' || review.rating === Number(reviewRatingFilter);
            
            // Flag filtering logic
            const matchesFlag = !showFlaggedOnly || review.isFlagged;
            
            return (productTitle.includes(searchLower) || userName.includes(searchLower) || comment.includes(searchLower)) && matchesTime && matchesRating && matchesFlag;
        });

        // Calculate dynamic stats
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const last30DaysReviews = allReviews.filter(r => new Date(r.createdAt) >= thirtyDaysAgo);
        const prev30DaysReviews = allReviews.filter(r => {
            const date = new Date(r.createdAt);
            return date >= sixtyDaysAgo && date < thirtyDaysAgo;
        });

        const countChange = prev30DaysReviews.length === 0 
            ? (last30DaysReviews.length > 0 ? "+100% NEW" : "NO NEW REVIEWS")
            : `${last30DaysReviews.length >= prev30DaysReviews.length ? '+' : ''}${Math.round(((last30DaysReviews.length - prev30DaysReviews.length) / prev30DaysReviews.length) * 100)}% VS PREV 30D`;

        const totalAvg = allReviews.length === 0 ? 0 : allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
        const recentAvg = last30DaysReviews.length === 0 ? totalAvg : last30DaysReviews.reduce((acc, r) => acc + r.rating, 0) / last30DaysReviews.length;
        const avgRatingTrend = last30DaysReviews.length === 0 ? "STEADY" : (recentAvg > totalAvg + 0.1 ? "IMPROVING 📈" : (recentAvg < totalAvg - 0.1 ? "DECLINING 📉" : "STEADY"));

        const flaggedCount = allReviews.filter(r => r.isFlagged).length;
        const flaggedStatus = flaggedCount > 0 ? "NEEDS ACTION" : "ALL CLEAR";

        const latestReviewDate = allReviews.length === 0 ? null : new Date(Math.max(...allReviews.map(r => new Date(r.createdAt).getTime())));
        const hoursSince = latestReviewDate ? Math.round((now - latestReviewDate) / 3600000) : null;
        const recentActivityText = hoursSince === null ? "NO DATA" : (hoursSince < 1 ? "JUST NOW" : (hoursSince < 24 ? `${hoursSince}h AGO` : `${Math.floor(hoursSince/24)}d AGO`));

        const statsData = [
            { label: 'Total Reviews', value: allReviews.length.toLocaleString(), icon: '💬', color: 'green', change: countChange },
            { label: 'Average Rating', value: totalAvg.toFixed(1), icon: '⭐', color: 'yellow', change: avgRatingTrend },
            { label: 'Flagged Reviews', value: flaggedCount, icon: '🚩', color: 'red', change: flaggedStatus },
            { label: 'Recent Activity', value: recentActivityText, icon: '⚡', color: 'blue', change: 'LIVE UPDATES' }
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
                        <button 
                            className={reviewRatingFilter === 'all' && !showFlaggedOnly ? 'active' : ''} 
                            onClick={() => { setReviewRatingFilter('all'); setShowFlaggedOnly(false); setSearchTerm(""); }}
                        >
                            All Reviews ({allReviews.length})
                        </button>
                        <button 
                            className={reviewRatingFilter === 1 ? 'active' : ''} 
                            onClick={() => setReviewRatingFilter(reviewRatingFilter === 1 ? 'all' : 1)}
                        >
                            1-Star Only
                        </button>
                        <button 
                            className={showFlaggedOnly ? 'active' : ''} 
                            onClick={() => setShowFlaggedOnly(!showFlaggedOnly)}
                        >
                            Flagged
                        </button>
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
                                                ? (review.product.images[0].startsWith('http') ? review.product.images[0] : `http://localhost:5001/${review.product.images[0].startsWith('/') ? review.product.images[0].substring(1) : review.product.images[0]}`) 
                                                : itemStandard} 
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
                                                    <span className="rev-date"> • {formatNumericDate(review.createdAt)}</span>
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
                                                        <span className="icon">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                                                <path d="M3 6h18" />
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                <line x1="9" y1="11" x2="9" y2="17" />
                                                                <line x1="12" y1="11" x2="12" y2="17" />
                                                                <line x1="15" y1="11" x2="15" y2="17" />
                                                            </svg>
                                                        </span> Confirm Removal
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
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                                    <path d="M3 6h18" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    <line x1="9" y1="11" x2="9" y2="17" />
                                                    <line x1="12" y1="11" x2="12" y2="17" />
                                                    <line x1="15" y1="11" x2="15" y2="17" />
                                                </svg>
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

    const handleAdminEmailUpdate = async (e) => {
        e.preventDefault();
        if (!adminEmailData.newEmail || !adminEmailData.currentPassword) {
            showModal({ title: 'Missing Fields', message: 'Both new email and current password are required.', type: 'alert' });
            return;
        }
        setIsUpdatingAdminEmail(true);
        try {
            const res = await axios.put('http://localhost:5001/api/auth/account-settings', {
                currentPassword: adminEmailData.currentPassword,
                newEmail: adminEmailData.newEmail
            }, { headers: { Authorization: `Bearer ${token}` } });

            showModal({ title: '✅ Email Updated', message: res.data.message, type: 'alert' });
            if (res.data.logout) {
                setTimeout(() => {
                    sessionStorage.removeItem('token');
                    window.location.href = '/login';
                }, 2000);
            }
        } catch (err) {
            showModal({ title: 'Update Failed', message: err.response?.data?.message || 'Error updating email.', type: 'alert' });
        } finally {
            setIsUpdatingAdminEmail(false);
        }
    };

    const handleAdminPasswordUpdate = async (e) => {
        e.preventDefault();
        if (!adminPasswordData.currentPassword || !adminPasswordData.newPassword || !adminPasswordData.confirmNewPassword) {
            showModal({ title: 'Missing Fields', message: 'All password fields are required.', type: 'alert' });
            return;
        }
        if (adminPasswordData.newPassword !== adminPasswordData.confirmNewPassword) {
            showModal({ title: 'Password Mismatch', message: 'New passwords do not match. Please try again.', type: 'alert' });
            return;
        }
        setIsUpdatingAdminPassword(true);
        try {
            const res = await axios.put('http://localhost:5001/api/auth/account-settings', {
                currentPassword: adminPasswordData.currentPassword,
                newPassword: adminPasswordData.newPassword
            }, { headers: { Authorization: `Bearer ${token}` } });

            showModal({ title: '🔒 Password Changed', message: res.data.message, type: 'alert' });
            if (res.data.logout) {
                setTimeout(() => {
                    sessionStorage.removeItem('token');
                    window.location.href = '/login';
                }, 2000);
            }
        } catch (err) {
            showModal({ title: 'Update Failed', message: err.response?.data?.message || 'Error updating password.', type: 'alert' });
        } finally {
            setIsUpdatingAdminPassword(false);
        }
    };

    const renderAdminSettings = () => {
        const q = searchTerm.toLowerCase().trim();

        // Define keyword sets for each setting section
        const emailKeywords  = ['email', 'mail', 'address', 'login', 'username', 'contact', 'notification', 'change email', 'update email'];
        const passKeywords   = ['password', 'pass', 'security', 'credentials', 'change password', 'update password', 'lock', 'secret', 'auth', 'authentication'];

        const showEmail    = !q || emailKeywords.some(k => k.includes(q) || q.includes(k.split(' ')[0]));
        const showPassword = !q || passKeywords.some(k => k.includes(q) || q.includes(k.split(' ')[0]));
        const nothingFound = q && !showEmail && !showPassword;

        return (
        <div className="tab-content settings-view">
            <header className="view-header">
                <h1>Admin Security Settings</h1>
                <p>Manage your administrator credentials. All changes require password verification and will log you out.</p>
            </header>

            {nothingFound ? (
                <div className="empty-state" style={{ marginTop: '3rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                    <h3 style={{ fontWeight: '800', color: '#1e293b' }}>No settings found for "{searchTerm}"</h3>
                    <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Try searching for <strong>email</strong>, <strong>password</strong>, or <strong>security</strong>.</p>
                </div>
            ) : (
            <div className="admin-settings-grid">
                {/* Change Email Card */}
                {showEmail && (
                <div className="admin-settings-card">
                    <div className="settings-card-header">
                        <div className="settings-card-icon blue">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                        </div>
                        <div>
                            <h3>Change Admin Email</h3>
                            <p>Update your administrator login and notification address.</p>
                        </div>
                    </div>
                    <form onSubmit={handleAdminEmailUpdate} className="settings-form">
                        <div className="settings-field">
                            <label>New Email Address <span className="domain-hint">(@banasthali.in)</span></label>
                            <input
                                type="email"
                                placeholder="Enter new admin email..."
                                value={adminEmailData.newEmail}
                                onChange={e => setAdminEmailData({ ...adminEmailData, newEmail: e.target.value })}
                                className="settings-input"
                            />
                        </div>
                        <div className="settings-field">
                            <label>Verify Current Password</label>
                            <input
                                type="password"
                                placeholder="Enter your current password to confirm..."
                                value={adminEmailData.currentPassword}
                                onChange={e => setAdminEmailData({ ...adminEmailData, currentPassword: e.target.value })}
                                className="settings-input"
                            />
                        </div>
                        <div className="settings-warning">
                            <span>⚠️</span> You will be logged out after this change.
                        </div>
                        <button type="submit" className="settings-submit-btn blue" disabled={isUpdatingAdminEmail}>
                            {isUpdatingAdminEmail ? (
                                <><span className="btn-spinner"></span> Updating Email...</>
                            ) : (
                                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> Update Admin Email</>
                            )}
                        </button>
                    </form>
                </div>
                )}

                {/* Change Password Card */}
                {showPassword && (
                <div className="admin-settings-card">
                    <div className="settings-card-header">
                        <div className="settings-card-icon red">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                        <div>
                            <h3>Change Admin Password</h3>
                            <p>Strengthen account security with a new strong password.</p>
                        </div>
                    </div>
                    <form onSubmit={handleAdminPasswordUpdate} className="settings-form">
                        <div className="settings-field">
                            <label>Current Password</label>
                            <input
                                type="password"
                                placeholder="Enter your current password..."
                                value={adminPasswordData.currentPassword}
                                onChange={e => setAdminPasswordData({ ...adminPasswordData, currentPassword: e.target.value })}
                                className="settings-input"
                            />
                        </div>
                        <div className="settings-field">
                            <label>New Password</label>
                            <input
                                type="password"
                                placeholder="Enter a strong new password..."
                                value={adminPasswordData.newPassword}
                                onChange={e => setAdminPasswordData({ ...adminPasswordData, newPassword: e.target.value })}
                                className="settings-input"
                            />
                        </div>
                        <div className="settings-field">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                placeholder="Re-enter your new password..."
                                value={adminPasswordData.confirmNewPassword}
                                onChange={e => setAdminPasswordData({ ...adminPasswordData, confirmNewPassword: e.target.value })}
                                className={`settings-input ${adminPasswordData.confirmNewPassword && adminPasswordData.newPassword !== adminPasswordData.confirmNewPassword ? 'input-error' : ''}`}
                            />
                            {adminPasswordData.confirmNewPassword && adminPasswordData.newPassword !== adminPasswordData.confirmNewPassword && (
                                <span className="field-error">Passwords do not match</span>
                            )}
                        </div>
                        <div className="settings-warning">
                            <span>⚠️</span> You will be logged out after this change.
                        </div>
                        <button type="submit" className="settings-submit-btn red" disabled={isUpdatingAdminPassword}>
                            {isUpdatingAdminPassword ? (
                                <><span className="btn-spinner"></span> Updating Password...</>
                            ) : (
                                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Update Admin Password</>
                            )}
                        </button>
                    </form>
                </div>
                )}
            </div>
            )}
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

                        <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>
                            <span className="icon">⚙️</span> SETTINGS
                        </button>
                    </nav>
                </aside>

                <main className="admin-main">
                    <header className="admin-top-nav">
                        {activeTab !== 'overview' && (
                            <div className="search-bar">
                                <span className="search-icon">🔍</span>
                                <input
                                    type="text"
                                    placeholder={
                                        activeTab === 'users' ? "Search users by name or email..." :
                                        activeTab === 'queue' ? "Search products by title, seller or category..." :
                                        activeTab === 'marketplace' ? "Search live products by title or seller..." :
                                        activeTab === 'reviews' ? "Search reviews by content or user..." :
                                        activeTab === 'settings' ? "Search settings (e.g. email, password, security...)" :
                                        "Search analytics or items..."
                                    }
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button className="search-clear-btn" onClick={() => setSearchTerm("")} title="Clear search">
                                        ✕
                                    </button>
                                )}
                            </div>
                        )}
                        <div className="nav-actions">
                            {/* Notification Bell */}
                            <button
                                className="admin-notif-bell"
                                onClick={() => navigate('/admin/notifications')}
                                title="Notifications"
                                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', position: 'relative' }}
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
        
                                {activeTab === 'settings' && renderAdminSettings()}
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
