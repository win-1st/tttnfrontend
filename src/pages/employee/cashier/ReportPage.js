// pages/employee/cashier/ReportPage.js
import React, { useState, useEffect } from "react";
import {
    Calendar, TrendingUp, DollarSign, Users, Coffee,
    Download, Filter, FileText, CreditCard, Smartphone,
    Landmark, Clock, Award, BarChart3, PieChart,
    RefreshCw, AlertCircle, CheckCircle, X
} from "lucide-react";
import * as XLSX from 'xlsx';
import axiosClient from '../../../services/axiosClient';
import ToastNotification from "./ToastNotification";
import styles from "./ReportPage.module.css";

const ReportPage = () => {
    const [reportType, setReportType] = useState('daily');
    const [dateRange, setDateRange] = useState({
        startDate: getTodayVietnam(),
        endDate: getTodayVietnam()
    });
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [toasts, setToasts] = useState([]);

    // Hàm lấy ngày hôm nay theo múi giờ Việt Nam (UTC+7)
    function getTodayVietnam() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Hàm format date theo múi giờ Việt Nam
    function formatDateVietnam(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // Hàm hiển thị toast
    const showToast = (message, type = "info", duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, duration);
    };

    // Kiểm tra token
    const checkToken = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Vui lòng đăng nhập lại', 'error');
            setTimeout(() => window.location.href = '/login', 1500);
            return false;
        }
        return true;
    };

    useEffect(() => {
        if (reportType !== 'custom') {
            fetchReport();
        }
    }, [reportType]);

    const getDateRangeByType = () => {
        const today = new Date();
        const todayStr = getTodayVietnam();

        switch (reportType) {
            case 'daily':
                return {
                    startDate: todayStr,
                    endDate: todayStr
                };
            case 'weekly': {
                const dayOfWeek = today.getDay();
                const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - diff);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);

                return {
                    startDate: formatDateToString(startOfWeek),
                    endDate: formatDateToString(endOfWeek)
                };
            }
            case 'monthly': {
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                return {
                    startDate: formatDateToString(startOfMonth),
                    endDate: formatDateToString(endOfMonth)
                };
            }
            default:
                return dateRange;
        }
    };

    const formatDateToString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const fetchReport = async () => {
        if (!checkToken()) return;

        setLoading(true);
        try {
            const { startDate, endDate } = getDateRangeByType();

            console.log('📊 Fetching report from:', startDate, 'to:', endDate);

            // Sử dụng axiosClient thay vì fetch
            const response = await axiosClient.get('/bills/all');
            let allBills = [];
            if (response.data?.success && response.data?.data) {
                allBills = response.data.data;
            } else if (Array.isArray(response.data)) {
                allBills = response.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                allBills = response.data.data;
            }

            console.log(`📊 Total bills: ${allBills.length}`);

            const filteredBills = allBills.filter(bill => {
                if (!bill.createdAt) return false;
                const billDate = new Date(bill.createdAt);
                const year = billDate.getFullYear();
                const month = String(billDate.getMonth() + 1).padStart(2, '0');
                const day = String(billDate.getDate()).padStart(2, '0');
                const billDateStr = `${year}-${month}-${day}`;
                return billDateStr >= startDate && billDateStr <= endDate && bill.paymentStatus === 'PAID';
            });

            console.log(`✅ ${filteredBills.length} bills in range`);

            const totalRevenue = filteredBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
            const totalOrders = filteredBills.length;
            const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            const cashBills = filteredBills.filter(b => b.paymentMethod === 'CASH');
            const momoBills = filteredBills.filter(b => b.paymentMethod === 'MOMO');
            const bankingBills = filteredBills.filter(b => b.paymentMethod === 'BANKING' || b.paymentMethod === 'PAYOS');

            const cashRevenue = cashBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
            const momoRevenue = momoBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
            const bankingRevenue = bankingBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

            // Tính top món ăn
            const dishStats = {};
            for (const bill of filteredBills) {
                if (bill.id) {
                    try {
                        const detailResponse = await axiosClient.get(`/bills/${bill.id}`);
                        if (detailResponse.data) {
                            const items = detailResponse.data.data?.items || [];
                            for (const item of items) {
                                const dishName = item.name || item.product?.name || 'Món ăn';
                                if (!dishStats[dishName]) {
                                    dishStats[dishName] = { quantity: 0, revenue: 0 };
                                }
                                dishStats[dishName].quantity += item.quantity || 1;
                                dishStats[dishName].revenue += (item.unitPrice || item.price || 0) * (item.quantity || 1);
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

        } catch (error) {
            console.error("❌ Error fetching report:", error);

            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                showToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'error');
                setTimeout(() => window.location.href = '/login', 1500);
            } else {
                showToast("Không thể tải dữ liệu báo cáo", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    // Hàm xuất Excel
    const handleExportExcel = async () => {
        if (!checkToken()) return;

        setExporting(true);
        try {
            const { startDate, endDate } = getDateRangeByType();

            let allBills = reportData?.bills || [];
            if (!reportData?.bills) {
                const response = await axiosClient.get('/bills/all');
                if (response.data?.success && response.data?.data) {
                    allBills = response.data.data;
                } else if (Array.isArray(response.data)) {
                    allBills = response.data;
                }
            }

            const filteredBills = allBills.filter(bill => {
                if (!bill.createdAt) return false;
                const billDate = new Date(bill.createdAt);
                const year = billDate.getFullYear();
                const month = String(billDate.getMonth() + 1).padStart(2, '0');
                const day = String(billDate.getDate()).padStart(2, '0');
                const billDateStr = `${year}-${month}-${day}`;
                return billDateStr >= startDate && billDateStr <= endDate && bill.paymentStatus === 'PAID';
            });

            if (filteredBills.length === 0) {
                showToast("Không có dữ liệu để xuất trong khoảng thời gian này", "warning");
                setExporting(false);
                return;
            }

            const billsWithItems = [];
            for (const bill of filteredBills) {
                try {
                    const detailResponse = await axiosClient.get(`/bills/${bill.id}`);
                    if (detailResponse.data) {
                        billsWithItems.push({
                            ...bill,
                            items: detailResponse.data.data?.items || []
                        });
                    } else {
                        billsWithItems.push({ ...bill, items: [] });
                    }
                } catch (err) {
                    billsWithItems.push({ ...bill, items: [] });
                }
            }

            const workbook = XLSX.utils.book_new();

            // Sheet 1: Tổng hợp
            const summaryData = [
                ['BÁO CÁO DOANH THU'],
                [`Từ ngày: ${formatDateVietnam(startDate)} đến ${formatDateVietnam(endDate)}`],
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
            summarySheet['!cols'] = [{ wch: 30 }, { wch: 25 }];
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
                    formatDateTimeVietnam(bill.createdAt)
                ])
            ];
            const billsSheet = XLSX.utils.aoa_to_sheet(billsData);
            billsSheet['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 16 }, { wch: 22 }];
            XLSX.utils.book_append_sheet(workbook, billsSheet, 'Danh sách hóa đơn');

            // Sheet 3: Chi tiết món ăn
            const itemsData = [
                ['Mã HD', 'Tên món', 'Số lượng', 'Đơn giá', 'Thành tiền'],
                ...billsWithItems.flatMap(bill =>
                    bill.items.map(item => [
                        `#${bill.id}`,
                        item.name || item.product?.name || 'Món',
                        item.quantity,
                        formatCurrency(item.unitPrice || item.price),
                        formatCurrency((item.unitPrice || item.price || 0) * (item.quantity || 1))
                    ])
                )
            ];
            const itemsSheet = XLSX.utils.aoa_to_sheet(itemsData);
            itemsSheet['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 12 }, { wch: 18 }, { wch: 18 }];
            XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Chi tiết món ăn');

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
            { method: 'Tiền mặt', count: cashBills.length, revenue: formatCurrency(cashRevenue), percentage: totalRevenue > 0 ? ((cashRevenue / totalRevenue) * 100).toFixed(1) + '%' : '0%' },
            { method: 'MoMo', count: momoBills.length, revenue: formatCurrency(momoRevenue), percentage: totalRevenue > 0 ? ((momoRevenue / totalRevenue) * 100).toFixed(1) + '%' : '0%' },
            { method: 'Chuyển khoản/Thẻ', count: bankingBills.length, revenue: formatCurrency(bankingRevenue), percentage: totalRevenue > 0 ? ((bankingRevenue / totalRevenue) * 100).toFixed(1) + '%' : '0%' }
        ];
    };

    const getPaymentMethodLabel = (method) => {
        const methods = { 'CASH': 'Tiền mặt', 'MOMO': 'MoMo', 'PAYOS': 'Chuyển khoản', 'BANKING': 'Chuyển khoản' };
        return methods[method] || method;
    };

    const formatCurrency = (amount) => {
        if (!amount || amount === 0) return "0 ₫";
        return amount.toLocaleString('vi-VN') + ' ₫';
    };

    const formatDateTimeVietnam = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
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
                <h2>
                    <BarChart3 size={24} /> Báo cáo doanh thu
                </h2>
                {reportData && (
                    <button onClick={handleExportExcel} disabled={exporting} className={styles.exportBtn}>
                        <Download size={16} /> {exporting ? "Đang xuất..." : "Xuất Excel"}
                    </button>
                )}
            </div>

            <div className={styles.filterSection}>
                <div className={styles.reportTypeBtns}>
                    <button className={reportType === 'daily' ? styles.activeBtn : styles.btn} onClick={() => setReportType('daily')}>
                        <Calendar size={16} /> Hôm nay
                    </button>
                    <button className={reportType === 'weekly' ? styles.activeBtn : styles.btn} onClick={() => setReportType('weekly')}>
                        <Calendar size={16} /> Tuần này
                    </button>
                    <button className={reportType === 'monthly' ? styles.activeBtn : styles.btn} onClick={() => setReportType('monthly')}>
                        <Calendar size={16} /> Tháng này
                    </button>
                    <button className={reportType === 'custom' ? styles.activeBtn : styles.btn} onClick={() => setReportType('custom')}>
                        <Filter size={16} /> Tùy chọn
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

                {reportType !== 'custom' && reportData && (
                    <div className={styles.reportInfo}>
                        <span className={styles.dateRangeInfo}>
                            Từ {formatDateVietnam(reportData.startDate)} → {formatDateVietnam(reportData.endDate)}
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
                            <div className={styles.cardIcon} style={{ background: 'rgba(16,185,129,0.15)' }}>
                                <DollarSign size={28} color="#10B981" />
                            </div>
                            <div className={styles.cardInfo}>
                                <div className={styles.cardTitle}>Tổng doanh thu</div>
                                <div className={styles.cardValue}>{formatCurrency(reportData.totalRevenue)}</div>
                            </div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.cardIcon} style={{ background: 'rgba(59,130,246,0.15)' }}>
                                <FileText size={28} color="#3B82F6" />
                            </div>
                            <div className={styles.cardInfo}>
                                <div className={styles.cardTitle}>Số đơn hàng</div>
                                <div className={styles.cardValue}>{reportData.totalOrders}</div>
                            </div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.cardIcon} style={{ background: 'rgba(139,92,246,0.15)' }}>
                                <TrendingUp size={28} color="#8B5CF6" />
                            </div>
                            <div className={styles.cardInfo}>
                                <div className={styles.cardTitle}>TB mỗi đơn</div>
                                <div className={styles.cardValue}>{formatCurrency(reportData.averageOrderValue)}</div>
                            </div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.cardIcon} style={{ background: 'rgba(245,158,11,0.15)' }}>
                                <Users size={28} color="#F59E0B" />
                            </div>
                            <div className={styles.cardInfo}>
                                <div className={styles.cardTitle}>Khách hàng</div>
                                <div className={styles.cardValue}>{reportData.totalCustomers}</div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.paymentBreakdown}>
                        <h3>
                            <CreditCard size={20} /> Chi tiết theo hình thức thanh toán
                        </h3>
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
                                    <td>
                                        <DollarSign size={16} /> Tiền mặt
                                    </td>
                                    <td>{reportData.cashCount || 0}</td>
                                    <td>{formatCurrency(reportData.cashRevenue)}</td>
                                    <td>{reportData.totalRevenue > 0 ? ((reportData.cashRevenue / reportData.totalRevenue) * 100).toFixed(1) : 0}%</td>
                                </tr>
                                <tr>
                                    <td>
                                        <Smartphone size={16} /> MoMo
                                    </td>
                                    <td>{reportData.momoCount || 0}</td>
                                    <td>{formatCurrency(reportData.momoRevenue)}</td>
                                    <td>{reportData.totalRevenue > 0 ? ((reportData.momoRevenue / reportData.totalRevenue) * 100).toFixed(1) : 0}%</td>
                                </tr>
                                <tr>
                                    <td>
                                        <Landmark size={16} /> Chuyển khoản/Thẻ
                                    </td>
                                    <td>{reportData.bankingCount || 0}</td>
                                    <td>{formatCurrency(reportData.bankingRevenue)}</td>
                                    <td>{reportData.totalRevenue > 0 ? ((reportData.bankingRevenue / reportData.totalRevenue) * 100).toFixed(1) : 0}%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {reportData.topDishes?.length > 0 && (
                        <div className={styles.topDishes}>
                            <h3>
                                <Award size={20} color="#EF4444" /> Top món bán chạy
                            </h3>
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
                    <div className={styles.emptyIcon}>
                        <BarChart3 size={48} color="#64748B" />
                    </div>
                    <h3>Chưa có dữ liệu</h3>
                    <p>Chọn loại báo cáo để xem thống kê doanh thu</p>
                </div>
            )}
        </div>
    );
};

export default ReportPage;