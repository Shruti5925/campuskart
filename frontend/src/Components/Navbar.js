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

  // ✅ NEW: Listen for avatar update event
  useEffect(() => {
    const handleAvatarUpdate = () => {
      if (token) {
        fetchUserData();
      }
    };

    window.addEventListener("avatarUpdated", handleAvatarUpdate);

    return () => {
      window.removeEventListener("avatarUpdated", handleAvatarUpdate);
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

  const fetchUserData = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(res.data);
    } catch (err) {
      console.error("Error fetching user data:", err);
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

  // ✅ UPDATED: Now uses saved avatar
  const getProfileIcon = () => {
    if (userData?.avatar) {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.avatar}`;
    }

    if (userData?.gender === "Female") {
      return "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka";
    }

    if (userData?.gender === "Male") {
      return "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix";
    }

    return "https://api.dicebear.com/7.x/avataaars/svg?seed=Midnight";
  };

  return (
    <nav className="navbar-container">
      <div className="nav-pill-wrapper">
        <div className="nav-links">

          <Link to="/" className="nav-logo-pill">
            <div className="logo-box-pill">C</div>
            <span className="nav-logo-text-pill">CampusKart</span>
          </Link>

          <div className="pill-divider"></div>

          <div className="nav-links-center">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              <span className="nav-label">Home</span>
            </Link>

            <Link to="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`}>
              <span className="nav-label">Explore</span>
            </Link>

            <Link to="/guidelines" className={`nav-link ${isActive('/guidelines') ? 'active' : ''}`}>
              <span className="nav-label">Guidelines</span>
            </Link>
          </div>

          <div className="pill-divider"></div>

          <div className="nav-pill-right">
            {token ? (
              <>
                <Link to="/wishlist" className={`pill-icon-btn ${isActive('/wishlist') ? 'active' : ''}`}>
                  Wishlist
                </Link>

                <Link to="/want-to-sell" className="pill-icon-btn with-text">
                  Sell
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

                      <Link to="/dashboard" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                        Dashboard
                      </Link>

                      <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                        My Profile
                      </Link>

                      <button className="dropdown-item logout-item" onClick={handleLogout}>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link to="/login" className="pill-icon-btn">
                Login
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;