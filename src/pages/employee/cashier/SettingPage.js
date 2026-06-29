// pages/employee/cashier/SettingPage.js
import React, { useState, useEffect } from "react";
import {
    User, Lock, Bell, Palette, Save,
    UserRound, Phone, Mail, MapPin,
    Shield, CheckCircle, AlertCircle, X,
    Eye, EyeOff, RefreshCw, LogOut
} from "lucide-react";
import ToastNotification from "./ToastNotification";
import styles from "./SettingPage.module.css";

const SettingPage = () => {
    const [user, setUser] = useState({});
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [showPassword, setShowPassword] = useState({
        old: false,
        new: false,
        confirm: false
    });

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(userData);
    }, []);

    // Hàm hiển thị toast
    const showToast = (message, type = "info", duration = 3000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, duration }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    };

    const handleUpdateProfile = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/auth/update-profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fullName: user.fullName,
                    email: user.email,
                    address: user.address || ''
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                const updatedUser = { ...user };
                if (result.data) {
                    updatedUser.fullName = result.data.fullName || user.fullName;
                    updatedUser.email = result.data.email || user.email;
                    updatedUser.address = result.data.address || user.address;
                }
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                showToast('✅ Cập nhật thông tin thành công!', 'success');
            } else {
                showToast(result.message || '❌ Có lỗi xảy ra', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast('❌ Có lỗi xảy ra khi cập nhật', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showToast('⚠️ Mật khẩu mới không khớp', 'warning');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            showToast('⚠️ Mật khẩu mới phải có ít nhất 6 ký tự', 'warning');
            return;
        }

        if (!passwordData.oldPassword) {
            showToast('⚠️ Vui lòng nhập mật khẩu hiện tại', 'warning');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/auth/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    oldPassword: passwordData.oldPassword,
                    newPassword: passwordData.newPassword
                })
            });

            const result = await response.json();

            if (response.ok) {
                showToast('✅ Đổi mật khẩu thành công!', 'success');
                setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                showToast(result.message || '❌ Mật khẩu cũ không đúng', 'error');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            showToast('❌ Có lỗi xảy ra khi đổi mật khẩu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPassword(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const getRoleLabel = (role) => {
        const roles = {
            'ADMIN': 'Quản trị viên',
            'MANAGER': 'Quản lý',
            'STAFF': 'Nhân viên',
            'CUSTOMER': 'Khách hàng'
        };
        return roles[role] || role || 'Khách hàng';
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'ADMIN': return <Shield size={18} color="#EF4444" />;
            case 'MANAGER': return <Shield size={18} color="#8B5CF6" />;
            case 'STAFF': return <UserRound size={18} color="#3B82F6" />;
            default: return <User size={18} color="#10B981" />;
        }
    };

    return (
        <div className={styles.container}>
            {/* Toast Container */}
            <div style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxWidth: '400px',
                width: '100%'
            }}>
                {toasts.map((toast) => (
                    <ToastNotification
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        duration={toast.duration}
                        onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    />
                ))}
            </div>

            <div className={styles.header}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={24} /> Cài đặt tài khoản
                </h2>
            </div>

            <div className={styles.settingsGrid}>
                {/* Profile Card */}
                <div className={styles.settingCard}>
                    <div className={styles.cardHeader}>
                        <User size={20} color="#3B82F6" />
                        <h3>Thông tin cá nhân</h3>
                    </div>

                    <div className={styles.formGroup}>
                        <label>
                            <User size={14} style={{ marginRight: '4px' }} /> Họ tên
                        </label>
                        <input
                            type="text"
                            value={user.fullName || ''}
                            onChange={(e) => setUser({ ...user, fullName: e.target.value })}
                            className={styles.input}
                            placeholder="Nhập họ và tên"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>
                            <Phone size={14} style={{ marginRight: '4px' }} /> Số điện thoại
                        </label>
                        <input
                            type="tel"
                            value={user.phone || ''}
                            disabled
                            className={styles.inputDisabled}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                            Không thể thay đổi số điện thoại
                        </span>
                    </div>

                    <div className={styles.formGroup}>
                        <label>
                            <Mail size={14} style={{ marginRight: '4px' }} /> Email
                        </label>
                        <input
                            type="email"
                            value={user.email || ''}
                            onChange={(e) => setUser({ ...user, email: e.target.value })}
                            className={styles.input}
                            placeholder="Nhập email"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>
                            <MapPin size={14} style={{ marginRight: '4px' }} /> Địa chỉ
                        </label>
                        <input
                            type="text"
                            value={user.address || ''}
                            onChange={(e) => setUser({ ...user, address: e.target.value })}
                            className={styles.input}
                            placeholder="Nhập địa chỉ"
                        />
                    </div>

                    <button
                        onClick={handleUpdateProfile}
                        disabled={loading}
                        className={styles.saveBtn}
                    >
                        {loading ? (
                            <><RefreshCw size={16} className={styles.spin} /> Đang lưu...</>
                        ) : (
                            <><Save size={16} /> Lưu thay đổi</>
                        )}
                    </button>
                </div>

                {/* Change Password Card */}
                <div className={styles.settingCard}>
                    <div className={styles.cardHeader}>
                        <Lock size={20} color="#F59E0B" />
                        <h3>Đổi mật khẩu</h3>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Mật khẩu hiện tại</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword.old ? "text" : "password"}
                                value={passwordData.oldPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                className={styles.input}
                                placeholder="Nhập mật khẩu hiện tại"
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility('old')}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#64748b'
                                }}
                            >
                                {showPassword.old ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Mật khẩu mới</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword.new ? "text" : "password"}
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className={styles.input}
                                placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility('new')}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#64748b'
                                }}
                            >
                                {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Xác nhận mật khẩu mới</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword.confirm ? "text" : "password"}
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className={styles.input}
                                placeholder="Nhập lại mật khẩu mới"
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility('confirm')}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#64748b'
                                }}
                            >
                                {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {passwordData.newPassword && passwordData.confirmPassword &&
                        passwordData.newPassword !== passwordData.confirmPassword && (
                            <div style={{
                                fontSize: '12px',
                                color: '#EF4444',
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <AlertCircle size={14} /> Mật khẩu mới không khớp
                            </div>
                        )}

                    <button
                        onClick={handleChangePassword}
                        disabled={loading}
                        className={styles.changePasswordBtn}
                    >
                        {loading ? (
                            <><RefreshCw size={16} className={styles.spin} /> Đang xử lý...</>
                        ) : (
                            <><Lock size={16} /> Đổi mật khẩu</>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .${styles.spin} {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default SettingPage;