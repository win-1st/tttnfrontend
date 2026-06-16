import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, PlusCircle, Clock } from "lucide-react";
import axiosClient from "../../../services/axiosClient";


const TablesPage = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const intervalRef = useRef(null);

    // Format thời gian - chỉ hiển thị giờ:phút:giây
    const formatTimeOnly = (dateTimeString) => {
        if (!dateTimeString) return null;

        try {
            const date = new Date(dateTimeString);
            if (isNaN(date.getTime())) return null;

            return date.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            console.error("Lỗi format thời gian:", error);
            return null;
        }
    };

    // Tính thời gian đã trôi qua (chỉ phút và giây)
    const getElapsedTime = (startTime) => {
        if (!startTime) return "";

        const start = new Date(startTime);
        const now = new Date();
        const diffSeconds = Math.floor((now - start) / 1000);

        const minutes = Math.floor(diffSeconds / 60);
        const seconds = diffSeconds % 60;

        if (minutes === 0) {
            return `${seconds} giây`;
        }

        return `${minutes} phút ${seconds} giây`;
    };

    // Fetch tất cả bàn
    const fetchTables = async () => {
        try {
            setLoading(true);
            console.log("📡 Gọi API: GET /tables");
            const response = await axiosClient.get("/tables");
            console.log("📦 Response:", response.data);

            let tablesData = [];
            if (response.data && response.data.success) {
                tablesData = response.data.data || [];
            } else if (Array.isArray(response.data)) {
                tablesData = response.data;
            }

            console.log("✅ Tables data:", tablesData);
            setTables(tablesData);
        } catch (err) {
            console.error("❌ Lỗi tải bàn:", err.response?.status, err.response?.data);
            setTables([]);
        } finally {
            setLoading(false);
        }
    };

    // Khởi tạo dữ liệu
    useEffect(() => {
        fetchTables();

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // Timer realtime - cập nhật UI mỗi giây mà không gọi API
    useEffect(() => {
        // Chỉ chạy timer nếu có bàn OCCUPIED
        const hasOccupiedTables = tables.some(table => table.status === "OCCUPIED");

        if (hasOccupiedTables) {
            if (!intervalRef.current) {
                intervalRef.current = setInterval(() => {
                    // Force re-render để cập nhật elapsed time
                    setTables(prevTables => [...prevTables]);
                }, 1000); // Cập nhật mỗi 1 giây
            }
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [tables]); // Re-run khi tables thay đổi

    const handleTableClick = (table) => {
        navigate(`/cashier/tables/${table.id}`, {
            state: { table: table }
        });
    };

    const getStatusText = (status) => {
        if (status === "FREE") return "Trống";
        if (status === "RESERVED") return "Đã đặt";
        if (status === "MAINTENANCE") return "Bảo trì";
        if (status === "WAITING_PAYMENT") return "Chờ thanh toán";
        return "Đã có khách";
    };

    const getStatusColor = (status) => {
        if (status === "FREE") return "#10b981";
        if (status === "RESERVED") return "#f59e0b";
        if (status === "MAINTENANCE") return "#6b7280";
        if (status === "WAITING_PAYMENT") return "#f59e0b";
        return "#ef4444";
    };

    // Lấy tên hiển thị của bàn
    const getTableDisplayName = (table) => {
        if (table.tableName) {
            return table.tableName;
        }
        return `Bàn ${table.number}`;
    };

    return (
        <div style={{
            padding: "20px",
            minHeight: "100vh",
            background: "linear-gradient(135deg, #f8faf5 0%, #f0f4ec 100%)"
        }}>
            <div style={{
                background: "white",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            }}>
                <h2 style={{ margin: 0, color: "#2c3e2f" }}>Quản lý bàn</h2>
                <p style={{ margin: "8px 0 0", color: "#8a9b8c", fontSize: "14px" }}>
                    Nhấp vào bàn để xem chi tiết hoặc thêm món
                </p>
            </div>

            {/* Tables Grid */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "60px" }}>
                    <div style={{
                        width: "48px",
                        height: "48px",
                        border: "4px solid #e2e8e0",
                        borderTopColor: "#d32f2f",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                        margin: "0 auto 20px"
                    }}></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            ) : tables.length === 0 ? (
                <div style={{
                    textAlign: "center",
                    padding: "60px",
                    background: "white",
                    borderRadius: "16px"
                }}>
                    <p>Không có bàn nào</p>
                </div>
            ) : (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "16px"
                }}>
                    {tables.map((table) => (
                        <div
                            key={table.id}
                            onClick={() => handleTableClick(table)}
                            style={{
                                position: "relative",
                                background: table.status === "FREE"
                                    ? "linear-gradient(135deg, #ffffff, #f8faf5)"
                                    : table.status === "RESERVED"
                                        ? "#fffbeb"
                                        : table.status === "MAINTENANCE"
                                            ? "#f3f4f6"
                                            : table.status === "WAITING_PAYMENT"
                                                ? "#fef3c7"
                                                : "#fff3e0",
                                borderRadius: "16px",
                                padding: "20px",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                border: `2px solid ${getStatusColor(table.status)}`,
                                textAlign: "center"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-4px)";
                                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.1)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
                            }}
                        >
                            {table.status !== "FREE" && table.status !== "MAINTENANCE" && (
                                <div style={{
                                    position: "absolute",
                                    top: "8px",
                                    right: "8px",
                                    background: "#10b981",
                                    color: "white",
                                    padding: "4px 8px",
                                    borderRadius: "20px",
                                    fontSize: "10px",
                                    fontWeight: "bold",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px"
                                }}>
                                    <PlusCircle size={10} />
                                    Thêm món
                                </div>
                            )}

                            <div style={{ fontSize: "40px", marginBottom: "8px" }}>
                                {table.status === "FREE" ? "🍽️" : table.status === "RESERVED" ? "📅" : table.status === "MAINTENANCE" ? "🔧" : table.status === "WAITING_PAYMENT" ? "💰" : "🎱"}
                            </div>

                            {/* TÊN BÀN */}
                            <div style={{
                                fontSize: "18px",
                                fontWeight: "bold",
                                color: "#2c3e2f"
                            }}>
                                {getTableDisplayName(table)}
                            </div>

                            {/* HIỂN THỊ SỐ BÀN */}
                            {table.tableName && table.number && (
                                <div style={{
                                    fontSize: "11px",
                                    color: "#8a9b8c",
                                    marginTop: "2px"
                                }}>
                                    Số {table.number}
                                </div>
                            )}

                            <div style={{
                                fontSize: "12px",
                                color: "#8a9b8c",
                                marginTop: "4px"
                            }}>
                                {table.type === "VIP" ? "🌟 VIP" : table.type === "PREMIUM" ? "⭐ Premium" : "Tiêu chuẩn"}
                            </div>

                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                marginTop: "8px",
                                fontSize: "13px",
                                color: getStatusColor(table.status)
                            }}>
                                {table.status === "FREE" ? (
                                    <CheckCircle size={14} />
                                ) : table.status === "RESERVED" ? (
                                    <Clock size={14} />
                                ) : (
                                    <XCircle size={14} />
                                )}
                                <span>{getStatusText(table.status)}</span>
                            </div>

                            {/* HIỂN THỊ THỜI GIAN BẮT ĐẦU - REALTIME */}
                            {table.status === "OCCUPIED" && table.startTime && (
                                <div style={{
                                    marginTop: "12px",
                                    padding: "10px",
                                    background: "rgba(239, 68, 68, 0.1)",
                                    borderRadius: "8px",
                                    borderLeft: `3px solid ${getStatusColor(table.status)}`
                                }}>
                                    <div style={{
                                        fontSize: "11px",
                                        color: "#666",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "6px",
                                        marginBottom: "6px"
                                    }}>
                                        <Clock size={12} />
                                        <span>Bắt đầu lúc:</span>
                                    </div>
                                    <div style={{
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        color: "#d32f2f",
                                        fontFamily: "monospace"
                                    }}>
                                        {formatTimeOnly(table.startTime)}
                                    </div>
                                    <div style={{
                                        fontSize: "14px",
                                        color: "#e65100",
                                        marginTop: "8px",
                                        padding: "6px",
                                        background: "rgba(255,255,255,0.6)",
                                        borderRadius: "6px",
                                        fontWeight: "bold",
                                        fontFamily: "monospace"
                                    }}>
                                        ⏱️ Đã: {getElapsedTime(table.startTime)}
                                    </div>
                                </div>
                            )}

                            {/* Hiển thị khi đang chờ thanh toán */}
                            {table.status === "WAITING_PAYMENT" && table.startTime && (
                                <div style={{
                                    marginTop: "12px",
                                    padding: "10px",
                                    background: "rgba(245, 158, 11, 0.1)",
                                    borderRadius: "8px",
                                    borderLeft: `3px solid #f59e0b`
                                }}>
                                    <div style={{
                                        fontSize: "11px",
                                        color: "#666",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "6px",
                                        marginBottom: "6px"
                                    }}>
                                        <Clock size={12} />
                                        <span>Tổng thời gian:</span>
                                    </div>
                                    <div style={{
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        color: "#f59e0b",
                                        fontFamily: "monospace"
                                    }}>
                                        {getElapsedTime(table.startTime)}
                                    </div>
                                    <div style={{
                                        fontSize: "11px",
                                        color: "#888",
                                        marginTop: "6px"
                                    }}>
                                        🧾 Chờ thanh toán
                                    </div>
                                </div>
                            )}

                            <div style={{
                                fontSize: "11px",
                                color: "#8a9b8c",
                                marginTop: "8px"
                            }}>
                                Sức chứa: {table.capacity || 4} người
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default TablesPage;