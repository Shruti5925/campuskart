import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';


import '../styles/Auth.css'; // Reuse premium card styles

const SellerGate = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const handleAction = (path) => {
        // If they click Login or Signup, we want them redirected to /want-to-sell after success
        navigate(path, { state: { from: { pathname: '/want-to-sell' } } });
    };

    const goToDashboard = () => {
        navigate('/want-to-sell');
    };

    return (
        <div className="home-container" style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>


            <div className="auth-container" style={{ paddingTop: '50px' }}>
                <div className="auth-card" style={{ maxWidth: '600px', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                    <h2 style={{ marginBottom: '0.5rem' }}>Ready to start selling?</h2>
                    <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                        Join thousands of students on CampusKart. Post your items and connect with buyers instantly.
                    </p>

                    {!token ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div
                                className="choice-card"
                                onClick={() => handleAction('/login')}
                                style={cardStyle}
                            >
                                <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>🔑</div>
                                <h3 style={{ margin: 0 }}>Login to Sell</h3>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Already have an account</p>
                            </div>
                            <div
                                className="choice-card"
                                onClick={() => handleAction('/signup')}
                                style={cardStyle}
                            >
                                <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>🚀</div>
                                <h3 style={{ margin: 0 }}>Join to Sell</h3>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>New to CampusKart</p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p style={{ fontWeight: '600', color: '#6366f1', marginBottom: '1.5rem' }}>
                                You are signed in and ready to go!
                            </p>
                            <button
                                className="primary-btn"
                                onClick={goToDashboard}
                                style={{ width: '100%', padding: '15px' }}
                            >
                                Go to Seller Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const cardStyle = {
    padding: '24px',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: '#ffffff'
};

// Add hover effects via JS or simple CSS in a real app, 
// but here we can define it clearly for the user.

export default SellerGate;
