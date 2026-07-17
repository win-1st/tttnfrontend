// ========== FILE: src/services/websocketService.js ==========
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const SOCKET_URL = 'http://localhost:8080/ws';

class WebSocketService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.tableStatusCallback = null;
        this.newReservationCallback = null;
    }

    connect(token) {
        if (this.client?.active) {
            console.log('WebSocket already connected');
            return Promise.resolve();
        }

        this.client = new Client({
            webSocketFactory: () => new SockJS(SOCKET_URL),
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            debug: (str) => {
                // Chỉ log khi development
                if (process.env.NODE_ENV === 'development') {
                    console.log('WS debug:', str);
                }
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

                        if (this.tableStatusCallback) {
                            this.tableStatusCallback(data);
                        }
                        if (this.newReservationCallback && data.status === 'RESERVED') {
                            this.newReservationCallback(data);
                        }
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

    setTableStatusCallback(callback) {
        this.tableStatusCallback = callback;
    }

    setNewReservationCallback(callback) {
        this.newReservationCallback = callback;
    }

    disconnect() {
        if (this.client?.active) {
            this.client.deactivate();
        }
        this.isConnected = false;
        this.tableStatusCallback = null;
        this.newReservationCallback = null;
    }
}

const webSocketService = new WebSocketService();
export default webSocketService;