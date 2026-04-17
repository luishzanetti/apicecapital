import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { invokeEdgeFunction } from '@/lib/supabaseFunction';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/appStore';
import type { BotConfig, StrategyConfig } from '@/store/types';

// ─── Re-export types for backward compatibility ─────────────

export type { BotConfig, StrategyConfig } from '@/store/types';

// ─── Types ──────────────────────────────────────────────────

export interface LeveragedPosition {
  id: string;
  strategyType: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  markPrice: number;
  sizeQty: number;
  sizeUsd: number;
  leverage: number;
  takeProfitPrice: number | null;
  stopLossPrice: number | null;
  unrealizedPnl: number;
  realizedPnl: number;
  fundingReceived: number;
  liquidationPrice: number | null;
  status: string;
  openedAt: string;
}

export interface RiskStatus {
  totalHeat: number;
  maxHeat: number;
  canOpenNew: boolean;
  positionCount: number;
  totalExposure: number;
  circuitBreaker: { isTripped: boolean; dailyPnlPct: number };
}

export interface TradingSignal {
  id: string;
  strategyType: string;
  symbol: string;
  direction: string;
  conviction: number;
  rationale: string;
  riskApproved: boolean;
  wasExecuted: boolean;
  createdAt: string;
}

export interface StrategyPerformance {
  strategyType: string;
  totalPnlUsd: number;
  totalPnlPct: number;
  winRate: number;
  profitFactor: number;
  tradesClosed: number;
  fundingIncome: number;
}

export interface MarketContext {
  regime: string;
  confidence: number;
  data: Record<string, { price: number; rsi: number; sma7: number; sma30: number; funding: number; fg: number }>;
  strategyStatus: Record<string, string>;
}

export interface PendingSignal {
  strategyType: string;
  symbol: string;
  direction: string;
  conviction: number;
  suggestedLeverage: number;
  suggestedSizeUsd: number;
  takeProfit: number | null;
  stopLoss: number | null;
  rationale: string;
  approved: boolean;
}

// ─── Hook ───────────────────────────────────────────────────

const CACHE_TTL = 30_000;

export function useLeveragedTrading() {
  // ─── Store-backed multi-bot state ───────────────────────
  const bots = useAppStore((s) => s.bots);
  const activeBotId = useAppStore((s) => s.activeBotId);
  const addBotStore = useAppStore((s) => s.addBot);
  const removeBotStore = useAppStore((s) => s.removeBot);
  const setActiveBotIdStore = useAppStore((s) => s.setActiveBotId);
  const updateActiveBotStore = useAppStore((s) => s.updateActiveBot);
  const updateStrategiesStore = useAppStore((s) => s.updateStrategies);
  const migrateFromLocalStorage = useAppStore((s) => s.migrateFromLocalStorage);

  // One-shot migration from legacy localStorage (e.g. if persist upgrade didn't run).
  useEffect(() => {
    migrateFromLocalStorage();
  }, [migrateFromLocalStorage]);

  const activeBot = useMemo<BotConfig | null>(
    () => bots.find((b) => b.id === activeBotId) ?? bots[0] ?? null,
    [bots, activeBotId]
  );
  const totalCapital = activeBot?.capital ?? 0;
  const strategies: StrategyConfig[] = activeBot?.strategies ?? [];

  const setTotalCapital = useCallback((amount: number) => {
    updateActiveBotStore({ capital: amount });
  }, [updateActiveBotStore]);

  const setActiveBotId = useCallback((id: string) => {
    setActiveBotIdStore(id);
  }, [setActiveBotIdStore]);

  const addBot = useCallback((
    name: string,
    capital: number,
    profile: string,
    strategyConfigs: StrategyConfig[],
    options?: {
      maxLeverage?: number;
      riskPerTradePct?: number;
      maxPositions?: number;
      autoExecute?: boolean;
      selectedAssets?: string[];
    }
  ) => addBotStore(name, capital, profile, strategyConfigs, options), [addBotStore]);

  const removeBot = useCallback((botId: string) => {
    removeBotStore(botId);
  }, [removeBotStore]);

  const setStrategies = useCallback((updater: (prev: StrategyConfig[]) => StrategyConfig[]) => {
    updateStrategiesStore(updater);
  }, [updateStrategiesStore]);

  // ─── Local (non-persisted) runtime state ─────────────────
  const [positions, setPositions] = useState<LeveragedPosition[]>([]);
  const [risk, setRisk] = useState<RiskStatus>({
    totalHeat: 0, maxHeat: 0.20, canOpenNew: true,
    positionCount: 0, totalExposure: 0,
    circuitBreaker: { isTripped: false, dailyPnlPct: 0 },
  });
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [performance, setPerformance] = useState<StrategyPerformance[]>([]);
  const [marketContext, setMarketContext] = useState<MarketContext | null>(null);
  const [pendingSignals, setPendingSignals] = useState<PendingSignal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetch = useRef(0);

  // ─── Fetch from Supabase (when available) ───────────────

  const fetchStrategies = useCallback(async () => {
    if (!isSupabaseConfigured || !activeBot) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('strategy_configs')
        .select('*')
        .eq('user_id', user.id)
        .order('strategy_type');

      if (data && data.length > 0) {
        const mapped: StrategyConfig[] = data.map((d) => ({
          id: d.id,
          strategyType: d.strategy_type,
          isActive: d.is_active,
          allocationPct: d.allocation_pct,
          maxLeverage: d.max_leverage,
          assets: d.assets || ['BTCUSDT', 'ETHUSDT'],
        }));
        setStrategies(() => mapped);
      }
    } catch { /* Supabase unavailable — use local */ }
  }, [activeBot, setStrategies]);

  const fetchPositions = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('leveraged_positions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'open')
      .order('opened_at', { ascending: false });

    if (data) {
      setPositions(data.map((d) => ({
        id: d.id, strategyType: d.strategy_type, symbol: d.symbol,
        side: d.side, entryPrice: d.entry_price, markPrice: d.mark_price || d.entry_price,
        sizeQty: d.size_qty, sizeUsd: d.size_usd, leverage: d.leverage,
        takeProfitPrice: d.take_profit_price, stopLossPrice: d.stop_loss_price,
        unrealizedPnl: d.unrealized_pnl || 0, realizedPnl: d.realized_pnl || 0,
        fundingReceived: d.funding_received || 0, liquidationPrice: d.liquidation_price,
        status: d.status, openedAt: d.opened_at,
      })));
    }
  }, []);

  const fetchRisk = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error: fnError } = await invokeEdgeFunction<{ data: any }>(
        'risk-monitor', { body: { action: 'check-heat' } }
      );
      if (fnError || !data?.data) return;
      const r = data.data;
      setRisk({
        totalHeat: r.totalHeat || 0, maxHeat: r.maxHeat || 0.20,
        canOpenNew: r.canOpenNew ?? true, positionCount: r.positionCount || 0,
        totalExposure: r.totalExposure || 0,
        circuitBreaker: r.circuitBreaker || { isTripped: false, dailyPnlPct: 0 },
      });
    } catch { /* risk monitor unavailable */ }
  }, []);

  // ─── Trigger strategy evaluation (calls backend) ───────

  const triggerEvaluation = useCallback(async (): Promise<{
    marketContext: MarketContext | null;
    pendingSignals: PendingSignal[];
    executed: number;
  }> => {
    setIsEvaluating(true);
    try {
      const { data, error: fnError } = await invokeEdgeFunction<{ data: any }>(
        'strategy-orchestrator', { body: { action: 'evaluate-user' } }
      );

      if (fnError) {
        if (import.meta.env.DEV) console.error('[ALTIS] Evaluation failed:', fnError.message);
        setError(`Evaluation failed: ${fnError.message}`);
        return { marketContext: null, pendingSignals: [], executed: 0 };
      }
      if (!data?.data) {
        if (import.meta.env.DEV) console.warn('[ALTIS] Evaluation returned no data');
        return { marketContext: null, pendingSignals: [], executed: 0 };
      }

      const result = data.data;

      const ctx: MarketContext = {
        regime: result.regime || 'UNKNOWN',
        confidence: result.confidence || 0,
        data: result.marketContext || {},
        strategyStatus: {},
      };

      const btc = ctx.data['BTCUSDT'];
      if (btc) {
        ctx.strategyStatus = {
          grid: ctx.regime === 'SIDEWAYS' || ctx.regime === 'BULL' ? 'optimal' : 'waiting',
          trend_following: ctx.regime === 'BULL' || ctx.regime === 'BEAR' ? 'active' : 'waiting',
          mean_reversion: btc.rsi < 35 || btc.rsi > 65 ? 'signal' : 'neutral',
          funding_arb: btc.funding > 0.005 ? 'collecting' : 'no_opportunity',
          ai_signal: 'analyzing',
        };
      }
      setMarketContext(ctx);

      const pending = (result.signals || []).map((s: any) => ({
        strategyType: s.strategyType, symbol: s.symbol, direction: s.direction,
        conviction: s.conviction, suggestedLeverage: s.suggestedLeverage,
        suggestedSizeUsd: s.suggestedSizeUsd, takeProfit: s.takeProfit,
        stopLoss: s.stopLoss, rationale: s.rationale, approved: s.approved,
      }));
      setPendingSignals(pending);

      await fetchPositions();
      await fetchRisk();

      return {
        marketContext: ctx, pendingSignals: pending,
        executed: result.totalExecuted || 0,
      };
    } catch {
      return { marketContext: null, pendingSignals: [], executed: 0 };
    } finally {
      setIsEvaluating(false);
    }
  }, [fetchPositions, fetchRisk]);

  const fetchSignals = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('trading_signals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setSignals(data.map((d) => ({
        id: d.id, strategyType: d.strategy_type, symbol: d.symbol,
        direction: d.direction, conviction: d.conviction,
        rationale: d.rationale || '', riskApproved: d.risk_approved,
        wasExecuted: d.was_executed, createdAt: d.created_at,
      })));
    }
  }, []);

  const fetchPerformance = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('leveraged_strategy_performance')
      .select('*')
      .eq('user_id', user.id)
      .eq('period', 'daily')
      .order('period_end', { ascending: false })
      .limit(25);

    if (data) {
      const byStrategy: Record<string, StrategyPerformance> = {};
      for (const d of data) {
        if (!byStrategy[d.strategy_type]) {
          byStrategy[d.strategy_type] = {
            strategyType: d.strategy_type, totalPnlUsd: 0, totalPnlPct: 0,
            winRate: 0, profitFactor: 0, tradesClosed: 0, fundingIncome: 0,
          };
        }
        const s = byStrategy[d.strategy_type];
        s.totalPnlUsd += d.total_pnl_usd || 0;
        s.fundingIncome += d.funding_income || 0;
        s.tradesClosed += d.trades_closed || 0;
      }
      for (const key of Object.keys(byStrategy)) {
        const entries = data.filter((d) => d.strategy_type === key && d.trades_closed > 0);
        if (entries.length > 0) {
          byStrategy[key].winRate = entries.reduce((s, d) => s + (d.win_rate || 0), 0) / entries.length;
          byStrategy[key].profitFactor = entries.reduce((s, d) => s + (d.profit_factor || 0), 0) / entries.length;
        }
      }
      setPerformance(Object.values(byStrategy));
    }
  }, []);

  // ─── Fetch all ──────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    if (Date.now() - lastFetch.current < CACHE_TTL) return;
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([fetchStrategies(), fetchPositions(), fetchRisk(), fetchSignals(), fetchPerformance()]);
      lastFetch.current = Date.now();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchStrategies, fetchPositions, fetchRisk, fetchSignals, fetchPerformance]);

  // ─── Supabase Realtime Subscriptions ────────────────────

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase.channel('altis-realtime')
      // Live position updates (mark_price, unrealized_pnl from price-updater)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'leveraged_positions',
      }, (payload) => {
        const updated = payload.new as any;
        setPositions((prev) => prev.map((p) =>
          p.id === updated.id ? {
            ...p,
            markPrice: updated.mark_price ?? p.markPrice,
            unrealizedPnl: updated.unrealized_pnl ?? p.unrealizedPnl,
            status: updated.status ?? p.status,
          } : p
        ));
      })
      // New positions opened by auto-executor
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'leveraged_positions',
      }, () => {
        fetchPositions(); // Full refresh on new position
      })
      // New signals from strategy-orchestrator
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'trading_signals',
      }, (payload) => {
        const sig = payload.new as any;
        setSignals((prev) => [{
          id: sig.id,
          strategyType: sig.strategy_type,
          symbol: sig.symbol,
          direction: sig.direction,
          conviction: sig.conviction,
          rationale: sig.rationale || '',
          riskApproved: sig.risk_approved,
          wasExecuted: sig.was_executed,
          createdAt: sig.created_at,
        }, ...prev].slice(0, 50)); // Keep last 50
      })
      // Risk events (circuit breaker, liquidation)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'risk_events',
      }, (payload) => {
        const event = payload.new as any;
        if (event.event_type === 'circuit_breaker_tripped') {
          setRisk((prev) => ({
            ...prev,
            circuitBreaker: { isTripped: true, dailyPnlPct: event.daily_pnl_pct || -0.05 },
          }));
        }
        // Refresh risk data
        fetchRisk();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPositions, fetchRisk]);

  // ─── Actions ────────────────────────────────────────────

  const enableStrategy = useCallback(async (strategyType: string, allocationPct: number, maxLeverage: number = 2) => {
    // Always update store state first (instant UI response)
    const newConfig: StrategyConfig = {
      id: `local-${strategyType}`,
      strategyType,
      isActive: true,
      allocationPct,
      maxLeverage,
      assets: ['BTCUSDT', 'ETHUSDT'],
    };

    updateStrategiesStore((prev) => {
      const existing = prev.filter((s) => s.strategyType !== strategyType);
      return [...existing, newConfig];
    });

    // Then try Supabase if available
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('strategy_configs').upsert({
            user_id: user.id,
            strategy_type: strategyType,
            is_active: true,
            allocation_pct: allocationPct,
            max_leverage: maxLeverage,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,strategy_type' });
        }
      } catch { /* Supabase unavailable — local state is source of truth */ }
    }
  }, [updateStrategiesStore]);

  const disableStrategy = useCallback(async (strategyType: string) => {
    updateStrategiesStore((prev) => prev.map((s) =>
      s.strategyType === strategyType ? { ...s, isActive: false } : s
    ));

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('strategy_configs')
            .update({ is_active: false, disabled_reason: 'user_disabled', updated_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('strategy_type', strategyType);
        }
      } catch { /* local state is source of truth */ }
    }
  }, [updateStrategiesStore]);

  const closePosition = useCallback(async (positionId: string) => {
    setError(null);
    if (!isSupabaseConfigured) {
      setPositions((prev) => prev.filter((p) => p.id !== positionId));
      return true;
    }
    const { error: fnError } = await invokeEdgeFunction('leveraged-trade-execute', {
      body: { action: 'close-position', positionId, reason: 'manual' },
    });
    if (fnError) { setError(fnError.message); return false; }
    await fetchPositions();
    return true;
  }, [fetchPositions]);

  const closeAllPositions = useCallback(async () => {
    setError(null);
    if (!isSupabaseConfigured) {
      setPositions([]);
      return true;
    }
    const { error: fnError } = await invokeEdgeFunction('leveraged-trade-execute', {
      body: { action: 'emergency-close-all', reason: 'manual_emergency' },
    });
    if (fnError) { setError(fnError.message); return false; }
    await fetchPositions();
    await fetchRisk();
    return true;
  }, [fetchPositions, fetchRisk]);

  // ─── Computed ───────────────────────────────────────────

  const totalUnrealizedPnl = positions.reduce((s, p) => s + p.unrealizedPnl, 0);
  const totalFundingIncome = positions.reduce((s, p) => s + p.fundingReceived, 0);
  const activeStrategies = strategies.filter((s) => s.isActive);
  const isSetupComplete = bots.length > 0 && strategies.length > 0;

  return {
    // Multi-bot
    bots, activeBot, setActiveBotId, addBot, removeBot,
    // Active bot data
    strategies, positions, risk, signals, performance,
    marketContext, pendingSignals, isEvaluating,
    isLoading, error,
    totalCapital, setTotalCapital,
    totalUnrealizedPnl, totalFundingIncome, activeStrategies, isSetupComplete,
    fetchAll, fetchPositions, fetchRisk, triggerEvaluation,
    enableStrategy, disableStrategy, closePosition, closeAllPositions,
  };
}
