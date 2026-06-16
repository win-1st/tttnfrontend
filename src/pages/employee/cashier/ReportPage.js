// pages/employee/cashier/ReportPage.js
import React, { useState, useEffect } from "react";
import { Calendar, TrendingUp, DollarSign, Users, Coffee, Download, Filter } from "lucide-react";
import * as XLSX from 'xlsx';
import ToastNotification from "./ToastNotification";
import styles from "./ReportPage.module.css";

const ReportPage = () => {
    const [reportType, setReportType] = useState('daily');
    const [dateRange, setDateRange] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [toasts, setToasts] = useState([]);

    // Hàm hiển thị toast
    const showToast = (message, type = "info", duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, duration);
    };

    useEffect(() => {
        if (reportType !== 'custom') {
            fetchReport();
        }
    }, [reportType]);

    const getDateRangeByType = () => {
        const today = new Date();
        switch (reportType) {
            case 'daily':
                return {
                    startDate: today.toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0]
                };
            case 'weekly': {
                const startOfWeek = new Date(today);
                const day = today.getDay();
                const diff = day === 0 ? 6 : day - 1;
                startOfWeek.setDate(today.getDate() - diff);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                return {
                    startDate: startOfWeek.toISOString().split('T')[0],
                    endDate: endOfWeek.toISOString().split('T')[0]
                };
            }
            case 'monthly': {
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                return {
                    startDate: startOfMonth.toISOString().split('T')[0],
                    endDate: endOfMonth.toISOString().split('T')[0]
                };
            }
            default:
                return dateRange;
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const { startDate, endDate } = getDateRangeByType();

            const response = await fetch(`http://localhost:8080/api/bills/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();
                let allBills = result.data || [];

                const filteredBills = allBills.filter(bill => {
                    const billDate = new Date(bill.createdAt).toISOString().split('T')[0];
                    return billDate >= startDate && billDate <= endDate && bill.paymentStatus === 'PAID';
                });

                const totalRevenue = filteredBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
                const totalOrders = filteredBills.length;
                const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

                const cashBills = filteredBills.filter(b => b.paymentMethod === 'CASH');
                const momoBills = filteredBills.filter(b => b.paymentMethod === 'MOMO');
                const bankingBills = filteredBills.filter(b => b.paymentMethod === 'BANKING' || b.paymentMethod === 'PAYOS');

                const cashRevenue = cashBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
                const momoRevenue = momoBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
                const bankingRevenue = bankingBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

                const dishStats = {};
                for (const bill of filteredBills) {
                    if (bill.orderId) {
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
                }

                const topDishes = Object.entries(dishStats)
                    .map(([name, stats]) => ({ name, quantity: stats.quantity, revenue: stats.revenue }))
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 5);

                setReportData({
                    totalRevenue,
                    totalOrders,
                    averageOrderValue,
                    totalCustomers: filteredBills.length,
                    cashCount: cashBills.length,
                    cashRevenue,
                    momoCount: momoBills.length,
                    momoRevenue,
                    bankingCount: bankingBills.length,
                    bankingRevenue,
                    topDishes,
                    startDate,
                    endDate,
                    bills: filteredBills
                });
            }
        } catch (error) {
            console.error("Error fetching report:", error);
            showToast("Không thể tải dữ liệu báo cáo", "error");
        } finally {
            setLoading(false);
        }
    };

    // Hàm xuất Excel mà không cần backend
    const handleExportExcel = async () => {
        setExporting(true);
        try {
            const token = localStorage.getItem('token');
            const { startDate, endDate } = getDateRangeByType();

            // Lấy lại danh sách bills (nếu chưa có)
            let allBills = reportData?.bills || [];
            if (!reportData?.bills) {
                const response = await fetch(`http://localhost:8080/api/bills/all`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const result = await response.json();
                    allBills = result.data || [];
                }
            }

            const filteredBills = allBills.filter(bill => {
                const billDate = new Date(bill.createdAt).toISOString().split('T')[0];
                return billDate >= startDate && billDate <= endDate && bill.paymentStatus === 'PAID';
            });

            if (filteredBills.length === 0) {
                showToast("Không có dữ liệu để xuất trong khoảng thời gian này", "warning");
                setExporting(false);
                return;
            }

            // Lấy chi tiết items cho từng bill
            const billsWithItems = [];
            for (const bill of filteredBills) {
                const detailResponse = await fetch(`http://localhost:8080/api/bills/${bill.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (detailResponse.ok) {
                    const detailResult = await detailResponse.json();
                    billsWithItems.push({
                        ...bill,
                        items: detailResult.data?.items || []
                    });
                } else {
                    billsWithItems.push({ ...bill, items: [] });
                }
            }

            // ========== TẠO FILE EXCEL ==========
            const workbook = XLSX.utils.book_new();

            // Sheet 1: Tổng hợp doanh thu
            const summaryData = [
                ['BÁO CÁO DOANH THU'],
                [`Từ ngày: ${formatDate(startDate)} đến ${formatDate(endDate)}`],
                [],
                ['CHỈ TIÊU', 'GIÁ TRỊ'],
                ['Tổng doanh thu', formatCurrency(reportData?.totalRevenue || calculateTotalRevenue(filteredBills))],
                ['Số đơn hàng', reportData?.totalOrders || filteredBills.length],
                ['Trung bình mỗi đơn', formatCurrency((reportData?.totalRevenue || calculateTotalRevenue(filteredBills)) / (reportData?.totalOrders || filteredBills.length) || 0)],
                ['Số khách hàng', reportData?.totalCustomers || filteredBills.length],
                [],
                ['THỐNG KÊ THEO PHƯƠNG THỨC'],
                ['Phương thức', 'Số lượng', 'Doanh thu', 'Tỷ lệ'],
                ...getPaymentStats(filteredBills).map(s => [s.method, s.count, s.revenue, s.percentage]),
                [],
                ['TOP MÓN BÁN CHẠY'],
                ['STT', 'Tên món', 'Số lượng', 'Doanh thu'],
                ...(reportData?.topDishes || []).map((dish, idx) => [idx + 1, dish.name, dish.quantity, dish.revenue])
            ];

            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
            summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng hợp');

            // Sheet 2: Danh sách hóa đơn
            const billsData = [
                ['Mã HD', 'Bàn', 'Tổng tiền', 'Phương thức', 'Trạng thái', 'Thời gian'],
                ...filteredBills.map(bill => [
                    `#${bill.id}`,
                    `Bàn ${bill.tableNumber || bill.table?.number || '--'}`,
                    formatCurrency(bill.totalAmount),
                    getPaymentMethodLabel(bill.paymentMethod),
                    bill.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán',
                    formatDateTime(bill.createdAt)
                ])
            ];
            const billsSheet = XLSX.utils.aoa_to_sheet(billsData);
            billsSheet['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 14 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(workbook, billsSheet, 'Danh sách hóa đơn');

            // Sheet 3: Chi tiết món ăn
            const itemsData = [
                ['Mã HD', 'Tên món', 'Số lượng', 'Đơn giá', 'Thành tiền'],
                ...billsWithItems.flatMap(bill =>
                    bill.items.map(item => [
                        `#${bill.id}`,
                        item.name || item.product?.name,
                        item.quantity,
                        formatCurrency(item.unitPrice || item.price),
                        formatCurrency((item.unitPrice || item.price) * item.quantity)
                    ])
                )
            ];
            const itemsSheet = XLSX.utils.aoa_to_sheet(itemsData);
            itemsSheet['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 15 }];
            XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Chi tiết món ăn');

            // Xuất file
            XLSX.writeFile(workbook, `bao_cao_doanh_thu_${startDate}_den_${endDate}.xlsx`);

            showToast("Xuất báo cáo thành công!", "success");
        } catch (error) {
            console.error("Error exporting report:", error);
            showToast("Có lỗi khi xuất báo cáo", "error");
        } finally {
            setExporting(false);
        }
    };

    const calculateTotalRevenue = (bills) => {
        return bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    };

    const getPaymentStats = (bills) => {
        const cashBills = bills.filter(b => b.paymentMethod === 'CASH');
        const momoBills = bills.filter(b => b.paymentMethod === 'MOMO');
        const bankingBills = bills.filter(b => b.paymentMethod === 'BANKING' || b.paymentMethod === 'PAYOS');
        const totalRevenue = calculateTotalRevenue(bills);
        const cashRevenue = calculateTotalRevenue(cashBills);
        const momoRevenue = calculateTotalRevenue(momoBills);
        const bankingRevenue = calculateTotalRevenue(bankingBills);

        return [
            { method: '💵 Tiền mặt', count: cashBills.length, revenue: formatCurrency(cashRevenue), percentage: totalRevenue > 0 ? ((cashRevenue / totalRevenue) * 100).toFixed(1) + '%' : '0%' },
            { method: '📱 MoMo', count: momoBills.length, revenue: formatCurrency(momoRevenue), percentage: totalRevenue > 0 ? ((momoRevenue / totalRevenue) * 100).toFixed(1) + '%' : '0%' },
            { method: '💳 Chuyển khoản/Thẻ', count: bankingBills.length, revenue: formatCurrency(bankingRevenue), percentage: totalRevenue > 0 ? ((bankingRevenue / totalRevenue) * 100).toFixed(1) + '%' : '0%' }
        ];
    };

    const getPaymentMethodLabel = (method) => {
        const methods = { 'CASH': 'Tiền mặt', 'MOMO': 'MoMo', 'PAYOS': 'Chuyển khoản' };
        return methods[method] || method;
    };

    const formatCurrency = (amount) => {
        if (!amount) return "0đ";
        return amount.toLocaleString('vi-VN') + 'đ';
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleString('vi-VN');
    };

    return (
        <div className={styles.container}>
            {/* Toast Notifications */}
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

            <div className={styles.header}>
                <h2>Báo cáo doanh thu</h2>
                {reportData && (
                    <button onClick={handleExportExcel} disabled={exporting} className={styles.exportBtn}>
                        <Download size={16} /> {exporting ? "Đang xuất..." : "Xuất Excel"}
                    </button>
                )}
            </div>

            <div className={styles.filterSection}>
                <div className={styles.reportTypeBtns}>
                    <button className={reportType === 'daily' ? styles.activeBtn : styles.btn} onClick={() => setReportType('daily')}>
                        Hôm nay
                    </button>
                    <button className={reportType === 'weekly' ? styles.activeBtn : styles.btn} onClick={() => setReportType('weekly')}>
                        Tuần này
                    </button>
                    <button className={reportType === 'monthly' ? styles.activeBtn : styles.btn} onClick={() => setReportType('monthly')}>
                        Tháng này
                    </button>
                    <button className={reportType === 'custom' ? styles.activeBtn : styles.btn} onClick={() => setReportType('custom')}>
                        Tùy chọn
                    </button>
                </div>

                {reportType === 'custom' && (
                    <div className={styles.dateRange}>
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            className={styles.dateInput}
                        />
                        <span>→</span>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            className={styles.dateInput}
                        />
                        <button onClick={fetchReport} className={styles.viewReportBtn}>
                            <Filter size={16} /> Xem báo cáo
                        </button>
                    </div>
                )}

                {reportType !== 'custom' && (
                    <div className={styles.reportInfo}>
                        <span className={styles.dateRangeInfo}>
                            {reportData && `Từ ${formatDate(reportData.startDate)} → ${formatDate(reportData.endDate)}`}
                        </span>
                    </div>
                )}
            </div>

            {loading && (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <span>Đang tải dữ liệu...</span>
                </div>
            )}

            {reportData && !loading && (
                <>
                    <div className={styles.summaryCards}>
                        <div className={styles.summaryCard}>
                            <div className={styles.cardIcon}>💰</div>
                            <div className={styles.cardInfo}>
                                <div className={styles.cardTitle}>Tổng doanh thu</div>
                                <div className={styles.cardValue}>{formatCurrency(reportData.totalRevenue)}</div>
                            </div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.cardIcon}>🧾</div>
                            <div className={styles.cardInfo}>
                                <div className={styles.cardTitle}>Số đơn hàng</div>
                                <div className={styles.cardValue}>{reportData.totalOrders}</div>
                            </div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.cardIcon}>📊</div>
                            <div className={styles.cardInfo}>
                                <div className={styles.cardTitle}>TB mỗi đơn</div>
                                <div className={styles.cardValue}>{formatCurrency(reportData.averageOrderValue)}</div>
                            </div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.cardIcon}>👥</div>
                            <div className={styles.cardInfo}>
                                <div className={styles.cardTitle}>Khách hàng</div>
                                <div className={styles.cardValue}>{reportData.totalCustomers}</div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.paymentBreakdown}>
                        <h3>Chi tiết theo hình thức thanh toán</h3>
                        <table className={styles.breakdownTable}>
                            <thead>
                                <tr>
                                    <th>Phương thức</th>
                                    <th>Số lượng</th>
                                    <th>Doanh thu</th>
                                    <th>Tỷ lệ</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>💵 Tiền mặt</td>
                                    <td>{reportData.cashCount || 0}</td>
                                    <td>{formatCurrency(reportData.cashRevenue)}</td>
                                    <td>{reportData.totalRevenue > 0 ? ((reportData.cashRevenue / reportData.totalRevenue) * 100).toFixed(1) : 0}%</td>
                                </tr>
                                <tr>
                                    <td>📱 MoMo</td>
                                    <td>{reportData.momoCount || 0}</td>
                                    <td>{formatCurrency(reportData.momoRevenue)}</td>
                                    <td>{reportData.totalRevenue > 0 ? ((reportData.momoRevenue / reportData.totalRevenue) * 100).toFixed(1) : 0}%</td>
                                </tr>
                                <tr>
                                    <td>💳 Chuyển khoản/Thẻ</td>
                                    <td>{reportData.bankingCount || 0}</td>
                                    <td>{formatCurrency(reportData.bankingRevenue)}</td>
                                    <td>{reportData.totalRevenue > 0 ? ((reportData.bankingRevenue / reportData.totalRevenue) * 100).toFixed(1) : 0}%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {reportData.topDishes?.length > 0 && (
                        <div className={styles.topDishes}>
                            <h3>🔥 Top món bán chạy</h3>
                            <div className={styles.dishesList}>
                                {reportData.topDishes.map((dish, idx) => (
                                    <div key={idx} className={styles.dishItem}>
                                        <span className={styles.dishRank}>#{idx + 1}</span>
                                        <span className={styles.dishName}>{dish.name}</span>
                                        <span className={styles.dishQuantity}>{dish.quantity} lượt</span>
                                        <span className={styles.dishRevenue}>{formatCurrency(dish.revenue)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {!loading && !reportData && reportType !== 'custom' && (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📊</div>
                    <h3>Chưa có dữ liệu</h3>
                    <p>Chọn loại báo cáo để xem thống kê doanh thu</p>
                </div>
            )}
        </div>
    );
};

export default ReportPage;