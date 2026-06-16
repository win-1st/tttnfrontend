// pages/customer/MenuPage.js
import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import './MenuPage.css';

const MenuPage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(['all']);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [promotionProductsMap, setPromotionProductsMap] = useState({});

    // Phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // 10 items per page (2 rows of 5)

    const API_BASE_URL = 'http://localhost:8080';

    useEffect(() => {
        fetchProducts();
        fetchPromotionsWithProducts();
    }, []);

    // Reset về trang 1 khi thay đổi category hoặc search
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, searchTerm]);

    const fetchProducts = async () => {
        try {
            const response = await axiosClient.get('/products/non-time-based');
            console.log('Products response:', response.data);

            if (response.data?.success) {
                const productsData = response.data.data;
                setProducts(productsData);
                const cats = ['all', ...new Set(productsData.map(p => p.category?.name || p.category).filter(Boolean))];
                setCategories(cats);
            }
        } catch (err) {
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPromotionsWithProducts = async () => {
        try {
            const response = await axiosClient.get('/promotions/active');
            const activePromotions = response.data?.data || [];

            const map = {};

            for (const promo of activePromotions) {
                try {
                    const productRes = await axiosClient.get(`/promotions/${promo.id}/products`);
                    const productsInPromo = productRes.data?.data || [];

                    productsInPromo.forEach(product => {
                        if (!map[product.id]) {
                            map[product.id] = [];
                        }
                        map[product.id].push({
                            promotionId: promo.id,
                            promotionName: promo.name,
                            discountType: promo.discountPercentage ? 'percentage' : 'amount',
                            discountValue: promo.discountPercentage || promo.discountAmount
                        });
                    });
                } catch (err) {
                    console.error(`Error fetching products for promotion ${promo.id}:`, err);
                }
            }

            console.log('Promotion products map:', map);
            setPromotionProductsMap(map);
        } catch (err) {
            console.error('Error fetching promotions:', err);
        }
    };

    const getDiscountedPrice = (product) => {
        const originalPrice = product.price || 0;
        const promotions = promotionProductsMap[product.id];

        if (!promotions || promotions.length === 0) {
            return null;
        }

        const promo = promotions[0];
        let discountedPrice = originalPrice;

        if (promo.discountType === 'percentage') {
            discountedPrice = originalPrice * (1 - promo.discountValue / 100);
        } else {
            discountedPrice = Math.max(0, originalPrice - promo.discountValue);
        }

        if (discountedPrice < originalPrice) {
            return {
                discountedPrice: Math.round(discountedPrice),
                discountType: promo.discountType,
                discountValue: promo.discountValue,
                promotionName: promo.promotionName
            };
        }

        return null;
    };

    const getImageUrl = (product) => {
        if (product.imageUrl) {
            if (product.imageUrl.startsWith('http')) {
                return product.imageUrl;
            }
            return `${API_BASE_URL}${product.imageUrl}`;
        }
        if (product.image) {
            if (product.image.startsWith('http')) {
                return product.image;
            }
            return `${API_BASE_URL}${product.image}`;
        }
        return 'https://via.placeholder.com/300x200/1a1a2e/ff6b6b?text=No+Image';
    };

    const filteredProducts = products.filter(product => {
        const matchesCategory = selectedCategory === 'all' || product.category?.name === selectedCategory || product.category === selectedCategory;
        const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Phân trang
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = filteredProducts.slice(startIndex, endIndex);

    const goToPage = (page) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="customer-menu-page">
            <div className="menu-hero">
                <h1>Thực đơn</h1>
                <p>Đa dạng món ăn, thức uống phục vụ mọi nhu cầu</p>
            </div>

            <div className="menu-container">
                <div className="menu-filters">
                    <div className="search-box">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Tìm món ăn, đồ uống..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="category-filters">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat === 'all' ? 'Tất cả' : cat}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="loading">Đang tải...</div>
                ) : (
                    <>
                        <div className="products-grid">
                            {currentProducts.map(product => {
                                const discountInfo = getDiscountedPrice(product);
                                const hasDiscount = !!discountInfo;
                                const displayPrice = hasDiscount ? discountInfo.discountedPrice : (product.price || 0);
                                const originalPrice = product.price || 0;

                                return (
                                    <div key={product.id} className="product-card">
                                        <img
                                            src={getImageUrl(product)}
                                            alt={product.name}
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/300x200/1a1a2e/ff6b6b?text=No+Image';
                                            }}
                                        />
                                        <div className="product-info">
                                            <h3>{product.name}</h3>
                                            <p>{product.description || 'Chưa có mô tả'}</p>
                                            <div className="product-price">
                                                {hasDiscount ? (
                                                    <div className="price-container">
                                                        <span className="original-price">{originalPrice.toLocaleString('vi-VN')}đ</span>
                                                        <span className="discounted-price">{displayPrice.toLocaleString('vi-VN')}đ</span>
                                                        <span className="discount-badge">
                                                            -{discountInfo.discountType === 'percentage'
                                                                ? `${discountInfo.discountValue}%`
                                                                : `${discountInfo.discountValue.toLocaleString('vi-VN')}đ`}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="regular-price">{displayPrice.toLocaleString('vi-VN')}đ</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {filteredProducts.length === 0 ? (
                            <div className="no-results">
                                <p>Không tìm thấy món ăn nào phù hợp.</p>
                            </div>
                        ) : totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="pagination-btn"
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft size={16} />
                                    Trước
                                </button>
                                <div className="page-numbers">
                                    {getPageNumbers().map(page => (
                                        <button
                                            key={page}
                                            className={`page-number ${currentPage === page ? 'active' : ''}`}
                                            onClick={() => goToPage(page)}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    className="pagination-btn"
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Sau
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MenuPage;