import React, { useState, useEffect } from 'react';
import {
    Star, Search, Plus, X, RefreshCw, Edit2, Trash2, Eye,
    TrendingUp, Gift, Phone, User, Award, DollarSign,
    ChevronLeft, Users, AlertCircle, ShoppingCart, Package, Coffee,
    Filter
} from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import ToastNotification from '../../components/ToastNotification';

export default function CustomerPoints() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchPhone, setSearchPhone] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({ phone: '', customerName: '', totalPoints: 0 });
    const [addPoints, setAddPoints] = useState(0);
    const [toasts, setToasts] = useState([]);

    const [editingCustomer, setEditingCustomer] = useState(null);
    const [editFormData, setEditFormData] = useState({ phone: '', customerName: '', totalPoints: 0 });
    const [showEditModal, setShowEditModal] = useState(false);

    // ========== STATE CHO ĐỔI SẢN PHẨM ==========
    const [showRedeemModal, setShowRedeemModal] = useState(false);
    const [redeemProducts, setRedeemProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [redeemQuantity, setRedeemQuantity] = useState(1);
    const [redeeming, setRedeeming] = useState(false);
    const [customerForRedeem, setCustomerForRedeem] = useState(null);

    // ========== STATE CHO CONFIRM MODAL ==========
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmData, setConfirmData] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);

    const showToast = (message, type = "info", duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    };

    useEffect(() => {
        fetchAllCustomers();
    }, []);

    // ========== FILTER SẢN PHẨM KHI TÌM KIẾM ==========
    useEffect(() => {
        if (productSearchTerm.trim() === '') {
            setFilteredProducts(redeemProducts);
        } else {
            const filtered = redeemProducts.filter(p =>
                p.name?.toLowerCase().includes(productSearchTerm.toLowerCase())
            );
            setFilteredProducts(filtered);
        }
    }, [productSearchTerm, redeemProducts]);

    const fetchAllCustomers = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/customer-points/all');
            if (res.data?.success) {
                setCustomers(res.data.data || []);
            } else {
                setCustomers([]);
            }
        } catch (err) {
            console.log('Lỗi lấy danh sách:', err);
            showToast('Không thể tải danh sách khách hàng', 'error');
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchPhone.trim()) {
            showToast('Vui lòng nhập số điện thoại!', 'error');
            return;
        }
        setLoading(true);
        try {
            const res = await axiosClient.get(`/customer-points/${searchPhone.trim()}`);
            if (res.data?.success) {
                setSearchResult(res.data.data);
            } else {
                setSearchResult(null);
                showToast('Không tìm thấy khách hàng!', 'error');
            }
        } catch (err) {
            setSearchResult(null);
            showToast('Không tìm thấy khách hàng!', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ========== CONFIRM MODAL FUNCTIONS ==========

    const openConfirm = (title, message, action) => {
        setConfirmData({ title, message });
        setConfirmAction(() => action);
        setShowConfirmModal(true);
    };

    const executeConfirm = () => {
        if (confirmAction) confirmAction();
        setShowConfirmModal(false);
        setConfirmData(null);
        setConfirmAction(null);
    };

    // ========== FUNCTIONS ĐỔI SẢN PHẨM ==========

    const fetchRedeemableProducts = async (phone) => {
        try {
            setLoading(true);
            const res = await axiosClient.get(`/customer-points/redeemable-products/${phone}`);
            if (res.data?.success) {
                const products = res.data.data?.availableProducts || [];
                setRedeemProducts(products);
                setFilteredProducts(products);
                setProductSearchTerm('');
                return res.data.data;
            } else {
                setRedeemProducts([]);
                setFilteredProducts([]);
                return null;
            }
        } catch (err) {
            showToast('Không thể tải sản phẩm đổi điểm', 'error');
            setRedeemProducts([]);
            setFilteredProducts([]);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const openRedeemModal = async (customer) => {
        setCustomerForRedeem(customer);
        setSelectedProduct(null);
        setRedeemQuantity(1);
        setProductSearchTerm('');
        const data = await fetchRedeemableProducts(customer.phone);
        if (data) {
            setCustomerForRedeem({
                ...customer,
                totalPoints: data.totalPoints
            });
        }
        setShowRedeemModal(true);
    };

    const handleRedeemProduct = () => {
        if (!selectedProduct) {
            showToast('Vui lòng chọn sản phẩm!', 'warning');
            return;
        }
        if (redeemQuantity <= 0 || redeemQuantity > (selectedProduct.maxQuantity || 1)) {
            showToast('Số lượng không hợp lệ!', 'warning');
            return;
        }

        const pointsNeeded = selectedProduct.pointsRequired * redeemQuantity;

        // Dùng confirm modal thay vì window.confirm
        openConfirm(
            'Xác nhận đổi sản phẩm',
            `Đổi ${redeemQuantity}x ${selectedProduct.name}?\nSẽ dùng ${pointsNeeded} điểm từ tài khoản của ${customerForRedeem?.customerName || 'khách hàng'}`,
            async () => {
                setRedeeming(true);
                try {
                    const res = await axiosClient.post(`/customer-points/redeem-product/${customerForRedeem.phone}`, {
                        productId: selectedProduct.id,
                        quantity: redeemQuantity
                    });

                    if (res.data?.success) {
                        showToast(res.data.message || 'Đổi sản phẩm thành công!', 'success');
                        setShowRedeemModal(false);
                        setSelectedProduct(null);
                        setRedeemQuantity(1);
                        fetchAllCustomers();
                        if (searchResult) handleSearch();
                    } else {
                        showToast(res.data?.message || 'Đổi thất bại!', 'error');
                    }
                } catch (err) {
                    showToast(err.response?.data?.message || 'Đổi thất bại!', 'error');
                } finally {
                    setRedeeming(false);
                }
            }
        );
    };

    const handleCreate = async () => {
        if (!formData.phone.trim()) {
            showToast('Vui lòng nhập số điện thoại!', 'error');
            return;
        }
        try {
            const res = await axiosClient.post('/customer-points', formData);
            if (res.data?.success) {
                showToast('Thêm khách hàng thành công!', 'success');
                setShowAddModal(false);
                setSearchPhone(formData.phone);
                setSearchResult(res.data.data);
                setFormData({ phone: '', customerName: '', totalPoints: 0 });
                fetchAllCustomers();
            }
        } catch (err) {
            showToast('Lỗi: ' + (err.response?.data?.message || err.message), 'error');
        }
    };

    const handleEditClick = (customer) => {
        setEditingCustomer(customer);
        setEditFormData({
            phone: customer.phone,
            customerName: customer.customerName || '',
            totalPoints: customer.totalPoints || 0
        });
        setShowEditModal(true);
    };

    const handleUpdate = async () => {
        if (!editFormData.phone.trim()) {
            showToast('Vui lòng nhập số điện thoại!', 'error');
            return;
        }
        try {
            const res = await axiosClient.put(`/customer-points/${editingCustomer.id}`, editFormData);
            if (res.data?.success) {
                showToast('Cập nhật thành công!', 'success');
                setShowEditModal(false);
                setEditingCustomer(null);
                fetchAllCustomers();
                if (searchResult && searchResult.id === editingCustomer.id) {
                    setSearchResult(res.data.data);
                }
            }
        } catch (err) {
            showToast('Lỗi cập nhật: ' + (err.response?.data?.message || err.message), 'error');
        }
    };

    const handleDelete = (customer) => {
        openConfirm(
            'Xóa khách hàng',
            `Xóa "${customer.customerName || customer.phone}"?\nTất cả điểm sẽ bị mất!`,
            async () => {
                try {
                    const res = await axiosClient.delete(`/customer-points/${customer.id}`);
                    if (res.data?.success) {
                        showToast('Xóa khách hàng thành công!', 'success');
                        if (searchResult && searchResult.id === customer.id) {
                            setSearchResult(null);
                            setSearchPhone('');
                        }
                        fetchAllCustomers();
                    }
                } catch (err) {
                    showToast('Lỗi xóa: ' + (err.response?.data?.message || err.message), 'error');
                }
            }
        );
    };

    const handleAddPoints = async (phone) => {
        if (addPoints <= 0) {
            showToast('Vui lòng nhập số điểm!', 'error');
            return;
        }
        try {
            const res = await axiosClient.post('/customer-points/add-points', { phone, points: addPoints });
            if (res.data?.success) {
                showToast(res.data.message, 'success');
                setAddPoints(0);
                handleSearch();
                fetchAllCustomers();
            }
        } catch (err) {
            showToast('Lỗi: ' + (err.response?.data?.message || err.message), 'error');
        }
    };

    const handleRedeemPoints = (phone, points) => {
        openConfirm(
            'Xác nhận đổi điểm',
            `Đổi ${points} điểm từ tài khoản?`,
            async () => {
                try {
                    const res = await axiosClient.post('/customer-points/redeem-points', { phone, points });
                    if (res.data?.success) {
                        showToast(res.data.message, 'success');
                        handleSearch();
                        fetchAllCustomers();
                    }
                } catch (err) {
                    showToast('Lỗi: ' + (err.response?.data?.message || err.message), 'error');
                }
            }
        );
    };

    const viewDetail = (customer) => {
        setSearchPhone(customer.phone);
        setSearchResult(customer);
    };

    const backToList = () => {
        setSearchResult(null);
        setSearchPhone('');
    };

    return (
        <div>
            {/* Toast */}
            <div className="toast-container" style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {toasts.map(toast => (
                    <ToastNotification
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    />
                ))}
            </div>

            {/* ========== CONFIRM MODAL ========== */}
            {showConfirmModal && confirmData && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={() => setShowConfirmModal(false)}>
                    <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 24, width: 400, maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                            <AlertCircle size={48} color="#FBBF24" style={{ marginBottom: 12 }} />
                            <h3 style={{ color: 'white', fontSize: 18, margin: '0 0 8px' }}>{confirmData.title}</h3>
                            <p style={{ color: '#94a3b8', fontSize: 14, whiteSpace: 'pre-line', margin: 0 }}>{confirmData.message}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => setShowConfirmModal(false)}
                                style={{ flex: 1, padding: 12, background: '#2d2d3d', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
                                Hủy
                            </button>
                            <button onClick={executeConfirm}
                                style={{ flex: 1, padding: 12, background: '#ff6b6b', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Star size={24} /> Quản lý Điểm thưởng
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
                        <Users size={14} style={{ display: 'inline', marginRight: 4 }} />
                        Tổng: {customers.length} khách hàng
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={fetchAllCustomers} disabled={loading}
                        style={{ padding: '10px 20px', background: '#2d2d3d', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <RefreshCw size={18} /> Làm mới
                    </button>
                    <button onClick={() => setShowAddModal(true)}
                        style={{ padding: '10px 20px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={18} /> Thêm KH mới
                    </button>
                </div>
            </div>

            {/* Tìm kiếm */}
            <div style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                    <input
                        type="text" placeholder="Nhập SĐT để tra cứu..."
                        value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        style={{ width: '100%', padding: '12px 16px 12px 44px', background: '#1a1a2e', border: '1px solid #2d2d3d', borderRadius: 12, color: 'white', outline: 'none' }}
                    />
                </div>
                <button onClick={handleSearch} disabled={loading}
                    style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer' }}>
                    {loading ? '...' : 'Tra cứu'}
                </button>
                {searchResult && (
                    <button onClick={backToList}
                        style={{ padding: '12px 16px', background: '#2d2d3d', color: 'white', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ChevronLeft size={18} /> DS
                    </button>
                )}
            </div>

            {/* Kết quả tìm kiếm */}
            {searchResult && (
                <div style={{ background: '#1a1a2e', borderRadius: 16, border: '1px solid #2d2d3d', padding: 24, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <h3 style={{ color: 'white', fontSize: 18, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <User size={18} color="#94a3b8" />
                                {searchResult.customerName || 'Khách hàng'}
                            </h3>
                            <p style={{ color: '#94a3b8', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Phone size={14} /> {searchResult.phone}
                            </p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 32, fontWeight: 800, color: '#FBBF24', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <Award size={28} /> {searchResult.totalPoints || 0}
                            </div>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>điểm</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button onClick={() => openRedeemModal(searchResult)}
                            style={{ padding: '8px 16px', background: '#8B5CF6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ShoppingCart size={14} /> Đổi sản phẩm
                        </button>
                        <button onClick={() => handleEditClick(searchResult)}
                            style={{ padding: '8px 16px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 8, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Edit2 size={14} /> Sửa
                        </button>
                        <button onClick={() => handleDelete(searchResult)}
                            style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Trash2 size={14} /> Xóa
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <input type="number" placeholder="Số điểm cộng" value={addPoints} onChange={(e) => setAddPoints(Number(e.target.value))}
                            style={{ flex: 1, padding: '8px 12px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: 8, color: 'white', outline: 'none' }} />
                        <button onClick={() => handleAddPoints(searchResult.phone)}
                            style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <TrendingUp size={14} /> Cộng điểm
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button onClick={() => handleRedeemPoints(searchResult.phone, 10)}
                            style={{ padding: '8px 16px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Gift size={12} /> Đổi 10đ
                        </button>
                        <button onClick={() => handleRedeemPoints(searchResult.phone, 50)}
                            style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Gift size={12} /> Đổi 50đ
                        </button>
                        <button onClick={() => {
                            const pts = prompt('Nhập số điểm muốn đổi:');
                            if (pts) handleRedeemPoints(searchResult.phone, Number(pts));
                        }}
                            style={{ padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Gift size={12} /> Đổi khác
                        </button>
                    </div>
                </div>
            )}

            {/* Bảng danh sách khách hàng */}
            {!searchResult && (
                <div style={{ background: '#1a1a2e', borderRadius: 16, border: '1px solid #2d2d3d', overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 650 }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
                                <th style={thStyle}>STT</th>
                                <th style={thStyle}>Tên KH</th>
                                <th style={thStyle}>SĐT</th>
                                <th style={thStyle}>Điểm</th>
                                <th style={thStyle}>Đổi SP</th>
                                <th style={thStyle}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.length > 0 ? customers.map((c, i) => (
                                <tr key={c.id} style={{ borderBottom: '1px solid #2d2d3d' }}>
                                    <td style={tdStyle}>{i + 1}</td>
                                    <td style={{ ...tdStyle, color: 'white', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <User size={14} color="#94a3b8" />
                                        {c.customerName || '-'}
                                    </td>
                                    <td style={{ ...tdStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Phone size={14} /> {c.phone}
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(251,191,36,0.1)', color: '#FBBF24', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            <Award size={12} /> {c.totalPoints || 0}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <button onClick={() => openRedeemModal(c)}
                                            style={{ padding: '6px 12px', background: '#8B5CF6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <ShoppingCart size={12} /> Đổi SP
                                        </button>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            <button onClick={() => viewDetail(c)}
                                                style={{ padding: '6px 10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Eye size={12} /> Chi tiết
                                            </button>
                                            <button onClick={() => handleEditClick(c)}
                                                style={{ padding: '6px 10px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Edit2 size={12} /> Sửa
                                            </button>
                                            <button onClick={() => handleDelete(c)}
                                                style={{ padding: '6px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Trash2 size={12} /> Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                                        <Star size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                                        <p>{loading ? 'Đang tải...' : 'Chưa có khách hàng nào'}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ========== MODAL ĐỔI SẢN PHẨM ========== */}
            {showRedeemModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }} onClick={() => setShowRedeemModal(false)}>
                    <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 24, width: 550, maxWidth: '95%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h3 style={{ color: '#8B5CF6', fontSize: 20, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <ShoppingCart size={20} /> Đổi sản phẩm
                            </h3>
                            <button onClick={() => setShowRedeemModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        {/* Thông tin khách hàng */}
                        <div style={{ background: '#0f0f1a', borderRadius: 12, padding: 14, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <div>
                                <p style={{ color: 'white', margin: 0, fontWeight: 600, fontSize: 15 }}>{customerForRedeem?.customerName || 'Khách'}</p>
                                <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: 13 }}>{customerForRedeem?.phone}</p>
                            </div>
                            <div style={{ color: '#FBBF24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(251,191,36,0.1)', padding: '8px 14px', borderRadius: 10 }}>
                                <Award size={20} /> {customerForRedeem?.totalPoints || 0} điểm
                            </div>
                        </div>

                        {/* ========== THANH TÌM KIẾM SẢN PHẨM ========== */}
                        {redeemProducts.length > 0 && (
                            <div style={{ marginBottom: 16, position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                                <input
                                    type="text"
                                    placeholder="Tìm sản phẩm..."
                                    value={productSearchTerm}
                                    onChange={(e) => setProductSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px 10px 36px',
                                        background: '#0f0f1a',
                                        border: '1px solid #2d2d3d',
                                        borderRadius: 10,
                                        color: 'white',
                                        fontSize: 13,
                                        outline: 'none'
                                    }}
                                />
                                {productSearchTerm && (
                                    <button
                                        onClick={() => setProductSearchTerm('')}
                                        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Danh sách sản phẩm */}
                        {filteredProducts.length > 0 ? (
                            <div style={{ marginBottom: 16 }}>
                                <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>
                                    {productSearchTerm ? `Kết quả: ${filteredProducts.length} sản phẩm` : `Chọn sản phẩm (${redeemProducts.length}):`}
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {filteredProducts.map((product) => {
                                        const isSelected = selectedProduct?.id === product.id;
                                        const canRedeem = (customerForRedeem?.totalPoints || 0) >= product.pointsRequired;

                                        return (
                                            <div
                                                key={product.id}
                                                onClick={() => {
                                                    if (canRedeem) {
                                                        setSelectedProduct(isSelected ? null : product);
                                                        setRedeemQuantity(1);
                                                    }
                                                }}
                                                style={{
                                                    padding: '12px',
                                                    background: isSelected ? 'rgba(139,92,246,0.15)' : '#0f0f1a',
                                                    border: isSelected ? '2px solid #8B5CF6' : '1px solid #2d2d3d',
                                                    borderRadius: 10,
                                                    cursor: canRedeem ? 'pointer' : 'not-allowed',
                                                    opacity: canRedeem ? 1 : 0.6,
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        {product.imageUrl ? (
                                                            <img src={product.imageUrl} alt="" style={{ width: 45, height: 45, borderRadius: 8, objectFit: 'cover' }} />
                                                        ) : (
                                                            <div style={{ width: 45, height: 45, borderRadius: 8, background: '#2d2d3d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <Package size={22} color="#64748B" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p style={{ color: 'white', margin: 0, fontWeight: 500, fontSize: 14 }}>{product.name}</p>
                                                            <p style={{ color: '#94a3b8', margin: '2px 0 0', fontSize: 12 }}>
                                                                Còn: {product.stockQuantity} {product.unit} | Tối đa: {product.maxQuantity}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <p style={{ color: '#8B5CF6', margin: 0, fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <Award size={14} /> {product.pointsRequired}
                                                        </p>
                                                        <p style={{ color: '#64748B', margin: '2px 0 0', fontSize: 11 }}>điểm</p>
                                                    </div>
                                                </div>
                                                {!canRedeem && (
                                                    <p style={{ color: '#EF4444', fontSize: 11, marginTop: 8, marginBottom: 0 }}>
                                                        ⚠️ Không đủ điểm (thiếu {product.pointsRequired - (customerForRedeem?.totalPoints || 0)} điểm)
                                                    </p>
                                                )}
                                                {isSelected && (
                                                    <p style={{ color: '#8B5CF6', fontSize: 11, marginTop: 8, marginBottom: 0, fontWeight: 600 }}>
                                                        ✓ Đã chọn
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
                                <Package size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                                <p>{productSearchTerm ? 'Không tìm thấy sản phẩm' : 'Không có sản phẩm nào có thể đổi'}</p>
                                {productSearchTerm && (
                                    <button onClick={() => setProductSearchTerm('')}
                                        style={{ marginTop: 8, padding: '6px 12px', background: '#2d2d3d', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                                        Xóa tìm kiếm
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Chọn số lượng */}
                        {selectedProduct && (
                            <div style={{ marginBottom: 16, background: 'rgba(139,92,246,0.1)', padding: 14, borderRadius: 10, border: '1px solid rgba(139,92,246,0.2)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <label style={{ color: '#8B5CF6', fontSize: 14, fontWeight: 600 }}>
                                        🛒 {selectedProduct.name}
                                    </label>
                                    <button onClick={() => setSelectedProduct(null)}
                                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                        <X size={16} />
                                    </button>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <button
                                        onClick={() => setRedeemQuantity(Math.max(1, redeemQuantity - 1))}
                                        style={{ padding: '8px 14px', background: '#2d2d3d', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}
                                    >−</button>
                                    <input
                                        type="number"
                                        value={redeemQuantity}
                                        onChange={(e) => setRedeemQuantity(Math.max(1, Math.min(parseInt(e.target.value) || 1, selectedProduct.maxQuantity)))}
                                        min="1"
                                        max={selectedProduct.maxQuantity}
                                        style={{ width: '70px', padding: '8px', textAlign: 'center', background: '#0f0f1a', border: '1px solid #8B5CF6', borderRadius: 8, color: 'white', fontSize: 16, fontWeight: 600, outline: 'none' }}
                                    />
                                    <button
                                        onClick={() => setRedeemQuantity(Math.min(selectedProduct.maxQuantity, redeemQuantity + 1))}
                                        style={{ padding: '8px 14px', background: '#2d2d3d', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}
                                    >+</button>
                                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                        <p style={{ color: '#FBBF24', margin: 0, fontWeight: 700, fontSize: 18 }}>
                                            {selectedProduct.pointsRequired * redeemQuantity} điểm
                                        </p>
                                        <p style={{ color: '#64748B', margin: '2px 0 0', fontSize: 11 }}>
                                            = {selectedProduct.pointsRequired} × {redeemQuantity}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Nút hành động */}
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => setShowRedeemModal(false)}
                                style={{ flex: 1, padding: 12, background: '#2d2d3d', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
                                Hủy
                            </button>
                            <button onClick={handleRedeemProduct} disabled={!selectedProduct || redeeming}
                                style={{ flex: 1, padding: 12, background: selectedProduct ? '#8B5CF6' : '#4a4a5a', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: selectedProduct ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {redeeming ? 'Đang xử lý...' : (
                                    <><ShoppingCart size={14} /> Đổi ngay</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal THÊM mới */}
            {showAddModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAddModal(false)}>
                    <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 24, width: 400, maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h3 style={{ color: '#ff6b6b', fontSize: 20, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Plus size={20} /> Thêm khách hàng mới
                            </h3>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 8, color: '#94a3b8', fontSize: 13 }}>
                                <Phone size={14} style={{ display: 'inline', marginRight: 4 }} /> Số điện thoại *
                            </label>
                            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="VD: 0987654321"
                                style={{ width: '100%', padding: '10px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: 8, color: 'white', outline: 'none' }} />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 8, color: '#94a3b8', fontSize: 13 }}>
                                <User size={14} style={{ display: 'inline', marginRight: 4 }} /> Tên khách hàng
                            </label>
                            <input type="text" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                placeholder="Nhập tên khách hàng"
                                style={{ width: '100%', padding: '10px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: 8, color: 'white', outline: 'none' }} />
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', marginBottom: 8, color: '#94a3b8', fontSize: 13 }}>
                                <Award size={14} style={{ display: 'inline', marginRight: 4 }} /> Điểm ban đầu
                            </label>
                            <input type="number" value={formData.totalPoints} onChange={(e) => setFormData({ ...formData, totalPoints: Number(e.target.value) })}
                                style={{ width: '100%', padding: '10px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: 8, color: 'white', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => setShowAddModal(false)}
                                style={{ flex: 1, padding: 12, background: '#2d2d3d', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
                            <button onClick={handleCreate}
                                style={{ flex: 1, padding: 12, background: '#ff6b6b', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Thêm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal SỬA */}
            {showEditModal && editingCustomer && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowEditModal(false)}>
                    <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 24, width: 400, maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h3 style={{ color: '#f59e0b', fontSize: 20, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Edit2 size={20} /> Sửa thông tin
                            </h3>
                            <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 8, color: '#94a3b8', fontSize: 13 }}>
                                <Phone size={14} style={{ display: 'inline', marginRight: 4 }} /> Số điện thoại *
                            </label>
                            <input type="tel" value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                placeholder="VD: 0987654321"
                                style={{ width: '100%', padding: '10px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: 8, color: 'white', outline: 'none' }} />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 8, color: '#94a3b8', fontSize: 13 }}>
                                <User size={14} style={{ display: 'inline', marginRight: 4 }} /> Tên khách hàng
                            </label>
                            <input type="text" value={editFormData.customerName} onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                                placeholder="Nhập tên khách hàng"
                                style={{ width: '100%', padding: '10px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: 8, color: 'white', outline: 'none' }} />
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', marginBottom: 8, color: '#94a3b8', fontSize: 13 }}>
                                <Award size={14} style={{ display: 'inline', marginRight: 4 }} /> Điểm hiện tại
                            </label>
                            <input type="number" value={editFormData.totalPoints} onChange={(e) => setEditFormData({ ...editFormData, totalPoints: Number(e.target.value) })}
                                style={{ width: '100%', padding: '10px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: 8, color: 'white', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => setShowEditModal(false)}
                                style={{ flex: 1, padding: 12, background: '#2d2d3d', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
                            <button onClick={handleUpdate}
                                style={{ flex: 1, padding: 12, background: '#f59e0b', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Cập nhật</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const thStyle = { padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 13 };
const tdStyle = { padding: '12px 16px', color: '#94a3b8', fontSize: 13 };