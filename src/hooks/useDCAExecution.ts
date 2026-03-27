import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';

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

interface ExecutePlanResult {
  planId: string;
  executions: Array<{
    asset: string;
    symbol: string;
    amountUsdt: number;
    quantity: string | null;
    price: string | null;
    orderId: string | null;
    status: 'success' | 'failed';
    error: string | null;
  }>;
  totalSpent: number;
}

export function useDCAExecution() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<ExecutePlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executePlan = useCallback(async (planId: string): Promise<ExecutePlanResult | null> => {
    if (!isSupabaseConfigured) {
      setError('Supabase not configured');
      return null;
    }

    setIsExecuting(true);
    setError(null);
    setLastResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('dca-execute', {
        body: { action: 'execute-plan', planId },
      });

      if (fnError) throw fnError;

      if (data?.error) {
        setError(data.error === 'no_credentials'
          ? 'Connect your Bybit account first'
          : data.message || data.error);
        return null;
      }

      const result = data?.data as ExecutePlanResult;
      setLastResult(result);
      return result;
    } catch (err: any) {
      console.error('[useDCAExecution] Error:', err);
      setError(err.message || 'Execution failed');
      return null;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const fetchHistory = useCallback(async (planId?: string, limit = 20): Promise<DCAExecution[]> => {
    if (!isSupabaseConfigured) return [];

    try {
      const { data, error: fnError } = await supabase.functions.invoke('dca-execute', {
        body: { action: 'history', planId, limit },
      });

      if (fnError) throw fnError;
      return (data?.data as DCAExecution[]) || [];
    } catch (err) {
      console.error('[useDCAExecution] History fetch error:', err);
      return [];
    }
  }, []);

  return {
    executePlan,
    fetchHistory,
    isExecuting,
    lastResult,
    error,
    clearError: () => setError(null),
  };
}
