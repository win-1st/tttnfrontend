import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
    LayoutDashboard,
    Receipt,
    BarChart3,
    Settings,
    Table,
    BookOpen,
    LogOut,
    User,
    ChevronLeft,
    ChevronRight,
    Grid3X3,
    Bell,
    CheckCircle,
    AlertCircle,
    Info,
    XCircle
} from "lucide-react";
import styles from "./CashierLayout.module.css";

const CashierLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [user, setUser] = useState({});
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(userData);
    }, []);

    const isDetailPage = location.pathname.match(/\/tables\/\d+/) ||
        location.pathname.match(/\/booking\/\d+/);

    useEffect(() => {
        if (isDetailPage) {
            setIsSidebarOpen(false);
        }
    }, [location.pathname, isDetailPage]);

    // Lắng nghe thông báo từ TableDetail
    useEffect(() => {
        // Load notifications từ localStorage
        const savedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        setNotifications(savedNotifications);

        // Đếm số thông báo chưa đọc
        const unread = savedNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);

        // Lắng nghe sự kiện thông báo mới
        const handleNewNotification = (event) => {
            const newNotif = event.detail;
            setNotifications(prev => {
                const updated = [newNotif, ...prev];
                // Lưu vào localStorage
                localStorage.setItem('notifications', JSON.stringify(updated));
                return updated;
            });
            setUnreadCount(prev => prev + 1);
        };

        window.addEventListener('newNotification', handleNewNotification);

        // Lắng nghe sự kiện thay đổi localStorage từ tab khác
        const handleStorageChange = (e) => {
            if (e.key === 'notifications') {
                const updated = JSON.parse(e.newValue || '[]');
                setNotifications(updated);
                const unread = updated.filter(n => !n.read).length;
                setUnreadCount(unread);
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('newNotification', handleNewNotification);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        navigate('/login');
    };

    const handleNavigate = (path) => {
        navigate(path);
    };

    const handleNavigateWithCloseSidebar = (path) => {
        navigate(path);
        setIsSidebarOpen(false);
    };

    const markAllAsRead = () => {
        const updated = notifications.map(n => ({ ...n, read: true }));
        setNotifications(updated);
        setUnreadCount(0);
        localStorage.setItem('notifications', JSON.stringify(updated));
    };

    const clearAll = () => {
        setNotifications([]);
        setUnreadCount(0);
        localStorage.setItem('notifications', JSON.stringify([]));
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success':
                return <CheckCircle size={16} color="#10b981" />;
            case 'error':
                return <XCircle size={16} color="#ef4444" />;
            case 'warning':
                return <AlertCircle size={16} color="#f59e0b" />;
            default:
                return <Info size={16} color="#3b82f6" />;
        }
    };

    const menuItems = [
        { path: "/cashier/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/cashier/bill", label: "Đơn hàng", icon: Receipt },
        { path: "/cashier/report", label: "Báo cáo", icon: BarChart3 },
        { path: "/cashier/setting", label: "Thông tin", icon: Settings },
    ];

    if (isDetailPage) {
        return (
            <div style={{
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 9999
            }}>
                <Outlet />
            </div>
        );
    }

    return (
        <div className={styles.cashierLayout}>
            {/* SIDEBAR */}
            <div className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.sidebarLogo}>
                        <Grid3X3 size={24} />
                        {isSidebarOpen && <span>QUẢN LÝ CA</span>}
                    </div>
                </div>

                <div className={styles.sidebarMenu}>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <div
                                key={item.path}
                                onClick={() => handleNavigate(item.path)}
                                className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`}
                            >
                                <Icon size={20} />
                                {isSidebarOpen && <span>{item.label}</span>}
                            </div>
                        );
                    })}
                </div>

                <div className={styles.sidebarFooter}>
                    {isSidebarOpen && (
                        <div className={styles.userInfo}>
                            <User size={16} />
                            <div>
                                <div className={styles.userRole}>Nhân viên</div>
                                <div className={styles.userName}>
                                    {user.fullName || user.username || "Nhân viên"}
                                </div>
                            </div>
                        </div>
                    )}

                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        <LogOut size={18} />
                        {isSidebarOpen && <span>Đăng xuất</span>}
                    </button>
                </div>
            </div>

            {/* MAIN */}
            <div className={styles.mainArea}>
                {/* TOPBAR */}
                <div className={styles.topbar}>
                    <div className={styles.topbarLeft}>
                        <button onClick={toggleSidebar} className={styles.toggleBtn}>
                            {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                        </button>

                        <button
                            onClick={() => handleNavigateWithCloseSidebar("/cashier/tables")}
                            className={`${styles.topbarNavBtn} ${location.pathname === '/cashier/tables' ? styles.topbarNavActive : ''}`}
                        >
                            <Table size={18} />
                            <span>Tất cả bàn</span>
                        </button>

                        <button
                            onClick={() => handleNavigateWithCloseSidebar("/cashier/booking")}
                            className={`${styles.topbarNavBtn} ${location.pathname === '/cashier/booking' ? styles.topbarNavActive : ''}`}
                        >
                            <BookOpen size={18} />
                            <span>Đặt bàn và đổi quà</span>
                        </button>
                    </div>

                    <div className={styles.topbarRight}>
                        <div className={styles.notificationWrapper}>
                            <button
                                className={styles.notificationBtn}
                                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className={styles.notificationBadge}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotificationDropdown && (
                                <div className={styles.notificationDropdown}>
                                    <div className={styles.notificationHeader}>
                                        <span>Thông báo ({unreadCount} chưa đọc)</span>
                                        <div className={styles.notificationActions}>
                                            {notifications.length > 0 && (
                                                <>
                                                    <button
                                                        className={styles.notificationActionBtn}
                                                        onClick={markAllAsRead}
                                                    >
                                                        Đánh dấu đã đọc
                                                    </button>
                                                    <button
                                                        className={styles.notificationActionBtn}
                                                        onClick={clearAll}
                                                    >
                                                        Xóa tất cả
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className={styles.notificationList}>
                                        {notifications.length === 0 ? (
                                            <div className={styles.notificationEmpty}>
                                                <Bell size={24} />
                                                <span>Không có thông báo</span>
                                            </div>
                                        ) : (
                                            notifications.map((notif) => (
                                                <div
                                                    key={notif.id}
                                                    className={`${styles.notificationItem} ${!notif.read ? styles.notificationUnread : ''}`}
                                                >
                                                    <div className={styles.notificationIcon}>
                                                        {getNotificationIcon(notif.type)}
                                                    </div>
                                                    <div className={styles.notificationContent}>
                                                        <span className={styles.notificationMessage}>
                                                            {notif.message}
                                                        </span>
                                                        <span className={styles.notificationTime}>
                                                            {notif.time}
                                                        </span>
                                                    </div>
                                                    {!notif.read && (
                                                        <div className={styles.notificationDot} />
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <div className={styles.contentArea}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default CashierLayout;