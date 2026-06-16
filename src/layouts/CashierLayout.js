// CashierLayout.js
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
    ChevronsLeft
} from "lucide-react";
import styles from "./CashierLayout.module.css";

const CashierLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [user, setUser] = useState({});
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(userData);
    }, []);

    const isDetailPage = location.pathname.match(/\/tables\/\d+/) ||
        location.pathname.match(/\/booking\/\d+/);

    // Tự động ẩn sidebar khi vào trang chi tiết
    useEffect(() => {
        if (isDetailPage) {
            setIsSidebarOpen(false);
        }
    }, [location.pathname, isDetailPage]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        navigate('/login');
    };

    // Hàm xử lý điều hướng cho menu items (không thu sidebar)
    const handleNavigate = (path) => {
        navigate(path);
    };

    // Hàm xử lý điều hướng cho Tất cả bàn và Đặt bàn (có thu sidebar)
    const handleNavigateWithCloseSidebar = (path) => {
        navigate(path);
        setIsSidebarOpen(false);
    };

    const menuItems = [
        { path: "/cashier/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/cashier/bill", label: "Đơn hàng", icon: Receipt },
        { path: "/cashier/report", label: "Báo cáo", icon: BarChart3 },
        { path: "/cashier/setting", label: "Cài đặt", icon: Settings },
    ];

    // Nếu là trang chi tiết (có ID), render full screen
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

                {/* Phần thông tin và đăng xuất */}
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
                            <span>Đặt bàn</span>
                        </button>
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