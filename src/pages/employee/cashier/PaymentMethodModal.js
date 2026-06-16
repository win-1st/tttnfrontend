import React, { useState } from "react";
import axiosClient from "../../../services/axiosClient";
import styles from "./TableDetail.module.css";

const PaymentMethodModal = ({ show, onClose, onSelect, orderId, totalAmount, entityNumber, entityType }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    if (!show) return null;

    const handleBankTransfer = async () => {
        setIsProcessing(true);
        try {
            const orderCode = Math.floor(Date.now() / 1000);

            // ✅ LƯU ĐÚNG paymentMethod
            sessionStorage.setItem('tempCashierPayment', JSON.stringify({
                orderId: orderId,
                totalAmount: totalAmount,
                entityNumber: entityNumber,
                entityType: entityType,
                paymentMethod: "BANKING"  // ← QUAN TRỌNG
            }));

            const cancelUrl = `${window.location.origin}/cashier/payment-cancel`;
            const returnUrl = `${window.location.origin}/cashier/payment-success?orderId=${orderId}&method=BANKING`;

            const response = await axiosClient.post('/payos/create', {
                orderCode: orderCode,
                amount: totalAmount,
                description: `TT ban ${entityNumber}`,
                returnUrl: returnUrl,
                cancelUrl: cancelUrl,
                items: []
            });

            if (response.data?.data?.checkoutUrl) {
                window.location.href = response.data.data.checkoutUrl;
            } else {
                alert('Không thể tạo link thanh toán');
            }
        } catch (error) {
            console.error('Lỗi thanh toán:', error);
            alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMomoPayment = async () => {
        setIsProcessing(true);
        try {
            const orderCode = Math.floor(Date.now() / 1000);

            // ✅ LƯU ĐÚNG paymentMethod
            sessionStorage.setItem('tempCashierPayment', JSON.stringify({
                orderId: orderId,
                totalAmount: totalAmount,
                entityNumber: entityNumber,
                entityType: entityType,
                paymentMethod: "MOMO"  // ← QUAN TRỌNG
            }));

            const cancelUrl = `${window.location.origin}/cashier/payment-cancel`;
            const returnUrl = `${window.location.origin}/cashier/payment-success?orderId=${orderId}&method=MOMO`;

            const response = await axiosClient.post('/payos/create', {
                orderCode: orderCode,
                amount: totalAmount,
                description: `TT ban ${entityNumber}`,
                returnUrl: returnUrl,
                cancelUrl: cancelUrl,
                items: []
            });

            if (response.data?.data?.checkoutUrl) {
                window.location.href = response.data.data.checkoutUrl;
            } else {
                alert('Không thể tạo thanh toán Momo');
            }
        } catch (error) {
            console.error('Lỗi thanh toán Momo:', error);
            alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>Chọn phương thức thanh toán</h3>
                    <button onClick={onClose} className={styles.modalClose}>✕</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                    <button
                        onClick={() => onSelect("cash")}
                        className={styles.orderBtn}
                        style={{ background: "#10b981" }}
                        disabled={isProcessing}
                    >
                        💵 Tiền mặt
                    </button>

                    <button
                        onClick={handleMomoPayment}
                        className={styles.orderBtn}
                        style={{ background: "#a50064" }}
                        disabled={isProcessing}
                    >
                        {isProcessing ? "Đang xử lý..." : "🟣 Momo"}
                    </button>

                    <button
                        onClick={handleBankTransfer}
                        className={styles.orderBtn}
                        style={{ background: "#0d6efd" }}
                        disabled={isProcessing}
                    >
                        {isProcessing ? "Đang xử lý..." : "🏦 Chuyển khoản ngân hàng"}
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className={styles.printBtn}
                    style={{ marginTop: "16px", background: "#6c757d" }}
                    disabled={isProcessing}
                >
                    Hủy
                </button>
            </div>
        </div>
    );
};

export default PaymentMethodModal;