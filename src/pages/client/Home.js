// pages/client/Home.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    MessageCircle, X, Send, Minimize2, Maximize2,
    Calendar, Clock, Users, Phone, MapPin,
    CheckCircle, AlertCircle, Award, Crown,
    Star, Coffee, Table, Home as HomeIcon,
    ShoppingBag, CreditCard, Gift, Percent,
    TrendingUp, Sparkles, Zap, Shield,
    Play, Music, Wifi, Coffee as CoffeeIcon,
    Pizza, Beer, Smile, ThumbsUp,
    ChevronRight, ArrowRight, Timer
} from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import './Home.css';
import webSocketService from '../../services/websocketService';
const Home = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
    const [selectedTable, setSelectedTable] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [tables, setTables] = useState([]);
    const [loadingTables, setLoadingTables] = useState(true);
    const [promotions, setPromotions] = useState([]);
    const [loadingPromotions, setLoadingPromotions] = useState(true);

    // Chat state
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isChatMinimized, setIsChatMinimized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const heroSlides = [
        {
            image: '/bida3.jpg',
        },
        {
            image: '/bida5.jpg',
        },
        {
            image: '/bida1.jpg',
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % heroSlides.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Hàm chuyển slide
    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    const prevSlide = () => {
        setCurrentSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length);
    };

    const nextSlide = () => {
        setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    };
    // Kiểm tra đăng nhập
    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
    }, []);

    // Lấy danh sách bàn và khuyến mãi
    useEffect(() => {
        fetchTables();
        fetchPromotions();
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const connectWS = async () => {
            try {
                await webSocketService.connect(token);

                // Set callback cho table status
                webSocketService.setTableStatusCallback((data) => {
                    console.log('📡 Home received table status:', data);

                    // Cập nhật bàn trong state
                    setTables(prevTables => {
                        const tableExists = prevTables.find(t => t.id === data.tableId);

                        if (tableExists) {
                            // Cập nhật bàn hiện có
                            return prevTables.map(table =>
                                table.id === data.tableId
                                    ? {
                                        ...table,
                                        status: (data.status || table.status)?.toLowerCase(),
                                        statusText: getStatusText(data.status)
                                    }
                                    : table
                            );
                        } else if (data.status === 'RESERVED' || data.status === 'OCCUPIED') {
                            // Bàn mới được đặt - refetch để lấy đầy đủ thông tin
                            fetchTables();
                            return prevTables;
                        }

                        return prevTables;
                    });

                    // Nếu bàn chuyển sang OCCUPIED hoặc RESERVED, refetch để đồng bộ
                    if (data.status === 'OCCUPIED' || data.status === 'RESERVED') {
                        setTimeout(() => fetchTables(), 500);
                    }
                });

            } catch (error) {
                console.error('Home WebSocket error:', error);
            }
        };

        connectWS();

        return () => {
            webSocketService.setTableStatusCallback(null);
        };
    }, [isLoggedIn]);

    // Scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto show chat welcome
    useEffect(() => {
        if (isChatOpen && messages.length === 0) {
            addMessage('bot', 'Xin chào! Tôi là trợ lý ảo của Win BIDA. Tôi có thể giúp gì cho bạn?');
        }
    }, [isChatOpen]);

    const fetchTables = async () => {
        setLoadingTables(true);
        try {
            // Đổi từ /tables/status/FREE thành /tables để lấy TẤT CẢ bàn
            const response = await axiosClient.get('/tables');
            console.log('Tables from API:', response.data);

            // Xử lý response - có thể là array hoặc object có data
            let tablesData = [];
            if (Array.isArray(response.data)) {
                tablesData = response.data;
            } else if (response.data?.success && Array.isArray(response.data.data)) {
                tablesData = response.data.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                tablesData = response.data.data;
            }

            const formattedTables = tablesData.map(table => ({
                id: table.id,
                name: `Bàn ${table.number}`,
                number: table.number,
                type: table.type || 'Standard',
                price: table.pricePerHour || 50000,
                status: table.status?.toLowerCase() || 'free',
                statusText: getStatusText(table.status),
                capacity: table.capacity || 4
            }));
            setTables(formattedTables);
        } catch (error) {
            console.error('Error fetching tables:', error);
            setTables([]);
        } finally {
            setLoadingTables(false);
        }
    };

    const fetchPromotions = async () => {
        setLoadingPromotions(true);
        try {
            const response = await axiosClient.get('/promotions/active');
            console.log('Promotions response:', response.data);
            if (response.data?.success) {
                const promoData = response.data.data || [];
                // Log chi tiết để debug
                promoData.forEach((promo, index) => {
                    console.log(`Promo ${index + 1}:`, {
                        id: promo.id,
                        name: promo.name,
                        discountPercentage: promo.discountPercentage,
                        discountAmount: promo.discountAmount,
                        startDate: promo.startDate,
                        endDate: promo.endDate,
                        isActive: promo.isActive,
                        description: promo.description
                    });
                });
                setPromotions(promoData);
            } else {
                setPromotions([]);
            }
        } catch (error) {
            console.error('Error fetching promotions:', error);
            setPromotions([]);
        } finally {
            setLoadingPromotions(false);
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

        const bookingInfo = {
            table: selectedTable,
            date: selectedDate,
            timeSlot: selectedTimeSlot,
            startTime: selectedTimeSlot.split(' - ')[0],
            endTime: selectedTimeSlot.split(' - ')[1]
        };

        localStorage.setItem('quickBooking', JSON.stringify(bookingInfo));
        navigate('/dat-ban', { state: { quickBooking: bookingInfo } });
        setShowBookingModal(false);
        setSelectedTable(null);
        setSelectedTimeSlot(null);
    };

    const goToBookingPage = () => {
        navigate('/dat-ban');
    };

    // ========== CHAT FUNCTIONS ==========

    const addMessage = (sender, text) => {
        setMessages(prev => [...prev, {
            id: Date.now(),
            sender: sender,
            text: text,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }]);
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        const userMessage = inputMessage.trim();
        setInputMessage('');
        addMessage('user', userMessage);

        setIsLoading(true);
        try {
            const response = await axiosClient.post('/chat/ask', {
                message: userMessage,
                tableCode: 'B001'
            });

            const reply = response.data?.reply || 'Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Vui lòng thử lại!';
            addMessage('bot', reply);
        } catch (error) {
            console.error('Chat error:', error);
            const fallbackReply = 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ hotline: 1900xxxx.';
            addMessage('bot', fallbackReply);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const quickQuestions = [
        'Giá bàn bao nhiêu?',
        'Có bàn trống không?',
        'Giờ mở cửa?',
        'Cách đặt bàn?'
    ];

    const handleQuickQuestion = (question) => {
        setInputMessage(question);
        setTimeout(() => {
            handleSendMessage();
        }, 300);
    };

    // ========== END CHAT FUNCTIONS ==========

    // Format discount value - Sửa đúng theo model
    const formatDiscountValue = (promo) => {
        if (!promo) return '0%';

        // Kiểm tra discountPercentage trước
        if (promo.discountPercentage !== null && promo.discountPercentage !== undefined) {
            const value = typeof promo.discountPercentage === 'number'
                ? promo.discountPercentage
                : parseFloat(promo.discountPercentage);
            return `${value}%`;
        }

        // Kiểm tra discountAmount
        if (promo.discountAmount !== null && promo.discountAmount !== undefined) {
            const value = typeof promo.discountAmount === 'number'
                ? promo.discountAmount
                : parseFloat(promo.discountAmount);
            return `${value.toLocaleString('vi-VN')}đ`;
        }

        return '0%';
    };

    // Format date range
    const formatDateRange = (startDate, endDate) => {
        if (!startDate && !endDate) return '';

        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            try {
                const date = new Date(dateStr);
                return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
            } catch {
                return dateStr;
            }
        };

        const start = formatDate(startDate);
        const end = formatDate(endDate);

        if (start && end) {
            return `${start} - ${end}`;
        }
        if (start) return `Từ ${start}`;
        if (end) return `Đến ${end}`;
        return '';
    };

    // Kiểm tra loại giảm giá
    const isPercentageDiscount = (promo) => {
        return promo.discountPercentage !== null && promo.discountPercentage !== undefined;
    };

    // Features data
    const features = [
        { icon: <Table size={28} />, title: 'Bàn Bida Chất Lượng', desc: 'Bàn bida nhập khẩu, mặt bàn đá tự nhiên, đạt tiêu chuẩn quốc tế' },
        { icon: <Calendar size={28} />, title: 'Đặt Bàn Trực Tuyến', desc: 'Đặt bàn dễ dàng qua website, chọn giờ và bàn yêu thích chỉ trong vài giây' },
        { icon: <CoffeeIcon size={28} />, title: 'Order Đồ Uống Tại Chỗ', desc: 'Thực đơn phong phú, phục vụ tận bàn nhanh chóng' },
        { icon: <CreditCard size={28} />, title: 'Thanh Toán Linh Hoạt', desc: 'Hỗ trợ tiền mặt, chuyển khoản, MoMo, VNPay' },
        { icon: <Clock size={28} />, title: 'Tính Giờ Tự Động', desc: 'Hệ thống tính giờ chính xác, cảnh báo sắp hết giờ' },
        { icon: <Gift size={28} />, title: 'Ưu Đãi Hấp Dẫn', desc: 'Nhiều chương trình khuyến mãi, tích điểm đổi quà' }
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
                {heroSlides.map((slide, index) => (
                    <div
                        key={index}
                        className="hero-slide"
                        style={{
                            opacity: index === currentSlide ? 1 : 0,
                            transition: 'opacity 0.8s ease-in-out',
                            backgroundImage: `url(${slide.image})`,
                        }}
                    />
                ))}
                <div className="hero-overlay"></div>
                <div className="hero-dots">
                    {heroSlides.map((_, index) => (
                        <button key={index} className={`hero-dot ${index === currentSlide ? 'active' : ''}`} onClick={() => goToSlide(index)} />
                    ))}
                </div>
                <button className="hero-arrow hero-arrow-left" onClick={prevSlide}>
                    <ArrowRight size={20} style={{ transform: 'rotate(180deg)' }} />
                </button>
                <button className="hero-arrow hero-arrow-right" onClick={nextSlide}>
                    <ArrowRight size={20} />
                </button>
            </section>

            {/* Quick Access Section */}
            <section className="quick-access">
                <div className="container">
                    <div className="quick-access-grid">
                        <Link to="/dat-ban" className="quick-card">
                            <div className="quick-icon"><Table size={32} /></div>
                            <h3>Đặt bàn</h3>
                            <p>Chọn bàn theo sơ đồ</p>
                        </Link>
                        <Link to="/thuc-don" className="quick-card">
                            <div className="quick-icon"><ShoppingBag size={32} /></div>
                            <h3>Order</h3>
                            <p>Đồ uống & thức ăn</p>
                        </Link>
                        <Link to="/lich-su" className="quick-card">
                            <div className="quick-icon"><Clock size={32} /></div>
                            <h3>Lịch sử</h3>
                            <p>Đặt bàn & giao dịch</p>
                        </Link>
                        <Link to="/khuyen-mai" className="quick-card highlight">
                            <div className="quick-icon"><Percent size={32} /></div>
                            <h3>Khuyến mãi</h3>
                            <p>Ưu đãi đặc biệt</p>
                            {promotions.length > 0 && (
                                <span className="promo-badge">{promotions.length} ưu đãi</span>
                            )}
                        </Link>
                    </div>
                </div>
            </section>

            {/* Promotions Display */}
            {promotions.length > 0 && (
                <section className="promo-display-section">
                    <div className="container">
                        <div className="promo-display-header">
                            <h2>
                                <Percent size={24} />
                                Khuyến mãi đặc biệt
                            </h2>
                            <Link to="/khuyen-mai" className="view-all">
                                Xem tất cả <ChevronRight size={16} />
                            </Link>
                        </div>
                        <div className="promo-cards">
                            {promotions.slice(0, 3).map((promo, index) => {
                                const discountValue = formatDiscountValue(promo);
                                const dateRange = formatDateRange(promo.startDate, promo.endDate);
                                const isPercent = isPercentageDiscount(promo);

                                return (
                                    <div key={promo.id || index} className="promo-card">
                                        <div className="promo-card-icon">
                                            {isPercent ?
                                                <Percent size={24} /> :
                                                <Gift size={24} />
                                            }
                                        </div>
                                        <div className="promo-card-content">
                                            <h4>{promo.name || 'Khuyến mãi'}</h4>
                                            <p>{promo.description || 'Ưu đãi đặc biệt dành cho bạn'}</p>
                                            <div className="promo-card-discount">
                                                <span className="discount-value">
                                                    {discountValue}
                                                </span>
                                                {dateRange && (
                                                    <span className="discount-date">
                                                        {dateRange}
                                                    </span>
                                                )}
                                                <button
                                                    className="promo-card-btn"
                                                    onClick={goToBookingPage}
                                                >
                                                    Áp dụng ngay
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Table Map Section */}
            <section id="table-map" className="table-map-section">
                <div className="container">
                    <div className="section-header">
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
                            <Table size={48} />
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
                                {plan.popular && (
                                    <div className="popular-badge">
                                        <Award size={16} /> Phổ biến nhất
                                    </div>
                                )}
                                <h3>{plan.name}</h3>
                                <div className="price">
                                    <span className="amount">{plan.price}</span>
                                    <span className="unit">{plan.unit}</span>
                                </div>
                                <ul className="features-list">
                                    {plan.features.map((feature, i) => (
                                        <li key={i}>
                                            <CheckCircle size={14} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={goToBookingPage} className="btn-pricing">
                                    {plan.popular ? 'Đặt ngay' : 'Chọn gói'}
                                    <ArrowRight size={16} />
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
                                <Calendar size={18} />
                                Đặt bàn ngay
                            </button>
                            <button onClick={() => navigate('/lien-he')} className="btn-cta-secondary">
                                <Phone size={18} />
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
                            <h3>
                                <Table size={20} />
                                Đặt bàn {selectedTable.name}
                            </h3>
                            <button className="modal-close" onClick={() => setShowBookingModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="booking-info">
                                <p><strong>Loại bàn:</strong> {selectedTable.type}</p>
                                <p><strong>Giá:</strong> {selectedTable.price.toLocaleString()}đ/giờ</p>
                                <p><strong>Sức chứa:</strong> {selectedTable.capacity} người</p>
                            </div>

                            <div className="booking-date">
                                <label>
                                    <Calendar size={16} />
                                    Chọn ngày:
                                </label>
                                <input
                                    type="date"
                                    value={selectedDate.toISOString().split('T')[0]}
                                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="booking-time">
                                <label>
                                    <Clock size={16} />
                                    Chọn khung giờ:
                                </label>
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
                                    <AlertCircle size={16} />
                                    Vui lòng <Link to="/login">đăng nhập</Link> để đặt bàn
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowBookingModal(false)}>Hủy</button>
                            <button className="btn-confirm" onClick={handleBooking}>
                                <CheckCircle size={16} />
                                Xác nhận đặt bàn
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== CHAT FLOATING BUTTON ========== */}
            <div className="chat-container">
                {/* Chat Toggle Button */}
                <button
                    className={`chat-toggle ${isChatOpen ? 'active' : ''}`}
                    onClick={() => setIsChatOpen(!isChatOpen)}
                >
                    {isChatOpen ? <X size={24} /> : <MessageCircle size={24} />}
                </button>

                {/* Chat Window */}
                {isChatOpen && (
                    <div className={`chat-window ${isChatMinimized ? 'minimized' : ''}`}>
                        {/* Chat Header */}
                        <div className="chat-header">
                            <div className="chat-header-info">
                                <div className="chat-avatar">
                                    <MessageCircle size={20} />
                                </div>
                                <div>
                                    <h4>Trợ lý ảo</h4>
                                    <span className="chat-status">Đang hoạt động</span>
                                </div>
                            </div>
                            <div className="chat-header-actions">
                                <button
                                    className="chat-minimize"
                                    onClick={() => setIsChatMinimized(!isChatMinimized)}
                                >
                                    {isChatMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                                </button>
                                <button
                                    className="chat-close"
                                    onClick={() => setIsChatOpen(false)}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        {!isChatMinimized && (
                            <>
                                <div className="chat-messages">
                                    {messages.map(msg => (
                                        <div key={msg.id} className={`message ${msg.sender}`}>
                                            <div className="message-content">
                                                <div className="message-text">{msg.text}</div>
                                                <div className="message-time">{msg.time}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="message bot">
                                            <div className="message-content">
                                                <div className="typing-indicator">
                                                    <span></span>
                                                    <span></span>
                                                    <span></span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Quick Questions */}
                                <div className="quick-questions">
                                    {quickQuestions.map((q, index) => (
                                        <button
                                            key={index}
                                            className="quick-question-btn"
                                            onClick={() => handleQuickQuestion(q)}
                                            disabled={isLoading}
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>

                                {/* Chat Input */}
                                <div className="chat-input">
                                    <input
                                        type="text"
                                        placeholder="Nhập tin nhắn..."
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        disabled={isLoading}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!inputMessage.trim() || isLoading}
                                        className="send-btn"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;