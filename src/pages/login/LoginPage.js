import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Phone, Lock, ArrowLeft, LogIn } from "lucide-react";
import ToastNotification from "../../components/ToastNotification";
import "./LoginPage.css";

const LoginPage = () => {
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [toasts, setToasts] = useState([]);
    const navigate = useNavigate();

    const showToast = (message, type = "info", duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    };

    useEffect(() => {
        const savedPhone = localStorage.getItem("rememberedPhone");
        const savedPassword = localStorage.getItem("rememberedPassword");
        const remember = localStorage.getItem("rememberMe") === "true";

        if (remember && savedPhone) {
            setPhone(savedPhone);
            setPassword(savedPassword || "");
            setRememberMe(true);
        }
    }, []);

    const validateForm = () => {
        if (!phone.trim()) {
            showToast("Vui lòng nhập số điện thoại", "error");
            return false;
        }
        if (!/^(0[3|5|7|8|9])([0-9]{8})$/.test(phone)) {
            showToast("Số điện thoại phải có 10 số, bắt đầu bằng 03, 05, 07, 08, 09", "error");
            return false;
        }
        if (!password.trim()) {
            showToast("Vui lòng nhập mật khẩu", "error");
            return false;
        }
        return true;
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const res = await axios.post("http://localhost:8080/api/auth/login", {
                phone,
                password,
            });

            const accessToken = res.data.token;
            const refreshToken = res.data.refreshToken;

            if (!accessToken) {
                showToast("Không nhận được token từ server!", "error");
                setIsLoading(false);
                return;
            }

            if (rememberMe) {
                localStorage.setItem("rememberedPhone", phone);
                localStorage.setItem("rememberedPassword", password);
                localStorage.setItem("rememberMe", "true");
            } else {
                localStorage.removeItem("rememberedPhone");
                localStorage.removeItem("rememberedPassword");
                localStorage.removeItem("rememberMe");
            }

            localStorage.setItem("token", accessToken);
            if (refreshToken) {
                localStorage.setItem("refreshToken", refreshToken);
            }

            const { id, phone: userPhone, fullName, email, roles } = res.data;

            // ✅ Lấy role từ roles array
            let role = "";
            if (roles && roles.length > 0) {
                role = roles[0].replace("ROLE_", "");
            }

            // ✅ Lưu user với role là string
            const user = {
                id: id,
                phone: userPhone || phone,
                fullName: fullName || "",
                email: email || "",
                role: role,  // ✅ Lưu role dạng string
                password: rememberMe ? password : ""
            };

            localStorage.setItem("user", JSON.stringify(user));

            showToast("Đăng nhập thành công!", "success");

            setTimeout(() => {
                switch (role) {
                    case "ADMIN":
                        navigate("/admin", { replace: true });
                        break;
                    case "STAFF":
                        navigate("/cashier/tables", { replace: true });
                        break;
                    case "CUSTOMER":
                        navigate("/", { replace: true });
                        break;
                    default:
                        navigate("/", { replace: true });
                        break;
                }
            }, 500);

        } catch (err) {
            let errorMessage = "Sai số điện thoại hoặc mật khẩu!";
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (typeof err.response?.data === 'string') {
                errorMessage = err.response.data;
            }
            showToast(errorMessage, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoBack = () => {
        navigate("/", { replace: true });
    };

    return (
        <div className="login-page">
            <button className="back-button-outer" onClick={handleGoBack} disabled={isLoading}>
                <ArrowLeft size={20} />
                Quay lại
            </button>

            <div className="login-container">
                <div className="login-header">
                    <h2>Chào mừng trở lại</h2>
                    <p>Đăng nhập để tiếp tục</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label htmlFor="phone">Số điện thoại</label>
                        <div className="input-wrapper">
                            <Phone size={18} className="input-icon" />
                            <input
                                id="phone"
                                type="tel"
                                placeholder="Nhập số điện thoại (10 số)"
                                maxLength="10"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Mật khẩu</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Nhập mật khẩu"
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

                    <div className="form-options">
                        <label className="checkbox-label">
                            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                            <span>Ghi nhớ đăng nhập</span>
                        </label>
                        <a href="/forgot-password" className="forgot-link">Quên mật khẩu?</a>
                    </div>

                    <button type="submit" className="login-button" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <div className="spinner"></div>
                                Đang đăng nhập...
                            </>
                        ) : (
                            <>
                                <LogIn size={18} />
                                Đăng nhập
                            </>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Chưa có tài khoản? <a href="/register">Đăng ký ngay</a></p>
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

export default LoginPage;