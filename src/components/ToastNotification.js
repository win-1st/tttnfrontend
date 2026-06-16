// components/ToastNotification.js
import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import './ToastNotification.css';

const ToastNotification = ({ message, type = "info", duration = 3000, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onClose) onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!isVisible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} />;
            case 'error':
                return <AlertCircle size={20} />;
            case 'warning':
                return <AlertTriangle size={20} />;
            default:
                return <Info size={20} />;
        }
    };

    // Đảm bảo message là string an toàn để render
    const getSafeMessage = () => {
        if (typeof message === 'string') {
            return message;
        }
        if (message && typeof message === 'object') {
            return message.message || message.error || JSON.stringify(message);
        }
        return String(message || 'Thông báo');
    };

    const getClassNames = () => {
        return `toast-notification toast-${type}`;
    };

    return (
        <div className={getClassNames()}>
            <div className="toast-icon">{getIcon()}</div>
            <div className="toast-message">{getSafeMessage()}</div>
            <button className="toast-close" onClick={() => {
                setIsVisible(false);
                if (onClose) onClose();
            }}>
                <X size={16} />
            </button>
        </div>
    );
};

export default ToastNotification;