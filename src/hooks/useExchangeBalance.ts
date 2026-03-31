import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export interface CoinHolding {
  coin: string;
  balance: number;
  equity: number;
  usdValue: number;
  unrealisedPnl: number;
  availableToWithdraw: number;
}

export interface FundingHolding {
  coin: string;
  balance: number;
  usdValue: number;
}

export interface ExchangeBalance {
  totalEquity: number;
  totalWalletBalance: number;
  totalAvailableBalance: number;
  totalUnrealizedPnL: number;
  holdings: CoinHolding[];
  accountType: string;
  testnet: boolean;
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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Call edge function directly with fetch() — bypasses supabase-js token management
 * which has issues with the edge function gateway.
 */
/**
 * Call edge function using anon key for gateway auth (always accepted)
 * and pass user JWT as x-user-token header for the function to verify internally.
 * This bypasses the gateway's JWT validation which rejects user tokens.
 */
async function callEdgeFunction(functionName: string, body: Record<string, any>, accessToken: string) {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'x-user-token': accessToken,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error || errorBody?.msg || errorBody?.message || `Edge function error (${res.status})`);
  }

  return res.json();
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

    if (isRefresh) {
      setState((prev) => ({ ...prev, isRefreshing: true }));
    }

    try {
      // Step 1: Check credentials via DB query (auto-refreshes tokens)
      const { data: creds } = await supabase
        .from('bybit_credentials')
        .select('api_key, testnet')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!creds) {
        setState({ data: null, isLoading: false, isRefreshing: false, error: null, status: 'no_credentials' });
        return;
      }

      // Step 2: Call edge function directly with fetch() + explicit token
      const result = await callEdgeFunction('bybit-account', { action: 'balance' }, session.access_token);

      if (result?.error) {
        throw new Error(result.error);
      }

      setState({
        data: result.data as ExchangeBalance,
        isLoading: false,
        isRefreshing: false,
        error: null,
        status: 'connected',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch balance';
      console.error('[useExchangeBalance] Error:', message);
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
