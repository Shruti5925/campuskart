import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../Components/Sidebar";
import "../styles/Dashboard.css";

function Profile() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState("Aneka");

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
            setSelectedAvatar(res.data.avatar || "Aneka");
            setLoading(false);

        } catch (err) {
            console.error("Error fetching profile:", err);
            setLoading(false);
        }
    };

    const avatarOptions = [
        "Aneka", "Felix", "Midnight", "Luna", "Leo", "Bella", "Charlie", "Milo"
    ];

    if (loading) return <div className="loading">Loading Profile...</div>;
    if (!userData) return <div className="error">User not found</div>;

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

                    <div
                        className="section-card profile-info-card"
                        style={{
                            marginTop: "2rem",
                            display: "flex",
                            gap: "2rem",
                            alignItems: "flex-start"
                        }}
                    >
                        {/* PROFILE PHOTO SECTION */}
                        <div style={{ textAlign: "center" }}>
                            <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAvatar}`}
                                alt="avatar"
                                style={{
                                    width: "120px",
                                    height: "120px",
                                    borderRadius: "50%",
                                    background: "#f0fdf4",
                                    border: "5px solid white",
                                    boxShadow: "var(--shadow-md)"
                                }}
                            />

                            <button
                                className="edit-btn"
                                style={{ marginTop: "1rem", width: "100%" }}
                                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                            >
                                Change Photo
                            </button>

                            {/* AVATAR OPTIONS */}
                            {showAvatarPicker && (
                                <div
                                    style={{
                                        marginTop: "1rem",
                                        display: "grid",
                                        gridTemplateColumns: "repeat(4, 1fr)",
                                        gap: "10px"
                                    }}
                                >
                                    {avatarOptions.map((seed) => (
                                        <img
                                            key={seed}
                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                                            alt={seed}
                                            style={{
                                                width: "60px",
                                                height: "60px",
                                                borderRadius: "50%",
                                                cursor: "pointer",
                                                border:
                                                    selectedAvatar === seed
                                                        ? "3px solid #22c55e"
                                                        : "2px solid #ddd"
                                            }}
                                            onClick={async () => {
                                                try {
                                                    await axios.put(
                                                        "http://localhost:5001/api/auth/update-avatar",
                                                        { avatar: seed },
                                                        {
                                                            headers: {
                                                                Authorization: `Bearer ${token}`
                                                            }
                                                        }
                                                    );

                                                    setSelectedAvatar(seed);
                                                    setShowAvatarPicker(false);

                                                    // ✅ Dispatch avatarUpdated event
                                                    window.dispatchEvent(new Event("avatarUpdated"));

                                                } catch (error) {
                                                    console.error("Error updating avatar:", error);
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* PROFILE DETAILS */}
                        <div
                            style={{
                                flex: 1,
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "1.5rem"
                            }}
                        >
                            <div>
                                <label>Full Name</label>
                                <p>{userData.firstName} {userData.middleName} {userData.lastName}</p>
                            </div>

                            <div>
                                <label>Email</label>
                                <p>{userData.email}</p>
                            </div>

                            <div>
                                <label>College ID</label>
                                <p>{userData.collegeId}</p>
                            </div>

                            <div>
                                <label>Department</label>
                                <p>{userData.department}</p>
                            </div>

                            <div>
                                <label>Gender</label>
                                <p>{userData.gender}</p>
                            </div>

                            <div>
                                <label>Mobile</label>
                                <p>{userData.mobileNumber}</p>
                            </div>

                            <div style={{ gridColumn: "span 2" }}>
                                <label>Address</label>
                                <p>{userData.address}</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
                        <button className="continue-btn">Edit Profile</button>
                        <button className="back-btn" onClick={() => navigate("/dashboard")}>
                            Go to Dashboard
                        </button>
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