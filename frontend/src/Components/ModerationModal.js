import React, { useState } from 'react';
import '../styles/AdminDashboard.css'; // Reusing established admin styles

const ModerationModal = ({ isOpen, onClose, report, onConfirm }) => {
    const [adminNotes, setAdminNotes] = useState('');
    const [action, setAction] = useState('');

    if (!isOpen || !report) return null;

    const renderTargetPreview = () => {
        const target = report.targetId;
        if (!target) return <div className="preview-placeholder">Target content no longer available.</div>;

        switch (report.targetType) {
            case 'product':
                return (
                    <div className="mod-preview-card product">
                        <img 
                            src={target.images?.[0]?.startsWith('http') ? target.images[0] : `http://localhost:5001/${target.images?.[0]}`} 
                            alt="" 
                            className="preview-img"
                        />
                        <div className="preview-info">
                            <h4>{target.title}</h4>
                            <p className="price">₹{target.price}</p>
                            <p className="seller">Seller: {target.seller?.firstName} {target.seller?.lastName}</p>
                        </div>
                    </div>
                );
            case 'user':
                return (
                    <div className="mod-preview-card user">
                        <div className="preview-avatar">
                            {target.firstName?.charAt(0)}{target.lastName?.charAt(0)}
                        </div>
                        <div className="preview-info">
                            <h4>{target.firstName} {target.lastName}</h4>
                            <p className="email">{target.email}</p>
                            <p className="role">{target.role?.toUpperCase()}</p>
                        </div>
                    </div>
                );
            case 'review':
                return (
                    <div className="mod-preview-card review">
                        <div className="preview-rating">{'⭐'.repeat(target.rating)}</div>
                        <p className="comment">"{target.comment}"</p>
                        <p className="author">By: {target.user?.firstName} {target.user?.lastName}</p>
                    </div>
                );
            default:
                return null;
        }
    };

    const handleConfirm = () => {
        if (!action) {
            alert("Please select an action to take.");
            return;
        }
        if (!adminNotes.trim()) {
            alert("Please provide a reason or notes for this resolution.");
            return;
        }
        onConfirm(action, adminNotes);
    };

    return (
        <div className="modal-overlay active" onClick={onClose}>
            <div className="modal-card moderation-modal" onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <div className="header-content">
                        <h3>Moderate Report #{report._id.toString().slice(-4)}</h3>
                        <span className={`type-badge ${report.targetType}`}>{report.targetType.toUpperCase()}</span>
                    </div>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </header>

                <div className="modal-body">
                    <section className="mod-section">
                        <label>Reported Content Preview</label>
                        {renderTargetPreview()}
                    </section>

                    <section className="mod-section">
                        <label>User's Report Reason</label>
                        <div className="user-reason-box">
                            <strong>{report.reason}</strong>
                            <p>{report.description}</p>
                        </div>
                    </section>

                    <section className="mod-section actions">
                        <label>Select Moderation Action</label>
                        <div className="action-options">
                            <button 
                                className={`mod-action-btn dismiss ${action === 'dismiss' ? 'active' : ''}`}
                                onClick={() => setAction('dismiss')}
                            >
                                <span className="icon">⚪</span>
                                <div className="text">
                                    <strong>Dismiss Report</strong>
                                    <span>False positive or irrelevant</span>
                                </div>
                            </button>

                            {report.targetType === 'product' && (
                                <button 
                                    className={`mod-action-btn flag ${action === 'flag_product' ? 'active' : ''}`}
                                    onClick={() => setAction('flag_product')}
                                >
                                    <span className="icon">🚩</span>
                                    <div className="text">
                                        <strong>Flag & Hide Product</strong>
                                        <span>Remove from marketplace</span>
                                    </div>
                                </button>
                            )}

                            {report.targetType === 'user' && (
                                <button 
                                    className={`mod-action-btn suspend ${action === 'suspend_user' ? 'active' : ''}`}
                                    onClick={() => setAction('suspend_user')}
                                >
                                    <span className="icon">🚫</span>
                                    <div className="text">
                                        <strong>Suspend Account</strong>
                                        <span>Restrict all access</span>
                                    </div>
                                </button>
                            )}

                            {report.targetType === 'review' && (
                                <button 
                                    className={`mod-action-btn delete ${action === 'delete_review' ? 'active' : ''}`}
                                    onClick={() => setAction('delete_review')}
                                >
                                    <span className="icon">🗑️</span>
                                    <div className="text">
                                        <strong>Delete Review</strong>
                                        <span>Permanent removal</span>
                                    </div>
                                </button>
                            )}

                            <button 
                                className={`mod-action-btn warning ${action === 'resolve' ? 'active' : ''}`}
                                onClick={() => setAction('resolve')}
                            >
                                <span className="icon">⚠️</span>
                                <div className="text">
                                    <strong>Resolve w/ Warning</strong>
                                    <span>No data change, just notify</span>
                                </div>
                            </button>
                        </div>
                    </section>

                    <section className="mod-section">
                        <label>Moderator Notes (Sent to Users)</label>
                        <textarea 
                            placeholder="Explain the reason for this action..."
                            value={adminNotes}
                            onChange={e => setAdminNotes(e.target.value)}
                        />
                    </section>
                </div>

                <footer className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="btn-execute" onClick={handleConfirm}>Execute Moderation</button>
                </footer>
            </div>
        </div>
    );
};

export default ModerationModal;
