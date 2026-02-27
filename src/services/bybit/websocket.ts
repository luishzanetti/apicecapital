import { BybitAuth } from './auth';
import type { BybitWebSocketMessage, BybitWebSocketTopic, BybitConnectionStatus } from './types';

type WebSocketCallback = (data: any) => void;

export class BybitWebSocket {
    private ws: WebSocket | null = null;
    private auth: BybitAuth;
    private subscriptions: Map<string, WebSocketCallback[]> = new Map();
    private connectionStatus: BybitConnectionStatus = {
        isConnected: false,
        isAuthenticated: false,
        reconnectAttempts: 0
    };
    private pingInterval: NodeJS.Timeout | null = null;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 3000;
    private isTestnet: boolean;

    constructor(apiKey: string, apiSecret: string, testnet: boolean = false) {
        this.auth = new BybitAuth(apiKey, apiSecret);
        this.isTestnet = testnet;
        this.connect();
    }

    /**
     * Establish WebSocket connection
     */
    private connect(): void {
        const wsUrl = this.isTestnet
            ? 'wss://stream-testnet.bybit.com/v5/private'
            : 'wss://stream.bybit.com/v5/private';

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('Bybit WebSocket connected');
                this.connectionStatus.isConnected = true;
                this.connectionStatus.reconnectAttempts = 0;
                this.authenticate();
                this.startPingInterval();
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            this.ws.onerror = (error) => {
                console.error('Bybit WebSocket error:', error);
            };

            this.ws.onclose = () => {
                console.log('Bybit WebSocket disconnected');
                this.connectionStatus.isConnected = false;
                this.connectionStatus.isAuthenticated = false;
                this.stopPingInterval();
                this.attemptReconnect();
            };
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.attemptReconnect();
        }
    }

    /**
     * Authenticate WebSocket connection
     */
    private authenticate(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('Cannot authenticate: WebSocket not open');
            return;
        }

        const authPayload = this.auth.getWebSocketAuth();
        this.send(authPayload);
    }

    /**
     * Handle incoming WebSocket messages
     */
    private handleMessage(data: string): void {
        try {
            const message: BybitWebSocketMessage = JSON.parse(data);

            // Handle authentication response
            if (message.type === 'AUTH_RESP') {
                if (message.data === 'success') {
                    console.log('Bybit WebSocket authenticated');
                    this.connectionStatus.isAuthenticated = true;
                    this.resubscribeAll();
                } else {
                    console.error('Bybit WebSocket authentication failed');
                }
                return;
            }

            // Handle pong response
            if (message.type === 'PONG') {
                this.connectionStatus.lastPingTime = Date.now();
                return;
            }

            // Handle subscription response
            if (message.type === 'COMMAND_RESP') {
                console.log('Subscription response:', message);
                return;
            }

            // Handle data updates
            if (message.topic && message.data) {
                this.notifySubscribers(message.topic, message.data);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    /**
     * Send message through WebSocket
     */
    private send(payload: any): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('Cannot send: WebSocket not open');
            return;
        }

        this.ws.send(JSON.stringify(payload));
    }

    /**
     * Subscribe to a topic
     */
    subscribe(topic: BybitWebSocketTopic, callback: WebSocketCallback): void {
        // Add callback to subscriptions
        if (!this.subscriptions.has(topic)) {
            this.subscriptions.set(topic, []);
        }
        this.subscriptions.get(topic)!.push(callback);

        // Send subscription request if connected and authenticated
        if (this.connectionStatus.isConnected && this.connectionStatus.isAuthenticated) {
            this.send({
                op: 'subscribe',
                args: [topic]
            });
        }
    }

    /**
     * Unsubscribe from a topic
     */
    unsubscribe(topic: BybitWebSocketTopic, callback?: WebSocketCallback): void {
        if (!this.subscriptions.has(topic)) return;

        if (callback) {
            // Remove specific callback
            const callbacks = this.subscriptions.get(topic)!;
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }

            // If no more callbacks, unsubscribe from topic
            if (callbacks.length === 0) {
                this.subscriptions.delete(topic);
                this.send({
                    op: 'unsubscribe',
                    args: [topic]
                });
            }
        } else {
            // Remove all callbacks for this topic
            this.subscriptions.delete(topic);
            this.send({
                op: 'unsubscribe',
                args: [topic]
            });
        }
    }

    /**
     * Notify all subscribers of a topic
     */
    private notifySubscribers(topic: string, data: any): void {
        const callbacks = this.subscriptions.get(topic);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in subscription callback:', error);
                }
            });
        }
    }

    /**
     * Resubscribe to all topics after reconnection
     */
    private resubscribeAll(): void {
        const topics = Array.from(this.subscriptions.keys());
        if (topics.length > 0) {
            this.send({
                op: 'subscribe',
                args: topics
            });
        }
    }

    /**
     * Start ping interval to keep connection alive
     */
    private startPingInterval(): void {
        this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.send({ op: 'ping' });
            }
        }, 20000); // Ping every 20 seconds
    }

    /**
     * Stop ping interval
     */
    private stopPingInterval(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    /**
     * Attempt to reconnect after disconnection
     */
    private attemptReconnect(): void {
        if (this.connectionStatus.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        this.connectionStatus.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.connectionStatus.reconnectAttempts}/${this.maxReconnectAttempts})...`);

        this.reconnectTimeout = setTimeout(() => {
            this.connect();
        }, this.reconnectDelay * this.connectionStatus.reconnectAttempts);
    }

    /**
     * Get current connection status
     */
    getStatus(): BybitConnectionStatus {
        return { ...this.connectionStatus };
    }

    /**
     * Manually disconnect
     */
    disconnect(): void {
        this.stopPingInterval();

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.subscriptions.clear();
        this.connectionStatus = {
            isConnected: false,
            isAuthenticated: false,
            reconnectAttempts: 0
        };
    }
}
