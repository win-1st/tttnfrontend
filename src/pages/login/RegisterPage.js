import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Phone, Lock, ArrowLeft, UserPlus, CheckCircle } from "lucide-react";
import ToastNotification from "../../components/ToastNotification";
import "./LoginPage.css";

const RegisterPage = () => {
    const navigate = useNavigate();

    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // ✅ Thêm state cho confirm password
    const [isLoading, setIsLoading] = useState(false);
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = "info", duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    };

    // Chỉ chấp nhận 10 số, bắt đầu bằng 03, 05, 07, 08, 09
    const isValidPhone = (phone) => /^(0[3|5|7|8|9])([0-9]{8})$/.test(phone);
    const validateForm = () => {
        if (!phone.trim()) {
            showToast("Vui lòng nhập số điện thoại", "error");
            return false;
        }
        if (!isValidPhone(phone)) {
            showToast("Số điện thoại không hợp lệ (phải có 10 số, bắt đầu bằng 03, 05, 07, 08, 09)", "error");
            return false;
        }
        if (!password.trim()) {
            showToast("Vui lòng nhập mật khẩu", "error");
            return false;
        }
        if (password.length < 6) {
            showToast("Mật khẩu phải có ít nhất 6 ký tự", "error");
            return false;
        }
        if (!confirmPassword.trim()) {
            showToast("Vui lòng xác nhận mật khẩu", "error");
            return false;
        }
        if (password !== confirmPassword) {
            showToast("Mật khẩu nhập lại không khớp", "error");
            return false;
        }
        return true;
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            await axios.post("http://localhost:8080/api/auth/register", {
                phone,
                password,
                role: "CUSTOMER"
            });

            showToast("Đăng ký thành công! Vui lòng đăng nhập.", "success");

            setTimeout(() => {
                navigate("/login");
            }, 1500);

        } catch (err) {
            const errorMessage = err.response?.data?.message || "Đăng ký thất bại";
            showToast(errorMessage, "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <button className="back-button-outer" onClick={() => navigate("/")} disabled={isLoading}>
                <ArrowLeft size={20} />
                Quay lại
            </button>

            <div className="login-container">
                <div className="login-header">
                    <h2>Tạo tài khoản</h2>
                    <p>Đăng ký để sử dụng hệ thống</p>
                </div>

                <form onSubmit={handleRegister} className="login-form">
                    <div className="form-group">
                        <label>Số điện thoại <span className="required">*</span></label>
                        <div className="input-wrapper">
                            <Phone size={18} className="input-icon" />
                            <input
                                type="tel"
                                placeholder="Nhập số điện thoại (10 số)"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                maxLength="10"
                                pattern="[0-9]{10}"
                                title="Vui lòng nhập 10 số điện thoại"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Mật khẩu <span className="required">*</span></label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLoading}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Xác nhận mật khẩu <span className="required">*</span></label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type={showConfirmPassword ? "text" : "password"} // ✅ Sử dụng showConfirmPassword
                                placeholder="Nhập lại mật khẩu"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            {/* ✅ Thêm nút toggle cho confirm password */}
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                disabled={isLoading}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="login-button" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <div className="spinner"></div>
                                Đang đăng ký...
                            </>
                        ) : (
                            <>
                                <UserPlus size={18} />
                                Đăng ký
                            </>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Đã có tài khoản? <a href="/login">Đăng nhập</a></p>
                </div>
            </div>

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

export default RegisterPage;