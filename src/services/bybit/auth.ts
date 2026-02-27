import crypto from 'crypto-js';

export interface BybitAuthHeaders {
    'X-BAPI-API-KEY': string;
    'X-BAPI-TIMESTAMP': string;
    'X-BAPI-SIGN': string;
    'X-BAPI-SIGN-TYPE': string;
    'X-BAPI-RECV-WINDOW': string;
    'Content-Type': string;
}

export class BybitAuth {
    private apiKey: string;
    private apiSecret: string;
    private recvWindow: number = 5000;

    constructor(apiKey: string, apiSecret: string) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
    }

    /**
     * Generate signature for Bybit API v5
     * @param timestamp - Current timestamp in milliseconds
     * @param params - Query parameters or request body
     * @returns HMAC SHA256 signature
     */
    generateSignature(timestamp: number, params: string = ''): string {
        const signString = `${timestamp}${this.apiKey}${this.recvWindow}${params}`;
        return crypto.HmacSHA256(signString, this.apiSecret).toString(crypto.enc.Hex);
    }

    /**
     * Generate authenticated headers for REST API requests
     * @param params - Query string or JSON body string
     * @returns Headers object with authentication
     */
    getHeaders(params: string = ''): BybitAuthHeaders {
        const timestamp = Date.now().toString();
        const signature = this.generateSignature(Number(timestamp), params);

        return {
            'X-BAPI-API-KEY': this.apiKey,
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-RECV-WINDOW': this.recvWindow.toString(),
            'Content-Type': 'application/json'
        };
    }

    /**
     * Generate authentication payload for WebSocket
     * @returns Auth payload for WebSocket connection
     */
    getWebSocketAuth(): { op: string; args: [string, number, string] } {
        const expires = Date.now() + 10000; // 10 seconds from now
        const signature = crypto.HmacSHA256(`GET/realtime${expires}`, this.apiSecret).toString(crypto.enc.Hex);

        return {
            op: 'auth',
            args: [this.apiKey, expires, signature]
        };
    }

    /**
     * Get API key (for display purposes only)
     */
    getApiKey(): string {
        return this.apiKey;
    }

    /**
     * Validate API credentials format
     */
    static validateCredentials(apiKey: string, apiSecret: string): boolean {
        // Bybit API keys are typically 20-30 characters
        // API secrets are typically 32-40 characters
        if (!apiKey || !apiSecret) return false;
        if (apiKey.length < 10 || apiKey.length > 50) return false;
        if (apiSecret.length < 20 || apiSecret.length > 60) return false;
        return true;
    }
}
