import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

            console.log('Monthly Revenue Data:', monthlyRevenueData);
            console.log('Overview Data:', overviewData);
            console.log('Order Stats Data:', orderStatsData);

            // 1. Xử lý dữ liệu doanh thu theo tháng
            const monthNames = ['Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6', 'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'];
            const processedData = [];

            if (monthlyRevenueData.success && monthlyRevenueData.data) {
                const monthlyData = monthlyRevenueData.data;

                for (let i = 1; i <= 12; i++) {
                    const monthKey = `${String(i).padStart(2, '0')}/${selectedYear}`;
                    let revenue = monthlyData[monthKey] || 0;

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

            // Lấy 6 tháng gần nhất
            const currentMonth = new Date().getMonth() + 1;
            let last6Months = [];
            if (selectedYear === currentYear) {
                last6Months = processedData.slice(0, currentMonth);
            } else {
                last6Months = processedData.slice(-6);
            }

            setRevenueData(last6Months);

            // 2. Xử lý tổng quan
            if (overviewData.success && overviewData.data) {
                setTotalRevenue(overviewData.data.totalRevenue || 0);
                setTotalOrders(overviewData.data.totalOrders || 0);
                setComparisonPercent(prev => ({
                    ...prev,
                    revenue: overviewData.data.growthRate || 0,
                    orders: overviewData.data.ordersGrowth || 0
                }));
            }

            // 3. Xử lý thống kê đơn hàng cho biểu đồ tròn
            if (orderStatsData.success && orderStatsData.data) {
                const stats = orderStatsData.data;

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
            }

        } catch (err) {
            console.error('Lỗi khi lấy dữ liệu báo cáo:', err);
            setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau!');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        if (!value || value === 0) return '0đ';
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
                    <p>Đang tải báo cáo...</p>
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
                        letterSpacing: '-0.5px'
                    }}>
                        Phân tích doanh thu và đơn hàng
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                        Phân tích doanh thu và đơn hàng
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
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
                                Tổng doanh thu ({selectedYear})
                            </p>
                            <h3 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--color-primary)' }}>
                                {formatCurrency(totalRevenue)}
                            </h3>
                            <p style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: comparisonPercent.revenue >= 0 ? '#10B981' : '#EF4444', fontWeight: '600' }}>
                                <TrendingUp size={14} />
                                {comparisonPercent.revenue >= 0 ? '+' : ''}{comparisonPercent.revenue}% so với năm trước
                            </p>
                        </div>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: 'rgba(212, 175, 55, 0.1)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <DollarSign size={24} color="var(--color-primary)" />
                        </div>
                    </div>
                </div>

                <div className={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
                                Tổng đơn hàng ({selectedYear})
                            </p>
                            <h3 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' }}>
                                {formatNumber(totalOrders)}
                            </h3>
                            <p style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: comparisonPercent.orders >= 0 ? '#10B981' : '#EF4444', fontWeight: '600' }}>
                                <TrendingUp size={14} />
                                {comparisonPercent.orders >= 0 ? '+' : ''}{comparisonPercent.orders}% so với năm trước
                            </p>
                        </div>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <ShoppingCart size={24} color="#3B82F6" />
                        </div>
                    </div>
                </div>

                <div className={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
                                Giá trị TB/Đơn
                            </p>
                            <h3 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' }}>
                                {formatCurrency(avgOrderValue)}
                            </h3>
                            <p style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: comparisonPercent.avgValue >= 0 ? '#10B981' : '#EF4444', fontWeight: '600' }}>
                                <TrendingUp size={14} />
                                {comparisonPercent.avgValue >= 0 ? '+' : ''}{comparisonPercent.avgValue}% so với năm trước
                            </p>
                        </div>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: 'rgba(139, 92, 246, 0.1)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <BarChart3 size={24} color="#8B5CF6" />
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
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                            Doanh thu 6 tháng gần đây
                        </h3>
                        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                            Theo dõi xu hướng doanh thu
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
                            <p>Không có dữ liệu doanh thu cho năm {selectedYear}</p>
                        </div>
                    )}
                </div>

                {/* Order Status Pie Chart */}
                <div className={styles.card}>
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                            Đơn hàng theo trạng thái
                        </h3>
                        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                            Phân bổ trạng thái đơn hàng
                        </p>
                    </div>
                    {orderStatusData.length > 0 ? (
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
                        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
                            Không có dữ liệu đơn hàng cho năm {selectedYear}
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