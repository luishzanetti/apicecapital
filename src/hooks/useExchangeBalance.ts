import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { invokeEdgeFunction } from '@/lib/supabaseFunction';

export interface CoinHolding {
  coin: string;
  balance: number;
  walletBalance?: number;
  spotBorrow?: number;
  equity: number;
  usdValue: number;
  unrealisedPnl: number;
  availableToWithdraw: number;
  locked?: number;
  marginCollateral?: boolean;
  collateralSwitch?: boolean;
}

export interface FundingHolding {
  coin: string;
  balance: number;
  usdValue: number;
}

export interface FuturesPosition {
  category: string;
  symbol: string;
  side: string;
  size: number;
  entryPrice: number;
  markPrice: number;
  leverage: number;
  unrealisedPnl: number;
  notionalUsd: number;
  initialMarginUsd: number;
  maintenanceMarginUsd: number;
}

export interface ExchangeBalance {
  totalEquity: number;
  totalWalletBalance: number;
  totalMarginBalance: number;
  totalAvailableBalance: number;
  totalUnrealizedPnL: number;
  totalInitialMargin: number;
  totalMaintenanceMargin: number;
  holdings: CoinHolding[];
  accountType: string;
  testnet: boolean;
  spotBalance: number;
  futuresBalance: number;
  futuresInitialMargin: number;
  futuresPositionCount: number;
  futuresNotional: number;
  futuresMarginBalance: number;
  futuresMaintenanceMargin: number;
  futuresUnrealizedPnl: number;
  futuresPositions: FuturesPosition[];
  fundingBalance: number;
  fundingHoldings: FundingHolding[];
  grandTotal: number;
}

interface ExchangeBalanceState {
  data: ExchangeBalance | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  status: 'idle' | 'loading' | 'connected' | 'no_credentials' | 'error';
}

export function useExchangeBalance() {
  const { user, session } = useAuth();
  const [state, setState] = useState<ExchangeBalanceState>({
    data: null,
    isLoading: true,
    isRefreshing: false,
    error: null,
    status: 'loading',
  });

  const fetchBalance = useCallback(async (isRefresh = false) => {
    if (!isSupabaseConfigured || !user || !session?.access_token) {
      setState({ data: null, isLoading: false, isRefreshing: false, error: null, status: 'no_credentials' });
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: prev.data ? prev.isLoading : !isRefresh,
      isRefreshing: isRefresh,
      error: isRefresh ? prev.error : null,
      status: prev.data ? prev.status : 'loading',
    }));

    try {
      // Refresh session to get a fresh access token
      const { data: { session: freshSession } } = await supabase.auth.refreshSession();
      if (!freshSession?.access_token) {
        // Can't refresh — try with existing session anyway
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (!existingSession?.access_token) {
          setState({ data: null, isLoading: false, isRefreshing: false, error: null, status: 'no_credentials' });
          return;
        }
      }

      const { data: creds } = await supabase
        .from('bybit_credentials')
        .select('api_key, testnet')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!creds) {
        setState({ data: null, isLoading: false, isRefreshing: false, error: null, status: 'no_credentials' });
        return;
      }

      const { data: result, error: functionError } = await invokeEdgeFunction<{ data: ExchangeBalance }>(
        'bybit-account',
        {
          body: { action: 'balance' },
        }
      );

      if (functionError) {
        throw functionError;
      }

      setState({
        data: result?.data ?? null,
        isLoading: false,
        isRefreshing: false,
        error: null,
        status: result?.data ? 'connected' : 'error',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch balance';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isRefreshing: false,
        error: message,
        status: 'error',
      }));
    }
  }, [user, session?.access_token]);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(() => fetchBalance(true), 60_000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  return {
    ...state,
    refresh: () => fetchBalance(true),
  };
}
