import React, { useState, useEffect } from 'react';
import { Star, Search, Plus, X, RefreshCw, Edit2, Trash2, Eye } from 'lucide-react';
import axiosClient from '../../services/axiosClient';

export default function CustomerPoints() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchPhone, setSearchPhone] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({ phone: '', customerName: '', totalPoints: 0 });
    const [addPoints, setAddPoints] = useState(0);

    // State cho SỬA
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [editFormData, setEditFormData] = useState({ phone: '', customerName: '', totalPoints: 0 });
    const [showEditModal, setShowEditModal] = useState(false);

    // Load danh sách khách hàng khi vào trang
    useEffect(() => {
        fetchAllCustomers();
    }, []);

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
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    // Tìm kiếm theo SĐT
    const handleSearch = async () => {
        if (!searchPhone.trim()) {
            alert('Vui lòng nhập số điện thoại!');
            return;
        }
        setLoading(true);
        try {
            const res = await axiosClient.get(`/customer-points/${searchPhone.trim()}`);
            if (res.data?.success) {
                setSearchResult(res.data.data);
            } else {
                setSearchResult(null);
                alert('Không tìm thấy khách hàng!');
            }
        } catch (err) {
            setSearchResult(null);
            alert('Không tìm thấy khách hàng!');
        } finally {
            setLoading(false);
        }
    };

    // Thêm mới khách hàng
    const handleCreate = async () => {
        if (!formData.phone.trim()) {
            alert('Vui lòng nhập số điện thoại!');
            return;
        }
        try {
            const res = await axiosClient.post('/customer-points', formData);
            if (res.data?.success) {
                alert('Thêm khách hàng thành công!');
                setShowAddModal(false);
                setSearchPhone(formData.phone);
                setSearchResult(res.data.data);
                setFormData({ phone: '', customerName: '', totalPoints: 0 });
                fetchAllCustomers();
            }
        } catch (err) {
            alert('Lỗi: ' + (err.response?.data?.message || err.message));
        }
    };

    // SỬA: Mở modal edit
    const handleEditClick = (customer) => {
        setEditingCustomer(customer);
        setEditFormData({
            phone: customer.phone,
            customerName: customer.customerName || '',
            totalPoints: customer.totalPoints || 0
        });
        setShowEditModal(true);
    };

    // SỬA: Cập nhật thông tin
    const handleUpdate = async () => {
        if (!editFormData.phone.trim()) {
            alert('Vui lòng nhập số điện thoại!');
            return;
        }
        try {
            const res = await axiosClient.put(`/customer-points/${editingCustomer.id}`, editFormData);
            if (res.data?.success) {
                alert('Cập nhật thành công!');
                setShowEditModal(false);
                setEditingCustomer(null);
                fetchAllCustomers();
                if (searchResult && searchResult.id === editingCustomer.id) {
                    setSearchResult(res.data.data);
                }
            }
        } catch (err) {
            alert('Lỗi cập nhật: ' + (err.response?.data?.message || err.message));
        }
    };

    // XÓA: Xóa khách hàng
    const handleDelete = async (customer) => {
        const confirmMsg = `Xóa khách hàng "${customer.customerName || customer.phone}"?\nTất cả điểm sẽ bị mất!`;
        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await axiosClient.delete(`/customer-points/${customer.id}`);
            if (res.data?.success) {
                alert('Xóa khách hàng thành công!');
                if (searchResult && searchResult.id === customer.id) {
                    setSearchResult(null);
                    setSearchPhone('');
                }
                fetchAllCustomers();
            }
        } catch (err) {
            alert('Lỗi xóa: ' + (err.response?.data?.message || err.message));
        }
    };

    // Cộng điểm
    const handleAddPoints = async (phone) => {
        if (addPoints <= 0) {
            alert('Vui lòng nhập số điểm!');
            return;
        }
        try {
            const res = await axiosClient.post('/customer-points/add-points', { phone, points: addPoints });
            if (res.data?.success) {
                alert(res.data.message);
                setAddPoints(0);
                handleSearch();
                fetchAllCustomers();
            }
        } catch (err) {
            alert('Lỗi: ' + (err.response?.data?.message || err.message));
        }
    };

    // Đổi điểm (trừ điểm)
    const handleRedeemPoints = async (phone, points) => {
        if (!window.confirm(`Đổi ${points} điểm?`)) return;
        try {
            const res = await axiosClient.post('/customer-points/redeem-points', { phone, points });
            if (res.data?.success) {
                alert(res.data.message);
                handleSearch();
                fetchAllCustomers();
            }
        } catch (err) {
            alert('Lỗi: ' + (err.response?.data?.message || err.message));
        }
    };

    // Xem chi tiết KH từ danh sách
    const viewDetail = (customer) => {
        setSearchPhone(customer.phone);
        setSearchResult(customer);
    };

    // Quay lại danh sách
    const backToList = () => {
        setSearchResult(null);
        setSearchPhone('');
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#ff6b6b' }}>⭐ Tích điểm Khách hàng</h2>
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
            <div style={{ marginBottom: 20, display: 'flex', gap: 12 }}>
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
                        style={{ padding: '12px 16px', background: '#2d2d3d', color: 'white', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer' }}>
                        ← DS
                    </button>
                )}
            </div>

            {/* Kết quả tìm kiếm */}
            {searchResult && (
                <div style={{ background: '#1a1a2e', borderRadius: 16, border: '1px solid #2d2d3d', padding: 24, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div>
                            <h3 style={{ color: 'white', fontSize: 18, margin: 0 }}>{searchResult.customerName || 'Khách hàng'}</h3>
                            <p style={{ color: '#94a3b8', margin: '4px 0 0' }}>📱 {searchResult.phone}</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 32, fontWeight: 800, color: '#FBBF24' }}>⭐ {searchResult.totalPoints || 0}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>điểm</div>
                        </div>
                    </div>

                    <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
                        🎱 Tổng giờ chơi: {searchResult.totalHoursPlayed || 0} giờ
                    </div>

                    {/* Nút SỬA và XÓA trong phần tìm kiếm */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'flex-end' }}>
                        <button onClick={() => handleEditClick(searchResult)}
                            style={{ padding: '8px 16px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 8, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Edit2 size={14} /> Sửa
                        </button>
                        <button onClick={() => handleDelete(searchResult)}
                            style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Trash2 size={14} /> Xóa
                        </button>
                    </div>

                    {/* Cộng điểm */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <input type="number" placeholder="Số điểm cộng" value={addPoints} onChange={(e) => setAddPoints(Number(e.target.value))}
                            style={{ flex: 1, padding: '8px 12px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: 8, color: 'white', outline: 'none' }} />
                        <button onClick={() => handleAddPoints(searchResult.phone)}
                            style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>+ Cộng điểm</button>
                    </div>

                    {/* Đổi điểm */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button onClick={() => handleRedeemPoints(searchResult.phone, 10)}
                            style={{ padding: '8px 16px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>🎁 Đổi 10đ</button>
                        <button onClick={() => handleRedeemPoints(searchResult.phone, 50)}
                            style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>🎁 Đổi 50đ</button>
                        <button onClick={() => { const pts = prompt('Nhập số điểm muốn đổi:'); if (pts) handleRedeemPoints(searchResult.phone, Number(pts)); }}
                            style={{ padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>🎁 # khác</button>
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
                                <th style={thStyle}>Giờ chơi</th>
                                <th style={thStyle}>Điểm</th>
                                <th style={thStyle}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.length > 0 ? customers.map((c, i) => (
                                <tr key={c.id} style={{ borderBottom: '1px solid #2d2d3d' }}>
                                    <td style={tdStyle}>{i + 1}</td>
                                    <td style={{ ...tdStyle, color: 'white', fontWeight: 500 }}>{c.customerName || '-'}</td>
                                    <td style={tdStyle}>{c.phone}</td>
                                    <td style={tdStyle}>{c.totalHoursPlayed || 0}h</td>
                                    <td style={tdStyle}>
                                        <span style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(251,191,36,0.1)', color: '#FBBF24', fontWeight: 600 }}>
                                            ⭐ {c.totalPoints || 0}
                                        </span>
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

            {/* Modal THÊM mới */}
            {showAddModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAddModal(false)}>
                    <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 24, width: 400, maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h3 style={{ color: '#ff6b6b', fontSize: 20, margin: 0 }}>➕ Thêm khách hàng mới</h3>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 8, color: '#94a3b8', fontSize: 13 }}>📱 Số điện thoại *</label>
                            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="VD: 0987654321"
                                style={{ width: '100%', padding: '10px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: 8, color: 'white', outline: 'none' }} />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 8, color: '#94a3b8', fontSize: 13 }}>👤 Tên khách hàng</label>
                            <input type="text" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                placeholder="Nhập tên khách hàng"
                                style={{ width: '100%', padding: '10px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: 8, color: 'white', outline: 'none' }} />
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', marginBottom: 8, color: '#94a3b8', fontSize: 13 }}>⭐ Điểm ban đầu</label>
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
                            <h3 style={{ color: '#f59e0b', fontSize: 20, margin: 0 }}>✏️ Sửa thông tin</h3>
                            <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 8, color: '#94a3b8', fontSize: 13 }}>📱 Số điện thoại *</label>
                            <input type="tel" value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                placeholder="VD: 0987654321"
                                style={{ width: '100%', padding: '10px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: 8, color: 'white', outline: 'none' }} />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 8, color: '#94a3b8', fontSize: 13 }}>👤 Tên khách hàng</label>
                            <input type="text" value={editFormData.customerName} onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                                placeholder="Nhập tên khách hàng"
                                style={{ width: '100%', padding: '10px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: 8, color: 'white', outline: 'none' }} />
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', marginBottom: 8, color: '#94a3b8', fontSize: 13 }}>⭐ Điểm hiện tại</label>
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