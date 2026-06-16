// pages/client/BookingHistoryPage.js
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin, Search, Eye, XCircle, CheckCircle, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import ToastNotification from '../../components/ToastNotification';
import './BookingHistoryPage.css';

const BookingHistoryPage = () => {
    const [reservations, setReservations] = useState([]);
    const [filteredReservations, setFilteredReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [cancellingId, setCancellingId] = useState(null);
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = "info", duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    };

    useEffect(() => {
        fetchMyReservations();
    }, []);

    useEffect(() => {
        filterReservations();
    }, [reservations, statusFilter, searchTerm]);

    const fetchMyReservations = async () => {
        setLoading(true);
        try {
            // Lấy thông tin user từ localStorage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            console.log('User info:', user);

            // Kiểm tra token có tồn tại không
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('No token found, user not logged in');
                setReservations([]);
                showToast('Vui lòng đăng nhập để xem lịch sử đặt bàn', 'error');
                setLoading(false);
                return;
            }

            // Gọi API lấy lịch sử đặt bàn theo tài khoản
            const response = await axiosClient.get('/reservations/my-reservations');
            console.log('My reservations response:', response.data);

            if (response.data?.success) {
                const data = response.data.data || [];
                // Sắp xếp theo ngày mới nhất
                const sorted = data.sort((a, b) =>
                    new Date(b.createdAt || b.reservationDate) - new Date(a.createdAt || a.reservationDate)
                );
                setReservations(sorted);
                console.log('Loaded reservations:', sorted.length);
            } else {
                setReservations([]);
                console.log('No reservations found');
            }
        } catch (error) {
            console.error('Error fetching reservations:', error);
            if (error.response?.status === 401) {
                showToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'error');
            } else {
                showToast(error.response?.data?.message || 'Không thể tải lịch sử đặt bàn', 'error');
            }
            setReservations([]);
        } finally {
            setLoading(false);
        }
    };

    const filterReservations = () => {
        let filtered = [...reservations];

        // Lọc theo trạng thái
        if (statusFilter !== 'all') {
            filtered = filtered.filter(r => r.status === statusFilter);
        }

        // Lọc theo từ khóa tìm kiếm
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(r =>
                r.id?.toString().includes(term) ||
                r.customerName?.toLowerCase().includes(term) ||
                r.customerPhone?.includes(term) ||
                r.tableNumber?.toString().includes(term)
            );
        }

        setFilteredReservations(filtered);
    };

    const cancelReservation = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy đặt bàn này không?')) return;

        setCancellingId(id);
        try {
            await axiosClient.patch(`/reservations/${id}/cancel?reason=Khách hàng hủy`);
            showToast('Hủy đặt bàn thành công!', 'success');
            await fetchMyReservations();
            setShowDetailModal(false);
        } catch (error) {
            console.error('Error cancelling reservation:', error);
            showToast(error.response?.data?.message || 'Không thể hủy đặt bàn', 'error');
        } finally {
            setCancellingId(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '---';
        try {
            return new Date(dateString).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return '---';
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '---';
        try {
            return new Date(dateString).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '---';
        }
    };

    const canCancel = (status, date, time) => {
        if (status !== 'PENDING' && status !== 'CONFIRMED') return false;

        // Kiểm tra nếu đã quá giờ đặt
        try {
            const reservationDateTime = new Date(`${date}T${time || '00:00'}`);
            const now = new Date();
            if (reservationDateTime < now) return false;
        } catch {
            return false;
        }

        return true;
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'PENDING': { text: 'Chờ xác nhận', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: '⏳' },
            'CONFIRMED': { text: 'Đã xác nhận', color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: '✅' },
            'CHECKED_IN': { text: 'Đã đến', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', icon: '📍' },
            'CANCELLED': { text: 'Đã hủy', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', icon: '❌' },
            'COMPLETED': { text: 'Hoàn thành', color: '#6B7280', bg: 'rgba(107,114,128,0.1)', icon: '✔️' },
            'NO_SHOW': { text: 'No-show', color: '#DC2626', bg: 'rgba(220,38,38,0.1)', icon: '🚫' }
        };
        const config = statusConfig[status] || { text: status, color: '#6B7280', bg: 'rgba(107,114,128,0.1)', icon: '📋' };

        return (
            <span className="status-badge" style={{ background: config.bg, color: config.color }}>
                <span className="status-icon">{config.icon}</span>
                {config.text}
            </span>
        );
    };

    const getStats = () => {
        return {
            total: reservations.length,
            pending: reservations.filter(r => r.status === 'PENDING').length,
            confirmed: reservations.filter(r => r.status === 'CONFIRMED').length,
            completed: reservations.filter(r => r.status === 'COMPLETED' || r.status === 'CHECKED_IN').length,
            cancelled: reservations.filter(r => r.status === 'CANCELLED' || r.status === 'NO_SHOW').length
        };
    };

    const stats = getStats();

    if (loading) {
        return (
            <div className="booking-history-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Đang tải lịch sử đặt bàn...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="booking-history-page">
            <div className="history-container">
                <div className="history-header">
                    <h1>📋 Lịch sử đặt bàn</h1>
                    <p>Xem lại các đơn đặt bàn của bạn tại nhà hàng</p>
                </div>

                {/* Stats Cards */}
                {reservations.length > 0 && (
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon total">📊</div>
                            <div className="stat-info">
                                <span className="stat-value">{stats.total}</span>
                                <span className="stat-label">Tổng đặt bàn</span>
                            </div>
                        </div>
                        <div className="stat-card pending">
                            <div className="stat-icon">⏳</div>
                            <div className="stat-info">
                                <span className="stat-value">{stats.pending}</span>
                                <span className="stat-label">Đang chờ</span>
                            </div>
                        </div>
                        <div className="stat-card confirmed">
                            <div className="stat-icon">✅</div>
                            <div className="stat-info">
                                <span className="stat-value">{stats.confirmed}</span>
                                <span className="stat-label">Đã xác nhận</span>
                            </div>
                        </div>
                        <div className="stat-card completed">
                            <div className="stat-icon">✔️</div>
                            <div className="stat-info">
                                <span className="stat-value">{stats.completed}</span>
                                <span className="stat-label">Đã hoàn thành</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                {reservations.length > 0 && (
                    <div className="filters-section">
                        <div className="search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Tìm theo mã đơn, tên, SĐT hoặc số bàn..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="filter-buttons">
                            <button className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}>
                                Tất cả
                            </button>
                            <button className={statusFilter === 'PENDING' ? 'active' : ''} onClick={() => setStatusFilter('PENDING')}>
                                Chờ xác nhận
                            </button>
                            <button className={statusFilter === 'CONFIRMED' ? 'active' : ''} onClick={() => setStatusFilter('CONFIRMED')}>
                                Đã xác nhận
                            </button>
                            <button className={statusFilter === 'COMPLETED' ? 'active' : ''} onClick={() => setStatusFilter('COMPLETED')}>
                                Đã hoàn thành
                            </button>
                            <button className={statusFilter === 'CANCELLED' ? 'active' : ''} onClick={() => setStatusFilter('CANCELLED')}>
                                Đã hủy
                            </button>
                        </div>
                    </div>
                )}

                {reservations.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <h3>Chưa có đặt bàn nào</h3>
                        <p>Bạn chưa có đơn đặt bàn nào. Hãy đặt bàn ngay để trải nghiệm!</p>
                        <a href="/booking" className="booking-btn">Đặt bàn ngay</a>
                    </div>
                ) : filteredReservations.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🔍</div>
                        <h3>Không tìm thấy</h3>
                        <p>Không có đặt bàn nào phù hợp với điều kiện tìm kiếm</p>
                    </div>
                ) : (
                    <div className="reservations-list">
                        {filteredReservations.map(res => (
                            <div key={res.id} className="reservation-card">
                                <div className="reservation-header">
                                    <div className="reservation-id">
                                        <span className="id-label">Mã đơn</span>
                                        <strong>#{res.id}</strong>
                                    </div>
                                    {getStatusBadge(res.status)}
                                </div>

                                <div className="reservation-body">
                                    <div className="info-row">
                                        <div className="info-item">
                                            <Calendar size={16} />
                                            <span>{formatDate(res.reservationDate)}</span>
                                        </div>
                                        <div className="info-item">
                                            <Clock size={16} />
                                            <span>{res.reservationTime || '--:--'}</span>
                                        </div>
                                    </div>
                                    <div className="info-row">
                                        <div className="info-item">
                                            <MapPin size={16} />
                                            <span>Bàn {res.tableNumber || res.table?.number || '--'}</span>
                                        </div>
                                        <div className="info-item">
                                            <Users size={16} />
                                            <span>{res.numberOfGuests || 2} khách</span>
                                        </div>
                                    </div>
                                    <div className="info-row">
                                        <div className="info-item">
                                            <span className="customer-name">{res.customerName || 'Khách lẻ'}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="customer-phone">{res.customerPhone || '---'}</span>
                                        </div>
                                    </div>
                                    {res.notes && (
                                        <div className="info-row note">
                                            <span>📝 Ghi chú: {res.notes}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="reservation-footer">
                                    <span className="created-at">
                                        Đặt lúc: {formatDateTime(res.createdAt)}
                                    </span>
                                    <div className="footer-actions">
                                        <button
                                            onClick={() => { setSelectedReservation(res); setShowDetailModal(true); }}
                                            className="detail-btn"
                                        >
                                            <Eye size={16} /> Chi tiết
                                        </button>
                                        {canCancel(res.status, res.reservationDate, res.reservationTime) && (
                                            <button
                                                onClick={() => cancelReservation(res.id)}
                                                disabled={cancellingId === res.id}
                                                className="cancel-btn"
                                            >
                                                <XCircle size={16} />
                                                {cancellingId === res.id ? 'Đang xử lý...' : 'Hủy'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedReservation && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Chi tiết đặt bàn #{selectedReservation.id}</h3>
                            <button onClick={() => setShowDetailModal(false)} className="close-btn">
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-row">
                                <span className="label">Trạng thái:</span>
                                {getStatusBadge(selectedReservation.status)}
                            </div>
                            <div className="detail-row">
                                <span className="label">Khách hàng:</span>
                                <span>{selectedReservation.customerName || 'Khách lẻ'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Số điện thoại:</span>
                                <span>{selectedReservation.customerPhone || '---'}</span>
                            </div>
                            {selectedReservation.customerEmail && (
                                <div className="detail-row">
                                    <span className="label">Email:</span>
                                    <span>{selectedReservation.customerEmail}</span>
                                </div>
                            )}
                            <div className="detail-row">
                                <span className="label">Bàn:</span>
                                <span>Bàn {selectedReservation.tableNumber || selectedReservation.table?.number || '--'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Số khách:</span>
                                <span>{selectedReservation.numberOfGuests || 2} người</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Ngày đặt:</span>
                                <span>{formatDate(selectedReservation.reservationDate)} - {selectedReservation.reservationTime || '--:--'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Ngày đặt đơn:</span>
                                <span>{formatDateTime(selectedReservation.createdAt)}</span>
                            </div>
                            {selectedReservation.notes && (
                                <div className="detail-row">
                                    <span className="label">Ghi chú:</span>
                                    <span className="note-text">{selectedReservation.notes}</span>
                                </div>
                            )}
                            {canCancel(selectedReservation.status, selectedReservation.reservationDate, selectedReservation.reservationTime) && (
                                <button
                                    onClick={() => cancelReservation(selectedReservation.id)}
                                    disabled={cancellingId === selectedReservation.id}
                                    className="modal-cancel-btn"
                                >
                                    <XCircle size={16} />
                                    {cancellingId === selectedReservation.id ? 'Đang xử lý...' : 'Hủy đặt bàn'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Refresh Button */}
            <button className="refresh-btn" onClick={fetchMyReservations} disabled={loading}>
                <RefreshCw size={18} className={loading ? 'spin' : ''} />
            </button>

            {/* Toast */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <ToastNotification
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    />
                ))}
            </div>
        </div>
    );
};

export default BookingHistoryPage;