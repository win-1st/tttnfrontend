import React, { useEffect, useState } from 'react';
import {
    Tag, Search, Plus, RefreshCw, X, Edit2, Trash2,
    Percent, DollarSign, Calendar, Clock, Package, Check,
    ChevronLeft, ChevronRight, Gift, Award, Star,
    AlertCircle, CheckCircle, Box, List, Grid,
    ShoppingBag, Hash, Users, TrendingUp, Filter
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ToastNotification from '../../components/ToastNotification';

export default function Promotions({ promotions = [], setPromotions, refreshTrigger, setRefreshTrigger }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchProductTerm, setSearchProductTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        discountType: 'percentage',
        discountPercentage: '',
        discountAmount: '',
        startDate: '',
        endDate: '',
        isActive: true
    });
    const [products, setProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [currentPromotion, setCurrentPromotion] = useState(null);
    const [promotionProducts, setPromotionProducts] = useState([]);
    const [availableProductsList, setAvailableProductsList] = useState([]);
    const [selectedProductIds, setSelectedProductIds] = useState([]);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    const API_BASE_URL = 'http://localhost:8080';
    const getToken = () => localStorage.getItem('token');

    const showToast = (message, type = 'info', duration = 3000) => {
        setToast({ message, type, duration });
        setTimeout(() => {
            setToast(null);
        }, duration);
    };

    const fetchPromotions = async () => {
        const token = getToken();
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/promotions`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data?.success && Array.isArray(response.data.data)) {
                setPromotions(response.data.data);
            } else if (Array.isArray(response.data)) {
                setPromotions(response.data);
            } else {
                setPromotions([]);
            }
        } catch (error) {
            console.error('Lỗi tải khuyến mãi:', error);
            showToast('Không thể tải danh sách khuyến mãi!', 'error');
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }
            setPromotions([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        const token = getToken();
        if (!token) return;

        try {
            const response = await axios.get(`${API_BASE_URL}/api/products`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data?.success && Array.isArray(response.data.data)) {
                setProducts(response.data.data);
            } else if (Array.isArray(response.data)) {
                setProducts(response.data);
            }
        } catch (error) {
            console.error('Lỗi tải sản phẩm:', error);
        }
    };

    const fetchPromotionProducts = async (promotionId) => {
        const token = getToken();
        if (!token) return;

        try {
            const response = await axios.get(`${API_BASE_URL}/api/promotions/${promotionId}/products`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data?.success && Array.isArray(response.data.data)) {
                setPromotionProducts(response.data.data);
            } else {
                setPromotionProducts([]);
            }
        } catch (error) {
            console.error('Lỗi tải sản phẩm trong khuyến mãi:', error);
            setPromotionProducts([]);
        }
    };

    const fetchAvailableProducts = async (promotionId) => {
        const token = getToken();
        if (!token) return;

        try {
            const response = await axios.get(`${API_BASE_URL}/api/promotions/${promotionId}/available-products`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data?.success && Array.isArray(response.data.data)) {
                setAvailableProductsList(response.data.data);
            } else {
                setAvailableProductsList([]);
            }
        } catch (error) {
            console.error('Lỗi tải sản phẩm khả dụng:', error);
            setAvailableProductsList([]);
        }
    };

    useEffect(() => {
        fetchPromotions();
        fetchProducts();
    }, []);

    useEffect(() => {
        if (refreshTrigger) {
            fetchPromotions();
            fetchProducts();
        }
    }, [refreshTrigger]);

    const handleCreate = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.startDate || !formData.endDate) {
            showToast('Vui lòng nhập đầy đủ tên, ngày bắt đầu và ngày kết thúc!', 'warning');
            return;
        }

        if (formData.discountType === 'percentage' && (!formData.discountPercentage || formData.discountPercentage <= 0 || formData.discountPercentage > 100)) {
            showToast('Vui lòng nhập phần trăm giảm giá hợp lệ (1-100)!', 'warning');
            return;
        }

        if (formData.discountType === 'amount' && (!formData.discountAmount || formData.discountAmount <= 0)) {
            showToast('Vui lòng nhập số tiền giảm giá hợp lệ!', 'warning');
            return;
        }

        setSubmitting(true);

        const token = getToken();
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const payload = {
                name: formData.name,
                description: formData.description || '',
                startDate: formData.startDate,
                endDate: formData.endDate,
                isActive: formData.isActive
            };

            if (formData.discountType === 'percentage') {
                payload.discountPercentage = parseFloat(formData.discountPercentage);
                payload.discountAmount = null;
            } else {
                payload.discountAmount = parseFloat(formData.discountAmount);
                payload.discountPercentage = null;
            }

            const response = await axios.post(`${API_BASE_URL}/api/promotions`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data?.success) {
                showToast(`Thêm khuyến mãi "${formData.name}" thành công!`, 'success');
                resetModal();
                fetchPromotions();
                if (setRefreshTrigger) setRefreshTrigger(prev => prev + 1);
            } else {
                showToast(response.data?.message || 'Thêm khuyến mãi thất bại!', 'error');
            }
        } catch (error) {
            console.error('Lỗi thêm khuyến mãi:', error);
            const errorMsg = error.response?.data?.message || 'Thêm khuyến mãi thất bại!';
            showToast(errorMsg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.startDate || !formData.endDate) {
            showToast('Vui lòng nhập đầy đủ tên, ngày bắt đầu và ngày kết thúc!', 'warning');
            return;
        }

        setSubmitting(true);

        const token = getToken();
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const payload = {
                name: formData.name,
                description: formData.description || '',
                startDate: formData.startDate,
                endDate: formData.endDate,
                isActive: formData.isActive
            };

            if (formData.discountType === 'percentage') {
                payload.discountPercentage = parseFloat(formData.discountPercentage);
                payload.discountAmount = null;
            } else {
                payload.discountAmount = parseFloat(formData.discountAmount);
                payload.discountPercentage = null;
            }

            const response = await axios.put(`${API_BASE_URL}/api/promotions/${editingPromotion.id}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data?.success) {
                showToast(`Cập nhật khuyến mãi "${formData.name}" thành công!`, 'success');
                resetModal();
                fetchPromotions();
                if (setRefreshTrigger) setRefreshTrigger(prev => prev + 1);
            } else {
                showToast(response.data?.message || 'Cập nhật thất bại!', 'error');
            }
        } catch (error) {
            console.error('Lỗi cập nhật khuyến mãi:', error);
            showToast('Cập nhật thất bại!', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Bạn có chắc muốn xóa khuyến mãi "${name}"?`)) return;

        const token = getToken();
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await axios.delete(`${API_BASE_URL}/api/promotions/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data?.success) {
                showToast(`Xóa khuyến mãi "${name}" thành công!`, 'success');
                fetchPromotions();
                if (setRefreshTrigger) setRefreshTrigger(prev => prev + 1);
            } else {
                showToast(response.data?.message || 'Xóa thất bại!', 'error');
            }
        } catch (error) {
            console.error('Lỗi xóa khuyến mãi:', error);
            showToast(error.response?.data?.message || 'Xóa khuyến mãi thất bại!', 'error');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const token = getToken();
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await axios.patch(
                `${API_BASE_URL}/api/promotions/${id}/status?isActive=${!currentStatus}`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data?.success) {
                const statusText = !currentStatus ? 'Bật' : 'Tắt';
                showToast(`Đã ${statusText} khuyến mãi!`, 'success');
                fetchPromotions();
                if (setRefreshTrigger) setRefreshTrigger(prev => prev + 1);
            } else {
                showToast(response.data?.message || 'Cập nhật thất bại!', 'error');
            }
        } catch (error) {
            console.error('Lỗi cập nhật trạng thái:', error);
            showToast('Cập nhật thất bại!', 'error');
        }
    };

    const openProductManager = async (promotion) => {
        setCurrentPromotion(promotion);
        setSelectedProductIds([]);
        setSearchProductTerm('');
        await fetchPromotionProducts(promotion.id);
        await fetchAvailableProducts(promotion.id);
        setShowProductModal(true);
    };

    const handleAddProducts = async () => {
        if (selectedProductIds.length === 0) {
            showToast('Vui lòng chọn ít nhất 1 sản phẩm!', 'warning');
            return;
        }

        const token = getToken();
        if (!token) return;

        try {
            setSubmitting(true);

            for (const productId of selectedProductIds) {
                await axios.post(`${API_BASE_URL}/api/promotions/${currentPromotion.id}/products`,
                    { productId: productId },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }

            await fetchPromotionProducts(currentPromotion.id);
            await fetchAvailableProducts(currentPromotion.id);
            setSelectedProductIds([]);
            setSearchProductTerm('');

            showToast(`Thêm ${selectedProductIds.length} sản phẩm thành công!`, 'success');
        } catch (error) {
            console.error('Lỗi thêm sản phẩm:', error);
            showToast('Thêm sản phẩm thất bại!', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveProduct = async (productId, productName) => {
        if (!window.confirm(`Bạn có chắc muốn xóa "${productName}" khỏi khuyến mãi?`)) return;

        const token = getToken();
        if (!token) return;

        try {
            await axios.delete(`${API_BASE_URL}/api/promotions/${currentPromotion.id}/products/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await fetchPromotionProducts(currentPromotion.id);
            await fetchAvailableProducts(currentPromotion.id);

            showToast(`Đã xóa "${productName}" khỏi khuyến mãi!`, 'success');
        } catch (error) {
            console.error('Lỗi xóa sản phẩm:', error);
            showToast('Xóa sản phẩm thất bại!', 'error');
        }
    };

    const openEditModal = async (promotion) => {
        setEditingPromotion(promotion);
        const isPercentage = promotion.discountPercentage != null;

        setFormData({
            name: promotion.name || '',
            description: promotion.description || '',
            discountType: isPercentage ? 'percentage' : 'amount',
            discountPercentage: promotion.discountPercentage || '',
            discountAmount: promotion.discountAmount || '',
            startDate: promotion.startDate ? promotion.startDate.split('T')[0] : '',
            endDate: promotion.endDate ? promotion.endDate.split('T')[0] : '',
            isActive: promotion.isActive !== undefined ? promotion.isActive : true
        });

        setShowModal(true);
    };

    const resetModal = () => {
        setShowModal(false);
        setShowProductModal(false);
        setEditingPromotion(null);
        setCurrentPromotion(null);
        setSelectedProducts([]);
        setAvailableProducts([]);
        setSelectedProductIds([]);
        setPromotionProducts([]);
        setFormData({
            name: '',
            description: '',
            discountType: 'percentage',
            discountPercentage: '',
            discountAmount: '',
            startDate: '',
            endDate: '',
            isActive: true
        });
    };

    const promotionsArray = Array.isArray(promotions) ? promotions : [];

    const filteredPromotions = promotionsArray.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const isPromotionActive = (promo) => {
        if (!promo.isActive) return false;
        const now = new Date();
        const start = new Date(promo.startDate);
        const end = new Date(promo.endDate);
        return now >= start && now <= end;
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                <div style={{ width: '40px', height: '40px', border: '4px solid #2d2d3d', borderTop: '4px solid #ff6b6b', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                <p>Đang tải dữ liệu...</p>
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tag size={28} /> Quản lý Khuyến mãi
                    </h2>
                    <p style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <List size={14} /> Tổng số: {promotionsArray.length} chương trình
                    </p>
                </div>
                <button
                    onClick={() => { setShowModal(true); setEditingPromotion(null); setFormData({ name: '', description: '', discountType: 'percentage', discountPercentage: '', discountAmount: '', startDate: '', endDate: '', isActive: true }); }}
                    style={{ padding: '12px 24px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Plus size={18} /> Thêm khuyến mãi
                </button>
            </div>

            {/* Tìm kiếm */}
            <div style={{ marginBottom: '20px', position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input
                    type="text"
                    placeholder="Tìm kiếm khuyến mãi theo tên..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px 12px 48px', background: '#1a1a2e', border: '1px solid #2d2d3d', borderRadius: '12px', color: 'white', outline: 'none' }}
                />
            </div>

            {/* Nút làm mới */}
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={fetchPromotions} style={{ padding: '8px 16px', background: '#2d2d3d', color: '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={16} /> Làm mới
                </button>
            </div>

            {/* Danh sách khuyến mãi */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredPromotions.map(promo => (
                    <div key={promo.id} style={{
                        background: '#1a1a2e',
                        border: `2px solid ${isPromotionActive(promo) ? '#10B981' : '#2d2d3d'}`,
                        borderRadius: '16px',
                        padding: '20px',
                        transition: 'transform 0.2s'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                    <Gift size={20} color="#ff6b6b" />
                                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white' }}>{promo.name}</h3>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        background: isPromotionActive(promo) ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                        color: isPromotionActive(promo) ? '#10B981' : '#EF4444'
                                    }}>
                                        {isPromotionActive(promo) ? 'Đang chạy' : promo.isActive ? 'Sắp diễn ra' : 'Đã tắt'}
                                    </span>
                                </div>

                                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '12px' }}>
                                    {promo.description || 'Không có mô tả'}
                                </p>

                                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {promo.discountPercentage ? <Percent size={16} color="#ff6b6b" /> : <DollarSign size={16} color="#ff6b6b" />}
                                        <span style={{ color: '#ff6b6b', fontWeight: '600' }}>
                                            {promo.discountPercentage ? `${promo.discountPercentage}%` : formatCurrency(promo.discountAmount)}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Calendar size={16} color="#64748B" />
                                        <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                                            {formatDate(promo.startDate)} - {formatDate(promo.endDate)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => openProductManager(promo)}
                                    style={{
                                        padding: '8px 12px',
                                        background: 'rgba(16,185,129,0.1)',
                                        border: '1px solid rgba(16,185,129,0.3)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        color: '#10B981',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                    title="Quản lý sản phẩm"
                                >
                                    <Package size={16} /> SP
                                </button>
                                <button
                                    onClick={() => handleToggleStatus(promo.id, promo.isActive)}
                                    style={{
                                        padding: '8px 12px',
                                        background: promo.isActive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                        border: `1px solid ${promo.isActive ? '#EF4444' : '#10B981'}`,
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        color: promo.isActive ? '#EF4444' : '#10B981'
                                    }}
                                    title={promo.isActive ? 'Tắt khuyến mãi' : 'Bật khuyến mãi'}
                                >
                                    {promo.isActive ? 'Tắt' : 'Bật'}
                                </button>
                                <button
                                    onClick={() => openEditModal(promo)}
                                    style={{ padding: '8px 12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', cursor: 'pointer' }}
                                    title="Sửa"
                                >
                                    <Edit2 size={16} color="#3B82F6" />
                                </button>
                                <button
                                    onClick={() => handleDelete(promo.id, promo.name)}
                                    style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', cursor: 'pointer' }}
                                    title="Xóa"
                                >
                                    <Trash2 size={16} color="#EF4444" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredPromotions.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                        <Gift size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                        <p>Không tìm thấy chương trình khuyến mãi nào</p>
                    </div>
                )}
            </div>

            {/* MODAL THÊM/SỬA KHUYẾN MÃI */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }} onClick={resetModal}>
                    <div style={{
                        background: '#1a1a2e',
                        border: '1px solid #2d2d3d',
                        borderRadius: '20px',
                        width: '90%',
                        maxWidth: '600px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        padding: '28px'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '24px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {editingPromotion ? <Edit2 size={20} color="#3B82F6" /> : <Plus size={20} color="#ff6b6b" />}
                                {editingPromotion ? 'Sửa khuyến mãi' : 'Thêm khuyến mãi mới'}
                            </h3>
                            <button
                                onClick={resetModal}
                                disabled={submitting}
                                style={{ background: 'none', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', color: '#94a3b8', opacity: submitting ? 0.5 : 1 }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={editingPromotion ? handleUpdate : handleCreate}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>
                                    Tên khuyến mãi <span style={{ color: '#ff6b6b' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="VD: Khuyến mãi mùa hè, Giảm giá cuối tuần..."
                                    required
                                    disabled={submitting}
                                    style={{ width: '100%', padding: '12px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>
                                    Mô tả
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Mô tả chi tiết chương trình khuyến mãi..."
                                    rows={3}
                                    disabled={submitting}
                                    style={{ width: '100%', padding: '12px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: '10px', color: 'white', fontSize: '14px', resize: 'vertical', outline: 'none' }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>
                                    Loại giảm giá <span style={{ color: '#ff6b6b' }}>*</span>
                                </label>
                                <select
                                    value={formData.discountType}
                                    onChange={(e) => {
                                        setFormData({
                                            ...formData,
                                            discountType: e.target.value,
                                            discountPercentage: '',
                                            discountAmount: ''
                                        });
                                    }}
                                    disabled={submitting}
                                    style={{ width: '100%', padding: '12px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }}
                                >
                                    <option value="percentage">Giảm theo phần trăm (%)</option>
                                    <option value="amount">Giảm theo số tiền (VNĐ)</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>
                                    {formData.discountType === 'percentage' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VNĐ)'} <span style={{ color: '#ff6b6b' }}>*</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.discountType === 'percentage' ? formData.discountPercentage : formData.discountAmount}
                                    onChange={(e) => {
                                        if (formData.discountType === 'percentage') {
                                            let value = e.target.value;
                                            if (value > 100) value = 100;
                                            if (value < 0) value = 0;
                                            setFormData({ ...formData, discountPercentage: value });
                                        } else {
                                            setFormData({ ...formData, discountAmount: e.target.value });
                                        }
                                    }}
                                    placeholder={formData.discountType === 'percentage' ? "VD: 10, 20, 50..." : "VD: 50000, 100000..."}
                                    required
                                    min="0"
                                    max={formData.discountType === 'percentage' ? "100" : ""}
                                    step={formData.discountType === 'percentage' ? "1" : "1000"}
                                    disabled={submitting}
                                    style={{ width: '100%', padding: '12px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>
                                        Ngày bắt đầu <span style={{ color: '#ff6b6b' }}>*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        required
                                        disabled={submitting}
                                        style={{ width: '100%', padding: '12px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>
                                        Ngày kết thúc <span style={{ color: '#ff6b6b' }}>*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        required
                                        disabled={submitting}
                                        style={{ width: '100%', padding: '12px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>
                                    Trạng thái
                                </label>
                                <select
                                    value={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                                    disabled={submitting}
                                    style={{ width: '100%', padding: '12px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }}
                                >
                                    <option value="true">Hoạt động</option>
                                    <option value="false">Không hoạt động</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={resetModal}
                                    disabled={submitting}
                                    style={{ flex: 1, padding: '12px', background: '#2d2d3d', color: '#94a3b8', border: 'none', borderRadius: '10px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: '600' }}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{ flex: 1, padding: '12px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '10px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: submitting ? 0.7 : 1 }}
                                >
                                    {submitting ? 'Đang xử lý...' : (editingPromotion ? 'Cập nhật' : 'Thêm mới')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL QUẢN LÝ SẢN PHẨM */}
            {showProductModal && currentPromotion && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1001,
                    backdropFilter: 'blur(4px)'
                }} onClick={resetModal}>
                    <div style={{
                        background: '#1a1a2e',
                        border: '1px solid #2d2d3d',
                        borderRadius: '20px',
                        width: '90%',
                        maxWidth: '800px',
                        maxHeight: '85vh',
                        overflowY: 'auto',
                        padding: '28px'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Package size={20} /> Quản lý sản phẩm - {currentPromotion.name}
                            </h3>
                            <button
                                onClick={resetModal}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Sản phẩm đang áp dụng */}
                        <div style={{ marginBottom: '28px' }}>
                            <h4 style={{ color: '#10B981', marginBottom: '12px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Check size={18} /> Sản phẩm đang áp dụng ({promotionProducts.length})
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', maxHeight: '200px', overflowY: 'auto', padding: '12px', background: '#0f0f1a', borderRadius: '12px', border: '1px solid #2d2d3d' }}>
                                {promotionProducts.map(product => (
                                    <div key={product.id} style={{
                                        background: 'rgba(16,185,129,0.15)',
                                        border: '1px solid #10B981',
                                        borderRadius: '20px',
                                        padding: '8px 16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <span style={{ color: '#10B981', fontSize: '14px', fontWeight: '500' }}>{product.name}</span>
                                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{product.price?.toLocaleString('vi-VN')}đ</span>
                                        <button
                                            onClick={() => handleRemoveProduct(product.id, product.name)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '2px' }}
                                            title="Xóa khỏi khuyến mãi"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                {promotionProducts.length === 0 && (
                                    <p style={{ color: '#64748B', fontSize: '14px', textAlign: 'center', width: '100%', padding: '20px' }}>
                                        Chưa có sản phẩm nào được áp dụng khuyến mãi này
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Thêm sản phẩm mới */}
                        <div>
                            <h4 style={{ color: '#3B82F6', marginBottom: '12px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Plus size={18} /> Thêm sản phẩm vào khuyến mãi
                            </h4>

                            <div style={{ position: 'relative', marginBottom: '16px' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm sản phẩm..."
                                    value={searchProductTerm}
                                    onChange={(e) => setSearchProductTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 12px 12px 40px',
                                        background: '#0f0f1a',
                                        border: '1px solid #2d2d3d',
                                        borderRadius: '10px',
                                        color: 'white',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '10px',
                                maxHeight: '300px',
                                overflowY: 'auto',
                                padding: '12px',
                                background: '#0f0f1a',
                                borderRadius: '12px',
                                border: '1px solid #2d2d3d',
                                marginBottom: '16px'
                            }}>
                                {availableProductsList
                                    .filter(p => p.name?.toLowerCase().includes(searchProductTerm.toLowerCase()))
                                    .map(product => (
                                        <label key={product.id} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '8px 16px',
                                            background: selectedProductIds.includes(product.id) ? 'rgba(59,130,246,0.2)' : 'transparent',
                                            border: selectedProductIds.includes(product.id) ? '1px solid #3B82F6' : '1px solid #2d2d3d',
                                            borderRadius: '20px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedProductIds.includes(product.id)}
                                                onChange={() => {
                                                    if (selectedProductIds.includes(product.id)) {
                                                        setSelectedProductIds(selectedProductIds.filter(id => id !== product.id));
                                                    } else {
                                                        setSelectedProductIds([...selectedProductIds, product.id]);
                                                    }
                                                }}
                                                style={{ margin: 0, cursor: 'pointer' }}
                                            />
                                            <span style={{ color: '#e2e8f0', fontSize: '14px' }}>{product.name}</span>
                                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>{product.price?.toLocaleString('vi-VN')}đ</span>
                                        </label>
                                    ))}
                                {availableProductsList.filter(p => p.name?.toLowerCase().includes(searchProductTerm.toLowerCase())).length === 0 && (
                                    <p style={{ color: '#64748B', fontSize: '14px', textAlign: 'center', width: '100%', padding: '40px' }}>
                                        Không có sản phẩm nào để thêm
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={handleAddProducts}
                                disabled={selectedProductIds.length === 0 || submitting}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: selectedProductIds.length === 0 ? '#2d2d3d' : '#3B82F6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    cursor: selectedProductIds.length === 0 ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                    opacity: submitting ? 0.7 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                {submitting ? 'Đang thêm...' : `Thêm ${selectedProductIds.length} sản phẩm vào khuyến mãi`}
                            </button>
                        </div>

                        <button
                            onClick={resetModal}
                            style={{
                                width: '100%',
                                padding: '12px',
                                marginTop: '20px',
                                background: '#2d2d3d',
                                color: '#94a3b8',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                input:focus, textarea:focus, select:focus {
                    border-color: #ff6b6b !important;
                    box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.2);
                }
                
                ::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                
                ::-webkit-scrollbar-track {
                    background: #1a1a2e;
                    border-radius: 4px;
                }
                
                ::-webkit-scrollbar-thumb {
                    background: #2d2d3d;
                    border-radius: 4px;
                }
                
                ::-webkit-scrollbar-thumb:hover {
                    background: #ff6b6b;
                }
                
                button:hover {
                    transform: translateY(-1px);
                    transition: transform 0.2s;
                }
                
                button:active {
                    transform: translateY(0);
                }
            `}</style>
        </div>
    );
}