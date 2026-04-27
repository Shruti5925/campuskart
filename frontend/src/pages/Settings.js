import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useModal } from '../context/ModalContext';
import Sidebar from '../Components/Sidebar';
import Footer from '../Components/Footer';
import '../styles/Dashboard.css';

const Settings = () => {
    const navigate = useNavigate();
    const { showModal } = useModal();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const token = sessionStorage.getItem('token');

    // Password change state
    const [passData, setPassData] = useState({
        securityAnswer: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passStep, setPassStep] = useState(0); // 0: Initial, 1: Security Q, 2: New Pass
    const [verifyingAnswer, setVerifyingAnswer] = useState(false);
    const [updatingPass, setUpdatingPass] = useState(false);
    const [isSecurityExpanded, setIsSecurityExpanded] = useState(false);

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchUserData();
    }, [token]);

    const fetchUserData = async () => {
        try {
            const res = await axios.get('http://localhost:5001/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserData(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching settings data:", err);
            setLoading(false);
        }
    };

    const handleVerifyAnswer = async (e) => {
        e.preventDefault();
        setVerifyingAnswer(true);
        try {
            await axios.post('http://localhost:5001/api/auth/verify-security-answer', {
                securityAnswer: passData.securityAnswer
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPassStep(2);
        } catch (err) {
            showModal({
                title: 'Verification Failed',
                message: err.response?.data?.message || "Incorrect security answer",
                type: 'alert'
            });
        } finally {
            setVerifyingAnswer(false);
        }
    };

    const handlePassChange = async (e) => {
        e.preventDefault();
        if (passData.newPassword !== passData.confirmPassword) {
            showModal({ title: 'Error', message: 'New passwords do not match.', type: 'alert' });
            return;
        }
        if (passData.newPassword.length < 6) {
            showModal({ title: 'Error', message: 'Password must be at least 6 characters long.', type: 'alert' });
            return;
        }

        setUpdatingPass(true);
        try {
            const res = await axios.put('http://localhost:5001/api/auth/account-settings', {
                securityAnswer: passData.securityAnswer,
                newPassword: passData.newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            showModal({
                title: 'Success',
                message: res.data.message,
                type: 'alert',
                onConfirm: () => {
                    if (res.data.logout) {
                        sessionStorage.removeItem('token');
                        navigate('/login');
                    }
                }
            });
            setPassData({ securityAnswer: '', newPassword: '', confirmPassword: '' });
            setPassStep(0);
        } catch (err) {
            showModal({
                title: 'Update Failed',
                message: err.response?.data?.message || "Failed to update password",
                type: 'alert'
            });
        } finally {
            setUpdatingPass(false);
        }
    };

    const handleDeactivate = () => {
        showModal({
            title: 'Deactivate Account?',
            message: 'WARNING: This is permanent. All your listings, messages, and profile data will be deleted forever. Do you wish to proceed?',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await axios.delete('http://localhost:5001/api/auth/me', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    sessionStorage.removeItem('token');
                    navigate('/');
                    window.location.reload();
                } catch (err) {
                    showModal({
                        title: 'Error', message: 'Failed to deactivate account.', type: 'alert'
                    });
                }
            }
        });
    };

    if (loading) return <div className="loading" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontSize: '1.2rem', fontWeight: '800', color: '#3B82F6' }}>Syncing Settings...</div>;

    const avatarUrl = userData?.profilePhoto ? `http://localhost:5001${userData.profilePhoto}` : `https://ui-avatars.com/api/?name=${userData?.firstName}+${userData?.lastName}&background=EFF6FF&color=3B82F6&bold=true`;

    return (
        <div className="dashboard-page-container" style={{ background: '#f9fafb', minHeight: '100vh' }}>
            <div className="dashboard-layout" style={{ maxWidth: '100%' }}>
                <Sidebar />
                <main className="dashboard-main">
                    <header className="dashboard-header" style={{ justifyContent: 'flex-end' }}>
                        <div className="header-actions" style={{ display: 'flex', gap: '8px' }}>
                            <Link to="/cart" className="pill-icon-btn cart-icon-btn" title="Cart">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                            </Link>
                            <Link to="/wishlist" className="pill-icon-btn wishlist-icon-btn" title="Wishlist">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                            </Link>
                        </div>
                    </header>
                    <div style={{ padding: '3rem 4rem' }}>
                        
                        {/* Title Header */}
                        <div style={{ marginBottom: '3rem' }}>
                            <h1 style={{ fontSize: '3rem', fontWeight: '950', color: '#111827', marginBottom: '0.75rem', letterSpacing: '-0.04em' }}>Settings</h1>
                            <p style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: '700' }}>
                                Manage your account preferences, security policies, and identity.
                            </p>
                        </div>

                        {/* Layout Stack (Row Wise) */}
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: '2rem'
                        }}>
                            
                            {/* Profile Editing Card */}
                            <div className="section-card" style={{ 
                                padding: '2.5rem', borderRadius: '32px', background: 'white', border: '1px solid #f1f5f9',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.03)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '3rem' }}>
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        <div style={{ width: '48px', height: '48px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.5rem', fontWeight: '950', color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Profile Editing</h3>
                                            <p style={{ color: '#64748b', fontWeight: '600', fontSize: '1rem', marginTop: '6px', lineHeight: '1.6' }}>
                                                Manage your personal identity, campus affiliations, and contact information. Keep your profile accurate to build trust within the community.
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <button 
                                            className="continue-btn" 
                                            onClick={() => navigate('/profile?edit=true')}
                                            style={{ 
                                                background: '#3B82F6', 
                                                color: 'white', 
                                                border: 'none', 
                                                borderRadius: '16px', 
                                                fontWeight: '900', 
                                                cursor: 'pointer',
                                                boxShadow: '0 6px 15px rgba(59, 130, 246, 0.25)', 
                                                fontSize: '1rem',
                                                whiteSpace: 'nowrap',
                                                width: '240px',
                                                padding: '1.1rem 0',
                                                textAlign: 'center'
                                            }}
                                        >
                                            Edit Profile
                                        </button>
                                    </div>
                                </div>

                            </div>
                            {/* Security & Password Card */}
                            <div className="section-card" style={{ 
                                padding: '2.5rem', borderRadius: '32px', background: 'white', border: '1px solid #f1f5f9',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.03)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '3rem' }}>
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        <div style={{ width: '48px', height: '48px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.5rem', fontWeight: '950', color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Security & Password</h3>
                                            <p style={{ color: '#64748b', fontWeight: '600', fontSize: '1rem', marginTop: '6px', lineHeight: '1.6' }}>
                                                Ensure your account remains protected by updating your credentials. A strong, regularly rotated password is your first line of defense.
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <button 
                                            className="continue-btn" 
                                            onClick={() => setIsSecurityExpanded(!isSecurityExpanded)}
                                            style={{ 
                                                background: '#3B82F6', 
                                                color: 'white', 
                                                border: 'none', 
                                                padding: '1.1rem 2.5rem', 
                                                borderRadius: '16px', 
                                                fontWeight: '900', 
                                                cursor: 'pointer',
                                                boxShadow: '0 6px 15px rgba(59, 130, 246, 0.25)', 
                                                fontSize: '1rem',
                                                whiteSpace: 'nowrap',
                                                width: '240px',
                                                padding: '1.1rem 0',
                                                textAlign: 'center'
                                            }}
                                        >
                                            {isSecurityExpanded ? 'Collapse' : 'Change Password'}
                                        </button>
                                    </div>
                                </div>

                                {isSecurityExpanded && (
                                    <div style={{ marginTop: '2.5rem', paddingTop: '2.5rem', borderTop: '1px solid #f1f5f9', animation: 'slideDown 0.3s ease-out' }}>
                                        <div style={{ maxWidth: '600px' }}>
                                            {passStep === 1 && (
                                                <form onSubmit={handleVerifyAnswer}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                                        <div className="input-group">
                                                            <label style={{ fontSize: '0.85rem', fontWeight: '900', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'block' }}>Q: {userData?.securityQuestion}</label>
                                                            <input 
                                                                type="text" 
                                                                placeholder="Enter your security answer"
                                                                required
                                                                autoFocus
                                                                value={passData.securityAnswer}
                                                                onChange={(e) => setPassData({...passData, securityAnswer: e.target.value})}
                                                                style={{ width: '100%', padding: '1rem 1.5rem', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '16px', fontWeight: '700', fontSize: '1.1rem' }}
                                                            />
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                                            <button 
                                                                type="submit" 
                                                                disabled={verifyingAnswer}
                                                                style={{ flex: 1, padding: '1rem', borderRadius: '16px', fontWeight: '900', background: '#3B82F6', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.1rem' }}
                                                            >
                                                                {verifyingAnswer ? 'Verifying...' : 'Verify & Continue'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </form>
                                            )}

                                            {passStep === 2 && (
                                                <form onSubmit={handlePassChange}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                                            <div className="input-group">
                                                                <label style={{ fontSize: '0.85rem', fontWeight: '900', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'block' }}>New Password</label>
                                                                <input 
                                                                    type="password" 
                                                                    required
                                                                    autoFocus
                                                                    placeholder="Min. 6 chars"
                                                                    value={passData.newPassword}
                                                                    onChange={(e) => setPassData({...passData, newPassword: e.target.value})}
                                                                    style={{ width: '100%', padding: '1rem 1.5rem', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '16px', fontWeight: '700', fontSize: '1.1rem' }}
                                                                />
                                                            </div>
                                                            <div className="input-group">
                                                                <label style={{ fontSize: '0.85rem', fontWeight: '900', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'block' }}>Confirm New Password</label>
                                                                <input 
                                                                    type="password" 
                                                                    required
                                                                    placeholder="Repeat password"
                                                                    value={passData.confirmPassword}
                                                                    onChange={(e) => setPassData({...passData, confirmPassword: e.target.value})}
                                                                    style={{ width: '100%', padding: '1rem 1.5rem', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '16px', fontWeight: '700', fontSize: '1.1rem' }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <button 
                                                            type="submit" 
                                                            disabled={updatingPass}
                                                            style={{ 
                                                                padding: '1.1rem', borderRadius: '18px', fontWeight: '950', background: '#111827', 
                                                                border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.1rem', 
                                                                boxShadow: '0 8px 25px rgba(17, 24, 39, 0.2)' 
                                                            }}
                                                        >
                                                            {updatingPass ? 'Updating...' : 'Update Password'}
                                                        </button>
                                                    </div>
                                                </form>
                                            )}

                                            {passStep === 0 && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                                    <div style={{ background: '#fefce8', border: '1px solid #fef08a', padding: '1.5rem', borderRadius: '20px', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                                        <div style={{ width: '40px', height: '40px', background: '#fef9c3', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                                        </div>
                                                        <p style={{ color: '#854d0e', fontWeight: '700', fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>
                                                            For your protection, you must verify your identity using your security question before changing your password.
                                                        </p>
                                                    </div>
                                                    <button 
                                                        onClick={() => setPassStep(1)}
                                                        style={{ width: 'max-content', padding: '1rem 2.5rem', borderRadius: '16px', background: '#3B82F6', color: 'white', border: 'none', fontWeight: '900', cursor: 'pointer' }}
                                                    >
                                                        Proceed to Verification
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* BOTTOM: Danger Zone Card (Full Space) */}
                            <div className="section-card" style={{ 
                                padding: '2.5rem', borderRadius: '32px', background: 'white', border: '1px solid #fee2e2',
                                boxShadow: '0 20px 40px rgba(239, 68, 68, 0.02)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2.5rem' }}>
                                    <div style={{ width: '44px', height: '44px', background: '#fff1f2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#dc2626', margin: 0, letterSpacing: '-0.02em' }}>Danger Zone</h3>
                                        <p style={{ color: '#64748b', fontWeight: '600', fontSize: '0.95rem', marginTop: '4px', lineHeight: '1.6', maxWidth: '650px' }}>
                                            Critical account operations that are irreversible. Use these settings to permanently remove your presence and data from the platform.
                                        </p>
                                    </div>
                                </div>
                                
                                <div style={{ 
                                    padding: '2.5rem', background: '#fcfcfc', borderRadius: '24px', border: '1px solid #f1f5f9',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '3rem'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#111827', marginBottom: '0.5rem' }}>Deactivate Account</h4>
                                        <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: '600', lineHeight: '1.7', maxWidth: '600px' }}>
                                            By deactivating your account, all your active listings, saved preferences, and profile data will be permanently removed from CampusKart. This action cannot be undone.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={handleDeactivate}
                                        style={{ 
                                            background: '#dc2626', color: 'white', border: 'none', 
                                            padding: '1.1rem 2.5rem', borderRadius: '16px', fontWeight: '900', cursor: 'pointer',
                                            boxShadow: '0 6px 15px rgba(220, 38, 38, 0.25)', fontSize: '1rem'
                                        }}
                                        onMouseOver={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                        Deactivate Account
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default Settings;
