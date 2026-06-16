import React, { useState, useEffect } from "react";
import { Search, Filter, Eye, Printer, Calendar, ChevronLeft, ChevronRight, DollarSign, Download, RefreshCw } from "lucide-react";
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

            // Lọc theo tìm kiếm
            if (filter.search) {
                allBills = allBills.filter(bill =>
                    bill.id?.toString().includes(filter.search) ||
                    bill.orderId?.toString().includes(filter.search)
                );
            }

            // Lọc theo trạng thái
            if (filter.status !== 'all') {
                allBills = allBills.filter(bill => bill.paymentStatus === filter.status);
            }

            // Lọc theo ngày
            if (filter.startDate) {
                allBills = allBills.filter(bill => bill.createdAt?.split('T')[0] >= filter.startDate);
            }
            if (filter.endDate) {
                allBills = allBills.filter(bill => bill.createdAt?.split('T')[0] <= filter.endDate);
            }

            // Sắp xếp
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
            'PAID': { text: 'Đã thanh toán', color: '#10b981' },
            'PENDING': { text: 'Chờ thanh toán', color: '#f59e0b' },
            'CANCELLED': { text: 'Đã hủy', color: '#ef4444' }
        };
        const s = statusMap[status] || { text: status, color: '#6b7280' };
        return <span style={{ background: s.color + '20', color: s.color, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>{s.text}</span>;
    };

    const getPaymentMethodLabel = (method) => {
        const methods = { 'CASH': '💵 Tiền mặt', 'MOMO': '📱 MoMo', 'PAYOS': '🏦 PayOS' };
        return methods[method] || method;
    };

    // Tính tổng tiền gốc (trước khuyến mãi)
    const getOriginalTotal = (bill) => {
        if (bill.items && bill.items.length > 0) {
            return bill.items.reduce((sum, item) => sum + ((item.unitPrice || item.price || 0) * (item.quantity || 1)), 0);
        }
        return bill.totalAmount || 0;
    };

    // Tính số tiền đã giảm
    const getDiscountAmount = (bill) => {
        const originalTotal = getOriginalTotal(bill);
        const finalTotal = bill.totalAmount || 0;
        return originalTotal - finalTotal;
    };

    // Xem chi tiết
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

    // Thanh toán tiền mặt
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
                <h2>📄 Quản lý Hóa đơn</h2>
                <button onClick={fetchBills} className={styles.refreshBtn}>
                    <RefreshCw size={16} /> Làm mới
                </button>
            </div>

            {/* Filters */}
            <div className={styles.filterSection}>
                <div className={styles.filterRow}>
                    <input type="text" placeholder="Tìm mã HD..." value={filter.search}
                        onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                        className={styles.searchInput} />
                    <select value={filter.status}
                        onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                        className={styles.selectInput}>
                        <option value="all">Tất cả</option>
                        <option value="PAID">Đã thanh toán</option>
                        <option value="PENDING">Chờ thanh toán</option>
                    </select>
                    <input type="date" value={filter.startDate}
                        onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                        className={styles.dateInput} />
                    <span style={{ color: '#64748b' }}>→</span>
                    <input type="date" value={filter.endDate}
                        onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                        className={styles.dateInput} />
                    {(filter.startDate || filter.endDate) && (
                        <button onClick={() => setFilter({ ...filter, startDate: '', endDate: '' })}
                            className={styles.clearBtn}>Xóa</button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className={styles.tableWrapper}>
                {loading ? <div className={styles.loading}>Đang tải...</div> : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Mã HD</th>
                                <th>Bàn</th>
                                <th>Tổng tiền</th>
                                <th>Phương thức</th>
                                <th>Trạng thái</th>
                                <th>Thời gian</th>
                                <th>#</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bills.map(bill => (
                                <tr key={bill.id}>
                                    <td>#{bill.id}</td>
                                    <td>Bàn {bill.tableNumber || bill.order?.table?.number || bill.table?.number || '--'}</td>
                                    <td style={{ color: '#ff6b6b', fontWeight: 600 }}>{formatCurrency(bill.totalAmount)}</td>
                                    <td>{getPaymentMethodLabel(bill.paymentMethod)}</td>
                                    <td>{getStatusBadge(bill.paymentStatus)}</td>
                                    <td style={{ fontSize: 12 }}>{formatDateTime(bill.createdAt)}</td>
                                    <td>
                                        <button onClick={() => handleViewDetail(bill)} style={btnSmall}><Eye size={14} /></button>
                                        {bill.paymentStatus === 'PENDING' && (
                                            <button onClick={() => handlePayCash(bill.id)} style={{ ...btnSmall, background: '#10b981' }}><DollarSign size={14} /></button>
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
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1} className={styles.pageBtn}>
                        <ChevronLeft size={16} />
                    </button>
                    <span className={styles.pageInfo}>Trang {currentPage} / {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages} className={styles.pageBtn}>
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* Detail Modal - Giữ hiển thị giảm giá */}
            {showDetailModal && selectedBill && (
                <div style={overlayStyle} onClick={() => setShowDetailModal(false)}>
                    <div style={{ ...modalStyle, maxWidth: 700 }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: 20, color: '#ff6b6b' }}>🧾 Chi tiết Hóa đơn #{selectedBill.id}</h3>

                        <div style={{ background: '#0f0f1a', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                            <div style={infoRow}><span>Mã đơn:</span><strong>#{selectedBill.orderId || '--'}</strong></div>
                            <div style={infoRow}><span>Bàn:</span><strong>Bàn {selectedBill.tableNumber || '--'}</strong></div>
                            <div style={infoRow}><span>Phương thức:</span><strong>{getPaymentMethodLabel(selectedBill.paymentMethod)}</strong></div>
                            <div style={infoRow}><span>Trạng thái:</span><strong>{getStatusBadge(selectedBill.paymentStatus)}</strong></div>
                            <div style={infoRow}><span>Thời gian:</span><strong>{formatDateTime(selectedBill.createdAt)}</strong></div>
                        </div>

                        {/* Danh sách món */}
                        <div style={{ background: '#0f0f1a', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                            <h4 style={{ color: '#94a3b8', marginBottom: 12, fontSize: 14 }}>📋 Danh sách món</h4>
                            {selectedBill.items && selectedBill.items.length > 0 ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
                                            <th style={{ padding: '8px', textAlign: 'left', color: '#64748b', fontSize: 12 }}>Tên món</th>
                                            <th style={{ padding: '8px', textAlign: 'center', color: '#64748b', fontSize: 12 }}>SL</th>
                                            <th style={{ padding: '8px', textAlign: 'right', color: '#64748b', fontSize: 12 }}>Đơn giá</th>
                                            <th style={{ padding: '8px', textAlign: 'right', color: '#64748b', fontSize: 12 }}>Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedBill.items.map((item, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #2d2d3d' }}>
                                                <td style={{ padding: '8px', color: 'white', fontSize: 13 }}>{item.product?.name || item.name || `Món #${idx + 1}`}</td>
                                                <td style={{ padding: '8px', textAlign: 'center', color: 'white', fontSize: 13 }}>x{item.quantity}</td>
                                                <td style={{ padding: '8px', textAlign: 'right', color: '#94a3b8', fontSize: 13 }}>{formatCurrency(item.unitPrice || item.price)}</td>
                                                <td style={{ padding: '8px', textAlign: 'right', color: '#ff6b6b', fontSize: 13, fontWeight: 600 }}>{formatCurrency((item.unitPrice || item.price) * item.quantity)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p style={{ color: '#64748b', textAlign: 'center', padding: 10 }}>Không có món nào</p>
                            )}
                        </div>

                        {/* Tổng kết với giảm giá */}
                        <div style={{ background: '#0f0f1a', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                            <div style={infoRow}>
                                <span>Tổng tiền món:</span>
                                <strong>{formatCurrency(getOriginalTotal(selectedBill))}</strong>
                            </div>
                            {getDiscountAmount(selectedBill) > 0 && (
                                <div style={infoRow}>
                                    <span style={{ color: '#10b981' }}>🎉 Khuyến mãi giảm:</span>
                                    <strong style={{ color: '#10b981' }}>-{formatCurrency(getDiscountAmount(selectedBill))}</strong>
                                </div>
                            )}
                            <div style={{ ...infoRow, borderTop: '2px solid #2d2d3d', paddingTop: 12, marginTop: 8 }}>
                                <span style={{ fontSize: 16 }}>THỰC THU:</span>
                                <strong style={{ color: '#ff6b6b', fontSize: 18 }}>{formatCurrency(selectedBill.totalAmount)}</strong>
                            </div>
                        </div>

                        <button onClick={() => setShowDetailModal(false)}
                            style={{ width: '100%', padding: 12, background: '#2d2d3d', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                            Đóng
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const btnSmall = { padding: '6px 10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', marginRight: 4 };
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalStyle = { background: '#1a1a2e', borderRadius: 16, padding: 24, width: 500, maxWidth: '90%', color: 'white' };
const infoRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #2d2d3d', color: '#94a3b8', fontSize: 14 };

export default BillPage;