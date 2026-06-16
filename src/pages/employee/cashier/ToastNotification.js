import React from 'react';

const ToastNotification = ({ message, type = 'info', onClose }) => {
    const getIcon = () => {
        switch (type) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            default: return '🔔';
        }
    };

    const getBackgroundColor = () => {
        switch (type) {
            case 'success': return '#10b981';
            case 'warning': return '#f59e0b';
            case 'error': return '#ef4444';
            default: return '#3b82f6';
        }
    };

    return (
        <div
            style={{
                padding: '12px 16px',
                borderRadius: '8px',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minWidth: '280px',
                maxWidth: '400px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                backgroundColor: getBackgroundColor(),
                pointerEvents: 'auto'
            }}
        >
            <div style={{ fontSize: '20px' }}>{getIcon()}</div>
            <div style={{ flex: 1, fontSize: '14px', whiteSpace: 'pre-line' }}>{message}</div>
            <button
                onClick={onClose}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '4px'
                }}
            >
                ✕
            </button>
        </div>
    );
};

export default ToastNotification;