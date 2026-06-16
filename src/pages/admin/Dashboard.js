// pages/admin/Dashboard.js - Đã bỏ card Khách hàng
import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Users, Package, Table, RefreshCw, Crown, Coffee, Clock, Search, X } from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import ToastNotification from '../employee/cashier/ToastNotification';

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
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('week');
    const [searchTerm, setSearchTerm] = useState('');
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = "info", duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, duration);
    };

    // Lấy ngày bắt đầu dựa trên timeRange
    const getStartDateByTimeRange = () => {
        const now = new Date();
        switch (timeRange) {
            case 'day':
                return new Date(now.getFullYear(), now.getMonth(), now.getDate());
            case 'week': {
                const dayOfWeek = now.getDay();
                const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const monday = new Date(now);
                monday.setDate(now.getDate() - diff);
                return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
            }
            case 'month':
                return new Date(now.getFullYear(), now.getMonth(), 1);
            case 'year':
                return new Date(now.getFullYear(), 0, 1);
            default:
                return new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }
    };

    // Lấy ngày kết thúc
    const getEndDateByTimeRange = () => {
        const now = new Date();
        switch (timeRange) {
            case 'day':
                return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            case 'week': {
                const dayOfWeek = now.getDay();
                const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const monday = new Date(now);
                monday.setDate(now.getDate() - diff);
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                return new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), 23, 59, 59);
            }
            case 'month':
                return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            case 'year':
                return new Date(now.getFullYear(), 11, 31, 23, 59, 59);
            default:
                return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        }
    };

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            console.log('Fetching dashboard with timeRange:', timeRange);

            const startDate = getStartDateByTimeRange();
            const endDate = getEndDateByTimeRange();

            // 1. Lấy tất cả bills (hóa đơn đã thanh toán)
            const billsRes = await axiosClient.get('/bills/all');
            console.log('Bills response:', billsRes.data);

            let allBills = [];
            if (billsRes.data?.success && billsRes.data?.data) {
                allBills = billsRes.data.data;
            } else if (Array.isArray(billsRes.data)) {
                allBills = billsRes.data;
            } else if (billsRes.data?.data && Array.isArray(billsRes.data.data)) {
                allBills = billsRes.data.data;
            }

            // Lọc bills theo thời gian và chỉ lấy đã thanh toán
            const filteredBills = allBills.filter(bill => {
                const billDate = new Date(bill.createdAt);
                const isInRange = billDate >= startDate && billDate <= endDate;
                const isPaid = bill.paymentStatus === 'PAID';
                return isInRange && isPaid;
            });

            console.log('Filtered bills count:', filteredBills.length);

            // Tính tổng doanh thu trong kỳ
            const periodRevenue = filteredBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
            const totalOrders = filteredBills.length;

            // Tính tổng doanh thu tất cả thời gian
            const allPaidBills = allBills.filter(bill => bill.paymentStatus === 'PAID');
            const totalRevenueAll = allPaidBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);

            // Tính growth rate
            let growthRate = 0;
            if (timeRange === 'day' && periodRevenue > 0) {
                const yesterdayStart = new Date(startDate);
                yesterdayStart.setDate(yesterdayStart.getDate() - 1);
                const yesterdayEnd = new Date(endDate);
                yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
                const yesterdayBills = allBills.filter(bill => {
                    const billDate = new Date(bill.createdAt);
                    return billDate >= yesterdayStart && billDate <= yesterdayEnd && bill.paymentStatus === 'PAID';
                });
                const yesterdayRevenue = yesterdayBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
                if (yesterdayRevenue > 0) {
                    growthRate = ((periodRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
                }
            }

            // Lấy top sản phẩm từ bills
            const topProductsList = await calculateTopProductsFromBills(filteredBills);
            setTopProducts(topProductsList);

            // Lấy đơn hàng gần đây
            const sortedBills = [...filteredBills].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setRecentOrders(sortedBills.slice(0, 20));
            setFilteredOrders(sortedBills.slice(0, 20));

            // Lấy các thông tin khác
            let totalProducts = 0;
            let activeTables = 0;

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

            // ĐÃ XÓA PHẦN GỌI API USERS

            setStats({
                totalProducts: totalProducts,
                periodRevenue: periodRevenue,
                totalRevenue: totalRevenueAll,
                totalOrders: totalOrders,
                activeTables: activeTables,
                totalUsers: 0,  // Set cứng bằng 0 hoặc bỏ field này
                growthRate: growthRate
            });

        } catch (error) {
            console.error('Error fetching dashboard:', error);
            showToast('Không thể tải dữ liệu dashboard', 'error');
        } finally {
            setLoading(false);
        }
    };

    const calculateTopProductsFromBills = async (bills) => {
        const token = localStorage.getItem('token');
        const dishStats = {};

        for (const bill of bills) {
            try {
                const detailResponse = await fetch(`http://localhost:8080/api/bills/${bill.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (detailResponse.ok) {
                    const detailResult = await detailResponse.json();
                    const items = detailResult.data?.items || [];
                    for (const item of items) {
                        const dishName = item.name || 'Món ăn';
                        if (!dishStats[dishName]) {
                            dishStats[dishName] = { quantity: 0, revenue: 0 };
                        }
                        dishStats[dishName].quantity += item.quantity || 1;
                        dishStats[dishName].revenue += (item.unitPrice || 0) * (item.quantity || 1);
                    }
                }
            } catch (err) {
                console.error("Error fetching bill detail:", err);
            }
        }

        const sorted = Object.entries(dishStats)
            .map(([name, stats]) => ({ productName: name, quantity: stats.quantity, revenue: stats.revenue }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        return sorted;
    };

    const handleSearch = (keyword) => {
        setSearchTerm(keyword);
        if (!keyword.trim()) {
            setFilteredOrders(recentOrders);
            return;
        }

        const lowerKeyword = keyword.toLowerCase().trim();
        const filtered = recentOrders.filter(order => {
            if (order.id && order.id.toString().includes(lowerKeyword)) return true;
            const tableNumber = order.tableNumber || '';
            if (tableNumber.toString().includes(lowerKeyword)) return true;
            const total = (order.totalAmount || 0).toString();
            if (total.includes(lowerKeyword)) return true;
            return false;
        });
        setFilteredOrders(filtered);
    };

    const clearSearch = () => {
        setSearchTerm('');
        setFilteredOrders(recentOrders);
    };

    useEffect(() => {
        fetchDashboardData();
    }, [timeRange]);

    const formatCurrency = (amount) => {
        if (!amount || amount === 0) return "0đ";
        return amount.toLocaleString('vi-VN') + 'đ';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    };

    const getTableNumber = (order) => {
        return order.tableNumber || order.table?.number || '-';
    };

    const getGrowthColor = (growthRate) => {
        if (growthRate > 0) return '#10B981';
        if (growthRate < 0) return '#EF4444';
        return '#64748B';
    };

    const getPeriodLabel = () => {
        switch (timeRange) {
            case 'day': return 'hôm nay';
            case 'week': return 'tuần này';
            case 'month': return 'tháng này';
            case 'year': return 'năm nay';
            default: return '';
        }
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

    // ĐÃ XÓA CARD "Khách hàng" khỏi statCards
    const statCards = [
        { key: 'totalRevenue', label: 'Tổng doanh thu', value: formatCurrency(stats.totalRevenue), icon: <DollarSign size={24} />, color: '#ff6b6b', bg: 'rgba(255,107,107,0.1)' },
        { key: 'periodRevenue', label: `Doanh thu ${getPeriodLabel()}`, value: formatCurrency(stats.periodRevenue), icon: <TrendingUp size={24} />, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
        { key: 'totalOrders', label: `Đơn hàng ${getPeriodLabel()}`, value: stats.totalOrders, icon: <ShoppingCart size={24} />, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
        { key: 'totalProducts', label: 'Sản phẩm', value: stats.totalProducts, icon: <Package size={24} />, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
        { key: 'activeTables', label: 'Bàn đang dùng', value: stats.activeTables, icon: <Table size={24} />, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
        // ĐÃ XÓA CARD "Khách hàng"
    ];

    const displayOrders = searchTerm ? filteredOrders : recentOrders;

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
                    <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: '#ff6b6b' }}>Dashboard</h2>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>Tổng quan hoạt động kinh doanh</p>
                </div>
                <button
                    onClick={fetchDashboardData}
                    style={{ padding: '10px 20px', background: '#2d2d3d', border: 'none', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <RefreshCw size={16} /> Làm mới
                </button>
            </div>

            {/* Growth Rate Banner */}
            {stats.growthRate !== 0 && (
                <div style={{
                    marginBottom: '20px',
                    padding: '12px 20px',
                    background: `rgba(${stats.growthRate > 0 ? '16,185,129' : '239,68,68'}, 0.1)`,
                    borderRadius: '12px',
                    border: `1px solid ${getGrowthColor(stats.growthRate)}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <TrendingUp size={20} color={getGrowthColor(stats.growthRate)} />
                    <span style={{ color: '#e2e8f0' }}>
                        Tăng trưởng doanh thu:
                        <strong style={{ color: getGrowthColor(stats.growthRate), marginLeft: '8px' }}>
                            {stats.growthRate > 0 ? '+' : ''}{stats.growthRate.toFixed(1)}%
                        </strong>
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: '#94a3b8' }}>
                            (so với kỳ trước)
                        </span>
                    </span>
                </div>
            )}

            {/* Time Range Filter */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[
                    { value: 'day', label: 'Hôm nay' },
                    { value: 'week', label: 'Tuần này' },
                    { value: 'month', label: 'Tháng này' },
                    { value: 'year', label: 'Năm nay' }
                ].map(range => (
                    <button
                        key={range.value}
                        onClick={() => setTimeRange(range.value)}
                        style={{
                            padding: '8px 20px',
                            background: timeRange === range.value ? '#ff6b6b' : '#2d2d3d',
                            color: timeRange === range.value ? 'white' : '#94a3b8',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.3s'
                        }}
                    >
                        {range.label}
                    </button>
                ))}
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                {statCards.map(card => (
                    <div key={card.key} style={{ background: '#1a1a2e', border: '1px solid #2d2d3d', borderRadius: '16px', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>{card.label}</p>
                                <h3 style={{ fontSize: '28px', fontWeight: '700', color: card.color }}>{card.value}</h3>
                            </div>
                            <div style={{ width: '48px', height: '48px', background: card.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {card.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Orders Table với tìm kiếm */}
            <div style={{ background: '#1a1a2e', border: '1px solid #2d2d3d', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #2d2d3d' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white' }}>📋 Hóa đơn đã thanh toán</h3>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#2d2d3d', borderRadius: '8px', padding: '4px 12px', border: '1px solid #3d3d4d' }}>
                            <Search size={18} color="#94a3b8" />
                            <input
                                type="text"
                                placeholder="Tìm theo mã đơn, bàn..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: 'white',
                                    padding: '8px 0',
                                    fontSize: '14px',
                                    width: '250px'
                                }}
                            />
                            {searchTerm && (
                                <button onClick={clearSearch} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                    {searchTerm && (
                        <div style={{ marginTop: '12px', fontSize: '13px', color: '#94a3b8' }}>
                            Tìm thấy <strong style={{ color: '#ff6b6b' }}>{displayOrders.length}</strong> kết quả
                        </div>
                    )}
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8' }}>Mã HD</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8' }}>Bàn</th>
                                <th style={{ padding: '16px', textAlign: 'right', color: '#94a3b8' }}>Tổng tiền</th>
                                <th style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>Trạng thái</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8' }}>Thời gian</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayOrders.length > 0 ? (
                                displayOrders.map(order => (
                                    <tr key={order.id} style={{ borderBottom: '1px solid #2d2d3d' }}>
                                        <td style={{ padding: '16px', color: 'white', fontWeight: '500' }}>#{order.id}</td>
                                        <td style={{ padding: '16px', color: '#e2e8f0' }}>Bàn {getTableNumber(order)}</td>
                                        <td style={{ padding: '16px', textAlign: 'right', color: '#ff6b6b', fontWeight: '600' }}>{formatCurrency(order.totalAmount)}</td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <span style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                                                <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                                Đã thanh toán
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', color: '#94a3b8', fontSize: '13px' }}>{formatDate(order.createdAt)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                                        <ShoppingCart size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                                        <p>Chưa có hóa đơn nào trong kỳ</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top Products */}
            {topProducts.length > 0 && (
                <div style={{ background: '#1a1a2e', border: '1px solid #2d2d3d', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #2d2d3d' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white' }}>🔥 Top sản phẩm bán chạy</h3>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
                                    <th style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>STT</th>
                                    <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8' }}>Tên sản phẩm</th>
                                    <th style={{ padding: '16px', textAlign: 'right', color: '#94a3b8' }}>Số lượng</th>
                                    <th style={{ padding: '16px', textAlign: 'right', color: '#94a3b8' }}>Doanh thu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.map((product, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #2d2d3d' }}>
                                        <td style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                                        <td style={{ padding: '16px', color: 'white', fontWeight: '500' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Coffee size={16} color="#ff6b6b" />
                                                {product.productName}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right', color: '#e2e8f0' }}>{product.quantity} lượt</td>
                                        <td style={{ padding: '16px', textAlign: 'right', color: '#ff6b6b', fontWeight: '600' }}>{formatCurrency(product.revenue)}</td>
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