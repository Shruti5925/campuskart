import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../Components/Sidebar";
import "../styles/Dashboard.css"; // Reuse for consistent layout

function Profile() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        fetchProfile();
    }, [token, navigate]);

    const fetchProfile = async () => {
        try {
            const res = await axios.get("http://localhost:5001/api/auth/me", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserData(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching profile:", err);
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading Profile...</div>;
    if (!userData) return <div className="error">User not found</div>;

    const avatarSeed = userData.gender === "Female" ? "Aneka" : (userData.gender === "Male" ? "Felix" : "Midnight");

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="search-pill">
                        <span className="search-icon">🔍</span>
                        <input type="text" placeholder="Search my listings..." />
                    </div>
                    <div className="header-actions">
                        <button className="header-btn">🔔</button>
                        <button className="header-btn">🌙</button>
                    </div>
                </header>

                <div className="dashboard-content">
                    <div className="welcome-section">
                        <h1>User Profile</h1>
                        <p>Manage your personal information and campus identity.</p>
                    </div>

                    <div className="section-card profile-info-card" style={{ marginTop: '2rem', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                        <div className="profile-photo-section" style={{ textAlign: 'center' }}>
                            <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                                alt="avatar"
                                style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#f0fdf4', border: '5px solid white', boxShadow: 'var(--shadow-md)' }}
                            />
                            <button className="edit-btn" style={{ marginTop: '1rem', width: '100%' }}>Change Photo</button>
                        </div>

                        <div className="profile-details-grid" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="input-group">
                                <label>Full Name</label>
                                <p className="val-text" style={{ fontSize: '1.1rem', fontWeight: '700' }}>{userData.firstName} {userData.middleName} {userData.lastName}</p>
                            </div>
                            <div className="input-group">
                                <label>Email Address</label>
                                <p className="val-text" style={{ fontSize: '1.1rem', fontWeight: '700' }}>{userData.email}</p>
                            </div>
                            <div className="input-group">
                                <label>College ID</label>
                                <p className="val-text" style={{ fontSize: '1.1rem', fontWeight: '700' }}>{userData.collegeId}</p>
                            </div>
                            <div className="input-group">
                                <label>Department</label>
                                <p className="val-text" style={{ fontSize: '1.1rem', fontWeight: '700' }}>{userData.department}</p>
                            </div>
                            <div className="input-group">
                                <label>Gender</label>
                                <p className="val-text" style={{ fontSize: '1.1rem', fontWeight: '700' }}>{userData.gender}</p>
                            </div>
                            <div className="input-group">
                                <label>Mobile Number</label>
                                <p className="val-text" style={{ fontSize: '1.1rem', fontWeight: '700' }}>{userData.mobileNumber}</p>
                            </div>
                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label>Campus Address / Hostel</label>
                                <p className="val-text" style={{ fontSize: '1.1rem', fontWeight: '700' }}>{userData.address}</p>
                            </div>
                        </div>
                    </div>

                    <div className="action-row" style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        <button className="continue-btn" style={{ maxWidth: '200px' }}>Edit Profile</button>
                        <button className="back-btn" onClick={() => navigate("/dashboard")}>Go to Dashboard</button>
                    </div>
                </div>

                <footer className="dashboard-footer">
                    <p>© 2024 Campuskart • Exclusively for Students</p>
                </footer>
            </main>
        </div>
    );
}

export default Profile;
