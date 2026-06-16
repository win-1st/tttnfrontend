import React, { useEffect, useState } from 'react';
import { Users, Search, Plus, Edit, Trash2, Power, X } from 'lucide-react';
import axiosClient from '../../services/axiosClient';

export default function Employees({ employees, setEmployees, refreshTrigger, setRefreshTrigger }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [formData, setFormData] = useState({
        phone: '',           // Đã đổi từ username -> phone
        email: '',
        password: '',
        fullName: '',
        address: '',
        imageUrl: '',
        role: 'STAFF'
    });

    const fetchEmployees = async () => {
        try {
            const response = await axiosClient.get('/admin/users');
            setEmployees(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error:', error);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEmployees(); }, []);
    useEffect(() => { if (refreshTrigger) { fetchEmployees(); setRefreshTrigger(false); } }, [refreshTrigger]);

    // Validate phone number
    const isValidPhone = (phone) => {
        return /(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(phone);
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        // Validate phone
        if (!isValidPhone(formData.phone)) {
            alert('Số điện thoại không hợp lệ!');
            return;
        }

        try {
            await axiosClient.post('/admin/users', formData);
            alert('Tạo nhân viên thành công!');
            setShowModal(false);
            resetForm();
            fetchEmployees();
        } catch (error) {
            alert('Lỗi: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        // Validate phone
        if (!isValidPhone(formData.phone)) {
            alert('Số điện thoại không hợp lệ!');
            return;
        }

        try {
            await axiosClient.patch(`/admin/users/${editingEmployee.id}`, formData);
            alert('Cập nhật thành công!');
            setShowModal(false);
            setEditingEmployee(null);
            resetForm();
            fetchEmployees();
        } catch (error) {
            alert('Lỗi: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa nhân viên này?')) return;
        try {
            await axiosClient.delete(`/admin/users/${id}`);
            alert('Xóa thành công!');
            fetchEmployees();
        } catch (error) {
            alert('Xóa thất bại!');
        }
    };

    const resetForm = () => {
        setFormData({
            phone: '',
            email: '',
            password: '',
            fullName: '',
            address: '',
            imageUrl: '',
            role: 'STAFF'
        });
    };

    const openEditModal = (employee) => {
        setEditingEmployee(employee);
        setFormData({
            phone: employee.phone || '',
            email: employee.email || '',
            password: '',
            fullName: employee.fullName || '',
            address: employee.address || '',
            imageUrl: employee.imageUrl || '',
            role: employee.role || 'STAFF'
        });
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingEmployee(null);
        resetForm();
        setShowModal(true);
    };

    const filteredEmployees = employees.filter(e =>
        e.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Đang tải...</div>;

    return (
        <div>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: '#ff6b6b' }}>Quản lý Nhân viên</h2>
                    <p style={{ color: '#94a3b8' }}>Tổng số: {employees.length} nhân viên</p>
                </div>
                <button onClick={openCreateModal} style={btnPrimary}>
                    <Plus size={20} /> Thêm nhân viên
                </button>
            </div>

            <div style={{ marginBottom: '20px', position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên, SĐT hoặc email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={searchInput}
                />
            </div>

            <div style={tableWrapper}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #2d2d3d' }}>
                            <th style={th}>ID</th>
                            <th style={th}>Họ tên</th>
                            <th style={th}>Số điện thoại</th>
                            <th style={th}>Email</th>
                            <th style={th}>Địa chỉ</th>
                            <th style={th}>Vai trò</th>
                            <th style={{ ...th, textAlign: 'center' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.map(e => (
                            <tr key={e.id} style={{ borderBottom: '1px solid #2d2d3d' }}>
                                <td style={td}>{e.id}</td>
                                <td style={{ ...td, fontWeight: '500' }}>{e.fullName || e.username || '---'}</td>
                                <td style={{ ...td, color: '#94a3b8' }}>{e.phone || '---'}</td>
                                <td style={{ ...td, color: '#94a3b8' }}>{e.email || '---'}</td>
                                <td style={{ ...td, color: '#94a3b8' }}>{e.address || '---'}</td>
                                <td style={td}>
                                    <span style={roleBadge(e.role)}>
                                        {e.role === 'ADMIN' ? '👑 Quản trị viên' : e.role === 'MANAGER' ? '⭐ Quản lý' : '👤 Nhân viên'}
                                    </span>
                                </td>
                                <td style={{ ...td, textAlign: 'center' }}>
                                    <Btn color="#3b82f6" onClick={() => openEditModal(e)}><Edit size={16} /></Btn>
                                    <Btn color="#dc2626" onClick={() => handleDelete(e.id)}><Trash2 size={16} /></Btn>
                                </td>
                            </tr>
                        ))}
                        {filteredEmployees.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                                    <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                                    <p>Chưa có nhân viên nào</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Thêm/Sửa */}
            {showModal && (
                <div style={modalOverlay} onClick={() => { setShowModal(false); setEditingEmployee(null); }}>
                    <div style={modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b6b' }}>
                                {editingEmployee ? '✏️ Sửa nhân viên' : '➕ Thêm nhân viên mới'}
                            </h3>
                            <button onClick={() => { setShowModal(false); setEditingEmployee(null); }} style={closeBtn}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={editingEmployee ? handleUpdate : handleCreate}>
                            <Field
                                label="Số điện thoại *"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                                placeholder="VD: 0988888888"
                            />
                            <Field
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="staff@example.com"
                            />
                            {!editingEmployee && (
                                <Field
                                    label="Mật khẩu *"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                                />
                            )}
                            <Field
                                label="Họ tên"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                placeholder="Nhập họ và tên"
                            />
                            <Field
                                label="Địa chỉ"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Nhập địa chỉ"
                            />
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Vai trò</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    style={selectStyle}
                                >
                                    <option value="STAFF">👤 Nhân viên</option>
                                    <option value="MANAGER">⭐ Quản lý</option>
                                    <option value="ADMIN">👑 Quản trị viên</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                <button type="submit" style={btnSubmit}>
                                    {editingEmployee ? 'Cập nhật' : 'Thêm mới'}
                                </button>
                                <button type="button" onClick={() => { setShowModal(false); setEditingEmployee(null); }} style={btnCancel}>
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Styles
const th = { padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 13 };
const td = { padding: '12px 16px', color: 'white', fontSize: 13 };

const btnPrimary = {
    padding: '10px 20px',
    background: '#ff6b6b',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s'
};

const searchInput = {
    width: '100%',
    padding: '12px 16px 12px 48px',
    background: '#1a1a2e',
    border: '1px solid #2d2d3d',
    borderRadius: '12px',
    color: 'white',
    outline: 'none'
};

const tableWrapper = {
    background: '#1a1a2e',
    border: '1px solid #2d2d3d',
    borderRadius: '16px',
    overflowX: 'auto'
};

const modalOverlay = {
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

const modalContent = {
    background: '#1a1a2e',
    borderRadius: '16px',
    padding: '24px',
    width: '500px',
    maxWidth: '90%',
    maxHeight: '90vh',
    overflowY: 'auto'
};

const closeBtn = {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px'
};

const btnSubmit = {
    flex: 1,
    padding: '12px',
    background: '#ff6b6b',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
};

const btnCancel = {
    flex: 1,
    padding: '12px',
    background: '#2d2d3d',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
};

const selectStyle = {
    width: '100%',
    padding: '10px',
    background: '#0f0f1a',
    border: '1px solid #2d2d3d',
    borderRadius: '8px',
    color: 'white',
    outline: 'none',
    cursor: 'pointer'
};

const roleBadge = (role) => ({
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
    background: role === 'ADMIN' ? 'rgba(255,107,107,0.1)' : role === 'MANAGER' ? 'rgba(139,92,246,0.1)' : 'rgba(16,185,129,0.1)',
    color: role === 'ADMIN' ? '#ff6b6b' : role === 'MANAGER' ? '#8B5CF6' : '#10B981'
});

const Btn = ({ color, onClick, children }) => (
    <button
        onClick={onClick}
        style={{
            padding: '6px',
            background: color,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            color: 'white',
            marginRight: '4px',
            transition: 'all 0.2s'
        }}
    >
        {children}
    </button>
);

const Field = ({ label, type = 'text', value, onChange, required, placeholder }) => (
    <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>{label}</label>
        <input
            type={type}
            required={required}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            style={{
                width: '100%',
                padding: '10px',
                background: '#0f0f1a',
                border: '1px solid #2d2d3d',
                borderRadius: '8px',
                color: 'white',
                outline: 'none'
            }}
        />
    </div>
);