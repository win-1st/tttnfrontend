import { Routes, Route } from "react-router-dom";
import Header from "./layouts/Header";
import Footer from "./layouts/Footer";
import "./assets/scss/style.scss";
import Main from "./layouts/Main";
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/login/LoginPage';
import RegisterPage from './pages/login/RegisterPage';
import ForgotPasswordPage from "./pages/login/ForgotPasswordPage";

// Cashier pages
import Dashboard from "./pages/employee/cashier/Dashboard";
import BillPage from "./pages/employee/cashier/BillPage";
import ReportPage from "./pages/employee/cashier/ReportPage";
import SettingPage from "./pages/employee/cashier/SettingPage";
import TablesPage from "./pages/employee/cashier/TablesPage";
import BookingPage from "./pages/employee/cashier/BookingPage";
import TableDetail from "./pages/employee/cashier/TableDetail";
import CashierPaymentSuccess from "./pages/employee/cashier/CashierPaymentSuccess";
import CashierPaymentCancel from "./pages/employee/cashier/CashierPaymentCancel";
import CashierLayout from './layouts/CashierLayout';

// Customer pages (public)
import CustomerBookingPage from './pages/client/BookingPage';
import CustomerMenuPage from './pages/client/MenuPage';
import CustomerPromotionPage from './pages/client/PromotionPage';
import ProfilePage from './pages/client/ProfilePage';
import BookingHistoryPage from './pages/client/BookingHistoryPage';
import WalletPage from './pages/client/WalletPage';
// Layout wrapper cho trang công khai
const PublicLayout = ({ children }) => (
  <>
    <Header />
    {children}
    <Footer />
  </>
);

function App() {
  return (
    <>
      <Routes>
        {/* Trang đăng nhập */}
        <Route path="/login" element={<LoginPage />} />

        {/* Trang đăng ký */}
        <Route path="/register" element={<RegisterPage />} />

        {/* Trang Quên mật khẩu */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Layout riêng cho admin */}
        <Route path="/admin/*" element={<AdminLayout />} />

        {/* Cashier routes */}
        <Route path="/cashier" element={<CashierLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="bill" element={<BillPage />} />
          <Route path="report" element={<ReportPage />} />
          <Route path="setting" element={<SettingPage />} />
          <Route path="tables" element={<TablesPage />} />
          <Route path="tables/:id" element={<TableDetail />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="rooms/:id" element={<TableDetail />} />
          <Route path="payment-cancel" element={<CashierPaymentCancel />} />
          <Route path="payment-success" element={<CashierPaymentSuccess />} />
        </Route>

        {/* Customer routes (public with header + footer) */}
        <Route path="/" element={<PublicLayout><Main /></PublicLayout>} />
        <Route path="/dat-ban" element={<PublicLayout><CustomerBookingPage /></PublicLayout>} />
        <Route path="/thuc-don" element={<PublicLayout><CustomerMenuPage /></PublicLayout>} />
        <Route path="/uu-dai" element={<PublicLayout><CustomerPromotionPage /></PublicLayout>} />
        <Route path="/profile" element={<PublicLayout><ProfilePage /></PublicLayout>} />
        <Route path="/lich-su" element={<PublicLayout><BookingHistoryPage /></PublicLayout>} />
        <Route path="/vi-cua-toi" element={<PublicLayout><WalletPage /></PublicLayout>} />

      </Routes>
    </>
  );
}

export default App;