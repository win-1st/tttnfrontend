// pages/admin/Dashboard.js
import React, { useEffect, useState } from 'react';
import {
    TrendingUp, DollarSign, ShoppingCart, Package, Table,
    RefreshCw, Coffee, Search, X, Award,
    Calendar, CheckCircle, Users, Clock, Percent,
    ArrowUp, ArrowDown, Minus, Printer, Eye,
    ChevronLeft, ChevronRight, Activity
} from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import ToastNotification from '../employee/cashier/ToastNotification';

export default function Dashboard() {
    // State management
    const [stats, setStats] = useState({
        totalProducts: 0,
        periodRevenue: 0,
        totalRevenue: 0,
        totalOrders: 0,
        activeTables: 0,
        totalUsers: 0,
        growthRate: 0,
        averageOrderValue: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [topCategories, setTopCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('week');
    const [searchTerm, setSearchTerm] = useState('');
    const [toasts, setToasts] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetail, setShowOrderDetail] = useState(false);
    const [recentActivity, setRecentActivity] = useState([]);

    // Pagination state for orders
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Pagination state for activities
    const [activityCurrentPage, setActivityCurrentPage] = useState(1);
    const [activityItemsPerPage, setActivityItemsPerPage] = useState(5);
    const [totalActivities, setTotalActivities] = useState(0);

    // Toast notification
    const showToast = (message, type = "info", duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, duration);
    };

    // Date range helpers
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

    const getPeriodLabel = () => {
        switch (timeRange) {
            case 'day': return 'hôm nay';
            case 'week': return 'tuần này';
            case 'month': return 'tháng này';
            case 'year': return 'năm nay';
            default: return '';
        }
    };

    const getGrowthColor = (growthRate) => {
        if (growthRate > 0) return '#10B981';
        if (growthRate < 0) return '#EF4444';
        return '#64748B';
    };

    const getGrowthIcon = (growthRate) => {
        if (growthRate > 0) return <ArrowUp size={16} color="#10B981" />;
        if (growthRate < 0) return <ArrowDown size={16} color="#EF4444" />;
        return <Minus size={16} color="#64748B" />;
    };

    // Format helpers
    const formatCurrency = (amount) => {
        if (!amount || amount === 0) return "0 ₫";
        return amount.toLocaleString('vi-VN') + ' ₫';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTimeAgo = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return formatDate(dateString);
    };

    const getTableNumber = (order) => {
        return order.tableNumber || order.table?.number || order.tableId || '-';
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'PAID': { label: 'Đã thanh toán', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
            'PENDING': { label: 'Chờ thanh toán', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
            'CANCELLED': { label: 'Đã hủy', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
            'PROCESSING': { label: 'Đang xử lý', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' }
        };
        return statusMap[status] || { label: status, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
    };

    // Pagination helpers for orders
    const getCurrentPageData = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredOrders.slice(startIndex, endIndex);
    };

    const getTotalPages = () => {
        return Math.ceil(filteredOrders.length / itemsPerPage);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        const tableElement = document.querySelector('.orders-table-container');
        if (tableElement) {
            tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    // Pagination helpers for activities
    const getCurrentActivities = () => {
        const startIndex = (activityCurrentPage - 1) * activityItemsPerPage;
        const endIndex = startIndex + activityItemsPerPage;
        return recentActivity.slice(startIndex, endIndex);
    };

    const getTotalActivityPages = () => {
        return Math.ceil(recentActivity.length / activityItemsPerPage);
    };

    const handleActivityPageChange = (page) => {
        setActivityCurrentPage(page);
    };

    const handleActivityItemsPerPageChange = (e) => {
        setActivityItemsPerPage(Number(e.target.value));
        setActivityCurrentPage(1);
    };

    // Main data fetch
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showToast('Vui lòng đăng nhập lại', 'error');
                setTimeout(() => window.location.href = '/login', 1500);
                return;
            }

            // Lấy năm hiện tại nếu timeRange là year
            const currentYear = new Date().getFullYear();
            const yearParam = timeRange === 'year' ? currentYear : null;

            console.log('🔄 Fetching dashboard data...', { timeRange, year: yearParam });

            // Gọi API dashboard overview với year
            const overviewRes = await axiosClient.get('/dashboard/overview', {
                params: {
                    timeRange: timeRange,
                    year: yearParam
                }
            });

            console.log('📊 Overview response:', overviewRes.data);

            // Gọi API order statistics với year
            const orderStatsRes = await axiosClient.get('/dashboard/orders/statistics', {
                params: {
                    timeRange: timeRange,
                    year: yearParam
                }
            });

            console.log('📊 Order stats response:', orderStatsRes.data);

            // Gọi API top products
            const topProductsRes = await axiosClient.get('/dashboard/top-products', {
                params: {
                    limit: 10,
                    timeRange: timeRange,
                    year: yearParam
                }
            });

            console.log('📊 Top products response:', topProductsRes.data);

            // Gọi API recent activities
            const activitiesRes = await axiosClient.get('/dashboard/recent-activities', {
                params: {
                    limit: 50
                }
            });

            console.log('📊 Activities response:', activitiesRes.data);

            // Gọi API table statistics
            const tablesRes = await axiosClient.get('/dashboard/tables/statistics');

            console.log('📊 Tables stats response:', tablesRes.data);

            // Lấy danh sách sản phẩm
            const productsRes = await axiosClient.get('/products');
            let totalProducts = 0;
            if (productsRes.data?.data) {
                totalProducts = Array.isArray(productsRes.data.data) ? productsRes.data.data.length : 0;
            }

            // Lấy danh sách bills để hiển thị bảng
            const billsRes = await axiosClient.get('/bills/all');
            let allBills = [];
            if (billsRes.data?.success && billsRes.data?.data) {
                allBills = billsRes.data.data;
            } else if (Array.isArray(billsRes.data)) {
                allBills = billsRes.data;
            } else if (billsRes.data?.data && Array.isArray(billsRes.data.data)) {
                allBills = billsRes.data.data;
            }

            // Filter bills theo timeRange
            const startDate = getStartDateByTimeRange();
            const endDate = getEndDateByTimeRange();

            const filteredBills = allBills.filter(bill => {
                const billDate = new Date(bill.createdAt);
                const isInRange = billDate >= startDate && billDate <= endDate;
                const isPaid = bill.paymentStatus === 'PAID';
                return isInRange && isPaid;
            });

            console.log(`✅ ${filteredBills.length} paid bills in selected period`);

            // Xử lý dữ liệu từ overview
            if (overviewRes.data?.success && overviewRes.data?.data) {
                const data = overviewRes.data.data;
                setStats(prev => ({
                    ...prev,
                    totalProducts: totalProducts,
                    periodRevenue: data.periodRevenue || 0,
                    totalRevenue: data.totalRevenue || 0,
                    totalOrders: data.totalOrders || 0,
                    activeTables: data.activeTables || 0,
                    growthRate: data.growthRate || 0,
                    averageOrderValue: data.totalOrders > 0 ? (data.periodRevenue / data.totalOrders) : 0
                }));
            }

            // Xử lý top products
            if (topProductsRes.data?.success && topProductsRes.data?.data) {
                const products = topProductsRes.data.data;
                setTopProducts(products.map(p => ({
                    productName: p.name,
                    quantity: p.soldQuantity || 0,
                    revenue: p.revenue || 0
                })));
            }

            // Xử lý recent activities
            if (activitiesRes.data?.success && activitiesRes.data?.data) {
                const activities = activitiesRes.data.data;
                setRecentActivity(activities.map(a => ({
                    ...a,
                    message: a.content,
                    time: a.time,
                    amount: 0
                })));
                setTotalActivities(activities.length);
            }

            // Xử lý order statistics để lấy thông tin đơn hàng
            if (orderStatsRes.data?.success && orderStatsRes.data?.data) {
                const data = orderStatsRes.data.data;
                // Cập nhật totalOrders từ order stats
                if (data.totalOrders !== undefined) {
                    setStats(prev => ({
                        ...prev,
                        totalOrders: data.totalOrders,
                        averageOrderValue: data.totalOrders > 0 ? (data.revenueFromPaidOrders / data.totalOrders) : 0
                    }));
                }
            }

            // Xử lý bảng bills
            const sortedBills = [...filteredBills].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setRecentOrders(sortedBills.slice(0, 100));
            setFilteredOrders(sortedBills.slice(0, 100));
            setTotalItems(sortedBills.slice(0, 100).length);
            setCurrentPage(1);

            console.log('✅ Dashboard data loaded successfully');

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

    // Search handlers
    const handleSearch = (keyword) => {
        setSearchTerm(keyword);
        if (!keyword.trim()) {
            setFilteredOrders(recentOrders);
            setTotalItems(recentOrders.length);
            setCurrentPage(1);
            return;
        }

        const lowerKeyword = keyword.toLowerCase().trim();
        const filtered = recentOrders.filter(order => {
            if (order.id && order.id.toString().includes(lowerKeyword)) return true;
            const tableNumber = getTableNumber(order);
            if (tableNumber.toString().includes(lowerKeyword)) return true;
            const total = (order.totalAmount || 0).toString();
            if (total.includes(lowerKeyword)) return true;
            return false;
        });
        setFilteredOrders(filtered);
        setTotalItems(filtered.length);
        setCurrentPage(1);
    };

    const clearSearch = () => {
        setSearchTerm('');
        setFilteredOrders(recentOrders);
        setTotalItems(recentOrders.length);
        setCurrentPage(1);
    };

    // View order detail
    const viewOrderDetail = async (order) => {
        try {
            const response = await axiosClient.get(`/bills/${order.id}`);
            if (response.data) {
                setSelectedOrder({
                    ...order,
                    items: response.data.data?.items || []
                });
                setShowOrderDetail(true);
            }
        } catch (err) {
            console.error('❌ Error fetching order detail:', err);
            showToast('Không thể tải chi tiết đơn hàng', 'error');
        }
    };

    // Print order
    const printOrder = (order) => {
        showToast(`Đang in hóa đơn #${order.id}...`, 'info');
    };

    // Load data on mount and timeRange change
    useEffect(() => {
        fetchDashboardData();
    }, [timeRange]);

    // Loading state
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                color: '#94a3b8'
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid #2d2d3d',
                    borderTop: '4px solid #ff6b6b',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '16px'
                }}></div>
                <p style={{ fontSize: '16px' }}>Đang tải dữ liệu dashboard...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // Stat cards configuration
    const statCards = [
        {
            key: 'totalRevenue',
            label: 'Tổng doanh thu',
            value: formatCurrency(stats.totalRevenue),
            icon: <DollarSign size={24} />,
            color: '#ff6b6b',
            bg: 'rgba(255,107,107,0.1)'
        },
        {
            key: 'periodRevenue',
            label: `Doanh thu ${getPeriodLabel()}`,
            value: formatCurrency(stats.periodRevenue),
            icon: <TrendingUp size={24} />,
            color: '#10B981',
            bg: 'rgba(16,185,129,0.1)',
            growth: stats.growthRate
        },
        {
            key: 'totalOrders',
            label: `Đơn hàng ${getPeriodLabel()}`,
            value: stats.totalOrders,
            icon: <ShoppingCart size={24} />,
            color: '#3B82F6',
            bg: 'rgba(59,130,246,0.1)'
        },
        {
            key: 'averageOrder',
            label: 'Trung bình/đơn',
            value: formatCurrency(stats.averageOrderValue),
            icon: <Percent size={24} />,
            color: '#8B5CF6',
            bg: 'rgba(139,92,246,0.1)'
        },
        {
            key: 'activeTables',
            label: 'Bàn đang dùng',
            value: stats.activeTables,
            icon: <Table size={24} />,
            color: '#F59E0B',
            bg: 'rgba(245,158,11,0.1)'
        },
        {
            key: 'totalProducts',
            label: 'Sản phẩm',
            value: stats.totalProducts,
            icon: <Package size={24} />,
            color: '#EC4899',
            bg: 'rgba(236,72,153,0.1)'
        }
    ];

    // Get current page data
    const currentOrders = getCurrentPageData();
    const totalPages = getTotalPages();

    // Get current activities
    const currentActivities = getCurrentActivities();
    const totalActivityPages = getTotalActivityPages();

    return (
        <div style={{ padding: '20px' }}>
            {/* Toast Container */}
            <div style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
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

            {/* Header */}
            <div style={{
                marginBottom: '32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div>
                    <h2 style={{
                        fontSize: '32px',
                        fontWeight: '800',
                        marginBottom: '8px',
                        color: '#ff6b6b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <TrendingUp size={28} /> Dashboard
                    </h2>
                    <p style={{
                        color: '#94a3b8',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <Calendar size={14} /> Tổng quan hoạt động kinh doanh
                        <span style={{ marginLeft: '8px', padding: '4px 12px', background: '#2d2d3d', borderRadius: '12px', fontSize: '12px' }}>
                            {getPeriodLabel().toUpperCase()}
                        </span>
                    </p>
                </div>
                <button
                    onClick={fetchDashboardData}
                    style={{
                        padding: '10px 20px',
                        background: '#2d2d3d',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#3d3d4d'}
                    onMouseLeave={(e) => e.target.style.background = '#2d2d3d'}
                >
                    <RefreshCw size={16} /> Làm mới
                </button>
            </div>

            {/* Growth Rate Banner */}
            {stats.growthRate !== 0 && (
                <div style={{
                    marginBottom: '24px',
                    padding: '14px 24px',
                    background: `rgba(${stats.growthRate > 0 ? '16,185,129' : '239,68,68'}, 0.08)`,
                    borderRadius: '12px',
                    border: `1px solid ${getGrowthColor(stats.growthRate)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {getGrowthIcon(stats.growthRate)}
                        <span style={{ color: '#e2e8f0' }}>
                            <strong>Tăng trưởng doanh thu:</strong>
                            <strong style={{
                                color: getGrowthColor(stats.growthRate),
                                marginLeft: '8px',
                                fontSize: '18px'
                            }}>
                                {stats.growthRate > 0 ? '+' : ''}{stats.growthRate.toFixed(1)}%
                            </strong>
                        </span>
                    </div>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                        So với {timeRange === 'day' ? 'hôm qua' : 'tuần trước'}
                    </span>
                </div>
            )}

            {/* Time Range Filter */}
            <div style={{
                marginBottom: '24px',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                background: '#1a1a2e',
                padding: '6px',
                borderRadius: '12px',
                border: '1px solid #2d2d3d',
                width: 'fit-content'
            }}>
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
                            background: timeRange === range.value ? '#ff6b6b' : 'transparent',
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
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
            }}>
                {statCards.map(card => (
                    <div key={card.key} style={{
                        background: '#1a1a2e',
                        border: '1px solid #2d2d3d',
                        borderRadius: '16px',
                        padding: '24px 20px',
                        transition: 'all 0.3s',
                        cursor: 'default'
                    }}
                        onMouseEnter={(e) => e.target.style.borderColor = card.color}
                        onMouseLeave={(e) => e.target.style.borderColor = '#2d2d3d'}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{
                                    color: '#94a3b8',
                                    fontSize: '14px',
                                    marginBottom: '8px'
                                }}>
                                    {card.label}
                                    {card.growth !== undefined && card.growth !== 0 && (
                                        <span style={{
                                            marginLeft: '8px',
                                            fontSize: '12px',
                                            color: getGrowthColor(card.growth),
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '2px'
                                        }}>
                                            {getGrowthIcon(card.growth)}
                                            {card.growth > 0 ? '+' : ''}{card.growth.toFixed(1)}%
                                        </span>
                                    )}
                                </p>
                                <h3 style={{ fontSize: '28px', fontWeight: '700', color: card.color }}>
                                    {card.value}
                                </h3>
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

            {/* Recent Orders Table with Search and Pagination */}
            <div className="orders-table-container" style={{
                background: '#1a1a2e',
                border: '1px solid #2d2d3d',
                borderRadius: '16px',
                overflow: 'hidden',
                marginBottom: '24px'
            }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #2d2d3d' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '16px'
                    }}>
                        <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <DollarSign size={20} color="#10B981" /> Hóa đơn đã thanh toán
                            <span style={{
                                fontSize: '12px',
                                background: '#2d2d3d',
                                padding: '2px 10px',
                                borderRadius: '12px',
                                color: '#94a3b8'
                            }}>
                                {filteredOrders.length}
                            </span>
                        </h3>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            flexWrap: 'wrap'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#2d2d3d',
                                borderRadius: '8px',
                                padding: '4px 12px',
                                border: '1px solid #3d3d4d'
                            }}>
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
                                        width: '200px'
                                    }}
                                />
                                {searchTerm && (
                                    <button
                                        onClick={clearSearch}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#94a3b8',
                                            padding: '4px'
                                        }}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: '#94a3b8',
                                fontSize: '13px'
                            }}>
                                <span>Hiển thị:</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={handleItemsPerPageChange}
                                    style={{
                                        background: '#2d2d3d',
                                        color: 'white',
                                        border: '1px solid #3d3d4d',
                                        borderRadius: '6px',
                                        padding: '6px 10px',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        outline: 'none'
                                    }}
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    {searchTerm && (
                        <div style={{ marginTop: '12px', fontSize: '13px', color: '#94a3b8' }}>
                            Tìm thấy <strong style={{ color: '#ff6b6b' }}>{filteredOrders.length}</strong> kết quả
                        </div>
                    )}
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>Mã HD</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>Bàn</th>
                                <th style={{ padding: '16px', textAlign: 'right', color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>Tổng tiền</th>
                                <th style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>Trạng thái</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>Thời gian</th>
                                <th style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentOrders.length > 0 ? (
                                currentOrders.map(order => {
                                    const status = getStatusBadge(order.paymentStatus);
                                    return (
                                        <tr key={order.id} style={{ borderBottom: '1px solid #2d2d3d', transition: 'background 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '16px', color: 'white', fontWeight: '500' }}>#{order.id}</td>
                                            <td style={{ padding: '16px', color: '#e2e8f0' }}>Bàn {getTableNumber(order)}</td>
                                            <td style={{ padding: '16px', textAlign: 'right', color: '#ff6b6b', fontWeight: '600' }}>
                                                {formatCurrency(order.totalAmount)}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    fontWeight: '500',
                                                    background: status.bg,
                                                    color: status.color
                                                }}>
                                                    <CheckCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px', color: '#94a3b8', fontSize: '13px' }}>{formatDate(order.createdAt)}</td>
                                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => viewOrderDetail(order)}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: '#3B82F6',
                                                            cursor: 'pointer',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => printOrder(order)}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: '#94a3b8',
                                                            cursor: 'pointer',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(148,163,184,0.1)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                        title="In hóa đơn"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                                        <ShoppingCart size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                                        <p>Chưa có hóa đơn nào trong kỳ</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination for Orders */}
                {filteredOrders.length > 0 && totalPages > 1 && (
                    <div style={{
                        padding: '16px 20px',
                        borderTop: '1px solid #2d2d3d',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}>
                        <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                            Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredOrders.length)} trong tổng số {filteredOrders.length} hóa đơn
                        </div>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                style={{
                                    padding: '6px 12px',
                                    background: currentPage === 1 ? 'transparent' : '#2d2d3d',
                                    border: '1px solid #3d3d4d',
                                    borderRadius: '6px',
                                    color: currentPage === 1 ? '#64748b' : '#e2e8f0',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <ChevronLeft size={16} />
                                Trước
                            </button>

                            <div style={{ display: 'flex', gap: '4px' }}>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            style={{
                                                padding: '6px 14px',
                                                background: currentPage === pageNum ? '#ff6b6b' : 'transparent',
                                                border: currentPage === pageNum ? 'none' : '1px solid #3d3d4d',
                                                borderRadius: '6px',
                                                color: currentPage === pageNum ? 'white' : '#e2e8f0',
                                                cursor: 'pointer',
                                                fontWeight: currentPage === pageNum ? '600' : '400',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                style={{
                                    padding: '6px 12px',
                                    background: currentPage === totalPages ? 'transparent' : '#2d2d3d',
                                    border: '1px solid #3d3d4d',
                                    borderRadius: '6px',
                                    color: currentPage === totalPages ? '#64748b' : '#e2e8f0',
                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Sau
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Two Column Layout: Top Products & Categories */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '24px',
                marginBottom: '24px'
            }}>
                {/* Top Products */}
                {topProducts.length > 0 && (
                    <div style={{ background: '#1a1a2e', border: '1px solid #2d2d3d', borderRadius: '16px', overflow: 'hidden' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #2d2d3d' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Coffee size={20} color="#ff6b6b" /> Top sản phẩm bán chạy
                            </h3>
                        </div>
                        <div style={{ padding: '16px' }}>
                            {topProducts.slice(0, 5).map((product, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    borderBottom: idx < 4 ? '1px solid #2d2d3d' : 'none'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{
                                            width: '24px',
                                            height: '24px',
                                            background: idx === 0 ? '#ff6b6b' : idx === 1 ? '#F59E0B' : idx === 2 ? '#3B82F6' : '#2d2d3d',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            color: 'white'
                                        }}>
                                            {idx + 1}
                                        </span>
                                        <span style={{ color: 'white', fontWeight: '500' }}>{product.productName}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>{product.quantity} lượt</span>
                                        <span style={{ color: '#ff6b6b', fontWeight: '600' }}>{formatCurrency(product.revenue)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Top Categories */}
                {topCategories.length > 0 && (
                    <div style={{ background: '#1a1a2e', border: '1px solid #2d2d3d', borderRadius: '16px', overflow: 'hidden' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #2d2d3d' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Award size={20} color="#8B5CF6" /> Top danh mục
                            </h3>
                        </div>
                        <div style={{ padding: '16px' }}>
                            {topCategories.map((category, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    borderBottom: idx < topCategories.length - 1 ? '1px solid #2d2d3d' : 'none'
                                }}>
                                    <span style={{ color: 'white', fontWeight: '500' }}>{category.categoryName}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>{category.count} món</span>
                                        <span style={{ color: '#8B5CF6', fontWeight: '600' }}>{formatCurrency(category.revenue)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Activity with Pagination */}
            {recentActivity.length > 0 && (
                <div style={{
                    background: '#1a1a2e',
                    border: '1px solid #2d2d3d',
                    borderRadius: '16px',
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #2d2d3d' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '12px'
                        }}>
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <Activity size={20} color="#F59E0B" /> Hoạt động gần đây
                                <span style={{
                                    fontSize: '12px',
                                    background: '#2d2d3d',
                                    padding: '2px 10px',
                                    borderRadius: '12px',
                                    color: '#94a3b8'
                                }}>
                                    {recentActivity.length}
                                </span>
                            </h3>

                            {recentActivity.length > activityItemsPerPage && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    color: '#94a3b8',
                                    fontSize: '13px'
                                }}>
                                    <span>Hiển thị:</span>
                                    <select
                                        value={activityItemsPerPage}
                                        onChange={handleActivityItemsPerPageChange}
                                        style={{
                                            background: '#2d2d3d',
                                            color: 'white',
                                            border: '1px solid #3d3d4d',
                                            borderRadius: '6px',
                                            padding: '6px 10px',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            outline: 'none'
                                        }}
                                    >
                                        <option value={3}>3</option>
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <div style={{
                            marginTop: '8px',
                            fontSize: '12px',
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <Clock size={12} />
                            <span>Hiển thị hoạt động mới nhất trước</span>
                        </div>
                    </div>

                    <div style={{ padding: '16px' }}>
                        {currentActivities.length > 0 ? (
                            currentActivities.map((activity, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    borderBottom: idx < currentActivities.length - 1 ? '1px solid #2d2d3d' : 'none',
                                    transition: 'background 0.2s',
                                    borderRadius: '8px'
                                }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            background: 'rgba(16,185,129,0.1)',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <ShoppingCart size={18} color="#10B981" />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                color: '#e2e8f0',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {activity.message}
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '16px',
                                                marginTop: '4px',
                                                flexWrap: 'wrap'
                                            }}>
                                                <span style={{
                                                    color: '#94a3b8',
                                                    fontSize: '12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <Clock size={12} />
                                                    {formatTimeAgo(activity.time)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{
                                padding: '40px',
                                textAlign: 'center',
                                color: '#64748b'
                            }}>
                                <Activity size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                                <p>Chưa có hoạt động nào</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination for Activities */}
                    {recentActivity.length > 0 && totalActivityPages > 1 && (
                        <div style={{
                            padding: '12px 20px',
                            borderTop: '1px solid #2d2d3d',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '12px'
                        }}>
                            <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                                Hiển thị {((activityCurrentPage - 1) * activityItemsPerPage) + 1} - {Math.min(activityCurrentPage * activityItemsPerPage, recentActivity.length)} trong tổng số {recentActivity.length} hoạt động
                            </div>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <button
                                    onClick={() => handleActivityPageChange(activityCurrentPage - 1)}
                                    disabled={activityCurrentPage === 1}
                                    style={{
                                        padding: '6px 12px',
                                        background: activityCurrentPage === 1 ? 'transparent' : '#2d2d3d',
                                        border: '1px solid #3d3d4d',
                                        borderRadius: '6px',
                                        color: activityCurrentPage === 1 ? '#64748b' : '#e2e8f0',
                                        cursor: activityCurrentPage === 1 ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <ChevronLeft size={16} />
                                    Trước
                                </button>

                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {Array.from({ length: Math.min(5, totalActivityPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalActivityPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (activityCurrentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (activityCurrentPage >= totalActivityPages - 2) {
                                            pageNum = totalActivityPages - 4 + i;
                                        } else {
                                            pageNum = activityCurrentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handleActivityPageChange(pageNum)}
                                                style={{
                                                    padding: '6px 14px',
                                                    background: activityCurrentPage === pageNum ? '#ff6b6b' : 'transparent',
                                                    border: activityCurrentPage === pageNum ? 'none' : '1px solid #3d3d4d',
                                                    borderRadius: '6px',
                                                    color: activityCurrentPage === pageNum ? 'white' : '#e2e8f0',
                                                    cursor: 'pointer',
                                                    fontWeight: activityCurrentPage === pageNum ? '600' : '400',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => handleActivityPageChange(activityCurrentPage + 1)}
                                    disabled={activityCurrentPage === totalActivityPages}
                                    style={{
                                        padding: '6px 12px',
                                        background: activityCurrentPage === totalActivityPages ? 'transparent' : '#2d2d3d',
                                        border: '1px solid #3d3d4d',
                                        borderRadius: '6px',
                                        color: activityCurrentPage === totalActivityPages ? '#64748b' : '#e2e8f0',
                                        cursor: activityCurrentPage === totalActivityPages ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Sau
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Order Detail Modal */}
            {showOrderDetail && selectedOrder && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }} onClick={() => setShowOrderDetail(false)}>
                    <div style={{
                        background: '#1a1a2e',
                        borderRadius: '16px',
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        padding: '24px',
                        border: '1px solid #2d2d3d'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'white' }}>
                                Chi tiết đơn hàng #{selectedOrder.id}
                            </h3>
                            <button
                                onClick={() => setShowOrderDetail(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <div>
                                <span style={{ color: '#94a3b8', fontSize: '13px' }}>Bàn:</span>
                                <span style={{ color: 'white', marginLeft: '8px', fontWeight: '500' }}>
                                    {getTableNumber(selectedOrder)}
                                </span>
                            </div>
                            <div>
                                <span style={{ color: '#94a3b8', fontSize: '13px' }}>Trạng thái:</span>
                                <span style={{
                                    marginLeft: '8px',
                                    padding: '2px 10px',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    background: getStatusBadge(selectedOrder.paymentStatus).bg,
                                    color: getStatusBadge(selectedOrder.paymentStatus).color
                                }}>
                                    {getStatusBadge(selectedOrder.paymentStatus).label}
                                </span>
                            </div>
                            <div>
                                <span style={{ color: '#94a3b8', fontSize: '13px' }}>Thời gian:</span>
                                <span style={{ color: '#e2e8f0', marginLeft: '8px' }}>
                                    {formatDate(selectedOrder.createdAt)}
                                </span>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #2d2d3d', paddingTop: '16px', marginTop: '8px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
                                        <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8', fontSize: '13px' }}>Món</th>
                                        <th style={{ padding: '8px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>SL</th>
                                        <th style={{ padding: '8px', textAlign: 'right', color: '#94a3b8', fontSize: '13px' }}>Đơn giá</th>
                                        <th style={{ padding: '8px', textAlign: 'right', color: '#94a3b8', fontSize: '13px' }}>Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(selectedOrder.items || []).map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #2d2d3d' }}>
                                            <td style={{ padding: '8px', color: 'white' }}>{item.name || item.productName}</td>
                                            <td style={{ padding: '8px', textAlign: 'center', color: '#e2e8f0' }}>{item.quantity}</td>
                                            <td style={{ padding: '8px', textAlign: 'right', color: '#94a3b8' }}>
                                                {formatCurrency(item.unitPrice || item.price)}
                                            </td>
                                            <td style={{ padding: '8px', textAlign: 'right', color: '#ff6b6b', fontWeight: '500' }}>
                                                {formatCurrency((item.unitPrice || item.price || 0) * (item.quantity || 1))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan="3" style={{ padding: '12px 8px', textAlign: 'right', color: '#e2e8f0', fontWeight: '600' }}>
                                            Tổng cộng:
                                        </td>
                                        <td style={{ padding: '12px 8px', textAlign: 'right', color: '#ff6b6b', fontWeight: '700', fontSize: '18px' }}>
                                            {formatCurrency(selectedOrder.totalAmount)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => printOrder(selectedOrder)}
                                style={{
                                    padding: '10px 24px',
                                    background: '#2d2d3d',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Printer size={16} /> In hóa đơn
                            </button>
                            <button
                                onClick={() => setShowOrderDetail(false)}
                                style={{
                                    padding: '10px 24px',
                                    background: '#ff6b6b',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}