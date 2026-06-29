// src/services/websocketService.js
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const SOCKET_URL = 'http://localhost:8080/ws';

class WebSocketService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.callbacks = [];
    }

    connect(token) {
        if (this.client?.active) return Promise.resolve();

        this.client = new Client({
            webSocketFactory: () => new SockJS(SOCKET_URL),
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            debug: (str) => {
                // Chỉ log khi development
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000
        });

        return new Promise((resolve, reject) => {
            this.client.onConnect = () => {
                console.log('✅ WebSocket connected');
                this.isConnected = true;

                // Subscribe to table status updates
                this.client.subscribe('/topic/table-status', (message) => {
                    try {
                        const data = JSON.parse(message.body);
                        console.log('📡 Table status update:', data);

                        // Notify all callbacks
                        this.callbacks.forEach(cb => cb(data));
                    } catch (error) {
                        console.error('WS parse error:', error);
                    }
                });

                resolve();
            };

            this.client.onStompError = (frame) => {
                console.error('WS error:', frame.headers['message']);
                reject(frame);
            };

            this.client.onDisconnect = () => {
                console.log('WS disconnected');
                this.isConnected = false;
            };

            this.client.activate();
        });
    }

    // Method cho Home.js (setTableStatusCallback)
    setTableStatusCallback(callback) {
        // Xóa tất cả callbacks cũ
        this.callbacks = [];
        // Thêm callback mới nếu có
        if (callback) {
            this.callbacks.push(callback);
        }
    }

    // Method cho các component khác (onTableStatusChange)
    onTableStatusChange(callback) {
        this.callbacks.push(callback);
        // Return function to remove callback
        return () => {
            this.callbacks = this.callbacks.filter(cb => cb !== callback);
        };
    }

    disconnect() {
        if (this.client?.active) {
            this.client.deactivate();
        }
        this.isConnected = false;
        this.callbacks = [];
    }
}

const webSocketService = new WebSocketService();
export default webSocketService;