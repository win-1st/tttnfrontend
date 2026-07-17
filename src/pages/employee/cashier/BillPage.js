import React, { useState, useEffect } from "react";
import {
    Search, Filter, Eye, Printer, Calendar,
    ChevronLeft, ChevronRight, DollarSign, Download, RefreshCw,
    FileText, CreditCard, Smartphone, Landmark, Clock,
    CheckCircle, XCircle, AlertCircle, Tag, Hash,
    Receipt, ShoppingBag, User, Phone, Mail,
    Award, TrendingUp, BarChart3, PieChart,
    X, Trash2, Edit2, Plus, Minus, Wallet
} from "lucide-react";
import axiosClient from "../../../services/axiosClient";
import styles from "./BillPage.module.css";

const BillPage = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState({ status: 'all', search: '', startDate: '', endDate: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedBill, setSelectedBill] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const itemsPerPage = 10;
    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchBills();
    }, [filter, currentPage]);

    const fetchBills = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/bills/all');
            let allBills = res.data?.data || [];

            if (!Array.isArray(allBills)) {
                allBills = [];
            }

            if (filter.search) {
                allBills = allBills.filter(bill =>
                    bill.id?.toString().includes(filter.search) ||
                    bill.orderId?.toString().includes(filter.search)
                );
            }

            if (filter.status !== 'all') {
                allBills = allBills.filter(bill => bill.paymentStatus === filter.status);
            }

            if (filter.startDate) {
                allBills = allBills.filter(bill => bill.createdAt?.split('T')[0] >= filter.startDate);
            }
            if (filter.endDate) {
                allBills = allBills.filter(bill => bill.createdAt?.split('T')[0] <= filter.endDate);
            }

            allBills.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            setTotalPages(Math.ceil(allBills.length / itemsPerPage));
            const start = (currentPage - 1) * itemsPerPage;
            setBills(allBills.slice(start, start + itemsPerPage));
        } catch (error) {
            console.error("Error:", error);
            setBills([]);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return "0đ";
        return Number(amount).toLocaleString('vi-VN') + 'đ';
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "--:--";
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'PAID': { text: 'Đã thanh toán', color: '#059669', bg: '#d1fae5', icon: <CheckCircle size={14} /> },
            'PENDING': { text: 'Chờ thanh toán', color: '#d97706', bg: '#fef3c7', icon: <Clock size={14} /> },
            'CANCELLED': { text: 'Đã hủy', color: '#dc2626', bg: '#fee2e2', icon: <XCircle size={14} /> }
        };
        const s = statusMap[status] || { text: status, color: '#6b7280', bg: '#f3f4f6', icon: <AlertCircle size={14} /> };
        return (
            <span className={styles.statusBadge} style={{
                background: s.bg,
                color: s.color,
            }}>
                {s.icon} {s.text}
            </span>
        );
    };

    const getPaymentMethodLabel = (method) => {
        const methods = {
            'CASH': 'Tiền mặt',
            'MOMO': 'MoMo',
            'PAYOS': 'PayOS',
            'BANKING': 'Chuyển khoản',
            'CARD': 'Thẻ'
        };
        return methods[method] || method;
    };

    const getPaymentMethodIcon = (method) => {
        switch (method) {
            case 'CASH': return <Wallet size={16} />;
            case 'MOMO': return <Smartphone size={16} />;
            case 'PAYOS': return <Landmark size={16} />;
            case 'BANKING': return <Landmark size={16} />;
            case 'CARD': return <CreditCard size={16} />;
            default: return <CreditCard size={16} />;
        }
    };

    const getOriginalTotal = (bill) => {
        if (bill.items && bill.items.length > 0) {
            return bill.items.reduce((sum, item) => sum + ((item.unitPrice || item.price || 0) * (item.quantity || 1)), 0);
        }
        return bill.totalAmount || 0;
    };

    const getDiscountAmount = (bill) => {
        const originalTotal = getOriginalTotal(bill);
        const finalTotal = bill.totalAmount || 0;
        return originalTotal - finalTotal;
    };

    const handleViewDetail = async (bill) => {
        try {
            const res = await axiosClient.get(`/bills/${bill.id}`);
            const billData = res.data?.data || res.data;
            setSelectedBill(billData);
            setShowDetailModal(true);
        } catch (err) {
            alert('Không thể tải chi tiết');
        }
    };

    const handlePayCash = async (billId) => {
        try {
            await axiosClient.patch(`/bills/${billId}/pay-cash`);
            alert('Thanh toán thành công!');
            fetchBills();
        } catch (err) {
            alert('Thanh toán thất bại!');
        }
    };

    // ✅ HÀM IN HÓA ĐƠN - Lấy dữ liệu chi tiết trước khi in
    const printBill = async (bill) => {
        if (!bill) return;

        setIsPrinting(true);
        try {
            // Lấy chi tiết hóa đơn từ API
            const res = await axiosClient.get(`/bills/${bill.id}`);
            const billData = res.data?.data || res.data;

            // In với dữ liệu đầy đủ
            renderPrintBill(billData);
        } catch (err) {
            console.error("Lỗi lấy chi tiết hóa đơn:", err);
            // Nếu không lấy được, in với dữ liệu hiện có
            renderPrintBill(bill);
        } finally {
            setIsPrinting(false);
        }
    };

    // ✅ HÀM RENDER IN HÓA ĐƠN
    const renderPrintBill = (bill) => {
        if (!bill) return;

        const formatPrice = (price) => price ? price.toLocaleString('vi-VN') + 'đ' : '0đ';
        const items = bill.items || [];
        const tableNumber = bill.tableNumber || bill.order?.table?.number || bill.table?.number || '--';

        const billHTML = `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Hóa đơn #${bill.id}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    padding: 20px;
                    width: 300px;
                    margin: 0 auto;
                }
                .bill-container {
                    border: 1px solid #000;
                    padding: 15px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 15px;
                    border-bottom: 1px dashed #000;
                    padding-bottom: 10px;
                }
                .header h2 {
                    font-size: 18px;
                    margin-bottom: 4px;
                }
                .header p {
                    font-size: 10px;
                    color: #666;
                    margin: 2px 0;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 4px 0;
                }
                .info-row span:first-child {
                    color: #666;
                }
                .info-row span:last-child {
                    font-weight: 600;
                }
                .divider {
                    border-top: 1px dashed #000;
                    margin: 8px 0;
                }
                .items-table {
                    width: 100%;
                    margin: 8px 0;
                    border-collapse: collapse;
                }
                .items-table th {
                    text-align: left;
                    font-size: 11px;
                    border-bottom: 1px dotted #ccc;
                    padding: 4px 0;
                    color: #666;
                }
                .items-table td {
                    padding: 4px 0;
                    border-bottom: 1px dotted #eee;
                }
                .items-table td:last-child {
                    text-align: right;
                }
                .items-table .text-center {
                    text-align: center;
                }
                .total-line {
                    display: flex;
                    justify-content: space-between;
                    margin: 4px 0;
                    font-weight: 600;
                }
                .total-line .label {
                    color: #666;
                }
                .total-line .value {
                    font-weight: 700;
                }
                .grand-total {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 2px solid #000;
                    font-size: 14px;
                    font-weight: 700;
                }
                .grand-total .label {
                    font-size: 14px;
                }
                .grand-total .value {
                    font-size: 16px;
                    color: #dc2626;
                }
                .discount-line {
                    display: flex;
                    justify-content: space-between;
                    margin: 4px 0;
                    color: #16a34a;
                    font-size: 11px;
                }
                .footer {
                    text-align: center;
                    margin-top: 15px;
                    padding-top: 10px;
                    border-top: 1px dashed #000;
                    font-size: 10px;
                    color: #666;
                }
                .footer p {
                    margin: 2px 0;
                }
                .status-badge {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .status-paid {
                    background: #d1fae5;
                    color: #059669;
                }
                .status-pending {
                    background: #fef3c7;
                    color: #d97706;
                }
                .status-cancelled {
                    background: #fee2e2;
                    color: #dc2626;
                }
            </style>
        </head>
        <body>
            <div class="bill-container">
                <!-- Header -->
                <div class="header">
                    <h2>🏠 BIDA HOUSE</h2>
                    <p>123 Đường ABC, TP.HCM</p>
                    <p>Tel: 0123 456 789</p>
                </div>

                <!-- Bill Info -->
                <div class="info-row">
                    <span>Mã hóa đơn:</span>
                    <span>#${bill.id}</span>
                </div>
                <div class="info-row">
                    <span>Bàn số:</span>
                    <span><strong>${tableNumber}</strong></span>
                </div>
                <div class="info-row">
                    <span>Ngày giờ:</span>
                    <span>${formatDateTime(bill.createdAt)}</span>
                </div>
                <div class="info-row">
                    <span>Nhân viên:</span>
                    <span>${userData.fullName || userData.username || 'Nhân viên'}</span>
                </div>
                <div class="info-row">
                    <span>Trạng thái:</span>
                    <span>
                        <span class="status-badge status-${bill.paymentStatus?.toLowerCase() || 'pending'}">
                            ${bill.paymentStatus === 'PAID' ? 'ĐÃ THANH TOÁN' :
                bill.paymentStatus === 'PENDING' ? 'CHỜ THANH TOÁN' :
                    bill.paymentStatus === 'CANCELLED' ? 'ĐÃ HỦY' : bill.paymentStatus}
                        </span>
                    </span>
                </div>
                <div class="info-row">
                    <span>Phương thức:</span>
                    <span>${getPaymentMethodLabel(bill.paymentMethod)}</span>
                </div>

                <div class="divider"></div>

                <!-- Items -->
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Tên món</th>
                            <th style="text-align:center">SL</th>
                            <th style="text-align:right">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.length > 0 ? items.map(item => `
                            <tr>
                                <td>${item.product?.name || item.name || 'Món ăn'}</td>
                                <td class="text-center">×${item.quantity || 1}</td>
                                <td>${formatPrice((item.unitPrice || item.price || 0) * (item.quantity || 1))}</td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="3" style="text-align:center;color:#999;padding:10px 0;">
                                    Không có món nào
                                </td>
                            </tr>
                        `}
                    </tbody>
                </table>

                <div class="divider"></div>

                <!-- Totals -->
                <div class="total-line">
                    <span class="label">Tổng tiền món:</span>
                    <span class="value">${formatPrice(getOriginalTotal(bill))}</span>
                </div>
                ${getDiscountAmount(bill) > 0 ? `
                    <div class="discount-line">
                        <span>🎯 Khuyến mãi giảm:</span>
                        <span>-${formatPrice(getDiscountAmount(bill))}</span>
                    </div>
                ` : ''}

                <div class="grand-total">
                    <span class="label">THỰC THU</span>
                    <span class="value">${formatPrice(bill.totalAmount)}</span>
                </div>

                <!-- Footer -->
                <div class="footer">
                    <p>Cảm ơn quý khách! Hẹn gặp lại!</p>
                    <p style="font-size:9px;color:#999;margin-top:4px;">
                        Hóa đơn được tạo tự động
                    </p>
                </div>
            </div>
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(() => window.close(), 500);
                }
            </script>
        </body>
        </html>`;

        const printWindow = window.open('', '_blank', 'width=400,height=600');
        printWindow.document.write(billHTML);
        printWindow.document.close();
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h2 className={styles.pageTitle}>
                        <FileText size={28} className={styles.titleIcon} />
                        Quản lý Hóa đơn
                    </h2>
                    <p className={styles.pageSubtitle}>Quản lý và theo dõi tất cả hóa đơn của nhà hàng</p>
                </div>
                <button onClick={fetchBills} className={styles.refreshBtn} disabled={loading}>
                    <RefreshCw size={18} className={loading ? styles.spin : ''} />
                    {loading ? 'Đang tải...' : 'Làm mới'}
                </button>
            </div>

            {/* Filters */}
            <div className={styles.filterSection}>
                <div className={styles.filterRow}>
                    <div className={styles.searchWrapper}>
                        <Search size={20} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo mã hóa đơn..."
                            value={filter.search}
                            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                            className={styles.searchInput}
                        />
                    </div>
                    <select
                        value={filter.status}
                        onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                        className={styles.selectInput}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="PAID">Đã thanh toán</option>
                        <option value="PENDING">Chờ thanh toán</option>
                        <option value="CANCELLED">Đã hủy</option>
                    </select>
                    <div className={styles.dateGroup}>
                        <input
                            type="date"
                            value={filter.startDate}
                            onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                            className={styles.dateInput}
                        />
                        <span className={styles.dateSeparator}>→</span>
                        <input
                            type="date"
                            value={filter.endDate}
                            onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                            className={styles.dateInput}
                        />
                    </div>
                    {(filter.startDate || filter.endDate) && (
                        <button
                            onClick={() => setFilter({ ...filter, startDate: '', endDate: '' })}
                            className={styles.clearBtn}
                        >
                            <X size={16} /> Xóa lọc
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className={styles.tableWrapper}>
                {loading ? (
                    <div className={styles.loading}>Đang tải dữ liệu...</div>
                ) : bills.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Receipt size={64} className={styles.emptyIcon} />
                        <p className={styles.emptyText}>Không có hóa đơn nào</p>
                        <p className={styles.emptySubText}>Hóa đơn sẽ hiển thị sau khi có giao dịch</p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.tableHeader}>
                                <th><Hash size={14} /> Mã HD</th>
                                <th><Tag size={14} /> Bàn</th>
                                <th><DollarSign size={14} /> Tổng tiền</th>
                                <th><CreditCard size={14} /> Phương thức</th>
                                <th><CheckCircle size={14} /> Trạng thái</th>
                                <th><Clock size={14} /> Thời gian</th>
                                <th className={styles.thAction}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bills.map(bill => (
                                <tr key={bill.id} className={styles.tableRow}>
                                    <td className={styles.tdId}>#{bill.id}</td>
                                    <td className={styles.tdTable}>
                                        <span className={styles.tableBadge}>
                                            Bàn {bill.tableNumber || bill.order?.table?.number || bill.table?.number || '--'}
                                        </span>
                                    </td>
                                    <td className={styles.tdAmount}>{formatCurrency(bill.totalAmount)}</td>
                                    <td>
                                        <span className={styles.paymentMethod}>
                                            {getPaymentMethodIcon(bill.paymentMethod)}
                                            {getPaymentMethodLabel(bill.paymentMethod)}
                                        </span>
                                    </td>
                                    <td>{getStatusBadge(bill.paymentStatus)}</td>
                                    <td className={styles.tdTime}>{formatDateTime(bill.createdAt)}</td>
                                    <td className={styles.tdAction}>
                                        <button
                                            onClick={() => handleViewDetail(bill)}
                                            className={styles.actionBtn}
                                            title="Xem chi tiết"
                                            disabled={isPrinting}
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={() => printBill(bill)}
                                            className={`${styles.actionBtn} ${styles.actionBtnPrint}`}
                                            title="In hóa đơn"
                                            disabled={isPrinting}
                                        >
                                            {isPrinting ? <RefreshCw size={18} className={styles.spin} /> : <Printer size={18} />}
                                        </button>
                                        {bill.paymentStatus === 'PENDING' && (
                                            <button
                                                onClick={() => handlePayCash(bill.id)}
                                                className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
                                                title="Thanh toán"
                                            >
                                                <DollarSign size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={styles.pageBtn}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className={styles.pageInfo}>
                        Trang <strong>{currentPage}</strong> / {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={styles.pageBtn}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedBill && (
                <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalTitle}>
                                <Receipt size={28} className={styles.modalTitleIcon} />
                                <div>
                                    <h3 className={styles.modalTitleText}>Chi tiết Hóa đơn</h3>
                                    <span className={styles.modalTitleId}>#{selectedBill.id}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className={styles.modalCloseBtn}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className={styles.modalInfo}>
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>
                                        <Tag size={16} /> Mã đơn
                                    </span>
                                    <span className={styles.infoValue}>#{selectedBill.orderId || '--'}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>
                                        <Tag size={16} /> Bàn
                                    </span>
                                    <span className={styles.infoValue}>Bàn {selectedBill.tableNumber || '--'}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>
                                        <CreditCard size={16} /> Phương thức
                                    </span>
                                    <span className={styles.infoValue}>
                                        {getPaymentMethodIcon(selectedBill.paymentMethod)} {getPaymentMethodLabel(selectedBill.paymentMethod)}
                                    </span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>
                                        <CheckCircle size={16} /> Trạng thái
                                    </span>
                                    <span className={styles.infoValue}>
                                        {getStatusBadge(selectedBill.paymentStatus)}
                                    </span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>
                                        <Clock size={16} /> Thời gian
                                    </span>
                                    <span className={styles.infoValue}>{formatDateTime(selectedBill.createdAt)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Danh sách món */}
                        <div className={styles.modalItems}>
                            <h4 className={styles.itemsTitle}>
                                <ShoppingBag size={20} /> Danh sách món ăn
                            </h4>
                            {selectedBill.items && selectedBill.items.length > 0 ? (
                                <table className={styles.itemsTable}>
                                    <thead>
                                        <tr className={styles.itemsTableHeader}>
                                            <th>Tên món</th>
                                            <th className={styles.itemsThCenter}>Số lượng</th>
                                            <th className={styles.itemsThRight}>Đơn giá</th>
                                            <th className={styles.itemsThRight}>Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedBill.items.map((item, idx) => (
                                            <tr key={idx} className={styles.itemsTableRow}>
                                                <td className={styles.itemsTdName}>{item.product?.name || item.name || `Món #${idx + 1}`}</td>
                                                <td className={styles.itemsTdCenter}>× {item.quantity}</td>
                                                <td className={styles.itemsTdRight}>{formatCurrency(item.unitPrice || item.price)}</td>
                                                <td className={styles.itemsTdRight}>{formatCurrency((item.unitPrice || item.price) * item.quantity)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className={styles.noItems}>Không có món nào trong hóa đơn</p>
                            )}
                        </div>

                        {/* Tổng kết */}
                        <div className={styles.modalTotal}>
                            <div className={styles.totalRow}>
                                <span className={styles.totalLabel}>Tổng tiền món:</span>
                                <span className={styles.totalValue}>{formatCurrency(getOriginalTotal(selectedBill))}</span>
                            </div>
                            {getDiscountAmount(selectedBill) > 0 && (
                                <div className={styles.totalRow}>
                                    <span className={styles.totalDiscountLabel}>
                                        <Award size={16} /> Khuyến mãi giảm:
                                    </span>
                                    <span className={styles.totalDiscountValue}>-{formatCurrency(getDiscountAmount(selectedBill))}</span>
                                </div>
                            )}
                            <div className={styles.totalRowFinal}>
                                <span className={styles.totalFinalLabel}>THỰC THU</span>
                                <span className={styles.totalFinalValue}>{formatCurrency(selectedBill.totalAmount)}</span>
                            </div>
                        </div>

                        {/* Nút in và đóng */}
                        <div className={styles.modalActions}>
                            <button
                                onClick={() => printBill(selectedBill)}
                                className={styles.printBtn}
                                disabled={isPrinting}
                            >
                                {isPrinting ? <RefreshCw size={18} className={styles.spin} /> : <Printer size={18} />}
                                {isPrinting ? 'Đang in...' : 'In hóa đơn'}
                            </button>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className={styles.modalCloseButton}
                            >
                                <X size={18} /> Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillPage;