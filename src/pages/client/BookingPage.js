// pages/customer/BookingPage.js - Sửa phần logic thời gian

import React, { useState, useEffect } from 'react';
import {
    Calendar, Clock, Users, Phone, User,
    CheckCircle, AlertCircle, Send, Award,
    Table, Home, Crown, Coffee, X, Info,
    RefreshCw
} from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import './BookingPage.css';
import webSocketService from '../../services/websocketService';
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
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [checkingAvailability, setCheckingAvailability] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    // Tạo danh sách giờ từ 8h đến 22h
    const generateTimeSlots = () => {
        const slots = [];
        for (let i = 8; i <= 22; i++) {
            const hour = i.toString().padStart(2, '0');
            slots.push(`${hour}:00`);
        }
        return slots;
    };

    // Lấy danh sách giờ đã được đặt cho bàn và ngày
    const fetchBookedSlots = async (tableId, date) => {
        if (!tableId || !date) return [];

        try {
            const response = await axiosClient.get(`/tables/${tableId}/booked-slots`, {
                params: { date }
            });
            console.log('Booked slots:', response.data);
            return response.data?.data || [];
        } catch (err) {
            console.error('Error fetching booked slots:', err);
            return [];
        }
    };

    // Lấy danh sách giờ khả dụng
    const getAvailableTimeSlots = (selectedDate, selectedTableId) => {
        const allSlots = generateTimeSlots();
        const now = new Date();
        const selected = new Date(selectedDate);

        // Lọc giờ theo ngày
        let availableSlots = allSlots;

        // Nếu chọn ngày hôm nay, chỉ hiển thị giờ từ 1 tiếng sau giờ hiện tại
        if (selected.toDateString() === now.toDateString()) {
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            availableSlots = availableSlots.filter(slot => {
                const slotHour = parseInt(slot.split(':')[0]);
                if (slotHour <= currentHour) {
                    return false;
                }
                if (slotHour === currentHour + 1 && currentMinute > 0) {
                    return false;
                }
                return true;
            });
        }

        // Nếu có chọn bàn, loại bỏ các giờ đã được đặt
        if (selectedTableId && bookedSlots.length > 0) {
            availableSlots = availableSlots.filter(slot => {
                // Kiểm tra slot có bị trùng với giờ đã đặt không
                const slotTime = slot;
                for (const booked of bookedSlots) {
                    const bookedStart = booked.startTime;
                    const bookedEnd = booked.endTime;

                    // Nếu slot nằm trong khoảng đã đặt (từ start đến start+2h)
                    if (slotTime >= bookedStart && slotTime < bookedEnd) {
                        return false;
                    }
                }
                return true;
            });
        }

        return availableSlots;
    };

    // ========== SỬA WEBSOCKET CALLBACK ==========
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const connectWS = async () => {
            try {
                await webSocketService.connect(token);

                webSocketService.setTableStatusCallback((data) => {
                    console.log('📡 BookingPage received table status:', data);

                    // ✅ SỬA: Cập nhật đúng bàn trong danh sách
                    setAllTables(prevTables => {
                        const updated = prevTables.map(table =>
                            table.id === data.tableId
                                ? { ...table, status: data.status }
                                : table
                        );
                        return updated;
                    });

                    // ✅ SỬA: Chỉ refetch khi cần thiết
                    if (data.status === 'RESERVED' || data.status === 'OCCUPIED' || data.status === 'FREE') {
                        // Refetch để đồng bộ dữ liệu
                        setTimeout(() => fetchAllTables(), 1000);
                    }
                });

            } catch (error) {
                console.error('BookingPage WebSocket error:', error);
            }
        };

        connectWS();

        return () => {
            webSocketService.setTableStatusCallback(null);
        };
    }, []);

    // Cập nhật danh sách giờ khi ngày hoặc bàn thay đổi
    useEffect(() => {
        const updateSlots = async () => {
            if (formData.reservationDate) {
                // Nếu có chọn bàn, fetch các giờ đã đặt
                if (formData.tableId) {
                    const slots = await fetchBookedSlots(formData.tableId, formData.reservationDate);
                    setBookedSlots(slots);
                } else {
                    setBookedSlots([]);
                }

                const slots = getAvailableTimeSlots(formData.reservationDate, formData.tableId);
                setAvailableTimeSlots(slots);

                // Nếu giờ đã chọn không còn khả dụng, reset
                if (formData.reservationTime && !slots.includes(formData.reservationTime)) {
                    setFormData(prev => ({ ...prev, reservationTime: '' }));
                }
            } else {
                setAvailableTimeSlots(generateTimeSlots());
                setBookedSlots([]);
            }
        };

        updateSlots();
    }, [formData.reservationDate, formData.tableId]);

    // Lấy thông tin user từ localStorage và fetch user info
    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.id) {
            setUser(userData);
            setFormData(prev => ({
                ...prev,
                customerName: userData.fullName || userData.username || '',
                customerPhone: userData.phone || ''
            }));
        }
        fetchAllTables();
        setAvailableTimeSlots(generateTimeSlots());
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
                    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                    storedUser.phone = userData.phone;
                    storedUser.fullName = userData.fullName;
                    localStorage.setItem('user', JSON.stringify(storedUser));
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        };

        const token = localStorage.getItem('token');
        if (token && (!user?.phone || !user?.fullName)) {
            fetchUserInfo();
        }
    }, []);

    const fetchAllTables = async () => {
        setLoadingTables(true);
        try {
            // ✅ Gọi API /tables để lấy TẤT CẢ bàn
            const response = await axiosClient.get('/tables');
            console.log('All tables response:', response.data);

            if (response.data?.success) {
                const tables = response.data.data || [];
                setAllTables(tables);
            } else {
                setAllTables([]);
            }
        } catch (err) {
            console.error('Error fetching tables:', err);
            if (err.response?.status === 401) {
                // Nếu chưa đăng nhập, vẫn hiển thị thông báo
                setError('Vui lòng đăng nhập để xem danh sách bàn và đặt bàn');
            } else {
                setError('Không thể tải danh sách bàn. Vui lòng thử lại sau.');
            }
            setAllTables([]);
        } finally {
            setLoadingTables(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

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

        if (error) setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // ========== VALIDATE FORM ==========
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

        // ========== CHECK DATE ==========
        const today = new Date().toISOString().split('T')[0];
        if (formData.reservationDate < today) {
            setError('Không thể đặt bàn trong quá khứ');
            return;
        }

        // ========== CHECK TIME ==========
        const hour = parseInt(formData.reservationTime.split(':')[0]);
        if (hour < 6 || hour > 22) {
            setError('Chỉ có thể đặt bàn từ 6h đến 22h');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // ========== PREPARE DATA ==========
            const reservationData = {
                customerName: formData.customerName.trim(),
                customerPhone: formData.customerPhone.trim(),
                reservationDate: formData.reservationDate,
                reservationTime: formData.reservationTime + ':00',
                numberOfGuests: parseInt(formData.numberOfGuests) || 2,
                note: formData.note || '',
                tableId: formData.tableId ? parseInt(formData.tableId) : null
            };

            console.log('📤 Sending booking data:', JSON.stringify(reservationData, null, 2));

            // ========== SEND REQUEST ==========
            const response = await axiosClient.post('/reservations/create', reservationData);
            console.log('📥 Booking response:', response.data);

            if (response.data?.success) {
                // ========== SHOW SUCCESS MESSAGE ==========
                setSuccess('Đặt bàn thành công! Chúng tôi sẽ liên hệ xác nhận với bạn trong ít phút.');

                // ========== 🆕 EMIT WEBSOCKET EVENT ==========
                try {
                    const reservationResult = response.data.data;

                    // Kiểm tra WebSocket đã kết nối chưa
                    if (webSocketService.client && webSocketService.client.active) {
                        // Gửi event qua WebSocket để staff nhận được real-time
                        webSocketService.client.publish({
                            destination: '/app/reservation.new',
                            body: JSON.stringify({
                                tableId: reservationResult.tableId,
                                tableNumber: reservationResult.tableNumber,
                                customerName: reservationResult.customerName,
                                customerPhone: reservationResult.customerPhone,
                                reservationDate: reservationResult.reservationDate,
                                reservationTime: reservationResult.reservationTime,
                                numberOfGuests: reservationResult.numberOfGuests,
                                status: 'RESERVED',
                                createdAt: new Date().toISOString()
                            })
                        });
                        console.log('📤 WebSocket: New reservation event emitted');
                    } else {
                        console.warn('⚠️ WebSocket not connected, cannot emit event');
                    }
                } catch (wsError) {
                    console.warn('⚠️ WebSocket emit error:', wsError);
                    // Không throw lỗi, vẫn cho phép đặt bàn thành công
                }

                // ========== UPDATE BOOKED SLOTS ==========
                if (formData.tableId) {
                    const slots = await fetchBookedSlots(formData.tableId, formData.reservationDate);
                    setBookedSlots(slots);
                    const newSlots = getAvailableTimeSlots(formData.reservationDate, formData.tableId);
                    setAvailableTimeSlots(newSlots);
                }

                // ========== RESET FORM ==========
                setFormData(prev => ({
                    ...prev,
                    reservationDate: '',
                    reservationTime: '',
                    numberOfGuests: 2,
                    note: '',
                    tableId: null
                }));
                setSelectedTableNumber('');

                // ========== REFRESH TABLES ==========
                fetchAllTables();

            } else {
                // ========== SHOW ERROR FROM RESPONSE ==========
                setError(response.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau');
            }

        } catch (err) {
            // ========== HANDLE ERROR ==========
            console.error('❌ Booking error:', err);
            console.error('Error response:', err.response);
            console.error('Error data:', err.response?.data);

            const errorData = err.response?.data;
            let errorMessage = 'Có lỗi xảy ra, vui lòng thử lại sau';

            if (errorData) {
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.errors) {
                    const errors = Object.values(errorData.errors).flat();
                    errorMessage = errors.join(', ');
                }
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getTableStatusBadge = (status) => {
        const statusMap = {
            'FREE': { text: 'Trống', color: '#059669', bg: '#d1fae5' },
            'OCCUPIED': { text: 'Đang sử dụng', color: '#dc2626', bg: '#fee2e2' },
            'RESERVED': { text: 'Đã đặt', color: '#d97706', bg: '#fef3c7' },
            default: { text: 'Không xác định', color: '#6b7280', bg: '#f3f4f6' }
        };
        const s = statusMap[status] || statusMap.default;
        return (
            <span className="status-badge" style={{
                background: s.bg,
                color: s.color
            }}>
                {s.text}
            </span>
        );
    };

    const getTableTypeIcon = (type) => {
        switch (type) {
            case 'VIP': return <Crown size={16} />;
            case 'PRIVATE': return <Home size={16} />;
            default: return <Table size={16} />;
        }
    };

    const getTableTypeLabel = (type) => {
        switch (type) {
            case 'VIP': return 'VIP';
            case 'PRIVATE': return 'Phòng riêng';
            default: return 'Bàn thường';
        }
    };

    return (
        <div className="booking-page">
            <div className="booking-hero">
                <div className="hero-content">
                    <h1 className="hero-title">
                        <Calendar size={32} className="hero-icon" />
                        Đặt bàn ngay
                    </h1>
                    <p className="hero-subtitle">Trải nghiệm không gian đẳng cấp cùng bạn bè</p>
                    <div className="hero-features">
                        <span><CheckCircle size={18} /> Đặt bàn miễn phí</span>
                        <span><Clock size={18} /> Giữ bàn 15 phút</span>
                        <span><Users size={18} /> Ưu đãi nhóm 4+</span>
                    </div>
                </div>
            </div>

            <div className="booking-container">
                <div className="booking-sidebar">
                    <div className="info-card">
                        <h3 className="info-card-title">
                            <CheckCircle size={20} className="info-icon" />
                            Chính sách đặt bàn
                        </h3>
                        <ul className="policy-list">
                            <li>Đặt bàn hoàn toàn miễn phí</li>
                            <li>Giữ bàn trong vòng 15 phút</li>
                            <li>Hủy đặt bàn trước 1 giờ</li>
                            <li>Ưu đãi đặc biệt cho nhóm từ 4 người</li>
                            <li>Phục vụ đồ uống miễn phí cho bàn VIP</li>
                        </ul>
                    </div>

                    <div className="info-card">
                        <h3 className="info-card-title">
                            <Table size={20} className="info-icon" />
                            Danh sách bàn trống
                        </h3>
                        {loadingTables ? (
                            <div className="loading-tables">Đang tải...</div>
                        ) : (
                            <div className="tables-grid">
                                {allTables.map(table => {
                                    const isAvailable = table.status === 'FREE';
                                    const isReserved = table.status === 'RESERVED';
                                    const isOccupied = table.status === 'OCCUPIED';

                                    return (
                                        <div
                                            key={table.id}
                                            className={`table-card ${!isAvailable ? 'occupied' : ''}`}
                                        >
                                            <div className="table-card-header">
                                                <span className="table-number">Bàn {table.number}</span>
                                                {getTableStatusBadge(table.status)}
                                            </div>
                                            <div className="table-card-body">
                                                <span className="table-capacity">
                                                    <Users size={14} /> {table.capacity} chỗ
                                                </span>
                                                <span className="table-type">
                                                    {getTableTypeIcon(table.type)}
                                                    {getTableTypeLabel(table.type)}
                                                </span>
                                            </div>
                                            {isAvailable ? (
                                                <button
                                                    className="book-btn"
                                                    onClick={() => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            tableId: table.id,
                                                            numberOfGuests: table.capacity || prev.numberOfGuests
                                                        }));
                                                        setSelectedTableNumber(table.number);
                                                        document.querySelector('.booking-form')?.scrollIntoView({ behavior: 'smooth' });
                                                    }}
                                                >
                                                    <Calendar size={16} /> Đặt bàn ngay
                                                </button>
                                            ) : isReserved ? (
                                                <div className="table-status-message reserved">
                                                    <Clock size={14} /> Đã có người đặt
                                                </div>
                                            ) : isOccupied ? (
                                                <div className="table-status-message occupied">
                                                    <Users size={14} /> Đang có khách
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}
                                {allTables.length === 0 && !loadingTables && (
                                    <div className="no-tables">
                                        <Table size={48} />
                                        <p>Không có bàn nào</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {user && (
                        <div className="info-card user-info-card">
                            <h3 className="info-card-title">
                                <User size={20} className="info-icon" />
                                Thông tin tài khoản
                            </h3>
                            <div className="user-details">
                                <div className="user-detail">
                                    <User size={16} />
                                    <span>{user.fullName || user.username}</span>
                                </div>
                                <div className="user-detail">
                                    <Phone size={16} />
                                    <span>{user.phone || 'Chưa cập nhật'}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="booking-form">
                    <div className="form-header">
                        <h2 className="form-title">Thông tin đặt bàn</h2>
                        <p className="form-subtitle">Vui lòng điền đầy đủ thông tin để chúng tôi phục vụ bạn tốt nhất</p>
                    </div>

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

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">
                                <User size={16} />
                                Họ và tên <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                name="customerName"
                                value={formData.customerName}
                                onChange={handleChange}
                                required
                                placeholder="Nhập họ và tên"
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <Phone size={16} />
                                Số điện thoại <span className="required">*</span>
                            </label>
                            <input
                                type="tel"
                                name="customerPhone"
                                value={formData.customerPhone}
                                onChange={handleChange}
                                required
                                placeholder="Nhập số điện thoại"
                                className="form-input"
                            />
                            {user?.phone && formData.customerPhone === user.phone && (
                                <div className="input-hint success">
                                    <CheckCircle size={14} />
                                    Số điện thoại từ tài khoản của bạn
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <Table size={16} />
                            Chọn bàn (tùy chọn)
                        </label>
                        {allTables.length === 0 && !loadingTables ? (
                            <div className="no-tables-message">
                                Hiện không có bàn trống
                            </div>
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
                                    className="form-select"
                                >
                                    <option value="">-- Không chọn (tự động sắp xếp) --</option>
                                    {allTables.map((table, index) => (
                                        <option key={table.id || index} value={table.id}>
                                            Bàn {table.number} - {table.capacity} chỗ - {getTableTypeLabel(table.type)}
                                        </option>
                                    ))}
                                </select>
                                {formData.tableId && selectedTableNumber && (
                                    <div className="input-hint success">
                                        <CheckCircle size={14} />
                                        Bạn đã chọn bàn {selectedTableNumber}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">
                                <Calendar size={16} />
                                Ngày đặt <span className="required">*</span>
                            </label>
                            <input
                                type="date"
                                name="reservationDate"
                                value={formData.reservationDate}
                                onChange={handleChange}
                                min={today}
                                max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                required
                                className="form-input"
                            />
                            {formData.reservationDate && (
                                <div className="input-hint info">
                                    <Info size={14} />
                                    Bạn có thể đặt bàn trong vòng 7 ngày tới
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <Clock size={16} />
                                Giờ đặt <span className="required">*</span>
                            </label>
                            <select
                                name="reservationTime"
                                value={formData.reservationTime}
                                onChange={handleChange}
                                required
                                className="form-select"
                            >
                                <option value="">Chọn giờ</option>
                                {availableTimeSlots.map(slot => (
                                    <option key={slot} value={slot}>{slot}</option>
                                ))}
                            </select>
                            {formData.reservationDate === today && availableTimeSlots.length === 0 && (
                                <div className="input-hint warning">
                                    <AlertCircle size={14} />
                                    Hôm nay đã hết giờ đặt bàn. Vui lòng chọn ngày khác.
                                </div>
                            )}
                            {formData.tableId && formData.reservationDate && (
                                <button
                                    type="button"
                                    className="refresh-slots-btn"
                                    onClick={async () => {
                                        if (formData.tableId && formData.reservationDate) {
                                            const slots = await fetchBookedSlots(formData.tableId, formData.reservationDate);
                                            setBookedSlots(slots);
                                            const newSlots = getAvailableTimeSlots(formData.reservationDate, formData.tableId);
                                            setAvailableTimeSlots(newSlots);
                                        }
                                    }}
                                >
                                    <RefreshCw size={14} />
                                    Cập nhật giờ trống
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">
                                <Users size={16} />
                                Số lượng khách
                            </label>
                            <input
                                type="number"
                                name="numberOfGuests"
                                value={formData.numberOfGuests}
                                onChange={handleChange}
                                min={1}
                                max={20}
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <Coffee size={16} />
                            Ghi chú (tùy chọn)
                        </label>
                        <textarea
                            name="note"
                            value={formData.note}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Yêu cầu đặc biệt (nếu có)"
                            className="form-textarea"
                        />
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? (
                            <>
                                <div className="spinner-small"></div>
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                Đặt bàn ngay
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BookingPage;