// pages/PromotionPage.js - Sửa lại
import React, { useState, useEffect } from 'react';
import { Gift, Calendar, Tag, Clock, ChevronRight } from 'lucide-react';
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
            // Gọi API lấy khuyến mãi đang hoạt động
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
        if (promotion.discountPercent) {
            return `Giảm ${promotion.discountPercent}%`;
        }
        if (promotion.discountAmount) {
            return `Giảm ${promotion.discountAmount.toLocaleString('vi-VN')}đ`;
        }
        // Nếu có discountValue
        if (promotion.discountValue) {
            if (promotion.discountType === 'PERCENTAGE') {
                return `Giảm ${promotion.discountValue}%`;
            }
            return `Giảm ${promotion.discountValue.toLocaleString('vi-VN')}đ`;
        }
        return 'Ưu đãi đặc biệt';
    };

    // Lấy tên khuyến mãi - có thể là name hoặc title
    const getPromotionName = (promotion) => {
        return promotion.name || promotion.title || promotion.promotionName || 'Khuyến mãi';
    };

    // Lấy mô tả khuyến mãi
    const getPromotionDescription = (promotion) => {
        return promotion.description || promotion.promoDescription || 'Ưu đãi hấp dẫn dành cho bạn';
    };

    // Kiểm tra khuyến mãi có đang diễn ra không
    const isPromotionActive = (promotion) => {
        const now = new Date();

        // Nếu có startDate và endDate
        if (promotion.startDate && promotion.endDate) {
            const startDate = new Date(promotion.startDate);
            const endDate = new Date(promotion.endDate);
            return promotion.isActive && now >= startDate && now <= endDate;
        }

        // Nếu chỉ có isActive
        return promotion.isActive === true;
    };

    // Lọc khuyến mãi theo tab
    const filteredPromotions = promotions.filter(promo => {
        if (activeTab === 'active') {
            return isPromotionActive(promo);
        }
        if (activeTab === 'upcoming') {
            // Sắp diễn ra: chưa đến ngày bắt đầu
            if (promo.startDate) {
                const now = new Date();
                const startDate = new Date(promo.startDate);
                return now < startDate && promo.isActive;
            }
            return false;
        }
        return true; // all
    });

    if (loading) {
        return (
            <div className="promotion-page">
                <div className="promotion-hero">
                    <h1>Khuyến mãi & Ưu đãi</h1>
                    <p>Những ưu đãi hấp dẫn dành riêng cho bạn</p>
                </div>
                <div className="loading-spinner">Đang tải ưu đãi...</div>
            </div>
        );
    }

    return (
        <div className="promotion-page">
            <div className="promotion-hero">
                <h1>Khuyến mãi & Ưu đãi</h1>
                <p>Những ưu đãi hấp dẫn dành riêng cho bạn</p>
            </div>

            <div className="promotion-container">
                {/* Tab navigation */}
                <div className="promotion-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        Đang diễn ra
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upcoming')}
                    >
                        Sắp diễn ra
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        Tất cả
                    </button>
                </div>

                {filteredPromotions.length === 0 ? (
                    <div className="empty-promotions">
                        <Gift size={48} style={{ opacity: 0.3 }} />
                        <p>Hiện chưa có chương trình khuyến mãi nào</p>
                        <p style={{ fontSize: '14px', marginTop: '8px' }}>
                            Vui lòng quay lại sau để cập nhật ưu đãi mới nhất
                        </p>
                    </div>
                ) : (
                    <div className="promotions-grid">
                        {filteredPromotions.map(promo => (
                            <div key={promo.id} className="promotion-card">
                                <div className="promotion-badge">
                                    <Tag size={16} />
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
                                                <span className="status-active">● Đang diễn ra</span>
                                            ) : (
                                                <span className="status-upcoming">○ Sắp diễn ra</span>
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
                        <Gift size={32} />
                        <h2>Đặc quyền thành viên</h2>
                    </div>
                    <div className="benefits-grid">
                        <div className="benefit-card">
                            <div className="benefit-icon">🎂</div>
                            <h4>Quà sinh nhật</h4>
                            <p>Nhận ngay voucher 100k vào tháng sinh nhật</p>
                        </div>
                        <div className="benefit-card">
                            <div className="benefit-icon">⭐</div>
                            <h4>Tích điểm thưởng</h4>
                            <p>Tích lũy điểm đổi quà và voucher giảm giá</p>
                        </div>
                        <div className="benefit-card">
                            <div className="benefit-icon">🎁</div>
                            <h4>Quà tặng đặc biệt</h4>
                            <p>Nhận quà tặng khi đạt cấp độ thành viên mới</p>
                        </div>
                        <div className="benefit-card">
                            <div className="benefit-icon">📱</div>
                            <h4>Ưu đãi độc quyền</h4>
                            <p>Nhận thông báo ưu đãi sớm nhất qua app</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromotionPage;