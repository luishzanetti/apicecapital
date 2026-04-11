import { useState, useCallback } from 'react';
import { invokeEdgeFunction } from '@/lib/supabaseFunction';

interface TradeResult {
  asset: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number | null;
  price: number | null;
  amountUsdt: number | null;
  orderId: string | null;
  status: 'success' | 'failed';
  error: string | null;
}

interface TradeOrder {
  id: string;
  asset_symbol: string;
  side: 'buy' | 'sell';
  order_type: string;
  amount_usdt: number | null;
  quantity: number | null;
  target_price: number | null;
  trigger_price: number | null;
  status: string;
  bybit_order_id: string | null;
  fill_price: number | null;
  fill_quantity: number | null;
  realized_pnl: number | null;
  cost_basis: number | null;
  source: string;
  market_regime: string | null;
  created_at: string;
  filled_at: string | null;
}

export function useTradeExecution() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<TradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const sellAsset = useCallback(async (
    asset: string,
    quantity: number,
    source: string = 'manual',
    regime: string | null = null
  ): Promise<TradeResult | null> => {
    setIsExecuting(true);
    setError(null);
    try {
      const { data, error: fnError } = await invokeEdgeFunction<{ data: TradeResult }>(
        'trade-execute',
        { body: { action: 'sell-spot', asset, quantity, source, regime } }
      );
      if (fnError) throw fnError;
      const result = data?.data ?? null;
      setLastResult(result);
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sell order failed';
      setError(message);
      return null;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const buyAsset = useCallback(async (
    asset: string,
    amountUsdt: number,
    source: string = 'manual',
    regime: string | null = null
  ): Promise<TradeResult | null> => {
    setIsExecuting(true);
    setError(null);
    try {
      const { data, error: fnError } = await invokeEdgeFunction<{ data: TradeResult }>(
        'trade-execute',
        { body: { action: 'buy-spot', asset, amountUsdt, source, regime } }
      );
      if (fnError) throw fnError;
      const result = data?.data ?? null;
      setLastResult(result);
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Buy order failed';
      setError(message);
      return null;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const setTakeProfit = useCallback(async (
    asset: string,
    quantity: number,
    targetPrice: number,
    regime: string | null = null
  ): Promise<TradeResult | null> => {
    setIsExecuting(true);
    setError(null);
    try {
      const { data, error: fnError } = await invokeEdgeFunction<{ data: TradeResult }>(
        'trade-execute',
        { body: { action: 'take-profit', asset, quantity, targetPrice, regime } }
      );
      if (fnError) throw fnError;
      const result = data?.data ?? null;
      setLastResult(result);
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Take-profit order failed';
      setError(message);
      return null;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const setStopLoss = useCallback(async (
    asset: string,
    quantity: number,
    triggerPrice: number,
    regime: string | null = null
  ): Promise<TradeResult | null> => {
    setIsExecuting(true);
    setError(null);
    try {
      const { data, error: fnError } = await invokeEdgeFunction<{ data: TradeResult }>(
        'trade-execute',
        { body: { action: 'stop-loss', asset, quantity, triggerPrice, regime } }
      );
      if (fnError) throw fnError;
      const result = data?.data ?? null;
      setLastResult(result);
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Stop-loss order failed';
      setError(message);
      return null;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const cancelOrder = useCallback(async (
    orderId: string,
    asset: string
  ): Promise<boolean> => {
    setIsExecuting(true);
    setError(null);
    try {
      const { error: fnError } = await invokeEdgeFunction(
        'trade-execute',
        { body: { action: 'cancel-order', orderId, asset } }
      );
      if (fnError) throw fnError;
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Cancel order failed';
      setError(message);
      return false;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const fetchTradeHistory = useCallback(async (
    limit: number = 50
  ): Promise<TradeOrder[]> => {
    try {
      const { data, error: fnError } = await invokeEdgeFunction<{ data: TradeOrder[] }>(
        'trade-execute',
        { body: { action: 'history', limit } }
      );
      if (fnError) throw fnError;
      return data?.data ?? [];
    } catch {
      return [];
    }
  }, []);

  return {
    sellAsset,
    buyAsset,
    setTakeProfit,
    setStopLoss,
    cancelOrder,
    fetchTradeHistory,
    isExecuting,
    lastResult,
    error,
    clearError,
  };
}
