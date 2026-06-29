import React, { useEffect, useState } from 'react';
import {
    FileText, Download, DollarSign, CreditCard, Clock,
    CheckCircle, XCircle, AlertCircle, Calendar, Search,
    Eye, RefreshCw, ChevronLeft, ChevronRight,
    Receipt, Printer, Truck, User, Phone, Mail,
    Tag, Hash, Grid, List, Filter, Plus, Trash2
} from 'lucide-react';
import axios from 'axios';
import ToastNotification from '../../components/ToastNotification';

export default function BillsAndAuditSystem() {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [toast, setToast] = useState(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const API_BASE_URL = 'http://localhost:8080';

    const showToast = (message, type = 'info', duration = 3000) => {
        setToast({ message, type, duration });
        setTimeout(() => {
            setToast(null);
        }, duration);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const billsRes = await axios.get(`${API_BASE_URL}/api/bills/all`, { headers });

            let billsData = [];
            if (billsRes.data.success && billsRes.data.data) {
                billsData = billsRes.data.data;
            } else if (Array.isArray(billsRes.data)) {
                billsData = billsRes.data;
            } else if (billsRes.data.data && Array.isArray(billsRes.data.data)) {
                billsData = billsRes.data.data;
            } else {
                billsData = getMockBills();
            }

            setBills(billsData);
            setCurrentPage(1);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
            showToast('Không thể tải danh sách hóa đơn!', 'error');
            setBills(getMockBills());
        } finally {
            setLoading(false);
        }
    };

    const getMockBills = () => {
        return [
            {
                id: 1,
                orderId: 101,
                totalAmount: 250000,
                paymentMethod: 'CASH',
                paymentStatus: 'PAID',
                createdAt: '2024-12-01T10:30:00',
                issuedAt: '2024-12-01T10:35:00',
                tableNumber: 5,
                order: { id: 101, table: { number: 5 } },
                notes: 'Thanh toán thành công',
                items: [
                    { id: 1, quantity: 2, unitPrice: 50000, product: { name: 'Cà phê đen', price: 50000 } },
                    { id: 2, quantity: 1, unitPrice: 150000, product: { name: 'Bánh mì thịt nướng', price: 150000 } }
                ]
            },
            {
                id: 2,
                orderId: 102,
                totalAmount: 450000,
                paymentMethod: 'MOMO',
                paymentStatus: 'PAID',
                createdAt: '2024-12-02T14:20:00',
                issuedAt: '2024-12-02T14:25:00',
                tableNumber: 3,
                order: { id: 102, table: { number: 3 } },
                notes: '',
                items: [
                    { id: 3, quantity: 3, unitPrice: 150000, product: { name: 'Bò né', price: 150000 } }
                ]
            },
            {
                id: 3,
                orderId: 103,
                totalAmount: 180000,
                paymentMethod: 'CASH',
                paymentStatus: 'PENDING',
                createdAt: '2024-12-03T09:15:00',
                issuedAt: null,
                tableNumber: 8,
                order: { id: 103, table: { number: 8 } },
                notes: 'Chờ xác nhận',
                items: [
                    { id: 4, quantity: 2, unitPrice: 60000, product: { name: 'Trà sữa', price: 60000 } },
                    { id: 5, quantity: 1, unitPrice: 60000, product: { name: 'Khoai tây chiên', price: 60000 } }
                ]
            }
        ];
    };

    const exportBillPDF = async (billId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_BASE_URL}/api/bills/${billId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const bill = response.data.data || response.data;
            const pdfContent = generateBillHTML(bill);

            const blob = new Blob([pdfContent], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `bill_${billId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            showToast(`Đã xuất hóa đơn #${billId} thành công!`, 'success');
        } catch (error) {
            console.error('Lỗi khi xuất PDF:', error);
            showToast('Không thể xuất hóa đơn. Vui lòng thử lại!', 'error');
        }
    };

    const generateBillHTML = (bill) => {
        const originalTotal = getOriginalTotal(bill);
        const discountAmount = getDiscountAmount(bill);

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Hóa đơn #${bill.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .bill-info { margin-bottom: 20px; }
                    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .items-table th, .items-table td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
                    .items-table th { background: #f5f5f5; }
                    .total { font-size: 20px; font-weight: bold; color: #10B981; }
                    .text-right { text-align: right; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>HÓA ĐƠN THANH TOÁN</h1>
                    <p>Mã hóa đơn: #${bill.id}</p>
                </div>
                <div class="bill-info">
                    <p><strong>Mã đơn hàng:</strong> #${bill.orderId || bill.order?.id || 'N/A'}</p>
                    <p><strong>Bàn:</strong> ${bill.tableNumber || bill.order?.table?.number || bill.table?.number || '--'}</p>
                    <p><strong>Ngày tạo:</strong> ${formatDateTime(bill.createdAt)}</p>
                    <p><strong>Phương thức:</strong> ${getPaymentMethodText(bill.paymentMethod)}</p>
                    <p><strong>Trạng thái:</strong> ${getPaymentStatusText(bill.paymentStatus)}</p>
                </div>
                
                <h3>Danh sách món</h3>
                <table class="items-table">
                    <thead>
                        <tr><th>Tên món</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr>
                    </thead>
                    <tbody>
                        ${bill.items && bill.items.length > 0 ? bill.items.map(item => `
                            <tr>
                                <td>${item.product?.name || item.name || 'Món'}</td>
                                <td>${item.quantity}</td>
                                <td>${formatCurrency(item.unitPrice || item.price)}</td>
                                <td>${formatCurrency((item.unitPrice || item.price) * item.quantity)}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="4" style="text-align:center">Không có món nào</td></tr>'}
                    </tbody>
                </table>
                
                <div style="text-align: right">
                    <p>Tổng tiền món: ${formatCurrency(originalTotal)}</p>
                    ${discountAmount > 0 ? `<p style="color:#10b981">Khuyến mãi giảm: -${formatCurrency(discountAmount)}</p>` : ''}
                    <p class="total">THỰC THU: ${formatCurrency(bill.totalAmount)}</p>
                </div>
                <hr />
                <p style="text-align: center; color: #666; margin-top: 40px;">
                    Cảm ơn quý khách! Hẹn gặp lại!
                </p>
            </body>
            </html>
        `;
    };

    const handleViewDetail = async (bill) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_BASE_URL}/api/bills/${bill.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const billData = response.data.data || response.data;
            setSelectedBill(billData);
            setShowDetailModal(true);
        } catch (error) {
            console.error('Lỗi khi tải chi tiết:', error);
            setSelectedBill(bill);
            setShowDetailModal(true);
        }
    };

    const getOriginalTotal = (bill) => {
        if (bill.items && bill.items.length > 0) {
            return bill.items.reduce((sum, item) => sum + ((item.unitPrice || item.price || 0) * (item.quantity || 1)), 0);
        }
        return bill.totalAmount || 0;
    };

    const getDiscountAmount = (bill) => {
        const originalTotal = getOriginalTotal(bill);
        const finalTotal = bill.totalAmount || 0;
        return originalTotal - finalTotal;
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING': return <Clock size={14} />;
            case 'PAID': return <CheckCircle size={14} />;
            case 'FAILED': return <XCircle size={14} />;
            case 'REFUNDED': return <AlertCircle size={14} />;
            default: return <Clock size={14} />;
        }
    };

    const getPaymentStatusColor = (status) => {
        const colors = {
            PENDING: { bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.3)', text: '#FBBF24' },
            PAID: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: '#10B981' },
            FAILED: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: '#EF4444' },
            REFUNDED: { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.3)', text: '#8B5CF6' }
        };
        return colors[status] || colors.PENDING;
    };

    const getPaymentStatusText = (status) => {
        const texts = {
            PENDING: 'Chờ thanh toán',
            PAID: 'Đã thanh toán',
            FAILED: 'Thất bại',
            REFUNDED: 'Đã hoàn tiền'
        };
        return texts[status] || status;
    };

    const getPaymentMethodText = (method) => {
        const texts = {
            CASH: 'Tiền mặt',
            CARD: 'Thẻ',
            MOMO: 'MoMo',
            BANKING: 'Chuyển khoản',
            PAYOS: 'PayOS'
        };
        return texts[method] || method;
    };

    const getPaymentMethodIcon = (method) => {
        switch (method) {
            case 'CASH': return <DollarSign size={14} />;
            case 'MOMO': return <Phone size={14} />;
            case 'PAYOS': return <CreditCard size={14} />;
            case 'CARD': return <CreditCard size={14} />;
            case 'BANKING': return <Truck size={14} />;
            default: return <CreditCard size={14} />;
        }
    };

    const formatDateTime = (dateTime) => {
        if (!dateTime) return 'N/A';
        const date = new Date(dateTime);
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        if (!amount) return '0đ';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    // Filter bills
    const filteredBills = bills.filter(bill => {
        const matchSearch =
            bill.id?.toString().includes(searchTerm) ||
            (bill.orderId || bill.order?.id)?.toString().includes(searchTerm);

        const matchStatus = paymentStatusFilter === 'all' || bill.paymentStatus === paymentStatusFilter;
        const matchMethod = paymentMethodFilter === 'all' || bill.paymentMethod === paymentMethodFilter;

        let matchDate = true;
        if (dateFrom || dateTo) {
            const billDate = new Date(bill.issuedAt || bill.createdAt);
            if (dateFrom) matchDate = matchDate && billDate >= new Date(dateFrom);
            if (dateTo) matchDate = matchDate && billDate <= new Date(dateTo + 'T23:59:59');
        }

        return matchSearch && matchStatus && matchMethod && matchDate;
    });

    // Pagination
    const totalPages = Math.ceil(filteredBills.length / itemsPerPage);
    const paginatedBills = filteredBills.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Calculate stats
    const stats = {
        total: bills.length,
        paid: bills.filter(b => b.paymentStatus === 'PAID').length,
        pending: bills.filter(b => b.paymentStatus === 'PENDING').length,
        revenue: bills
            .filter(b => b.paymentStatus === 'PAID')
            .reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0)
    };

    return (
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px' }}>
            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 9999,
                    maxWidth: '400px',
                    width: '100%'
                }}>
                    <ToastNotification
                        message={toast.message}
                        type={toast.type}
                        duration={toast.duration}
                        onClose={() => setToast(null)}
                    />
                </div>
            )}

            {/* Header */}
            <div style={{
                padding: '32px 24px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(26, 26, 26, 0.8) 100%)',
                borderRadius: '20px',
                marginBottom: '24px',
                border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{
                            fontSize: '32px',
                            fontWeight: '800',
                            marginBottom: '8px',
                            background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <FileText size={32} color="#8B5CF6" /> Quản lý Hóa đơn
                        </h1>
                        <p style={{ color: '#94A3B8', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Receipt size={14} /> Quản lý và xuất hóa đơn thanh toán
                        </p>
                    </div>
                    <button
                        onClick={fetchData}
                        style={{
                            padding: '10px 20px',
                            background: 'rgba(139, 92, 246, 0.2)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: '12px',
                            color: '#8B5CF6',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: '600'
                        }}
                    >
                        <RefreshCw size={16} /> Làm mới
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={24} color="#8B5CF6" />
                        </div>
                        <div>
                            <div style={{ fontSize: '28px', fontWeight: '700', color: '#8B5CF6' }}>{stats.total}</div>
                            <div style={{ fontSize: '12px', color: '#94A3B8' }}>Tổng hóa đơn</div>
                        </div>
                    </div>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle size={24} color="#10B981" />
                        </div>
                        <div>
                            <div style={{ fontSize: '28px', fontWeight: '700', color: '#10B981' }}>{stats.paid}</div>
                            <div style={{ fontSize: '12px', color: '#94A3B8' }}>Đã thanh toán</div>
                        </div>
                    </div>
                </div>

                <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', background: 'rgba(251, 191, 36, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Clock size={24} color="#FBBF24" />
                        </div>
                        <div>
                            <div style={{ fontSize: '28px', fontWeight: '700', color: '#FBBF24' }}>{stats.pending}</div>
                            <div style={{ fontSize: '12px', color: '#94A3B8' }}>Chờ thanh toán</div>
                        </div>
                    </div>
                </div>

                <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <DollarSign size={24} color="#3B82F6" />
                        </div>
                        <div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#3B82F6' }}>{formatCurrency(stats.revenue)}</div>
                            <div style={{ fontSize: '12px', color: '#94A3B8' }}>Doanh thu</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={{
                background: '#1A1A1A',
                border: '1px solid #2D2D2D',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px'
                }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                        <input
                            type="text"
                            placeholder="Tìm theo mã hóa đơn..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 48px',
                                background: '#0F0F0F',
                                border: '1px solid #2D2D2D',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    <select
                        value={paymentStatusFilter}
                        onChange={(e) => { setPaymentStatusFilter(e.target.value); setCurrentPage(1); }}
                        style={{
                            padding: '12px 16px',
                            background: '#0F0F0F',
                            border: '1px solid #2D2D2D',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="PENDING">Chờ thanh toán</option>
                        <option value="PAID">Đã thanh toán</option>
                        <option value="FAILED">Thất bại</option>
                        <option value="REFUNDED">Đã hoàn tiền</option>
                    </select>

                    <select
                        value={paymentMethodFilter}
                        onChange={(e) => { setPaymentMethodFilter(e.target.value); setCurrentPage(1); }}
                        style={{
                            padding: '12px 16px',
                            background: '#0F0F0F',
                            border: '1px solid #2D2D2D',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">Tất cả phương thức</option>
                        <option value="CASH">Tiền mặt</option>
                        <option value="CARD">Thẻ</option>
                        <option value="MOMO">MoMo</option>
                        <option value="BANKING">Chuyển khoản</option>
                        <option value="PAYOS">PayOS</option>
                    </select>

                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        style={{
                            padding: '12px 16px',
                            background: '#0F0F0F',
                            border: '1px solid #2D2D2D',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '14px'
                        }}
                    />

                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        style={{
                            padding: '12px 16px',
                            background: '#0F0F0F',
                            border: '1px solid #2D2D2D',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '14px'
                        }}
                    />
                </div>
            </div>

            {/* Bills Table */}
            <div style={{
                background: '#1A1A1A',
                border: '1px solid #2D2D2D',
                borderRadius: '16px',
                overflow: 'auto'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ background: '#0F0F0F', borderBottom: '1px solid #2D2D2D' }}>
                            <th style={{ padding: '16px', textAlign: 'left', color: '#94A3B8', fontWeight: '600', fontSize: '13px' }}>
                                <Hash size={12} style={{ marginRight: 4 }} /> Mã HĐ
                            </th>
                            <th style={{ padding: '16px', textAlign: 'left', color: '#94A3B8', fontWeight: '600', fontSize: '13px' }}>
                                <Tag size={12} style={{ marginRight: 4 }} /> Bàn
                            </th>
                            <th style={{ padding: '16px', textAlign: 'left', color: '#94A3B8', fontWeight: '600', fontSize: '13px' }}>
                                <DollarSign size={12} style={{ marginRight: 4 }} /> Tổng tiền
                            </th>
                            <th style={{ padding: '16px', textAlign: 'left', color: '#94A3B8', fontWeight: '600', fontSize: '13px' }}>
                                <CreditCard size={12} style={{ marginRight: 4 }} /> Phương thức
                            </th>
                            <th style={{ padding: '16px', textAlign: 'left', color: '#94A3B8', fontWeight: '600', fontSize: '13px' }}>
                                <CheckCircle size={12} style={{ marginRight: 4 }} /> Trạng thái
                            </th>
                            <th style={{ padding: '16px', textAlign: 'left', color: '#94A3B8', fontWeight: '600', fontSize: '13px' }}>
                                <Clock size={12} style={{ marginRight: 4 }} /> Thời gian
                            </th>
                            <th style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontWeight: '600', fontSize: '13px' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>Đang tải...</td></tr>
                        ) : paginatedBills.length === 0 ? (
                            <tr><td colSpan="7" style={{ padding: '60px', textAlign: 'center' }}>
                                <FileText size={48} color="#64748B" style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                                <p style={{ color: '#94A3B8' }}>Không có hóa đơn nào</p>
                            </td></tr>
                        ) : (
                            paginatedBills.map((bill) => {
                                const statusColor = getPaymentStatusColor(bill.paymentStatus);

                                return (
                                    <tr key={bill.id} style={{ borderBottom: '1px solid #2D2D2D' }}>
                                        <td style={{ padding: '16px', color: 'white', fontWeight: '600' }}>#{bill.id}</td>
                                        <td style={{ padding: '16px', color: '#94A3B8' }}>Bàn {bill.tableNumber || bill.order?.table?.number || bill.table?.number || '--'}</td>
                                        <td style={{ padding: '16px', color: '#FF6B6B', fontWeight: '600' }}>{formatCurrency(bill.totalAmount)}</td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '6px 12px',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                color: '#3B82F6'
                                            }}>
                                                {getPaymentMethodIcon(bill.paymentMethod)}
                                                <span>{getPaymentMethodText(bill.paymentMethod)}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '6px 12px',
                                                background: statusColor.bg,
                                                border: `1px solid ${statusColor.border}`,
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                color: statusColor.text
                                            }}>
                                                {getStatusIcon(bill.paymentStatus)}
                                                <span>{getPaymentStatusText(bill.paymentStatus)}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', color: '#94A3B8', fontSize: '13px' }}>
                                            {formatDateTime(bill.createdAt)}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => handleViewDetail(bill)}
                                                    style={{
                                                        padding: '8px 12px',
                                                        background: 'rgba(139, 92, 246, 0.2)',
                                                        border: '1px solid rgba(139, 92, 246, 0.3)',
                                                        borderRadius: '8px',
                                                        color: '#8B5CF6',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => exportBillPDF(bill.id)}
                                                    style={{
                                                        padding: '8px 12px',
                                                        background: 'rgba(16, 185, 129, 0.2)',
                                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                                        borderRadius: '8px',
                                                        color: '#10B981',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    <Download size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '16px',
                    marginTop: '24px',
                    padding: '16px'
                }}>
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={{
                            padding: '8px 16px',
                            background: currentPage === 1 ? '#2D2D2D' : '#8B5CF6',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            opacity: currentPage === 1 ? 0.5 : 1
                        }}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span style={{ color: '#94A3B8' }}>Trang {currentPage} / {totalPages}</span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        style={{
                            padding: '8px 16px',
                            background: currentPage === totalPages ? '#2D2D2D' : '#8B5CF6',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            opacity: currentPage === totalPages ? 0.5 : 1
                        }}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedBill && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }} onClick={() => setShowDetailModal(false)}>
                    <div style={{
                        background: '#1A1A2E',
                        borderRadius: '20px',
                        maxWidth: '700px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        padding: '28px',
                        color: 'white'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#FF6B6B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Receipt size={22} /> Chi tiết Hóa đơn #{selectedBill.id}
                            </h3>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '10px',
                                    color: '#EF4444',
                                    cursor: 'pointer',
                                    fontSize: '20px',
                                    fontWeight: '700'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Thông tin cơ bản */}
                        <div style={{ background: '#0F0F1A', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2D2D3D' }}>
                                <span style={{ color: '#94A3B8' }}>Mã đơn:</span>
                                <strong>#{selectedBill.orderId || selectedBill.order?.id || '--'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2D2D3D' }}>
                                <span style={{ color: '#94A3B8' }}>Bàn:</span>
                                <strong>Bàn {selectedBill.tableNumber || selectedBill.order?.table?.number || selectedBill.table?.number || '--'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2D2D3D' }}>
                                <span style={{ color: '#94A3B8' }}>Phương thức:</span>
                                <strong>
                                    {getPaymentMethodIcon(selectedBill.paymentMethod)}
                                    <span style={{ marginLeft: 4 }}>{getPaymentMethodText(selectedBill.paymentMethod)}</span>
                                </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2D2D3D' }}>
                                <span style={{ color: '#94A3B8' }}>Trạng thái:</span>
                                <strong style={{ color: getPaymentStatusColor(selectedBill.paymentStatus).text }}>
                                    {getPaymentStatusText(selectedBill.paymentStatus)}
                                </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                <span style={{ color: '#94A3B8' }}>Thời gian:</span>
                                <strong>{formatDateTime(selectedBill.createdAt)}</strong>
                            </div>
                        </div>

                        {/* Danh sách món */}
                        <div style={{ background: '#0F0F1A', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                            <h4 style={{ color: '#94A3B8', marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Receipt size={14} /> Danh sách món
                            </h4>
                            {(selectedBill.items && selectedBill.items.length > 0) ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #2D2D3D' }}>
                                            <th style={{ padding: '8px', textAlign: 'left', color: '#64748B', fontSize: '12px' }}>Tên món</th>
                                            <th style={{ padding: '8px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>SL</th>
                                            <th style={{ padding: '8px', textAlign: 'right', color: '#64748B', fontSize: '12px' }}>Đơn giá</th>
                                            <th style={{ padding: '8px', textAlign: 'right', color: '#64748B', fontSize: '12px' }}>Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedBill.items.map((item, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #2D2D3D' }}>
                                                <td style={{ padding: '8px', color: 'white', fontSize: '13px' }}>{item.product?.name || item.name || `Món #${idx + 1}`}</td>
                                                <td style={{ padding: '8px', textAlign: 'center', color: 'white', fontSize: '13px' }}>x{item.quantity}</td>
                                                <td style={{ padding: '8px', textAlign: 'right', color: '#94A3B8', fontSize: '13px' }}>{formatCurrency(item.unitPrice || item.price)}</td>
                                                <td style={{ padding: '8px', textAlign: 'right', color: '#FF6B6B', fontSize: '13px', fontWeight: '600' }}>
                                                    {formatCurrency((item.unitPrice || item.price) * item.quantity)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p style={{ color: '#64748B', textAlign: 'center', padding: '10px' }}>Không có món nào</p>
                            )}
                        </div>

                        {/* Tổng kết */}
                        <div style={{ background: '#0F0F1A', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2D2D3D' }}>
                                <span style={{ color: '#94A3B8' }}>Tổng tiền món:</span>
                                <strong>{formatCurrency(getOriginalTotal(selectedBill))}</strong>
                            </div>
                            {getDiscountAmount(selectedBill) > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2D2D3D' }}>
                                    <span style={{ color: '#10B981' }}>Khuyến mãi giảm:</span>
                                    <strong style={{ color: '#10B981' }}>-{formatCurrency(getDiscountAmount(selectedBill))}</strong>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', marginTop: '8px', borderTop: '2px solid #2D2D3D' }}>
                                <span style={{ fontSize: '16px', fontWeight: '600' }}>THỰC THU:</span>
                                <strong style={{ color: '#FF6B6B', fontSize: '18px' }}>{formatCurrency(selectedBill.totalAmount)}</strong>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => exportBillPDF(selectedBill.id)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: 'linear-gradient(135deg, #10B981, #059669)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Download size={18} /> Tải PDF
                            </button>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: '#2D2D3D',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}