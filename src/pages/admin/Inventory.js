import React, { useState, useEffect } from 'react';
import {
    Package, RefreshCw, Plus, X, ArrowDown, ArrowUp,
    ChevronLeft, ChevronRight, Search, Filter,
    ShoppingBag, Box, Clock, User, Hash,
    Calendar, AlertCircle, CheckCircle, TrendingUp,
    Truck, Clipboard, List, Grid, DollarSign
} from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import ToastNotification from '../../components/ToastNotification';

export default function Inventory() {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importForm, setImportForm] = useState({ productId: '', quantity: 0, note: '' });
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [searchField, setSearchField] = useState('all');
    const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // Hàm hiển thị toast
    const showToast = (message, type = 'info', duration = 3000) => {
        setToast({ message, type, duration });
        setTimeout(() => {
            setToast(null);
        }, duration);
    };

    useEffect(() => {
        fetchTransactions();
        fetchProducts();
    }, []);

    useEffect(() => {
        filterTransactions();
    }, [searchTerm, searchField, transactionTypeFilter, transactions]);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredTransactions.length / itemsPerPage));
        setCurrentPage(1);
    }, [filteredTransactions, itemsPerPage]);

    const getTransactionTypeIcon = (type) => {
        switch (type) {
            case 'IMPORT': return <ArrowDown size={16} color="#10B981" />;
            case 'EXPORT': return <ArrowUp size={16} color="#EF4444" />;
            case 'ADJUSTMENT': return <RefreshCw size={16} color="#8B5CF6" />;
            default: return <Package size={16} />;
        }
    };

    const getTransactionTypeText = (type) => {
        switch (type) {
            case 'IMPORT': return 'Nhập kho';
            case 'EXPORT': return 'Xuất kho';
            case 'ADJUSTMENT': return 'Điều chỉnh';
            default: return type;
        }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/inventory');
            if (res.data?.success) {
                setTransactions(res.data.data);
                setFilteredTransactions(res.data.data);
            }
        } catch (err) {
            console.error('Lỗi:', err);
            showToast('Không thể tải danh sách giao dịch!', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await axiosClient.get('/products');
            const data = res.data?.data || [];
            setProducts(data.filter(p => p.productTypeCode !== 'TIME_BASED' && p.active));
        } catch (err) {
            console.error('Lỗi:', err);
        }
    };

    const filterTransactions = () => {
        let filtered = [...transactions];

        if (transactionTypeFilter !== 'all') {
            filtered = filtered.filter(tx => tx.transactionType === transactionTypeFilter);
        }

        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(tx => {
                switch (searchField) {
                    case 'product':
                        return tx.product?.name?.toLowerCase().includes(term);
                    case 'type':
                        const typeText = getTransactionTypeText(tx.transactionType).toLowerCase();
                        return typeText.includes(term);
                    case 'note':
                        return tx.note?.toLowerCase().includes(term);
                    case 'user':
                        return tx.user?.fullName?.toLowerCase().includes(term);
                    default:
                        return (
                            tx.product?.name?.toLowerCase().includes(term) ||
                            getTransactionTypeText(tx.transactionType).toLowerCase().includes(term) ||
                            tx.note?.toLowerCase().includes(term) ||
                            tx.user?.fullName?.toLowerCase().includes(term) ||
                            tx.id?.toString().includes(term)
                        );
                }
            });
        }

        setFilteredTransactions(filtered);
    };

    const handleImport = async (e) => {
        e.preventDefault();
        if (!importForm.productId || importForm.quantity <= 0) {
            showToast('Vui lòng chọn sản phẩm và số lượng!', 'warning');
            return;
        }
        setSubmitting(true);
        try {
            const res = await axiosClient.post('/inventory/import', {
                productId: Number(importForm.productId),
                quantity: importForm.quantity,
                note: importForm.note || 'Nhập kho thủ công'
            });
            if (res.data?.success) {
                showToast(res.data.message || 'Nhập kho thành công!', 'success');
                setShowImportModal(false);
                setImportForm({ productId: '', quantity: 0, note: '' });
                fetchTransactions();
                fetchProducts();
            } else {
                showToast(res.data?.message || 'Nhập kho thất bại!', 'error');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Có lỗi xảy ra!';
            showToast(errorMsg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const getCurrentTransactions = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredTransactions.slice(startIndex, endIndex);
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setSearchTerm('');
        setSearchField('all');
        setTransactionTypeFilter('all');
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #2d2d3d', borderTop: '4px solid #ff6b6b', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
            <p style={{ fontSize: 16 }}>Đang tải dữ liệu...</p>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );

    const currentTransactions = getCurrentTransactions();

    return (
        <div style={{ padding: '0 4px' }}>
            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 9999,
                    maxWidth: '400px',
                    width: '100%'
                }}>
                    <ToastNotification
                        message={toast.message}
                        type={toast.type}
                        duration={toast.duration}
                        onClose={() => setToast(null)}
                    />
                </div>
            )}

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
                flexWrap: 'wrap',
                gap: 12
            }}>
                <div>
                    <h2 style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: '#ff6b6b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10
                    }}>
                        <Package size={28} /> Quản lý Kho
                    </h2>
                    <p style={{
                        color: '#94a3b8',
                        fontSize: 15,
                        marginTop: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                    }}>
                        <List size={16} /> Tổng số giao dịch: <strong style={{ color: '#e2e8f0' }}>{transactions.length}</strong>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={fetchTransactions} style={btnSecondary}>
                        <RefreshCw size={18} /> Làm mới
                    </button>
                    <button onClick={() => setShowImportModal(true)} style={btnPrimary}>
                        <Plus size={18} /> Nhập kho
                    </button>
                </div>
            </div>

            {/* Search and Filter Section */}
            <div style={{
                background: '#1a1a2e',
                borderRadius: 16,
                border: '1px solid #2d2d3d',
                padding: 24,
                marginBottom: 24
            }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
                    <div style={{ minWidth: 160 }}>
                        <label style={labelStyle}>Tìm theo</label>
                        <select
                            value={searchField}
                            onChange={(e) => setSearchField(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="all">Tất cả</option>
                            <option value="product">Tên sản phẩm</option>
                            <option value="type">Loại giao dịch</option>
                            <option value="note">Ghi chú</option>
                            <option value="user">Người thực hiện</option>
                        </select>
                    </div>

                    <div style={{ flex: 1, minWidth: 280 }}>
                        <label style={labelStyle}>Tìm kiếm</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Search size={20} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={`Nhập từ khóa...`}
                                    style={{
                                        ...inputStyle,
                                        paddingLeft: 44,
                                        fontSize: 15
                                    }}
                                />
                            </div>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    style={{
                                        padding: '10px 14px',
                                        background: '#2d2d3d',
                                        border: 'none',
                                        borderRadius: 8,
                                        color: '#94a3b8',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ minWidth: 180 }}>
                        <label style={labelStyle}>Loại giao dịch</label>
                        <select
                            value={transactionTypeFilter}
                            onChange={(e) => setTransactionTypeFilter(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="all">Tất cả</option>
                            <option value="IMPORT">Nhập kho</option>
                            <option value="EXPORT">Xuất kho</option>
                            <option value="ADJUSTMENT">Điều chỉnh</option>
                        </select>
                    </div>

                    {(searchTerm || transactionTypeFilter !== 'all') && (
                        <button
                            onClick={resetFilters}
                            style={{
                                padding: '11px 24px',
                                background: '#2d2d3d',
                                border: 'none',
                                borderRadius: 8,
                                color: '#ff6b6b',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 0,
                                fontSize: 14,
                                fontWeight: 500
                            }}
                        >
                            <Filter size={16} /> Xóa bộ lọc
                        </button>
                    )}
                </div>

                {(searchTerm || transactionTypeFilter !== 'all') ? (
                    <div style={{
                        marginTop: 18,
                        padding: '10px 16px',
                        background: 'rgba(255,107,107,0.1)',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 14,
                        color: '#94a3b8'
                    }}>
                        <Search size={16} />
                        Tìm thấy <strong style={{ color: '#ff6b6b', fontSize: 16 }}>{filteredTransactions.length}</strong> kết quả
                        <button
                            onClick={resetFilters}
                            style={{
                                marginLeft: 'auto',
                                background: 'none',
                                border: 'none',
                                color: '#ff6b6b',
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 500
                            }}
                        >
                            [Xóa tìm kiếm]
                        </button>
                    </div>
                ) : (
                    <div style={{
                        marginTop: 18,
                        fontSize: 14,
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}>
                        <Package size={16} />
                        Tổng số giao dịch: <strong style={{ color: '#e2e8f0' }}>{transactions.length}</strong>
                    </div>
                )}
            </div>

            {/* Bảng lịch sử */}
            <div style={{
                background: '#1a1a2e',
                borderRadius: 16,
                border: '1px solid #2d2d3d',
                overflow: 'auto'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #2d2d3d', background: '#0f0f1a' }}>
                            <th style={th}><Hash size={14} /> ID</th>
                            <th style={th}>Sản phẩm</th>
                            <th style={th}>Loại</th>
                            <th style={th}>SL</th>
                            <th style={th}>Trước</th>
                            <th style={th}>Sau</th>
                            <th style={th}>Ghi chú</th>
                            <th style={th}>Người TH</th>
                            <th style={th}>Thời gian</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentTransactions.length > 0 ? (
                            currentTransactions.map(tx => (
                                <tr key={tx.id} style={{ borderBottom: '1px solid #2d2d3d' }}>
                                    <td style={{ ...td, fontWeight: 600, color: '#e2e8f0' }}>#{tx.id}</td>
                                    <td style={{ ...td, color: 'white', fontWeight: 500, fontSize: 15 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Package size={16} color="#64748B" />
                                            {tx.productName || tx.product?.name || '-'}
                                        </div>
                                    </td>
                                    <td style={td}>
                                        <span style={badgeStyle(tx.transactionType)}>
                                            {getTransactionTypeIcon(tx.transactionType)}
                                            {getTransactionTypeText(tx.transactionType)}
                                        </span>
                                    </td>
                                    <td style={{ ...td, color: 'white', fontWeight: 600, fontSize: 16 }}>{tx.quantity}</td>
                                    <td style={td}>{tx.beforeQuantity}</td>
                                    <td style={td}>{tx.afterQuantity}</td>
                                    <td style={{ ...td, color: '#e2e8f0' }}>{tx.note || '-'}</td>
                                    <td style={{ ...td }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <User size={16} color="#64748B" />
                                            {tx.userFullName || tx.user?.fullName || '-'}
                                        </div>
                                    </td>
                                    <td style={{ ...td }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Calendar size={16} color="#64748B" />
                                            {new Date(tx.createdAt).toLocaleString('vi-VN')}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={9} style={{ padding: 80, textAlign: 'center', color: '#94a3b8' }}>
                                    <Package size={64} style={{ margin: '0 auto 20px', opacity: 0.3 }} />
                                    <p style={{ fontSize: 18, fontWeight: 500 }}>Không tìm thấy giao dịch nào</p>
                                    <p style={{ fontSize: 14, marginTop: 8 }}>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {filteredTransactions.length > 0 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 24,
                    padding: '16px 0',
                    flexWrap: 'wrap',
                    gap: 12
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span style={{ color: '#94a3b8', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <List size={16} /> Hiển thị:
                        </span>
                        <select
                            value={itemsPerPage}
                            onChange={handleItemsPerPageChange}
                            style={selectSmallStyle}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span style={{ color: '#94a3b8', fontSize: 14 }}>
                            / <strong style={{ color: '#e2e8f0' }}>{filteredTransactions.length}</strong> giao dịch
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <button
                            onClick={goToPrevPage}
                            disabled={currentPage === 1}
                            style={paginationButtonStyle(currentPage === 1)}
                        >
                            <ChevronLeft size={18} /> Trước
                        </button>

                        {getPageNumbers().map(page => (
                            <button
                                key={page}
                                onClick={() => goToPage(page)}
                                style={pageButtonStyle(currentPage === page)}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            style={paginationButtonStyle(currentPage === totalPages)}
                        >
                            Sau <ChevronRight size={18} />
                        </button>
                    </div>

                    <div style={{ color: '#94a3b8', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Grid size={16} /> Trang <strong style={{ color: '#e2e8f0' }}>{currentPage}</strong> / {totalPages}
                    </div>
                </div>
            )}

            {/* Modal Nhập kho */}
            {showImportModal && (
                <div style={overlayStyle} onClick={() => setShowImportModal(false)}>
                    <div style={modalStyle} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                            <h3 style={{
                                color: '#ff6b6b',
                                fontSize: 24,
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10
                            }}>
                                <Truck size={24} /> Nhập kho
                            </h3>
                            <button onClick={() => setShowImportModal(false)} style={{
                                background: 'none',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                padding: 4
                            }}>
                                <X size={28} />
                            </button>
                        </div>
                        <form onSubmit={handleImport}>
                            <div style={{ marginBottom: 18 }}>
                                <label style={labelStyle}>
                                    <Package size={16} style={{ display: 'inline', marginRight: 6 }} /> Sản phẩm *
                                </label>
                                <select
                                    value={importForm.productId}
                                    onChange={(e) => setImportForm({ ...importForm, productId: e.target.value })}
                                    required style={inputStyle}
                                >
                                    <option value="">-- Chọn sản phẩm --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} (Tồn: {p.stockQuantity || 0})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginBottom: 18 }}>
                                <label style={labelStyle}>
                                    <Box size={16} style={{ display: 'inline', marginRight: 6 }} /> Số lượng *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={importForm.quantity}
                                    onChange={(e) => setImportForm({ ...importForm, quantity: Number(e.target.value) })}
                                    required style={inputStyle}
                                    placeholder="Nhập số lượng..."
                                />
                            </div>
                            <div style={{ marginBottom: 24 }}>
                                <label style={labelStyle}>
                                    <Clipboard size={16} style={{ display: 'inline', marginRight: 6 }} /> Ghi chú
                                </label>
                                <input
                                    type="text"
                                    value={importForm.note}
                                    onChange={(e) => setImportForm({ ...importForm, note: e.target.value })}
                                    style={inputStyle}
                                    placeholder="VD: Nhập hàng từ nhà cung cấp..."
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button type="button" onClick={() => setShowImportModal(false)} style={btnCancel}>
                                    <X size={16} /> Hủy
                                </button>
                                <button type="submit" disabled={submitting} style={btnConfirm}>
                                    {submitting ? 'Đang xử lý...' : 'Xác nhận nhập'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ========== STYLES ==========
const th = {
    padding: '14px 20px',
    textAlign: 'left',
    color: '#94a3b8',
    fontWeight: 600,
    fontSize: 15,
    whiteSpace: 'nowrap'
};

const td = {
    padding: '14px 20px',
    color: '#94a3b8',
    fontSize: 14,
    whiteSpace: 'nowrap'
};

const btnPrimary = {
    padding: '12px 24px',
    background: '#ff6b6b',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    transition: 'all 0.3s'
};

const btnSecondary = {
    padding: '12px 24px',
    background: '#2d2d3d',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    transition: 'all 0.3s'
};

const btnCancel = {
    flex: 1,
    padding: '14px 20px',
    background: '#2d2d3d',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'all 0.3s'
};

const btnConfirm = {
    flex: 1,
    padding: '14px 20px',
    background: '#ff6b6b',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'all 0.3s'
};

const badgeStyle = (type) => ({
    padding: '6px 14px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    background: type === 'IMPORT' ? 'rgba(16,185,129,0.15)' : type === 'EXPORT' ? 'rgba(239,68,68,0.15)' : 'rgba(139,92,246,0.15)',
    color: type === 'IMPORT' ? '#10B981' : type === 'EXPORT' ? '#EF4444' : '#8B5CF6',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    border: `1px solid ${type === 'IMPORT' ? 'rgba(16,185,129,0.2)' : type === 'EXPORT' ? 'rgba(239,68,68,0.2)' : 'rgba(139,92,246,0.2)'}`
});

const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
};

const modalStyle = {
    background: '#1a1a2e',
    borderRadius: 16,
    padding: 32,
    width: 500,
    maxWidth: '92%'
};

const labelStyle = {
    display: 'block',
    marginBottom: 8,
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: 600
};

const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    background: '#0f0f1a',
    border: '1px solid #2d2d3d',
    borderRadius: 8,
    color: 'white',
    fontSize: 15,
    outline: 'none',
    transition: 'all 0.3s'
};

const selectStyle = {
    width: '100%',
    padding: '12px 14px',
    background: '#0f0f1a',
    border: '1px solid #2d2d3d',
    borderRadius: 8,
    color: 'white',
    fontSize: 15,
    outline: 'none',
    cursor: 'pointer'
};

const selectSmallStyle = {
    padding: '8px 14px',
    background: '#0f0f1a',
    border: '1px solid #2d2d3d',
    borderRadius: 8,
    color: 'white',
    fontSize: 14,
    cursor: 'pointer'
};

const paginationButtonStyle = (disabled) => ({
    padding: '10px 16px',
    background: disabled ? '#2d2d3d' : '#ff6b6b',
    border: 'none',
    borderRadius: 8,
    color: disabled ? '#64748b' : 'white',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.3s'
});

const pageButtonStyle = (active) => ({
    padding: '10px 20px',
    background: active ? '#ff6b6b' : '#2d2d3d',
    border: 'none',
    borderRadius: 8,
    color: active ? 'white' : '#94a3b8',
    cursor: 'pointer',
    fontWeight: active ? 700 : 500,
    fontSize: 14,
    transition: 'all 0.3s'
});