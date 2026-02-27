import { useState, useEffect, useCallback } from 'react';
import { BybitClient, BybitWebSocket } from '@/services/bybit';
import type { BybitBalance, BybitPosition, BybitConnectionStatus } from '@/services/bybit/types';
import { supabase } from '@/integrations/supabase/client';
import { decrypt } from '@/lib/crypto';

interface BybitDataState {
    balance: BybitBalance | null;
    positions: BybitPosition[];
    totalEquity: number;
    totalUnrealizedPnL: number;
    isConnected: boolean;
    isLoading: boolean;
    error: string | null;
}

/**
 * Hook to fetch and manage Bybit account data in real-time
 * Automatically connects to Bybit API using stored credentials
 * Provides real-time updates via WebSocket
 */
export function useBybitData() {
    const [state, setState] = useState<BybitDataState>({
        balance: null,
        positions: [],
        totalEquity: 0,
        totalUnrealizedPnL: 0,
        isConnected: false,
        isLoading: true,
        error: null
    });

    const [client, setClient] = useState<BybitClient | null>(null);
    const [ws, setWs] = useState<BybitWebSocket | null>(null);

    /**
     * Initialize Bybit connection
     */
    const initializeBybit = useCallback(async () => {
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setState(prev => ({ ...prev, isLoading: false, error: 'User not authenticated' }));
                return;
            }

            // Fetch API credentials from Supabase
            const { data: credentials, error: credError } = await supabase
                .from('bybit_credentials')
                .select('api_key, api_secret_encrypted, testnet')
                .eq('user_id', user.id)
                .single();

            if (credError || !credentials) {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: 'Bybit credentials not found. Please connect your Bybit account in Settings.'
                }));
                return;
            }

            // Decrypt API secret
            const apiSecret = decrypt(credentials.api_secret_encrypted);

            // Initialize REST client
            const bybitClient = new BybitClient({
                apiKey: credentials.api_key,
                apiSecret: apiSecret,
                testnet: credentials.testnet || false
            });

            // Test connection
            const isValid = await bybitClient.testConnection();
            if (!isValid) {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: 'Failed to connect to Bybit. Please check your API credentials.'
                }));
                return;
            }

            setClient(bybitClient);

            // Fetch initial data
            const [balanceData, positionsData] = await Promise.all([
                bybitClient.getWalletBalance('UNIFIED'),
                bybitClient.getPositions('linear')
            ]);

            const totalEquity = parseFloat(balanceData.totalEquity);
            const totalUnrealizedPnL = positionsData.reduce(
                (sum, pos) => sum + parseFloat(pos.unrealisedPnl),
                0
            );

            setState(prev => ({
                ...prev,
                balance: balanceData,
                positions: positionsData,
                totalEquity,
                totalUnrealizedPnL,
                isLoading: false,
                error: null
            }));

            // Initialize WebSocket for real-time updates
            const bybitWs = new BybitWebSocket(
                credentials.api_key,
                apiSecret,
                credentials.testnet || false
            );

            // Subscribe to wallet updates
            bybitWs.subscribe('wallet', (data) => {
                setState(prev => ({
                    ...prev,
                    balance: data,
                    totalEquity: parseFloat(data.totalEquity)
                }));
            });

            // Subscribe to position updates
            bybitWs.subscribe('position', (data) => {
                setState(prev => {
                    const updatedPositions = [...prev.positions];
                    const index = updatedPositions.findIndex(p => p.symbol === data.symbol);

                    if (index >= 0) {
                        updatedPositions[index] = data;
                    } else {
                        updatedPositions.push(data);
                    }

                    const totalUnrealizedPnL = updatedPositions.reduce(
                        (sum, pos) => sum + parseFloat(pos.unrealisedPnl),
                        0
                    );

                    return {
                        ...prev,
                        positions: updatedPositions,
                        totalUnrealizedPnL
                    };
                });
            });

            setWs(bybitWs);
            setState(prev => ({ ...prev, isConnected: true }));

        } catch (error: any) {
            console.error('Error initializing Bybit:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message || 'Failed to initialize Bybit connection'
            }));
        }
    }, []);

    /**
     * Refresh data manually
     */
    const refresh = useCallback(async () => {
        if (!client) return;

        try {
            const [balanceData, positionsData] = await Promise.all([
                client.getWalletBalance('UNIFIED'),
                client.getPositions('linear')
            ]);

            const totalEquity = parseFloat(balanceData.totalEquity);
            const totalUnrealizedPnL = positionsData.reduce(
                (sum, pos) => sum + parseFloat(pos.unrealisedPnl),
                0
            );

            setState(prev => ({
                ...prev,
                balance: balanceData,
                positions: positionsData,
                totalEquity,
                totalUnrealizedPnL
            }));
        } catch (error: any) {
            console.error('Error refreshing Bybit data:', error);
            setState(prev => ({ ...prev, error: error.message }));
        }
    }, [client]);

    /**
     * Disconnect from Bybit
     */
    const disconnect = useCallback(() => {
        if (ws) {
            ws.disconnect();
            setWs(null);
        }
        setClient(null);
        setState({
            balance: null,
            positions: [],
            totalEquity: 0,
            totalUnrealizedPnL: 0,
            isConnected: false,
            isLoading: false,
            error: null
        });
    }, [ws]);

    // Initialize on mount
    useEffect(() => {
        initializeBybit();

        // Cleanup on unmount
        return () => {
            if (ws) {
                ws.disconnect();
            }
        };
    }, [initializeBybit]);

    return {
        ...state,
        client,
        refresh,
        disconnect,
        reconnect: initializeBybit
    };
}
