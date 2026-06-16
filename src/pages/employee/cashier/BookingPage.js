import React, { useState, useEffect } from "react";
import { Calendar, Clock, Users, Phone, User, Mail, MapPin, X, Check, AlertCircle, Search, LogIn, Edit, ChevronDown } from "lucide-react";
import axiosClient from "../../../services/axiosClient";
import styles from "./BookingPage.module.css";

const BookingPage = () => {
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

    // State cho tab hiện tại: 'booking' hoặc 'list'
    const [activeTab, setActiveTab] = useState("booking");

    // State cho chỉnh sửa bàn
    const [showEditTableModal, setShowEditTableModal] = useState(false);
    const [editingTable, setEditingTable] = useState(null);
    const [editTableData, setEditTableData] = useState({
        number: "",
        capacity: "",
        type: "",
        status: ""
    });

    // State cho modal xác nhận
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmData, setConfirmData] = useState(null);

    // State cho dropdown chọn bàn
    const [showTableDropdown, setShowTableDropdown] = useState(false);
    const [searchTable, setSearchTable] = useState("");

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

    const showToast = (text, type = "success") => {
        setToast({ show: true, text, type });
        setTimeout(() => {
            setToast({ show: false, text: "", type: "" });
        }, 3000);
    };

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
                params: {
                    tableId: tableId,
                    date: date,
                    time: time,
                    durationHours: 2
                }
            });
            return response.data?.data?.available;
        } catch (error) {
            return false;
        }
    };

    // Khi click vào bàn trống, mở form và tự động chọn bàn
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
        setBookingData(prev => ({
            ...prev,
            tableId: table.id,
            numberOfGuests: table.capacity || prev.numberOfGuests
        }));
        setShowTableDropdown(false);
        setSearchTable("");
        showToast(`Đã chọn bàn ${table.number}`, "success");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!bookingData.customerName.trim()) {
            showToast("Vui lòng nhập tên khách hàng", "error");
            return;
        }

        if (!bookingData.customerPhone.trim()) {
            showToast("Vui lòng nhập số điện thoại", "error");
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        if (bookingData.reservationDate < today) {
            showToast("Không thể đặt bàn trong quá khứ", "error");
            return;
        }

        const hour = parseInt(bookingData.reservationTime.split(':')[0]);
        if (hour < 6 || hour > 22) {
            showToast("Chỉ có thể đặt bàn từ 6h đến 22h", "error");
            return;
        }

        if (!bookingData.tableId && !selectedTable) {
            showToast("Vui lòng chọn bàn", "error");
            return;
        }

        const tableId = bookingData.tableId || selectedTable?.id;
        const isAvailable = await checkAvailability(tableId, bookingData.reservationDate, bookingData.reservationTime);

        if (!isAvailable) {
            showToast("Bàn đã được đặt vào khung giờ này", "error");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                tableId: tableId,
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
                    tableId: "",
                    customerName: user?.fullName || "",
                    customerPhone: user?.phone || "",
                    customerEmail: user?.email || "",
                    numberOfGuests: 4,
                    reservationDate: new Date().toISOString().split('T')[0],
                    reservationTime: "19:00",
                    notes: ""
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

    // Xác nhận đặt bàn (Confirm)
    const openConfirmModal = (reservationId, actionType) => {
        const reservation = reservations.find(r => r.id === reservationId);
        if (!reservation) {
            showToast("Không tìm thấy đặt bàn", "error");
            return;
        }
        setConfirmData(reservation);
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

    // Hủy đặt bàn với modal
    const handleCancelReservationWithModal = (reservationId) => {
        const reservation = reservations.find(r => r.id === reservationId);
        if (!reservation) {
            showToast("Không tìm thấy đặt bàn", "error");
            return;
        }
        setConfirmData(reservation);
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
        setEditTableData({
            number: table.number,
            capacity: table.capacity,
            type: table.type || "Standard",
            status: table.status
        });
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

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'PENDING': { text: 'Chờ xác nhận', color: '#f59e0b', bg: '#fef3c7', icon: '⏳' },
            'CONFIRMED': { text: 'Đã xác nhận', color: '#10b981', bg: '#d1fae5', icon: '✅' },
            'CHECKED_IN': { text: 'Đã đến', color: '#3b82f6', bg: '#dbeafe', icon: '📍' },
            'CANCELLED': { text: 'Đã hủy', color: '#ef4444', bg: '#fee2e2', icon: '❌' },
            'COMPLETED': { text: 'Hoàn thành', color: '#6b7280', bg: '#f3f4f6', icon: '✔️' },
            'NO_SHOW': { text: 'No-show', color: '#dc2626', bg: '#fef2f2', icon: '🚫' }
        };
        const s = statusMap[status] || { text: status, color: '#6b7280', bg: '#f3f4f6', icon: '📋' };
        return (
            <span className={styles.statusBadge} style={{ background: s.bg, color: s.color }}>
                {s.icon} {s.text}
            </span>
        );
    };

    const getTableStatusBadge = (status) => {
        const statusMap = {
            'FREE': { text: '🟢 Trống', color: '#10b981', bg: '#d1fae5' },
            'OCCUPIED': { text: '🔴 Đã có khách', color: '#ef4444', bg: '#fee2e2' },
            'RESERVED': { text: '🟡 Đã đặt trước', color: '#f59e0b', bg: '#fed7aa' }
        };
        const s = statusMap[status] || { text: status, color: '#6b7280', bg: '#f3f4f6' };
        return (
            <span className={styles.tableStatusBadge} style={{ background: s.bg, color: s.color }}>
                {s.text}
            </span>
        );
    };

    const filteredTables = tables.filter(table =>
        table.number?.toString().includes(searchTable) ||
        table.tableName?.toLowerCase().includes(searchTable.toLowerCase())
    );

    const displayReservations = reservations.filter(r =>
        r.status !== 'COMPLETED' && r.status !== 'NO_SHOW'
    );

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

            {/* Modal Xác nhận */}
            {showConfirmModal && confirmData && (
                <div className={styles.modalOverlay} onClick={() => setShowConfirmModal(false)}>
                    <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.confirmModalHeader}>
                            <div className={styles.confirmIcon}>
                                {confirmAction === "confirm" ? "✅" : "⚠️"}
                            </div>
                            <h3>{confirmAction === "confirm" ? "Xác nhận đặt bàn" : "Xác nhận hủy đặt bàn"}</h3>
                        </div>
                        <div className={styles.confirmModalBody}>
                            <p>
                                {confirmAction === "confirm"
                                    ? `Bạn có chắc chắn muốn xác nhận đặt bàn cho khách hàng?`
                                    : `Bạn có chắc chắn muốn hủy đặt bàn này?`}
                            </p>
                            <div className={styles.confirmInfo}>
                                <div className={styles.confirmInfoRow}>
                                    <strong>Bàn:</strong> <span>{confirmData.tableNumber}</span>
                                </div>
                                <div className={styles.confirmInfoRow}>
                                    <strong>Khách hàng:</strong> <span>{confirmData.customerName}</span>
                                </div>
                                <div className={styles.confirmInfoRow}>
                                    <strong>Số điện thoại:</strong> <span>{confirmData.customerPhone}</span>
                                </div>
                                <div className={styles.confirmInfoRow}>
                                    <strong>Thời gian:</strong> <span>{confirmData.reservationTime} - {formatDate(confirmData.reservationDate)}</span>
                                </div>
                                <div className={styles.confirmInfoRow}>
                                    <strong>Số khách:</strong> <span>{confirmData.numberOfGuests} người</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.confirmModalFooter}>
                            <button
                                className={styles.confirmCancelBtn}
                                onClick={() => setShowConfirmModal(false)}
                            >
                                Hủy
                            </button>
                            <button
                                className={confirmAction === "confirm" ? styles.confirmOkBtn : styles.confirmCancelActionBtn}
                                onClick={confirmAction === "confirm" ? handleConfirmReservation : handleCancelReservation}
                            >
                                {confirmAction === "confirm" ? "Xác nhận" : "Hủy đặt bàn"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2>🍽️ Quản lý đặt bàn</h2>
                    <p>Quản lý và xác nhận đặt bàn cho khách hàng</p>
                </div>
                <button onClick={handleOpenForm} className={styles.addBtn}>
                    <span>+</span> Đặt bàn mới
                </button>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tabBtn} ${activeTab === "booking" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("booking")}
                >
                    <Calendar size={18} />
                    <span>Đặt bàn mới</span>
                </button>

                <button
                    className={`${styles.tabBtn} ${activeTab === "list" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("list")}
                >
                    <Users size={18} />
                    <span>Danh sách đặt bàn</span>
                    {displayReservations.length > 0 && (
                        <span className={styles.tabBadge}>{displayReservations.length}</span>
                    )}
                </button>
            </div>

            {/* Tab Đặt bàn mới */}
            {activeTab === "booking" && (
                <div className={styles.bookingTab}>
                    <div className={styles.sectionHeader}>
                        <h3>🍽️ Chọn bàn nhanh</h3>
                        <p>Click vào bàn trống để đặt - Bàn đỏ đang có khách</p>
                    </div>
                    <div className={styles.tablesGrid}>
                        {tables.map(table => (
                            <div
                                key={table.id}
                                className={`${styles.tableCard} ${table.status !== 'FREE' ? styles.occupied : ''}`}
                            >
                                <div className={styles.tableCardHeader}>
                                    <div className={styles.tableNumber}>Bàn {table.number}</div>
                                    <button
                                        onClick={() => handleEditTable(table)}
                                        className={styles.editTableBtn}
                                        title="Sửa bàn"
                                    >
                                        <Edit size={14} />
                                    </button>
                                </div>
                                <div className={styles.tableDetails}>
                                    <div className={styles.tableDetail}>
                                        <Users size={14} />
                                        <span>{table.capacity || 4} người</span>
                                    </div>
                                    <div className={styles.tableDetail}>
                                        <MapPin size={14} />
                                        <span>{table.type || 'Standard'}</span>
                                    </div>
                                </div>
                                <div className={styles.tableStatusWrapper}>
                                    {getTableStatusBadge(table.status)}
                                </div>
                                {table.status === 'FREE' && (
                                    <button
                                        onClick={() => handleSelectTableAndOpenForm(table)}
                                        className={styles.bookBtn}
                                    >
                                        Đặt bàn ngay
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab Danh sách đặt bàn */}
            {activeTab === "list" && (
                <div className={styles.listTab}>
                    <div className={styles.sectionHeader}>
                        <h3>📋 Danh sách đặt bàn</h3>
                        <p>Quản lý và xử lý các đơn đặt bàn</p>
                    </div>
                    {displayReservations.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>📭</div>
                            <h4>Chưa có đặt bàn nào</h4>
                            <p>Hiện tại chưa có đơn đặt bàn nào cần xử lý</p>
                            <button onClick={handleOpenForm} className={styles.emptyBtn}>
                                + Đặt bàn ngay
                            </button>
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
                                            <div className={styles.infoRow}>
                                                <User size={14} />
                                                <span>{res.customerName}</span>
                                            </div>
                                            <div className={styles.infoRow}>
                                                <Phone size={14} />
                                                <span>{res.customerPhone}</span>
                                            </div>
                                            <div className={styles.infoRow}>
                                                <Clock size={14} />
                                                <span>{res.reservationTime} - {formatDate(res.reservationDate)}</span>
                                            </div>
                                            <div className={styles.infoRow}>
                                                <Users size={14} />
                                                <span>{res.numberOfGuests} khách</span>
                                            </div>
                                        </div>
                                        {res.notes && (
                                            <div className={styles.reservationNotes}>
                                                <span>📝 Ghi chú:</span>
                                                <p>{res.notes}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.reservationCardFooter}>
                                        {res.status === 'PENDING' && (
                                            <button
                                                onClick={() => openConfirmModal(res.id, "confirm")}
                                                disabled={confirming === res.id}
                                                className={`${styles.actionBtn} ${styles.confirmAction}`}
                                            >
                                                <Check size={16} />
                                                {confirming === res.id ? "Đang xử lý..." : "Xác nhận"}
                                            </button>
                                        )}

                                        {res.status === 'CONFIRMED' && (
                                            <button
                                                onClick={() => handleCheckIn(res.id)}
                                                disabled={checkingIn === res.id}
                                                className={`${styles.actionBtn} ${styles.checkinAction}`}
                                            >
                                                <LogIn size={16} />
                                                {checkingIn === res.id ? "Đang xử lý..." : "Check-in"}
                                            </button>
                                        )}

                                        {res.status !== 'CHECKED_IN' && res.status !== 'CANCELLED' && res.status !== 'COMPLETED' && (
                                            <button
                                                onClick={() => handleCancelReservationWithModal(res.id)}
                                                className={`${styles.actionBtn} ${styles.cancelAction}`}
                                            >
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

            {/* Modal Đặt bàn mới */}
            {showForm && (
                <div className={styles.modalOverlay} onClick={handleCloseForm}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalTitle}>
                                <Calendar size={20} />
                                <h3>Đặt bàn mới</h3>
                            </div>
                            <button onClick={handleCloseForm} className={styles.modalClose}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            {/* Chọn bàn - Dropdown style */}
                            <div className={styles.formField}>
                                <label>Chọn bàn <span className={styles.required}>*</span></label>
                                <div className={styles.tableSelectWrapper}>
                                    <div
                                        className={styles.tableSelectTrigger}
                                        onClick={() => setShowTableDropdown(!showTableDropdown)}
                                    >
                                        <span>
                                            {selectedTable
                                                ? `Bàn ${selectedTable.number} - ${selectedTable.capacity} chỗ - ${selectedTable.type || 'Standard'}`
                                                : "-- Chọn bàn --"}
                                        </span>
                                        <ChevronDown size={16} className={showTableDropdown ? styles.rotated : ""} />
                                    </div>

                                    {showTableDropdown && (
                                        <div className={styles.tableDropdown}>
                                            <div className={styles.dropdownSearch}>
                                                <Search size={14} />
                                                <input
                                                    type="text"
                                                    placeholder="Tìm bàn..."
                                                    value={searchTable}
                                                    onChange={(e) => setSearchTable(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                            <div className={styles.dropdownList}>
                                                {filteredTables.length === 0 ? (
                                                    <div className={styles.dropdownEmpty}>Không tìm thấy bàn</div>
                                                ) : (
                                                    filteredTables.map(table => (
                                                        <div
                                                            key={table.id}
                                                            className={`${styles.dropdownItem} ${selectedTable?.id === table.id ? styles.selected : ''} ${table.status !== 'FREE' ? styles.disabled : ''}`}
                                                            onClick={() => handleSelectTableFromDropdown(table)}
                                                        >
                                                            <div className={styles.dropdownItemInfo}>
                                                                <strong>Bàn {table.number}</strong>
                                                                <span>{table.capacity} chỗ</span>
                                                                <span>{table.type || 'Standard'}</span>
                                                            </div>
                                                            <div className={table.status === 'FREE' ? styles.availableTag : styles.unavailableTag}>
                                                                {table.status === 'FREE' ? 'Trống' : 'Đã có khách'}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {selectedTable && (
                                    <p className={styles.selectedHint}>✅ Đã chọn bàn {selectedTable.number}</p>
                                )}
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formField}>
                                    <label>Tên khách hàng <span className={styles.required}>*</span></label>
                                    <input
                                        type="text"
                                        value={bookingData.customerName}
                                        onChange={(e) => setBookingData({ ...bookingData, customerName: e.target.value })}
                                        placeholder="Nhập tên khách hàng"
                                        required
                                    />
                                </div>

                                <div className={styles.formField}>
                                    <label>Số điện thoại <span className={styles.required}>*</span></label>
                                    <input
                                        type="tel"
                                        value={bookingData.customerPhone}
                                        onChange={(e) => setBookingData({ ...bookingData, customerPhone: e.target.value })}
                                        placeholder="Nhập số điện thoại"
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.formField}>
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={bookingData.customerEmail}
                                    onChange={(e) => setBookingData({ ...bookingData, customerEmail: e.target.value })}
                                    placeholder="Nhập email (không bắt buộc)"
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formField}>
                                    <label>Ngày đặt <span className={styles.required}>*</span></label>
                                    <input
                                        type="date"
                                        value={bookingData.reservationDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setBookingData({ ...bookingData, reservationDate: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className={styles.formField}>
                                    <label>Giờ đặt <span className={styles.required}>*</span></label>
                                    <input
                                        type="time"
                                        value={bookingData.reservationTime}
                                        onChange={(e) => setBookingData({ ...bookingData, reservationTime: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className={styles.formField}>
                                    <label>Số khách</label>
                                    <input
                                        type="number"
                                        value={bookingData.numberOfGuests}
                                        onChange={(e) => setBookingData({ ...bookingData, numberOfGuests: parseInt(e.target.value) })}
                                        min="1"
                                        max="20"
                                    />
                                </div>
                            </div>

                            <div className={styles.formField}>
                                <label>Ghi chú</label>
                                <textarea
                                    value={bookingData.notes}
                                    onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                                    rows={3}
                                    placeholder="Yêu cầu đặc biệt (nếu có)..."
                                />
                            </div>

                            <div className={styles.modalFooter}>
                                <button type="button" onClick={handleCloseForm} className={styles.cancelModalBtn}>
                                    Hủy
                                </button>
                                <button type="submit" disabled={loading} className={styles.submitModalBtn}>
                                    {loading ? "Đang xử lý..." : "Đặt bàn"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal chỉnh sửa bàn */}
            {showEditTableModal && editingTable && (
                <div className={styles.modalOverlay} onClick={() => setShowEditTableModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalTitle}>
                                <Edit size={20} />
                                <h3>Chỉnh sửa bàn</h3>
                            </div>
                            <button onClick={() => setShowEditTableModal(false)} className={styles.modalClose}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateTable} className={styles.modalForm}>
                            <div className={styles.formField}>
                                <label>Số bàn <span className={styles.required}>*</span></label>
                                <input
                                    type="text"
                                    value={editTableData.number}
                                    onChange={(e) => setEditTableData({ ...editTableData, number: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formField}>
                                <label>Sức chứa (người) <span className={styles.required}>*</span></label>
                                <input
                                    type="number"
                                    value={editTableData.capacity}
                                    onChange={(e) => setEditTableData({ ...editTableData, capacity: parseInt(e.target.value) })}
                                    min="1"
                                    max="20"
                                    required
                                />
                            </div>

                            <div className={styles.formField}>
                                <label>Loại bàn</label>
                                <select
                                    value={editTableData.type}
                                    onChange={(e) => setEditTableData({ ...editTableData, type: e.target.value })}
                                >
                                    <option value="Standard">Standard</option>
                                    <option value="VIP">VIP</option>
                                    <option value="Gần cửa sổ">Gần cửa sổ</option>
                                    <option value="Phòng riêng">Phòng riêng</option>
                                </select>
                            </div>

                            <div className={styles.formField}>
                                <label>Trạng thái</label>
                                <select
                                    value={editTableData.status}
                                    onChange={(e) => setEditTableData({ ...editTableData, status: e.target.value })}
                                >
                                    <option value="FREE">Trống</option>
                                    <option value="OCCUPIED">Đã có khách</option>
                                    <option value="RESERVED">Đã đặt trước</option>
                                </select>
                            </div>

                            <div className={styles.modalFooter}>
                                <button type="button" onClick={() => setShowEditTableModal(false)} className={styles.cancelModalBtn}>
                                    Hủy
                                </button>
                                <button type="submit" className={styles.submitModalBtn}>
                                    Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingPage;