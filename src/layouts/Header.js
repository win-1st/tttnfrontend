import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const navigate = useNavigate();

    // Kiểm tra đăng nhập
    const isLoggedIn = localStorage.getItem('token') !== null;
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        navigate('/login');
    };

    return (
        <header className="header">
            <div className="container">
                <div className="header-content">
                    {/* Logo */}
                    <Link to="/" className="logo">
                        <img src="/assets/images/logo.png" alt="Win Bida" />
                        <span className="logo-text">Win BIDA</span>
                    </Link>

                    {/* Main Navigation */}
                    <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
                        <Link to="/" className="nav-link">Trang chủ</Link>
                        <Link to="/thuc-don" className="nav-link">Thực đơn</Link>
                        <Link to="/uu-dai" className="nav-link">Ưu đãi</Link>
                        <Link to="/dat-ban" className="nav-link nav-link-primary">Đặt bàn</Link>
                    </nav>

                    {/* User Actions */}
                    <div className="header-actions">
                        {isLoggedIn ? (
                            <div className="user-menu">
                                <button
                                    className="user-avatar"
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                >
                                    <span className="avatar-icon">👤</span>
                                    <span className="user-name">{user.fullName || user.username}</span>
                                </button>

                                {isUserMenuOpen && (
                                    <div className="dropdown-menu">
                                        <Link to="/profile" className="dropdown-item">Thông tin tài khoản</Link>
                                        <Link to="/lich-su" className="dropdown-item">Lịch sử đặt bàn</Link>
                                        <Link to="/vi-cua-toi" className="dropdown-item">Ví của tôi</Link>
                                        <hr />
                                        <button onClick={handleLogout} className="dropdown-item logout">
                                            Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="auth-buttons">
                                <Link to="/login" className="btn-login">Đăng nhập</Link>
                                <Link to="/register" className="btn-register">Đăng ký</Link>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            className="mobile-menu-btn"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;