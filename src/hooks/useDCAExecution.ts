import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import CryptoJS from 'crypto-js';

// ─── Types ──────────────────────────────────────────────────

export interface DCAExecution {
  id: string;
  plan_id: string;
  asset_symbol: string;
  amount_usdt: number;
  quantity: number | null;
  price: number | null;
  status: 'pending' | 'success' | 'failed';
  error_message: string | null;
  bybit_order_id: string | null;
  executed_at: string;
}

export interface AssetExecution {
  asset: string;
  symbol: string;
  amountUsdt: number;
  quantity: string | null;
  price: string | null;
  orderId: string | null;
  status: 'success' | 'failed';
  error: string | null;
}

export interface ExecutePlanResult {
  planId: string;
  executions: AssetExecution[];
  totalSpent: number;
}

// ─── Bybit API helpers (client-side direct) ─────────────────

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'apice-capital-default-key-change-in-production';

const ASSET_TO_SYMBOL: Record<string, string> = {
  BTC: 'BTCUSDT', ETH: 'ETHUSDT', SOL: 'SOLUSDT', BNB: 'BNBUSDT',
  XRP: 'XRPUSDT', ADA: 'ADAUSDT', DOGE: 'DOGEUSDT', AVAX: 'AVAXUSDT',
  DOT: 'DOTUSDT', LINK: 'LINKUSDT', MATIC: 'MATICUSDT', LTC: 'LTCUSDT',
  TRX: 'TRXUSDT', SHIB: 'SHIBUSDT', UNI: 'UNIUSDT', NEAR: 'NEARUSDT',
  APT: 'APTUSDT', ARB: 'ARBUSDT', OP: 'OPUSDT', SUI: 'SUIUSDT',
  PEPE: 'PEPEUSDT', WIF: 'WIFUSDT', FET: 'FETUSDT', RENDER: 'RENDERUSDT',
  INJ: 'INJUSDT', SEI: 'SEIUSDT', TIA: 'TIAUSDT', JUP: 'JUPUSDT',
};

function decryptSecret(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

function signRequest(apiKey: string, apiSecret: string, recvWindow: string, payload: string) {
  const timestamp = Date.now().toString();
  const signStr = `${timestamp}${apiKey}${recvWindow}${payload}`;
  const signature = CryptoJS.HmacSHA256(signStr, apiSecret).toString(CryptoJS.enc.Hex);
  return { timestamp, signature };
}

async function bybitSpotOrder(
  apiKey: string,
  apiSecret: string,
  testnet: boolean,
  tradingSymbol: string,
  amountUsdt: number
): Promise<{ orderId: string; qty: string | null; price: string | null }> {
  const baseUrl = testnet
    ? 'https://api-testnet.bybit.com'
    : 'https://api.bybit.com';
  const recvWindow = '20000';

  const body = {
    category: 'spot',
    symbol: tradingSymbol,
    side: 'Buy',
    orderType: 'Market',
    qty: amountUsdt.toFixed(2),
    marketUnit: 'quoteCoin',
  };
  const bodyStr = JSON.stringify(body);
  const { timestamp, signature } = signRequest(apiKey, apiSecret, recvWindow, bodyStr);

  const res = await fetch(`${baseUrl}/v5/order/create`, {
    method: 'POST',
    headers: {
      'X-BAPI-API-KEY': apiKey,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-SIGN': signature,
      'X-BAPI-RECV-WINDOW': recvWindow,
      'X-BAPI-SIGN-TYPE': '2',
      'Content-Type': 'application/json',
    },
    body: bodyStr,
  });

  const json = await res.json();
  if (json.retCode !== 0) {
    throw new Error(json.retMsg || `Bybit error ${json.retCode}`);
  }

  const orderId = json.result?.orderId || '';

  // Fetch order details to get filled qty and price
  let qty: string | null = null;
  let price: string | null = null;

  if (orderId) {
    try {
      // Wait briefly for order to fill
      await new Promise((r) => setTimeout(r, 1500));

      const orderParams = `category=spot&orderId=${orderId}`;
      const { timestamp: ts2, signature: sig2 } = signRequest(apiKey, apiSecret, recvWindow, orderParams);

      const orderRes = await fetch(`${baseUrl}/v5/order/realtime?${orderParams}`, {
        headers: {
          'X-BAPI-API-KEY': apiKey,
          'X-BAPI-TIMESTAMP': ts2,
          'X-BAPI-SIGN': sig2,
          'X-BAPI-RECV-WINDOW': recvWindow,
          'X-BAPI-SIGN-TYPE': '2',
        },
      });

      const orderJson = await orderRes.json();
      if (orderJson.retCode === 0 && orderJson.result?.list?.length > 0) {
        const order = orderJson.result.list[0];
        qty = order.cumExecQty || null;
        price = order.avgPrice || null;
      }
    } catch {
      // Order detail fetch is best-effort
    }
  }

  return { orderId, qty, price };
}

// ─── Direct execution (client-side, uses stored credentials) ──

async function executeDirectly(
  userId: string,
  planId: string
): Promise<ExecutePlanResult> {
  // 1. Get plan from local store or DB
  const { data: plan, error: planError } = await supabase
    .from('dca_plans')
    .select('*')
    .eq('id', planId)
    .eq('user_id', userId)
    .single();

  if (planError || !plan) {
    throw new Error('Plan not found in database. Try again in a moment.');
  }

  if (!plan.is_active) {
    throw new Error('Plan is paused. Activate it first.');
  }

  // 2. Get Bybit credentials
  const { data: creds, error: credsError } = await supabase
    .from('bybit_credentials')
    .select('api_key, api_secret_encrypted, testnet')
    .eq('user_id', userId)
    .single();

  if (credsError || !creds) {
    throw new Error('Connect your Bybit account first in Settings.');
  }

  const apiSecret = decryptSecret(creds.api_secret_encrypted);
  if (!apiSecret) {
    throw new Error('Failed to decrypt API secret. Re-save your credentials.');
  }

  const testnet = creds.testnet ?? false;
  const assets: Array<{ symbol: string; allocation: number }> = plan.assets || [];

  const result: ExecutePlanResult = {
    planId,
    executions: [],
    totalSpent: 0,
  };

  // 3. Execute each asset buy
  for (const asset of assets) {
    const tradingSymbol = ASSET_TO_SYMBOL[asset.symbol.toUpperCase()];
    if (!tradingSymbol) {
      result.executions.push({
        asset: asset.symbol,
        symbol: 'UNKNOWN',
        amountUsdt: 0,
        quantity: null,
        price: null,
        orderId: null,
        status: 'failed',
        error: `Unsupported asset: ${asset.symbol}. Add to symbol mapping.`,
      });
      continue;
    }

    const amountUsdt = (plan.amount_per_interval * asset.allocation) / 100;

    if (amountUsdt < 1) {
      result.executions.push({
        asset: asset.symbol,
        symbol: tradingSymbol,
        amountUsdt,
        quantity: null,
        price: null,
        orderId: null,
        status: 'failed',
        error: `Amount too small: $${amountUsdt.toFixed(2)} (Bybit min ~$1)`,
      });
      continue;
    }

    try {
      const orderResult = await bybitSpotOrder(
        creds.api_key,
        apiSecret,
        testnet,
        tradingSymbol,
        amountUsdt
      );

      result.executions.push({
        asset: asset.symbol,
        symbol: tradingSymbol,
        amountUsdt,
        quantity: orderResult.qty,
        price: orderResult.price,
        orderId: orderResult.orderId,
        status: 'success',
        error: null,
      });
      result.totalSpent += amountUsdt;

      // Record execution in DB (best-effort)
      supabase.from('dca_executions').insert({
        plan_id: planId,
        user_id: userId,
        asset_symbol: asset.symbol,
        amount_usdt: amountUsdt,
        quantity: orderResult.qty ? parseFloat(orderResult.qty) : null,
        price: orderResult.price ? parseFloat(orderResult.price) : null,
        status: 'success',
        bybit_order_id: orderResult.orderId || null,
      }).then(({ error }) => {
        if (error) console.warn('[DCA] Failed to record execution:', error.message);
      });

    } catch (err: any) {
      console.error(`[DCA] Order failed for ${tradingSymbol}:`, err);

      result.executions.push({
        asset: asset.symbol,
        symbol: tradingSymbol,
        amountUsdt,
        quantity: null,
        price: null,
        orderId: null,
        status: 'failed',
        error: err.message || 'Order failed',
      });

      // Record failed execution
      supabase.from('dca_executions').insert({
        plan_id: planId,
        user_id: userId,
        asset_symbol: asset.symbol,
        amount_usdt: amountUsdt,
        status: 'failed',
        error_message: err.message || 'Order failed',
      }).then(({ error }) => {
        if (error) console.warn('[DCA] Failed to record failed execution:', error.message);
      });
    }
  }

  // 4. Update plan next execution date and total invested
  const freqMs: Record<string, number> = {
    daily: 86400000,
    weekly: 604800000,
    biweekly: 1209600000,
    monthly: 2592000000,
  };
  const nextDate = new Date(Date.now() + (freqMs[plan.frequency] || freqMs.weekly)).toISOString();

  supabase.from('dca_plans').update({
    next_execution_date: nextDate,
    total_invested: (plan.total_invested || 0) + result.totalSpent,
  }).eq('id', planId).then(({ error }) => {
    if (error) console.warn('[DCA] Failed to update plan:', error.message);
  });

  return result;
}

// ─── Hook ───────────────────────────────────────────────────

export function useDCAExecution() {
  const { user } = useAuth();
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<ExecutePlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executePlan = useCallback(async (planId: string): Promise<ExecutePlanResult | null> => {
    if (!isSupabaseConfigured || !user) {
      setError('Not connected. Please log in first.');
      return null;
    }

    setIsExecuting(true);
    setError(null);
    setLastResult(null);

    try {
      let result: ExecutePlanResult | null = null;

      // Strategy 1: Try Edge Function first (server-side, more secure)
      try {
        const { data, error: fnError } = await supabase.functions.invoke('dca-execute', {
          body: { action: 'execute-plan', planId },
        });

        if (!fnError && data && !data.error) {
          result = data.data as ExecutePlanResult;
        }
      } catch {
        // Edge Function not available, will use direct fallback
      }

      // Strategy 2: Direct client-side execution (fallback)
      if (!result) {
        console.log('[DCA] Edge Function unavailable, executing directly via Bybit API');
        result = await executeDirectly(user.id, planId);
      }

      setLastResult(result);
      return result;
    } catch (err: any) {
      console.error('[useDCAExecution] Error:', err);
      const msg = err.message || 'Execution failed';
      setError(
        msg.includes('no_credentials') || msg.includes('Connect')
          ? 'Connect your Bybit account first in Settings'
          : msg
      );
      return null;
    } finally {
      setIsExecuting(false);
    }
  }, [user]);

  const fetchHistory = useCallback(async (planId?: string, limit = 20): Promise<DCAExecution[]> => {
    if (!isSupabaseConfigured || !user) return [];

    try {
      // Try Edge Function
      try {
        const { data, error: fnError } = await supabase.functions.invoke('dca-execute', {
          body: { action: 'history', planId, limit },
        });
        if (!fnError && data?.data) return data.data as DCAExecution[];
      } catch {
        // Fallback to direct DB query
      }

      // Direct DB query fallback
      let query = supabase
        .from('dca_executions')
        .select('*')
        .eq('user_id', user.id)
        .order('executed_at', { ascending: false })
        .limit(limit);

      if (planId) query = query.eq('plan_id', planId);

      const { data: executions } = await query;
      return (executions as DCAExecution[]) || [];
    } catch (err) {
      console.error('[useDCAExecution] History fetch error:', err);
      return [];
    }
  }, [user]);

  return {
    executePlan,
    fetchHistory,
    isExecuting,
    lastResult,
    error,
    clearError: () => { setError(null); setLastResult(null); },
  };
}
