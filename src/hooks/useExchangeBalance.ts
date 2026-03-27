import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import CryptoJS from 'crypto-js';

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
  // Funding account
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

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'apice-capital-default-key-change-in-production';

function decryptSecret(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

function signRequest(apiKey: string, apiSecret: string, recvWindow: string, params: string): { timestamp: string; signature: string } {
  const timestamp = Date.now().toString();
  const signStr = `${timestamp}${apiKey}${recvWindow}${params}`;
  const signature = CryptoJS.HmacSHA256(signStr, apiSecret).toString(CryptoJS.enc.Hex);
  return { timestamp, signature };
}

function bybitHeaders(apiKey: string, timestamp: string, signature: string, recvWindow: string) {
  return {
    'X-BAPI-API-KEY': apiKey,
    'X-BAPI-TIMESTAMP': timestamp,
    'X-BAPI-SIGN': signature,
    'X-BAPI-RECV-WINDOW': recvWindow,
  };
}

async function fetchBalanceDirect(apiKey: string, apiSecret: string, testnet: boolean): Promise<ExchangeBalance> {
  const baseUrl = testnet
    ? 'https://api-testnet.bybit.com'
    : 'https://api.bybit.com';
  const recvWindow = '20000';

  // 1. Fetch UNIFIED account
  const unifiedParams = 'accountType=UNIFIED';
  const { timestamp: ts1, signature: sig1 } = signRequest(apiKey, apiSecret, recvWindow, unifiedParams);

  const res = await fetch(`${baseUrl}/v5/account/wallet-balance?${unifiedParams}`, {
    headers: bybitHeaders(apiKey, ts1, sig1, recvWindow),
  });

  const json = await res.json();
  if (json.retCode !== 0) {
    throw new Error(json.retMsg || 'Bybit API error');
  }

  const account = json.result.list[0];
  const holdings: CoinHolding[] = account.coin
    .filter((c: any) => parseFloat(c.equity || '0') > 0)
    .map((c: any) => ({
      coin: c.coin,
      balance: parseFloat(c.walletBalance || '0'),
      equity: parseFloat(c.equity || '0'),
      usdValue: parseFloat(c.usdValue || '0'),
      unrealisedPnl: parseFloat(c.unrealisedPnl || '0'),
      availableToWithdraw: parseFloat(c.availableToWithdraw || '0'),
    }))
    .sort((a: CoinHolding, b: CoinHolding) => b.usdValue - a.usdValue);

  // 2. Fetch FUNDING account
  let fundingBalance = 0;
  let fundingHoldings: FundingHolding[] = [];
  try {
    const fundParams = 'accountType=FUND';
    const { timestamp: ts2, signature: sig2 } = signRequest(apiKey, apiSecret, recvWindow, fundParams);
    const fundRes = await fetch(`${baseUrl}/v5/asset/transfer/query-account-coins-balance?${fundParams}`, {
      headers: bybitHeaders(apiKey, ts2, sig2, recvWindow),
    });
    const fundJson = await fundRes.json();
    if (fundJson.retCode === 0) {
      const fundCoins = fundJson.result?.balance || [];
      fundingHoldings = fundCoins
        .filter((c: any) => parseFloat(c.walletBalance || '0') > 0)
        .map((c: any) => ({
          coin: c.coin,
          balance: parseFloat(c.walletBalance || '0'),
          usdValue: parseFloat(c.transferBalance || '0'),
        }))
        .sort((a: FundingHolding, b: FundingHolding) => b.usdValue - a.usdValue);
      fundingBalance = fundingHoldings.reduce((sum, c) => sum + c.usdValue, 0);
    }
  } catch {
    // Funding account may not be available
  }

  const totalEquity = parseFloat(account.totalEquity || '0');

  return {
    totalEquity,
    totalWalletBalance: parseFloat(account.totalWalletBalance || '0'),
    totalAvailableBalance: parseFloat(account.totalAvailableBalance || '0'),
    totalUnrealizedPnL: parseFloat(account.totalPerpUPL || '0'),
    holdings,
    accountType: account.accountType,
    testnet,
    fundingBalance,
    fundingHoldings,
    grandTotal: totalEquity + fundingBalance,
  };
}

export function useExchangeBalance() {
  const { user } = useAuth();
  const [state, setState] = useState<ExchangeBalanceState>({
    data: null,
    isLoading: true,
    isRefreshing: false,
    error: null,
    status: 'loading',
  });

  const fetchBalance = useCallback(async (isRefresh = false) => {
    if (!isSupabaseConfigured || !user) {
      setState({
        data: null,
        isLoading: false,
        isRefreshing: false,
        error: null,
        status: 'no_credentials',
      });
      return;
    }

    if (isRefresh) {
      setState((prev) => ({ ...prev, isRefreshing: true }));
    }

    try {
      // Try Edge Function first
      let data: ExchangeBalance | null = null;
      let usedEdgeFunction = false;

      try {
        const result = await supabase.functions.invoke('bybit-account', {
          body: { action: 'balance' },
        });

        if (!result.error && result.data && !result.data.error) {
          data = result.data.data;
          usedEdgeFunction = true;
        }
      } catch {
        // Edge Function not available, will fallback
      }

      // Fallback: direct Bybit API call using stored credentials
      if (!usedEdgeFunction) {
        const { data: creds, error: credsErr } = await supabase
          .from('bybit_credentials')
          .select('api_key, api_secret_encrypted, testnet')
          .eq('user_id', user.id)
          .single();

        if (credsErr || !creds) {
          setState({
            data: null,
            isLoading: false,
            isRefreshing: false,
            error: null,
            status: 'no_credentials',
          });
          return;
        }

        const apiSecret = decryptSecret(creds.api_secret_encrypted);
        if (!apiSecret) {
          throw new Error('Failed to decrypt API secret');
        }

        data = await fetchBalanceDirect(creds.api_key, apiSecret, creds.testnet ?? false);
      }

      setState({
        data,
        isLoading: false,
        isRefreshing: false,
        error: null,
        status: 'connected',
      });
    } catch (err: any) {
      console.error('[useExchangeBalance] Error:', err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isRefreshing: false,
        error: err.message || 'Failed to fetch balance',
        status: 'error',
      }));
    }
  }, [user]);

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
