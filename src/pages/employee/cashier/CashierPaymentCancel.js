import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CashierPaymentCancel = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Xóa params khỏi URL
        window.history.replaceState({}, document.title, window.location.pathname);

        // Lấy thông tin thanh toán tạm thời
        const tempPaymentData = sessionStorage.getItem('tempCashierPayment');
        console.log("Payment cancelled, temp data:", tempPaymentData);

        // Xóa tất cả dữ liệu liên quan đến thanh toán
        sessionStorage.removeItem('tempCashierPayment');
        sessionStorage.removeItem('lastEntity');

        // Đánh dấu để hiển thị thông báo
        sessionStorage.setItem('paymentCancelledMessage', 'true');

        setTimeout(() => {
            sessionStorage.removeItem('paymentCancelledMessage');
            navigate('/cashier/tables', { replace: true });
        }, 1500);
    }, [navigate]);

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"
        }}>
            <div style={{
                background: "white",
                padding: "40px 60px",
                borderRadius: "16px",
                textAlign: "center"
            }}>
                <div style={{ fontSize: "72px" }}>❌</div>
                <h1 style={{ color: "#dc3545" }}>Thanh toán đã bị hủy</h1>
                <p>Đang quay lại trang quản lý bàn...</p>
            </div>
        </div>
    );
};

export default CashierPaymentCancel;