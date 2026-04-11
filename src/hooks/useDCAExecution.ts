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

      // TODO: Use POST /v5/order/create-batch for plans with 3+ assets
      // to execute all buys in a single API call (up to 10 orders per batch)
      // This reduces latency and ensures atomic execution
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
