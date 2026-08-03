import React, { createContext, useState, useContext, useCallback } from 'react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'alert', // 'alert' or 'confirm'
        onConfirm: null,
        onCancel: null,
    });

    const closeModal = useCallback(() => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    }, []);

    const showModal = useCallback(({ title, message, type = 'alert', onConfirm, onCancel }) => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            type,
            onConfirm: (data) => {
                if (onConfirm) onConfirm(data);
                closeModal();
            },
            onCancel: () => {
                if (onCancel) onCancel();
                closeModal();
            },
        });
    }, [closeModal]);

    return (
        <ModalContext.Provider value={{ showModal, closeModal, modalConfig }}>
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};
