import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const [userData, setUserData] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUserData();
    } else {
      setUserData(null);
    }
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

  const fetchUserData = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(res.data);
    } catch (err) {
      console.error("Error fetching user data:", err);
      // If token is invalid, clear it
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setUserData(null);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUserData(null);
    setShowDropdown(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const getProfileIcon = () => {
    if (!userData || !userData.gender) return "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix";

    if (userData.gender === "Female") return "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka";
    if (userData.gender === "Male") return "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix";
    return "https://api.dicebear.com/7.x/avataaars/svg?seed=Midnight";
  };

  return (
    <nav className="navbar-container">
      <div className="nav-pill-wrapper">
        <div className="nav-links">
          {/* Logo Section inside Pill */}
          <Link to="/" className="nav-logo-pill">
            <div className="logo-box-pill">C</div>
            <span className="nav-logo-text-pill">CampusKart</span>
          </Link>

          <div className="pill-divider"></div>

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

          <div className="pill-divider"></div>

          {/* Right Section / Auth Icons inside Pill */}
          <div className="nav-pill-right">
            {token ? (
              <>
                <Link to="/wishlist" className={`pill-icon-btn wishlist-icon-btn ${isActive('/wishlist') ? 'active' : ''}`} title="Wishlist">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={isActive('/wishlist') ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  {/* <span className="pill-btn-label">Wishlist</span> */}
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
