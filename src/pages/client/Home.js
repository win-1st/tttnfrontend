// pages/client/Home.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
    const [selectedTable, setSelectedTable] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [tables, setTables] = useState([]);  // State lưu danh sách bàn từ database
    const [loadingTables, setLoadingTables] = useState(true);

    // Kiểm tra đăng nhập
    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
    }, []);

    // Lấy danh sách bàn từ API
    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        setLoadingTables(true);
        try {
            // Gọi API lấy danh sách bàn trống (FREE) cho khách hàng
            const response = await axiosClient.get('/tables/status/FREE');
            console.log('Tables from API:', response.data);

            if (response.data?.success) {
                const tablesData = response.data.data || [];
                // Chuyển đổi dữ liệu từ API sang format hiển thị
                const formattedTables = tablesData.map(table => ({
                    id: table.id,
                    name: `Bàn ${table.number}`,
                    number: table.number,
                    type: table.type || 'Standard',
                    price: table.pricePerHour || 50000,
                    status: table.status?.toLowerCase() || 'available',
                    statusText: getStatusText(table.status),
                    capacity: table.capacity || 4
                }));
                setTables(formattedTables);
            } else {
                // Fallback data nếu API lỗi
                setTables([]);
            }
        } catch (error) {
            console.error('Error fetching tables:', error);
            // Fallback: hiển thị thông báo lỗi
            setTables([]);
        } finally {
            setLoadingTables(false);
        }
    };

    const getStatusText = (status) => {
        switch (status?.toUpperCase()) {
            case 'FREE': return 'Trống';
            case 'OCCUPIED': return 'Đang sử dụng';
            case 'RESERVED': return 'Đã đặt';
            case 'MAINTENANCE': return 'Bảo trì';
            default: return 'Trống';
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'free': return '#4caf50';
            case 'occupied': return '#f44336';
            case 'reserved': return '#ff9800';
            case 'maintenance': return '#9e9e9e';
            default: return '#4caf50';
        }
    };

    // Time slots available
    const timeSlots = [
        '09:00 - 11:00', '11:00 - 13:00', '13:00 - 15:00',
        '15:00 - 17:00', '17:00 - 19:00', '19:00 - 21:00',
        '21:00 - 23:00'
    ];

    const handleTableClick = (table) => {
        if (table.status === 'free' || table.status === 'FREE') {
            setSelectedTable(table);
            setShowBookingModal(true);
        } else {
            alert(`Bàn ${table.name} ${table.statusText}. Vui lòng chọn bàn khác!`);
        }
    };

    const handleBooking = () => {
        if (!isLoggedIn) {
            alert('Vui lòng đăng nhập để đặt bàn!');
            navigate('/login');
            return;
        }

        if (!selectedTimeSlot) {
            alert('Vui lòng chọn khung giờ!');
            return;
        }

        // Chuyển hướng sang trang đặt bàn với thông tin đã chọn
        const bookingInfo = {
            table: selectedTable,
            date: selectedDate,
            timeSlot: selectedTimeSlot,
            startTime: selectedTimeSlot.split(' - ')[0],
            endTime: selectedTimeSlot.split(' - ')[1]
        };

        // Lưu vào localStorage để trang đặt bàn đọc
        localStorage.setItem('quickBooking', JSON.stringify(bookingInfo));

        // Chuyển hướng sang trang đặt bàn
        navigate('/dat-ban', { state: { quickBooking: bookingInfo } });
        setShowBookingModal(false);
        setSelectedTable(null);
        setSelectedTimeSlot(null);
    };

    // Điều hướng đến trang đặt bàn
    const goToBookingPage = () => {
        navigate('/dat-ban');
    };

    // Features data
    const features = [
        { icon: '🎱', title: 'Bàn Bida Chất Lượng', desc: 'Bàn bida nhập khẩu, mặt bàn đá tự nhiên, đạt tiêu chuẩn quốc tế' },
        { icon: '📱', title: 'Đặt Bàn Trực Tuyến', desc: 'Đặt bàn dễ dàng qua website, chọn giờ và bàn yêu thích chỉ trong vài giây' },
        { icon: '🍺', title: 'Order Đồ Uống Tại Chỗ', desc: 'Thực đơn phong phú, phục vụ tận bàn nhanh chóng' },
        { icon: '💳', title: 'Thanh Toán Linh Hoạt', desc: 'Hỗ trợ tiền mặt, chuyển khoản, Momo, VNPay' },
        { icon: '🕐', title: 'Tính Giờ Tự Động', desc: 'Hệ thống tính giờ chính xác, cảnh báo sắp hết giờ' },
        { icon: '🎁', title: 'Ưu Đãi Hấp Dẫn', desc: 'Nhiều chương trình khuyến mãi, tích điểm đổi quà' }
    ];

    // Pricing data
    const pricing = [
        { name: 'Bàn Standard', price: '50.000', unit: 'đ/giờ', features: ['Bàn bida kích thước chuẩn', 'Phụ kiện cao cấp', 'Phục vụ đồ uống', 'Wi-Fi miễn phí'], popular: false },
        { name: 'Bàn VIP', price: '100.000', unit: 'đ/giờ', features: ['Bàn bida cao cấp', 'Phụ kiện chính hãng', 'Phục vụ đồ uống + snack', 'Wi-Fi tốc độ cao', 'Phòng máy lạnh riêng'], popular: true },
        { name: 'Gói Tháng', price: '1.500.000', unit: 'đ/tháng', features: ['Chơi không giới hạn', 'Ưu tiên đặt bàn', 'Giảm 20% đồ uống', 'Quà tặng sinh nhật'], popular: false }
    ];

    return (
        <div className="home-page">
            {/* Hero Slider Section */}
            <section className="hero-slider">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1 className="hero-title">
                        Win BIDA
                        <span>Trải Nghiệm Đẳng Cấp</span>
                    </h1>
                    <p className="hero-subtitle">
                        Hệ thống quản lý quán bida hiện đại với công nghệ đặt bàn trực tuyến,
                        thanh toán linh hoạt và dịch vụ chuyên nghiệp
                    </p>
                    <div className="hero-buttons">
                        <button onClick={goToBookingPage} className="btn-primary">
                            Đặt bàn ngay
                        </button>
                        <Link to="/thuc-don" className="btn-secondary">
                            Xem thực đơn
                        </Link>
                    </div>
                </div>
            </section>

            {/* Quick Access Section */}
            <section className="quick-access">
                <div className="container">
                    <div className="quick-access-grid">
                        <Link to="/dat-ban" className="quick-card">
                            <div className="quick-icon">🎱</div>
                            <h3>Đặt bàn</h3>
                            <p>Chọn bàn theo sơ đồ</p>
                        </Link>
                        <Link to="/thuc-don" className="quick-card">
                            <div className="quick-icon">🍕</div>
                            <h3>Order</h3>
                            <p>Đồ uống & thức ăn</p>
                        </Link>
                        <Link to="/lich-su" className="quick-card">
                            <div className="quick-icon">📋</div>
                            <h3>Lịch sử</h3>
                            <p>Đặt bàn & giao dịch</p>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Table Map Section - Real-time from Database */}
            <section id="table-map" className="table-map-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Sơ Đồ Bàn Real-time</h2>
                        <p className="section-subtitle">Xem trạng thái bàn theo thời gian thực</p>
                        <div className="status-legend">
                            <span><span className="legend-color available"></span> Trống</span>
                            <span><span className="legend-color occupied"></span> Đang sử dụng</span>
                            <span><span className="legend-color booked"></span> Đã đặt</span>
                            <span><span className="legend-color maintenance"></span> Bảo trì</span>
                        </div>
                    </div>

                    {loadingTables ? (
                        <div className="loading-tables">
                            <div className="spinner"></div>
                            <p>Đang tải danh sách bàn...</p>
                        </div>
                    ) : tables.length === 0 ? (
                        <div className="empty-tables">
                            <p>Không có bàn nào hiện tại</p>
                        </div>
                    ) : (
                        <div className="table-grid">
                            {tables.map(table => (
                                <div
                                    key={table.id}
                                    className={`table-card ${table.status} ${selectedTable?.id === table.id ? 'selected' : ''}`}
                                    onClick={() => handleTableClick(table)}
                                    style={{ cursor: table.status === 'free' ? 'pointer' : 'not-allowed' }}
                                >
                                    <div className="table-status" style={{ backgroundColor: getStatusColor(table.status) }}></div>
                                    <div className="table-number">{table.name}</div>
                                    <div className="table-type">{table.type}</div>
                                    <div className="table-price">{table.price.toLocaleString()}đ/giờ</div>
                                    <div className="table-status-text">{table.statusText}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Promotions Banner */}
            <section className="promotions-section">
                <div className="container">
                    <div className="promo-banner">
                        <div className="promo-content">
                            <span className="promo-badge">🔥 HOT DEAL</span>
                            <h2>Giảm 20% cho lần đặt bàn đầu tiên</h2>
                            <p>Áp dụng cho tất cả các bàn. Nhập mã: <strong>Win20</strong></p>
                            <button onClick={goToBookingPage} className="btn-promo">Đặt bàn ngay</button>
                        </div>
                        <div className="promo-timer">
                            <h3>Khuyến mãi kết thúc sau:</h3>
                            <div className="timer">
                                <span>05</span>:<span>12</span>:<span>30</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Tại Sao Chọn Win BIDA?</h2>
                        <p className="section-subtitle">Những ưu điểm vượt trội chỉ có tại chúng tôi</p>
                    </div>
                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="feature-card">
                                <div className="feature-icon">{feature.icon}</div>
                                <h3>{feature.title}</h3>
                                <p>{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="pricing-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Bảng Giá Dịch Vụ</h2>
                        <p className="section-subtitle">Giá cả cạnh tranh, nhiều ưu đãi hấp dẫn</p>
                    </div>
                    <div className="pricing-grid">
                        {pricing.map((plan, index) => (
                            <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                                {plan.popular && <div className="popular-badge">Phổ biến nhất</div>}
                                <h3>{plan.name}</h3>
                                <div className="price">
                                    <span className="amount">{plan.price}</span>
                                    <span className="unit">{plan.unit}</span>
                                </div>
                                <ul className="features-list">
                                    {plan.features.map((feature, i) => (
                                        <li key={i}>✓ {feature}</li>
                                    ))}
                                </ul>
                                <button onClick={goToBookingPage} className="btn-pricing">
                                    {plan.popular ? 'Đặt ngay' : 'Chọn gói'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="container">
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-number">12+</div>
                            <div className="stat-label">Bàn Bida</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">5,000+</div>
                            <div className="stat-label">Khách Hàng</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">5+</div>
                            <div className="stat-label">Năm Kinh Nghiệm</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">24/7</div>
                            <div className="stat-label">Hỗ Trợ</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2>Sẵn sàng trải nghiệm?</h2>
                        <p>Đặt bàn ngay hôm nay để nhận ưu đãi giảm 20% cho lần đầu tiên</p>
                        <div className="cta-buttons">
                            <button onClick={goToBookingPage} className="btn-cta-primary">
                                Đặt bàn ngay
                            </button>
                            <button onClick={() => navigate('/lien-he')} className="btn-cta-secondary">
                                Liên hệ tư vấn
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Booking Modal */}
            {showBookingModal && selectedTable && (
                <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
                    <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Đặt bàn {selectedTable.name}</h3>
                            <button className="modal-close" onClick={() => setShowBookingModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="booking-info">
                                <p><strong>Loại bàn:</strong> {selectedTable.type}</p>
                                <p><strong>Giá:</strong> {selectedTable.price.toLocaleString()}đ/giờ</p>
                                <p><strong>Sức chứa:</strong> {selectedTable.capacity} người</p>
                            </div>

                            <div className="booking-date">
                                <label>Chọn ngày:</label>
                                <input
                                    type="date"
                                    value={selectedDate.toISOString().split('T')[0]}
                                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="booking-time">
                                <label>Chọn khung giờ:</label>
                                <div className="time-slots">
                                    {timeSlots.map((slot, index) => (
                                        <button
                                            key={index}
                                            className={`time-slot ${selectedTimeSlot === slot ? 'selected' : ''}`}
                                            onClick={() => setSelectedTimeSlot(slot)}
                                        >
                                            {slot}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {!isLoggedIn && (
                                <div className="login-warning">
                                    ⚠️ Vui lòng <Link to="/login">đăng nhập</Link> để đặt bàn
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowBookingModal(false)}>Hủy</button>
                            <button className="btn-confirm" onClick={handleBooking}>
                                Xác nhận đặt bàn
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;