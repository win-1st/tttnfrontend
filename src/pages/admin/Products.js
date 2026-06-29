// src/pages/admin/Products.js
import React, { useEffect, useState } from 'react';
import {
    Package, Search, Plus, RefreshCw, X, Edit2, Trash2, Upload,
    Eye, EyeOff, Clock, Tag, DollarSign, Box, Circle,
    CheckCircle, AlertCircle, Archive, Image, List,
    Grid, Coffee, Utensils, Beer, Pizza, ShoppingBag,
    Hash, Users, Star, Crown, Award
} from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import { useNavigate } from 'react-router-dom';
import ToastNotification from '../../components/ToastNotification';

export default function Products({ products = [], setProducts, refreshTrigger, setRefreshTrigger }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '', description: '', price: '', categoryId: '', stockQuantity: '',
        imageUrl: '', active: true, imageFile: null, productType: 'FOOD', pricePerMinute: ''
    });
    const [imagePreview, setImagePreview] = useState('');
    const [categories, setCategories] = useState([]);
    const [productTypes, setProductTypes] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    // ========== STATE CHO ĐỔI ĐIỂM ==========
    const [showRedeemModal, setShowRedeemModal] = useState(false);
    const [redeemProductId, setRedeemProductId] = useState(null);
    const [redeemProductName, setRedeemProductName] = useState('');
    const [redeemConfig, setRedeemConfig] = useState({
        isRedeemable: false,
        pointsRequired: 0
    });

    const navigate = useNavigate();

    const API_BASE_URL = 'http://localhost:8080';

    const showToast = (message, type = 'info', duration = 3000) => {
        setToast({ message, type, duration });
        setTimeout(() => {
            setToast(null);
        }, duration);
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get('/products');
            if (response.data?.success && Array.isArray(response.data.data)) {
                setProducts(response.data.data);
            } else {
                setProducts([]);
            }
        } catch (error) {
            console.error('Lỗi tải sản phẩm:', error);
            showToast('Không thể tải danh sách sản phẩm!', 'error');
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axiosClient.get('/categories');
            if (response.data?.success && Array.isArray(response.data.data)) {
                setCategories(response.data.data);
            }
        } catch (error) {
            console.error('Lỗi tải danh mục:', error);
        }
    };

    const fetchProductTypes = async () => {
        try {
            const response = await axiosClient.get('/product-types');
            if (response.data?.success && Array.isArray(response.data.data)) {
                setProductTypes(response.data.data);
            }
        } catch (error) {
            setProductTypes([
                { code: 'FOOD', name: 'Đồ ăn' },
                { code: 'DRINK', name: 'Đồ uống' },
                { code: 'OTHER', name: 'Linh tinh' },
                { code: 'TIME_BASED', name: 'Tính giờ (Tiền bàn)' }
            ]);
        }
    };

    useEffect(() => { fetchProducts(); fetchCategories(); fetchProductTypes(); }, []);
    useEffect(() => { if (refreshTrigger) fetchProducts(); }, [refreshTrigger]);

    const getTypeIcon = (code) => {
        switch (code) {
            case 'FOOD': return <Utensils size={14} />;
            case 'DRINK': return <Coffee size={14} />;
            case 'OTHER': return <Box size={14} />;
            case 'TIME_BASED': return <Clock size={14} />;
            default: return <Package size={14} />;
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showToast('Vui lòng chọn file ảnh!', 'warning');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showToast('Kích thước ảnh không được vượt quá 5MB', 'warning');
                return;
            }
            setFormData({ ...formData, imageFile: file, imageUrl: '' });
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const clearImage = () => {
        setFormData({ ...formData, imageFile: null, imageUrl: '' });
        setImagePreview('');
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.categoryId) {
            showToast('Vui lòng nhập đầy đủ tên và danh mục!', 'warning');
            return;
        }
        if (formData.productType === 'TIME_BASED') {
            if (!formData.pricePerMinute || formData.pricePerMinute <= 0) {
                showToast('Vui lòng nhập giá mỗi phút!', 'warning');
                return;
            }
        } else {
            if (!formData.price || formData.price <= 0) {
                showToast('Vui lòng nhập giá!', 'warning');
                return;
            }
        }

        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('name', formData.name);
            fd.append('description', formData.description || '');
            fd.append('price', formData.productType === 'TIME_BASED' ? '0' : formData.price);
            fd.append('categoryId', formData.categoryId);
            fd.append('stockQuantity', formData.productType === 'TIME_BASED' ? '0' : (formData.stockQuantity || '0'));
            fd.append('active', formData.active);
            fd.append('productType', formData.productType);
            if (formData.productType === 'TIME_BASED' && formData.pricePerMinute) fd.append('pricePerMinute', formData.pricePerMinute);
            if (formData.imageFile) fd.append('image', formData.imageFile);
            else if (formData.imageUrl) fd.append('imageUrl', formData.imageUrl);

            const response = await axiosClient.post('/products', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data?.success) {
                showToast(`Thêm sản phẩm "${formData.name}" thành công!`, 'success');
                resetModal();
                fetchProducts();
                if (setRefreshTrigger) setRefreshTrigger(prev => prev + 1);
            } else {
                showToast(response.data?.message || 'Thêm thất bại!', 'error');
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Thêm thất bại!';
            showToast(errorMsg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.categoryId) {
            showToast('Vui lòng nhập đầy đủ thông tin!', 'warning');
            return;
        }
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('name', formData.name);
            fd.append('description', formData.description || '');
            if (formData.productType === 'TIME_BASED') {
                fd.append('price', '0');
                fd.append('stockQuantity', '0');
                fd.append('pricePerMinute', formData.pricePerMinute);
            } else {
                fd.append('price', formData.price);
                fd.append('stockQuantity', formData.stockQuantity || '0');
            }
            fd.append('categoryId', formData.categoryId);
            fd.append('active', formData.active);
            fd.append('productType', formData.productType);
            if (formData.imageFile) fd.append('image', formData.imageFile);
            else if (formData.imageUrl && formData.imageUrl !== editingProduct?.imageUrl) fd.append('imageUrl', formData.imageUrl);

            const response = await axiosClient.put(`/products/${editingProduct.id}`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data?.success) {
                showToast(`Cập nhật sản phẩm "${formData.name}" thành công!`, 'success');
                resetModal();
                fetchProducts();
                if (setRefreshTrigger) setRefreshTrigger(prev => prev + 1);
            } else {
                showToast(response.data?.message || 'Cập nhật thất bại!', 'error');
            }
        } catch (error) {
            showToast('Cập nhật thất bại!', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, name, productTypeCode) => {
        if (productTypeCode === 'TIME_BASED') {
            showToast('Không thể xóa sản phẩm tính giờ!', 'warning');
            return;
        }
        if (!window.confirm(`Bạn có chắc muốn xóa sản phẩm "${name}"?`)) return;

        try {
            const response = await axiosClient.delete(`/products/${id}`);
            if (response.data?.success) {
                showToast(`Xóa sản phẩm "${name}" thành công!`, 'success');
                fetchProducts();
                if (setRefreshTrigger) setRefreshTrigger(prev => prev + 1);
            } else {
                showToast(response.data?.message || 'Xóa thất bại!', 'error');
            }
        } catch (error) {
            showToast(error.response?.data?.message || 'Xóa thất bại!', 'error');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const response = await axiosClient.patch(`/products/${id}/status?active=${!currentStatus}`);
            if (response.data?.success) {
                const statusText = !currentStatus ? 'Hoạt động' : 'Không hoạt động';
                showToast(`Đã cập nhật trạng thái thành: ${statusText}`, 'success');
                fetchProducts();
                if (setRefreshTrigger) setRefreshTrigger(prev => prev + 1);
            } else {
                showToast(response.data?.message || 'Cập nhật thất bại!', 'error');
            }
        } catch (error) {
            showToast('Cập nhật thất bại!', 'error');
        }
    };

    // ========== FUNCTIONS CHO ĐỔI ĐIỂM ==========

    const openRedeemModal = (product) => {
        setRedeemProductId(product.id);
        setRedeemProductName(product.name);
        setRedeemConfig({
            isRedeemable: product.isRedeemable || false,
            pointsRequired: product.pointsRequired || 0
        });
        setShowRedeemModal(true);
    };

    const handleUpdateRedeemConfig = async (e) => {
        e.preventDefault();

        if (redeemConfig.isRedeemable && (!redeemConfig.pointsRequired || redeemConfig.pointsRequired <= 0)) {
            showToast('Vui lòng nhập số điểm cần để đổi!', 'warning');
            return;
        }

        try {
            const response = await axiosClient.patch(`/products/${redeemProductId}/redeem-config`, {
                isRedeemable: redeemConfig.isRedeemable,
                pointsRequired: redeemConfig.pointsRequired
            });

            if (response.data?.success) {
                showToast(`Cấu hình đổi điểm cho "${redeemProductName}" thành công!`, 'success');
                setShowRedeemModal(false);
                fetchProducts();
                if (setRefreshTrigger) setRefreshTrigger(prev => prev + 1);
            } else {
                showToast(response.data?.message || 'Cấu hình thất bại!', 'error');
            }
        } catch (error) {
            showToast(error.response?.data?.message || 'Cấu hình thất bại!', 'error');
        }
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name || '', description: product.description || '',
            price: product.price || '', categoryId: product.category?.id || '',
            stockQuantity: product.stockQuantity || '', imageUrl: product.imageUrl || '',
            active: product.active !== undefined ? product.active : true, imageFile: null,
            productType: product.productTypeCode || 'FOOD', pricePerMinute: product.pricePerMinute || ''
        });
        setImagePreview(product.imageUrl || '');
        setShowModal(true);
    };

    const resetModal = () => {
        setShowModal(false);
        setEditingProduct(null);
        setFormData({
            name: '', description: '', price: '', categoryId: '', stockQuantity: '',
            imageUrl: '', active: true, imageFile: null, productType: 'FOOD', pricePerMinute: ''
        });
        setImagePreview('');
    };

    const formatPrice = (product) => {
        if (product.productTypeCode === 'TIME_BASED') return `${Number(product.pricePerMinute || 0).toLocaleString('vi-VN')}đ/phút`;
        return `${Number(product.price || 0).toLocaleString('vi-VN')}đ`;
    };

    const getProductTypeBadge = (code) => {
        const type = productTypes.find(t => t.code === code);
        if (!type) return { icon: <Package size={12} />, text: code, color: '#64748B', bg: 'rgba(100,116,139,0.1)' };
        const colors = {
            TIME_BASED: ['#FBBF24', 'rgba(251,191,36,0.1)'],
            DRINK: ['#3B82F6', 'rgba(59,130,246,0.1)'],
            OTHER: ['#8B5CF6', 'rgba(139,92,246,0.1)']
        };
        const [color, bg] = colors[code] || ['#10B981', 'rgba(16,185,129,0.1)'];
        return {
            icon: getTypeIcon(code),
            text: type.name,
            color,
            bg
        };
    };

    const productsArray = Array.isArray(products) ? products : [];
    const filteredProducts = productsArray.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                <div style={{ width: '40px', height: '40px', border: '4px solid #2d2d3d', borderTop: '4px solid #ff6b6b', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                <p>Đang tải dữ liệu...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Package size={28} /> Quản lý Sản phẩm
                    </h2>
                    <p style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Grid size={14} /> Tổng số: {productsArray.length} sản phẩm
                    </p>
                </div>
                <button onClick={() => {
                    setEditingProduct(null);
                    setFormData({
                        name: '', description: '', price: '', categoryId: '', stockQuantity: '',
                        imageUrl: '', active: true, imageFile: null, productType: 'FOOD', pricePerMinute: ''
                    });
                    setImagePreview('');
                    setShowModal(true);
                }} style={{ padding: '12px 24px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} /> Thêm sản phẩm
                </button>
            </div>

            <div style={{ marginBottom: '20px', position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px 12px 48px', background: '#1a1a2e', border: '1px solid #2d2d3d', borderRadius: '12px', color: 'white', outline: 'none' }}
                />
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={fetchProducts} style={{ padding: '8px 16px', background: '#2d2d3d', color: '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={16} /> Làm mới
                </button>
            </div>

            <div style={{ background: '#1a1a2e', border: '1px solid #2d2d3d', borderRadius: '16px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
                            <th style={th}>ID</th>
                            <th style={th}>Hình</th>
                            <th style={th}>Tên</th>
                            <th style={th}>Danh mục</th>
                            <th style={{ ...th, textAlign: 'center' }}>Loại</th>
                            <th style={{ ...th, textAlign: 'right' }}>Giá</th>
                            <th style={{ ...th, textAlign: 'center' }}>Tồn</th>
                            <th style={{ ...th, textAlign: 'center' }}>TT</th>
                            <th style={{ ...th, textAlign: 'center' }}>Đổi điểm</th>
                            <th style={{ ...th, textAlign: 'center' }}>#</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(p => {
                            const badge = getProductTypeBadge(p.productTypeCode);
                            return (
                                <tr key={p.id} style={{ borderBottom: '1px solid #2d2d3d' }}>
                                    <td style={td}>{p.id}</td>
                                    <td style={td}>
                                        {p.imageUrl ?
                                            <img
                                                src={p.imageUrl.startsWith('http') ? p.imageUrl : `${API_BASE_URL}${p.imageUrl}`}
                                                alt=""
                                                style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover' }}
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                            :
                                            <div style={{ width: '45px', height: '45px', background: '#2d2d3d', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Image size={20} color="#64748B" />
                                            </div>
                                        }
                                    </td>
                                    <td style={{ ...td, fontWeight: '500' }}>{p.name}</td>
                                    <td style={{ ...td, color: '#94a3b8' }}>{p.category?.name || '-'}</td>
                                    <td style={{ ...td, textAlign: 'center' }}>
                                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: badge.bg, color: badge.color, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                            {badge.icon} {badge.text}
                                        </span>
                                    </td>
                                    <td style={{ ...td, textAlign: 'right', color: '#ff6b6b', fontWeight: '600' }}>{formatPrice(p)}</td>
                                    <td style={{ ...td, textAlign: 'center' }}>{p.productTypeCode === 'TIME_BASED' ? '∞' : (p.stockQuantity || 0)}</td>
                                    <td style={{ ...td, textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleToggleStatus(p.id, p.active)}
                                            style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', background: p.active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: p.active ? '#10B981' : '#EF4444', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            {p.active ? <Eye size={12} /> : <EyeOff size={12} />} {p.active ? 'Còn' : 'Hết'}
                                        </button>
                                    </td>
                                    {/* ========== CỘT ĐỔI ĐIỂM ========== */}
                                    <td style={{ ...td, textAlign: 'center' }}>
                                        {p.productTypeCode !== 'TIME_BASED' ? (
                                            <button
                                                onClick={() => openRedeemModal(p)}
                                                style={{
                                                    padding: '5px 10px',
                                                    borderRadius: '8px',
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    background: p.isRedeemable ? 'rgba(139,92,246,0.15)' : 'rgba(100,116,139,0.1)',
                                                    color: p.isRedeemable ? '#8B5CF6' : '#64748B',
                                                    border: p.isRedeemable ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(100,116,139,0.2)',
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    transition: 'all 0.2s'
                                                }}
                                                title={p.isRedeemable ? `${p.pointsRequired || 0} điểm/sản phẩm` : 'Nhấn để cấu hình'}
                                            >
                                                {p.isRedeemable ? (
                                                    <><Award size={12} /> {p.pointsRequired || 0}đ</>
                                                ) : (
                                                    <><Award size={12} /> OFF</>
                                                )}
                                            </button>
                                        ) : (
                                            <span style={{ color: '#64748B', fontSize: '11px' }}>-</span>
                                        )}
                                    </td>
                                    <td style={{ ...td, textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                            <button onClick={() => openEditModal(p)} style={btnStyle('#3B82F6')}>
                                                <Edit2 size={14} color="#3B82F6" />
                                            </button>
                                            {p.productTypeCode !== 'TIME_BASED' &&
                                                <button onClick={() => handleDelete(p.id, p.name, p.productTypeCode)} style={btnStyle('#EF4444')}>
                                                    <Trash2 size={14} color="#EF4444" />
                                                </button>
                                            }
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan="10" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                                    <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                                    <p>Không tìm thấy sản phẩm nào</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ========== MODAL THÊM/SỬA SẢN PHẨM ========== */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={resetModal}>
                    <div style={{
                        background: '#1a1a2e', border: '1px solid #2d2d3d',
                        borderRadius: '20px', width: '90%', maxWidth: '550px',
                        maxHeight: '90vh', overflowY: 'auto', padding: '28px'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {editingProduct ? <Edit2 size={20} color="#3B82F6" /> : <Plus size={20} color="#ff6b6b" />}
                                {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
                            </h3>
                            <button onClick={resetModal} disabled={submitting} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={editingProduct ? handleUpdate : handleCreate}>
                            <Input
                                label="Tên sản phẩm *"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                disabled={submitting}
                            />
                            <Textarea
                                label="Mô tả"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                disabled={submitting}
                            />
                            <Select
                                label="Danh mục *"
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                disabled={submitting}
                                options={[
                                    { value: '', label: 'Chọn danh mục' },
                                    ...categories.map(c => ({ value: c.id, label: c.name }))
                                ]}
                            />
                            <Select
                                label="Loại sản phẩm *"
                                value={formData.productType}
                                onChange={(e) => {
                                    const t = e.target.value;
                                    setFormData({
                                        ...formData,
                                        productType: t,
                                        pricePerMinute: t === 'TIME_BASED' ? '' : '',
                                        price: t === 'TIME_BASED' ? '0' : '',
                                        stockQuantity: t === 'TIME_BASED' ? '0' : ''
                                    });
                                }}
                                disabled={submitting || (editingProduct?.productTypeCode === 'TIME_BASED')}
                                options={productTypes.map(t => ({ value: t.code, label: t.name }))}
                            />

                            {formData.productType === 'TIME_BASED' ? (
                                <div style={{ marginBottom: '16px', background: 'rgba(251,191,36,0.1)', padding: '12px', borderRadius: '10px' }}>
                                    <label style={{ color: '#FBBF24', fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                                        <Clock size={16} style={{ display: 'inline', marginRight: '4px' }} /> Giá mỗi phút *
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.pricePerMinute}
                                        onChange={(e) => setFormData({ ...formData, pricePerMinute: e.target.value })}
                                        required
                                        min="0"
                                        disabled={submitting}
                                        style={{ width: '100%', padding: '12px', background: '#0f0f1a', border: '1px solid #FBBF24', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }}
                                    />
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                    <Input
                                        label="Giá *"
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        disabled={submitting}
                                    />
                                    <Input
                                        label="Tồn kho"
                                        type="number"
                                        value={formData.stockQuantity}
                                        onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                                        disabled={submitting}
                                    />
                                </div>
                            )}

                            <Select
                                label="Trạng thái"
                                value={formData.active}
                                onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                                disabled={submitting}
                                options={[
                                    { value: 'true', label: 'Hoạt động' },
                                    { value: 'false', label: 'Không hoạt động' }
                                ]}
                            />

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>
                                    <Image size={14} style={{ display: 'inline', marginRight: '4px' }} /> Hình ảnh
                                </label>
                                {imagePreview && (
                                    <div style={{ marginBottom: '12px', position: 'relative', display: 'inline-block' }}>
                                        <img
                                            src={imagePreview.startsWith('data:') || imagePreview.startsWith('http') ? imagePreview : `${API_BASE_URL}${imagePreview}`}
                                            alt=""
                                            style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={clearImage}
                                            style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ff6b6b', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer' }}
                                        >
                                            <X size={12} color="white" />
                                        </button>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <label style={{ padding: '8px 14px', background: '#2d2d3d', color: '#94a3b8', border: '1px solid #3d3d4d', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                        <Upload size={14} /> Chọn ảnh
                                        <input type="file" accept="image/*" onChange={handleImageChange} disabled={submitting} style={{ display: 'none' }} />
                                    </label>
                                    <span style={{ color: '#64748B', fontSize: '11px' }}>hoặc</span>
                                    <input
                                        type="text"
                                        value={formData.imageUrl}
                                        onChange={(e) => {
                                            setFormData({ ...formData, imageUrl: e.target.value, imageFile: null });
                                            setImagePreview(e.target.value);
                                        }}
                                        placeholder="URL ảnh"
                                        disabled={submitting}
                                        style={{ flex: 1, padding: '8px 10px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                <button
                                    type="button"
                                    onClick={resetModal}
                                    disabled={submitting}
                                    style={{ flex: 1, padding: '10px', background: '#2d2d3d', color: '#94a3b8', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '500' }}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{ flex: 1, padding: '10px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '10px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: '500' }}
                                >
                                    {submitting ? 'Đang xử lý...' : (editingProduct ? 'Cập nhật' : 'Thêm mới')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========== MODAL CẤU HÌNH ĐỔI ĐIỂM ========== */}
            {showRedeemModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1001
                }} onClick={() => setShowRedeemModal(false)}>
                    <div style={{
                        background: '#1a1a2e', border: '1px solid #2d2d3d',
                        borderRadius: '20px', width: '90%', maxWidth: '450px',
                        padding: '28px'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Award size={20} color="#8B5CF6" />
                                Cấu hình đổi điểm
                            </h3>
                            <button onClick={() => setShowRedeemModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
                            Sản phẩm: <strong style={{ color: 'white' }}>{redeemProductName}</strong>
                        </p>

                        <form onSubmit={handleUpdateRedeemConfig}>
                            {/* Toggle cho phép đổi điểm */}
                            <div style={{
                                marginBottom: '20px',
                                background: '#0f0f1a',
                                padding: '16px',
                                borderRadius: '12px',
                                border: redeemConfig.isRedeemable ? '1px solid rgba(139,92,246,0.3)' : '1px solid #2d2d3d'
                            }}>
                                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                                    <span style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>
                                        Cho phép đổi bằng điểm
                                    </span>
                                    <div
                                        onClick={() => setRedeemConfig({ ...redeemConfig, isRedeemable: !redeemConfig.isRedeemable })}
                                        style={{
                                            width: '48px',
                                            height: '26px',
                                            background: redeemConfig.isRedeemable ? '#8B5CF6' : '#2d2d3d',
                                            borderRadius: '13px',
                                            position: 'relative',
                                            transition: 'all 0.3s',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{
                                            width: '22px',
                                            height: '22px',
                                            background: 'white',
                                            borderRadius: '50%',
                                            position: 'absolute',
                                            top: '2px',
                                            left: redeemConfig.isRedeemable ? '24px' : '2px',
                                            transition: 'all 0.3s'
                                        }}></div>
                                    </div>
                                </label>
                            </div>

                            {/* Input số điểm */}
                            {redeemConfig.isRedeemable && (
                                <div style={{
                                    marginBottom: '20px',
                                    background: 'rgba(139,92,246,0.05)',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(139,92,246,0.2)'
                                }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>
                                        <Award size={14} style={{ display: 'inline', marginRight: '4px', color: '#8B5CF6' }} />
                                        Số điểm cần để đổi
                                    </label>
                                    <input
                                        type="number"
                                        value={redeemConfig.pointsRequired}
                                        onChange={(e) => setRedeemConfig({ ...redeemConfig, pointsRequired: parseInt(e.target.value) || 0 })}
                                        min="1"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            background: '#0f0f1a',
                                            border: '1px solid rgba(139,92,246,0.3)',
                                            borderRadius: '10px',
                                            color: 'white',
                                            fontSize: '18px',
                                            fontWeight: '600',
                                            outline: 'none',
                                            textAlign: 'center'
                                        }}
                                        placeholder="Nhập số điểm..."
                                    />
                                    <p style={{ color: '#64748B', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>
                                        💡 Ví dụ: 100 điểm để đổi 1 {redeemProductName}
                                    </p>
                                </div>
                            )}

                            {!redeemConfig.isRedeemable && (
                                <div style={{
                                    marginBottom: '20px',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    background: 'rgba(100,116,139,0.05)',
                                    border: '1px solid #2d2d3d',
                                    textAlign: 'center',
                                    color: '#64748B',
                                    fontSize: '13px'
                                }}>
                                    🔒 Sản phẩm này không cho phép đổi bằng điểm
                                </div>
                            )}

                            {/* Nút hành động */}
                            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowRedeemModal(false)}
                                    style={{
                                        flex: 1, padding: '12px',
                                        background: '#2d2d3d', color: '#94a3b8',
                                        border: 'none', borderRadius: '10px',
                                        cursor: 'pointer', fontWeight: '500',
                                        fontSize: '14px'
                                    }}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1, padding: '12px',
                                        background: redeemConfig.isRedeemable ? '#8B5CF6' : '#64748B',
                                        color: 'white', border: 'none',
                                        borderRadius: '10px', cursor: 'pointer',
                                        fontWeight: '500', fontSize: '14px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <Award size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                    Lưu cấu hình
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
const th = { padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 13 };
const td = { padding: '12px 16px', color: 'white', fontSize: 13 };
const btnStyle = (color) => ({
    padding: '6px 10px',
    background: `rgba(${color === '#3B82F6' ? '59,130,246' : '239,68,68'},0.1)`,
    border: `1px solid rgba(${color === '#3B82F6' ? '59,130,246' : '239,68,68'},0.3)`,
    borderRadius: '8px',
    cursor: 'pointer'
});

// ========== COMPONENTS ==========
function Input({ label, type = 'text', value, onChange, disabled, required }) {
    return (
        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>{label}</label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                disabled={disabled}
                style={{ width: '100%', padding: '12px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }}
            />
        </div>
    );
}

function Textarea({ label, value, onChange, disabled }) {
    return (
        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>{label}</label>
            <textarea
                value={value}
                onChange={onChange}
                rows={3}
                disabled={disabled}
                style={{ width: '100%', padding: '12px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: '10px', color: 'white', fontSize: '14px', resize: 'vertical', outline: 'none' }}
            />
        </div>
    );
}

function Select({ label, value, onChange, disabled, options }) {
    return (
        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>{label}</label>
            <select
                value={value}
                onChange={onChange}
                disabled={disabled}
                style={{ width: '100%', padding: '12px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }}
            >
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}