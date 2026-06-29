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
    const itemsPerPage = 10;

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
                <button onClick={fetchBills} className={styles.refreshBtn}>
                    <RefreshCw size={18} /> Làm mới
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
                                        >
                                            <Eye size={18} />
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

                        <button
                            onClick={() => setShowDetailModal(false)}
                            className={styles.modalCloseButton}
                        >
                            <X size={18} /> Đóng
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillPage;