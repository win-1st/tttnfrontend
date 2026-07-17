import React, { useEffect, useState } from 'react';
import {
    BarChart3, TrendingUp, DollarSign, ShoppingCart, Download,
    RefreshCw, AlertCircle, Calendar, Package, PieChart as PieChartIcon,
    FileText, Percent, Users, Clock,
} from 'lucide-react';
import {
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart
} from 'recharts';
import styles from '../../layouts/AdminLayout.module.css';

export default function Reports() {
    const [loading, setLoading] = useState(true);
    const [revenueData, setRevenueData] = useState([]);
    const [orderStatusData, setOrderStatusData] = useState([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalOrders, setTotalOrders] = useState(0);
    const [avgOrderValue, setAvgOrderValue] = useState(0);
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [comparisonPercent, setComparisonPercent] = useState({ revenue: 0, orders: 0, avgValue: 0 });
    const [error, setError] = useState(null);

    const API_BASE_URL = 'http://localhost:8080';

    const getYearOptions = () => {
        const years = [];
        const startYear = 2020;
        const endYear = currentYear + 1;
        for (let year = startYear; year <= endYear; year++) {
            years.push(year);
        }
        return years.reverse();
    };

    useEffect(() => {
        fetchReportData();
    }, [selectedYear]);

    const fetchReportData = async () => {
        const token = localStorage.getItem('token');
        setLoading(true);
        setError(null);

        try {
            console.log(`📊 Fetching data for year: ${selectedYear}`);

            // Gọi API với tham số year và timeRange=year
            const [monthlyRevenueRes, overviewRes, orderStatsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/dashboard/revenue/monthly?year=${selectedYear}`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                }),
                fetch(`${API_BASE_URL}/api/dashboard/overview?timeRange=year&year=${selectedYear}`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                }),
                fetch(`${API_BASE_URL}/api/dashboard/orders/statistics?timeRange=year&year=${selectedYear}`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                })
            ]);

            const monthlyRevenueData = await monthlyRevenueRes.json();
            const overviewData = await overviewRes.json();
            const orderStatsData = await orderStatsRes.json();

            console.log('📊 Monthly Revenue Data:', monthlyRevenueData);
            console.log('📊 Overview Data:', overviewData);
            console.log('📊 Order Stats Data:', orderStatsData);

            // Xử lý dữ liệu doanh thu tháng
            const monthNames = ['Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6', 'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'];
            const processedData = [];

            // Kiểm tra xem có dữ liệu không
            let hasData = false;

            if (monthlyRevenueData.success && monthlyRevenueData.data) {
                const monthlyData = monthlyRevenueData.data;

                for (let i = 1; i <= 12; i++) {
                    const monthKey = `${String(i).padStart(2, '0')}/${selectedYear}`;
                    let revenue = monthlyData[monthKey] || 0;

                    if (revenue > 0) hasData = true;

                    processedData.push({
                        month: monthNames[i - 1],
                        monthFull: `${monthNames[i - 1]} ${selectedYear}`,
                        revenue: revenue,
                        monthIndex: i
                    });
                }
            } else {
                for (let i = 1; i <= 12; i++) {
                    processedData.push({
                        month: monthNames[i - 1],
                        monthFull: `${monthNames[i - 1]} ${selectedYear}`,
                        revenue: 0,
                        monthIndex: i
                    });
                }
            }

            // Nếu không có dữ liệu, hiển thị thông báo
            if (!hasData) {
                console.log(`⚠️ No revenue data for year ${selectedYear}`);
            }

            // Lấy 6 tháng gần đây (có dữ liệu hoặc 6 tháng cuối năm)
            let last6Months = [];
            if (selectedYear === currentYear) {
                // Năm hiện tại: lấy các tháng đã qua
                const currentMonth = new Date().getMonth() + 1;
                last6Months = processedData.slice(0, currentMonth);
            } else {
                // Năm khác: lấy 6 tháng cuối năm
                last6Months = processedData.slice(-6);
            }

            setRevenueData(last6Months);

            // Xử lý dữ liệu tổng quan
            if (overviewData.success && overviewData.data) {
                const revenue = overviewData.data.totalRevenue || 0;
                const orders = overviewData.data.totalOrders || 0;

                console.log(`💰 Revenue for ${selectedYear}: ${revenue}`);
                console.log(`📦 Orders for ${selectedYear}: ${orders}`);

                setTotalRevenue(revenue);
                setTotalOrders(orders);
                setComparisonPercent(prev => ({
                    ...prev,
                    revenue: overviewData.data.growthRate || 0,
                    orders: overviewData.data.ordersGrowth || 0
                }));
            } else {
                setTotalRevenue(0);
                setTotalOrders(0);
                setComparisonPercent({ revenue: 0, orders: 0, avgValue: 0 });
            }

            // Xử lý thống kê trạng thái đơn hàng
            if (orderStatsData.success && orderStatsData.data) {
                const stats = orderStatsData.data;

                // Tính giá trị trung bình
                const avgValue = stats.totalOrders > 0 ? (stats.revenueFromPaidOrders || totalRevenue) / stats.totalOrders : 0;
                setAvgOrderValue(avgValue);

                const statusData = [];

                if (stats.paidOrders > 0) {
                    statusData.push({
                        name: 'Đã thanh toán',
                        value: stats.paidOrders,
                        color: '#10B981'
                    });
                }

                if (stats.openOrders > 0) {
                    statusData.push({
                        name: 'Đang mở',
                        value: stats.openOrders,
                        color: '#F59E0B'
                    });
                }

                if (stats.waitingPaymentOrders > 0) {
                    statusData.push({
                        name: 'Chờ thanh toán',
                        value: stats.waitingPaymentOrders,
                        color: '#FBBF24'
                    });
                }

                if (stats.cancelledOrders > 0) {
                    statusData.push({
                        name: 'Đã hủy',
                        value: stats.cancelledOrders,
                        color: '#EF4444'
                    });
                }

                setOrderStatusData(statusData);
            } else {
                setOrderStatusData([]);
                setAvgOrderValue(0);
            }

        } catch (err) {
            console.error('❌ Lỗi khi lấy dữ liệu báo cáo:', err);
            setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau!');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        if (!value || value === 0) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatNumber = (value) => {
        if (!value || value === 0) return '0';
        return new Intl.NumberFormat('vi-VN').format(value);
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    <p style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-primary)' }}>
                        {label}
                    </p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color, fontSize: '14px', margin: '4px 0' }}>
                            {entry.name}: {entry.name === 'Doanh thu' ? formatCurrency(entry.value) : formatNumber(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const handleExportReport = () => {
        const csvRows = [];
        csvRows.push(['Báo cáo doanh thu năm', selectedYear]);
        csvRows.push(['Ngày xuất', new Date().toLocaleString('vi-VN')]);
        csvRows.push([]);
        csvRows.push(['Tổng doanh thu', formatCurrency(totalRevenue)]);
        csvRows.push(['Tổng đơn hàng', totalOrders]);
        csvRows.push(['Giá trị trung bình/đơn', formatCurrency(avgOrderValue)]);
        csvRows.push([]);
        csvRows.push(['Tháng', 'Doanh thu']);

        revenueData.forEach(item => {
            csvRows.push([item.monthFull || item.month, item.revenue]);
        });

        csvRows.push([]);
        csvRows.push(['Trạng thái đơn hàng', 'Số lượng', 'Tỷ lệ']);

        const totalOrdersCount = orderStatusData.reduce((sum, item) => sum + item.value, 0);
        orderStatusData.forEach(item => {
            const percentage = totalOrdersCount > 0 ? ((item.value / totalOrdersCount) * 100).toFixed(1) : 0;
            csvRows.push([item.name, item.value, `${percentage}%`]);
        });

        const csvContent = csvRows.map(row => row.join(',')).join('\n');
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `bao_cao_doanh_thu_${selectedYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '400px',
                color: 'var(--color-text-secondary)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid var(--color-border)',
                        borderTop: '4px solid var(--color-primary)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }}></div>
                    <p>Đang tải báo cáo năm {selectedYear}...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '400px',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <AlertCircle size={48} color="#EF4444" />
                <p style={{ color: '#EF4444' }}>{error}</p>
                <button
                    onClick={fetchReportData}
                    style={{
                        padding: '10px 20px',
                        background: 'var(--color-primary)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    Thử lại
                </button>
            </div>
        );
    }

    const hasRevenueData = revenueData.length > 0 && revenueData.some(item => item.revenue > 0);
    const hasOrderData = orderStatusData.length > 0;

    return (
        <div>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div>
                    <h2 style={{
                        fontSize: '32px',
                        fontWeight: '800',
                        marginBottom: '8px',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <BarChart3 size={32} color="var(--color-primary)" />
                        Phân tích doanh thu và đơn hàng
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} /> Phân tích doanh thu và đơn hàng
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        style={{
                            padding: '10px 16px',
                            background: 'var(--color-bg-card)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        {getYearOptions().map(year => (
                            <option key={year} value={year}>
                                Năm {year}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={fetchReportData}
                        style={{
                            padding: '10px 20px',
                            background: 'var(--color-bg-card)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px'
                        }}
                    >
                        <RefreshCw size={16} />
                        Làm mới
                    </button>
                    <button
                        onClick={handleExportReport}
                        style={{
                            padding: '10px 20px',
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                            color: '#000',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px'
                        }}
                    >
                        <Download size={16} />
                        Xuất báo cáo
                    </button>
                </div>
            </div>

            {/* Thông báo khi không có dữ liệu */}
            {!hasRevenueData && !hasOrderData && (
                <div style={{
                    padding: '16px 20px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid #F59E0B',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#F59E0B'
                }}>
                    <AlertCircle size={20} />
                    <span>Chưa có dữ liệu cho năm <strong>{selectedYear}</strong>. Vui lòng chọn năm khác hoặc tạo đơn hàng.</span>
                </div>
            )}

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
            }}>
                <div className={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <DollarSign size={14} /> Tổng doanh thu ({selectedYear})
                            </p>
                            <h3 style={{
                                fontSize: '28px',
                                fontWeight: '700',
                                margin: '0 0 8px 0',
                                color: totalRevenue > 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                            }}>
                                {formatCurrency(totalRevenue)}
                            </h3>
                            {totalRevenue > 0 ? (
                                <p style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: comparisonPercent.revenue >= 0 ? '#10B981' : '#EF4444', fontWeight: '600' }}>
                                    <TrendingUp size={14} />
                                    {comparisonPercent.revenue >= 0 ? '+' : ''}{comparisonPercent.revenue}% so với năm trước
                                </p>
                            ) : (
                                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                    Chưa có dữ liệu
                                </p>
                            )}
                        </div>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: totalRevenue > 0 ? 'rgba(212, 175, 55, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <DollarSign size={24} color={totalRevenue > 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)'} />
                        </div>
                    </div>
                </div>

                <div className={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ShoppingCart size={14} /> Tổng đơn hàng ({selectedYear})
                            </p>
                            <h3 style={{
                                fontSize: '28px',
                                fontWeight: '700',
                                margin: '0 0 8px 0',
                                color: totalOrders > 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                            }}>
                                {formatNumber(totalOrders)}
                            </h3>
                            {totalOrders > 0 ? (
                                <p style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: comparisonPercent.orders >= 0 ? '#10B981' : '#EF4444', fontWeight: '600' }}>
                                    <TrendingUp size={14} />
                                    {comparisonPercent.orders >= 0 ? '+' : ''}{comparisonPercent.orders}% so với năm trước
                                </p>
                            ) : (
                                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                    Chưa có dữ liệu
                                </p>
                            )}
                        </div>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: totalOrders > 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <ShoppingCart size={24} color={totalOrders > 0 ? '#3B82F6' : 'var(--color-text-secondary)'} />
                        </div>
                    </div>
                </div>

                <div className={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Percent size={14} /> Giá trị TB/Đơn
                            </p>
                            <h3 style={{
                                fontSize: '28px',
                                fontWeight: '700',
                                margin: '0 0 8px 0',
                                color: avgOrderValue > 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                            }}>
                                {formatCurrency(avgOrderValue)}
                            </h3>
                            {avgOrderValue > 0 ? (
                                <p style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: comparisonPercent.avgValue >= 0 ? '#10B981' : '#EF4444', fontWeight: '600' }}>
                                    <TrendingUp size={14} />
                                    {comparisonPercent.avgValue >= 0 ? '+' : ''}{comparisonPercent.avgValue}% so với năm trước
                                </p>
                            ) : (
                                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                    Chưa có dữ liệu
                                </p>
                            )}
                        </div>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: avgOrderValue > 0 ? 'rgba(139, 92, 246, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <BarChart3 size={24} color={avgOrderValue > 0 ? '#8B5CF6' : 'var(--color-text-secondary)'} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
                gap: '24px',
                marginBottom: '24px'
            }}>
                {/* Revenue Chart */}
                <div className={styles.card}>
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrendingUp size={18} color="var(--color-primary)" /> Doanh thu 6 tháng gần đây
                        </h3>
                        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                            {selectedYear === currentYear ? 'Theo dõi xu hướng doanh thu' : `Doanh thu 6 tháng cuối năm ${selectedYear}`}
                        </p>
                    </div>
                    {hasRevenueData ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis
                                    dataKey="month"
                                    stroke="var(--color-text-secondary)"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    stroke="var(--color-text-secondary)"
                                    style={{ fontSize: '12px' }}
                                    tickFormatter={(value) => formatCurrency(value)}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar
                                    dataKey="revenue"
                                    fill="url(#colorRevenue)"
                                    radius={[8, 8, 0, 0]}
                                    name="Doanh thu"
                                />
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--color-text-secondary)', gap: '8px' }}>
                            <AlertCircle size={32} />
                            <p>Không có dữ liệu doanh thu cho năm {selectedYear}</p>
                            <p style={{ fontSize: '13px' }}>Vui lòng tạo đơn hàng hoặc chọn năm khác</p>
                        </div>
                    )}
                </div>

                {/* Order Status Pie Chart */}
                <div className={styles.card}>
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <PieChartIcon size={18} color="#8B5CF6" /> Đơn hàng theo trạng thái
                        </h3>
                        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                            Phân bổ trạng thái đơn hàng
                        </p>
                    </div>
                    {hasOrderData ? (
                        <>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={orderStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => {
                                            const percentage = (percent * 100).toFixed(1);
                                            return `${name}: ${percentage}%`;
                                        }}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {orderStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                const total = orderStatusData.reduce((sum, item) => sum + item.value, 0);
                                                const percentage = ((data.value / total) * 100).toFixed(1);
                                                return (
                                                    <div style={{
                                                        background: 'var(--color-bg-card)',
                                                        border: '1px solid var(--color-border)',
                                                        borderRadius: '8px',
                                                        padding: '12px',
                                                        boxShadow: 'var(--shadow-md)'
                                                    }}>
                                                        <p style={{ fontWeight: '600', marginBottom: '4px', color: data.color }}>
                                                            {data.name}
                                                        </p>
                                                        <p style={{ fontSize: '14px', margin: '0' }}>
                                                            Số lượng: <strong>{formatNumber(data.value)}</strong>
                                                        </p>
                                                        <p style={{ fontSize: '14px', margin: '4px 0 0 0' }}>
                                                            Tỷ lệ: <strong>{percentage}%</strong>
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '24px',
                                marginTop: '16px',
                                flexWrap: 'wrap'
                            }}>
                                {orderStatusData.map((item, index) => {
                                    const total = orderStatusData.reduce((sum, i) => sum + i.value, 0);
                                    const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                                    return (
                                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '3px',
                                                background: item.color
                                            }}></div>
                                            <span style={{ fontSize: '14px' }}>
                                                {item.name}: <strong>{formatNumber(item.value)}</strong> ({percentage}%)
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--color-text-secondary)', gap: '8px' }}>
                            <AlertCircle size={32} />
                            <p>Không có dữ liệu đơn hàng cho năm {selectedYear}</p>
                            <p style={{ fontSize: '13px' }}>Vui lòng tạo đơn hàng hoặc chọn năm khác</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}