import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem('token');
      navigate('/');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav>
      <Link to="/" className="nav-logo">
        <div className="logo-box">C</div>
        CampusKart
      </Link>

      <div className="nav-links">
        <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
          Home
        </Link>
        <Link to="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`}>
          Explore
        </Link>
        <Link to="/guidelines" className={`nav-link ${isActive('/guidelines') ? 'active' : ''}`}>
          Guidelines
        </Link>
      </div>

      <div className="nav-right">
        {token ? (
          <>
            <Link to="/want-to-sell" className="sell-btn">
              <span style={{ fontSize: '1.2rem' }}>+</span> Sell
            </Link>
            <button className="icon-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
            </button>
            <div className="profile-img-container" onClick={handleLogout} style={{ cursor: 'pointer' }}>
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                alt="Profile"
                className="profile-img"
              />
            </div>
          </>
        ) : (
          <div className="nav-auth">
            <Link to="/login" className="btn-login">
              Login
            </Link>
            <Link to="/signup" className="btn-signup">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};


export default Navbar;
