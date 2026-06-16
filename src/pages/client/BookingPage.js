// pages/customer/BookingPage.js
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Phone, MapPin, CheckCircle, AlertCircle, Send, User } from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import './BookingPage.css';

const BookingPage = () => {
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        reservationDate: '',
        reservationTime: '',
        numberOfGuests: 2,
        tableType: 'NORMAL',
        note: '',
        tableId: null
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const [allTables, setAllTables] = useState([]);
    const [loadingTables, setLoadingTables] = useState(false);
    const [selectedTableNumber, setSelectedTableNumber] = useState('');
    const [user, setUser] = useState(null);

    const today = new Date().toISOString().split('T')[0];

    const timeSlots = [
        '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
        '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
    ];

    // Lấy thông tin user từ localStorage và fetch user info
    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.id) {
            setUser(userData);
            // Tự động điền tên và số điện thoại nếu có
            setFormData(prev => ({
                ...prev,
                customerName: userData.fullName || userData.username || '',
                customerPhone: userData.phone || ''
            }));
        }
        fetchAllTables();
    }, []);

    // Fetch thông tin user từ backend nếu cần
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const response = await axiosClient.get('/auth/me');
                if (response.data) {
                    const userData = response.data;
                    setUser(userData);
                    setFormData(prev => ({
                        ...prev,
                        customerName: userData.fullName || userData.username || prev.customerName,
                        customerPhone: userData.phone || prev.customerPhone
                    }));
                    // Cập nhật localStorage
                    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                    storedUser.phone = userData.phone;
                    storedUser.fullName = userData.fullName;
                    localStorage.setItem('user', JSON.stringify(storedUser));
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        };

        // Nếu có token nhưng chưa có thông tin đầy đủ, fetch từ backend
        const token = localStorage.getItem('token');
        if (token && (!user?.phone || !user?.fullName)) {
            fetchUserInfo();
        }
    }, []);

    const fetchAllTables = async () => {
        setLoadingTables(true);
        try {
            const response = await axiosClient.get('/tables/status/FREE');
            console.log('Full response:', response);
            console.log('Response data:', response.data);
            console.log('Tables array:', response.data?.data);

            if (response.data?.success) {
                const tables = response.data.data || [];
                console.log('First table:', tables[0]);
                setAllTables(tables);
            }
        } catch (err) {
            console.error('Error fetching tables:', err);
            setError('Không thể tải danh sách bàn. Vui lòng thử lại sau.');
        } finally {
            setLoadingTables(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Nếu chọn bàn từ dropdown, cập nhật tableId
        if (name === 'selectedTable') {
            const selectedTable = allTables.find(t => t.id === parseInt(value));
            if (selectedTable) {
                setFormData(prev => ({
                    ...prev,
                    tableId: selectedTable.id,
                    numberOfGuests: selectedTable.capacity || prev.numberOfGuests
                }));
                setSelectedTableNumber(selectedTable.number);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        if (!formData.customerName.trim()) {
            setError('Vui lòng nhập tên khách hàng');
            return;
        }
        if (!formData.customerPhone.trim()) {
            setError('Vui lòng nhập số điện thoại');
            return;
        }
        if (!formData.reservationDate) {
            setError('Vui lòng chọn ngày đặt');
            return;
        }
        if (!formData.reservationTime) {
            setError('Vui lòng chọn giờ đặt');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const reservationData = {
                customerName: formData.customerName,
                customerPhone: formData.customerPhone,
                reservationDate: formData.reservationDate,
                reservationTime: formData.reservationTime + ':00',
                numberOfGuests: formData.numberOfGuests,
                tableType: formData.tableType,
                note: formData.note,
                tableId: formData.tableId
            };

            const response = await axiosClient.post('/reservations/create', reservationData);

            if (response.data?.success) {
                setSuccess('Đặt bàn thành công! Chúng tôi sẽ liên hệ xác nhận với bạn trong ít phút.');
                setFormData(prev => ({
                    ...prev,
                    reservationDate: '',
                    reservationTime: '',
                    numberOfGuests: 2,
                    tableType: 'NORMAL',
                    note: '',
                    tableId: null
                }));
                setSelectedTableNumber('');
            } else {
                setError(response.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau');
            }
        } catch (err) {
            console.error('Booking error:', err);
            setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau');
        } finally {
            setLoading(false);
        }
    };

    // Lấy trạng thái bàn hiển thị
    const getTableStatusBadge = (status) => {
        switch (status) {
            case 'FREE':
                return <span className="status-badge free">🟢 Trống</span>;
            case 'OCCUPIED':
                return <span className="status-badge occupied">🔴 Đang sử dụng</span>;
            case 'RESERVED':
                return <span className="status-badge reserved">🟡 Đã đặt</span>;
            default:
                return <span className="status-badge unknown">⚪ Không xác định</span>;
        }
    };

    return (
        <div className="customer-booking-page">
            <div className="booking-hero">
                <h1>Đặt bàn ngay</h1>
                <p>Trải nghiệm không gian đẳng cấp cùng bạn bè</p>
            </div>

            <div className="booking-container">
                <div className="booking-info">
                    <div className="info-card">
                        <h3>✅ Chính sách đặt bàn</h3>
                        <ul>
                            <li>✓ Đặt bàn miễn phí</li>
                            <li>✓ Giữ bàn trong vòng 15 phút</li>
                            <li>✓ Hủy đặt bàn trước 1 giờ</li>
                            <li>✓ Ưu đãi đặc biệt cho nhóm từ 4 người</li>
                        </ul>
                    </div>

                    {/* Danh sách bàn */}
                    <div className="info-card">
                        <h3>🎱 Danh sách bàn</h3>
                        {loadingTables ? (
                            <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</div>
                        ) : (
                            <div className="tables-list">
                                {allTables.map(table => (
                                    <div key={table.id} className="table-item">
                                        <div className="table-info">
                                            <strong>Bàn {table.number}</strong>
                                            <span>{table.capacity} chỗ</span>
                                            <span>{table.type}</span>
                                        </div>
                                        {getTableStatusBadge(table.status)}
                                    </div>
                                ))}
                                {allTables.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                        Không có bàn trống nào
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Thông tin người dùng đã đăng nhập */}
                    {user && (
                        <div className="info-card">
                            <h3>👤 Thông tin tài khoản</h3>
                            <div className="user-info">
                                <p><User size={14} /> {user.fullName || user.username}</p>
                                <p><Phone size={14} /> {user.phone || 'Chưa cập nhật'}</p>
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="booking-form">
                    <h2>Thông tin đặt bàn</h2>

                    {success && (
                        <div className="alert success">
                            <CheckCircle size={20} />
                            <span>{success}</span>
                        </div>
                    )}

                    {error && (
                        <div className="alert error">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Họ và tên *</label>
                        <input
                            type="text"
                            name="customerName"
                            value={formData.customerName}
                            onChange={handleChange}
                            required
                            placeholder="Nhập họ và tên"
                        />
                    </div>

                    <div className="form-group">
                        <label>Số điện thoại *</label>
                        <input
                            type="tel"
                            name="customerPhone"
                            value={formData.customerPhone}
                            onChange={handleChange}
                            required
                            placeholder="Nhập số điện thoại"
                        />
                        {user?.phone && formData.customerPhone === user.phone && (
                            <p style={{ fontSize: '11px', color: '#10B981', marginTop: '4px' }}>
                                ✓ Số điện thoại từ tài khoản của bạn
                            </p>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Chọn bàn (tùy chọn)</label>
                        {allTables.length === 0 && !loadingTables ? (
                            <p style={{ color: '#94a3b8', padding: '12px', background: '#2d2d3d', borderRadius: '8px' }}>
                                Hiện không có bàn trống
                            </p>
                        ) : (
                            <>
                                <select
                                    value={formData.tableId || ""}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value && value !== "") {
                                            const tableId = parseInt(value);
                                            const selectedTable = allTables.find(t => t.id === tableId);
                                            if (selectedTable) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    tableId: tableId,
                                                    numberOfGuests: selectedTable.capacity || prev.numberOfGuests
                                                }));
                                                setSelectedTableNumber(selectedTable.number);
                                            }
                                        } else {
                                            setFormData(prev => ({ ...prev, tableId: null }));
                                            setSelectedTableNumber('');
                                        }
                                    }}
                                    className="table-select"
                                >
                                    <option value="">-- Không chọn (tự động sắp xếp) --</option>
                                    {allTables.map((table, index) => (
                                        <option key={table.id || index} value={table.id}>
                                            Bàn {table.number} - {table.capacity} chỗ - {table.type || 'Standard'}
                                        </option>
                                    ))}
                                </select>
                                {formData.tableId && selectedTableNumber && (
                                    <p className="selected-table-hint">
                                        ✓ Bạn đã chọn bàn {selectedTableNumber}
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Ngày đặt *</label>
                            <input
                                type="date"
                                name="reservationDate"
                                value={formData.reservationDate}
                                onChange={handleChange}
                                min={today}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Giờ đặt *</label>
                            <select
                                name="reservationTime"
                                value={formData.reservationTime}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Chọn giờ</option>
                                {timeSlots.map(slot => (
                                    <option key={slot} value={slot}>{slot}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Loại bàn mong muốn</label>
                            <select name="tableType" value={formData.tableType} onChange={handleChange}>
                                <option value="NORMAL">Bàn thường</option>
                                <option value="VIP">Bàn VIP</option>
                                <option value="PRIVATE">Phòng riêng</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Số lượng khách</label>
                            <input
                                type="number"
                                name="numberOfGuests"
                                value={formData.numberOfGuests}
                                onChange={handleChange}
                                min={1}
                                max={20}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Ghi chú (tùy chọn)</label>
                        <textarea
                            name="note"
                            value={formData.note}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Yêu cầu đặc biệt (nếu có)"
                        />
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? <><Send size={16} /> Đang xử lý...</> : 'Đặt bàn ngay'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BookingPage;