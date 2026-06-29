import React, { useState, useEffect } from "react";
import {
    Calendar, Clock, Users, Phone, User, Mail, MapPin,
    X, Check, AlertCircle, Search, LogIn, Edit, ChevronDown,
    Table, Coffee, Star, Crown, Wrench, DollarSign,
    LayoutGrid, RefreshCw, Circle, CircleDot, CircleOff,
    Home, Settings, Bell, LogOut, Menu, Grid,
    Plus, Minus, Trash2, Eye, FileText, Printer,
    Award, Gift, Tag, Percent, CreditCard, Smartphone,
    Landmark, Receipt, ShoppingBag, Package, Timer,
    TrendingUp, BarChart3, PieChart, LineChart, CheckCircle,
    ChevronRight, ArrowLeft
} from "lucide-react";
import axiosClient from "../../../services/axiosClient";
import styles from "./BookingPage.module.css";

const BookingPage = () => {
    // ========== STATE CHO ĐẶT BÀN ==========
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [bookingData, setBookingData] = useState({
        tableId: "",
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        numberOfGuests: 4,
        reservationDate: new Date().toISOString().split('T')[0],
        reservationTime: "19:00",
        notes: ""
    });
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [toast, setToast] = useState({ show: false, text: "", type: "" });
    const [user, setUser] = useState(null);
    const [checkingIn, setCheckingIn] = useState(null);
    const [confirming, setConfirming] = useState(null);

    const [activeTab, setActiveTab] = useState("booking");

    const [showEditTableModal, setShowEditTableModal] = useState(false);
    const [editingTable, setEditingTable] = useState(null);
    const [editTableData, setEditTableData] = useState({
        number: "",
        capacity: "",
        type: "",
        status: ""
    });

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmData, setConfirmData] = useState(null);

    const [showTableDropdown, setShowTableDropdown] = useState(false);
    const [searchTable, setSearchTable] = useState("");

    // ========== STATE CHO ĐỔI SẢN PHẨM ==========
    const [allCustomers, setAllCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [redeemCustomer, setRedeemCustomer] = useState(null);
    const [redeemProducts, setRedeemProducts] = useState([]);
    const [filteredRedeemProducts, setFilteredRedeemProducts] = useState([]);
    const [redeemSearchTerm, setRedeemSearchTerm] = useState('');
    const [selectedRedeemProduct, setSelectedRedeemProduct] = useState(null);
    const [redeemQuantity, setRedeemQuantity] = useState(1);
    const [redeeming, setRedeeming] = useState(false);

    useEffect(() => {
        fetchTables();
        fetchAllReservations();
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.id) {
            setUser(userData);
            setBookingData(prev => ({
                ...prev,
                customerName: userData.fullName || "",
                customerPhone: userData.phone || "",
                customerEmail: userData.email || ""
            }));
        }
    }, []);

    // Load danh sách khách hàng khi vào tab redeem
    useEffect(() => {
        if (activeTab === 'redeem') {
            fetchAllCustomersForRedeem();
        }
    }, [activeTab]);

    // Filter khách hàng khi tìm kiếm
    useEffect(() => {
        if (customerSearchTerm.trim() === '') {
            setFilteredCustomers(allCustomers);
        } else {
            const filtered = allCustomers.filter(c =>
                c.phone?.includes(customerSearchTerm) ||
                c.customerName?.toLowerCase().includes(customerSearchTerm.toLowerCase())
            );
            setFilteredCustomers(filtered);
        }
    }, [customerSearchTerm, allCustomers]);

    // Filter sản phẩm khi tìm kiếm
    useEffect(() => {
        if (redeemSearchTerm.trim() === '') {
            setFilteredRedeemProducts(redeemProducts);
        } else {
            const filtered = redeemProducts.filter(p =>
                p.name?.toLowerCase().includes(redeemSearchTerm.toLowerCase())
            );
            setFilteredRedeemProducts(filtered);
        }
    }, [redeemSearchTerm, redeemProducts]);

    const showToast = (text, type = "success") => {
        setToast({ show: true, text, type });
        setTimeout(() => {
            setToast({ show: false, text: "", type: "" });
        }, 3000);
    };

    // ========== FUNCTIONS ĐẶT BÀN ==========

    const fetchTables = async () => {
        try {
            const response = await axiosClient.get('/tables');
            setTables(response.data.data || response.data || []);
        } catch (error) {
            console.error("Lỗi tải bàn:", error);
        }
    };

    const fetchAllReservations = async () => {
        try {
            const response = await axiosClient.get('/reservations/all');
            const data = response.data?.data || [];
            const sorted = data.sort((a, b) => {
                const priorityA = (a.status === 'PENDING' || a.status === 'CONFIRMED') ? 0 : 1;
                const priorityB = (b.status === 'PENDING' || b.status === 'CONFIRMED') ? 0 : 1;
                if (priorityA !== priorityB) return priorityA - priorityB;
                return new Date(b.reservationDate) - new Date(a.reservationDate);
            });
            setReservations(sorted);
        } catch (error) {
            console.error("Lỗi tải đặt bàn:", error);
        }
    };

    const checkAvailability = async (tableId, date, time) => {
        if (!tableId) return false;
        try {
            const response = await axiosClient.get('/reservations/check-availability', {
                params: { tableId, date, time, durationHours: 2 }
            });
            return response.data?.data?.available;
        } catch (error) {
            return false;
        }
    };

    const handleSelectTableAndOpenForm = (table) => {
        setSelectedTable(table);
        setBookingData(prev => ({ ...prev, tableId: table.id, numberOfGuests: table.capacity || prev.numberOfGuests }));
        setShowForm(true);
        showToast(`Đã chọn bàn ${table.number}`, "success");
    };

    const handleOpenForm = () => {
        setSelectedTable(null);
        setBookingData(prev => ({ ...prev, tableId: "" }));
        setShowForm(true);
    };

    const handleSelectTableFromDropdown = (table) => {
        if (table.status !== 'FREE') {
            showToast(`Bàn ${table.number} đã có khách, không thể đặt`, "error");
            return;
        }
        setSelectedTable(table);
        setBookingData(prev => ({ ...prev, tableId: table.id, numberOfGuests: table.capacity || prev.numberOfGuests }));
        setShowTableDropdown(false);
        setSearchTable("");
        showToast(`Đã chọn bàn ${table.number}`, "success");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!bookingData.customerName.trim()) { showToast("Vui lòng nhập tên khách hàng", "error"); return; }
        if (!bookingData.customerPhone.trim()) { showToast("Vui lòng nhập số điện thoại", "error"); return; }

        const today = new Date().toISOString().split('T')[0];
        if (bookingData.reservationDate < today) { showToast("Không thể đặt bàn trong quá khứ", "error"); return; }

        const hour = parseInt(bookingData.reservationTime.split(':')[0]);
        if (hour < 6 || hour > 22) { showToast("Chỉ có thể đặt bàn từ 6h đến 22h", "error"); return; }

        if (!bookingData.tableId && !selectedTable) { showToast("Vui lòng chọn bàn", "error"); return; }

        const tableId = bookingData.tableId || selectedTable?.id;
        const isAvailable = await checkAvailability(tableId, bookingData.reservationDate, bookingData.reservationTime);
        if (!isAvailable) { showToast("Bàn đã được đặt vào khung giờ này", "error"); return; }

        setLoading(true);
        try {
            const payload = {
                tableId,
                customerName: bookingData.customerName,
                customerPhone: bookingData.customerPhone,
                customerEmail: bookingData.customerEmail,
                numberOfGuests: bookingData.numberOfGuests,
                reservationDate: bookingData.reservationDate,
                reservationTime: bookingData.reservationTime,
                notes: bookingData.notes
            };
            const response = await axiosClient.post('/reservations/create', payload);
            if (response.data?.success) {
                showToast("Đặt bàn thành công! Đang chờ xác nhận.", "success");
                setShowForm(false);
                setSelectedTable(null);
                setBookingData({
                    tableId: "", customerName: user?.fullName || "", customerPhone: user?.phone || "",
                    customerEmail: user?.email || "", numberOfGuests: 4,
                    reservationDate: new Date().toISOString().split('T')[0],
                    reservationTime: "19:00", notes: ""
                });
                fetchAllReservations();
                fetchTables();
            }
        } catch (error) {
            showToast(error.response?.data?.message || "Đặt bàn thất bại", "error");
        } finally {
            setLoading(false);
        }
    };

    const openConfirmModal = (reservationId, actionType) => {
        const reservation = reservations.find(r => r.id === reservationId);
        if (!reservation) { showToast("Không tìm thấy đặt bàn", "error"); return; }
        setConfirmData({ ...reservation, title: null, message: null, action: null });
        setConfirmAction(actionType);
        setShowConfirmModal(true);
    };

    const handleConfirmReservation = async () => {
        if (!confirmData) return;
        setShowConfirmModal(false);
        setConfirming(confirmData.id);
        try {
            await axiosClient.patch(`/reservations/${confirmData.id}/confirm`);
            showToast(`Đã xác nhận đặt bàn ${confirmData.tableNumber} cho ${confirmData.customerName}!`, "success");
            fetchAllReservations();
            fetchTables();
        } catch (error) {
            showToast(error.response?.data?.message || "Xác nhận thất bại", "error");
        } finally {
            setConfirming(null);
            setConfirmData(null);
        }
    };

    const handleCancelReservationWithModal = (reservationId) => {
        const reservation = reservations.find(r => r.id === reservationId);
        if (!reservation) { showToast("Không tìm thấy đặt bàn", "error"); return; }
        setConfirmData({ ...reservation, title: null, message: null, action: null });
        setConfirmAction("cancel");
        setShowConfirmModal(true);
    };

    const handleCancelReservation = async () => {
        if (!confirmData) return;
        setShowConfirmModal(false);
        try {
            await axiosClient.patch(`/reservations/${confirmData.id}/cancel?reason=Khách hủy`);
            showToast("Hủy đặt bàn thành công!", "success");
            fetchAllReservations();
            fetchTables();
        } catch (error) {
            showToast("Hủy thất bại", "error");
        } finally {
            setConfirmData(null);
        }
    };

    const handleCheckIn = async (reservationId) => {
        setCheckingIn(reservationId);
        try {
            await axiosClient.patch(`/reservations/${reservationId}/checkin`);
            showToast("Check-in thành công! Khách đã đến bàn.", "success");
            fetchAllReservations();
            fetchTables();
        } catch (error) {
            showToast("Check-in thất bại", "error");
        } finally {
            setCheckingIn(null);
        }
    };

    const handleEditTable = (table) => {
        setEditingTable(table);
        setEditTableData({ number: table.number, capacity: table.capacity, type: table.type || "Standard", status: table.status });
        setShowEditTableModal(true);
    };

    const handleUpdateTable = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.patch(`/tables/${editingTable.id}`, editTableData);
            showToast("Cập nhật bàn thành công!", "success");
            fetchTables();
            setShowEditTableModal(false);
        } catch (error) {
            showToast(error.response?.data?.message || "Cập nhật thất bại", "error");
        }
    };

    // ========== FUNCTIONS ĐỔI SẢN PHẨM ==========

    const fetchAllCustomersForRedeem = async () => {
        try {
            const res = await axiosClient.get('/customer-points/all');
            if (res.data?.success) {
                const customers = res.data.data || [];
                setAllCustomers(customers);
                setFilteredCustomers(customers);
            } else {
                setAllCustomers([]);
                setFilteredCustomers([]);
            }
        } catch (err) {
            console.error('Lỗi tải danh sách khách hàng:', err);
            setAllCustomers([]);
            setFilteredCustomers([]);
        }
    };

    const selectCustomerForRedeem = async (customer) => {
        setSelectedCustomer(customer);
        setRedeemCustomer(customer);
        setSelectedRedeemProduct(null);
        setRedeemQuantity(1);
        await fetchRedeemableProducts(customer.phone);
    };

    const clearSelectedCustomer = () => {
        setSelectedCustomer(null);
        setRedeemCustomer(null);
        setRedeemProducts([]);
        setFilteredRedeemProducts([]);
        setSelectedRedeemProduct(null);
        setRedeemQuantity(1);
    };

    const fetchRedeemableProducts = async (phone) => {
        try {
            const res = await axiosClient.get(`/customer-points/redeemable-products/${phone}`);
            if (res.data?.success) {
                const products = res.data.data?.availableProducts || [];
                setRedeemProducts(products);
                setFilteredRedeemProducts(products);
                setRedeemSearchTerm('');
                setRedeemCustomer(prev => ({ ...prev, totalPoints: res.data.data.totalPoints }));
            } else {
                setRedeemProducts([]);
                setFilteredRedeemProducts([]);
            }
        } catch (err) {
            setRedeemProducts([]);
            setFilteredRedeemProducts([]);
        }
    };

    const handleRedeemProduct = () => {
        if (!selectedRedeemProduct) { showToast('Vui lòng chọn sản phẩm!', 'warning'); return; }
        if (redeemQuantity <= 0 || redeemQuantity > (selectedRedeemProduct.maxQuantity || 1)) {
            showToast('Số lượng không hợp lệ!', 'warning'); return;
        }
        const pointsNeeded = selectedRedeemProduct.pointsRequired * redeemQuantity;
        setConfirmData({
            title: 'Xác nhận đổi sản phẩm',
            message: `Đổi ${redeemQuantity}x ${selectedRedeemProduct.name}?\nSẽ dùng ${pointsNeeded} điểm từ ${redeemCustomer?.customerName || redeemCustomer?.phone}`,
            action: 'redeem'
        });
        setShowConfirmModal(true);
    };

    const executeRedeem = async () => {
        setShowConfirmModal(false);
        setRedeeming(true);
        try {
            const res = await axiosClient.post(`/customer-points/redeem-product/${redeemCustomer.phone}`, {
                productId: selectedRedeemProduct.id,
                quantity: redeemQuantity
            });
            if (res.data?.success) {
                showToast(res.data.message || 'Đổi sản phẩm thành công!', 'success');
                setSelectedRedeemProduct(null);
                setRedeemQuantity(1);
                await fetchRedeemableProducts(redeemCustomer.phone);
                await fetchAllCustomersForRedeem();
            } else {
                showToast(res.data?.message || 'Đổi thất bại!', 'error');
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Đổi thất bại!', 'error');
        } finally {
            setRedeeming(false);
            setConfirmData(null);
        }
    };

    const handleConfirmAction = async () => {
        if (!confirmData) return;
        if (confirmData.action === 'redeem') {
            await executeRedeem();
            return;
        }
        if (confirmAction === "confirm") {
            await handleConfirmReservation();
        } else if (confirmAction === "cancel") {
            await handleCancelReservation();
        }
    };

    const openRedeemTab = () => {
        setActiveTab('redeem');
        setSelectedCustomer(null);
        setRedeemCustomer(null);
        setRedeemProducts([]);
        setSelectedRedeemProduct(null);
        setRedeemQuantity(1);
        setCustomerSearchTerm('');
        fetchAllCustomersForRedeem();
    };

    // ========== HELPERS ==========

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING': return <Clock size={14} />;
            case 'CONFIRMED': return <Check size={14} />;
            case 'CHECKED_IN': return <User size={14} />;
            case 'CANCELLED': return <X size={14} />;
            case 'COMPLETED': return <CheckCircle size={14} />;
            case 'NO_SHOW': return <AlertCircle size={14} />;
            default: return <AlertCircle size={14} />;
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'PENDING': { text: 'Chờ xác nhận', color: '#f59e0b', bg: '#fef3c7' },
            'CONFIRMED': { text: 'Đã xác nhận', color: '#10b981', bg: '#d1fae5' },
            'CHECKED_IN': { text: 'Đã đến', color: '#3b82f6', bg: '#dbeafe' },
            'CANCELLED': { text: 'Đã hủy', color: '#ef4444', bg: '#fee2e2' },
            'COMPLETED': { text: 'Hoàn thành', color: '#6b7280', bg: '#f3f4f6' },
            'NO_SHOW': { text: 'No-show', color: '#dc2626', bg: '#fef2f2' }
        };
        const s = statusMap[status] || { text: status, color: '#6b7280', bg: '#f3f4f6' };
        return (
            <span className={styles.statusBadge} style={{ background: s.bg, color: s.color }}>
                {getStatusIcon(status)} {s.text}
            </span>
        );
    };

    const getTableStatusBadge = (status) => {
        const statusMap = {
            'FREE': { text: 'Trống', color: '#10b981', bg: '#d1fae5' },
            'OCCUPIED': { text: 'Đã có khách', color: '#ef4444', bg: '#fee2e2' },
            'RESERVED': { text: 'Đã đặt trước', color: '#f59e0b', bg: '#fed7aa' }
        };
        const s = statusMap[status] || { text: status, color: '#6b7280', bg: '#f3f4f6' };
        return (
            <span className={styles.tableStatusBadge} style={{ background: s.bg, color: s.color }}>
                {status === 'FREE' && <Circle size={12} color="#10b981" />}
                {status === 'OCCUPIED' && <CircleDot size={12} color="#ef4444" />}
                {status === 'RESERVED' && <CircleOff size={12} color="#f59e0b" />}
                {s.text}
            </span>
        );
    };

    const availableTables = tables.filter(table => table.status === 'FREE');
    const filteredTables = availableTables.filter(table =>
        table.number?.toString().includes(searchTable) ||
        table.tableName?.toLowerCase().includes(searchTable.toLowerCase())
    );
    const displayReservations = reservations.filter(r => r.status !== 'COMPLETED' && r.status !== 'NO_SHOW');

    const handleCloseForm = () => {
        setShowForm(false);
        setSelectedTable(null);
        setShowTableDropdown(false);
        setSearchTable("");
    };

    return (
        <div className={styles.container}>
            {/* Toast Notification */}
            {toast.show && (
                <div className={`${styles.toast} ${styles[toast.type]}`}>
                    <div className={styles.toastIcon}>
                        {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                    </div>
                    <span className={styles.toastMessage}>{toast.text}</span>
                    <button className={styles.toastClose} onClick={() => setToast({ show: false, text: "", type: "" })}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* ========== CONFIRM MODAL ========== */}
            {showConfirmModal && confirmData && (
                <div className={styles.modalOverlay} onClick={() => setShowConfirmModal(false)}>
                    <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.confirmModalHeader}>
                            <div className={styles.confirmIcon}>
                                {confirmData.action === 'redeem' ? (
                                    <Gift size={24} color="#8B5CF6" />
                                ) : confirmAction === "confirm" ? (
                                    <Check size={24} color="#10b981" />
                                ) : (
                                    <AlertCircle size={24} color="#ef4444" />
                                )}
                            </div>
                            <h3>{confirmData.title || (confirmAction === "confirm" ? "Xác nhận đặt bàn" : "Xác nhận hủy đặt bàn")}</h3>
                        </div>
                        <div className={styles.confirmModalBody}>
                            <p style={{ whiteSpace: 'pre-line' }}>{confirmData.message || (confirmAction === "confirm"
                                ? `Bạn có chắc chắn muốn xác nhận đặt bàn cho khách hàng?`
                                : `Bạn có chắc chắn muốn hủy đặt bàn này?`)}</p>
                            {confirmData.action !== 'redeem' && confirmData.tableNumber && (
                                <div className={styles.confirmInfo}>
                                    <div className={styles.confirmInfoRow}><strong>Bàn:</strong> <span>{confirmData.tableNumber}</span></div>
                                    <div className={styles.confirmInfoRow}><strong>Khách hàng:</strong> <span>{confirmData.customerName}</span></div>
                                    <div className={styles.confirmInfoRow}><strong>Số điện thoại:</strong> <span>{confirmData.customerPhone}</span></div>
                                    <div className={styles.confirmInfoRow}><strong>Thời gian:</strong> <span>{confirmData.reservationTime} - {formatDate(confirmData.reservationDate)}</span></div>
                                    <div className={styles.confirmInfoRow}><strong>Số khách:</strong> <span>{confirmData.numberOfGuests} người</span></div>
                                </div>
                            )}
                        </div>
                        <div className={styles.confirmModalFooter}>
                            <button className={styles.confirmCancelBtn} onClick={() => setShowConfirmModal(false)}>Hủy</button>
                            <button
                                className={confirmData.action === 'redeem' ? styles.confirmOkBtn : (confirmAction === "confirm" ? styles.confirmOkBtn : styles.confirmCancelActionBtn)}
                                onClick={handleConfirmAction}
                            >
                                {confirmData.action === 'redeem' ? 'Xác nhận đổi' : (confirmAction === "confirm" ? "Xác nhận" : "Hủy đặt bàn")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2><LayoutGrid size={24} style={{ display: 'inline', marginRight: '8px' }} /> Quản lý đặt bàn</h2>
                    <p>Quản lý và xác nhận đặt bàn cho khách hàng</p>
                </div>
                <button onClick={handleOpenForm} className={styles.addBtn}>
                    <Plus size={16} /> Đặt bàn mới
                </button>
            </div>

            {/* ========== TABS ========== */}
            <div className={styles.tabs}>
                <button className={`${styles.tabBtn} ${activeTab === "booking" ? styles.activeTab : ""}`} onClick={() => setActiveTab("booking")}>
                    <Calendar size={18} /><span>Đặt bàn mới</span>
                </button>
                <button className={`${styles.tabBtn} ${activeTab === "list" ? styles.activeTab : ""}`} onClick={() => setActiveTab("list")}>
                    <Users size={18} /><span>Danh sách đặt bàn</span>
                    {displayReservations.length > 0 && <span className={styles.tabBadge}>{displayReservations.length}</span>}
                </button>
                <button className={`${styles.tabBtn} ${activeTab === "redeem" ? styles.activeTab : ""}`} onClick={openRedeemTab}>
                    <Gift size={18} /><span>Đổi sản phẩm</span>
                </button>
            </div>

            {/* ========== TAB ĐẶT BÀN MỚI ========== */}
            {activeTab === "booking" && (
                <div className={styles.bookingTab}>
                    <div className={styles.sectionHeader}>
                        <h3><Table size={18} style={{ display: 'inline', marginRight: '6px' }} /> Chọn bàn nhanh</h3>
                        <p>Click vào bàn trống để đặt - Bàn đỏ đang có khách</p>
                    </div>
                    <div className={styles.tablesGrid}>
                        {tables.map(table => (
                            <div key={table.id} className={`${styles.tableCard} ${table.status !== 'FREE' ? styles.occupied : ''}`}>
                                <div className={styles.tableCardHeader}>
                                    <div className={styles.tableNumber}>Bàn {table.number}</div>
                                    <button onClick={() => handleEditTable(table)} className={styles.editTableBtn} title="Sửa bàn">
                                        <Edit size={14} />
                                    </button>
                                </div>
                                <div className={styles.tableDetails}>
                                    <div className={styles.tableDetail}><Users size={14} /><span>{table.capacity || 4} người</span></div>
                                    <div className={styles.tableDetail}><MapPin size={14} /><span>{table.type || 'Standard'}</span></div>
                                </div>
                                <div className={styles.tableStatusWrapper}>{getTableStatusBadge(table.status)}</div>
                                {table.status === 'FREE' && (
                                    <button onClick={() => handleSelectTableAndOpenForm(table)} className={styles.bookBtn}>Đặt bàn ngay</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ========== TAB DANH SÁCH ĐẶT BÀN ========== */}
            {activeTab === "list" && (
                <div className={styles.listTab}>
                    <div className={styles.sectionHeader}>
                        <h3><FileText size={18} style={{ display: 'inline', marginRight: '6px' }} /> Danh sách đặt bàn</h3>
                        <p>Quản lý và xử lý các đơn đặt bàn</p>
                    </div>
                    {displayReservations.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}><Calendar size={48} color="#94a3b8" /></div>
                            <h4>Chưa có đặt bàn nào</h4>
                            <p>Hiện tại chưa có đơn đặt bàn nào cần xử lý</p>
                            <button onClick={handleOpenForm} className={styles.emptyBtn}><Plus size={16} /> Đặt bàn ngay</button>
                        </div>
                    ) : (
                        <div className={styles.reservationsList}>
                            {displayReservations.map(res => (
                                <div key={res.id} className={styles.reservationCard}>
                                    <div className={styles.reservationCardHeader}>
                                        <div className={styles.reservationTable}>
                                            <span className={styles.tableLabel}>Bàn</span>
                                            <strong>{res.tableNumber}</strong>
                                        </div>
                                        {getStatusBadge(res.status)}
                                    </div>
                                    <div className={styles.reservationCardBody}>
                                        <div className={styles.reservationInfo}>
                                            <div className={styles.infoRow}><User size={14} /><span>{res.customerName}</span></div>
                                            <div className={styles.infoRow}><Phone size={14} /><span>{res.customerPhone}</span></div>
                                            <div className={styles.infoRow}><Clock size={14} /><span>{res.reservationTime} - {formatDate(res.reservationDate)}</span></div>
                                            <div className={styles.infoRow}><Users size={14} /><span>{res.numberOfGuests} khách</span></div>
                                        </div>
                                        {res.notes && (
                                            <div className={styles.reservationNotes}>
                                                <span><Edit size={14} /> Ghi chú:</span>
                                                <p>{res.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.reservationCardFooter}>
                                        {res.status === 'PENDING' && (
                                            <button onClick={() => openConfirmModal(res.id, "confirm")} disabled={confirming === res.id}
                                                className={`${styles.actionBtn} ${styles.confirmAction}`}>
                                                <Check size={16} />{confirming === res.id ? "Đang xử lý..." : "Xác nhận"}
                                            </button>
                                        )}
                                        {res.status === 'CONFIRMED' && (
                                            <button onClick={() => handleCheckIn(res.id)} disabled={checkingIn === res.id}
                                                className={`${styles.actionBtn} ${styles.checkinAction}`}>
                                                <LogIn size={16} />{checkingIn === res.id ? "Đang xử lý..." : "Check-in"}
                                            </button>
                                        )}
                                        {res.status !== 'CHECKED_IN' && res.status !== 'CANCELLED' && res.status !== 'COMPLETED' && (
                                            <button onClick={() => handleCancelReservationWithModal(res.id)}
                                                className={`${styles.actionBtn} ${styles.cancelAction}`}>
                                                <X size={16} /> Hủy
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ========== TAB ĐỔI SẢN PHẨM ========== */}
            {activeTab === "redeem" && (
                <div className={styles.bookingTab}>
                    <div className={styles.sectionHeader}>
                        <h3><Gift size={18} style={{ display: 'inline', marginRight: '6px' }} /> Đổi sản phẩm bằng điểm</h3>
                        <p>{selectedCustomer ? 'Chọn sản phẩm để đổi' : 'Chọn khách hàng để xem sản phẩm có thể đổi'}</p>
                    </div>

                    {/* ========== CHƯA CHỌN KHÁCH HÀNG -> HIỂN THỊ DANH SÁCH ========== */}
                    {!selectedCustomer ? (
                        <div style={{ background: '#1a1a2e', borderRadius: 16, border: '1px solid #2d2d3d', padding: 20 }}>
                            {/* Thanh tìm kiếm khách hàng */}
                            <div style={{ marginBottom: 16, position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên hoặc SĐT..."
                                    value={customerSearchTerm}
                                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                                    style={{ width: '100%', padding: '12px 16px 12px 44px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none' }}
                                />
                                {customerSearchTerm && (
                                    <button onClick={() => setCustomerSearchTerm('')}
                                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Grid khách hàng */}
                            {filteredCustomers.length > 0 ? (
                                <div>
                                    <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 12 }}>
                                        {customerSearchTerm ? `Kết quả: ${filteredCustomers.length} khách hàng` : `Tất cả khách hàng (${allCustomers.length}):`}
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
                                        {filteredCustomers.map((customer) => (
                                            <div
                                                key={customer.id}
                                                onClick={() => selectCustomerForRedeem(customer)}
                                                style={{
                                                    padding: '14px 16px',
                                                    background: '#0f0f1a',
                                                    border: '1px solid #2d2d3d',
                                                    borderRadius: 12,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    gap: 12
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.borderColor = '#8B5CF6';
                                                    e.currentTarget.style.background = 'rgba(139,92,246,0.08)';
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.borderColor = '#2d2d3d';
                                                    e.currentTarget.style.background = '#0f0f1a';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        width: 42, height: 42, borderRadius: '50%',
                                                        background: 'rgba(139,92,246,0.15)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        flexShrink: 0
                                                    }}>
                                                        <User size={20} color="#8B5CF6" />
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <p style={{ color: 'white', margin: 0, fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {customer.customerName || 'Khách hàng'}
                                                        </p>
                                                        <p style={{ color: '#94a3b8', margin: '3px 0 0', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <Phone size={11} /> {customer.phone}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    background: 'rgba(251,191,36,0.15)',
                                                    padding: '8px 14px',
                                                    borderRadius: 20,
                                                    flexShrink: 0,
                                                    border: '1px solid rgba(251,191,36,0.2)'
                                                }}>
                                                    <Award size={15} color="#FBBF24" />
                                                    <span style={{ color: '#FBBF24', fontWeight: 700, fontSize: 15 }}>{(customer.totalPoints || 0).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                                    <Users size={56} style={{ opacity: 0.2, marginBottom: 16 }} />
                                    <p style={{ fontSize: 16, marginBottom: 4 }}>
                                        {customerSearchTerm ? 'Không tìm thấy khách hàng' : 'Chưa có khách hàng nào'}
                                    </p>
                                    <p style={{ fontSize: 13, margin: 0 }}>
                                        {customerSearchTerm ? 'Thử tìm với từ khóa khác' : 'Thêm khách hàng mới để bắt đầu'}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ========== ĐÃ CHỌN KHÁCH HÀNG -> HIỂN THỊ SẢN PHẨM ========== */
                        <div>
                            {/* Thông tin khách hàng đã chọn */}
                            <div style={{
                                background: '#1a1a2e', borderRadius: 16, border: '2px solid #8B5CF6',
                                padding: 18, marginBottom: 20,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{
                                        width: 48, height: 48, borderRadius: '50%',
                                        background: 'rgba(139,92,246,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <User size={24} color="#8B5CF6" />
                                    </div>
                                    <div>
                                        <p style={{ color: 'white', margin: 0, fontWeight: 600, fontSize: 16 }}>
                                            {selectedCustomer.customerName || 'Khách hàng'}
                                        </p>
                                        <p style={{ color: '#94a3b8', margin: '3px 0 0', fontSize: 13 }}>
                                            <Phone size={12} style={{ display: 'inline', marginRight: 4 }} />{selectedCustomer.phone}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        color: '#FBBF24', fontWeight: 700,
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        background: 'rgba(251,191,36,0.1)', padding: '10px 16px',
                                        borderRadius: 12, border: '1px solid rgba(251,191,36,0.2)'
                                    }}>
                                        <Award size={20} />
                                        <span style={{ fontSize: 18 }}>{(redeemCustomer?.totalPoints || 0).toLocaleString()} điểm</span>
                                    </div>
                                    <button onClick={clearSelectedCustomer}
                                        style={{
                                            padding: '10px 16px', background: '#2d2d3d', color: 'white',
                                            border: 'none', borderRadius: 10, cursor: 'pointer',
                                            fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13
                                        }}>
                                        <ArrowLeft size={14} /> Chọn KH khác
                                    </button>
                                </div>
                            </div>

                            {/* Danh sách sản phẩm đổi được */}
                            <div style={{ background: '#1a1a2e', borderRadius: 16, border: '1px solid #2d2d3d', padding: 20 }}>
                                {redeemProducts.length > 0 && (
                                    <div style={{ marginBottom: 16, position: 'relative' }}>
                                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                                        <input type="text" placeholder="Tìm sản phẩm..." value={redeemSearchTerm}
                                            onChange={(e) => setRedeemSearchTerm(e.target.value)}
                                            style={{ width: '100%', padding: '10px 12px 10px 36px', background: '#0f0f1a', border: '1px solid #2d2d3d', borderRadius: 10, color: 'white', fontSize: 13, outline: 'none' }} />
                                        {redeemSearchTerm && (
                                            <button onClick={() => setRedeemSearchTerm('')}
                                                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}

                                {filteredRedeemProducts.length > 0 ? (
                                    <div>
                                        <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 12 }}>
                                            {redeemSearchTerm ? `Kết quả: ${filteredRedeemProducts.length} sản phẩm` : `Chọn sản phẩm (${redeemProducts.length}):`}
                                        </p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10, marginBottom: 16 }}>
                                            {filteredRedeemProducts.map((product) => {
                                                const isSelected = selectedRedeemProduct?.id === product.id;
                                                const canRedeem = (redeemCustomer?.totalPoints || 0) >= product.pointsRequired;
                                                return (
                                                    <div key={product.id}
                                                        onClick={() => { if (canRedeem) { setSelectedRedeemProduct(isSelected ? null : product); setRedeemQuantity(1); } }}
                                                        style={{
                                                            padding: '14px', background: isSelected ? 'rgba(139,92,246,0.2)' : '#0f0f1a',
                                                            border: isSelected ? '2px solid #8B5CF6' : '1px solid #2d2d3d',
                                                            borderRadius: 12, cursor: canRedeem ? 'pointer' : 'not-allowed',
                                                            opacity: canRedeem ? 1 : 0.55, transition: 'all 0.2s', textAlign: 'center'
                                                        }}>
                                                        <div style={{ marginBottom: 8 }}>
                                                            {product.imageUrl ? (
                                                                <img src={product.imageUrl} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', margin: '0 auto' }} />
                                                            ) : (
                                                                <div style={{ width: 56, height: 56, borderRadius: 10, background: '#2d2d3d', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                                                                    <Package size={26} color="#64748B" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p style={{ color: 'white', margin: '0 0 4px', fontWeight: 500, fontSize: 13 }}>{product.name}</p>
                                                        <p style={{ color: '#94a3b8', margin: '0 0 8px', fontSize: 11 }}>Còn: {product.stockQuantity}</p>
                                                        <div style={{ color: '#8B5CF6', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                                            <Award size={14} /> {product.pointsRequired}
                                                        </div>
                                                        {!canRedeem && <p style={{ color: '#EF4444', fontSize: 10, marginTop: 6 }}>Thiếu {product.pointsRequired - (redeemCustomer?.totalPoints || 0)} đ</p>}
                                                        {isSelected && <p style={{ color: '#8B5CF6', fontSize: 11, marginTop: 6, fontWeight: 600 }}>✓ Đã chọn</p>}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {selectedRedeemProduct && (
                                            <div style={{ background: 'rgba(139,92,246,0.1)', padding: 14, borderRadius: 10, border: '1px solid rgba(139,92,246,0.25)', marginBottom: 16 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                    <span style={{ color: '#8B5CF6', fontSize: 14, fontWeight: 600 }}>🛒 {selectedRedeemProduct.name}</span>
                                                    <button onClick={() => setSelectedRedeemProduct(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={16} /></button>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <button onClick={() => setRedeemQuantity(Math.max(1, redeemQuantity - 1))}
                                                        style={{ padding: '8px 14px', background: '#2d2d3d', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>−</button>
                                                    <input type="number" value={redeemQuantity}
                                                        onChange={(e) => setRedeemQuantity(Math.max(1, Math.min(parseInt(e.target.value) || 1, selectedRedeemProduct.maxQuantity)))}
                                                        min="1" max={selectedRedeemProduct.maxQuantity}
                                                        style={{ width: '60px', padding: '8px', textAlign: 'center', background: '#0f0f1a', border: '1px solid #8B5CF6', borderRadius: 8, color: 'white', fontSize: 16, fontWeight: 600, outline: 'none' }} />
                                                    <button onClick={() => setRedeemQuantity(Math.min(selectedRedeemProduct.maxQuantity, redeemQuantity + 1))}
                                                        style={{ padding: '8px 14px', background: '#2d2d3d', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>+</button>
                                                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                                        <p style={{ color: '#FBBF24', margin: 0, fontWeight: 700, fontSize: 18 }}>{(selectedRedeemProduct.pointsRequired * redeemQuantity).toLocaleString()} điểm</p>
                                                        <p style={{ color: '#64748B', margin: '2px 0 0', fontSize: 11 }}>Tối đa: {selectedRedeemProduct.maxQuantity}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <button onClick={handleRedeemProduct} disabled={!selectedRedeemProduct || redeeming}
                                            style={{ width: '100%', padding: 14, background: selectedRedeemProduct ? '#8B5CF6' : '#4a4a5a', color: 'white', border: 'none', borderRadius: 12, fontWeight: 600, cursor: selectedRedeemProduct ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 15 }}>
                                            {redeeming ? 'Đang xử lý...' : (<><ShoppingBag size={16} /> Đổi ngay</>)}
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                                        <Package size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                                        <p>{redeemSearchTerm ? 'Không tìm thấy sản phẩm' : 'Không có sản phẩm nào có thể đổi'}</p>
                                        {redeemSearchTerm && (
                                            <button onClick={() => setRedeemSearchTerm('')}
                                                style={{ marginTop: 8, padding: '8px 16px', background: '#2d2d3d', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>
                                                Xóa tìm kiếm
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ========== MODAL ĐẶT BÀN MỚI ========== */}
            {showForm && (
                <div className={styles.modalOverlay} onClick={handleCloseForm}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalTitle}><Calendar size={20} /><h3>Đặt bàn mới</h3></div>
                            <button onClick={handleCloseForm} className={styles.modalClose}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            <div className={styles.formField}>
                                <label>Chọn bàn <span className={styles.required}>*</span></label>
                                <div className={styles.tableSelectWrapper}>
                                    <div className={styles.tableSelectTrigger} onClick={() => setShowTableDropdown(!showTableDropdown)}>
                                        <span>{selectedTable ? `Bàn ${selectedTable.number} - ${selectedTable.capacity} chỗ - ${selectedTable.type || 'Standard'}` : "-- Chọn bàn --"}</span>
                                        <ChevronDown size={16} className={showTableDropdown ? styles.rotated : ""} />
                                    </div>
                                    {showTableDropdown && (
                                        <div className={styles.tableDropdown}>
                                            <div className={styles.dropdownSearch}>
                                                <Search size={14} />
                                                <input type="text" placeholder="Tìm bàn trống..." value={searchTable} onChange={(e) => setSearchTable(e.target.value)} autoFocus />
                                            </div>
                                            <div className={styles.dropdownList}>
                                                {filteredTables.length === 0 ? (
                                                    <div className={styles.dropdownEmpty}>Không có bàn trống</div>
                                                ) : (
                                                    filteredTables.map(table => (
                                                        <div key={table.id} className={`${styles.dropdownItem} ${selectedTable?.id === table.id ? styles.selected : ''}`}
                                                            onClick={() => handleSelectTableFromDropdown(table)}>
                                                            <div className={styles.dropdownItemInfo}>
                                                                <strong>Bàn {table.number}</strong>
                                                                <span>{table.capacity} chỗ</span>
                                                                <span>{table.type || 'Standard'}</span>
                                                            </div>
                                                            <div className={styles.availableTag}><Circle size={10} color="#10b981" style={{ display: 'inline', marginRight: '4px' }} />Trống</div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {selectedTable && <p className={styles.selectedHint}><Check size={14} style={{ display: 'inline' }} /> Đã chọn bàn {selectedTable.number}</p>}
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formField}>
                                    <label>Tên khách hàng <span className={styles.required}>*</span></label>
                                    <input type="text" value={bookingData.customerName} onChange={(e) => setBookingData({ ...bookingData, customerName: e.target.value })} placeholder="Nhập tên khách hàng" required />
                                </div>
                                <div className={styles.formField}>
                                    <label>Số điện thoại <span className={styles.required}>*</span></label>
                                    <input type="tel" value={bookingData.customerPhone} onChange={(e) => setBookingData({ ...bookingData, customerPhone: e.target.value })} placeholder="Nhập số điện thoại" required />
                                </div>
                            </div>
                            <div className={styles.formField}>
                                <label>Email</label>
                                <input type="email" value={bookingData.customerEmail} onChange={(e) => setBookingData({ ...bookingData, customerEmail: e.target.value })} placeholder="Nhập email (không bắt buộc)" />
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formField}>
                                    <label>Ngày đặt <span className={styles.required}>*</span></label>
                                    <input type="date" value={bookingData.reservationDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setBookingData({ ...bookingData, reservationDate: e.target.value })} required />
                                </div>
                                <div className={styles.formField}>
                                    <label>Giờ đặt <span className={styles.required}>*</span></label>
                                    <input type="time" value={bookingData.reservationTime} onChange={(e) => setBookingData({ ...bookingData, reservationTime: e.target.value })} required />
                                </div>
                                <div className={styles.formField}>
                                    <label>Số khách</label>
                                    <input type="number" value={bookingData.numberOfGuests} onChange={(e) => setBookingData({ ...bookingData, numberOfGuests: parseInt(e.target.value) })} min="1" max="20" />
                                </div>
                            </div>
                            <div className={styles.formField}>
                                <label>Ghi chú</label>
                                <textarea value={bookingData.notes} onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })} rows={3} placeholder="Yêu cầu đặc biệt (nếu có)..." />
                            </div>
                            <div className={styles.modalFooter}>
                                <button type="button" onClick={handleCloseForm} className={styles.cancelModalBtn}>Hủy</button>
                                <button type="submit" disabled={loading} className={styles.submitModalBtn}>{loading ? "Đang xử lý..." : "Đặt bàn"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========== MODAL CHỈNH SỬA BÀN ========== */}
            {showEditTableModal && editingTable && (
                <div className={styles.modalOverlay} onClick={() => setShowEditTableModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalTitle}><Edit size={20} /><h3>Chỉnh sửa bàn</h3></div>
                            <button onClick={() => setShowEditTableModal(false)} className={styles.modalClose}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdateTable} className={styles.modalForm}>
                            <div className={styles.formField}>
                                <label>Số bàn <span className={styles.required}>*</span></label>
                                <input type="text" value={editTableData.number} onChange={(e) => setEditTableData({ ...editTableData, number: e.target.value })} required />
                            </div>
                            <div className={styles.formField}>
                                <label>Sức chứa (người) <span className={styles.required}>*</span></label>
                                <input type="number" value={editTableData.capacity} onChange={(e) => setEditTableData({ ...editTableData, capacity: parseInt(e.target.value) })} min="1" max="20" required />
                            </div>
                            <div className={styles.formField}>
                                <label>Loại bàn</label>
                                <select value={editTableData.type} onChange={(e) => setEditTableData({ ...editTableData, type: e.target.value })}>
                                    <option value="Standard">Standard</option>
                                    <option value="VIP">VIP</option>
                                    <option value="Gần cửa sổ">Gần cửa sổ</option>
                                    <option value="Phòng riêng">Phòng riêng</option>
                                </select>
                            </div>
                            <div className={styles.formField}>
                                <label>Trạng thái</label>
                                <select value={editTableData.status} onChange={(e) => setEditTableData({ ...editTableData, status: e.target.value })}>
                                    <option value="FREE">Trống</option>
                                    <option value="OCCUPIED">Đã có khách</option>
                                    <option value="RESERVED">Đã đặt trước</option>
                                </select>
                            </div>
                            <div className={styles.modalFooter}>
                                <button type="button" onClick={() => setShowEditTableModal(false)} className={styles.cancelModalBtn}>Hủy</button>
                                <button type="submit" className={styles.submitModalBtn}>Lưu thay đổi</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingPage;