// pages/client/ProfilePage.js
import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Save, Edit2, X, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import ToastNotification from '../../components/ToastNotification';
import './ProfilePage.css';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',      // Giữ để hiển thị nhưng không cho sửa
        address: ''
    });
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = "info", duration = 3000) => {
        let safeMessage = '';
        if (typeof message === 'string') {
            safeMessage = message;
        } else if (message && typeof message === 'object') {
            safeMessage = message.message || message.error || JSON.stringify(message);
        } else {
            safeMessage = String(message || 'Thông báo');
        }

        const id = Date.now();
        setToasts(prev => [...prev, { id, message: safeMessage, type, duration }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    };

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get('/auth/me');
            if (response.data) {
                const userData = response.data;
                setUser(userData);
                setFormData({
                    fullName: userData.fullName || '',
                    email: userData.email || '',
                    phone: userData.phone || '',
                    address: userData.address || ''
                });
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
            let errorMsg = 'Không thể tải thông tin tài khoản';
            if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            }
            showToast(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!formData.fullName.trim()) {
            showToast('Vui lòng nhập họ và tên', 'error');
            return;
        }
        if (!formData.email.trim()) {
            showToast('Vui lòng nhập email', 'error');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            showToast('Email không hợp lệ', 'error');
            return;
        }

        try {
            // KHÔNG gửi phone lên server
            const response = await axiosClient.put('/auth/update-profile', {
                fullName: formData.fullName,
                email: formData.email,
                address: formData.address
                // phone: không gửi
            });

            if (response.data) {
                showToast('Cập nhật thông tin thành công!', 'success');
                setEditing(false);
                fetchUserInfo();
                // Cập nhật localStorage
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                storedUser.fullName = formData.fullName;
                storedUser.email = formData.email;
                localStorage.setItem('user', JSON.stringify(storedUser));
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            let errorMsg = 'Cập nhật thất bại';
            if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            }
            showToast(errorMsg, 'error');
        }
    };

    const handleChangePassword = async () => {
        if (!passwordData.oldPassword) {
            showToast('Vui lòng nhập mật khẩu hiện tại', 'error');
            return;
        }
        if (!passwordData.newPassword) {
            showToast('Vui lòng nhập mật khẩu mới', 'error');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showToast('Mật khẩu xác nhận không khớp', 'error');
            return;
        }

        try {
            const response = await axiosClient.put('/auth/change-password', {
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            });

            if (response.data) {
                showToast('Đổi mật khẩu thành công!', 'success');
                setShowChangePassword(false);
                setPasswordData({
                    oldPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            }
        } catch (error) {
            console.error('Error changing password:', error);
            let errorMsg = 'Đổi mật khẩu thất bại';
            if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            }
            showToast(errorMsg, 'error');
        }
    };

    if (loading) {
        return (
            <div className="profile-page">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Đang tải thông tin...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-header">
                    <h1>Thông tin tài khoản</h1>
                    <p>Quản lý thông tin cá nhân của bạn</p>
                </div>

                <div className="profile-content">
                    {/* Avatar */}
                    <div className="profile-avatar">
                        <div className="avatar-circle">
                            {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : formData.phone?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <h3>{formData.fullName || formData.phone}</h3>
                        <p className="user-role">
                            {user?.role === 'ADMIN' ? 'Quản trị viên' :
                                user?.role === 'STAFF' ? 'Nhân viên' : 'Khách hàng'}
                        </p>
                    </div>

                    {/* Form */}
                    <div className="profile-form">
                        <div className="form-header">
                            <h2>Thông tin cá nhân</h2>
                            <div className="header-buttons">
                                {!editing && !showChangePassword && (
                                    <>
                                        <button onClick={() => setShowChangePassword(true)} className="change-password-btn">
                                            <Lock size={16} /> Đổi mật khẩu
                                        </button>
                                        <button onClick={() => setEditing(true)} className="edit-btn">
                                            <Edit2 size={16} /> Chỉnh sửa
                                        </button>
                                    </>
                                )}
                                {editing && (
                                    <div className="form-actions">
                                        <button onClick={() => setEditing(false)} className="cancel-btn">
                                            <X size={16} /> Hủy
                                        </button>
                                        <button onClick={handleUpdate} className="save-btn">
                                            <Save size={16} /> Lưu thay đổi
                                        </button>
                                    </div>
                                )}
                                {showChangePassword && (
                                    <div className="form-actions">
                                        <button onClick={() => {
                                            setShowChangePassword(false);
                                            setPasswordData({
                                                oldPassword: '',
                                                newPassword: '',
                                                confirmPassword: ''
                                            });
                                        }} className="cancel-btn">
                                            <X size={16} /> Hủy
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {!showChangePassword ? (
                            <div className="form-grid">
                                <div className="form-group">
                                    <label><User size={14} /> Họ và tên</label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            placeholder="Nhập họ và tên"
                                        />
                                    ) : (
                                        <div className="form-value">{formData.fullName || '---'}</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label><Phone size={14} /> Số điện thoại</label>
                                    {/* Số điện thoại luôn ở dạng text, không cho sửa */}
                                    <div className="form-value disabled">{formData.phone || '---'}</div>
                                </div>
                                <div className="form-group">
                                    <label><Mail size={14} /> Email</label>
                                    {editing ? (
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="Nhập email"
                                        />
                                    ) : (
                                        <div className="form-value">{formData.email || '---'}</div>
                                    )}
                                </div>
                                <div className="form-group full-width">
                                    <label><MapPin size={14} /> Địa chỉ</label>
                                    {editing ? (
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            rows={3}
                                            placeholder="Nhập địa chỉ"
                                        />
                                    ) : (
                                        <div className="form-value">{formData.address || '---'}</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="change-password-form">
                                <div className="form-group">
                                    <label>Mật khẩu hiện tại</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showOldPassword ? "text" : "password"}
                                            value={passwordData.oldPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                            placeholder="Nhập mật khẩu hiện tại"
                                        />
                                        <button
                                            type="button"
                                            className="toggle-password"
                                            onClick={() => setShowOldPassword(!showOldPassword)}
                                        >
                                            {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Mật khẩu mới</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                                        />
                                        <button
                                            type="button"
                                            className="toggle-password"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Xác nhận mật khẩu mới</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            placeholder="Xác nhận mật khẩu mới"
                                        />
                                        <button
                                            type="button"
                                            className="toggle-password"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="change-password-actions">
                                    <button onClick={handleChangePassword} className="submit-password-btn">
                                        <CheckCircle size={16} /> Xác nhận đổi mật khẩu
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Toast */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <ToastNotification
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    />
                ))}
            </div>
        </div>
    );
};

export default ProfilePage;