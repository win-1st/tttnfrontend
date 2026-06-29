import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
// Import icons từ react-icons - ĐÃ SỬA
import { GiEightBall } from 'react-icons/gi';  // Thay GiPoolBall bằng GiEightBall
import {
    FaHome,
    FaUtensils,
    FaTag,
    FaCalendarCheck,
    FaUserCircle,
    FaUser,
    FaHistory,
    FaWallet,
    FaSignOutAlt,
    FaSignInAlt,
    FaUserPlus,
    FaBars
} from 'react-icons/fa';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const navigate = useNavigate();

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
                    {/* Logo - Dùng GiEightBall */}
                    <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                        <GiEightBall style={{ fontSize: '35px', marginRight: '10px', color: '#FFD700' }} />
                        <span className="logo-text" style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFD700' }}>
                            Win BIDA
                        </span>
                    </Link>

                    {/* Navigation */}
                    <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
                        <Link to="/" className="nav-link">
                            <FaHome style={{ marginRight: '5px' }} /> Trang chủ
                        </Link>
                        <Link to="/thuc-don" className="nav-link">
                            <FaUtensils style={{ marginRight: '5px' }} /> Thực đơn
                        </Link>
                        <Link to="/uu-dai" className="nav-link">
                            <FaTag style={{ marginRight: '5px' }} /> Ưu đãi
                        </Link>
                        <Link to="/dat-ban" className="nav-link nav-link-primary">
                            <FaCalendarCheck style={{ marginRight: '5px' }} /> Đặt bàn
                        </Link>
                    </nav>

                    {/* User Actions */}
                    <div className="header-actions">
                        {isLoggedIn ? (
                            <div className="user-menu">
                                <button
                                    className="user-avatar"
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                                >
                                    <FaUserCircle style={{ fontSize: '20px' }} />
                                    <span className="user-name">{user.fullName || user.phone || user.username}</span>
                                </button>

                                {isUserMenuOpen && (
                                    <div className="dropdown-menu">
                                        <Link to="/profile" className="dropdown-item">
                                            <FaUser style={{ marginRight: '8px' }} /> Thông tin tài khoản
                                        </Link>
                                        <Link to="/lich-su" className="dropdown-item">
                                            <FaHistory style={{ marginRight: '8px' }} /> Lịch sử đặt bàn
                                        </Link>
                                        <Link to="/vi-cua-toi" className="dropdown-item">
                                            <FaWallet style={{ marginRight: '8px' }} /> Ví của tôi
                                        </Link>
                                        <hr />
                                        <button onClick={handleLogout} className="dropdown-item logout">
                                            <FaSignOutAlt style={{ marginRight: '8px' }} /> Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="auth-buttons">
                                <Link to="/login" className="btn-login">
                                    <FaSignInAlt style={{ marginRight: '5px' }} /> Đăng nhập
                                </Link>
                                <Link to="/register" className="btn-register">
                                    <FaUserPlus style={{ marginRight: '5px' }} /> Đăng ký
                                </Link>
                            </div>
                        )}

                        <button
                            className="mobile-menu-btn"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <FaBars />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;