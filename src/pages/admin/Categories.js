// Categories.js - Đã sửa để khớp với backend (dùng FormData)
import React, { useEffect, useState } from 'react';
import { FolderTree, Search, Plus, RefreshCw, X, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ToastNotification from '../../components/ToastNotification';

export default function Categories({ categories, setCategories, refreshTrigger, setRefreshTrigger }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    const API_BASE_URL = 'http://localhost:8080';

    const getToken = () => localStorage.getItem('token');

    // Hàm hiển thị toast
    const showToast = (message, type = 'info', duration = 3000) => {
        setToast({ message, type, duration });
        setTimeout(() => {
            setToast(null);
        }, duration);
    };

    // Fetch tất cả danh mục từ API
    const fetchCategories = async () => {
        const token = getToken();
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/categories`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data?.success && Array.isArray(response.data.data)) {
                setCategories(response.data.data);
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.error('Lỗi tải danh mục:', error);
            showToast('Không thể tải danh sách danh mục!', 'error');
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (refreshTrigger) fetchCategories();
    }, [refreshTrigger]);

    // Thêm danh mục mới - Dùng FormData để khớp với backend
    const handleCreate = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showToast('Vui lòng nhập tên danh mục', 'warning');
            return;
        }

        setSubmitting(true);

        const token = getToken();
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            // Tạo FormData để gửi lên backend
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name.trim());
            formDataToSend.append('description', formData.description || '');
            // Không gửi imageUrl và image vì đã bỏ chọn hình

            const response = await axios.post(`${API_BASE_URL}/api/categories`, formDataToSend, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data?.success) {
                showToast(`✅ Thêm danh mục "${formData.name}" thành công!`, 'success');
                resetModal();
                fetchCategories();
                if (setRefreshTrigger) setRefreshTrigger(prev => prev + 1);
            } else {
                showToast(response.data?.message || 'Thêm thất bại!', 'error');
            }
        } catch (error) {
            console.error('Lỗi thêm danh mục:', error);
            const errorMsg = error.response?.data?.message || error.response?.data || 'Thêm danh mục thất bại!';
            showToast(errorMsg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Sửa danh mục - Dùng FormData để khớp với backend
    const handleUpdate = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showToast('Vui lòng nhập tên danh mục', 'warning');
            return;
        }

        setSubmitting(true);

        const token = getToken();
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            // Tạo FormData để gửi lên backend
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name.trim());
            formDataToSend.append('description', formData.description || '');
            // Không gửi imageUrl và image vì đã bỏ chọn hình

            const response = await axios.put(`${API_BASE_URL}/api/categories/${editingCategory.id}`, formDataToSend, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data?.success) {
                showToast(`✅ Cập nhật danh mục "${formData.name}" thành công!`, 'success');
                resetModal();
                fetchCategories();
                if (setRefreshTrigger) setRefreshTrigger(prev => prev + 1);
            } else {
                showToast(response.data?.message || 'Cập nhật thất bại!', 'error');
            }
        } catch (error) {
            console.error('Lỗi cập nhật danh mục:', error);
            showToast('Cập nhật thất bại!', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Xóa danh mục
    const handleDelete = async (id, name) => {
        if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${name}"?\nLưu ý: Các sản phẩm trong danh mục này cũng sẽ bị xóa!`)) return;

        const token = getToken();
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await axios.delete(`${API_BASE_URL}/api/categories/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data?.success) {
                showToast(`✅ Xóa danh mục "${name}" thành công!`, 'success');
                fetchCategories();
                if (setRefreshTrigger) setRefreshTrigger(prev => prev + 1);
            } else {
                showToast(response.data?.message || 'Xóa thất bại!', 'error');
            }
        } catch (error) {
            console.error('Lỗi xóa danh mục:', error);
            if (error.response?.status === 403) {
                showToast('Bạn không có quyền xóa danh mục!', 'error');
            } else if (error.response?.status === 409) {
                showToast('Không thể xóa danh mục vì đang có sản phẩm liên quan!', 'warning');
            } else {
                showToast('Xóa thất bại!', 'error');
            }
        }
    };

    // Mở modal sửa
    const openEditModal = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name || '',
            description: category.description || ''
        });
        setShowModal(true);
    };

    // Reset modal
    const resetModal = () => {
        setShowModal(false);
        setEditingCategory(null);
        setFormData({
            name: '',
            description: ''
        });
    };

    // Đóng modal
    const closeModal = () => {
        if (!submitting) {
            resetModal();
        }
    };

    const filteredCategories = categories.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: '#ff6b6b' }}>Quản lý Danh mục</h2>
                    <p style={{ color: '#94a3b8' }}>Tổng số: {categories.length} danh mục</p>
                </div>
                <button
                    onClick={() => { setShowModal(true); setEditingCategory(null); setFormData({ name: '', description: '' }); }}
                    style={{ padding: '12px 24px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Plus size={18} /> Thêm danh mục
                </button>
            </div>

            {/* Tìm kiếm */}
            <div style={{ marginBottom: '20px', position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input
                    type="text"
                    placeholder="Tìm kiếm danh mục theo tên..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px 12px 48px', background: '#1a1a2e', border: '1px solid #2d2d3d', borderRadius: '12px', color: 'white', outline: 'none' }}
                />
            </div>

            {/* Nút làm mới */}
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={fetchCategories} style={{ padding: '8px 16px', background: '#2d2d3d', color: '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={16} /> Làm mới
                </button>
            </div>

            {/* Bảng danh mục */}
            <div style={{ background: '#1a1a2e', border: '1px solid #2d2d3d', borderRadius: '16px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
                            <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', width: '80px' }}>ID</th>
                            <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8' }}>Tên danh mục</th>
                            <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8' }}>Mô tả</th>
                            <th style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', width: '120px' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCategories.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #2d2d3d' }}>
                                <td style={{ padding: '16px', color: 'white' }}>{c.id}</td>
                                <td style={{ padding: '16px', color: 'white', fontWeight: '500' }}>
                                    <span>{c.name}</span>
                                </td>
                                <td style={{ padding: '16px', color: '#94a3b8', maxWidth: '300px' }}>{c.description || '-'}</td>
                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                        <button
                                            onClick={() => openEditModal(c)}
                                            style={{ padding: '8px 12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', cursor: 'pointer' }}
                                            title="Sửa"
                                        >
                                            <Edit2 size={16} color="#3B82F6" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(c.id, c.name)}
                                            style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', cursor: 'pointer' }}
                                            title="Xóa"
                                        >
                                            <Trash2 size={16} color="#EF4444" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredCategories.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                                    <FolderTree size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                                    <p>Không tìm thấy danh mục nào</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL THÊM/SỬA DANH MỤC */}
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
                }} onClick={closeModal}>
                    <div style={{
                        background: '#1a1a2e',
                        border: '1px solid #2d2d3d',
                        borderRadius: '20px',
                        width: '90%',
                        maxWidth: '550px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        padding: '28px'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '24px', fontWeight: '700', color: 'white' }}>
                                {editingCategory ? '✏️ Sửa danh mục' : '➕ Thêm danh mục mới'}
                            </h3>
                            <button
                                onClick={closeModal}
                                disabled={submitting}
                                style={{ background: 'none', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', color: '#94a3b8', opacity: submitting ? 0.5 : 1 }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={editingCategory ? handleUpdate : handleCreate}>
                            {/* Tên danh mục */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>
                                    Tên danh mục <span style={{ color: '#ff6b6b' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="VD: Đồ uống, Món ăn, Tiền giờ..."
                                    required
                                    disabled={submitting}
                                    style={{ width: '100%', padding: '12px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }}
                                />
                            </div>

                            {/* Mô tả */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>
                                    Mô tả
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Mô tả danh mục..."
                                    rows={3}
                                    disabled={submitting}
                                    style={{ width: '100%', padding: '12px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: '10px', color: 'white', fontSize: '14px', resize: 'vertical', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                <button
                                    type="button"
                                    onClick={closeModal}
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
                                    {submitting ? 'Đang xử lý...' : (editingCategory ? 'Cập nhật' : 'Thêm mới')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                input:focus, textarea:focus {
                    border-color: #ff6b6b !important;
                }
                
                ::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                
                ::-webkit-scrollbar-track {
                    background: #1a1a2e;
                }
                
                ::-webkit-scrollbar-thumb {
                    background: #2d2d3d;
                    border-radius: 4px;
                }
                
                ::-webkit-scrollbar-thumb:hover {
                    background: #ff6b6b;
                }
            `}</style>
        </div>
    );
}