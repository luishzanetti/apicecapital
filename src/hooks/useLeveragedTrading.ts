import { useState, useCallback, useRef, useEffect } from 'react';
import { invokeEdgeFunction } from '@/lib/supabaseFunction';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';

// ─── Types ──────────────────────────────────────────────────

export interface StrategyConfig {
  id: string;
  strategyType: string;
  isActive: boolean;
  allocationPct: number;
  maxLeverage: number;
  assets: string[];
}

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

// ─── Local storage key ──────────────────────────────────────

// ─── Multi-bot storage ──────────────────────────────────────

export interface BotConfig {
  id: string;
  name: string;
  capital: number;
  profile: string;
  strategies: StrategyConfig[];
  createdAt: string;
  isActive: boolean;
  maxLeverage: number;
  riskPerTradePct: number;
  maxPositions: number;
  autoExecute: boolean;
  selectedAssets: string[];
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

const BOTS_KEY = 'altis-bots';
const ACTIVE_BOT_KEY = 'altis-active-bot';

function loadBots(): BotConfig[] {
  try {
    const raw = localStorage.getItem(BOTS_KEY);
    if (raw) return JSON.parse(raw);
    // Migrate from old format
    const oldStrats = localStorage.getItem('altis-strategies');
    const oldCapital = localStorage.getItem('altis-total-capital');
    if (oldStrats) {
      const strats = JSON.parse(oldStrats);
      if (strats.length > 0) {
        const migrated: BotConfig = {
          id: 'bot-1', name: 'ALTIS Bot #1',
          capital: Number(oldCapital) || 5000, profile: 'balanced',
          strategies: strats, createdAt: new Date().toISOString(), isActive: true,
          maxLeverage: 5, riskPerTradePct: 33, maxPositions: 5,
          autoExecute: true, selectedAssets: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
        };
        saveBots([migrated]);
        localStorage.setItem(ACTIVE_BOT_KEY, migrated.id);
        return [migrated];
      }
    }
    return [];
  } catch { return []; }
}

function saveBots(bots: BotConfig[]) {
  localStorage.setItem(BOTS_KEY, JSON.stringify(bots));
}

function loadActiveBotId(): string | null {
  return localStorage.getItem(ACTIVE_BOT_KEY);
}

function saveActiveBotId(id: string) {
  localStorage.setItem(ACTIVE_BOT_KEY, id);
}

// ─── Hook ───────────────────────────────────────────────────

const CACHE_TTL = 30_000;

export function useLeveragedTrading() {
  const [bots, setBots] = useState<BotConfig[]>(() => loadBots());
  const [activeBotId, setActiveBotIdState] = useState<string | null>(() => loadActiveBotId());

  const activeBot = bots.find(b => b.id === activeBotId) || bots[0] || null;
  const totalCapital = activeBot?.capital || 0;
  const strategies = activeBot?.strategies || [] as StrategyConfig[];

  const setTotalCapital = useCallback((amount: number) => {
    if (!activeBot) return;
    setBots(prev => {
      const updated = prev.map(b => b.id === activeBot.id ? { ...b, capital: amount } : b);
      saveBots(updated);
      return updated;
    });
  }, [activeBot]);

  const setActiveBotId = useCallback((id: string) => {
    setActiveBotIdState(id);
    saveActiveBotId(id);
  }, []);

  const addBot = useCallback((
    name: string, capital: number, profile: string, strategyConfigs: StrategyConfig[],
    options?: { maxLeverage?: number; riskPerTradePct?: number; maxPositions?: number; autoExecute?: boolean; selectedAssets?: string[] }
  ) => {
    const newBot: BotConfig = {
      id: `bot-${Date.now()}`, name, capital, profile,
      strategies: strategyConfigs,
      createdAt: new Date().toISOString(), isActive: true,
      maxLeverage: options?.maxLeverage ?? 5,
      riskPerTradePct: options?.riskPerTradePct ?? 33,
      maxPositions: options?.maxPositions ?? 5,
      autoExecute: options?.autoExecute ?? true,
      selectedAssets: options?.selectedAssets ?? ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
    };
    setBots(prev => {
      const updated = [...prev, newBot];
      saveBots(updated);
      return updated;
    });
    setActiveBotIdState(newBot.id);
    saveActiveBotId(newBot.id);
    return newBot.id;
  }, []);

  const removeBot = useCallback((botId: string) => {
    setBots(prev => {
      const updated = prev.filter(b => b.id !== botId);
      saveBots(updated);
      if (activeBotId === botId && updated.length > 0) {
        setActiveBotIdState(updated[0].id);
        saveActiveBotId(updated[0].id);
      }
      return updated;
    });
  }, [activeBotId]);

  // Keep backward compat: setStrategies updates the active bot's strategies
  const setStrategies = useCallback((updater: (prev: StrategyConfig[]) => StrategyConfig[]) => {
    if (!activeBot) return;
    setBots(prev => {
      const updated = prev.map(b =>
        b.id === activeBot.id ? { ...b, strategies: updater(b.strategies) } : b
      );
      saveBots(updated);
      return updated;
    });
  }, [activeBot]);
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
        const mapped = data.map(d => ({
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
      setPositions(data.map(d => ({
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
      setSignals(data.map(d => ({
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
        const entries = data.filter(d => d.strategy_type === key && d.trades_closed > 0);
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
        setPositions(prev => prev.map(p =>
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
        setSignals(prev => [{
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
          setRisk(prev => ({
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
    // Always update local state first (instant UI response)
    const newConfig: StrategyConfig = {
      id: `local-${strategyType}`,
      strategyType,
      isActive: true,
      allocationPct,
      maxLeverage,
      assets: ['BTCUSDT', 'ETHUSDT'],
    };

    setStrategies(prev => {
      const existing = prev.filter(s => s.strategyType !== strategyType);
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
  }, []);

  const disableStrategy = useCallback(async (strategyType: string) => {
    setStrategies(prev => prev.map(s =>
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
  }, []);

  const closePosition = useCallback(async (positionId: string) => {
    if (!isSupabaseConfigured) {
      setPositions(prev => prev.filter(p => p.id !== positionId));
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
  const activeStrategies = strategies.filter(s => s.isActive);
  const isSetupComplete = strategies.length > 0;

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
