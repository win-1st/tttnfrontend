import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    {/* Column 1 - About */}
                    <div className="footer-column">
                        <h3 className="footer-title">Win BIDA</h3>
                        <p className="footer-description">
                            Hệ thống quản lý quán bida chuyên nghiệp,
                            mang đến trải nghiệm đặt bàn và thanh toán
                            tiện lợi nhất.
                        </p>
                        <div className="social-links">
                            <a href="#" className="social-link">📘</a>
                            <a href="#" className="social-link">📷</a>
                            <a href="#" className="social-link">📺</a>
                        </div>
                    </div>

                    {/* Column 2 - Quick Links */}
                    <div className="footer-column">
                        <h3 className="footer-title">Liên kết nhanh</h3>
                        <ul className="footer-links">
                            <li><Link to="/">Trang chủ</Link></li>
                            <li><Link to="/thuc-don">Thực đơn</Link></li>
                            <li><Link to="/uu-dai">Ưu đãi</Link></li>
                            <li><Link to="/dat-ban">Đặt bàn</Link></li>
                        </ul>
                    </div>

                    {/* Column 3 - Support */}
                    <div className="footer-column">
                        <h3 className="footer-title">Hỗ trợ</h3>
                        <ul className="footer-links">
                            <li><Link to="/huong-dan">Hướng dẫn sử dụng</Link></li>
                            <li><Link to="/chinh-sach">Chính sách & Điều khoản</Link></li>
                            <li><Link to="/bao-mat">Chính sách bảo mật</Link></li>
                            <li><Link to="/lien-he">Liên hệ</Link></li>
                        </ul>
                    </div>

                    {/* Column 4 - Contact */}
                    <div className="footer-column">
                        <h3 className="footer-title">Thông tin liên hệ</h3>
                        <ul className="footer-contact">
                            <li>
                                <span className="contact-icon">📍</span>
                                <span>123 Đường Nguyễn Huệ, Quận 1, TP.HCM</span>
                            </li>
                            <li>
                                <span className="contact-icon">📞</span>
                                <span>Hotline: 1900 1234</span>
                            </li>
                            <li>
                                <span className="contact-icon">✉️</span>
                                <span>Email: contact@Winbida.com</span>
                            </li>
                            <li>
                                <span className="contact-icon">⏰</span>
                                <span>Giờ mở cửa: 8:00 - 23:00</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2024 Win BIDA. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;