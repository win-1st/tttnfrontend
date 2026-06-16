import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    ShoppingCart,
    Users,
    Plus,
    Minus,
    Trash2,
    Printer,
    Clock,
    CheckCircle,
    XCircle,
    Search,
    Package,
    Timer,
    DollarSign,
    Percent,
    Gift,
    Phone,
    User,
    Award,
    Tag,
    X,
    Edit3,
    Save,
    RotateCcw,
    CreditCard,
    Check,
    AlertCircle,
    Info,
    Play,
    StopCircle,
    ShoppingBag,
    AlertTriangle,
    ChevronDown,
    Calendar,
    Hash,
    MapPin,
    UserCheck,

    Coffee,
    Grid,

    RefreshCw,

} from "lucide-react";
import axiosClient from "../../../services/axiosClient";

import PaymentMethodModal from "./PaymentMethodModal";
import ToastNotification from "./ToastNotification";
import CashPaymentModal from "./CashPaymentModal";

import styles from "./TableDetail.module.css";

const API_BASE_URL = "http://localhost:8080";

const TableDetail = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();

    const [entity, setEntity] = useState(null);
    const [loadingEntity, setLoadingEntity] = useState(true);
    const [cart, setCart] = useState([]);
    const [order, setOrder] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeTab, setActiveTab] = useState("Tất cả");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [customerName, setCustomerName] = useState("");
    const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
    const [showCashModal, setShowCashModal] = useState(false);
    const [showTimeAdjustModal, setShowTimeAdjustModal] = useState(false);
    const [adjustMinutes, setAdjustMinutes] = useState(0);
    const [toasts, setToasts] = useState([]);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [isFinishing, setIsFinishing] = useState(false);
    const [isAdjustingTime, setIsAdjustingTime] = useState(false);
    const [currentTableFee, setCurrentTableFee] = useState(0);
    const [currentTotal, setCurrentTotal] = useState(0);
    const [tick, setTick] = useState(0);
    const [customerPhone, setCustomerPhone] = useState("");
    const [promotions, setPromotions] = useState([]);
    const [selectedPromotion, setSelectedPromotion] = useState(null);
    const [showPromoModal, setShowPromoModal] = useState(false);
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = userData.role?.name || userData.role;
    const canAdjustTime = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'STAFF';
    const [showCartMenu, setShowCartMenu] = useState(false);
    const [customerInfo, setCustomerInfo] = useState(null);
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
    const [promotionProductsMap, setPromotionProductsMap] = useState({});

    // Fetch tất cả khuyến mãi đang hoạt động và sản phẩm của chúng
    const fetchPromotionsWithProducts = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) return;

            console.log("=== FETCH PROMOTIONS WITH PRODUCTS ===");

            // Lấy tất cả khuyến mãi đang hoạt động
            const response = await axiosClient.get('/promotions/active');
            const activePromotions = response.data?.data || [];
            console.log("Active promotions:", activePromotions);

            const map = {};

            // Với mỗi khuyến mãi, lấy danh sách sản phẩm
            for (const promo of activePromotions) {
                console.log(`Fetching products for promotion ${promo.id} - ${promo.name}`);
                const productRes = await axiosClient.get(`/promotions/${promo.id}/products`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const products = productRes.data?.data || [];
                console.log(`Products in promotion ${promo.name}:`, products);

                // Lưu thông tin giảm giá cho từng sản phẩm
                products.forEach(product => {
                    if (!map[product.id]) {
                        map[product.id] = [];
                    }
                    map[product.id].push({
                        promotionId: promo.id,
                        promotionName: promo.name,
                        discountType: promo.discountPercentage ? 'percentage' : 'amount',
                        discountValue: promo.discountPercentage || promo.discountAmount,
                        isActive: promo.isActive
                    });
                });
            }

            console.log("Final promotionProductsMap:", map);
            setPromotionProductsMap(map);
        } catch (err) {
            console.error("Lỗi tải khuyến mãi sản phẩm:", err);
        }
    }, []);

    const searchCustomerByPhone = useCallback(async (phone) => {
        if (!phone || phone.length < 10) {
            setCustomerInfo(null);
            return;
        }

        setIsSearchingCustomer(true);
        try {
            const response = await axiosClient.get(`/customer-points/${phone}`);
            if (response.data?.success) {
                setCustomerInfo(response.data.data);
                showToast(`Tìm thấy khách hàng: ${response.data.data.fullName || response.data.data.name} - Điểm: ${response.data.data.points}`, "success", 2000);
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setCustomerInfo(null);
                showToast("Số điện thoại chưa được đăng ký. Điểm sẽ được tích khi đăng ký lần đầu!", "info", 3000);
            } else {
                console.error("Lỗi tìm khách hàng:", err);
            }
        } finally {
            setIsSearchingCustomer(false);
        }
    }, []);

    // Hàm tích điểm khi thanh toán (gọi thêm API cộng điểm)
    const addPointsForCustomer = async (phone, totalAmount) => {
        try {
            // Tính điểm: ví dụ 1000đ = 1 điểm
            const pointsToAdd = Math.floor(totalAmount / 1000);

            if (pointsToAdd > 0) {
                await axiosClient.post('/customer-points/add-points', {
                    phone: phone,
                    points: pointsToAdd
                });
                showToast(`Đã cộng ${pointsToAdd} điểm cho khách hàng!`, "success", 2000);
            }
        } catch (err) {
            console.error("Lỗi cộng điểm:", err);
        }
    };
    // =========================
    // HELPER FUNCTIONS
    // =========================
    const handleCartMenuToggle = () => {
        setShowCartMenu(!showCartMenu);
    };

    const handleCloseCartMenu = () => {
        setShowCartMenu(false);
    };
    const getToken = () => localStorage.getItem("token");

    const isTokenValid = () => {
        const token = getToken();
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp * 1000;
            return Date.now() < exp;
        } catch (e) {
            return false;
        }
    };

    const checkAuthAndRedirect = () => {
        if (!getToken() || !isTokenValid()) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            showToast("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại", "error");
            setTimeout(() => navigate('/login'), 1500);
            return false;
        }
        return true;
    };

    // =========================
    // TIME FORMATTING
    // =========================

    const getDetailedPlayTime = useCallback((startTime, endTime = null) => {
        if (!startTime) return { text: "0 giây", seconds: 0 };
        const start = new Date(startTime);
        const end = endTime ? new Date(endTime) : new Date();
        const diffSeconds = Math.floor((end - start) / 1000);
        if (diffSeconds <= 0) return { text: "0 giây", seconds: 0 };
        const hours = Math.floor(diffSeconds / 3600);
        const minutes = Math.floor((diffSeconds % 3600) / 60);
        const seconds = diffSeconds % 60;
        let text = "";
        if (hours > 0) text += `${hours} giờ `;
        if (minutes > 0 || hours > 0) text += `${minutes} phút `;
        text += `${seconds} giây`;
        return { text, seconds: diffSeconds };
    }, []);

    const getElapsedTime = useCallback((startTime) => {
        if (!startTime) return null;
        const start = new Date(startTime);
        const now = new Date();
        const diffMs = now - start;
        if (diffMs < 0) return null;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        if (diffHours > 0) return `${diffHours} giờ ${diffMinutes} phút`;
        if (diffMinutes > 0) return `${diffMinutes} phút ${diffSeconds} giây`;
        return `${diffSeconds} giây`;
    }, []);

    const calculateCurrentTableFee = useCallback(() => {
        if (!order?.startTime || !order?.timeBasedProduct) return 0;
        if (order.status === "WAITING_PAYMENT" || order.status === "PAID") {
            return order.tableFee || 0;
        }
        const start = new Date(order.startTime);
        const now = new Date();
        const diffSeconds = Math.floor((now - start) / 1000);
        let minutes = Math.floor(diffSeconds / 60);
        if (diffSeconds % 60 > 0) minutes++;
        if (minutes <= 0) minutes = 1;
        const pricePerMinute = order.timeBasedProduct.pricePerMinute || 666;
        return minutes * pricePerMinute;
    }, [order?.startTime, order?.timeBasedProduct, order?.status, order?.tableFee]);

    // =========================
    // TOAST
    // =========================

    const showToast = useCallback((message, type = "info", duration = 2000) => {
        const id = Date.now();
        console.log(`Adding toast: "${message}", id: ${id}, duration: ${duration}ms`);

        setToasts((prev) => [...prev, { id, message, type, duration }]);

        // Tự động xóa toast sau duration (QUAN TRỌNG)
        setTimeout(() => {
            console.log(`Auto removing toast: ${id}`);
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, duration);
    }, []);

    const removeToast = (id) => {
        console.log("Removing toast with id:", id);
        setToasts((prev) => {
            console.log("Previous toasts:", prev.length);
            const newToasts = prev.filter((toast) => toast.id !== id);
            console.log("New toasts:", newToasts.length);
            return newToasts;
        });
    };
    // =========================
    // FETCH TABLE INFO
    // =========================

    useEffect(() => {
        const loadTable = async () => {
            if (state?.table) {
                setEntity(state.table);
                setLoadingEntity(false);
                return;
            }
            if (id) {
                try {
                    const response = await axiosClient.get(`/tables/${id}`);
                    setEntity(response.data);
                } catch (error) {
                    showToast("Không tìm thấy thông tin bàn", "error");
                    setTimeout(() => navigate('/cashier/tables'), 1500);
                } finally {
                    setLoadingEntity(false);
                }
            } else {
                setLoadingEntity(false);
                navigate('/cashier/tables');
            }
        };
        loadTable();
    }, [id, state, navigate, showToast]);

    // =========================
    // FETCH PRODUCTS
    // =========================

    const fetchProducts = useCallback(async () => {
        if (!checkAuthAndRedirect()) return;
        try {
            setLoading(true);
            const response = await axiosClient.get('/products');
            const productsData = response.data.data || response.data;
            const activeProducts = productsData.filter(p => p.active !== false);
            setProducts(activeProducts);
            const cats = ["Tất cả", ...new Set(activeProducts.map(p => p.category?.name).filter(Boolean))];
            setCategories(cats);
        } catch (err) {
            showToast("Không thể tải danh sách sản phẩm", "error");
        } finally {
            setLoading(false);
        }
    }, [navigate, showToast]);

    // =========================
    // FETCH ACTIVE ORDER & CART
    // =========================

    const fetchActiveOrder = useCallback(async () => {
        if (!entity?.id) return;
        if (!getToken() || !isTokenValid()) return;
        try {
            const response = await axiosClient.get(`/orders/table/${entity.id}`);
            const orderData = response.data;
            setOrder(orderData && orderData.id ? orderData : null);

            if (orderData && orderData.id && orderData.items) {
                const itemsFromDB = orderData.items
                    .map((item) => ({
                        id: item.product?.id || item.id,
                        name: item.product?.name || item.name,
                        price: item.unitPrice || item.price || 0,
                        quantity: item.quantity || 0,
                        productTypeCode: item.product?.productTypeCode || "FOOD",
                        isTimeBased: item.product?.productTypeCode === "TIME_BASED",
                        pricePerMinute: item.product?.pricePerMinute,
                        orderItemId: item.id
                    }));
                setCart(itemsFromDB);
            } else {
                setCart([]);
            }
        } catch (err) {
            setOrder(null);
            setCart([]);
        }
    }, [entity?.id]);

    const fetchPromotions = useCallback(async () => {
        try {
            const res = await axiosClient.get('/promotions/active');
            setPromotions(res.data?.data || []);
        } catch (err) {
            console.error('Lỗi tải KM:', err);
        }
    }, []);

    const calculateDiscountedPrice = (product, originalPrice) => {
        const promotions = promotionProductsMap[product.id];

        console.log(`=== Tính giá cho sản phẩm ${product.id} - ${product.name} ===`);
        console.log(`Original price: ${originalPrice}`);
        console.log(`Promotions mapping:`, promotions);

        if (!promotions || promotions.length === 0) {
            console.log(`❌ Không có khuyến mãi cho sản phẩm này`);
            return originalPrice;
        }

        const promo = promotions[0];
        console.log(`✅ Áp dụng khuyến mãi: ${promo.promotionName}`);
        console.log(`Loại giảm: ${promo.discountType === 'percentage' ? 'Giảm %' : 'Giảm tiền'}`);
        console.log(`Giá trị giảm: ${promo.discountValue}`);

        let discountedPrice;
        if (promo.discountType === 'percentage') {
            discountedPrice = originalPrice * (1 - promo.discountValue / 100);
            console.log(`Giảm ${promo.discountValue}%: ${originalPrice} -> ${discountedPrice}`);
        } else {
            discountedPrice = Math.max(0, originalPrice - promo.discountValue);
            console.log(`Giảm ${promo.discountValue}đ: ${originalPrice} -> ${discountedPrice}`);
        }

        return discountedPrice;
    };
    const getDiscountedPriceForProduct = (product) => {
        const originalPrice = product.productTypeCode === "TIME_BASED"
            ? product.pricePerMinute || 0
            : product.price || 0;

        const promotions = promotionProductsMap[product.id];
        if (!promotions || promotions.length === 0) return null;

        const promo = promotions[0];
        let discountedPrice = originalPrice;

        if (promo.discountType === 'percentage') {
            discountedPrice = originalPrice * (1 - promo.discountValue / 100);
        } else {
            discountedPrice = Math.max(0, originalPrice - promo.discountValue);
        }

        return {
            discountedPrice: Math.round(discountedPrice),
            originalPrice: originalPrice,
            discountValue: promo.discountValue,
            discountType: promo.discountType,
            promotionName: promo.promotionName
        };
    };
    useEffect(() => {
        if (!entity?.id) return;
        if (!checkAuthAndRedirect()) return;
        fetchProducts();
        fetchActiveOrder();
        fetchPromotions();
        fetchPromotionsWithProducts();
    }, [entity?.id, fetchProducts, fetchActiveOrder, fetchPromotions, fetchPromotionsWithProducts]);
    // =========================
    // FORCE RE-RENDER MỖI GIÂY (REALTIME)
    // =========================

    useEffect(() => {
        const interval = setInterval(() => {
            setTick(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // =========================
    // TOTALS
    // =========================

    const cartTotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
    }, [cart]);

    const cartTotalItems = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }, [cart]);

    const orderFoodTotal = useMemo(() => {
        if (!order?.items) return 0;
        return order.items
            .filter(item => !item.product?.isTimeBased)
            .reduce((sum, item) => sum + (item.unitPrice || 0) * item.quantity, 0);
    }, [order?.items]);

    const orderTotalItems = useMemo(() => {
        if (!order?.items) return 0;
        return order.items.reduce((sum, item) => sum + item.quantity, 0);
    }, [order?.items]);

    // Real-time clock update
    useEffect(() => {
        let interval = null;

        const updateFee = () => {
            if (order && order.timeBasedProduct && order.startTime && order.status === "OPEN") {
                const fee = calculateCurrentTableFee();
                setCurrentTableFee(fee);
                setCurrentTotal(orderFoodTotal + fee);
            }
        };

        if (order && order.timeBasedProduct && order.startTime && order.status === "OPEN") {
            updateFee();
            interval = setInterval(updateFee, 1000);
        } else if (order?.status === "WAITING_PAYMENT" || order?.status === "PAID") {
            setCurrentTableFee(order?.tableFee || 0);
            setCurrentTotal(order?.totalAmount || orderFoodTotal);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [order?.id, order?.status, order?.timeBasedProduct, order?.startTime, orderFoodTotal, calculateCurrentTableFee, tick]);

    const orderDisplayTotal = useMemo(() => {
        if (order?.totalAmount && order.totalAmount > 0) return order.totalAmount;
        if (order?.status === "OPEN" && order?.timeBasedProduct && order?.startTime) return currentTotal;
        if (order?.status === "OPEN") return orderFoodTotal;
        return orderFoodTotal;
    }, [order, currentTotal, orderFoodTotal, tick]);

    // =========================
    // CART FUNCTIONS - LOCAL ONLY
    // =========================

    const addToCart = (product) => {
        if (order?.status === "PAID") {
            showToast("Đơn hàng đã thanh toán, không thể thêm món", "warning");
            return;
        }
        if (order?.status === "WAITING_PAYMENT") {
            showToast("Bàn đã kết thúc chơi, không thể thêm món!", "warning");
            return;
        }

        if (product.productTypeCode === "TIME_BASED") {
            if (cart.some(item => item.isTimeBased)) {
                showToast("Đã có dịch vụ tính giờ trong giỏ!", "warning");
                return;
            }
            if (order?.timeBasedProduct) {
                showToast("Bàn đã có dịch vụ tính giờ!", "warning");
                return;
            }
        }

        // Giá gốc
        const originalPrice = product.productTypeCode === "TIME_BASED"
            ? product.pricePerMinute || 0
            : product.price || 0;

        // 🆕 Tính giá sau khuyến mãi
        const discountedPrice = calculateDiscountedPrice(product, originalPrice);

        // Hiển thị thông báo nếu có giảm giá
        const hasDiscount = discountedPrice < originalPrice;
        if (hasDiscount) {
            const promotions = promotionProductsMap[product.id];
            const promoName = promotions?.[0]?.promotionName || 'Khuyến mãi';
            const savedAmount = originalPrice - discountedPrice;
            showToast(`🎉 ${product.name} được giảm ${savedAmount.toLocaleString("vi-VN")}đ (${promoName})`, "success", 2000);
        }

        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);

            if (existing) {
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, {
                id: product.id,
                name: product.name,
                price: discountedPrice, // 🆕 Giá sau khuyến mãi
                originalPrice: originalPrice, // 🆕 Lưu giá gốc để hiển thị
                discountApplied: hasDiscount,
                quantity: 1,
                productTypeCode: product.productTypeCode,
                isTimeBased: product.productTypeCode === "TIME_BASED",
                pricePerMinute: product.pricePerMinute,
                image: product.imageUrl
            }];
        });
    };

    const updateQuantity = (id, delta) => {
        if (order?.status === "PAID" || order?.status === "WAITING_PAYMENT") return;

        setCart(prev =>
            prev
                .map(item => {
                    if (item.id === id) {
                        const newQty = item.quantity + delta;
                        return newQty > 0 ? { ...item, quantity: newQty } : null;
                    }
                    return item;
                })
                .filter(Boolean)
        );
    };

    const removeFromCart = (id) => {
        if (order?.status === "PAID" || order?.status === "WAITING_PAYMENT") return;
        setCart(prev => prev.filter(item => item.id !== id));
        showToast("Đã xóa món khỏi giỏ", "info", 1000);
    };

    // =========================
    // CREATE NEW ORDER
    // =========================

    const handleConfirmOrder = async () => {
        if (!checkAuthAndRedirect()) return;

        if (cart.length === 0) {
            showToast("Vui lòng chọn món trước khi tạo đơn!", "warning");
            return;
        }

        const timeBasedItems = cart.filter(item => item.isTimeBased);
        if (timeBasedItems.length > 1) {
            showToast("Chỉ được chọn 1 dịch vụ tính giờ!", "warning");
            return;
        }

        try {
            setIsConfirming(true);

            const createResponse = await axiosClient.post(`/orders/open-table/${entity.id}`, {});
            const newOrder = createResponse.data;

            // 🆕 Phân biệt TIME_BASED và FOOD/DRINK
            for (const item of cart) {
                if (item.isTimeBased) {
                    // TIME_BASED: KHÔNG gửi unitPrice
                    await axiosClient.post(`/orders/${newOrder.id}/items`, null, {
                        params: {
                            productId: item.id,
                            quantity: item.quantity
                            // KHÔNG có unitPrice
                        }
                    });
                } else {
                    // FOOD/DRINK: Gửi unitPrice là giá đã giảm
                    await axiosClient.post(`/orders/${newOrder.id}/items`, null, {
                        params: {
                            productId: item.id,
                            quantity: item.quantity,
                            unitPrice: item.price
                        }
                    });
                }
            }

            await axiosClient.patch(`/tables/${entity.id}/status`, null, {
                params: { status: "OCCUPIED" }
            });

            await fetchActiveOrder();
            showToast("Tạo đơn hàng thành công!", "success");

        } catch (err) {
            console.error("Lỗi tạo đơn:", err);
            showToast(err.response?.data?.message || "Không thể tạo đơn hàng", "error");
        } finally {
            setIsConfirming(false);
        }
    };

    // =========================
    // UPDATE EXISTING ORDER
    // =========================

    const handleUpdateOrder = async () => {
        if (!order) {
            showToast("Không có đơn hàng để cập nhật", "warning");
            return;
        }

        const timeBasedInCart = cart.find(item => item.isTimeBased);

        // 🆕 Thêm TIME_BASED mới (nếu chưa có)
        if (timeBasedInCart && !order.timeBasedProduct) {
            try {
                setIsConfirming(true);
                // KHÔNG gửi unitPrice
                await axiosClient.post(`/orders/${order.id}/items`, null, {
                    params: {
                        productId: timeBasedInCart.id,
                        quantity: 1
                        // KHÔNG có unitPrice
                    }
                });

                setCart(prev => prev.filter(item => !item.isTimeBased));

                await fetchActiveOrder();
                showToast(`Đã thêm dịch vụ tính giờ vào đơn! Bắt đầu tính giờ.`, "success");
                return;
            } catch (err) {
                showToast(err.response?.data?.message || "Không thể thêm dịch vụ tính giờ", "error");
                setIsConfirming(false);
                return;
            }
        }

        // ========== XỬ LÝ FOOD/DRINK ==========
        const currentCartMap = new Map();
        cart.filter(item => !item.isTimeBased).forEach(item => {
            currentCartMap.set(item.id, item.quantity);
        });

        const dbItemsMap = new Map();
        (order.items || []).forEach(item => {
            const productId = item.product?.id;
            if (productId && item.product?.productTypeCode !== "TIME_BASED") {
                dbItemsMap.set(productId, {
                    quantity: item.quantity,
                    orderItemId: item.id,
                    currentPrice: item.unitPrice || item.price
                });
            }
        });

        let hasChanges = false;
        for (const [productId, cartQty] of currentCartMap) {
            const dbItem = dbItemsMap.get(productId);
            if (!dbItem || dbItem.quantity !== cartQty) {
                hasChanges = true;
                break;
            }
        }
        if (!hasChanges) {
            for (const [productId] of dbItemsMap) {
                if (!currentCartMap.has(productId)) {
                    hasChanges = true;
                    break;
                }
            }
        }

        if (!hasChanges) {
            showToast("Không có thay đổi để cập nhật", "info", 2000);
            return;
        }

        try {
            setIsConfirming(true);
            const existingItemsMap = new Map();
            (order.items || []).forEach((item) => {
                const productId = item.product?.id;
                if (productId && item.product?.productTypeCode !== "TIME_BASED") {
                    existingItemsMap.set(productId, {
                        quantity: item.quantity,
                        orderItemId: item.id
                    });
                }
            });

            // Thêm mới hoặc cập nhật FOOD/DRINK với unitPrice
            for (const item of cart.filter(item => !item.isTimeBased)) {
                const existing = existingItemsMap.get(item.id);
                const cartItem = cart.find(c => c.id === item.id);

                if (!existing) {
                    // Thêm mới với unitPrice
                    await axiosClient.post(`/orders/${order.id}/items`, null, {
                        params: {
                            productId: item.id,
                            quantity: item.quantity,
                            unitPrice: cartItem?.price || item.price
                        }
                    });
                } else if (existing.quantity !== item.quantity) {
                    // Cập nhật số lượng - gửi unitPrice
                    await axiosClient.put(`/orders/${order.id}/items/${existing.orderItemId}`, null, {
                        params: {
                            quantity: item.quantity,
                            unitPrice: cartItem?.price || item.price
                        }
                    });
                }
                existingItemsMap.delete(item.id);
            }

            // Xóa các item không còn trong cart
            for (const [productId, existing] of existingItemsMap) {
                await axiosClient.delete(`/orders/${order.id}/items/${existing.orderItemId}`);
            }

            await fetchActiveOrder();
            showToast("Đã cập nhật đơn hàng!", "success");
        } catch (err) {
            console.error("Lỗi cập nhật:", err);
            showToast(err.response?.data?.message || "Không thể cập nhật đơn hàng", "error");
        } finally {
            setIsConfirming(false);
        }
    };

    // =========================
    // ORDER ACTIONS
    // =========================

    const handleFinishPlaying = async () => {
        if (!order?.id) return;
        setIsFinishing(true);
        try {
            await axiosClient.patch(`/orders/${order.id}/finish`, {});
            await fetchActiveOrder();
            showToast("Đã kết thúc chơi, chờ thanh toán", "success");
        } catch (err) {
            showToast(err.response?.data?.message || "Không thể kết thúc", "error");
        } finally {
            setIsFinishing(false);
        }
    };

    const handleAdjustTime = async () => {
        if (!order?.id || adjustMinutes === 0) return;
        setIsAdjustingTime(true);
        try {
            await axiosClient.patch(`/orders/${order.id}/adjust-time`, null, {
                params: { additionalMinutes: adjustMinutes }
            });
            await fetchActiveOrder();
            showToast(`Đã điều chỉnh ${Math.abs(adjustMinutes)} phút`, "success");
            setShowTimeAdjustModal(false);
            setAdjustMinutes(0);
        } catch (err) {
            showToast(err.response?.data?.message || "Lỗi điều chỉnh", "error");
        } finally {
            setIsAdjustingTime(false);
        }
    };

    const handleCompletePayment = async (orderId, paymentMethod = "CASH") => {
        if (!checkAuthAndRedirect()) return;
        try {
            setIsPaying(true);

            if (order?.status === "OPEN") {
                await axiosClient.patch(`/orders/${order.id}/finish`, {});
            }

            // Include promotion info in payment
            const paymentParams = { orderId, method: paymentMethod };

            // 🆕 Gửi promotionId nếu có chọn khuyến mãi
            if (selectedPromotion) {
                paymentParams.promotionId = selectedPromotion.id;
                console.log("Sending promotionId:", selectedPromotion.id);
            }

            if (customerPhone) {
                paymentParams.customerPhone = customerPhone;
            }

            const response = await axiosClient.post(`/bills/create`, null, {
                params: paymentParams
            });

            console.log("Payment response:", response.data);

            // Tích điểm cho khách hàng nếu có số điện thoại
            if (customerPhone && finalTotal > 0) {
                await addPointsForCustomer(customerPhone, finalTotal);
            }

            setOrder(null);
            setCart([]);
            setSelectedPromotion(null);
            setCustomerPhone("");
            setCustomerInfo(null);
            showToast("Thanh toán thành công!", "success");
            setTimeout(() => navigate("/cashier/tables"), 1500);
        } catch (err) {
            console.error("Lỗi thanh toán:", err);
            showToast(err.response?.data?.message || "Lỗi thanh toán", "error");
        } finally {
            setIsPaying(false);
        }
    };

    // =========================
    // PRINT BILL
    // =========================

    const printBill = () => {
        if (!order) {
            showToast("Không có đơn hàng để in", "warning");
            return;
        }
        const foodItems = order.items?.filter(item => !item.product?.isTimeBased) || [];
        const formatPrice = (price) => price ? price.toLocaleString('vi-VN') + 'đ' : '0đ';
        const currentPlayTimeObj = order?.timeBasedProduct && order?.startTime
            ? getDetailedPlayTime(order.startTime, order.status === "WAITING_PAYMENT" ? order.endTime : null)
            : { text: "0 giây", seconds: 0 };

        const billHTML = `<!DOCTYPE html>
        <html><head><meta charset="UTF-8"><title>Hóa đơn - Bàn ${entity?.number}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px; width: 300px; margin: 0 auto; }
            .bill-container { border: 1px solid #000; padding: 15px; }
            .header { text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .items-table { width: 100%; margin: 10px 0; border-collapse: collapse; }
            .items-table th, .items-table td { border-bottom: 1px dotted #ccc; padding: 5px 0; text-align: left; }
            .items-table td:last-child { text-align: right; }
            .total-line { display: flex; justify-content: space-between; margin: 5px 0; font-weight: bold; }
            .grand-total { font-size: 14px; font-weight: bold; border-top: 2px solid #000; margin-top: 10px; padding-top: 10px; }
            .footer { text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #000; font-size: 10px; }
            .time-played { margin: 10px 0; padding: 5px; background: #f5f5f5; text-align: center; }
        </style></head>
        <body>
            <div class="bill-container">
                <div class="header"><h2>BIDA HOUSE</h2><p>123 Đường ABC, TP.HCM</p><p>Tel: 0123 456 789</p></div>
                <div class="info-row"><span>Bàn số:</span><span><strong>${entity?.number}</strong></span></div>
                <div class="info-row"><span>Ngày giờ:</span><span>${new Date().toLocaleString('vi-VN')}</span></div>
                <div class="info-row"><span>Nhân viên:</span><span>${userData.fullName || userData.username || 'Nhân viên'}</span></div>
                ${customerName ? `<div class="info-row"><span>Khách hàng:</span><span>${customerName}</span></div>` : ''}
                <div>--------------------------------</div>
                ${order?.timeBasedProduct ? `<div class="time-played"><strong>DỊCH VỤ TÍNH GIỜ</strong><div>Thời gian chơi: ${currentPlayTimeObj.text}</div></div><div>--------------------------------</div>` : ''}
                <table class="items-table"><thead><tr><th>Tên sản phẩm</th><th>SL</th><th>Thành tiền</th></tr></thead>
                <tbody>${foodItems.map(item => `<tr><td>${item.product?.name}</td><td style="text-align:center">x${item.quantity}</td><td>${formatPrice((item.unitPrice || 0) * item.quantity)}</td></tr>`).join('')}</tbody>
                </table>
                <div>--------------------------------</div>
                ${order?.timeBasedProduct ? `<div class="total-line"><span>Tiền giờ:</span><span>${formatPrice(order?.status === "OPEN" ? currentTableFee : (order?.tableFee || 0))}</span></div>` : ''}
                <div class="total-line"><span>Tiền món:</span><span>${formatPrice(orderFoodTotal)}</span></div>
                ${selectedPromotion ? `<div class="total-line"><span>Khuyến mãi (${selectedPromotion.name}):</span><span>-${formatPrice(selectedPromotion.discountPercentage ? (orderDisplayTotal * selectedPromotion.discountPercentage / 100) : (selectedPromotion.discountAmount || 0))}</span></div>` : ''}
                <div class="grand-total"><div class="total-line"><span>TỔNG CỘNG:</span><span>${formatPrice(order?.status === "OPEN" ? currentTotal : (order?.totalAmount || orderFoodTotal))}</span></div></div>
                <div class="footer"><p>Cảm ơn quý khách! Hẹn gặp lại!</p></div>
            </div>
            <script>window.onload = function() { window.print(); setTimeout(() => window.close(), 500); }</script>
        </body>
        </html>`;
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        printWindow.document.write(billHTML);
        printWindow.document.close();
    };

    // =========================
    // FILTERED PRODUCTS
    // =========================

    const filteredProducts = useMemo(() => {
        return products
            .filter(p => activeTab === "Tất cả" ? true : p.category?.name === activeTab)
            .filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [products, activeTab, searchTerm]);

    const currentPlayTime = order?.timeBasedProduct && order?.startTime
        ? getDetailedPlayTime(order.startTime, order.status === "WAITING_PAYMENT" ? order.endTime : null)
        : { text: "0 giây", seconds: 0 };

    const elapsedTime = getElapsedTime(order?.createdAt);
    const hasActiveOrder = order && (order.status === "OPEN" || order.status === "WAITING_PAYMENT");
    const isNewOrder = !order;
    const canEdit = order && order.status === "OPEN";
    const canPay = order?.status === "WAITING_PAYMENT";
    const canPrint = order?.status === "WAITING_PAYMENT";

    if (loadingEntity) return <div className={styles.container}><div className={styles.loading}><RefreshCw className={styles.spinIcon} size={24} /> Đang tải...</div></div>;
    if (!entity) return <div className={styles.container}><div className={styles.error}><AlertCircle size={24} /> Không tìm thấy bàn</div></div>;

    const entityType = "Bàn";
    const entityNumber = entity?.number;
    const displayTotalItems = hasActiveOrder ? orderTotalItems : cartTotalItems;

    const displayTotal = hasActiveOrder && order?.timeBasedProduct && order.status === "OPEN"
        ? cartTotal + currentTableFee
        : (hasActiveOrder ? orderDisplayTotal : cartTotal);

    const finalTotal = selectedPromotion
        ? (selectedPromotion.discountPercentage
            ? Math.max(0, displayTotal * (1 - selectedPromotion.discountPercentage / 100))
            : Math.max(0, displayTotal - (selectedPromotion.discountAmount || 0)))
        : displayTotal;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <div className={styles.tableInfo}>
                    <h1 className={styles.tableTitle}>{entityType} {entityNumber}</h1>
                    <div className={`${styles.statusBadge} ${entity?.status === "FREE" ? styles.statusFree : styles.statusOccupied}`}>
                        {entity?.status === "FREE" ? (
                            <><CheckCircle size={14} /> Trống</>
                        ) : (
                            <><XCircle size={14} /> Đã có khách</>
                        )}
                    </div>
                </div>
                <div className={styles.stats}>
                    <div className={styles.statItem}>
                        <ShoppingCart size={18} />
                        <span>{displayTotalItems} món</span>
                    </div>
                    <div className={styles.statItem}>
                        <Users size={18} />
                        <span>{entity?.capacity || 4} người</span>
                    </div>
                </div>
            </div>

            {/* Hiển thị thời gian chơi realtime */}
            {order && (order.status === "OPEN" || order.status === "WAITING_PAYMENT") && order.startTime && (
                <div className={styles.timeBanner}>
                    <div className={styles.timeBannerLeft}>
                        <Clock size={16} className={styles.timeBannerIcon} />
                        <span className={styles.timeBannerLabel}>Thời gian đã chơi:</span>
                        <span className={styles.timeBannerValue}>
                            {getDetailedPlayTime(order.startTime, null).text}
                        </span>
                    </div>
                </div>
            )}

            {/* Search & Categories */}
            {(order?.status !== "PAID") && (
                <>
                    <div className={styles.searchSection}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Tìm kiếm món..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className={styles.categoryTabs}>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                className={`${styles.categoryBtn} ${activeTab === cat ? styles.categoryBtnActive : ""}`}
                                onClick={() => setActiveTab(cat)}
                            >
                                {cat === "Tất cả" && <Grid size={14} />}
                                {cat !== "Tất cả" && <Coffee size={14} />}
                                {cat}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* Content */}
            <div className={styles.content}>
                {/* Products Grid */}
                {(order?.status !== "PAID") && (
                    <div className={styles.productsGrid}>
                        {loading ? (
                            <div className={styles.loadingState}>
                                <RefreshCw className={styles.spinIcon} size={24} />
                                <span>Đang tải sản phẩm...</span>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className={styles.emptyState}>
                                <Package size={48} className={styles.emptyIcon} />
                                <span>Không có sản phẩm</span>
                            </div>
                        ) : (
                            filteredProducts
                                .filter(product => {
                                    if (order?.timeBasedProduct && product.productTypeCode === "TIME_BASED") {
                                        return false;
                                    }
                                    return true;
                                })
                                .map((product) => {
                                    const discountInfo = getDiscountedPriceForProduct(product);
                                    // Lấy giá hiển thị: nếu có giảm giá thì lấy giá đã giảm, không thì lấy giá gốc
                                    const displayPrice = discountInfo ? discountInfo.discountedPrice :
                                        (product.productTypeCode === "TIME_BASED" ? product.pricePerMinute : product.price);

                                    return (
                                        <div
                                            key={product.id}
                                            className={styles.productCard}
                                            onClick={() => addToCart(product)}
                                        >
                                            {product.productTypeCode === "TIME_BASED" && (
                                                <div className={styles.timeBasedBadge}>
                                                    <Timer size={12} /> Tính giờ
                                                </div>
                                            )}
                                            {/* Bỏ badge giảm giá */}
                                            <img
                                                src={product.imageUrl?.startsWith("http") ? product.imageUrl : `${API_BASE_URL}${product.imageUrl || ""}`}
                                                alt={product.name}
                                                className={styles.productImage}
                                                onError={(e) => { e.target.src = "https://via.placeholder.com/80?text=No+Image"; }}
                                            />
                                            <div className={styles.productInfo}>
                                                <h4 className={styles.productName}>{product.name}</h4>
                                                {/* Chỉ hiển thị giá, không hiển thị giá gốc */}
                                                <p className={styles.productPrice}>
                                                    <DollarSign size={12} />
                                                    {displayPrice?.toLocaleString("vi-VN")}đ
                                                    {product.productTypeCode === "TIME_BASED" && (
                                                        <span className={styles.perMinute}>/phút</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                    </div>
                )}

                {/* Cart Sidebar */}
                <div className={styles.cartSidebar}>
                    <h3 className={styles.cartTitle}>
                        <ShoppingBag size={20} />
                        Đơn hàng
                    </h3>

                    {/* Customer Info & Promotion */}
                    <div className={styles.customerInfoSection}>
                        <div className={styles.phoneInputGroup}>
                            <label className={styles.inputLabel}>
                                <Phone size={14} /> SĐT khách (tích điểm)
                            </label>
                            <input
                                type="tel"
                                placeholder="VD: 0987654321"
                                value={customerPhone}
                                onChange={(e) => {
                                    const phone = e.target.value;
                                    setCustomerPhone(phone);
                                    // Debounce để tránh gọi API quá nhiều
                                    if (phone.length >= 10) {
                                        const timeoutId = setTimeout(() => {
                                            searchCustomerByPhone(phone);
                                        }, 500);
                                        return () => clearTimeout(timeoutId);
                                    } else {
                                        setCustomerInfo(null);
                                    }
                                }}
                                disabled={order?.status === "PAID"}
                                className={styles.phoneInput}
                            />

                            {/* Hiển thị thông tin khách hàng */}
                            {customerInfo && (
                                <div className={styles.customerInfoCard}>
                                    <div className={styles.customerInfoRow}>
                                        <User size={14} />
                                        <span>{customerInfo.fullName || customerInfo.name}</span>
                                    </div>
                                    <div className={styles.customerInfoRow}>
                                        <Award size={14} />
                                        <span>Điểm hiện tại: <strong>{customerInfo.points}</strong></span>
                                    </div>
                                    {customerInfo.totalSpent > 0 && (
                                        <div className={styles.customerInfoRow}>
                                            <DollarSign size={14} />
                                            <span>Tổng chi: {customerInfo.totalSpent?.toLocaleString("vi-VN")}đ</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isSearchingCustomer && (
                                <div className={styles.searchingHint}>
                                    <RefreshCw size={12} className={styles.spinIcon} />
                                    <span>Đang tìm kiếm...</span>
                                </div>
                            )}

                            {customerPhone && !customerInfo && !isSearchingCustomer && customerPhone.length >= 10 && (
                                <p className={styles.loyaltyHint}>
                                    <AlertCircle size={12} /> Số điện thoại chưa đăng ký. Khi thanh toán sẽ tự động tạo tài khoản và tích điểm!
                                </p>
                            )}

                            {customerPhone && customerInfo && (
                                <p className={styles.loyaltyHint}>
                                    <Award size={12} /> Khi thanh toán sẽ được cộng thêm điểm!
                                </p>
                            )}
                        </div>

                        <div className={styles.promoInputGroup}>
                            <label className={styles.inputLabel}>
                                <Percent size={14} /> Khuyến mãi
                            </label>
                            {selectedPromotion ? (
                                <div className={styles.selectedPromo}>
                                    <div className={styles.selectedPromoInfo}>
                                        <div className={styles.selectedPromoName}>
                                            <Tag size={14} /> {selectedPromotion.name}
                                        </div>
                                        <div className={styles.selectedPromoDetail}>
                                            {selectedPromotion.discountPercentage
                                                ? `Giảm ${selectedPromotion.discountPercentage}%`
                                                : `Giảm ${selectedPromotion.discountAmount?.toLocaleString("vi-VN")}đ`}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedPromotion(null)}  // 🆕 Bỏ điều kiện if (!order)
                                        className={styles.removePromoBtn}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowPromoModal(true)}
                                    disabled={order?.status === "PAID"}
                                    className={styles.selectPromoBtn}
                                >
                                    <Gift size={14} /> Chọn khuyến mãi...
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Hiển thị phí giờ khi đã finish */}
                    {order?.status === "WAITING_PAYMENT" && order?.tableFee > 0 && (
                        <div className={styles.feeDisplay}>
                            <span className={styles.feeLabel}>
                                <Timer size={16} /> Phí dịch vụ tính giờ:
                            </span>
                            <span className={styles.feeAmount}>
                                {order.tableFee.toLocaleString("vi-VN")}đ
                            </span>
                        </div>
                    )}

                    {/* Hiển thị thời gian đã chơi khi đã finish */}
                    {order?.status === "WAITING_PAYMENT" && order?.startTime && (
                        <div className={styles.playTimeDisplay}>
                            <Clock size={16} className={styles.playTimeIcon} />
                            <span className={styles.playTimeLabel}>Thời gian đã chơi:</span>
                            <span className={styles.playTimeValue}>
                                {getDetailedPlayTime(order.startTime, order.endTime).text}
                            </span>
                        </div>
                    )}

                    {/* Danh sách món đã gọi */}
                    {cart.length === 0 ? (
                        <div className={styles.emptyCart}>
                            <ShoppingCart size={32} className={styles.emptyCartIcon} />
                            <span>Chưa có món nào</span>
                        </div>
                    ) : (
                        <>
                            <div className={styles.cartList}>
                                {cart.map((item) => (
                                    <div key={item.id} className={styles.cartItem}>
                                        <div className={styles.cartItemHeader}>
                                            <span className={styles.cartItemName}>
                                                {item.isTimeBased && <Timer size={14} className={styles.timeBasedIcon} />}
                                                {item.name}
                                                {item.discountApplied && (
                                                    <span className={styles.discountBadge}>
                                                        -{Math.round((item.originalPrice - item.price) / item.originalPrice * 100)}%
                                                    </span>
                                                )}
                                            </span>
                                            <span className={styles.cartItemPrice}>
                                                {item.isTimeBased ? (
                                                    (order?.status === "WAITING_PAYMENT" || order?.status === "PAID"
                                                        ? (order?.tableFee || 0).toLocaleString("vi-VN")
                                                        : (currentTableFee).toLocaleString("vi-VN")) + "đ"
                                                ) : (
                                                    <>
                                                        {item.discountApplied ? (
                                                            <>

                                                                <span className={styles.discountedPrice}>
                                                                    {((item.price || 0) * item.quantity).toLocaleString("vi-VN")}đ
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className={styles.discountedPrice}>
                                                                {((item.price || 0) * item.quantity).toLocaleString("vi-VN")}đ
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                        {(order?.status === "OPEN" && !item.isTimeBased) && (
                                            <div className={styles.cartItemControls}>
                                                <button onClick={() => updateQuantity(item.id, -1)} className={styles.qtyBtn}>
                                                    <Minus size={14} />
                                                </button>
                                                <span className={styles.qtyValue}>{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1)} className={styles.qtyBtn}>
                                                    <Plus size={14} />
                                                </button>
                                                <button onClick={() => removeFromCart(item.id)} className={styles.removeBtn}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                        {item.isTimeBased && (
                                            <div className={styles.timeBasedItemDetail}>
                                                {order?.status === "WAITING_PAYMENT"
                                                    ? `Tổng: ${order?.minutesPlayed || 0} phút`
                                                    : `${item.quantity} x ${item.pricePerMinute?.toLocaleString("vi-VN")}đ/phút`
                                                }
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className={styles.cartFooter}>
                                {/* Nút điều chỉnh thời gian trong giỏ hàng */}
                                {order && order.status === "OPEN" && order.startTime && (
                                    <button
                                        onClick={() => setShowTimeAdjustModal(true)}
                                        className={styles.adjustTimeBtn}
                                    >
                                        <Clock size={16} /> Điều chỉnh thời gian chơi
                                    </button>
                                )}

                                <div className={styles.totalRow}>
                                    <span>Tổng cộng:</span>
                                    <span className={styles.totalAmount}>
                                        {finalTotal.toLocaleString("vi-VN")}đ
                                    </span>
                                </div>

                                {selectedPromotion && (
                                    <div className={styles.promotionApplied}>
                                        <Tag size={12} /> Đã áp dụng: {selectedPromotion.name}
                                        <span className={styles.promotionDiscount}>
                                            (-{selectedPromotion.discountPercentage
                                                ? `${selectedPromotion.discountPercentage}%`
                                                : `${selectedPromotion.discountAmount?.toLocaleString("vi-VN")}đ`})
                                        </span>
                                    </div>
                                )}

                                {/* Các nút chức năng */}
                                <div className={styles.actionButtons}>
                                    {isNewOrder && cart.length > 0 && (
                                        <button
                                            className={styles.confirmOrderBtn}
                                            onClick={handleConfirmOrder}
                                            disabled={isConfirming}
                                        >
                                            {isConfirming ? (
                                                <><RefreshCw className={styles.spinIcon} size={16} /> Đang xử lý...</>
                                            ) : (
                                                <><Check size={16} /> Xác nhận đơn</>
                                            )}
                                        </button>
                                    )}

                                    {canEdit && cart.filter(item => !item.isTimeBased).length > 0 && (
                                        <button
                                            className={styles.updateOrderBtn}
                                            onClick={handleUpdateOrder}
                                            disabled={isConfirming}
                                        >
                                            {isConfirming ? (
                                                <><RefreshCw className={styles.spinIcon} size={16} /> Đang cập nhật...</>
                                            ) : (
                                                <><Save size={16} /> Cập nhật thêm món</>
                                            )}
                                        </button>
                                    )}

                                    {canEdit && (
                                        <button
                                            className={styles.finishPlayBtn}
                                            onClick={handleFinishPlaying}
                                            disabled={isFinishing}
                                        >
                                            {isFinishing ? (
                                                <><RefreshCw className={styles.spinIcon} size={16} /> Đang xử lý...</>
                                            ) : (
                                                <><StopCircle size={16} /> Kết thúc chơi</>
                                            )}
                                        </button>
                                    )}

                                    {canPrint && (
                                        <button className={styles.printBillBtn} onClick={printBill}>
                                            <Printer size={18} /> In hóa đơn
                                        </button>
                                    )}

                                    {canPay && (
                                        <button
                                            className={styles.payBtn}
                                            onClick={() => setShowPaymentMethodModal(true)}
                                            disabled={isPaying}
                                        >
                                            {isPaying ? (
                                                <><RefreshCw className={styles.spinIcon} size={16} /> Đang thanh toán...</>
                                            ) : (
                                                <><CreditCard size={16} /> Thanh toán</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Payment Method Modal */}
            <PaymentMethodModal
                show={showPaymentMethodModal}
                onClose={() => setShowPaymentMethodModal(false)}
                onSelect={(method) => {
                    setShowPaymentMethodModal(false);
                    if (method === "cash") setShowCashModal(true);
                    else handleCompletePayment(order?.id, method);
                }}
                orderId={order?.id}
                totalAmount={finalTotal}
                entityNumber={entityNumber}
                entityType={entityType}
            />

            {/* Cash Payment Modal */}
            <CashPaymentModal
                show={showCashModal}
                onClose={() => setShowCashModal(false)}
                onConfirm={() => handleCompletePayment(order?.id, "CASH")}
                totalAmount={finalTotal}
            />

            {/* Time Adjustment Modal */}
            {showTimeAdjustModal && (
                <div className={styles.modalOverlay} onClick={() => setShowTimeAdjustModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>
                                <Clock size={20} /> Điều chỉnh thời gian chơi
                            </h3>
                            <button onClick={() => setShowTimeAdjustModal(false)} className={styles.modalCloseBtn}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Hiển thị thời gian hiện tại */}
                            <div className={styles.currentTimeDisplay}>
                                <div className={styles.currentTimeLabel}>
                                    <Calendar size={16} /> Thời gian hiện tại:
                                </div>
                                <div className={styles.currentTimeValue}>
                                    {order?.startTime ? new Date(order.startTime).toLocaleString('vi-VN') : "--:-- --/--/----"}
                                </div>
                            </div>

                            {/* Chọn kiểu điều chỉnh */}
                            <div className={styles.adjustTypeSection}>
                                <label className={styles.adjustTypeLabel}>Chọn kiểu điều chỉnh:</label>
                                <select
                                    id="adjustType"
                                    className={styles.adjustTypeSelect}
                                    onChange={(e) => {
                                        const type = e.target.value;
                                        if (type === "minutes") {
                                            document.getElementById("minutesInput").style.display = "block";
                                            document.getElementById("datetimeInput").style.display = "none";
                                        } else {
                                            document.getElementById("minutesInput").style.display = "none";
                                            document.getElementById("datetimeInput").style.display = "block";
                                        }
                                    }}
                                >
                                    <option value="minutes">
                                        <Timer size={14} /> Điều chỉnh theo số phút
                                    </option>
                                    <option value="datetime">
                                        <Calendar size={14} /> Chọn lại thời gian bắt đầu
                                    </option>
                                </select>
                            </div>

                            {/* Điều chỉnh theo phút */}
                            <div id="minutesInput" className={styles.minutesInput}>
                                <label className={styles.minutesLabel}>Số phút cần điều chỉnh:</label>

                                <div className={styles.minutesDisplay}>
                                    {adjustMinutes > 0 ? `+${adjustMinutes}` : adjustMinutes} phút
                                </div>

                                <div className={styles.minutesGrid}>
                                    <button
                                        type="button"
                                        onClick={() => setAdjustMinutes(prev => prev - 60)}
                                        className={styles.minusBtn}
                                    >
                                        -60
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdjustMinutes(prev => prev - 30)}
                                        className={styles.minusBtn}
                                    >
                                        -30
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdjustMinutes(prev => prev - 15)}
                                        className={styles.minusBtn}
                                    >
                                        -15
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdjustMinutes(prev => prev - 5)}
                                        className={styles.minusBtn}
                                    >
                                        -5
                                    </button>
                                </div>

                                <div className={styles.minutesGrid}>
                                    <button
                                        type="button"
                                        onClick={() => setAdjustMinutes(prev => prev + 5)}
                                        className={styles.plusBtn}
                                    >
                                        +5
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdjustMinutes(prev => prev + 15)}
                                        className={styles.plusBtn}
                                    >
                                        +15
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdjustMinutes(prev => prev + 30)}
                                        className={styles.plusBtn}
                                    >
                                        +30
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdjustMinutes(prev => prev + 60)}
                                        className={styles.plusBtn}
                                    >
                                        +60
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setAdjustMinutes(0)}
                                    className={styles.resetMinutesBtn}
                                >
                                    <RotateCcw size={14} /> Đặt lại (0 phút)
                                </button>
                            </div>

                            {/* Chọn lại thời gian bắt đầu */}
                            <div id="datetimeInput" className={styles.datetimeInput}>
                                <label className={styles.datetimeLabel}>Chọn thời gian bắt đầu mới:</label>
                                <input
                                    type="datetime-local"
                                    id="newStartTime"
                                    defaultValue={order?.startTime ? new Date(order.startTime).toISOString().slice(0, 16) : ""}
                                    className={styles.datetimePicker}
                                />
                                <div className={styles.datetimeHint}>
                                    <Info size={12} /> Chọn thời gian bắt đầu chơi mới (hệ thống sẽ tính lại phí)
                                </div>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                onClick={() => setShowTimeAdjustModal(false)}
                                className={styles.cancelBtn}
                            >
                                <X size={16} /> Hủy
                            </button>
                            <button
                                onClick={() => {
                                    const adjustType = document.querySelector("#adjustType").value;
                                    if (adjustType === "minutes") {
                                        if (adjustMinutes === 0) {
                                            showToast("Vui lòng nhập số phút cần điều chỉnh", "warning");
                                            return;
                                        }
                                        handleAdjustTime();
                                    } else {
                                        const newStartTime = document.querySelector("#newStartTime").value;
                                        if (!newStartTime) {
                                            showToast("Vui lòng chọn thời gian bắt đầu mới", "warning");
                                            return;
                                        }
                                        const currentStart = new Date(order.startTime);
                                        const newStart = new Date(newStartTime);
                                        const diffMinutes = Math.floor((currentStart - newStart) / 1000 / 60);
                                        if (diffMinutes === 0) {
                                            showToast("Thời gian mới trùng với thời gian cũ", "warning");
                                            return;
                                        }
                                        setAdjustMinutes(diffMinutes);
                                        setTimeout(() => handleAdjustTime(), 100);
                                    }
                                }}
                                className={styles.submitAdjustBtn}
                                disabled={isAdjustingTime}
                            >
                                {isAdjustingTime ? (
                                    <><RefreshCw className={styles.spinIcon} size={16} /> Đang xử lý...</>
                                ) : (
                                    <><Check size={16} /> Xác nhận điều chỉnh</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Promotion Modal */}
            {showPromoModal && (
                <div className={styles.modalOverlay} onClick={() => setShowPromoModal(false)}>
                    <div className={styles.promoModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.promoModalHeader}>
                            <h3 className={styles.promoModalTitle}>
                                <Gift size={20} /> Chọn khuyến mãi
                            </h3>
                            <button onClick={() => setShowPromoModal(false)} className={styles.modalCloseBtn}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className={styles.promoModalBody}>
                            {promotions.length === 0 ? (
                                <div className={styles.noPromoState}>
                                    <AlertCircle size={24} />
                                    <span>Không có khuyến mãi nào</span>
                                </div>
                            ) : (
                                <div className={styles.promoList}>
                                    {promotions.map(promo => (
                                        <div
                                            key={promo.id}
                                            onClick={() => { setSelectedPromotion(promo); setShowPromoModal(false); }}
                                            className={`${styles.promoItem} ${selectedPromotion?.id === promo.id ? styles.promoItemSelected : ''}`}
                                        >
                                            <div className={styles.promoItemContent}>
                                                <div className={styles.promoItemName}>
                                                    <Tag size={16} /> {promo.name}
                                                </div>
                                                {promo.description && (
                                                    <p className={styles.promoItemDesc}>{promo.description}</p>
                                                )}
                                            </div>
                                            <span className={styles.promoItemDiscount}>
                                                {promo.discountPercentage
                                                    ? `-${promo.discountPercentage}%`
                                                    : promo.discountAmount
                                                        ? `-${promo.discountAmount.toLocaleString("vi-VN")}đ`
                                                        : ''}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={styles.promoModalFooter}>
                            <button
                                onClick={() => setShowPromoModal(false)}
                                className={styles.closePromoBtn}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notifications */}
            <div className={styles.toastContainer}>
                {toasts.map((toast) => (
                    <ToastNotification
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        duration={toast.duration}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default TableDetail;