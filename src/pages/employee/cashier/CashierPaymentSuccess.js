import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosClient from "../../../services/axiosClient";

// ✅ Hàm gửi thông báo
const sendNotification = (message, type = 'info') => {
    const notification = {
        id: Date.now(),
        message: message,
        type: type,
        time: new Date().toLocaleTimeString('vi-VN'),
        read: false,
        timestamp: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem('notifications') || '[]');
    const updated = [notification, ...existing].slice(0, 50);
    localStorage.setItem('notifications', JSON.stringify(updated));

    window.dispatchEvent(new CustomEvent('newNotification', {
        detail: notification
    }));
};

const CashierPaymentSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState("processing");

    useEffect(() => {
        const processPayment = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error("No token found, redirecting to login");
                    navigate('/login', { replace: true });
                    return;
                }

                let orderId = searchParams.get('orderId');
                let method = searchParams.get('method');

                console.log("💰 Payment success - Order ID:", orderId);
                console.log("Method from URL:", method);

                const tempPaymentData = sessionStorage.getItem('tempCashierPayment');
                let paymentData = null;

                if (tempPaymentData) {
                    paymentData = JSON.parse(tempPaymentData);
                    console.log("Payment data from session:", paymentData);
                }

                const finalOrderId = orderId || paymentData?.orderId;
                let finalMethod = method || paymentData?.paymentMethod || "CASH";
                const customerPhone = paymentData?.customerPhone || null;
                const entityNumber = paymentData?.entityNumber || 'N/A';
                const totalAmount = paymentData?.totalAmount || 0;

                // ✅ MAP METHOD
                const methodMapping = {
                    'BANKING': 'PAYOS',
                    'PAYOS': 'PAYOS',
                    'MOMO': 'MOMO',
                    'CASH': 'CASH'
                };

                finalMethod = methodMapping[finalMethod] || 'CASH';

                console.log(`Processing payment: orderId=${finalOrderId}, method=${finalMethod}, customerPhone=${customerPhone}`);

                // ✅ GỌI API TẠO BILL
                const response = await axiosClient.post(`/bills/create`, null, {
                    params: {
                        orderId: finalOrderId,
                        method: finalMethod,
                        customerPhone: customerPhone
                    },
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                console.log("✅ Bill created:", response.data);

                // ✅ GỬI THÔNG BÁO THANH TOÁN THÀNH CÔNG
                const billData = response.data?.data || response.data || {};
                const finalTotal = billData.totalAmount || totalAmount;

                sendNotification(
                    `💰 Thanh toán thành công bàn ${entityNumber} - ${finalTotal.toLocaleString('vi-VN')}đ`,
                    'success'
                );

                // Nếu có khách hàng, gửi thêm thông báo tích điểm
                if (customerPhone) {
                    const pointsEarned = Math.floor(finalTotal / 10000);
                    if (pointsEarned > 0) {
                        sendNotification(
                            `⭐ Khách hàng ${customerPhone} được cộng ${pointsEarned} điểm`,
                            'info'
                        );
                    }
                }

                sessionStorage.removeItem('tempCashierPayment');
                sessionStorage.removeItem('lastEntity');

                setStatus("success");

                setTimeout(() => {
                    navigate('/cashier/tables', { replace: true });
                }, 1500);

            } catch (error) {
                console.error("Error processing payment:", error);
                console.error("Error response:", error.response?.data);

                // ✅ GỬI THÔNG BÁO LỖI
                sendNotification(
                    `❌ Lỗi thanh toán: ${error.response?.data?.message || error.message}`,
                    'error'
                );

                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login', { replace: true });
                    return;
                }

                setStatus("error");
                setTimeout(() => {
                    navigate('/cashier/tables', { replace: true });
                }, 1500);
            }
        };

        processPayment();
    }, [navigate, searchParams]);

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        }}>
            <div style={{
                background: "white",
                padding: "40px 60px",
                borderRadius: "16px",
                textAlign: "center",
                boxShadow: "0 10px 40px rgba(0,0,0,0.1)"
            }}>
                {status === "processing" && (
                    <>
                        <div style={{ fontSize: "48px", marginBottom: "20px" }}>⏳</div>
                        <h1>Đang xử lý thanh toán...</h1>
                        <p style={{ color: "#666", marginTop: "20px" }}>Vui lòng chờ trong giây lát.</p>
                    </>
                )}
                {status === "success" && (
                    <>
                        <div style={{ fontSize: "72px", marginBottom: "20px" }}>✅</div>
                        <h1 style={{ color: "#28a745", marginBottom: "10px" }}>Thanh toán thành công!</h1>
                        <p style={{ color: "#666" }}>Đã trừ tồn kho và giải phóng bàn.</p>
                        <p style={{ color: "#666", marginTop: "20px" }}>Đang quay lại trang quản lý bàn...</p>
                    </>
                )}
                {status === "error" && (
                    <>
                        <div style={{ fontSize: "72px", marginBottom: "20px" }}>❌</div>
                        <h1 style={{ color: "#dc3545", marginBottom: "10px" }}>Có lỗi xảy ra!</h1>
                        <p style={{ color: "#666" }}>Vui lòng kiểm tra lại đơn hàng.</p>
                        <p style={{ color: "#666", marginTop: "20px" }}>Đang quay lại trang quản lý bàn...</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default CashierPaymentSuccess;