// DEPRECATED: Direct Bybit API calls from frontend are disabled for security.
// All Bybit operations go through Supabase Edge Functions.
// This file is kept for reference during migration and will be removed in v1.1.

import { BybitAuth } from './auth';
import type {
    BybitAPIResponse,
    BybitBalance,
    BybitPosition,
    BybitOrder,
    BybitOrderRequest,
    BybitCredentials
} from './types';

export class BybitClient {
    private baseURL: string;
    private auth: BybitAuth;

    constructor(credentials: BybitCredentials) {
        this.baseURL = credentials.testnet
            ? 'https://api-testnet.bybit.com'
            : 'https://api.bybit.com';
        this.auth = new BybitAuth(credentials.apiKey, credentials.apiSecret);
    }

    /**
     * Make authenticated GET request to Bybit API
     */
    private async get<T>(endpoint: string, params: Record<string, any> = {}): Promise<BybitAPIResponse<T>> {
        const queryString = new URLSearchParams(params).toString();
        const url = `${this.baseURL}${endpoint}${queryString ? `?${queryString}` : ''}`;

        const headers = this.auth.getHeaders(queryString);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: headers as HeadersInit
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data: BybitAPIResponse<T> = await response.json();

            if (data.retCode !== 0) {
                throw new Error(`Bybit API Error ${data.retCode}: ${data.retMsg}`);
            }

            return data;
        } catch (error) {
            console.error('Bybit API GET Error:', error);
            throw error;
        }
    }

    /**
     * Make authenticated POST request to Bybit API
     */
    private async post<T>(endpoint: string, body: Record<string, any> = {}): Promise<BybitAPIResponse<T>> {
        const bodyString = JSON.stringify(body);
        const url = `${this.baseURL}${endpoint}`;

        const headers = this.auth.getHeaders(bodyString);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers as HeadersInit,
                body: bodyString
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data: BybitAPIResponse<T> = await response.json();

            if (data.retCode !== 0) {
                throw new Error(`Bybit API Error ${data.retCode}: ${data.retMsg}`);
            }

            return data;
        } catch (error) {
            console.error('Bybit API POST Error:', error);
            throw error;
        }
    }

    // ============================================
    // ACCOUNT & WALLET ENDPOINTS
    // ============================================

    /**
     * Get wallet balance
     * @param accountType - Account type (UNIFIED, CONTRACT, SPOT)
     * @param coin - Optional coin filter
     */
    async getWalletBalance(accountType: string = 'UNIFIED', coin?: string): Promise<BybitBalance> {
        const params: Record<string, any> = { accountType };
        if (coin) params.coin = coin;

        const response = await this.get<{ list: BybitBalance[] }>('/v5/account/wallet-balance', params);
        return response.result.list[0];
    }

    /**
     * Get account info
     */
    async getAccountInfo(): Promise<any> {
        const response = await this.get('/v5/account/info');
        return response.result;
    }

    // ============================================
    // POSITION ENDPOINTS
    // ============================================

    /**
     * Get position information
     * @param category - Product type (linear, inverse, option)
     * @param symbol - Optional symbol filter
     */
    async getPositions(category: string = 'linear', symbol?: string): Promise<BybitPosition[]> {
        const params: Record<string, any> = { category };
        if (symbol) params.symbol = symbol;

        const response = await this.get<{ list: BybitPosition[] }>('/v5/position/list', params);
        return response.result.list;
    }

    /**
     * Set leverage for a symbol
     */
    async setLeverage(category: string, symbol: string, buyLeverage: string, sellLeverage: string): Promise<any> {
        const response = await this.post('/v5/position/set-leverage', {
            category,
            symbol,
            buyLeverage,
            sellLeverage
        });
        return response.result;
    }

    // ============================================
    // ORDER ENDPOINTS
    // ============================================

    /**
     * Place an order
     */
    async placeOrder(order: BybitOrderRequest): Promise<BybitOrder> {
        const response = await this.post<BybitOrder>('/v5/order/create', order);
        return response.result;
    }

    /**
     * Get open orders
     */
    async getOpenOrders(category: string, symbol?: string): Promise<BybitOrder[]> {
        const params: Record<string, any> = { category };
        if (symbol) params.symbol = symbol;

        const response = await this.get<{ list: BybitOrder[] }>('/v5/order/realtime', params);
        return response.result.list;
    }

    /**
     * Cancel an order
     */
    async cancelOrder(category: string, symbol: string, orderId: string): Promise<any> {
        const response = await this.post('/v5/order/cancel', {
            category,
            symbol,
            orderId
        });
        return response.result;
    }

    /**
     * Cancel all orders
     */
    async cancelAllOrders(category: string, symbol?: string): Promise<any> {
        const body: Record<string, any> = { category };
        if (symbol) body.symbol = symbol;

        const response = await this.post('/v5/order/cancel-all', body);
        return response.result;
    }

    // ============================================
    // MARKET DATA ENDPOINTS (Public)
    // ============================================

    /**
     * Get kline/candlestick data
     */
    async getKline(category: string, symbol: string, interval: string, limit: number = 200): Promise<any> {
        const response = await this.get('/v5/market/kline', {
            category,
            symbol,
            interval,
            limit
        });
        return response.result;
    }

    /**
     * Get ticker information
     */
    async getTicker(category: string, symbol: string): Promise<any> {
        const response = await this.get('/v5/market/tickers', {
            category,
            symbol
        });
        return response.result;
    }

    // ============================================
    // COPY TRADING ENDPOINTS
    // ============================================

    /**
     * Get copy trading positions
     */
    async getCopyTradingPositions(): Promise<any> {
        const response = await this.get('/v5/copy-trading/position/list');
        return response.result;
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Test connection and API key validity
     */
    async testConnection(): Promise<boolean> {
        try {
            await this.getAccountInfo();
            return true;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }

    /**
     * Get server time
     */
    async getServerTime(): Promise<number> {
        const response = await this.get<{ timeSecond: string; timeNano: string }>('/v5/market/time');
        return parseInt(response.result.timeSecond) * 1000;
    }
}
