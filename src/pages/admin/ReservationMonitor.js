import React, { useEffect, useState } from 'react';
import {
    Calendar, Clock, Users, AlertTriangle, CheckCircle, XCircle,
    Phone, Mail, MapPin, Search, RefreshCw, User, Tag,
    FileText, Home, UserPlus, MessageSquare, Eye,
    ChevronLeft, ChevronRight, List, Grid, Filter
} from 'lucide-react';
import axios from 'axios';
import axiosClient from '../../services/axiosClient';
import ToastNotification from '../../components/ToastNotification';

export default function ReservationMonitor() {
    const [reservations, setReservations] = useState([]);
    const [tables, setTables] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [toast, setToast] = useState(null);

    const API_BASE_URL = 'http://localhost:8080';

    const showToast = (message, type = 'info', duration = 3000) => {
        setToast({ message, type, duration });
        setTimeout(() => {
            setToast(null);
        }, duration);
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const reservationsRes = await axiosClient.get('/reservations/all');
            const reservationsData = reservationsRes.data?.data || [];

            const tablesRes = await axiosClient.get('/tables');
            const tablesData = tablesRes.data?.data || tablesRes.data || [];

            setReservations(reservationsData);
            setTables(tablesData);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
            showToast('Không thể tải dữ liệu đặt bàn!', 'error');
        } finally {
            setLoading(false);
        }
    };

    const updateReservationStatus = async (id, status) => {
        try {
            let endpoint = '';
            let statusText = '';
            switch (status) {
                case 'CONFIRMED':
                    endpoint = `/reservations/${id}/confirm`;
                    statusText = 'xác nhận';
                    break;
                case 'CANCELLED':
                    endpoint = `/reservations/${id}/cancel`;
                    statusText = 'hủy';
                    break;
                case 'CHECKED_IN':
                    endpoint = `/reservations/${id}/checkin`;
                    statusText = 'check-in';
                    break;
                default:
                    return;
            }

            await axiosClient.patch(endpoint);
            showToast(`Đã ${statusText} đặt bàn thành công!`, 'success');
            await fetchData();
            setSelectedReservation(null);
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái:', error);
            showToast('Không thể cập nhật trạng thái. Vui lòng thử lại!', 'error');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'PENDING': { bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.3)', text: '#FBBF24' },
            'CONFIRMED': { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: '#10B981' },
            'CHECKED_IN': { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', text: '#3B82F6' },
            'CANCELLED': { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: '#EF4444' },
            'COMPLETED': { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.3)', text: '#8B5CF6' },
            'NO_SHOW': { bg: 'rgba(220, 38, 38, 0.1)', border: 'rgba(220, 38, 38, 0.3)', text: '#DC2626' }
        };
        return colors[status] || colors['PENDING'];
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING': return <Clock size={14} />;
            case 'CONFIRMED': return <CheckCircle size={14} />;
            case 'CHECKED_IN': return <User size={14} />;
            case 'CANCELLED': return <XCircle size={14} />;
            case 'COMPLETED': return <CheckCircle size={14} />;
            default: return <AlertTriangle size={14} />;
        }
    };

    const getStatusText = (status) => {
        const texts = {
            'PENDING': 'Chờ xác nhận',
            'CONFIRMED': 'Đã xác nhận',
            'CHECKED_IN': 'Đã đến',
            'CANCELLED': 'Đã hủy',
            'COMPLETED': 'Hoàn thành',
            'NO_SHOW': 'No-show'
        };
        return texts[status] || status;
    };

    const getTableInfo = (tableId) => {
        return tables.find(t => t.id === tableId);
    };

    const getStats = () => {
        return {
            total: reservations.length,
            pending: reservations.filter(r => r.status === 'PENDING').length,
            confirmed: reservations.filter(r => r.status === 'CONFIRMED').length,
            checkedIn: reservations.filter(r => r.status === 'CHECKED_IN').length,
            cancelled: reservations.filter(r => r.status === 'CANCELLED').length
        };
    };

    const filteredReservations = reservations.filter(r => {
        const matchStatus = selectedStatus === 'all' || r.status === selectedStatus;
        const matchSearch = r.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.customerPhone?.includes(searchTerm);
        return matchStatus && matchSearch;
    });

    const formatDateTime = (date, time) => {
        if (!date) return 'N/A';
        const dateStr = new Date(date).toLocaleDateString('vi-VN');
        return `${dateStr} ${time || ''}`;
    };

    const stats = getStats();

    return (
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
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
                padding: '32px 24px',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                borderRadius: '20px',
                marginBottom: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{
                            fontSize: '32px',
                            fontWeight: '800',
                            marginBottom: '8px',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <FileText size={32} /> Giám sát Đặt bàn
                        </h1>
                        <p style={{ color: '#94A3B8', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={16} />
                            Theo dõi và quản lý đặt bàn toàn hệ thống
                        </p>
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        style={{
                            padding: '12px 24px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: loading ? 0.6 : 1,
                            transition: 'all 0.3s'
                        }}
                    >
                        <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #3b82f6'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <FileText size={24} color="#3B82F6" />
                        </div>
                        <div>
                            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>
                                {stats.total}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>Tổng đặt bàn</div>
                        </div>
                    </div>
                </div>

                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #f59e0b'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: 'rgba(245, 158, 11, 0.1)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Clock size={24} color="#F59E0B" />
                        </div>
                        <div>
                            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>
                                {stats.pending}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>Chờ xác nhận</div>
                        </div>
                    </div>
                </div>

                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #10b981'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <CheckCircle size={24} color="#10B981" />
                        </div>
                        <div>
                            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>
                                {stats.confirmed}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>Đã xác nhận</div>
                        </div>
                    </div>
                </div>

                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #ef4444'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <XCircle size={24} color="#EF4444" />
                        </div>
                        <div>
                            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>
                                {stats.cancelled}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>Đã hủy</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={20} style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#64748B'
                        }} />
                        <input
                            type="text"
                            placeholder="Tìm theo tên hoặc SĐT..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 48px',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                color: '#1e293b',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        style={{
                            padding: '12px 16px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            color: '#1e293b',
                            fontSize: '14px',
                            cursor: 'pointer',
                            outline: 'none'
                        }}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="PENDING">Chờ xác nhận</option>
                        <option value="CONFIRMED">Đã xác nhận</option>
                        <option value="CHECKED_IN">Đã đến</option>
                        <option value="CANCELLED">Đã hủy</option>
                        <option value="COMPLETED">Hoàn thành</option>
                    </select>
                </div>
            </div>

            {/* Reservations List */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: '20px'
            }}>
                {filteredReservations.length === 0 ? (
                    <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '60px 20px',
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <Calendar size={64} color="#94A3B8" style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                        <p style={{ color: '#64748b', fontSize: '16px' }}>Không có đặt bàn nào</p>
                    </div>
                ) : (
                    filteredReservations.map(reservation => {
                        const statusColor = getStatusColor(reservation.status);
                        const tableInfo = getTableInfo(reservation.tableId || reservation.table?.id);

                        return (
                            <div
                                key={reservation.id}
                                style={{
                                    background: 'white',
                                    border: `1px solid ${statusColor.border}`,
                                    borderRadius: '16px',
                                    padding: '20px',
                                    transition: 'all 0.3s',
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                }}
                                onClick={() => setSelectedReservation(reservation)}
                            >
                                {/* Status Badge */}
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    background: statusColor.bg,
                                    border: `1px solid ${statusColor.border}`,
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: statusColor.text,
                                    marginBottom: '16px'
                                }}>
                                    {getStatusIcon(reservation.status)}
                                    {getStatusText(reservation.status)}
                                </div>

                                {/* Customer Info */}
                                <h3 style={{
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: '#1e293b',
                                    marginBottom: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <User size={18} color="#64748b" />
                                    {reservation.customerName}
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
                                        <Phone size={16} />
                                        {reservation.customerPhone}
                                    </div>
                                    {reservation.customerEmail && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
                                            <Mail size={16} />
                                            {reservation.customerEmail}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
                                        <Users size={16} />
                                        {reservation.numberOfGuests || 2} người
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
                                        <Clock size={16} />
                                        {formatDateTime(reservation.reservationDate, reservation.reservationTime)}
                                    </div>
                                </div>

                                {/* Table Info */}
                                {tableInfo && (
                                    <div style={{
                                        background: 'rgba(59, 130, 246, 0.05)',
                                        border: '1px solid rgba(59, 130, 246, 0.2)',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        fontSize: '13px',
                                        color: '#3B82F6',
                                        marginBottom: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <Tag size={12} />
                                        Bàn số {tableInfo.number} - Sức chứa: {tableInfo.capacity || 4} người
                                    </div>
                                )}

                                {/* Notes */}
                                {reservation.notes && (
                                    <div style={{
                                        padding: '12px',
                                        background: '#f8fafc',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        color: '#64748b',
                                        fontStyle: 'italic',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '6px'
                                    }}>
                                        <MessageSquare size={14} color="#64748b" />
                                        {reservation.notes}
                                    </div>
                                )}

                                {/* Quick Actions */}
                                {reservation.status === 'PENDING' && (
                                    <div style={{
                                        display: 'flex',
                                        gap: '8px',
                                        marginTop: '16px',
                                        paddingTop: '16px',
                                        borderTop: '1px solid #e2e8f0'
                                    }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateReservationStatus(reservation.id, 'CONFIRMED');
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                background: '#10b981',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <CheckCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                            Xác nhận
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateReservationStatus(reservation.id, 'CANCELLED');
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                background: '#ef4444',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <XCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                            Hủy
                                        </button>
                                    </div>
                                )}

                                {reservation.status === 'CONFIRMED' && (
                                    <div style={{
                                        marginTop: '16px',
                                        paddingTop: '16px',
                                        borderTop: '1px solid #e2e8f0'
                                    }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateReservationStatus(reservation.id, 'CHECKED_IN');
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                background: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <UserPlus size={14} /> Check-in
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Detail Modal */}
            {selectedReservation && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '24px'
                    }}
                    onClick={() => setSelectedReservation(null)}
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: '20px',
                            padding: '32px',
                            maxWidth: '500px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflow: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '24px'
                        }}>
                            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Eye size={24} color="#3B82F6" /> Chi tiết đặt bàn
                            </h2>
                            <button
                                onClick={() => setSelectedReservation(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '28px',
                                    cursor: 'pointer',
                                    color: '#94a3b8'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'block' }}>
                                    Trạng thái
                                </label>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 16px',
                                    background: getStatusColor(selectedReservation.status).bg,
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    color: getStatusColor(selectedReservation.status).text
                                }}>
                                    {getStatusIcon(selectedReservation.status)}
                                    {getStatusText(selectedReservation.status)}
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'block' }}>
                                    Tên khách hàng
                                </label>
                                <div style={{ fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <User size={16} color="#64748b" /> {selectedReservation.customerName}
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'block' }}>
                                    Số điện thoại
                                </label>
                                <div style={{ color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Phone size={16} color="#64748b" /> {selectedReservation.customerPhone}
                                </div>
                            </div>

                            {selectedReservation.customerEmail && (
                                <div>
                                    <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'block' }}>
                                        Email
                                    </label>
                                    <div style={{ color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Mail size={16} color="#64748b" /> {selectedReservation.customerEmail}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'block' }}>
                                    Ngày & giờ
                                </label>
                                <div style={{ color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Clock size={16} color="#64748b" />
                                    {formatDateTime(selectedReservation.reservationDate, selectedReservation.reservationTime)}
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'block' }}>
                                    Số lượng khách
                                </label>
                                <div style={{ color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Users size={16} color="#64748b" /> {selectedReservation.numberOfGuests || 2} người
                                </div>
                            </div>

                            {selectedReservation.notes && (
                                <div>
                                    <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'block' }}>
                                        Ghi chú
                                    </label>
                                    <div style={{ color: '#64748b', fontStyle: 'italic', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                        <MessageSquare size={16} color="#64748b" /> {selectedReservation.notes}
                                    </div>
                                </div>
                            )}

                            {selectedReservation.status === 'PENDING' && (
                                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                    <button
                                        onClick={() => updateReservationStatus(selectedReservation.id, 'CONFIRMED')}
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            background: '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '10px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <CheckCircle size={18} /> Xác nhận đặt bàn
                                    </button>
                                    <button
                                        onClick={() => updateReservationStatus(selectedReservation.id, 'CANCELLED')}
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            background: '#ef4444',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '10px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <XCircle size={18} /> Hủy đặt bàn
                                    </button>
                                </div>
                            )}

                            {selectedReservation.status === 'CONFIRMED' && (
                                <button
                                    onClick={() => updateReservationStatus(selectedReservation.id, 'CHECKED_IN')}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        marginTop: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <UserPlus size={18} /> Đánh dấu đã đến (Check-in)
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}