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
  const { user, session, loading: authLoading } = useAuth();
  const [state, setState] = useState<ExchangeBalanceState>({
    data: null,
    isLoading: true,
    isRefreshing: false,
    error: null,
    status: 'loading',
  });

  const fetchBalance = useCallback(
    async (currentUserId: string, isRefresh = false) => {
      if (!isSupabaseConfigured) {
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
        if (import.meta.env.DEV) {
          console.info('[balance] fetch start', { userId: currentUserId, isRefresh });
        }

        const { data: creds, error: credsError } = await supabase
          .from('bybit_credentials')
          .select('api_key, testnet')
          .eq('user_id', currentUserId)
          .maybeSingle();

        if (credsError) {
          if (import.meta.env.DEV) console.warn('[balance] credentials query error:', credsError);
        }

        if (!creds) {
          if (import.meta.env.DEV) {
            console.warn('[balance] no_credentials — no bybit_credentials row for user. Check Settings → Connect Bybit, and verify RLS allows SELECT for auth.uid() = user_id.');
          }
          setState({ data: null, isLoading: false, isRefreshing: false, error: null, status: 'no_credentials' });
          return;
        }

        if (import.meta.env.DEV) {
          console.info('[balance] creds row found, invoking bybit-account edge function', { apiKeyPrefix: creds.api_key?.slice(0, 6) + '…', testnet: creds.testnet });
        }

        const { data: result, error: functionError } = await invokeEdgeFunction<{ data: ExchangeBalance }>(
          'bybit-account',
          { body: { action: 'balance' } },
        );

        if (functionError) {
          if (import.meta.env.DEV) console.error('[balance] edge function error:', functionError.message);
          throw functionError;
        }

        if (import.meta.env.DEV) {
          console.info('[balance] edge function success', {
            grandTotal: result?.data?.grandTotal,
            holdingsCount: result?.data?.holdings?.length,
            accountType: result?.data?.accountType,
          });
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
        if (import.meta.env.DEV) console.error('[balance] fetch failed:', message);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: message,
          status: 'error',
        }));
      }
    },
    [],
  );

  // Wait for auth to finish hydrating before first fetch. Re-fetch when
  // the user changes (login/logout/token refresh).
  useEffect(() => {
    // Supabase not configured → surface immediately.
    if (!isSupabaseConfigured) {
      setState({ data: null, isLoading: false, isRefreshing: false, error: null, status: 'no_credentials' });
      return;
    }
    // Auth still hydrating — keep "loading" state, DO NOT flash "connect".
    if (authLoading) {
      setState((prev) => ({ ...prev, isLoading: true, status: prev.data ? prev.status : 'loading' }));
      return;
    }
    // Auth resolved, no user — genuine "need to connect".
    if (!user || !session) {
      setState({ data: null, isLoading: false, isRefreshing: false, error: null, status: 'no_credentials' });
      return;
    }

    // User present → fetch balance and poll every 60s.
    fetchBalance(user.id);
    const interval = setInterval(() => fetchBalance(user.id, true), 60_000);
    return () => clearInterval(interval);
  }, [authLoading, user, session, fetchBalance]);

  // Full diagnostic trace — step-by-step response envelope for debugging UI.
  const diagnose = useCallback(async (): Promise<{
    supabaseConfigured: boolean;
    authLoading: boolean;
    hasSession: boolean;
    userId: string | null;
    credentialsRow: { apiKeyPrefix: string; testnet: boolean } | null;
    credentialsError: string | null;
    edgeFunctionResponse: unknown | null;
    edgeFunctionError: string | null;
  }> => {
    const result = {
      supabaseConfigured: isSupabaseConfigured,
      authLoading,
      hasSession: Boolean(session),
      userId: user?.id ?? null,
      credentialsRow: null as { apiKeyPrefix: string; testnet: boolean } | null,
      credentialsError: null as string | null,
      edgeFunctionResponse: null as unknown,
      edgeFunctionError: null as string | null,
    };
    if (!isSupabaseConfigured || !user?.id) return result;
    try {
      const { data: creds, error: credsError } = await supabase
        .from('bybit_credentials')
        .select('api_key, testnet')
        .eq('user_id', user.id)
        .maybeSingle();
      result.credentialsError = credsError?.message ?? null;
      if (creds) {
        result.credentialsRow = {
          apiKeyPrefix: (creds.api_key ?? '').slice(0, 8) + '…',
          testnet: creds.testnet ?? false,
        };
      }
    } catch (err) {
      result.credentialsError = err instanceof Error ? err.message : 'unknown';
    }
    try {
      const { data, error } = await invokeEdgeFunction('bybit-account', {
        body: { action: 'balance' },
      });
      result.edgeFunctionResponse = data;
      result.edgeFunctionError = error?.message ?? null;
    } catch (err) {
      result.edgeFunctionError = err instanceof Error ? err.message : 'unknown';
    }
    return result;
  }, [authLoading, session, user]);

  return {
    ...state,
    refresh: () => {
      if (user?.id) fetchBalance(user.id, true);
    },
    diagnose,
  };
}
