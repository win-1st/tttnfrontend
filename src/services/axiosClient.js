
import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // Thêm timeout 10 giây
    withCredentials: false
});

// Request interceptor
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');

        console.log('🔑 Token:', token ? `${token.substring(0, 30)}...` : 'KHÔNG có token');
        console.log('📤 URL đầy đủ:', config.baseURL + config.url);
        console.log('📤 Method:', config.method);

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('✅ Đã thêm token vào header');
        }

        return config;
    },
    (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
    }
);

axiosClient.interceptors.response.use(
    (response) => {
        console.log('📥 Response success:', response.config.url, response.status);
        return response;
    },
    (error) => {
        // LOG CHI TIẾT LỖI
        console.error('❌ ===== RESPONSE ERROR =====');
        console.error('URL:', error.config?.url);
        console.error('Method:', error.config?.method);
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Data:', error.response?.data);
        console.error('Message:', error.message);

        if (error.response?.status === 401) {
            console.error('🚨 401 Unauthorized - Token might be invalid or expired');
        }

        return Promise.reject(error);
    }
);

export default axiosClient;