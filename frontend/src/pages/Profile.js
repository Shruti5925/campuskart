import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Sidebar from "../Components/Sidebar";
import "../styles/Dashboard.css"; // Reuse for consistent layout
import femaleAvatar from "../assets/female-avatar.png";
import maleAvatar from "../assets/male-avatar.png";
import itemStandard from "../assets/image.webp";

function Profile() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [updating, setUpdating] = useState(false);
    
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    // Staged photo — only saved when user clicks "Save Changes"
    const [pendingPhotoFile, setPendingPhotoFile] = useState(null);
    const [pendingPhotoPreview, setPendingPhotoPreview] = useState(null);
    const [pendingRemovePhoto, setPendingRemovePhoto] = useState(false);

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
            const [res, prodRes] = await Promise.all([
                axios.get("http://localhost:5001/api/auth/me", {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get("http://localhost:5001/api/products")
            ]);

            setUserData(res.data);
            setFormData({
                firstName: res.data.firstName || "",
                middleName: res.data.middleName || "",
                lastName: res.data.lastName || "",
                mobileNumber: res.data.mobileNumber || "",
                address: res.data.address || ""
            });

            const currentUserId = res.data._id?.toString();
            const myProducts = prodRes.data.filter(p => {
                const sellerId = p.seller?._id?.toString() || p.seller?.toString();
                return sellerId === currentUserId;
            });
            setProducts(myProducts);

            setLoading(false);
        } catch (err) {
            console.error("Error fetching profile and listings:", err);
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            // 1. Handle pending photo action first
            if (pendingPhotoFile) {
                setPhotoUploading(true);
                const fd = new FormData();
                fd.append('profilePhoto', pendingPhotoFile);
                const photoRes = await axios.post('http://localhost:5001/api/auth/avatar', fd, {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
                setUserData(prev => ({ ...prev, profilePhoto: photoRes.data.profilePhoto }));
                setPhotoUploading(false);
            } else if (pendingRemovePhoto) {
                await axios.delete('http://localhost:5001/api/auth/avatar', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserData(prev => ({ ...prev, profilePhoto: null }));
            }
            // Clear staged photo state
            if (pendingPhotoPreview) URL.revokeObjectURL(pendingPhotoPreview);
            setPendingPhotoFile(null);
            setPendingPhotoPreview(null);
            setPendingRemovePhoto(false);

            // 2. Save text fields
            const res = await axios.put("http://localhost:5001/api/auth/me", formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserData(prev => ({ ...prev, ...res.data.user }));
            setIsEditing(false);
        } catch (err) {
            console.error("Error updating profile:", err);
            alert(err.response?.data?.message || "Failed to update profile");
        } finally {
            setUpdating(false);
            setPhotoUploading(false);
        }
    };

    // Lock page scroll when photo modal is open
    useEffect(() => {
        if (photoModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [photoModalOpen]);

    // Stage photo locally — no backend call yet
    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // Revoke any previous preview URL
        if (pendingPhotoPreview) URL.revokeObjectURL(pendingPhotoPreview);
        const previewUrl = URL.createObjectURL(file);
        setPendingPhotoFile(file);
        setPendingPhotoPreview(previewUrl);
        setPendingRemovePhoto(false);
    };

    // Mark photo for removal — no backend call yet
    const handleRemovePhoto = () => {
        if (pendingPhotoPreview) URL.revokeObjectURL(pendingPhotoPreview);
        setPendingPhotoFile(null);
        setPendingPhotoPreview(null);
        setPendingRemovePhoto(true);
    };

    // Discard all pending photo changes
    const cancelPendingPhoto = () => {
        if (pendingPhotoPreview) URL.revokeObjectURL(pendingPhotoPreview);
        setPendingPhotoFile(null);
        setPendingPhotoPreview(null);
        setPendingRemovePhoto(false);
    };

    if (loading) return <div className="loading">Loading Profile...</div>;
    if (!userData) return <div className="error">User not found</div>;
    const defaultAvatar = userData.gender === 'Female' ? femaleAvatar : maleAvatar;
    // In edit mode: show pending preview if chosen, or null if removal is pending, else saved photo
    const savedPhotoSrc = userData.profilePhoto ? `http://localhost:5001${userData.profilePhoto}` : defaultAvatar;
    const avatarSrc = isEditing
        ? (pendingPhotoPreview || (pendingRemovePhoto ? defaultAvatar : savedPhotoSrc))
        : savedPhotoSrc;

    const displayedSearchProducts = searchTerm ? products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())) : products;

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="search-pill" style={{ position: 'relative' }}>
                        <span className="search-icon">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Search my listings..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                        />
                        {isSearchFocused && (
                            <div className="search-dropdown" style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '12px',
                                marginTop: '0.5rem',
                                maxHeight: '300px',
                                overflowY: 'auto',
                                zIndex: 100,
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                            }}>
                                {displayedSearchProducts.length > 0 ? (
                                    displayedSearchProducts.map(p => (
                                        <div 
                                            key={p._id} 
                                            onClick={() => navigate(`/product/${p._id}`)}
                                            style={{
                                                padding: '0.75rem 1rem',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #f3f4f6',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                        >
                                            <img src={(p.images && p.images.length > 0) ? p.images[0] : (p.image || itemStandard)} alt={p.title} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                                            <div>
                                                <p style={{ margin: 0, fontWeight: '600', fontSize: '0.9rem', color: '#111827' }}>{p.title}</p>
                                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>₹{p.price} • {p.status === 'sold' ? 'Sold' : (p.status === 'draft' ? 'Draft' : 'Active')}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                                        No product found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="header-actions">
                        <div className="header-btn notification-indicator" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'inherit' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                        </div>
                    </div>
                </header>

                <div className="dashboard-content">
                    <div className="welcome-section">
                        <h1>User Profile</h1>
                        <p>Manage your personal information and campus identity.</p>
                    </div>

                    <div className="section-card profile-info-card" style={{ marginTop: '2rem', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                        <div className="profile-photo-section" style={{ textAlign: 'center' }}>
                            <label htmlFor="profile-photo-input" style={{ cursor: isEditing ? 'pointer' : 'default', display: 'inline-block' }} title={isEditing ? 'Click to change photo' : ''}>
                                <div style={{ position: 'relative', display: 'inline-block', borderRadius: '50%' }}>
                                    <img
                                        src={avatarSrc}
                                        alt="avatar"
                                        style={{
                                            width: '150px',
                                            height: '150px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            display: 'block',
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                        }}
                                    />
                                    {isEditing && (
                                        <div style={{
                                            position: 'absolute', inset: 0, borderRadius: '50%',
                                            background: 'rgba(15, 23, 42, 0.52)',
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                            gap: '4px', backdropFilter: 'blur(1px)',
                                            cursor: 'pointer'
                                        }}>
                                            {photoUploading ? (
                                                <span style={{ fontSize: '30px' }}>⏳</span>
                                            ) : (
                                                <>
                                                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                                        <circle cx="12" cy="13" r="4"></circle>
                                                    </svg>
                                                    <span style={{ color: 'white', fontSize: '12px', fontWeight: '700', letterSpacing: '0.02em' }}>Change Photo</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {!isEditing && (
                                        <span
                                            onClick={(e) => { e.preventDefault(); setPhotoModalOpen(true); }}
                                            style={{
                                                position: 'absolute', inset: 0, borderRadius: '50%',
                                                cursor: 'zoom-in', display: 'block'
                                            }}
                                        />
                                    )}
                                </div>
                            </label>
                            <input
                                id="profile-photo-input"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handlePhotoUpload}
                                disabled={photoUploading || !isEditing}
                            />
                            {isEditing && userData.profilePhoto && (
                                <button onClick={handleRemovePhoto} style={{
                                    display: 'block', margin: '0.6rem auto 0',
                                    background: 'none', border: '1px solid #fca5a5',
                                    borderRadius: '6px', padding: '3px 12px',
                                    color: '#ef4444', fontSize: '0.75rem',
                                    cursor: 'pointer', fontWeight: '600'
                                }}>✕ Remove photo</button>
                            )}
                            {isEditing && !userData.profilePhoto && (
                                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', fontWeight: '500' }}>Click photo to upload</p>
                            )}
                            {!isEditing && (
                                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                                    {userData.profilePhoto ? 'Custom photo' : (userData.gender === 'Female' ? 'Default (Female)' : 'Default (Male)')}
                                </p>
                            )}
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleUpdateProfile} style={{ flex: 1 }}>
                                <div className="profile-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="input-group">
                                        <label>First Name</label>
                                        <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required className="auth-input" style={{ width: '100%' }} />
                                    </div>
                                    <div className="input-group">
                                        <label>Middle Name</label>
                                        <input type="text" name="middleName" value={formData.middleName} onChange={handleInputChange} className="auth-input" style={{ width: '100%' }} />
                                    </div>
                                    <div className="input-group">
                                        <label>Last Name</label>
                                        <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required className="auth-input" style={{ width: '100%' }} />
                                    </div>
                                    <div className="input-group">
                                        <label>Mobile Number</label>
                                        <input type="text" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} required pattern="\d{10}" title="Must be 10 digits" className="auth-input" style={{ width: '100%' }} />
                                    </div>
                                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                        <label>Campus Address / Hostel</label>
                                        <input type="text" name="address" value={formData.address} onChange={handleInputChange} required className="auth-input" style={{ width: '100%' }} />
                                    </div>
                                    
                                    {/* Non-editable fields shown for context */}
                                    <div className="input-group">
                                        <label>Email Address</label>
                                        <p className="val-text" style={{ fontSize: '1rem', color: '#6b7280' }}>{userData.email} <span style={{fontSize: '0.8rem'}}>(Cannot change)</span></p>
                                    </div>
                                    <div className="input-group">
                                        <label>College ID</label>
                                        <p className="val-text" style={{ fontSize: '1rem', color: '#6b7280' }}>{userData.collegeId} <span style={{fontSize: '0.8rem'}}>(Cannot change)</span></p>
                                    </div>
                                </div>
                                <div className="action-row" style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                                    <button type="submit" className="continue-btn" disabled={updating} style={{ maxWidth: '200px' }}>
                                        {updating ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button type="button" className="back-btn" onClick={() => {
                                        cancelPendingPhoto();
                                        setIsEditing(false);
                                        // Reset form to current userData
                                        setFormData({
                                            firstName: userData.firstName || "",
                                            middleName: userData.middleName || "",
                                            lastName: userData.lastName || "",
                                            mobileNumber: userData.mobileNumber || "",
                                            address: userData.address || ""
                                        });
                                    }}>Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <div style={{ flex: 1 }}>
                                <div className="profile-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
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
                                <div className="action-row" style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                                    <button className="continue-btn" onClick={() => setIsEditing(true)} style={{ maxWidth: '200px' }}>Edit Profile</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <footer className="dashboard-footer">
                    <p>© 2026 Campuskart • Exclusively for Students</p>
                </footer>
            </main>

            {/* Photo Lightbox Modal */}
            {photoModalOpen && (
                <div
                    onClick={() => setPhotoModalOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0, 0, 0, 0.65)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'fadeIn 0.2s ease'
                    }}
                >
                    {/* Close button */}
                    <button
                        onClick={() => setPhotoModalOpen(false)}
                        style={{
                            position: 'absolute', top: '24px', right: '28px',
                            background: 'rgba(255,255,255,0.15)', border: 'none',
                            color: 'white', fontSize: '1.5rem', width: '40px', height: '40px',
                            borderRadius: '50%', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(4px)'
                        }}
                    >✕</button>

                    {/* Large photo — stop click propagation so image click doesn't close */}
                    <img
                        src={avatarSrc}
                        alt="Profile"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: '520px', maxHeight: '520px',
                            width: '90vmin', height: '90vmin',
                            borderRadius: '50%', objectFit: 'cover',
                            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
                            animation: 'scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)'
                        }}
                    />
                </div>
            )}
        </div>
    );
}

export default Profile;
