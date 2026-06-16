import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosClient from "../../../services/axiosClient";

const CashierPaymentSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState("processing");

    useEffect(() => {
        const processPayment = async () => {
            try {
                // Lấy orderId và method từ URL
                let orderId = searchParams.get('orderId');
                let method = searchParams.get('method');

                console.log("💰 Payment success - Order ID:", orderId);
                console.log("Method from URL:", method);

                // Lấy từ sessionStorage nếu URL không có
                const tempPaymentData = sessionStorage.getItem('tempCashierPayment');
                let paymentData = null;

                if (tempPaymentData) {
                    paymentData = JSON.parse(tempPaymentData);
                    console.log("Payment data from session:", paymentData);
                }

                // Xác định orderId và method
                const finalOrderId = orderId || paymentData?.orderId;
                const finalMethod = method || paymentData?.paymentMethod || "BANKING";

                if (!finalOrderId) {
                    console.error("No orderId found");
                    setStatus("error");
                    // Đánh dấu lỗi
                    sessionStorage.setItem('paymentErrorMessage', 'true');
                    setTimeout(() => {
                        navigate('/cashier/tables', { replace: true });
                    }, 1500);
                    return;
                }

                console.log(`Processing payment: orderId=${finalOrderId}, method=${finalMethod}`);

                // Gọi API tạo bill và thanh toán
                const response = await axiosClient.post(`/bills/create`, null, {
                    params: {
                        orderId: finalOrderId,
                        method: finalMethod
                    }
                });

                console.log("✅ Bill created:", response.data);

                // Xóa session storage
                sessionStorage.removeItem('tempCashierPayment');
                sessionStorage.removeItem('lastEntity');

                // ✅ Đánh dấu thanh toán thành công (để hiển thị toast)
                sessionStorage.setItem('paymentSuccessMessage', 'true');

                setStatus("success");

                // Chuyển về trang tables sau 1.5 giây (giống như hủy)
                setTimeout(() => {
                    navigate('/cashier/tables', { replace: true });
                }, 1500);

            } catch (error) {
                console.error("Error processing payment:", error);
                console.error("Error response:", error.response?.data);
                setStatus("error");
                // Đánh dấu lỗi
                sessionStorage.setItem('paymentErrorMessage', 'true');
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