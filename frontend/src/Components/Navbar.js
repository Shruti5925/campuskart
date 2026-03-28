import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useModal } from '../context/ModalContext';
import axios from 'axios';
import socket, { connectSocket, disconnectSocket } from '../socket';
import '../styles/Navbar.css';
import femaleAvatar from '../assets/female-avatar.png';
import maleAvatar from '../assets/male-avatar.png';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = sessionStorage.getItem('token');
  const [userData, setUserData] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const { showModal } = useModal();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(res.data);
        sessionStorage.setItem('isSuspended', res.data.isSuspended);
        sessionStorage.setItem('isVerified', res.data.isVerified);
        
        // Connect and register socket for real-time notifications
        if (res.data._id) {
            connectSocket(res.data._id);
        }

        if (res.data.cart) {
          const totalQty = res.data.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
          setCartCount(totalQty);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        if (err.response?.status === 401) {
          sessionStorage.removeItem('token');
          setUserData(null);
        }
      }
    };

    const fetchUnreadCount = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const unread = res.data.filter(n => !n.isRead).length;
        setNotifCount(unread);
      } catch (err) {
        console.error("Error fetching unread count:", err);
      }
    };

    if (token) {
      fetchUserData();
      fetchUnreadCount();
    } else {
      setUserData(null);
      setCartCount(0);
      setNotifCount(0);
    }
  }, [token]);

  // Handle cart updates from other components
  useEffect(() => {
    const handleCartUpdate = () => {
      const fetchCart = async () => {
        try {
          const res = await axios.get('http://localhost:5001/api/auth/cart', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const totalQty = res.data.reduce((sum, item) => sum + (item.quantity || 1), 0);
          setCartCount(totalQty);
        } catch (err) {
          console.error("Error fetching cart count:", err);
        }
      };
      if (token) fetchCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    
    // Notification socket listener
    if (socket) {
      socket.on('new_notification', (notification) => {
        setNotifCount(prev => prev + 1);
        
        // Show high-priority modal for admin alerts
        if (['suspension', 'approval', 'rejection'].includes(notification.type)) {
            showModal({
                title: notification.title,
                message: notification.message,
                type: 'alert'
            });
        }
      });
    }

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      if (socket) socket.off('new_notification');
    };
  }, [token]);



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.profile-wrapper')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handleLogout = () => {
    showModal({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      type: 'confirm',
      onConfirm: () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('isSuspended');
        disconnectSocket();
        setUserData(null);
        setShowDropdown(false);
        navigate('/');
      }
    });
  };

  const isActive = (path) => location.pathname === path;
  const getProfileIcon = () => {
    if (userData?.profilePhoto) return `http://localhost:5001${userData.profilePhoto}`;
    if (!userData || !userData.gender) return maleAvatar;
    if (userData.gender === "Female") return femaleAvatar;
    return maleAvatar;
  };

  return (
    <>
      {userData?.isSuspended && (
        <div className="suspension-banner">
          <span className="warning-icon">⚠️</span>
          <span className="suspension-text">
            <strong>Your account has been suspended by the administrator.</strong> 
            You can still browse, but your ability to sell items and interact with the marketplace is currently restricted.
          </span>
        </div>
      )}
      {userData && userData.role !== 'admin' && !userData.isVerified && (
        <div className="approval-banner">
          <span className="info-icon">⏳</span>
          <span className="approval-text">
            <strong>Your account is currently under approval.</strong> 
            You can browse the marketplace, but you will be able to buy, sell, and message once an administrator approves your account.
          </span>
        </div>
      )}
      <nav className="navbar-container">
      <div className="nav-pill-wrapper">
        <div className="nav-links">
          {/* Logo Section inside Pill */}
          <Link to="/" className="nav-logo-pill brand-logo-shared">
            <div className="logo-box-shared">C</div>
            <span className="brand-text-shared">CampusKart</span>
          </Link>

          {/* Navigation Links Grouped for Center */}
          <div className="nav-links-center">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              <span className="nav-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </span>
              <span className="nav-label">Home</span>
            </Link>
            <Link to="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`}>
              <span className="nav-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <span className="nav-label">Explore</span>
            </Link>
            <Link to="/guidelines" className={`nav-link ${isActive('/guidelines') ? 'active' : ''}`}>
              <span className="nav-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </span>
              <span className="nav-label">Guidelines</span>
            </Link>
          </div>

          {/* Right Section / Auth Icons inside Pill */}
          <div className="nav-pill-right">
            {token && (
              <Link to="/notifications" className={`pill-icon-btn notif-icon-btn ${isActive('/notifications') ? 'active' : ''}`} title="Notifications">
                <div className="cart-icon-container">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={isActive('/notifications') ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  {notifCount > 0 && <span className="cart-badge notif-badge">{notifCount}</span>}
                </div>
              </Link>
            )}

            {token && (
              <Link to="/wishlist" className={`pill-icon-btn wishlist-icon-btn ${isActive('/wishlist') ? 'active' : ''}`} title="Wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isActive('/wishlist') ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </Link>
            )}

            {token && (
              <Link to="/cart" className={`pill-icon-btn cart-icon-btn ${isActive('/cart') ? 'active' : ''}`} title="Interested Items">
                <div className="cart-icon-container">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </div>
              </Link>
            )}

            {token && (
              <Link 
                to={userData?.isVerified ? "/want-to-sell" : "#"} 
                className={`pill-icon-btn sell-icon-btn with-text ${!userData?.isVerified && userData?.role !== 'admin' ? 'disabled-btn' : ''}`} 
                title={userData?.isVerified ? "Sell" : "Account Pending Approval"}
                onClick={(e) => {
                  if (userData?.role !== 'admin' && !userData?.isVerified) {
                    e.preventDefault();
                    showModal({
                      title: 'Account Pending Approval',
                      message: 'Your account is currently under review. You will be able to sell items once an administrator approves your account.',
                      type: 'alert'
                    });
                  }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span className="pill-btn-label">Sell</span>
              </Link>
            )}

            {token ? (
              <div className="profile-wrapper">
                <div
                  className="profile-img-container"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <img
                    src={getProfileIcon()}
                    alt="Profile"
                    className="profile-img-pill"
                  />
                </div>

                {showDropdown && (
                  <div className="profile-dropdown">
                    <div className="dropdown-header">
                      <p className="dropdown-name">{userData?.firstName || 'User'}</p>
                      <p className="dropdown-email">{userData?.email || ''}</p>
                    </div>
                    <div className="dropdown-divider"></div>
                    <Link to="/dashboard" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                      Dashboard
                    </Link>
                    <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      My Profile
                    </Link>
                    <Link to="/settings" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                      Settings
                    </Link>
                    <button className="dropdown-item logout-item" onClick={handleLogout}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="pill-icon-btn login-icon-btn" title="Login">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
    </>
  );
};


export default Navbar;
