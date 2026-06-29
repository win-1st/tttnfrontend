// pages/admin/Dashboard.js
import React, { useEffect, useState } from 'react';
import {
    TrendingUp,
    ShoppingCart,
    Package,
    Table,
    RefreshCw,
    Crown,
    Coffee,
    Clock,
    ArrowUp,
    ArrowDown,
    Wallet,
    Smartphone,
    CreditCard,
    BarChart3,
    Receipt,
    Flame,
    Calendar,
    Award
} from 'lucide-react';
import axiosClient from '../../../services/axiosClient';
import ToastNotification from './ToastNotification';
import styles from './Dashboard.module.css';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalProducts: 0,
        periodRevenue: 0,
        totalRevenue: 0,
        totalOrders: 0,
        activeTables: 0,
        totalUsers: 0,
        growthRate: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = "info", duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, duration);
    };

    const getTodayRange = () => {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        return { startOfDay, endOfDay };
    };

    const filterTodayBills = (bills) => {
        const { startOfDay, endOfDay } = getTodayRange();
        return bills.filter(bill => {
            const billDate = new Date(bill.createdAt);
            return billDate >= startOfDay && billDate <= endOfDay && bill.paymentStatus === 'PAID';
        });
    };

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showToast('Vui lòng đăng nhập lại', 'error');
                setTimeout(() => window.location.href = '/login', 1500);
                return;
            }

            // 1. Fetch bills using axiosClient
            const billsResponse = await axiosClient.get('/bills/all');
            let allBills = [];
            if (billsResponse.data?.success && billsResponse.data?.data) {
                allBills = billsResponse.data.data;
            } else if (Array.isArray(billsResponse.data)) {
                allBills = billsResponse.data;
            } else if (billsResponse.data?.data && Array.isArray(billsResponse.data.data)) {
                allBills = billsResponse.data.data;
            }

            console.log('📊 Total bills:', allBills.length);

            const todayBills = filterTodayBills(allBills);
            const todayRevenue = todayBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);

            const allPaidBills = allBills.filter(bill => bill.paymentStatus === 'PAID');
            const totalRevenue = allPaidBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);

            const sortedTodayBills = [...todayBills].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setRecentOrders(sortedTodayBills.slice(0, 10));

            // 2. Fetch products
            let totalProducts = 0;
            try {
                const productsRes = await axiosClient.get('/products');
                if (productsRes.data?.data) {
                    totalProducts = Array.isArray(productsRes.data.data) ? productsRes.data.data.length : 0;
                }
            } catch (err) {
                console.error('❌ Error fetching products:', err);
            }

            // 3. Fetch tables
            let activeTables = 0;
            try {
                const tablesRes = await axiosClient.get('/tables');
                if (tablesRes.data?.data) {
                    const tables = Array.isArray(tablesRes.data.data) ? tablesRes.data.data : [];
                    activeTables = tables.filter(t => t.status === 'OCCUPIED').length;
                }
            } catch (err) {
                console.error('❌ Error fetching tables:', err);
            }

            // 4. ⚠️ BỎ QUA /users - không gọi API này nữa
            // Đặt giá trị mặc định
            const totalUsers = 0;

            // 5. Calculate growth rate
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
            const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);

            const yesterdayBills = allBills.filter(bill => {
                const billDate = new Date(bill.createdAt);
                return billDate >= startOfYesterday && billDate <= endOfYesterday && bill.paymentStatus === 'PAID';
            });
            const yesterdayRevenue = yesterdayBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);

            let growthRate = 0;
            if (yesterdayRevenue > 0) {
                growthRate = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
            } else if (todayRevenue > 0) {
                growthRate = 100;
            }

            setStats({
                totalProducts,
                periodRevenue: todayRevenue,
                totalRevenue,
                totalOrders: todayBills.length,
                activeTables,
                totalUsers,
                growthRate
            });

            // 6. Calculate top products
            await calculateTodayTopProducts(todayBills, token);

        } catch (error) {
            console.error('❌ Error fetching dashboard:', error);
            showToast('Không thể tải dữ liệu dashboard', 'error');

            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setTimeout(() => window.location.href = '/login', 1500);
            }
        } finally {
            setLoading(false);
        }
    };

    const calculateTodayTopProducts = async (todayBills, token) => {
        try {
            const dishStats = {};

            for (const bill of todayBills) {
                if (bill.id) {
                    try {
                        // Sử dụng axiosClient thay vì fetch
                        const detailResponse = await axiosClient.get(`/bills/${bill.id}`);
                        if (detailResponse.data) {
                            const items = detailResponse.data.data?.items || [];
                            for (const item of items) {
                                const dishName = item.name || item.productName || 'Món ăn';
                                const quantity = item.quantity || 1;
                                const price = item.unitPrice || item.price || 0;
                                const revenue = quantity * price;

                                if (!dishStats[dishName]) {
                                    dishStats[dishName] = { quantity: 0, revenue: 0, name: dishName };
                                }
                                dishStats[dishName].quantity += quantity;
                                dishStats[dishName].revenue += revenue;
                            }
                        }
                    } catch (err) {
                        console.error(`❌ Error fetching bill ${bill.id} details:`, err);
                    }
                }
            }

            const topProductsList = Object.values(dishStats)
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);

            setTopProducts(topProductsList);
        } catch (error) {
            console.error('❌ Error calculating top products:', error);
            setTopProducts([]);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const formatCurrency = (amount) => {
        if (!amount || amount === 0) return "0đ";
        return amount.toLocaleString('vi-VN') + 'đ';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    };

    const getTableNumber = (bill) => {
        if (bill.tableNumber) return bill.tableNumber;
        if (bill.table?.number) return bill.table.number;
        return '-';
    };

    const getGrowthColor = (growthRate) => {
        if (growthRate > 0) return '#10B981';
        if (growthRate < 0) return '#EF4444';
        return '#64748B';
    };

    const getTodayDateString = () => {
        const today = new Date();
        return today.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const getPaymentMethodIcon = (method) => {
        switch (method) {
            case 'CASH':
                return <Wallet size={14} />;
            case 'MOMO':
                return <Smartphone size={14} />;
            default:
                return <CreditCard size={14} />;
        }
    };

    const getPaymentMethodText = (method) => {
        switch (method) {
            case 'CASH':
                return 'Tiền mặt';
            case 'MOMO':
                return 'MoMo';
            default:
                return 'Chuyển khoản';
        }
    };

    const getRankIcon = (index) => {
        switch (index) {
            case 0:
                return <Award size={18} className={styles.rankIconGold} />;
            case 1:
                return <Award size={18} className={styles.rankIconSilver} />;
            case 2:
                return <Award size={18} className={styles.rankIconBronze} />;
            default:
                return <span className={styles.rankNumber}>#{index + 1}</span>;
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p className={styles.loadingText}>Đang tải dữ liệu...</p>
            </div>
        );
    }

    const statCards = [
        {
            key: 'periodRevenue',
            label: 'Doanh thu hôm nay',
            value: formatCurrency(stats.periodRevenue),
            icon: <TrendingUp size={28} />,
            color: '#ff6b6b',
            bg: 'rgba(255,107,107,0.15)'
        },
        {
            key: 'totalOrders',
            label: 'Đơn hàng hôm nay',
            value: stats.totalOrders,
            icon: <ShoppingCart size={28} />,
            color: '#4CAF50',
            bg: 'rgba(76,175,80,0.15)'
        },
        {
            key: 'totalProducts',
            label: 'Tổng sản phẩm',
            value: stats.totalProducts,
            icon: <Package size={28} />,
            color: '#9C27B0',
            bg: 'rgba(156,39,176,0.15)'
        },
        {
            key: 'activeTables',
            label: 'Bàn đang sử dụng',
            value: stats.activeTables,
            icon: <Table size={28} />,
            color: '#FF9800',
            bg: 'rgba(255,152,0,0.15)'
        },
    ];

    return (
        <div className={styles.container}>
            {/* Toast Container */}
            <div className={styles.toastContainer}>
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

            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.mainTitle}>
                        <BarChart3 size={32} className={styles.titleIcon} />
                        Tổng quan
                    </h1>
                    <p className={styles.subTitle}>
                        <Calendar size={14} className={styles.calendarIcon} />
                        {getTodayDateString()} • <span className={styles.timeUpdate}>Cập nhật: {new Date().toLocaleTimeString('vi-VN')}</span>
                    </p>
                </div>
                <button onClick={fetchDashboardData} className={styles.refreshButton}>
                    <RefreshCw size={18} className={styles.refreshIcon} />
                    Làm mới
                </button>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                {statCards.map(card => (
                    <div key={card.key} className={styles.statCard}>
                        <div className={styles.statContent}>
                            <div>
                                <p className={styles.statLabel}>{card.label}</p>
                                <h3 className={styles.statValue} style={{ color: card.color }}>
                                    {card.value}
                                </h3>
                            </div>
                            <div className={styles.statIcon} style={{ background: card.bg, color: card.color }}>
                                {card.icon}
                            </div>
                        </div>
                        {card.key === 'periodRevenue' && stats.growthRate !== 0 && (
                            <div className={styles.growthBadge}>
                                {stats.growthRate > 0 ?
                                    <ArrowUp size={14} className={styles.growthIcon} /> :
                                    <ArrowDown size={14} className={styles.growthIcon} />
                                }
                                <span style={{ color: getGrowthColor(stats.growthRate) }}>
                                    {Math.abs(stats.growthRate).toFixed(1)}%
                                </span>
                                <span className={styles.growthLabel}>so với hôm qua</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Recent Orders */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        <Receipt size={22} className={styles.sectionIcon} />
                        Hóa đơn hôm nay
                    </h2>
                    <span className={styles.sectionBadge}>
                        {stats.totalOrders} đơn
                    </span>
                </div>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.tableHeader}>
                                <th className={styles.th}>Mã HD</th>
                                <th className={styles.th}>Bàn</th>
                                <th className={`${styles.th} ${styles.thRight}`}>Tổng tiền</th>
                                <th className={`${styles.th} ${styles.thCenter}`}>Phương thức</th>
                                <th className={styles.th}>Thời gian</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.length > 0 ? (
                                recentOrders.map(bill => (
                                    <tr key={bill.id} className={styles.tableRow}>
                                        <td className={`${styles.td} ${styles.tdId}`}>#{bill.id}</td>
                                        <td className={styles.td}>
                                            <span className={styles.tableNumber}>
                                                <Crown size={16} className={styles.crownIcon} />
                                                Bàn {getTableNumber(bill)}
                                            </span>
                                        </td>
                                        <td className={`${styles.td} ${styles.tdRight} ${styles.tdAmount}`}>
                                            {formatCurrency(bill.totalAmount)}
                                        </td>
                                        <td className={`${styles.td} ${styles.tdCenter}`}>
                                            <span className={styles.paymentMethod}>
                                                {getPaymentMethodIcon(bill.paymentMethod)}
                                                {getPaymentMethodText(bill.paymentMethod)}
                                            </span>
                                        </td>
                                        <td className={`${styles.td} ${styles.tdTime}`}>
                                            <Clock size={14} className={styles.clockIcon} />
                                            {formatDate(bill.createdAt)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className={styles.emptyState}>
                                        <Receipt size={56} className={styles.emptyIcon} />
                                        <p className={styles.emptyText}>Chưa có hóa đơn nào hôm nay</p>
                                        <p className={styles.emptySubText}>Hóa đơn sẽ hiển thị sau khi có giao dịch</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top Products */}
            {topProducts.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            <Flame size={22} className={styles.sectionIcon} />
                            Top sản phẩm bán chạy
                        </h2>
                        <span className={styles.sectionBadge}>Hôm nay</span>
                    </div>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr className={styles.tableHeader}>
                                    <th className={`${styles.th} ${styles.thCenter} ${styles.thRank}`}>Hạng</th>
                                    <th className={styles.th}>Tên sản phẩm</th>
                                    <th className={`${styles.th} ${styles.thRight}`}>Số lượng</th>
                                    <th className={`${styles.th} ${styles.thRight}`}>Doanh thu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.map((product, index) => (
                                    <tr key={index} className={styles.tableRow}>
                                        <td className={`${styles.td} ${styles.tdCenter}`}>
                                            <span className={`${styles.rankBadge} ${index < 3 ? styles.rankTop : ''}`}>
                                                {getRankIcon(index)}
                                            </span>
                                        </td>
                                        <td className={`${styles.td} ${styles.tdProduct}`}>
                                            <span className={styles.productName}>
                                                <Coffee size={18} className={styles.coffeeIcon} />
                                                {product.name}
                                            </span>
                                        </td>
                                        <td className={`${styles.td} ${styles.tdRight} ${styles.tdQuantity}`}>
                                            {product.quantity} lượt
                                        </td>
                                        <td className={`${styles.td} ${styles.tdRight} ${styles.tdRevenue}`}>
                                            {formatCurrency(product.revenue)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}