// Employees.js - Đã sửa lỗi hiển thị bị dính
import React, { useEffect, useState } from 'react';
import {
    Users, Search, Plus, Edit, Trash2, Power, X,
    User, Phone, Mail, MapPin, Award, Star, Crown,
    Hash, Grid, List, CheckCircle, AlertCircle,
    UserPlus, UserCheck, UserX, Briefcase, Shield
} from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import ToastNotification from '../../components/ToastNotification';

export default function Employees({ employees, setEmployees, refreshTrigger, setRefreshTrigger }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [toast, setToast] = useState(null);
    const [formData, setFormData] = useState({
        phone: '',
        email: '',
        password: '',
        fullName: '',
        address: '',
        imageUrl: '',
        role: 'STAFF'
    });

    const showToast = (message, type = 'info', duration = 3000) => {
        setToast({ message, type, duration });
        setTimeout(() => {
            setToast(null);
        }, duration);
    };

    const fetchEmployees = async () => {
        try {
            const response = await axiosClient.get('/admin/users');
            setEmployees(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error:', error);
            showToast('Không thể tải danh sách nhân viên!', 'error');
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEmployees(); }, []);
    useEffect(() => { if (refreshTrigger) { fetchEmployees(); setRefreshTrigger(false); } }, [refreshTrigger]);

    const isValidPhone = (phone) => {
        const phoneStr = String(phone).trim();
        return /^\d{1,10}$/.test(phoneStr);
    };

    const formatPhoneInput = (value) => {
        const numbers = value.replace(/\D/g, '');
        return numbers.slice(0, 10);
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        if (!formData.phone || !isValidPhone(formData.phone)) {
            showToast('Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 số.', 'warning');
            return;
        }

        try {
            await axiosClient.post('/admin/users', formData);
            showToast('Tạo nhân viên thành công!', 'success');
            setShowModal(false);
            resetForm();
            fetchEmployees();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Tạo nhân viên thất bại!';
            showToast(errorMsg, 'error');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        if (!formData.phone || !isValidPhone(formData.phone)) {
            showToast('Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 số.', 'warning');
            return;
        }

        try {
            await axiosClient.patch(`/admin/users/${editingEmployee.id}`, formData);
            showToast('Cập nhật nhân viên thành công!', 'success');
            setShowModal(false);
            setEditingEmployee(null);
            resetForm();
            fetchEmployees();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Cập nhật thất bại!';
            showToast(errorMsg, 'error');
        }
    };

    const handleDelete = async (id, fullName) => {
        if (!window.confirm(`Bạn có chắc muốn xóa nhân viên "${fullName}"?`)) return;
        try {
            await axiosClient.delete(`/admin/users/${id}`);
            showToast(`Xóa nhân viên "${fullName}" thành công!`, 'success');
            fetchEmployees();
        } catch (error) {
            showToast('Xóa nhân viên thất bại!', 'error');
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

    const getRoleIcon = (role) => {
        switch (role) {
            case 'MANAGER': return <Star size={14} color="#8B5CF6" />;
            case 'ADMIN': return <Crown size={14} color="#FF6B6B" />;
            default: return <User size={14} color="#10B981" />;
        }
    };

    const getRoleText = (role) => {
        switch (role) {
            case 'MANAGER': return 'Quản lý';
            case 'ADMIN': return 'Quản trị viên';
            default: return 'Nhân viên';
        }
    };

    const filteredEmployees = employees.filter(e =>
        e.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
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

            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={28} /> Quản lý Nhân viên
                    </h2>
                    <p style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} /> Tổng số: {employees.length} nhân viên
                    </p>
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
                                <td style={{ ...td, fontWeight: '500' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <User size={14} color="#64748B" />
                                        <span>{e.fullName || e.username || '---'}</span>
                                    </span>
                                </td>
                                <td style={{ ...td, color: '#94a3b8' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Phone size={14} />
                                        <span>{e.phone || '---'}</span>
                                    </span>
                                </td>
                                <td style={{ ...td, color: '#94a3b8' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Mail size={14} />
                                        <span>{e.email || '---'}</span>
                                    </span>
                                </td>
                                <td style={{ ...td, color: '#94a3b8' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MapPin size={14} />
                                        <span>{e.address || '---'}</span>
                                    </span>
                                </td>
                                <td style={td}>
                                    <span style={roleBadge(e.role)}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {getRoleIcon(e.role)}
                                            <span>{getRoleText(e.role)}</span>
                                        </span>
                                    </span>
                                </td>
                                <td style={{ ...td, textAlign: 'center' }}>
                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                        <button
                                            onClick={() => openEditModal(e)}
                                            style={{
                                                padding: '6px',
                                                background: '#3b82f6',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                color: 'white',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(e.id, e.fullName || e.username)}
                                            style={{
                                                padding: '6px',
                                                background: '#dc2626',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                color: 'white',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
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
                            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {editingEmployee ? (
                                    <><Edit size={20} color="#3B82F6" /> Sửa nhân viên</>
                                ) : (
                                    <><Plus size={20} color="#ff6b6b" /> Thêm nhân viên mới</>
                                )}
                            </h3>
                            <button onClick={() => { setShowModal(false); setEditingEmployee(null); }} style={closeBtn}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={editingEmployee ? handleUpdate : handleCreate}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Phone size={14} /> Số điện thoại *
                                    </span>
                                    <span style={{ color: '#64748B', fontSize: '12px', marginLeft: '4px' }}>(tối đa 10 số)</span>
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        const formatted = formatPhoneInput(e.target.value);
                                        setFormData({ ...formData, phone: formatted });
                                    }}
                                    required
                                    placeholder="VD: 0988888888"
                                    maxLength={10}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: '#0f0f1a',
                                        border: `1px solid ${formData.phone && !isValidPhone(formData.phone) ? '#EF4444' : '#2d2d3d'}`,
                                        borderRadius: '8px',
                                        color: 'white',
                                        outline: 'none'
                                    }}
                                />
                                {formData.phone && !isValidPhone(formData.phone) && (
                                    <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <AlertCircle size={12} /> Số điện thoại chỉ được chứa số và tối đa 10 số!
                                    </p>
                                )}
                            </div>
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
                                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Briefcase size={14} /> Vai trò
                                    </span>
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    style={selectStyle}
                                >
                                    <option value="STAFF">Nhân viên</option>
                                    <option value="MANAGER">Quản lý</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                <button
                                    type="submit"
                                    style={{
                                        ...btnSubmit,
                                        opacity: (formData.phone && !isValidPhone(formData.phone)) ? 0.5 : 1,
                                        cursor: (formData.phone && !isValidPhone(formData.phone)) ? 'not-allowed' : 'pointer'
                                    }}
                                    disabled={formData.phone && !isValidPhone(formData.phone)}
                                >
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

// ========== STYLES ==========
const th = {
    padding: '12px 16px',
    textAlign: 'left',
    color: '#94a3b8',
    fontWeight: 600,
    fontSize: 13,
    whiteSpace: 'nowrap'
};

const td = {
    padding: '12px 16px',
    color: 'white',
    fontSize: 13,
    whiteSpace: 'nowrap'
};

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
    background: role === 'MANAGER' ? 'rgba(139,92,246,0.1)' : 'rgba(16,185,129,0.1)',
    color: role === 'MANAGER' ? '#8B5CF6' : '#10B981'
});

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