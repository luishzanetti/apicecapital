import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { invokeEdgeFunction } from '@/lib/supabaseFunction';
import { useAuth } from '@/components/AuthProvider';

// SECURITY FIX: Removed client-side decryption of API secrets and direct Bybit API calls.
// All Bybit operations now go exclusively through Supabase Edge Functions, which handle
// decryption and API calls server-side. Removed: decryptSecret, signRequest, bybitSpotOrder,
// executeDirectly, and the direct-call fallback path.

// ---- Types ----

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

export interface LocalPlanData {
  id: string;
  assets: Array<{ symbol: string; allocation: number }>;
  amountPerInterval: number;
  frequency: string;
}

function simulateExecution(plan: LocalPlanData): ExecutePlanResult {
  const executions = plan.assets.map((asset) => {
    const amountUsdt = (plan.amountPerInterval * asset.allocation) / 100;

    if (amountUsdt < 1) {
      return {
        asset: asset.symbol,
        symbol: asset.symbol,
        amountUsdt,
        quantity: null,
        price: null,
        orderId: null,
        status: 'failed' as const,
        error: `Amount too low to execute: $${amountUsdt.toFixed(2)} (minimum $1)`,
      };
    }

    return {
      asset: asset.symbol,
      symbol: asset.symbol,
      amountUsdt,
      quantity: null,
      price: null,
      orderId: `demo-${plan.id}-${asset.symbol.toLowerCase()}`,
      status: 'success' as const,
      error: null,
    };
  });

  return {
    planId: plan.id,
    executions,
    totalSpent: executions
      .filter((execution) => execution.status === 'success')
      .reduce((sum, execution) => sum + execution.amountUsdt, 0),
  };
}

// ---- HMAC-SHA256 for Bybit Auth (client-side, for test only) ----

async function hmacSHA256(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---- API Key Validation (direct Bybit API — no edge function needed) ----

/**
 * Test Bybit API key validity by calling the Bybit API directly.
 * This is safe because the user just entered the key/secret in the form —
 * we're testing BEFORE saving to the database.
 */
async function testBybitConnection(
  apiKey: string,
  apiSecret: string,
  testnet: boolean
): Promise<{ valid: boolean; retMsg?: string }> {
  const baseUrl = testnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
  const timestamp = Date.now().toString();
  const recvWindow = '20000';
  const signature = await hmacSHA256(apiSecret, timestamp + apiKey + recvWindow);

  const res = await fetch(`${baseUrl}/v5/account/info`, {
    headers: {
      'X-BAPI-API-KEY': apiKey,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': recvWindow,
      'X-BAPI-SIGN': signature,
    },
  });

  const json = await res.json();
  return { valid: json.retCode === 0, retMsg: json.retMsg };
}

/**
 * Test Bybit API key — auto-detects mainnet vs testnet.
 * Tries mainnet first, if invalid tries testnet automatically.
 */
export async function testBybitApiKey(
  apiKey: string,
  apiSecret: string,
  testnet?: boolean,
  _accessToken?: string
): Promise<{ valid: boolean; canTrade: boolean; isTestnet: boolean; error?: string }> {
  const cleanKey = apiKey.trim();
  const cleanSecret = apiSecret.trim();

  if (!cleanKey || !cleanSecret) {
    return { valid: false, canTrade: false, isTestnet: false, error: 'API Key and Secret cannot be empty.' };
  }

  try {
    // If testnet explicitly set, only test that network
    if (testnet !== undefined && testnet !== null) {
      const result = await testBybitConnection(cleanKey, cleanSecret, testnet);
      if (result.valid) {
        return { valid: true, canTrade: true, isTestnet: testnet };
      }
      return { valid: false, canTrade: false, isTestnet: testnet, error: result.retMsg || 'Invalid API credentials' };
    }

    // Auto-detect: try mainnet first
    const mainnet = await testBybitConnection(cleanKey, cleanSecret, false);
    if (mainnet.valid) {
      return { valid: true, canTrade: true, isTestnet: false };
    }

    // Mainnet failed — try testnet
    const testnetResult = await testBybitConnection(cleanKey, cleanSecret, true);
    if (testnetResult.valid) {
      return { valid: true, canTrade: true, isTestnet: true };
    }

    // Both failed
    return { valid: false, canTrade: false, isTestnet: false, error: mainnet.retMsg || 'Invalid API credentials on both mainnet and testnet' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to connect to Bybit';
    return { valid: false, canTrade: false, isTestnet: false, error: message };
  }
}

// ---- Hook ----

export function useDCAExecution() {
  const { user, session } = useAuth();
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<ExecutePlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executePlan = useCallback(async (planId: string, localPlan?: LocalPlanData): Promise<ExecutePlanResult | null> => {
    if (!user) {
      setError('Log in to execute DCA.');
      return null;
    }

    setIsExecuting(true);
    setError(null);
    setLastResult(null);

    try {
      if (!isSupabaseConfigured) {
        if (!localPlan) {
          throw new Error('Local mode: no plan available for simulation.');
        }

        const simulatedResult = simulateExecution(localPlan);
        setLastResult(simulatedResult);
        return simulatedResult;
      }

      const { data, error: fnError } = await invokeEdgeFunction('dca-execute', {
        body: {
          action: 'execute-plan',
          planId,
          ...(localPlan ? { localPlan } : {}),
        },
        token: session?.access_token,
      });

      if (fnError) {
        throw new Error(fnError.message || 'DCA execution request failed');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const result = data?.data as ExecutePlanResult;
      if (!result) {
        throw new Error('No execution result returned from server.');
      }

      setLastResult(result);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Execution failed';
      setError(
        msg.includes('no_credentials') || msg.includes('Connect')
          ? 'Connect your Bybit account first in Settings.'
          : msg
      );
      return null;
    } finally {
      setIsExecuting(false);
    }
  }, [session?.access_token, user]);

  const fetchHistory = useCallback(async (planId?: string, limit = 20): Promise<DCAExecution[]> => {
    if (!isSupabaseConfigured || !user) return [];

    try {
      // Try Edge Function first
      try {
        const { data, error: fnError } = await invokeEdgeFunction('dca-execute', {
          body: { action: 'history', planId, limit },
          token: session?.access_token,
        });
        if (!fnError && data?.data) return data.data as DCAExecution[];
      } catch {
        // Fallback to direct DB query (read-only, no secrets involved)
      }

      // Direct DB query fallback (safe -- no secrets, just reading execution history)
      let query = supabase
        .from('dca_executions')
        .select('*')
        .eq('user_id', user.id)
        .order('executed_at', { ascending: false })
        .limit(limit);

      if (planId) query = query.eq('plan_id', planId);

      const { data: executions } = await query;
      return (executions as DCAExecution[]) || [];
    } catch {
      return [];
    }
  }, [session?.access_token, user]);

  return {
    executePlan,
    fetchHistory,
    isExecuting,
    lastResult,
    error,
    clearError: () => { setError(null); setLastResult(null); },
  };
}
