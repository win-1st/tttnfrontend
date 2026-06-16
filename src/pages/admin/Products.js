import React, { useEffect, useState } from 'react';
import { Package, Search, Plus, RefreshCw, X, Edit2, Trash2, Upload, Eye, EyeOff, Clock } from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import { useNavigate } from 'react-router-dom';

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
    const navigate = useNavigate();

    const API_BASE_URL = 'http://localhost:8080';

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
                { code: 'FOOD', name: 'Đồ ăn', icon: '🍽️' },
                { code: 'DRINK', name: 'Đồ uống', icon: '🍹' },
                { code: 'OTHER', name: 'Linh tinh', icon: '📦' },
                { code: 'TIME_BASED', name: 'Tính giờ (Tiền bàn)', icon: '⏱️' }
            ]);
        }
    };

    useEffect(() => { fetchProducts(); fetchCategories(); fetchProductTypes(); }, []);
    useEffect(() => { if (refreshTrigger) fetchProducts(); }, [refreshTrigger]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) { alert('Vui lòng chọn file ảnh!'); return; }
            if (file.size > 5 * 1024 * 1024) { alert('Kích thước ảnh không được vượt quá 5MB'); return; }
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
        if (!formData.name || !formData.categoryId) { alert('Vui lòng nhập đầy đủ tên và danh mục!'); return; }
        if (formData.productType === 'TIME_BASED') {
            if (!formData.pricePerMinute || formData.pricePerMinute <= 0) { alert('Vui lòng nhập giá mỗi phút!'); return; }
        } else {
            if (!formData.price || formData.price <= 0) { alert('Vui lòng nhập giá!'); return; }
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

            const response = await axiosClient.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (response.data?.success) {
                alert('Thêm sản phẩm thành công!');
                resetModal();
                fetchProducts();
                if (setRefreshTrigger) setRefreshTrigger(prev => prev + 1);
            } else {
                alert(response.data?.message || 'Thêm thất bại!');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Thêm thất bại!');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.categoryId) { alert('Vui lòng nhập đầy đủ!'); return; }
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

            const response = await axiosClient.put(`/products/${editingProduct.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (response.data?.success) {
                alert('Cập nhật thành công!');
                resetModal();
                fetchProducts();
                if (setRefreshTrigger) setRefreshTrigger(prev => prev + 1);
            } else {
                alert(response.data?.message || 'Cập nhật thất bại!');
            }
        } catch (error) {
            alert('Cập nhật thất bại!');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, name, productTypeCode) => {
        if (productTypeCode === 'TIME_BASED') { alert('Không thể xóa sản phẩm tính giờ!'); return; }
        if (!window.confirm(`Xóa "${name}"?`)) return;
        try {
            const response = await axiosClient.delete(`/products/${id}`);
            if (response.data?.success) {
                alert('Xóa thành công!');
                fetchProducts();
                if (setRefreshTrigger) setRefreshTrigger(prev => prev + 1);
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Xóa thất bại!');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const response = await axiosClient.patch(`/products/${id}/status?active=${!currentStatus}`);
            if (response.data?.success) {
                fetchProducts();
                if (setRefreshTrigger) setRefreshTrigger(prev => prev + 1);
            }
        } catch (error) {
            alert('Cập nhật thất bại!');
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
        setShowModal(false); setEditingProduct(null);
        setFormData({ name: '', description: '', price: '', categoryId: '', stockQuantity: '', imageUrl: '', active: true, imageFile: null, productType: 'FOOD', pricePerMinute: '' });
        setImagePreview('');
    };

    const formatPrice = (product) => {
        if (product.productTypeCode === 'TIME_BASED') return `${Number(product.pricePerMinute || 0).toLocaleString('vi-VN')}đ/phút`;
        return `${Number(product.price || 0).toLocaleString('vi-VN')}đ`;
    };

    const getProductTypeBadge = (code) => {
        const type = productTypes.find(t => t.code === code);
        if (!type) return { icon: null, text: code, color: '#64748B', bg: 'rgba(100,116,139,0.1)' };
        const colors = { TIME_BASED: ['#FBBF24', 'rgba(251,191,36,0.1)'], DRINK: ['#3B82F6', 'rgba(59,130,246,0.1)'], OTHER: ['#8B5CF6', 'rgba(139,92,246,0.1)'] };
        const [color, bg] = colors[code] || ['#10B981', 'rgba(16,185,129,0.1)'];
        return { icon: type.icon, text: type.name, color, bg };
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: '#ff6b6b' }}>Quản lý Sản phẩm</h2>
                    <p style={{ color: '#94a3b8' }}>Tổng số: {productsArray.length} sản phẩm</p>
                </div>
                <button onClick={() => {
                    setEditingProduct(null);
                    setFormData({
                        name: '', description: '', price: '', categoryId: '', stockQuantity: '',
                        imageUrl: '', active: true, imageFile: null, productType: 'FOOD', pricePerMinute: ''
                    });
                    setImagePreview('');
                    setShowModal(true);  // ← Phải có dòng này
                }}>
                    <Plus size={18} /> Thêm sản phẩm
                </button>
            </div>

            <div style={{ marginBottom: '20px', position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input type="text" placeholder="Tìm kiếm sản phẩm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 16px 12px 48px', background: '#1a1a2e', border: '1px solid #2d2d3d', borderRadius: '12px', color: 'white', outline: 'none' }} />
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
                            <th style={th}>ID</th><th style={th}>Hình</th><th style={th}>Tên</th><th style={th}>Danh mục</th>
                            <th style={{ ...th, textAlign: 'center' }}>Loại</th><th style={{ ...th, textAlign: 'right' }}>Giá</th>
                            <th style={{ ...th, textAlign: 'center' }}>Tồn</th><th style={{ ...th, textAlign: 'center' }}>TT</th>
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
                                        {p.imageUrl ? <img src={p.imageUrl.startsWith('http') ? p.imageUrl : `${API_BASE_URL}${p.imageUrl}`} alt="" style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} /> : <div style={{ width: '45px', height: '45px', background: '#2d2d3d', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={20} color="#64748B" /></div>}
                                    </td>
                                    <td style={{ ...td, fontWeight: '500' }}>{p.name}</td>
                                    <td style={{ ...td, color: '#94a3b8' }}>{p.category?.name || '-'}</td>
                                    <td style={{ ...td, textAlign: 'center' }}>
                                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: badge.bg, color: badge.color, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{badge.icon} {badge.text}</span>
                                    </td>
                                    <td style={{ ...td, textAlign: 'right', color: '#ff6b6b', fontWeight: '600' }}>{formatPrice(p)}</td>
                                    <td style={{ ...td, textAlign: 'center' }}>{p.productTypeCode === 'TIME_BASED' ? '∞' : (p.stockQuantity || 0)}</td>
                                    <td style={{ ...td, textAlign: 'center' }}>
                                        <button onClick={() => handleToggleStatus(p.id, p.active)} style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', background: p.active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: p.active ? '#10B981' : '#EF4444', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{p.active ? <Eye size={12} /> : <EyeOff size={12} />} {p.active ? 'Còn' : 'Hết'}</button>
                                    </td>
                                    <td style={{ ...td, textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                            <button onClick={() => openEditModal(p)} style={btnStyle('#3B82F6')}><Edit2 size={14} color="#3B82F6" /></button>
                                            {p.productTypeCode !== 'TIME_BASED' && <button onClick={() => handleDelete(p.id, p.name, p.productTypeCode)} style={btnStyle('#EF4444')}><Trash2 size={14} color="#EF4444" /></button>}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredProducts.length === 0 && (
                            <tr><td colSpan="9" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}><Package size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} /><p>Không tìm thấy sản phẩm nào</p></td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={resetModal}>
                    <div style={{ background: '#1a1a2e', border: '1px solid #2d2d3d', borderRadius: '20px', width: '90%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'white' }}>{editingProduct ? '✏️ Sửa' : '➕ Thêm mới'}</h3>
                            <button onClick={resetModal} disabled={submitting} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={24} /></button>
                        </div>
                        <form onSubmit={editingProduct ? handleUpdate : handleCreate}>
                            <Input label="Tên sản phẩm *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} disabled={submitting} />
                            <Textarea label="Mô tả" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} disabled={submitting} />
                            <Select label="Danh mục *" value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} disabled={submitting} options={[{ value: '', label: 'Chọn danh mục' }, ...categories.map(c => ({ value: c.id, label: c.name }))]} />
                            <Select label="Loại *" value={formData.productType} onChange={(e) => { const t = e.target.value; setFormData({ ...formData, productType: t, pricePerMinute: t === 'TIME_BASED' ? '666' : '', price: t === 'TIME_BASED' ? '0' : '', stockQuantity: t === 'TIME_BASED' ? '0' : '' }); }} disabled={submitting || (editingProduct?.productTypeCode === 'TIME_BASED')} options={productTypes.map(t => ({ value: t.code, label: `${t.icon} ${t.name}` }))} />
                            {formData.productType === 'TIME_BASED' ? (
                                <div style={{ marginBottom: '16px', background: 'rgba(251,191,36,0.1)', padding: '12px', borderRadius: '10px' }}>
                                    <label style={{ color: '#FBBF24', fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}><Clock size={16} style={{ display: 'inline', marginRight: '4px' }} /> Giá mỗi phút *</label>
                                    <input type="number" value={formData.pricePerMinute} onChange={(e) => setFormData({ ...formData, pricePerMinute: e.target.value })} required min="0" disabled={submitting} style={{ width: '100%', padding: '12px', background: '#0f0f1a', border: '1px solid #FBBF24', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }} />
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                    <Input label="Giá *" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} disabled={submitting} />
                                    <Input label="Tồn kho" type="number" value={formData.stockQuantity} onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })} disabled={submitting} />
                                </div>
                            )}
                            <Select label="Trạng thái" value={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })} disabled={submitting} options={[{ value: 'true', label: 'Hoạt động' }, { value: 'false', label: 'Không hoạt động' }]} />
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>Hình ảnh</label>
                                {imagePreview && (
                                    <div style={{ marginBottom: '12px', position: 'relative', display: 'inline-block' }}>
                                        <img src={imagePreview.startsWith('data:') || imagePreview.startsWith('http') ? imagePreview : `${API_BASE_URL}${imagePreview}`} alt="" style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                                        <button type="button" onClick={clearImage} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ff6b6b', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer' }}><X size={12} color="white" /></button>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <label style={{ padding: '8px 14px', background: '#2d2d3d', color: '#94a3b8', border: '1px solid #3d3d4d', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}><Upload size={14} /> Chọn ảnh<input type="file" accept="image/*" onChange={handleImageChange} disabled={submitting} style={{ display: 'none' }} /></label>
                                    <span style={{ color: '#64748B', fontSize: '11px' }}>hoặc</span>
                                    <input type="text" value={formData.imageUrl} onChange={(e) => { setFormData({ ...formData, imageUrl: e.target.value, imageFile: null }); setImagePreview(e.target.value); }} placeholder="URL ảnh" disabled={submitting} style={{ flex: 1, padding: '8px 10px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                <button type="button" onClick={resetModal} disabled={submitting} style={{ flex: 1, padding: '10px', background: '#2d2d3d', color: '#94a3b8', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '500' }}>Hủy</button>
                                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '10px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '10px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: '500' }}>{submitting ? 'Đang xử lý...' : (editingProduct ? 'Cập nhật' : 'Thêm mới')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const th = { padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 13 };
const td = { padding: '12px 16px', color: 'white', fontSize: 13 };
const btnStyle = (color) => ({ padding: '6px 10px', background: `rgba(${color === '#3B82F6' ? '59,130,246' : '239,68,68'},0.1)`, border: `1px solid rgba(${color === '#3B82F6' ? '59,130,246' : '239,68,68'},0.3)`, borderRadius: '8px', cursor: 'pointer' });

function Input({ label, type = 'text', value, onChange, disabled, required }) {
    return (
        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>{label}</label>
            <input type={type} value={value} onChange={onChange} required={required} disabled={disabled} style={{ width: '100%', padding: '12px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }} />
        </div>
    );
}

function Textarea({ label, value, onChange, disabled }) {
    return (
        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>{label}</label>
            <textarea value={value} onChange={onChange} rows={3} disabled={disabled} style={{ width: '100%', padding: '12px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: '10px', color: 'white', fontSize: '14px', resize: 'vertical', outline: 'none' }} />
        </div>
    );
}

function Select({ label, value, onChange, disabled, options }) {
    return (
        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>{label}</label>
            <select value={value} onChange={onChange} disabled={disabled} style={{ width: '100%', padding: '12px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }}>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}