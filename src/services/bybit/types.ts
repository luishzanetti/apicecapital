// DEPRECATED: Direct Bybit API calls from frontend are disabled for security.
// All Bybit operations go through Supabase Edge Functions.
// This file is kept for reference during migration and will be removed in v1.1.

// Bybit API v5 Type Definitions

export interface BybitCredentials {
    apiKey: string;
    apiSecret: string;
    testnet?: boolean;
}

export interface BybitBalance {
    totalEquity: string;
    totalWalletBalance: string;
    totalMarginBalance: string;
    totalAvailableBalance: string;
    totalPerpUPL: string;
    totalInitialMargin: string;
    totalMaintenanceMargin: string;
    accountIMRate: string;
    accountMMRate: string;
    totalSessionUPL: string;
    totalSessionRPL: string;
    coin: BybitCoinBalance[];
}

export interface BybitCoinBalance {
    coin: string;
    equity: string;
    usdValue: string;
    walletBalance: string;
    availableToWithdraw: string;
    availableToBorrow: string;
    borrowAmount: string;
    accruedInterest: string;
    totalOrderIM: string;
    totalPositionIM: string;
    totalPositionMM: string;
    unrealisedPnl: string;
    cumRealisedPnl: string;
}

export interface BybitPosition {
    symbol: string;
    side: 'Buy' | 'Sell';
    size: string;
    positionValue: string;
    entryPrice: string;
    markPrice: string;
    liqPrice: string;
    bustPrice: string;
    positionIM: string;
    positionMM: string;
    unrealisedPnl: string;
    cumRealisedPnl: string;
    leverage: string;
    autoAddMargin: number;
    positionStatus: string;
    createdTime: string;
    updatedTime: string;
}

export interface BybitDCABot {
    id: string;
    symbol: string;
    side: 'Buy' | 'Sell';
    investmentCurrency: string;
    investmentAmount: string;
    frequency: 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly';
    status: 'Running' | 'Paused' | 'Stopped';
    totalInvested: number;
    totalPurchased: number;
    averagePrice: number;
    currentValue: number;
    unrealizedPnL: number;
    createdTime: string;
    lastExecutionTime?: string;
}

export interface BybitCopyTradingPosition {
    masterTraderUid: string;
    masterTraderName: string;
    symbol: string;
    side: 'Buy' | 'Sell';
    size: string;
    entryPrice: string;
    markPrice: string;
    unrealisedPnl: string;
    leverage: string;
    createdTime: string;
}

export interface BybitWebSocketMessage {
    topic: string;
    type: string;
    ts: number;
    data: any;
}

export interface BybitAPIResponse<T = any> {
    retCode: number;
    retMsg: string;
    result: T;
    retExtInfo: Record<string, any>;
    time: number;
}

export interface BybitOrderRequest {
    category: 'spot' | 'linear' | 'inverse' | 'option';
    symbol: string;
    side: 'Buy' | 'Sell';
    orderType: 'Market' | 'Limit';
    qty: string;
    price?: string;
    timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'PostOnly';
    orderLinkId?: string;
    isLeverage?: number;
    orderFilter?: 'Order' | 'tpslOrder' | 'StopOrder';
}

export interface BybitOrder {
    orderId: string;
    orderLinkId: string;
    symbol: string;
    price: string;
    qty: string;
    side: 'Buy' | 'Sell';
    orderType: string;
    orderStatus: string;
    cumExecQty: string;
    cumExecValue: string;
    cumExecFee: string;
    timeInForce: string;
    createdTime: string;
    updatedTime: string;
}

export type BybitWebSocketTopic =
    | 'wallet'
    | 'position'
    | 'execution'
    | 'order'
    | 'greeks'
    | 'dcp';

export interface BybitConnectionStatus {
    isConnected: boolean;
    isAuthenticated: boolean;
    lastPingTime?: number;
    reconnectAttempts: number;
}
