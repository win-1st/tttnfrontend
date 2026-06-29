// pages/client/WalletPage.js
import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, History, CreditCard, DollarSign, Award } from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import ToastNotification from '../../components/ToastNotification';
import './WalletPage.css';

const WalletPage = () => {
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = "info", duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchWalletInfo();
            fetchTransactions();
        } else {
            showToast('Vui lòng đăng nhập để xem điểm thưởng', 'error');
            setLoading(false);
            setWallet({ totalPoints: 0 });
        }
    }, []);

    const fetchWalletInfo = async () => {
        try {
            const response = await axiosClient.get('/customer-points/me');
            console.log('Wallet response:', response.data);

            // ✅ Lấy data từ response
            const responseData = response.data;
            if (responseData?.success) {
                // ✅ Nếu data có totalPoints thì dùng, không thì tạo mới
                if (responseData.data) {
                    setWallet(responseData.data);
                    console.log('Wallet set:', responseData.data);
                } else {
                    setWallet({ totalPoints: 0 });
                }
            } else {
                setWallet({ totalPoints: 0 });
            }
        } catch (error) {
            console.error('Error fetching wallet:', error);
            if (error.response?.status === 401) {
                showToast('Vui lòng đăng nhập để xem điểm thưởng', 'error');
            } else {
                showToast('Không thể tải thông tin điểm thưởng', 'error');
            }
            setWallet({ totalPoints: 0 });
        }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get('/customer-points/transactions');
            console.log('Transactions response:', response.data);

            const responseData = response.data;
            if (responseData?.success) {
                setTransactions(responseData.data || []);
            } else {
                setTransactions([]);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            if (error.response?.status === 401) {
                showToast('Vui lòng đăng nhập để xem lịch sử giao dịch', 'error');
            }
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return "0đ";
        return amount.toLocaleString('vi-VN') + 'đ';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '---';
        try {
            return new Date(dateString).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '---';
        }
    };

    const getTransactionIcon = (type) => {
        switch (type) {
            case 'EARN':
                return <TrendingUp size={20} color="#10B981" />;
            case 'REDEEM':
                return <DollarSign size={20} color="#EF4444" />;
            case 'BONUS':
                return <Award size={20} color="#F59E0B" />;
            default:
                return <CreditCard size={20} color="#6B7280" />;
        }
    };

    const getTransactionTitle = (type, description) => {
        if (description) return description;
        switch (type) {
            case 'EARN':
                return 'Tích điểm từ hóa đơn';
            case 'REDEEM':
                return 'Đổi điểm thưởng';
            case 'BONUS':
                return 'Thưởng điểm';
            default:
                return 'Giao dịch';
        }
    };

    return (
        <div className="wallet-page">
            <div className="wallet-container">
                <div className="wallet-header">
                    <h1>Ví của tôi</h1>
                    <p>Quản lý điểm thưởng và lịch sử giao dịch</p>
                </div>

                {/* Wallet Card */}
                <div className="wallet-card">
                    <div className="wallet-card-header">
                        <div className="wallet-icon">
                            <Wallet size={32} />
                        </div>
                        <h2>Điểm thưởng</h2>
                    </div>
                    <div className="wallet-balance">
                        {/* ✅ Đổi từ points -> totalPoints */}
                        <span className="balance-amount">{wallet?.totalPoints?.toLocaleString('vi-VN') || 0}</span>
                        <span className="balance-label">điểm</span>
                    </div>
                    <div className="wallet-note">
                        <CreditCard size={14} />
                        <span>1000đ = 1 điểm | 100 điểm = 10,000đ</span>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="transaction-section">
                    <div className="section-header">
                        <History size={20} />
                        <h3>Lịch sử giao dịch</h3>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Đang tải lịch sử giao dịch...</p>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📭</div>
                            <p>Chưa có giao dịch nào</p>
                            <span className="empty-hint">Hãy đặt bàn hoặc mua sản phẩm để tích điểm</span>
                        </div>
                    ) : (
                        <div className="transaction-list">
                            {transactions.map(tx => (
                                <div key={tx.id} className="transaction-item">
                                    <div className="transaction-icon">
                                        {getTransactionIcon(tx.type)}
                                    </div>
                                    <div className="transaction-info">
                                        <div className="transaction-title">
                                            {getTransactionTitle(tx.type, tx.description)}
                                        </div>
                                        <div className="transaction-date">
                                            {formatDate(tx.createdAt)}
                                        </div>
                                    </div>
                                    <div className={`transaction-amount ${tx.type === 'EARN' || tx.type === 'BONUS' ? 'positive' : 'negative'}`}>
                                        {tx.type === 'EARN' || tx.type === 'BONUS' ? '+' : '-'}
                                        {tx.points?.toLocaleString('vi-VN') || 0} điểm
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info Note */}
                <div className="info-note">
                    <p>💡 Cách tích điểm:</p>
                    <ul>
                        <li>✓ Mỗi 10,000đ chi tiêu được 1 điểm</li>
                        <li>✓ Điểm có thể đổi thành ưu đãi hoặc khuyến mãi</li>
                        <li>✓ Điểm sẽ hết hạn sau 12 tháng</li>
                    </ul>
                </div>
            </div>

            {/* Toast */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <ToastNotification
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    />
                ))}
            </div>
        </div>
    );
};

export default WalletPage;