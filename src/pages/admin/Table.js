// TableManagement.js
import React, { useEffect, useState } from 'react';
import {
    Table, Search, Plus, RefreshCw, X, Trash2,
    Edit2, Eye, EyeOff, AlertCircle, CheckCircle,
    Star, Crown, Award, Package, Users, Hash
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ToastNotification from '../../components/ToastNotification';

export default function TableManagement({ tables, setTables, refreshTrigger, setRefreshTrigger }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        number: '',
        capacity: '',
        type: 'STANDARD'
    });
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    // ===== STATE CHO TOAST =====
    const [toast, setToast] = useState(null);

    // Hàm hiển thị toast
    const showToast = (message, type = 'info', duration = 3000) => {
        setToast({ message, type, duration });
        setTimeout(() => {
            setToast(null);
        }, duration);
    };

    const API_BASE_URL = 'http://localhost:8080';
    const getToken = () => localStorage.getItem('token');

    // Fetch tất cả bàn
    const fetchTables = async () => {
        const token = getToken();
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/tables`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data?.success && Array.isArray(response.data.data)) {
                setTables(response.data.data);
            } else if (Array.isArray(response.data)) {
                setTables(response.data);
            } else {
                setTables([]);
            }
        } catch (error) {
            console.error('Lỗi tải bàn:', error);
            showToast('Không thể tải danh sách bàn!', 'error');
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }
            setTables([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTables();
    }, []);

    useEffect(() => {
        if (refreshTrigger) fetchTables();
    }, [refreshTrigger]);

    // Kiểm tra số bàn đã tồn tại chưa
    const isTableNumberExist = (number) => {
        return tables.some(table => table.number === parseInt(number));
    };

    // Thêm bàn mới
    const handleCreate = async (e) => {
        e.preventDefault();

        if (!formData.number || !formData.capacity) {
            showToast('Vui lòng nhập đầy đủ số bàn và sức chứa!', 'warning');
            return;
        }

        if (isTableNumberExist(formData.number)) {
            showToast(`Số bàn ${formData.number} đã tồn tại!`, 'error');
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
                name: formData.name || `Bàn ${formData.number}`,
                number: parseInt(formData.number),
                capacity: parseInt(formData.capacity),
                type: formData.type
            };

            const response = await axios.post(`${API_BASE_URL}/api/tables`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data?.success) {
                showToast(`✅ Thêm bàn số ${formData.number} thành công!`, 'success');
                setShowModal(false);
                setFormData({ name: '', number: '', capacity: '', type: 'STANDARD' });
                fetchTables();
                if (setRefreshTrigger) setRefreshTrigger(prev => prev + 1);
            } else {
                showToast(response.data?.message || 'Thêm bàn thất bại!', 'error');
            }
        } catch (error) {
            console.error('Lỗi thêm bàn:', error);
            const errorMsg = error.response?.data?.message || error.response?.data || 'Thêm bàn thất bại!';
            showToast(errorMsg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Cập nhật trạng thái bàn
    const handleUpdateStatus = async (id, status) => {
        const token = getToken();
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await axios.patch(
                `${API_BASE_URL}/api/tables/${id}/status?status=${status}`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data?.success) {
                const statusText = getStatusText(status);
                showToast(`✅ Đã cập nhật trạng thái thành: ${statusText}`, 'success');
                fetchTables();
                setRefreshTrigger(prev => prev + 1);
            } else {
                showToast(response.data?.message || 'Cập nhật thất bại!', 'error');
            }
        } catch (error) {
            console.error('Lỗi cập nhật trạng thái:', error);
            showToast('Cập nhật trạng thái thất bại!', 'error');
        }
    };

    // Xóa bàn
    const handleDelete = async (id, tableNumber) => {
        if (!window.confirm(`Bạn có chắc muốn xóa bàn số ${tableNumber}?`)) return;

        const token = getToken();
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await axios.delete(`${API_BASE_URL}/api/tables/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data?.success) {
                showToast(`✅ Xóa bàn số ${tableNumber} thành công!`, 'success');
                fetchTables();
                setRefreshTrigger(prev => prev + 1);
            } else {
                showToast(response.data?.message || 'Xóa thất bại!', 'error');
            }
        } catch (error) {
            console.error('Lỗi xóa bàn:', error);
            showToast(error.response?.data?.message || 'Xóa bàn thất bại!', 'error');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'FREE': return '#10B981';
            case 'OCCUPIED': return '#EF4444';
            case 'RESERVED': return '#FBBF24';
            case 'MAINTENANCE': return '#64748B';
            default: return '#64748B';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'FREE': return 'Trống';
            case 'OCCUPIED': return 'Đang dùng';
            case 'RESERVED': return 'Đã đặt';
            case 'MAINTENANCE': return 'Bảo trì';
            default: return status;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'VIP': return '#F59E0B';
            case 'PREMIUM': return '#8B5CF6';
            default: return '#64748B';
        }
    };

    const getTypeText = (type) => {
        switch (type) {
            case 'VIP': return 'VIP';
            case 'PREMIUM': return 'Premium';
            default: return 'Tiêu chuẩn';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'VIP': return <Star size={14} color="#F59E0B" />;
            case 'PREMIUM': return <Crown size={14} color="#8B5CF6" />;
            default: return <Award size={14} color="#64748B" />;
        }
    };

    const filteredTables = tables.filter(t =>
        t.number?.toString().includes(searchTerm) ||
        t.tableName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.type?.toLowerCase().includes(searchTerm.toLowerCase())
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
            {/* ===== RENDER TOAST ===== */}
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
                        <Table size={28} /> Quản lý Bàn Billiards
                    </h2>
                    <p style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} /> Tổng số: {tables.length} bàn
                    </p>
                </div>
                <button
                    onClick={() => { setShowModal(true); setFormData({ name: '', number: '', capacity: '', type: 'STANDARD' }); }}
                    style={{ padding: '12px 24px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Plus size={18} /> Thêm bàn
                </button>
            </div>

            {/* Tìm kiếm */}
            <div style={{ marginBottom: '20px', position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input
                    type="text"
                    placeholder="Tìm kiếm bàn (số bàn, tên bàn, loại bàn)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px 12px 48px', background: '#1a1a2e', border: '1px solid #2d2d3d', borderRadius: '12px', color: 'white', outline: 'none' }}
                />
            </div>

            {/* Nút làm mới */}
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={fetchTables} style={{ padding: '8px 16px', background: '#2d2d3d', color: '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={16} /> Làm mới
                </button>
            </div>

            {/* Danh sách bàn */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {filteredTables.map(table => (
                    <div key={table.id} style={{ background: '#1a1a2e', border: `2px solid ${getStatusColor(table.status)}`, borderRadius: '16px', padding: '20px', transition: 'transform 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {table.tableName || `Bàn ${table.number}`}
                                </h3>
                                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Hash size={12} /> Số bàn: #{table.number} | ID: {table.id}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDelete(table.id, table.number)}
                                style={{ padding: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', cursor: 'pointer' }}
                                title="Xóa bàn"
                            >
                                <Trash2 size={16} color="#EF4444" />
                            </button>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#94a3b8', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Package size={14} /> Loại bàn:
                                </span>
                                <span style={{ color: getTypeColor(table.type), fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {getTypeIcon(table.type)} {getTypeText(table.type)}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#94a3b8', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Users size={14} /> Sức chứa:
                                </span>
                                <span style={{ color: 'white', fontWeight: '500' }}>{table.capacity} người</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #2d2d3d' }}>
                            <div style={{
                                padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                                background: `rgba(${getStatusColor(table.status) === '#10B981' ? '16,185,129' :
                                    getStatusColor(table.status) === '#EF4444' ? '239,68,68' :
                                        getStatusColor(table.status) === '#FBBF24' ? '251,191,36' : '100,116,139'}, 0.1)`,
                                color: getStatusColor(table.status),
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                {table.status === 'FREE' && <CheckCircle size={12} />}
                                {table.status === 'OCCUPIED' && <X size={12} />}
                                {table.status === 'RESERVED' && <AlertCircle size={12} />}
                                {table.status === 'MAINTENANCE' && <Edit2 size={12} />}
                                {getStatusText(table.status)}
                            </div>
                            <select
                                value={table.status}
                                onChange={(e) => handleUpdateStatus(table.id, e.target.value)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    background: '#0f0f1a',
                                    color: getStatusColor(table.status),
                                    border: `1px solid ${getStatusColor(table.status)}`,
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="FREE">Trống</option>
                                <option value="OCCUPIED">Đang dùng</option>
                                <option value="RESERVED">Đã đặt</option>
                                <option value="MAINTENANCE">Bảo trì</option>
                            </select>
                        </div>
                    </div>
                ))}

                {filteredTables.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                        <Table size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                        <p>Không tìm thấy bàn nào</p>
                    </div>
                )}
            </div>

            {/* MODAL THÊM BÀN */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }} onClick={() => setShowModal(false)}>
                    <div style={{
                        background: '#1a1a2e',
                        border: '1px solid #2d2d3d',
                        borderRadius: '20px',
                        width: '90%',
                        maxWidth: '500px',
                        padding: '28px'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Plus size={20} color="#ff6b6b" /> Thêm bàn mới
                            </h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>
                                    Tên bàn <span style={{ color: '#64748B', fontSize: '12px' }}>(tùy chọn)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="VD: Bàn VIP 1, Bàn Pro, Bàn Góc..."
                                    style={{ width: '100%', padding: '12px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>
                                    <Hash size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                    Số bàn <span style={{ color: '#ff6b6b' }}>*</span>
                                    <span style={{ color: '#64748B', fontSize: '12px', marginLeft: '8px' }}>(không được trùng)</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.number}
                                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                    placeholder="VD: 1, 2, 3..."
                                    required
                                    min="1"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: '#0f0f1a',
                                        border: `1px solid ${formData.number && isTableNumberExist(formData.number) ? '#EF4444' : '#2d2d3d'}`,
                                        borderRadius: '10px',
                                        color: 'white',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                />
                                {formData.number && isTableNumberExist(formData.number) && (
                                    <p style={{ color: '#EF4444', fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <AlertCircle size={12} /> Số bàn {formData.number} đã tồn tại!
                                    </p>
                                )}
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>
                                    <Package size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                    Loại bàn <span style={{ color: '#ff6b6b' }}>*</span>
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    style={{ width: '100%', padding: '12px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }}
                                >
                                    <option value="STANDARD">Tiêu chuẩn</option>
                                    <option value="PREMIUM">Premium</option>
                                    <option value="VIP">VIP</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>
                                    <Users size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                    Sức chứa <span style={{ color: '#ff6b6b' }}>*</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                    placeholder="Số người tối đa"
                                    required
                                    min="1"
                                    style={{ width: '100%', padding: '12px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{ flex: 1, padding: '12px', background: '#2d2d3d', color: '#94a3b8', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || (formData.number && isTableNumberExist(formData.number))}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: '#ff6b6b',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        cursor: (submitting || (formData.number && isTableNumberExist(formData.number))) ? 'not-allowed' : 'pointer',
                                        fontWeight: '600',
                                        opacity: (submitting || (formData.number && isTableNumberExist(formData.number))) ? 0.5 : 1
                                    }}
                                >
                                    {submitting ? 'Đang thêm...' : 'Thêm bàn'}
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
                
                input:focus, select:focus {
                    border-color: #ff6b6b !important;
                    box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.1);
                }
                
                select option {
                    background: #1a1a2e;
                    color: white;
                }
            `}</style>
        </div>
    );
}