import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import socket, { connectSocket } from '../socket';
import '../styles/Navbar.css';
import femaleAvatar from '../assets/female-avatar.png';
import maleAvatar from '../assets/male-avatar.png';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const [userData, setUserData] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(res.data);
        if (res.data.cart) {
          const totalQty = res.data.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
          setCartCount(totalQty);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          setUserData(null);
        }
      }
    };

    if (token) {
      fetchUserData();
    } else {
      setUserData(null);
      setCartCount(0);
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
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
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
    localStorage.removeItem('token');
    setUserData(null);
    setShowDropdown(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;
  const getProfileIcon = () => {
    if (userData?.profilePhoto) return `http://localhost:5001${userData.profilePhoto}`;
    if (!userData || !userData.gender) return maleAvatar;
    if (userData.gender === "Female") return femaleAvatar;
    return maleAvatar;
  };

  return (
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
            {token ? (
              <>
                <div className="pill-icon-btn notif-icon-btn" title="Notifications">
                  <div className="cart-icon-container">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                  </div>
                </div>

                <Link to="/wishlist" className={`pill-icon-btn wishlist-icon-btn ${isActive('/wishlist') ? 'active' : ''}`} title="Wishlist">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={isActive('/wishlist') ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </Link>

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

                <Link to="/want-to-sell" className="pill-icon-btn sell-icon-btn with-text" title="Sell">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span className="pill-btn-label">Sell</span>
                </Link>

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
                      <Link to="/orders" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                        My Orders
                      </Link>
                      <button className="dropdown-item logout-item" onClick={handleLogout}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
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
  );
};


export default Navbar;
