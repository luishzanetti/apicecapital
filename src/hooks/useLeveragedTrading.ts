import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { invokeEdgeFunction } from '@/lib/supabaseFunction';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/appStore';
import { useBybitTickers } from '@/hooks/useBybitTickers';
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

  // Strategies are LOCAL-authoritative — the user configures them in the
  // setup wizard (AiTradeSetup) and `addBot` persists them synchronously
  // via Zustand + localStorage. Supabase acts as a backup for cross-device
  // sync only, and MUST NOT silently overwrite a freshly-activated bot.
  // We only backfill from backend when the active bot has zero strategies
  // AND the backend returns data (i.e., first boot on a new device).
  const fetchStrategies = useCallback(async () => {
    if (!isSupabaseConfigured || !activeBot) return;
    if (activeBot.strategies.length > 0) return; // local is authoritative

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
          assets: (d.assets as string[] | null) ?? ['BTCUSDT', 'ETHUSDT'],
        }));
        setStrategies(() => mapped);
        if (import.meta.env.DEV) {
          console.info('[ALTIS] backfilled strategies from backend', { count: mapped.length });
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[ALTIS] fetchStrategies failed:', err);
    }
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
  // Filtered by user_id so the client does not receive other users'
  // position updates (RLS blocks SELECTs but Realtime bypass is a leak).

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setCurrentUserId(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !currentUserId) return;

    const userFilter = `user_id=eq.${currentUserId}`;
    const channel = supabase.channel(`altis-realtime:${currentUserId}`)
      // Live position updates — scoped to this user only.
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'leveraged_positions',
        filter: userFilter,
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
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'leveraged_positions',
        filter: userFilter,
      }, () => {
        fetchPositions();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'trading_signals',
        filter: userFilter,
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
        }, ...prev].slice(0, 50));
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'risk_events',
        filter: userFilter,
      }, (payload) => {
        const event = payload.new as any;
        if (event.event_type === 'circuit_breaker_tripped') {
          setRisk((prev) => ({
            ...prev,
            circuitBreaker: { isTripped: true, dailyPnlPct: event.daily_pnl_pct || -0.05 },
          }));
        }
        fetchRisk();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchPositions, fetchRisk]);

  // ─── Live mark price + PnL from Bybit WebSocket (no cron needed) ─────
  // Backend price-updater is not deployed on pg_cron, so the frontend
  // subscribes to Bybit's public tickers stream for every symbol with an
  // open position and recomputes mark_price / unrealized_pnl locally on
  // every tick. Effectively gives real-time PnL without extra backend cost.
  const openSymbols = useMemo(
    () => Array.from(new Set(positions.filter((p) => p.status === 'open').map((p) => p.symbol))),
    [positions],
  );
  const { prices: livePrices, isLive: tickersLive } = useBybitTickers(openSymbols, 'linear');

  const livePositions = useMemo<LeveragedPosition[]>(() => {
    if (positions.length === 0 || Object.keys(livePrices).length === 0) return positions;
    return positions.map((p) => {
      if (p.status !== 'open') return p;
      const mark = livePrices[p.symbol];
      if (!Number.isFinite(mark) || !mark) return p;
      const direction = p.side === 'long' ? 1 : -1;
      const unrealized = (mark - p.entryPrice) * p.sizeQty * direction;
      return { ...p, markPrice: mark, unrealizedPnl: Math.round(unrealized * 100) / 100 };
    });
  }, [positions, livePrices]);

  // ─── Actions ────────────────────────────────────────────

  const enableStrategy = useCallback(async (
    strategyType: string,
    allocationPct: number,
    maxLeverage: number = 2,
    assets: string[] = ['BTCUSDT', 'ETHUSDT'],
  ) => {
    // Update store first (instant UI response) — preserve user's asset selection.
    const newConfig: StrategyConfig = {
      id: `local-${strategyType}`,
      strategyType,
      isActive: true,
      allocationPct,
      maxLeverage,
      assets,
    };

    updateStrategiesStore((prev) => {
      const existing = prev.filter((s) => s.strategyType !== strategyType);
      return [...existing, newConfig];
    });

    // Supabase sync — non-blocking, never mutates store.
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
            assets,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,strategy_type' });
        }
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[ALTIS] enableStrategy backend sync failed:', err);
      }
    }
  }, [updateStrategiesStore]);

  // Pure backend sync — does NOT mutate store. Used after addBot() when
  // strategies are already committed locally and we just need to persist
  // them to the backend for cross-device/server-side orchestration.
  const syncStrategiesToBackend = useCallback(async (
    strategies: StrategyConfig[],
  ): Promise<void> => {
    if (!isSupabaseConfigured || strategies.length === 0) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const rows = strategies.map((s) => ({
        user_id: user.id,
        strategy_type: s.strategyType,
        is_active: s.isActive,
        allocation_pct: s.allocationPct,
        max_leverage: s.maxLeverage,
        assets: s.assets,
        updated_at: new Date().toISOString(),
      }));
      await supabase.from('strategy_configs').upsert(rows, {
        onConflict: 'user_id,strategy_type',
      });
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[ALTIS] syncStrategiesToBackend failed:', err);
    }
  }, []);

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
    const { data, error: fnError } = await invokeEdgeFunction<{ data: { reconciled?: boolean } }>(
      'leveraged-trade-execute',
      { body: { action: 'close-position', positionId, reason: 'manual' } },
    );
    if (fnError) {
      // 110017 should now be handled server-side (auto-reconciled) but if it
      // ever slips through, do a client-side reconcile sweep and refresh.
      if (/110017|position is zero|already closed/i.test(fnError.message)) {
        await invokeEdgeFunction('leveraged-trade-execute', { body: { action: 'reconcile' } });
        await fetchPositions();
        return true;
      }
      setError(fnError.message);
      return false;
    }
    if (data?.data?.reconciled && import.meta.env.DEV) {
      console.info('[ALTIS] close auto-reconciled (Bybit had no position)');
    }
    await fetchPositions();
    return true;
  }, [fetchPositions]);

  // Sync local open positions with Bybit live positions. Marks any stale
  // DB row (TP/SL fill, manual Bybit-app close, liquidation) as closed.
  const reconcilePositions = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await invokeEdgeFunction<{ data: { reconciled: number } }>(
      'leveraged-trade-execute',
      { body: { action: 'reconcile' } },
    );
    if (error) {
      if (import.meta.env.DEV) console.warn('[ALTIS] reconcile failed:', error.message);
      return;
    }
    const count = data?.data?.reconciled ?? 0;
    if (count > 0) {
      if (import.meta.env.DEV) console.info(`[ALTIS] reconciled ${count} orphan position(s)`);
      await fetchPositions();
    }
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

  // Use livePositions (client-side ticker overlay) so totals are live.
  const totalUnrealizedPnl = livePositions.reduce((s, p) => s + p.unrealizedPnl, 0);
  const totalFundingIncome = livePositions.reduce((s, p) => s + p.fundingReceived, 0);
  const activeStrategies = strategies.filter((s) => s.isActive);
  const isSetupComplete = bots.length > 0 && strategies.length > 0;

  return {
    // Multi-bot
    bots, activeBot, setActiveBotId, addBot, removeBot,
    // Active bot data — positions override with live tickers
    strategies, positions: livePositions, risk, signals, performance,
    marketContext, pendingSignals, isEvaluating,
    isLoading, error,
    totalCapital, setTotalCapital,
    totalUnrealizedPnl, totalFundingIncome, activeStrategies, isSetupComplete,
    fetchAll, fetchPositions, fetchRisk, triggerEvaluation,
    enableStrategy, disableStrategy, closePosition, closeAllPositions,
    syncStrategiesToBackend,
    reconcilePositions,
    // Live stream telemetry
    tickersLive,
  };
}
