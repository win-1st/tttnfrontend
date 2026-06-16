// pages/employee/cashier/SettingPage.js
import React, { useState, useEffect } from "react";
import { User, Lock, Bell, Palette, Save } from "lucide-react";
import styles from "./SettingPage.module.css";

const SettingPage = () => {
    const [user, setUser] = useState({});
    const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [notifications, setNotifications] = useState({ email: true, sound: true, desktop: false });
    const [theme, setTheme] = useState('light');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(userData);

        // Load theme from localStorage
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        applyTheme(savedTheme);
    }, []);

    const applyTheme = (themeName) => {
        if (themeName === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        localStorage.setItem('theme', themeName);
    };

    const handleUpdateProfile = async () => {
        setLoading(true);
        setMessage({ text: '', type: '' });
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/user/update-profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fullName: user.fullName,
                    phone: user.phone,
                    address: user.address
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setMessage({ text: result.message || 'Cập nhật thành công!', type: 'success' });
                // Update localStorage
                const updatedUser = { ...user };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            } else {
                setMessage({ text: result.message || 'Có lỗi xảy ra', type: 'error' });
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ text: 'Có lỗi xảy ra khi cập nhật', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ text: 'Mật khẩu mới không khớp', type: 'error' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage({ text: 'Mật khẩu mới phải có ít nhất 6 ký tự', type: 'error' });
            return;
        }

        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/user/change-password', {
                method: 'POST',
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

            if (response.ok && result.success) {
                setMessage({ text: result.message || 'Đổi mật khẩu thành công!', type: 'success' });
                setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            } else {
                setMessage({ text: result.message || 'Mật khẩu cũ không đúng', type: 'error' });
            }
        } catch (error) {
            console.error('Error changing password:', error);
            setMessage({ text: 'Có lỗi xảy ra khi đổi mật khẩu', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        applyTheme(newTheme);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Cài đặt</h2>
            </div>

            {message.text && (
                <div className={`${styles.message} ${styles[message.type]}`}>
                    {message.text}
                </div>
            )}

            <div className={styles.settingsGrid}>
                {/* Profile */}
                <div className={styles.settingCard}>
                    <div className={styles.cardHeader}>
                        <User size={20} />
                        <h3>Thông tin cá nhân</h3>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Họ tên</label>
                        <input
                            type="text"
                            value={user.fullName || ''}
                            onChange={(e) => setUser({ ...user, fullName: e.target.value })}
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Email</label>
                        <input
                            type="email"
                            value={user.email || ''}
                            disabled
                            className={styles.inputDisabled}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Số điện thoại</label>
                        <input
                            type="tel"
                            value={user.phone || ''}
                            onChange={(e) => setUser({ ...user, phone: e.target.value })}
                            className={styles.input}
                        />
                    </div>
                    <button
                        onClick={handleUpdateProfile}
                        disabled={loading}
                        className={styles.saveBtn}
                    >
                        <Save size={16} /> Lưu thay đổi
                    </button>
                </div>

                {/* Change Password */}
                <div className={styles.settingCard}>
                    <div className={styles.cardHeader}>
                        <Lock size={20} />
                        <h3>Đổi mật khẩu</h3>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Mật khẩu hiện tại</label>
                        <input
                            type="password"
                            value={passwordData.oldPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Mật khẩu mới</label>
                        <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Xác nhận mật khẩu</label>
                        <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className={styles.input}
                        />
                    </div>
                    <button
                        onClick={handleChangePassword}
                        disabled={loading}
                        className={styles.changePasswordBtn}
                    >
                        <Lock size={16} /> Đổi mật khẩu
                    </button>
                </div>

                {/* Notifications */}
                <div className={styles.settingCard}>
                    <div className={styles.cardHeader}>
                        <Bell size={20} />
                        <h3>Thông báo</h3>
                    </div>
                    <div className={styles.toggleGroup}>
                        <label>🔔 Thông báo email</label>
                        <input
                            type="checkbox"
                            checked={notifications.email}
                            onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                            className={styles.toggle}
                        />
                    </div>
                    <div className={styles.toggleGroup}>
                        <label>🔊 Âm thanh</label>
                        <input
                            type="checkbox"
                            checked={notifications.sound}
                            onChange={(e) => setNotifications({ ...notifications, sound: e.target.checked })}
                            className={styles.toggle}
                        />
                    </div>
                    <div className={styles.toggleGroup}>
                        <label>💻 Thông báo desktop</label>
                        <input
                            type="checkbox"
                            checked={notifications.desktop}
                            onChange={(e) => setNotifications({ ...notifications, desktop: e.target.checked })}
                            className={styles.toggle}
                        />
                    </div>
                </div>

                {/* Theme */}
                <div className={styles.settingCard}>
                    <div className={styles.cardHeader}>
                        <Palette size={20} />
                        <h3>Giao diện</h3>
                    </div>
                    <div className={styles.themeOptions}>
                        <button
                            className={theme === 'light' ? styles.themeActive : styles.themeBtn}
                            onClick={() => handleThemeChange('light')}
                        >
                            ☀️ Sáng
                        </button>
                        <button
                            className={theme === 'dark' ? styles.themeActive : styles.themeBtn}
                            onClick={() => handleThemeChange('dark')}
                        >
                            🌙 Tối
                        </button>
                        <button
                            className={theme === 'system' ? styles.themeActive : styles.themeBtn}
                            onClick={() => handleThemeChange('system')}
                        >
                            🖥️ Hệ thống
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingPage;