import { useState, useEffect, useCallback, useMemo } from 'react';
import { invokeEdgeFunction } from '@/lib/supabaseFunction';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ───────────────────────────────────────────────────

export type MarketRegime =
  | 'BULL'
  | 'BEAR'
  | 'SIDEWAYS'
  | 'HIGH_VOLATILITY'
  | 'ALTSEASON'
  | 'CAPITULATION';

export interface MarketSnapshot {
  symbol: string;
  price: number;
  volume_24h: number;
  change_24h_pct: number;
  high_24h: number;
  low_24h: number;
  sma_7d: number | null;
  sma_30d: number | null;
  sma_90d: number | null;
  rsi_14: number | null;
  volatility_30d: number | null;
  fear_greed_index: number;
  fear_greed_label: string;
  btc_dominance: number;
  captured_at: string;
}

export interface RegimeInfo {
  regime: MarketRegime;
  confidence: number;
  consecutive_periods: number;
  started_at: string;
  description: string;
}

export interface SmartDCAResult {
  original_amount: number;
  adjusted_amount: number;
  adjustment_pct: number;
  regime: string;
  profile: string;
  allocation_adjustments: Record<string, { original: number; adjusted: number }>;
  explanation: string;
}

export interface RebalanceSuggestion {
  needs_rebalance: boolean;
  max_deviation?: number;
  over_allocated?: string[];
  under_allocated?: string[];
  recommendation?: Record<string, number>;
  explanation?: string;
  reason?: string;
}

export interface DailyBriefing {
  summary: string;
  market: string;
  portfolio: string;
  next_action: string;
  tip: string;
  motivation: string;
}

export interface SmartAlert {
  id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical' | 'celebration';
  title: string;
  message: string;
  action_label?: string;
  action_route?: string;
  action_data?: Record<string, any>;
  is_read: boolean;
  is_acted_on: boolean;
  created_at: string;
}

export interface UserIntelligence {
  behavioral_score: number;
  confidence_index: number;
  consistency_score: number;
  discipline_score: number;
  knowledge_score: number;
  engagement_score: number;
  capital_commitment_score: number;
  evolved_investor_type: string;
  original_investor_type: string;
  current_streak_weeks: number;
  longest_streak_weeks: number;
  total_dca_executed: number;
  total_dca_skipped: number;
  smart_dca_enabled: boolean;
}

// ─── Regime descriptions ─────────────────────────────────────

const REGIME_DESCRIPTIONS: Record<MarketRegime, string> = {
  BULL: 'Bull market — uptrend with positive sentiment',
  BEAR: 'Bear market — downtrend with negative sentiment',
  SIDEWAYS: 'Sideways market — no clear trend, ideal for accumulation',
  HIGH_VOLATILITY: 'High volatility — sharp moves, caution recommended',
  ALTSEASON: 'Altseason — altcoins outperforming BTC',
  CAPITULATION: 'Capitulation — extreme fear, historically the best time to DCA',
};

const REGIME_COLORS: Record<MarketRegime, string> = {
  BULL: '#22c55e',
  BEAR: '#ef4444',
  SIDEWAYS: '#eab308',
  HIGH_VOLATILITY: '#f97316',
  ALTSEASON: '#8b5cf6',
  CAPITULATION: '#dc2626',
};

const REGIME_ICONS: Record<MarketRegime, string> = {
  BULL: '📈',
  BEAR: '📉',
  SIDEWAYS: '➡️',
  HIGH_VOLATILITY: '⚡',
  ALTSEASON: '🚀',
  CAPITULATION: '🔥',
};

// ─── Cache ────────────────────────────────────────────────────

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache: Record<string, { data: any; timestamp: number }> = {};

function getCached<T>(key: string): T | null {
  const entry = cache[key];
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  return null;
}

function setCache(key: string, data: any): void {
  cache[key] = { data, timestamp: Date.now() };
}

// ─── Hook: useMarketIntelligence ──────────────────────────────

export function useMarketIntelligence() {
  const [regime, setRegime] = useState<RegimeInfo | null>(null);
  const [marketData, setMarketData] = useState<MarketSnapshot[]>([]);
  const [smartDCA, setSmartDCA] = useState<SmartDCAResult[] | null>(null);
  const [rebalance, setRebalance] = useState<RebalanceSuggestion | null>(null);
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userIntel, setUserIntel] = useState<UserIntelligence | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current market regime
  const fetchRegime = useCallback(async () => {
    const cached = getCached<RegimeInfo>('regime');
    if (cached) { setRegime(cached); return cached; }

    try {
      const { data: regimeData } = await supabase
        .from('market_regimes')
        .select('regime, confidence, consecutive_periods, started_at')
        .is('ended_at', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (regimeData?.[0]) {
        const info: RegimeInfo = {
          ...regimeData[0],
          regime: regimeData[0].regime as MarketRegime,
          description: REGIME_DESCRIPTIONS[regimeData[0].regime as MarketRegime] || '',
        };
        setRegime(info);
        setCache('regime', info);
        return info;
      }
    } catch {
      // Intelligence system tables not yet deployed — graceful degradation
    }
    return null;
  }, []);

  // Fetch latest market data
  const fetchMarketData = useCallback(async () => {
    const cached = getCached<MarketSnapshot[]>('marketData');
    if (cached) { setMarketData(cached); return cached; }

    try {
      const { data } = await supabase
        .from('latest_market_data')
        .select('*');

      if (data) {
        setMarketData(data as MarketSnapshot[]);
        setCache('marketData', data);
        return data;
      }
    } catch {
      // Intelligence tables not deployed yet
    }
    return [];
  }, []);

  // Fetch user intelligence profile
  const fetchUserIntelligence = useCallback(async () => {
    const cached = getCached<UserIntelligence>('userIntel');
    if (cached) { setUserIntel(cached); return cached; }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('user_intelligence')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setUserIntel(data as UserIntelligence);
        setCache('userIntel', data);
        return data;
      }
    } catch {
      // Intelligence tables not deployed yet
    }
    return null;
  }, []);

  // Fetch Smart DCA adjustments
  const fetchSmartDCA = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error: err } = await invokeEdgeFunction<{ data: SmartDCAResult[] }>(
        'market-intelligence',
        { body: { action: 'smart-dca' } }
      );
      if (err) throw err;
      const results = data?.data || [];
      setSmartDCA(results);
      return results;
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch rebalance suggestion
  const fetchRebalance = useCallback(async () => {
    try {
      const { data, error: err } = await invokeEdgeFunction<{ data: RebalanceSuggestion }>(
        'market-intelligence',
        { body: { action: 'rebalance' } }
      );
      if (err) throw err;
      const result = data?.data || null;
      setRebalance(result);
      return result;
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  }, []);

  // Fetch daily briefing
  const fetchBriefing = useCallback(async () => {
    const cached = getCached<DailyBriefing>('briefing');
    if (cached) { setBriefing(cached); return cached; }

    setIsLoading(true);
    try {
      const { data, error: err } = await invokeEdgeFunction<{ data: DailyBriefing }>(
        'market-intelligence',
        { body: { action: 'briefing' } }
      );
      if (err) throw err;
      const result = data?.data || null;
      setBriefing(result);
      if (result) setCache('briefing', result);
      return result;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch smart alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const { data, error: err } = await invokeEdgeFunction<{ data: { alerts: SmartAlert[]; count?: number } }>(
        'market-intelligence',
        { body: { action: 'alerts', sub_action: 'unread' } }
      );
      if (err) throw err;
      const result = data?.data?.alerts || [];
      setAlerts(result);
      setUnreadCount(data?.data?.count || result.length);
      return result;
    } catch (e: any) {
      setError(e.message);
      return [];
    }
  }, []);

  // Mark alert as read
  const markAlertRead = useCallback(async (alertId: string) => {
    await invokeEdgeFunction('market-intelligence', {
      body: { action: 'alerts', sub_action: 'read', alert_id: alertId },
    });
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark alert as acted on
  const markAlertActed = useCallback(async (alertId: string) => {
    await invokeEdgeFunction('market-intelligence', {
      body: { action: 'alerts', sub_action: 'acted', alert_id: alertId },
    });
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_acted_on: true } : a));
  }, []);

  // Dismiss alert
  const dismissAlert = useCallback(async (alertId: string) => {
    await invokeEdgeFunction('market-intelligence', {
      body: { action: 'alerts', sub_action: 'dismiss', alert_id: alertId },
    });
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Send AI recommendation feedback
  const sendFeedback = useCallback(async (
    interactionId: string,
    feedback: 'accepted' | 'rejected' | 'ignored',
    reason?: string
  ) => {
    await invokeEdgeFunction('ai-advisor', {
      body: { action: 'feedback', interactionId, feedback, reason },
    });
  }, []);

  // Log behavior event
  const logBehaviorEvent = useCallback(async (
    eventType: string,
    eventData?: Record<string, any>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('user_behavior_events').insert({
        user_id: user.id,
        event_type: eventType,
        event_data: eventData || {},
        market_regime: regime?.regime || null,
      });
    } catch {
      // Intelligence tables not deployed yet
    }
  }, [regime]);

  // Load all intelligence data
  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchRegime(),
        fetchMarketData(),
        fetchUserIntelligence(),
        fetchAlerts(),
      ]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchRegime, fetchMarketData, fetchUserIntelligence, fetchAlerts]);

  // Auto-load on mount
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Computed values
  const regimeColor = useMemo(() =>
    regime ? REGIME_COLORS[regime.regime] : '#6b7280',
  [regime]);

  const regimeIcon = useMemo(() =>
    regime ? REGIME_ICONS[regime.regime] : '📊',
  [regime]);

  const fearGreedValue = useMemo(() => {
    const btc = marketData.find(m => m.symbol === 'BTCUSDT');
    return btc?.fear_greed_index || 50;
  }, [marketData]);

  const fearGreedLabel = useMemo(() => {
    const btc = marketData.find(m => m.symbol === 'BTCUSDT');
    return btc?.fear_greed_label || 'Neutral';
  }, [marketData]);

  const btcPrice = useMemo(() => {
    const btc = marketData.find(m => m.symbol === 'BTCUSDT');
    return btc?.price || 0;
  }, [marketData]);

  const btcChange24h = useMemo(() => {
    const btc = marketData.find(m => m.symbol === 'BTCUSDT');
    return btc?.change_24h_pct || 0;
  }, [marketData]);

  return {
    // State
    regime,
    regimeColor,
    regimeIcon,
    marketData,
    smartDCA,
    rebalance,
    briefing,
    alerts,
    unreadCount,
    userIntel,
    isLoading,
    error,

    // Computed
    fearGreedValue,
    fearGreedLabel,
    btcPrice,
    btcChange24h,

    // Actions
    fetchRegime,
    fetchMarketData,
    fetchUserIntelligence,
    fetchSmartDCA,
    fetchRebalance,
    fetchBriefing,
    fetchAlerts,
    markAlertRead,
    markAlertActed,
    dismissAlert,
    sendFeedback,
    logBehaviorEvent,
    loadAll,
  };
}
