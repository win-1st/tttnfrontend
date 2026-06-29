// pages/PromotionPage.js
import React, { useState, useEffect } from 'react';
import {
    Gift, Calendar, Tag, Clock, ChevronRight,
    Percent, Sparkles, Star, Award, Cake,
    Smartphone, Trophy, Zap, ShoppingBag,
    CheckCircle, Clock as ClockIcon, AlertCircle
} from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import './PromotionPage.css';

const PromotionPage = () => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active');

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get('/promotions/active');
            console.log('Promotions response:', response.data);

            if (response.data?.success) {
                const data = response.data.data || [];
                console.log('Number of promotions:', data.length);
                if (data.length > 0) {
                    console.log('Sample promotion:', data[0]);
                }
                setPromotions(data);
            } else {
                setPromotions([]);
            }
        } catch (err) {
            console.error('Error fetching promotions:', err);
            setPromotions([]);
        } finally {
            setLoading(false);
        }
    };

    // Format ngày tháng
    const formatDate = (dateString) => {
        if (!dateString) return 'Đang cập nhật';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    // Format loại giảm giá - Dựa vào cấu trúc dữ liệu thực tế
    const formatDiscount = (promotion) => {
        // Kiểm tra discountPercentage từ model
        if (promotion.discountPercentage) {
            return `Giảm ${promotion.discountPercentage}%`;
        }
        // Kiểm tra discountAmount từ model
        if (promotion.discountAmount) {
            return `Giảm ${promotion.discountAmount.toLocaleString('vi-VN')}đ`;
        }
        // Kiểm tra discountPercent
        if (promotion.discountPercent) {
            return `Giảm ${promotion.discountPercent}%`;
        }
        // Nếu có discountValue
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

    // Lấy icon cho khuyến mãi
    const getPromotionIcon = (promotion) => {
        const discount = promotion.discountPercentage || promotion.discountPercent || 0;
        if (discount > 0) {
            return <Percent size={20} />;
        }
        if (promotion.discountAmount > 0) {
            return <Gift size={20} />;
        }
        return <Sparkles size={20} />;
    };

    // Kiểm tra khuyến mãi có đang diễn ra không
    const isPromotionActive = (promotion) => {
        const now = new Date();

        if (promotion.startDate && promotion.endDate) {
            const startDate = new Date(promotion.startDate);
            const endDate = new Date(promotion.endDate);
            return promotion.isActive !== false && now >= startDate && now <= endDate;
        }

        return promotion.isActive !== false;
    };

    // Lọc khuyến mãi theo tab
    const filteredPromotions = promotions.filter(promo => {
        if (activeTab === 'active') {
            return isPromotionActive(promo);
        }
        if (activeTab === 'upcoming') {
            if (promo.startDate) {
                const now = new Date();
                const startDate = new Date(promo.startDate);
                return now < startDate && promo.isActive !== false;
            }
            return false;
        }
        return true;
    });

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

    return (
        <div className="promotion-page">
            <div className="promotion-hero">
                <h1>
                    <Tag size={32} className="hero-icon" />
                    Khuyến mãi & Ưu đãi
                </h1>
                <p>Những ưu đãi hấp dẫn dành riêng cho bạn</p>
            </div>

            <div className="promotion-container">
                {/* Tab navigation */}
                <div className="promotion-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        <Zap size={16} />
                        Đang diễn ra
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upcoming')}
                    >
                        <ClockIcon size={16} />
                        Sắp diễn ra
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        <ShoppingBag size={16} />
                        Tất cả
                    </button>
                </div>

                {filteredPromotions.length === 0 ? (
                    <div className="empty-promotions">
                        <Gift size={56} className="empty-icon" />
                        <p className="empty-title">Hiện chưa có chương trình khuyến mãi nào</p>
                        <p className="empty-subtitle">
                            Vui lòng quay lại sau để cập nhật ưu đãi mới nhất
                        </p>
                    </div>
                ) : (
                    <div className="promotions-grid">
                        {filteredPromotions.map(promo => (
                            <div key={promo.id} className="promotion-card">
                                <div className="promotion-badge">
                                    {getPromotionIcon(promo)}
                                    <span>{formatDiscount(promo)}</span>
                                </div>
                                <div className="promotion-content">
                                    <h3>{getPromotionName(promo)}</h3>
                                    <p>{getPromotionDescription(promo)}</p>
                                    <div className="promotion-footer">
                                        <div className="promotion-date">
                                            <Calendar size={14} />
                                            <span>
                                                {promo.startDate && promo.endDate ? (
                                                    `${formatDate(promo.startDate)} - ${formatDate(promo.endDate)}`
                                                ) : (
                                                    'Áp dụng đến khi có thông báo mới'
                                                )}
                                            </span>
                                        </div>
                                        <div className="promotion-status">
                                            {isPromotionActive(promo) ? (
                                                <span className="status-active">
                                                    <CheckCircle size={12} />
                                                    Đang diễn ra
                                                </span>
                                            ) : (
                                                <span className="status-upcoming">
                                                    <ClockIcon size={12} />
                                                    Sắp diễn ra
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Member benefits */}
                <div className="member-benefits">
                    <div className="benefits-header">
                        <Award size={32} className="benefits-icon" />
                        <h2>Đặc quyền thành viên</h2>
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