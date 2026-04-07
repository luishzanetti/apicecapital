// DEPRECATED: Direct Bybit API calls from frontend are disabled for security.
// All Bybit operations go through Supabase Edge Functions.
// This file is kept for reference during migration and will be removed in v1.1.

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
                this.connectionStatus.isConnected = true;
                this.connectionStatus.reconnectAttempts = 0;
                this.authenticate();
                this.startPingInterval();
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            this.ws.onerror = () => {};


            this.ws.onclose = () => {
                this.connectionStatus.isConnected = false;
                this.connectionStatus.isAuthenticated = false;
                this.stopPingInterval();
                this.attemptReconnect();
            };
        } catch {
            this.attemptReconnect();
        }
    }

    /**
     * Authenticate WebSocket connection
     */
    private authenticate(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
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
                    this.connectionStatus.isAuthenticated = true;
                    this.resubscribeAll();
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
                return;
            }

            // Handle data updates
            if (message.topic && message.data) {
                this.notifySubscribers(message.topic, message.data);
            }
        } catch {
            // Malformed WebSocket message; skip
        }
    }

    /**
     * Send message through WebSocket
     */
    private send(payload: any): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
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
                } catch {
                    // Subscription callback error; skip
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
            return;
        }

        this.connectionStatus.reconnectAttempts++;

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
