import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    Users,
    ShoppingBag,
    Tag,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Table,
    FileText,
    Calendar,
    Package,
    TrendingUp,
    Warehouse,
    Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminLayout.module.css';

// Pages
import Dashboard from '../pages/admin/Dashboard';
import Products from '../pages/admin/Products';
import Promotions from '../pages/admin/Promotions';
import Employees from '../pages/admin/Employees';
import Reports from '../pages/admin/Reports';
import Categories from '../pages/admin/Categories';
import TableManagement from '../pages/admin/Table';
import ReservationMonitor from '../pages/admin/ReservationMonitor';
import BillsAndAuditSystem from '../pages/admin/BillsAndAudit';
import CustomerPoints from '../pages/admin/CustomerPoints';
import Inventory from '../pages/admin/Inventory';

export default function AdminLayout() {
    const navigate = useNavigate();
    const [activeMenu, setActiveMenu] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [user, setUser] = useState(null);

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'tables', label: 'Quản lý Bàn', icon: Table },
        { id: 'products', label: 'Quản lý Sản phẩm', icon: ShoppingBag },
        { id: 'categories', label: 'Quản lý Danh mục', icon: Package },
        { id: 'inventory', label: 'Quản lý Kho', icon: Warehouse },        // 🆕
        { id: 'promotions', label: 'Quản lý Khuyến mãi', icon: Tag },
        { id: 'reservations', label: 'Giám sát Đặt bàn', icon: Calendar },
        { id: 'employees', label: 'Quản lý Nhân viên', icon: Users },
        { id: 'customer-points', label: 'Tích điểm KH', icon: Star },      // 🆕
        { id: 'reports', label: 'Báo cáo Doanh thu', icon: TrendingUp },
        { id: 'billandaudit', label: 'Hóa đơn', icon: FileText },
    ];

    useEffect(() => {
        const token = localStorage.getItem('token');
        const loggedUser = JSON.parse(localStorage.getItem('user'));

        if (!token || !loggedUser) {
            navigate('/login');
            return;
        }

        const roles = loggedUser.roles || [];
        const isAdmin = roles.some(r => r === 'ROLE_ADMIN' || r === 'ADMIN');

        if (!isAdmin) {
            navigate('/');
            return;
        }

        setUser(loggedUser);
    }, [navigate]);

    const handleLogout = () => {
        // Xóa thông tin đăng nhập hiện tại
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setUser(null);
        navigate('/login');
    };

    // Data state
    const [products, setProducts] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [categories, setCategories] = useState([]);
    const [branchtable, setBranchtable] = useState([]);

    // Modal state
    const [modalType, setModalType] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [refreshCallback, setRefreshCallback] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const openAddModal = (type) => {
        setModalType(`add${type}`);
        setSelectedItem(null);
    };

    const openEditModal = (type, item, refreshFn) => {
        setModalType(`edit${type}`);
        setSelectedItem(item);
        setRefreshCallback(() => refreshFn);
    };

    const closeModal = () => {
        setModalType('');
        setSelectedItem(null);
        setRefreshCallback(null);
    };

    const handleSave = (item, type) => {
        switch (type) {
            case 'product':
                if (modalType.startsWith('add')) {
                    setProducts([...products, { ...item, id: Date.now(), status: 'Còn hàng' }]);
                } else {
                    setProducts(products.map(p => (p.id === item.id ? item : p)));
                }
                break;
            case 'promotion':
                if (modalType.startsWith('add')) {
                    setPromotions([...promotions, { ...item, id: Date.now(), status: 'Hoạt động' }]);
                } else {
                    setPromotions(promotions.map(p => (p.id === item.id ? item : p)));
                }
                break;
            case 'employee':
                if (modalType.startsWith('add')) {
                    setEmployees([...employees, { ...item, id: Date.now(), status: 'Hoạt động' }]);
                } else {
                    setEmployees(employees.map(e => (e.id === item.id ? item : e)));
                }
                break;
            case 'category':
                if (modalType.startsWith('add')) {
                    setCategories([...categories, { ...item, id: Date.now() }]);
                } else {
                    setCategories(categories.map(c => (c.id === item.id ? item : c)));
                }
                break;
            case 'Table':
                if (modalType.startsWith('add')) {
                    setBranchtable([...branchtable, { ...item, id: Date.now() }]);
                } else {
                    setBranchtable(branchtable.map(b => (b.id === item.id ? item : b)));
                }
                break;
            default:
                break;
        }
        setRefreshTrigger(prev => prev + 1);
        closeModal();
    };

    const renderContent = () => {
        switch (activeMenu) {
            case 'dashboard':
                return <Dashboard />;
            case 'tables':
                return <TableManagement
                    tables={branchtable}
                    setTables={setBranchtable}
                    refreshTrigger={refreshTrigger}
                    setRefreshTrigger={setRefreshTrigger}
                />;
            case 'products':
                return <Products
                    products={products}
                    setProducts={setProducts}
                    refreshTrigger={refreshTrigger}
                    setRefreshTrigger={setRefreshTrigger}
                />;
            case 'categories':
                return <Categories
                    categories={categories}
                    setCategories={setCategories}
                    refreshTrigger={refreshTrigger}
                    setRefreshTrigger={setRefreshTrigger}
                />;
            case 'inventory':                                          // 🆕
                return <Inventory />;
            case 'promotions':
                return <Promotions
                    promotions={promotions}
                    setPromotions={setPromotions}
                    refreshTrigger={refreshTrigger}
                    setRefreshTrigger={setRefreshTrigger}
                />;
            case 'reservations':
                return <ReservationMonitor />;
            case 'employees':
                return <Employees
                    employees={employees}
                    setEmployees={setEmployees}
                    refreshTrigger={refreshTrigger}
                    setRefreshTrigger={setRefreshTrigger}
                />;
            case 'customer-points':                                    // 🆕
                return <CustomerPoints />;
            case 'reports':
                return <Reports />;
            case 'billandaudit':
                return <BillsAndAuditSystem />;
            default:
                return <Dashboard />;
        }
    };

    const renderModal = () => {
        return null;
    };

    const currentMenuLabel = menuItems.find(item => item.id === activeMenu)?.label || 'Dashboard';

    return (
        <div className={styles.wrapper}>
            <div className={`${styles.sidebar} ${!sidebarOpen ? styles.collapsed : ''}`}>
                <div className={styles['sidebar-header']}>
                    {sidebarOpen ? (
                        <div className={styles['brand-container']}>
                            <h1 className={styles['brand-title']}>Win Admin</h1>
                        </div>
                    ) : (
                        <div className={styles['brand-icon-collapsed']}>🎱</div>
                    )}
                </div>

                <nav className={styles['sidebar-nav']}>
                    {menuItems.map(item => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                className={`${styles['nav-button']} ${activeMenu === item.id ? styles.active : ''}`}
                                onClick={() => setActiveMenu(item.id)}
                            >
                                <Icon size={20} />
                                {sidebarOpen && <span>{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                <button
                    className={styles['toggle-button']}
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
            </div>

            <div className={styles.main}>
                <div className={styles.topbar}>
                    <div className={styles['topbar-left']}>
                        <h2 className={styles['page-title']}>{currentMenuLabel}</h2>
                    </div>
                    <div className={styles['topbar-right']}>
                        {user && (
                            <>
                                <div className={styles['user-info']}>
                                    <div className={styles['user-avatar']}>
                                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username?.charAt(0).toUpperCase() || 'A'}
                                    </div>
                                    <span className={styles['user-name']}>{user.fullName || user.username}</span>
                                </div>
                                <button onClick={handleLogout} className={styles['logout-button']}>
                                    <LogOut size={18} />
                                    <span>Đăng xuất</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className={styles.content}>
                    {renderContent()}
                </div>
            </div>

            {renderModal()}
        </div>
    );
}