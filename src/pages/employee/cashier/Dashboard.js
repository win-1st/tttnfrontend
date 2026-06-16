import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Users, Package, Table, RefreshCw, Crown, Coffee, Clock } from 'lucide-react';
import axiosClient from '../../../services/axiosClient';
import ToastNotification from './ToastNotification';

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

    // Lấy ngày hôm nay (đầu ngày và cuối ngày)
    const getTodayRange = () => {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        return { startOfDay, endOfDay };
    };

    // Lọc bill theo ngày hôm nay (chỉ lấy bill đã thanh toán)
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

            // 1. Lấy tất cả bills từ API (giống ReportPage)
            const billsResponse = await fetch(`http://localhost:8080/api/bills/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            let allBills = [];
            if (billsResponse.ok) {
                const result = await billsResponse.json();
                allBills = result.data || [];
            }
            console.log('All bills:', allBills.length);

            // 2. Lọc bill của hôm nay (đã thanh toán)
            const todayBills = filterTodayBills(allBills);
            console.log('Today bills (PAID):', todayBills.length);

            // 3. Tính doanh thu hôm nay
            const todayRevenue = todayBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);

            // 4. Tính tổng doanh thu (tất cả thời gian)
            const allPaidBills = allBills.filter(bill => bill.paymentStatus === 'PAID');
            const totalRevenue = allPaidBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);

            // 5. Đơn hàng gần đây (10 bill mới nhất của hôm nay)
            const sortedTodayBills = [...todayBills].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setRecentOrders(sortedTodayBills.slice(0, 10));

            // 6. Lấy các thông tin khác
            let totalProducts = 0;
            let activeTables = 0;
            let totalUsers = 0;

            try {
                const productsRes = await axiosClient.get('/products');
                if (productsRes.data?.data) {
                    totalProducts = Array.isArray(productsRes.data.data) ? productsRes.data.data.length : 0;
                }
            } catch (err) {
                console.error('Error fetching products:', err);
            }

            try {
                const tablesRes = await axiosClient.get('/tables');
                if (tablesRes.data?.data) {
                    const tables = Array.isArray(tablesRes.data.data) ? tablesRes.data.data : [];
                    activeTables = tables.filter(t => t.status === 'OCCUPIED').length;
                }
            } catch (err) {
                console.error('Error fetching tables:', err);
            }

            try {
                const usersRes = await axiosClient.get('/users');
                if (usersRes.data?.data) {
                    const users = Array.isArray(usersRes.data.data) ? usersRes.data.data : [];
                    totalUsers = users.filter(u => u.role === 'CUSTOMER').length;
                }
            } catch (err) {
                console.error('Error fetching users:', err);
            }

            // 7. Tính growth rate (so sánh với hôm qua)
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

            // 8. Tính top sản phẩm bán chạy hôm nay (giống ReportPage)
            await calculateTodayTopProducts(todayBills, token);

        } catch (error) {
            console.error('Error fetching dashboard:', error);
            showToast('Không thể tải dữ liệu dashboard', 'error');
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
                        const detailResponse = await fetch(`http://localhost:8080/api/bills/${bill.id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (detailResponse.ok) {
                            const detailResult = await detailResponse.json();
                            const items = detailResult.data?.items || [];
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
                        console.error(`Error fetching bill ${bill.id} details:`, err);
                    }
                }
            }

            const topProductsList = Object.values(dishStats)
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);

            console.log('Top products today:', topProductsList);
            setTopProducts(topProductsList);
        } catch (error) {
            console.error('Error calculating top products:', error);
            setTopProducts([]);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        // Tự động refresh mỗi 30 giây
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'PAID': return '#10B981';
            case 'WAITING_PAYMENT': return '#FBBF24';
            case 'OPEN': return '#3B82F6';
            case 'CANCELLED': return '#EF4444';
            default: return '#64748B';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'PAID': return 'Đã thanh toán';
            case 'WAITING_PAYMENT': return 'Chờ thanh toán';
            case 'OPEN': return 'Đang chơi';
            case 'CANCELLED': return 'Đã hủy';
            default: return status;
        }
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

    // Format ngày hiện tại
    const getTodayDateString = () => {
        const today = new Date();
        return today.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                <div style={{ width: '40px', height: '40px', border: '4px solid #2d2d3d', borderTop: '4px solid #ff6b6b', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                <p>Đang tải dữ liệu...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const statCards = [
        { key: 'periodRevenue', label: `Doanh thu hôm nay (${new Date().toLocaleDateString('vi-VN')})`, value: formatCurrency(stats.periodRevenue), icon: <TrendingUp size={24} />, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
        { key: 'totalOrders', label: `Đơn hàng hôm nay`, value: stats.totalOrders, icon: <ShoppingCart size={24} />, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
        { key: 'totalProducts', label: 'Sản phẩm', value: stats.totalProducts, icon: <Package size={24} />, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
        { key: 'activeTables', label: 'Bàn đang dùng', value: stats.activeTables, icon: <Table size={24} />, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    ];

    return (
        <div>
            {/* Toast Container */}
            <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: '#ff6b6b' }}>Dashboard Hôm nay</h2>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                        {getTodayDateString()} - Dữ liệu được cập nhật theo thời gian thực
                    </p>
                </div>
                <button
                    onClick={fetchDashboardData}
                    style={{ padding: '10px 20px', background: '#2d2d3d', border: 'none', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <RefreshCw size={16} /> Làm mới
                </button>
            </div>
            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                {statCards.map(card => (
                    <div key={card.key} style={{ background: '#1a1a2e', border: '1px solid #2d2d3d', borderRadius: '16px', padding: '20px', transition: 'transform 0.3s' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>{card.label}</p>
                                <h3 style={{ fontSize: '28px', fontWeight: '700', color: card.color }}>{card.value}</h3>
                            </div>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: card.bg,
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {card.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Bills - Today only */}
            <div style={{ background: '#1a1a2e', border: '1px solid #2d2d3d', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #2d2d3d' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white' }}>📋 Hóa đơn hôm nay</h3>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                            Tổng: {stats.totalOrders} đơn | Cập nhật: {new Date().toLocaleTimeString('vi-VN')}
                        </span>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontWeight: '500' }}>Mã HD</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontWeight: '500' }}>Bàn</th>
                                <th style={{ padding: '16px', textAlign: 'right', color: '#94a3b8', fontWeight: '500' }}>Tổng tiền</th>
                                <th style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontWeight: '500' }}>Phương thức</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontWeight: '500' }}>Thời gian</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.length > 0 ? (
                                recentOrders.map(bill => (
                                    <tr key={bill.id} style={{ borderBottom: '1px solid #2d2d3d' }}>
                                        <td style={{ padding: '16px', color: 'white', fontWeight: '600' }}>#{bill.id}</td>
                                        <td style={{ padding: '16px', color: '#e2e8f0' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Crown size={14} color="#F59E0B" />
                                                Bàn {getTableNumber(bill)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right', color: '#ff6b6b', fontWeight: '700', fontSize: '16px' }}>{formatCurrency(bill.totalAmount)}</td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                background: 'rgba(16,185,129,0.1)',
                                                color: '#10B981'
                                            }}>
                                                {bill.paymentMethod === 'CASH' ? '💰 Tiền mặt' : bill.paymentMethod === 'MOMO' ? '📱 MoMo' : '💳 Chuyển khoản'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', color: '#94a3b8', fontSize: '13px' }}>{formatDate(bill.createdAt)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                                        <ShoppingCart size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                                        <p>Chưa có hóa đơn nào hôm nay</p>
                                        <p style={{ fontSize: '12px', marginTop: '8px' }}>Hóa đơn sẽ hiển thị sau khi có giao dịch</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top Products Today */}
            {topProducts.length > 0 && (
                <div style={{ background: '#1a1a2e', border: '1px solid #2d2d3d', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #2d2d3d' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white' }}>🔥 Top sản phẩm bán chạy hôm nay</h3>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                                Cập nhật: {new Date().toLocaleTimeString('vi-VN')}
                            </span>
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
                                    <th style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontWeight: '500', width: '60px' }}>STT</th>
                                    <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontWeight: '500' }}>Tên sản phẩm</th>
                                    <th style={{ padding: '16px', textAlign: 'right', color: '#94a3b8', fontWeight: '500' }}>Số lượng</th>
                                    <th style={{ padding: '16px', textAlign: 'right', color: '#94a3b8', fontWeight: '500' }}>Doanh thu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.map((product, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #2d2d3d' }}>
                                        <td style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                width: '28px',
                                                height: '28px',
                                                lineHeight: '28px',
                                                textAlign: 'center',
                                                background: index < 3 ? `rgba(255,107,107,0.2)` : '#2d2d3d',
                                                borderRadius: '8px',
                                                color: index < 3 ? '#ff6b6b' : '#94a3b8',
                                                fontWeight: '700'
                                            }}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', color: 'white', fontWeight: '500' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Coffee size={16} color="#ff6b6b" />
                                                {product.name}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right', color: '#e2e8f0', fontWeight: '500' }}>{product.quantity} lượt</td>
                                        <td style={{ padding: '16px', textAlign: 'right', color: '#ff6b6b', fontWeight: '700' }}>{formatCurrency(product.revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                button:hover {
                    transform: translateY(-1px);
                    transition: all 0.3s;
                }
            `}</style>
        </div>
    );
}