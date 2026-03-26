import React, { useState } from 'react';
import axios from 'axios';
import { useModal } from '../context/ModalContext';
import '../styles/ReportModal.css';

const ReportModal = ({ isOpen, onClose, targetId, targetType, targetName }) => {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const { showModal } = useModal();

    if (!isOpen) return null;

    const reasons = [
        "Possible Scam / Fraud",
        "Inappropriate Content",
        "Incorrect Price / Misleading Info",
        "Prohibited Item",
        "Harassment / Policy Violation",
        "Other"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason) {
            showModal({ title: 'Error', message: 'Please select a reason for reporting.', type: 'alert' });
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5001/api/reports', {
                targetType,
                targetId,
                reason,
                description
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            showModal({ 
                title: 'Report Submitted', 
                message: 'Thank you for helping keep our campus safe. Administrators will review this report shortly.', 
                type: 'alert' 
            });
            onClose();
        } catch (err) {
            console.error("Report submission error:", err);
            showModal({ 
                title: 'Error', 
                message: err.response?.data?.message || 'Failed to submit report. Please try again.', 
                type: 'alert' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="report-modal-overlay" onClick={onClose}>
            <div className="report-modal-container" onClick={(e) => e.stopPropagation()}>
                <header className="report-modal-header">
                    <h2>Report {targetType === 'product' ? 'Product' : 'User'}</h2>
                    <p className="target-name">Item: <strong>{targetName}</strong></p>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </header>

                <form className="report-modal-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Why are you reporting this?</label>
                        <div className="reason-options">
                            {reasons.map((r, idx) => (
                                <label key={idx} className={`reason-pill ${reason === r ? 'active' : ''}`}>
                                    <input 
                                        type="radio" 
                                        name="reason" 
                                        value={r} 
                                        checked={reason === r}
                                        onChange={(e) => setReason(e.target.value)}
                                    />
                                    {r}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Additional Details (Optional)</label>
                        <textarea 
                            placeholder="Please provide more context to help us understand the issue..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={500}
                        ></textarea>
                        <span className="char-count">{description.length}/500</span>
                    </div>

                    <footer className="report-modal-footer">
                        <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>Cancel</button>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;
