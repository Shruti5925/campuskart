import React from 'react';
import { useModal } from '../context/ModalContext';
import '../styles/CustomModal.css';

const CustomModal = () => {
    const { modalConfig, closeModal } = useModal();
    const { isOpen, title, message, type, onConfirm, onCancel } = modalConfig;
    const [inputValue, setInputValue] = React.useState('');

    React.useEffect(() => {
        if (isOpen) setInputValue('');
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="cms-modal-overlay" onClick={closeModal}>
            <div className="modal-container-premium" onClick={(e) => e.stopPropagation()}>
                <div className="modal-top-bar"></div>
                <div className="modal-icon-wrapper">
                    <div className="modal-icon-circle">
                        {type === 'confirm' || type === 'prompt' ? (
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        ) : (
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                        )}
                    </div>
                </div>
                <div className="modal-content-premium">
                    <h2 className="modal-title-premium">{title || (type === 'confirm' ? 'Confirm Action' : type === 'prompt' ? 'Action Required' : 'Notice')}</h2>
                    <div className="modal-divider-premium"></div>
                    <p className="modal-message-premium">{message}</p>
                    
                    {type === 'prompt' && (
                        <textarea
                            className="modal-prompt-input"
                            placeholder="Enter reason here..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '10px',
                                border: '2px solid #e2e8f0',
                                marginBottom: '20px',
                                minHeight: '100px',
                                outline: 'none',
                                fontSize: '14px'
                            }}
                        />
                    )}
                </div>
                <div className="modal-actions-premium">
                    <button 
                        className="modal-btn-premium btn-primary-premium" 
                        onClick={() => {
                            if (type === 'prompt') {
                                console.log("CUSTOM MODAL PROMPT CONFIRM WITH:", inputValue);
                                if (onConfirm) onConfirm(inputValue);
                            } else {
                                if (onConfirm) onConfirm();
                            }
                        }}
                    >
                        {type === 'confirm' || type === 'prompt' ? 'Confirm' : 'Got it, thanks!'}
                    </button>
                    {(type === 'confirm' || type === 'prompt') && (
                        <button className="modal-btn-premium btn-secondary-premium" onClick={onCancel || closeModal}>
                            Cancel
                        </button>
                    )}
                </div>
                <div className="modal-footer-premium">
                    <span>POWERED BY CAMPUSKART SECURITY</span>
                </div>
            </div>
        </div>
    );
};

export default CustomModal;
