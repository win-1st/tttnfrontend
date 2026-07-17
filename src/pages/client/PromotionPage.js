// pages/PromotionPage.js
import React, { useState, useEffect } from 'react';
import {
    Gift, Calendar, Tag, Clock, ChevronRight,
    Percent, Sparkles, Star, Award, Cake,
    Smartphone, Trophy, Zap, ShoppingBag,
    CheckCircle, Clock as ClockIcon, AlertCircle,
    XCircle, Info, RefreshCw
} from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import './PromotionPage.css';

const PromotionPage = () => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        setLoading(true);
        setError(null);
        try {
            // Lấy TẤT CẢ khuyến mãi (bao gồm cả sắp diễn ra và đã kết thúc)
            const response = await axiosClient.get('/promotions');
            console.log('📦 All promotions response:', response.data);

            if (response.data?.success) {
                const data = response.data.data || [];

                // Log chi tiết để debug
                console.log(`📊 Total promotions: ${data.length}`);
                data.forEach((promo, index) => {
                    const status = getPromotionStatus(promo);
                    console.log(`  ${index + 1}. ${promo.name} - ${status.label} (${promo.startDate || 'N/A'} -> ${promo.endDate || 'N/A'})`);
                });

                setPromotions(data);
            } else {
                setPromotions([]);
                setError('Không thể tải danh sách khuyến mãi');
            }
        } catch (err) {
            console.error('❌ Error fetching promotions:', err);
            setError(err.response?.data?.message || 'Lỗi kết nối đến server');
            setPromotions([]);
        } finally {
            setLoading(false);
        }
    };

    // Format ngày tháng
    const formatDate = (dateString) => {
        if (!dateString) return 'Đang cập nhật';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    // Format loại giảm giá
    const formatDiscount = (promotion) => {
        if (promotion.discountPercentage) {
            return `Giảm ${promotion.discountPercentage}%`;
        }
        if (promotion.discountAmount) {
            return `Giảm ${promotion.discountAmount.toLocaleString('vi-VN')}đ`;
        }
        if (promotion.discountPercent) {
            return `Giảm ${promotion.discountPercent}%`;
        }
        if (promotion.discountValue) {
            if (promotion.discountType === 'PERCENTAGE' || promotion.discountType === 'PERCENT') {
                return `Giảm ${promotion.discountValue}%`;
            }
            return `Giảm ${promotion.discountValue.toLocaleString('vi-VN')}đ`;
        }
        return 'Ưu đãi đặc biệt';
    };

    // Lấy tên khuyến mãi
    const getPromotionName = (promotion) => {
        return promotion.name || promotion.title || promotion.promotionName || 'Khuyến mãi';
    };

    // Lấy mô tả khuyến mãi
    const getPromotionDescription = (promotion) => {
        return promotion.description || promotion.promoDescription || 'Ưu đãi hấp dẫn dành cho bạn';
    };

    // Lấy icon cho khuyến mãi dựa trên loại giảm giá
    const getPromotionIcon = (promotion) => {
        if (promotion.discountPercentage || promotion.discountPercent) {
            return <Percent size={20} />;
        }
        if (promotion.discountAmount || promotion.discountValue) {
            return <Gift size={20} />;
        }
        return <Sparkles size={20} />;
    };

    // Kiểm tra trạng thái khuyến mãi CHI TIẾT
    const getPromotionStatus = (promotion) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Nếu không active
        if (promotion.isActive === false) {
            return {
                status: 'inactive',
                label: 'Đã tắt',
                icon: <XCircle size={14} />,
                color: '#ef4444'
            };
        }

        // Kiểm tra startDate
        if (promotion.startDate) {
            const startDate = new Date(promotion.startDate);
            const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

            if (startDay > today) {
                return {
                    status: 'upcoming',
                    label: 'Sắp diễn ra',
                    icon: <ClockIcon size={14} />,
                    color: '#f59e0b'
                };
            }
        }

        // Kiểm tra endDate
        if (promotion.endDate) {
            const endDate = new Date(promotion.endDate);
            const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

            if (endDay < today) {
                return {
                    status: 'expired',
                    label: 'Đã kết thúc',
                    icon: <AlertCircle size={14} />,
                    color: '#6b7280'
                };
            }
        }

        // Đang diễn ra
        return {
            status: 'active',
            label: 'Đang diễn ra',
            icon: <CheckCircle size={14} />,
            color: '#10b981'
        };
    };

    // Kiểm tra khuyến mãi có đang diễn ra không
    const isPromotionActive = (promotion) => {
        const status = getPromotionStatus(promotion);
        return status.status === 'active';
    };

    // Kiểm tra khuyến mãi sắp diễn ra
    const isPromotionUpcoming = (promotion) => {
        const status = getPromotionStatus(promotion);
        return status.status === 'upcoming';
    };

    // Kiểm tra khuyến mãi đã kết thúc
    const isPromotionExpired = (promotion) => {
        const status = getPromotionStatus(promotion);
        return status.status === 'expired' || status.status === 'inactive';
    };

    // Lọc khuyến mãi theo tab
    const filteredPromotions = promotions.filter(promo => {
        // Luôn filter bỏ những promotion có isActive = false
        if (promo.isActive === false) return false;

        if (activeTab === 'active') {
            return isPromotionActive(promo);
        }
        if (activeTab === 'upcoming') {
            return isPromotionUpcoming(promo);
        }
        if (activeTab === 'expired') {
            return isPromotionExpired(promo);
        }
        return true; // 'all'
    });

    // Đếm số lượng theo từng trạng thái
    const counts = {
        active: promotions.filter(p => p.isActive !== false && isPromotionActive(p)).length,
        upcoming: promotions.filter(p => p.isActive !== false && isPromotionUpcoming(p)).length,
        expired: promotions.filter(p => p.isActive !== false && isPromotionExpired(p)).length,
        all: promotions.filter(p => p.isActive !== false).length
    };

    // Benefits data
    const benefits = [
        { icon: <Cake size={28} />, title: 'Quà sinh nhật', desc: 'Nhận ngay voucher 100k vào tháng sinh nhật' },
        { icon: <Star size={28} />, title: 'Tích điểm thưởng', desc: 'Tích lũy điểm đổi quà và voucher giảm giá' },
        { icon: <Gift size={28} />, title: 'Quà tặng đặc biệt', desc: 'Nhận quà tặng khi đạt cấp độ thành viên mới' },
        { icon: <Smartphone size={28} />, title: 'Ưu đãi độc quyền', desc: 'Nhận thông báo ưu đãi sớm nhất qua app' }
    ];

    if (loading) {
        return (
            <div className="promotion-page">
                <div className="promotion-hero">
                    <h1>
                        <Tag size={32} className="hero-icon" />
                        Khuyến mãi & Ưu đãi
                    </h1>
                    <p>Những ưu đãi hấp dẫn dành riêng cho bạn</p>
                </div>
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Đang tải ưu đãi...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="promotion-page">
                <div className="promotion-hero">
                    <h1>
                        <Tag size={32} className="hero-icon" />
                        Khuyến mãi & Ưu đãi
                    </h1>
                    <p>Những ưu đãi hấp dẫn dành riêng cho bạn</p>
                </div>
                <div className="error-state">
                    <AlertCircle size={48} className="error-icon" />
                    <p className="error-title">Không thể tải dữ liệu</p>
                    <p className="error-subtitle">{error}</p>
                    <button className="retry-btn" onClick={fetchPromotions}>
                        <RefreshCw size={16} /> Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="promotion-page">
            {/* Hero Section */}
            <div className="promotion-hero">
                <h1>
                    <Tag size={32} className="hero-icon" />
                    Khuyến mãi & Ưu đãi
                </h1>
                <p>Những ưu đãi hấp dẫn dành riêng cho bạn</p>
            </div>

            <div className="promotion-container">
                {/* Tab navigation với số lượng */}
                <div className="promotion-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        <Zap size={16} />
                        Đang diễn ra
                        {counts.active > 0 && <span className="tab-count">{counts.active}</span>}
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upcoming')}
                    >
                        <ClockIcon size={16} />
                        Sắp diễn ra
                        {counts.upcoming > 0 && <span className="tab-count">{counts.upcoming}</span>}
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'expired' ? 'active' : ''}`}
                        onClick={() => setActiveTab('expired')}
                    >
                        <AlertCircle size={16} />
                        Đã kết thúc
                        {counts.expired > 0 && <span className="tab-count">{counts.expired}</span>}
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        <ShoppingBag size={16} />
                        Tất cả
                        {counts.all > 0 && <span className="tab-count">{counts.all}</span>}
                    </button>
                </div>

                {/* Danh sách khuyến mãi */}
                {filteredPromotions.length === 0 ? (
                    <div className="empty-promotions">
                        <Gift size={56} className="empty-icon" />
                        <p className="empty-title">
                            {activeTab === 'active' && 'Hiện không có khuyến mãi nào đang diễn ra'}
                            {activeTab === 'upcoming' && 'Hiện không có khuyến mãi nào sắp diễn ra'}
                            {activeTab === 'expired' && 'Hiện không có khuyến mãi nào đã kết thúc'}
                            {activeTab === 'all' && 'Hiện chưa có chương trình khuyến mãi nào'}
                        </p>
                        <p className="empty-subtitle">
                            Vui lòng quay lại sau để cập nhật ưu đãi mới nhất
                        </p>
                    </div>
                ) : (
                    <div className="promotions-grid">
                        {filteredPromotions.map(promo => {
                            const status = getPromotionStatus(promo);
                            const isActive = status.status === 'active';
                            const isUpcoming = status.status === 'upcoming';
                            const isExpired = status.status === 'expired' || status.status === 'inactive';

                            return (
                                <div
                                    key={promo.id}
                                    className={`promotion-card ${status.status}`}
                                >
                                    {/* Badge giảm giá */}
                                    <div className="promotion-badge" style={{
                                        background: isActive ? '#10b981' :
                                            isUpcoming ? '#f59e0b' :
                                                '#6b7280'
                                    }}>
                                        {getPromotionIcon(promo)}
                                        <span>{formatDiscount(promo)}</span>
                                    </div>

                                    {/* Nội dung */}
                                    <div className="promotion-content">
                                        <h3>{getPromotionName(promo)}</h3>
                                        <p>{getPromotionDescription(promo)}</p>

                                        {/* Thời gian */}
                                        <div className="promotion-footer">
                                            <div className="promotion-date">
                                                <Calendar size={14} />
                                                <span>
                                                    {promo.startDate && promo.endDate ? (
                                                        `${formatDate(promo.startDate)} - ${formatDate(promo.endDate)}`
                                                    ) : promo.startDate ? (
                                                        `Bắt đầu: ${formatDate(promo.startDate)}`
                                                    ) : promo.endDate ? (
                                                        `Đến: ${formatDate(promo.endDate)}`
                                                    ) : (
                                                        'Áp dụng đến khi có thông báo mới'
                                                    )}
                                                </span>
                                            </div>

                                            {/* Trạng thái */}
                                            <div className="promotion-status">
                                                <span
                                                    className={`status-${status.status}`}
                                                    style={{ color: status.color }}
                                                >
                                                    {status.icon}
                                                    {status.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Hiển thị thời gian còn lại (chỉ cho đang diễn ra) */}
                                        {isActive && promo.endDate && (
                                            <div className="promotion-remaining">
                                                <ClockIcon size={12} />
                                                <span>
                                                    Còn {Math.ceil((new Date(promo.endDate) - new Date()) / (1000 * 60 * 60 * 24))} ngày
                                                </span>
                                            </div>
                                        )}

                                        {/* Hiển thị thời gian còn lại đến khi bắt đầu (cho sắp diễn ra) */}
                                        {isUpcoming && promo.startDate && (
                                            <div className="promotion-remaining upcoming">
                                                <ClockIcon size={12} />
                                                <span>
                                                    Còn {Math.ceil((new Date(promo.startDate) - new Date()) / (1000 * 60 * 60 * 24))} ngày nữa
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Member benefits */}
                <div className="member-benefits">
                    <div className="benefits-header">
                        <Award size={32} className="benefits-icon" />
                        <h2>Đặc quyền thành viên</h2>
                        <p>Trở thành thành viên để nhận nhiều ưu đãi hấp dẫn</p>
                    </div>
                    <div className="benefits-grid">
                        {benefits.map((benefit, index) => (
                            <div key={index} className="benefit-card">
                                <div className="benefit-icon-wrapper">
                                    {benefit.icon}
                                </div>
                                <h4>{benefit.title}</h4>
                                <p>{benefit.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromotionPage;