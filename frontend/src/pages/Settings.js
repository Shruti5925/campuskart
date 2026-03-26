import React from 'react';
import Sidebar from '../Components/Sidebar';
import Footer from '../Components/Footer';
import '../styles/Dashboard.css';

const Settings = () => {
    return (
        <div className="dashboard-page-container">
            <div className="dashboard-layout">
                <Sidebar />
                <main className="dashboard-main">
                    <header className="dashboard-header">
                        <div className="welcome-section">
                            <h1 style={{ fontWeight: '950' }}>Settings</h1>
                            <p style={{ fontWeight: '700' }}>Manage your account preferences and security.</p>
                        </div>
                    </header>
                    <div className="dashboard-content">
                        <div className="section-card">
                            <h3 style={{ fontWeight: '850', marginBottom: '1.5rem' }}>Account Settings</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                                    <h4 style={{ fontWeight: '800', marginBottom: '0.5rem' }}>Email Notifications</h4>
                                    <p style={{ color: '#64748b', fontWeight: '600' }}>Receive updates about your listings and messages.</p>
                                </div>
                                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                                    <h4 style={{ fontWeight: '800', marginBottom: '0.5rem' }}>Privacy</h4>
                                    <p style={{ color: '#64748b', fontWeight: '600' }}>Control who can see your profile and contact information.</p>
                                </div>
                                <div>
                                    <h4 style={{ fontWeight: '800', marginBottom: '0.5rem', color: '#ef4444' }}>Deactivate Account</h4>
                                    <p style={{ color: '#64748b', fontWeight: '600' }}>Permanently remove your account and all listings.</p>
                                </div>
                                <button className="continue-btn" style={{ maxWidth: '200px', marginTop: '1rem' }}>Save Preferences</button>
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
