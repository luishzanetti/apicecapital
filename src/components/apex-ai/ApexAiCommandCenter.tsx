import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Waves,
  BarChart3,
  Zap,
  Radio,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useApexAiStrategyEvents, useApexAiLayerConfig } from '@/hooks/useApexAiV2Data';
import { useApexAiPositions } from '@/hooks/useApexAiData';
import { Shield, ShieldAlert } from 'lucide-react';
import { ApexAiHealthBar } from './ApexAiHealthBar';
import type {
  ApexAiRegimeState,
  ApexAiSymbolIntelligence,
  ApexAiTrendRegime,
  ApexAiVolatilityRegime,
  ApexAiPortfolio,
} from '@/types/apexAi';

/**
 * ApexAiCommandCenter — the hero component of the Apex AI dashboard.
 *
 * Replaces RegimeCard + LayersCard with a single, coherent "AI terminal"
 * feel. Per CEO directive 2026-04-23: "IA analisando o mercado em tempo
 * real, atualizando o usuário, com insights e inteligência da estratégia".
 *
 * Sections:
 *   1. Hero — animated brain icon + live status + strategy headline
 *   2. Strategy card — Martingale DCA, TP target, never-close-at-loss
 *   3. Three indicator cards — Trend / Volatility / Liquidity
 *   4. AI Insight — narrative explanation of what bot is doing NOW
 *   5. Live decision feed — last N strategy events with timestamps
 */

export function ApexAiCommandCenter({
  portfolio,
  symbols,
  regimeMap,
  intelligenceMap,
}: {
  portfolio: ApexAiPortfolio;
  symbols: string[];
  regimeMap: Record<string, ApexAiRegimeState>;
  intelligenceMap: Record<string, ApexAiSymbolIntelligence>;
}) {
  const { data: events = [] } = useApexAiStrategyEvents(portfolio.id, 8);
  const { data: layerCfg } = useApexAiLayerConfig(portfolio.id);
  const { data: positions = [] } = useApexAiPositions(portfolio.id);

  // Compute worst-case drawdown across active groups vs tolerance
  const drawdownStatus = useMemo(
    () => computeWorstDrawdown(positions, intelligenceMap, layerCfg?.drawdown_tolerance_pct ?? 35),
    [positions, intelligenceMap, layerCfg]
  );

  // Aggregate regime across active symbols
  const aggregate = useMemo(
    () => aggregateRegime(symbols, regimeMap, intelligenceMap),
    [symbols, regimeMap, intelligenceMap]
  );

  const isLive = portfolio.status === 'active';
  const isPaused = portfolio.status === 'paused';
  const isCircuitBreaker = portfolio.status === 'circuit_breaker';

  const insight = useMemo(
    () => buildAiInsight(aggregate, portfolio, events.length),
    [aggregate, portfolio, events.length]
  );

  const trendIcon =
    aggregate?.trend === 'bull_trending'
      ? TrendingUp
      : aggregate?.trend === 'bear_trending'
      ? TrendingDown
      : Minus;

  return (
    <div className="space-y-4">
      {/* Health diagnostic — surfaces "is the engine actually running?" so
          the user never wonders why an active bot looks frozen. */}
      <ApexAiHealthBar portfolio={portfolio} />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 1. Hero — AI terminal                                         */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Card className="relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-background to-background">
        {/* Animated scanning bar */}
        {isLive && (
          <motion.div
            className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, rgba(22,166,97,0.18), transparent 50%), radial-gradient(circle at 80% 80%, rgba(82,143,255,0.10), transparent 50%)',
          }}
        />

        <CardContent className="p-5 relative space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 ${
                    isLive ? 'animate-pulse' : ''
                  }`}
                >
                  <Brain className="w-6 h-6 text-white" />
                </div>
                {isLive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-emerald-400"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.6, 0, 0.6],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="font-bold text-lg">Apex AI</h2>
                  {isLive && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] px-1.5 py-0.5">
                      <Radio className="w-2.5 h-2.5 mr-1 animate-pulse" />
                      LIVE
                    </Badge>
                  )}
                  {isPaused && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px]">
                      PAUSED
                    </Badge>
                  )}
                  {isCircuitBreaker && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[10px]">
                      CIRCUIT BREAKER
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isLive
                    ? `Analyzing ${symbols.length} symbol${symbols.length !== 1 ? 's' : ''} · Martingale DCA grid engaged`
                    : 'Bot is idle. Activate to start analyzing.'}
                </p>
              </div>
            </div>
          </div>

          {/* Strategy headline */}
          <div className="rounded-lg bg-background/60 backdrop-blur-sm p-3 border border-emerald-500/10">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
                Active Strategy
              </span>
            </div>
            <p className="text-sm font-semibold">
              Martingale DCA grid — short cycles targeting{' '}
              <span className="text-emerald-400">{getTargetTP(portfolio.risk_profile)}% net profit</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Never closes at loss. If market moves against entry, bot averages down with progressively doubled size. When aggregate returns to profit zone, cycle closes and restarts fresh.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 2. Indicator cards                                            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {aggregate && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <IndicatorCard
            title="Trend"
            icon={trendIcon}
            value={TREND_LABELS[aggregate.trend]}
            meta={`ADX ${aggregate.avgAdx.toFixed(0)}`}
            tone={
              aggregate.trend === 'bull_trending'
                ? 'success'
                : aggregate.trend === 'bear_trending'
                ? 'danger'
                : 'neutral'
            }
          />
          <IndicatorCard
            title="Volatility"
            icon={Waves}
            value={VOL_LABELS[aggregate.volatility]}
            meta={`ATR ${aggregate.avgAtrPct.toFixed(2)}%`}
            tone={
              aggregate.volatility === 'high'
                ? 'danger'
                : aggregate.volatility === 'medium'
                ? 'warning'
                : 'success'
            }
          />
          <IndicatorCard
            title="Liquidity"
            icon={BarChart3}
            value={aggregate.liquidityBucket}
            meta={`$${formatLargeNum(aggregate.totalVolume24h)}`}
            tone={aggregate.liquidityBucket === 'High' ? 'success' : 'neutral'}
          />
          <IndicatorCard
            title="Safety"
            icon={drawdownStatus.worstDrawdownPct >= drawdownStatus.tolerancePct * 0.7 ? ShieldAlert : Shield}
            value={drawdownStatus.hasPositions
              ? `${drawdownStatus.bufferRemainingPct.toFixed(0)}% buffer`
              : `${drawdownStatus.tolerancePct}% max`}
            meta={drawdownStatus.hasPositions
              ? `DD ${drawdownStatus.worstDrawdownPct.toFixed(1)}% / ${drawdownStatus.tolerancePct}%`
              : 'Liquidation tolerance'}
            tone={
              !drawdownStatus.hasPositions
                ? 'success'
                : drawdownStatus.bufferRemainingPct < 10
                ? 'danger'
                : drawdownStatus.bufferRemainingPct < 20
                ? 'warning'
                : 'success'
            }
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 3. AI Insight — narrative                                     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-sm font-semibold">AI Insight</p>
            <span className="text-[10px] text-muted-foreground">
              updated {relativeTime(insight.updatedAt)}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90 pl-9">
            {insight.text}
          </p>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 4. Live decision feed                                         */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <p className="text-sm font-semibold">Live decisions</p>
            </div>
            <span className="text-[10px] text-muted-foreground">Last {events.length}</span>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              Decision feed empty. Activate the bot to see live strategy events.
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-start gap-3 py-1.5 border-l-2 border-emerald-500/40 pl-3"
                >
                  <div className="flex-shrink-0 mt-0.5">{eventIcon(e.event_type)}</div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {e.symbol && (
                        <span className="text-[11px] font-mono font-semibold text-emerald-400">
                          {e.symbol.replace('USDT', '')}
                        </span>
                      )}
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {e.event_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {relativeTime(e.created_at)}
                      </span>
                    </div>
                    {e.rationale && (
                      <p className="text-xs text-muted-foreground leading-snug">
                        {e.rationale}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Subcomponents ──────────────────────────────────────────

function IndicatorCard({
  title,
  icon: Icon,
  value,
  meta,
  tone,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  meta: string;
  tone: 'success' | 'warning' | 'danger' | 'neutral';
}) {
  const colorMap = {
    success: { ring: 'border-emerald-500/30', text: 'text-emerald-400', icon: 'text-emerald-400' },
    warning: { ring: 'border-amber-500/30', text: 'text-amber-400', icon: 'text-amber-400' },
    danger: { ring: 'border-rose-500/30', text: 'text-rose-400', icon: 'text-rose-400' },
    neutral: { ring: 'border-border/50', text: 'text-foreground', icon: 'text-muted-foreground' },
  };
  const c = colorMap[tone];

  return (
    <Card className={`${c.ring} bg-background/40`}>
      <CardContent className="p-3 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            {title}
          </span>
          <Icon className={`w-3.5 h-3.5 ${c.icon}`} />
        </div>
        <p className={`text-base font-bold ${c.text}`}>{value}</p>
        <p className="text-[10px] text-muted-foreground">{meta}</p>
      </CardContent>
    </Card>
  );
}

function eventIcon(eventType: string): React.ReactNode {
  if (eventType === 'layer_opened') {
    return <ArrowRight className="w-3.5 h-3.5 text-blue-400" />;
  }
  if (eventType === 'cycle_completed') {
    return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  }
  if (eventType === 'close_skipped_loss') {
    return <Info className="w-3.5 h-3.5 text-amber-400" />;
  }
  if (eventType === 'regime_change') {
    return <Activity className="w-3.5 h-3.5 text-violet-400" />;
  }
  if (eventType === 'circuit_breaker_triggered') {
    return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
  }
  return <Zap className="w-3.5 h-3.5 text-muted-foreground" />;
}

// ─── Aggregation & Insight builder ──────────────────────────

interface Aggregate {
  trend: ApexAiTrendRegime;
  volatility: ApexAiVolatilityRegime;
  avgAtrPct: number;
  avgAdx: number;
  totalVolume24h: number;
  liquidityBucket: string;
  perSymbol: Array<{ symbol: string; trend: ApexAiTrendRegime }>;
}

function aggregateRegime(
  symbols: string[],
  regimeMap: Record<string, ApexAiRegimeState>,
  intelligenceMap: Record<string, ApexAiSymbolIntelligence>
): Aggregate | null {
  const trendVotes: Record<ApexAiTrendRegime, number> = {
    bull_trending: 0,
    bear_trending: 0,
    sideways: 0,
    unknown: 0,
  };
  let worstVol: ApexAiVolatilityRegime = 'low';
  let totalAtrPct = 0;
  let totalAdx = 0;
  let totalVol24h = 0;
  let count = 0;
  const perSymbol: Array<{ symbol: string; trend: ApexAiTrendRegime }> = [];

  for (const symbol of symbols) {
    const r = regimeMap[symbol];
    const i = intelligenceMap[symbol];
    if (!r) continue;
    trendVotes[r.trend_regime] = (trendVotes[r.trend_regime] ?? 0) + 1;
    perSymbol.push({ symbol, trend: r.trend_regime });
    if (VOL_WEIGHT[r.volatility_regime] > VOL_WEIGHT[worstVol]) {
      worstVol = r.volatility_regime;
    }
    if (r.atr_pct) totalAtrPct += Number(r.atr_pct);
    if (r.adx_14) totalAdx += Number(r.adx_14);
    if (i?.volume_24h_usd) totalVol24h += Number(i.volume_24h_usd);
    count++;
  }

  if (count === 0) return null;

  const sorted = (Object.keys(trendVotes) as ApexAiTrendRegime[])
    .filter((t) => t !== 'unknown' && trendVotes[t] > 0)
    .sort((a, b) => trendVotes[b] - trendVotes[a]);

  const liquidityBucket =
    totalVol24h >= 5e9 ? 'High' : totalVol24h >= 1e9 ? 'Medium' : 'Low';

  return {
    trend: sorted[0] ?? 'unknown',
    volatility: worstVol,
    avgAtrPct: count > 0 ? totalAtrPct / count : 0,
    avgAdx: count > 0 ? totalAdx / count : 0,
    totalVolume24h: totalVol24h,
    liquidityBucket,
    perSymbol,
  };
}

function buildAiInsight(
  aggregate: Aggregate | null,
  portfolio: ApexAiPortfolio,
  recentEventsCount: number
): { text: string; updatedAt: string } {
  const now = new Date().toISOString();

  if (!aggregate) {
    return {
      text:
        'Market intelligence still calibrating. The bot collects 30 days of 4h candles across all active symbols and computes trend + volatility regimes every 5 minutes. First analysis will appear shortly.',
      updatedAt: now,
    };
  }

  const parts: string[] = [];

  // Trend narrative
  if (aggregate.trend === 'bull_trending') {
    parts.push(
      'Market is trending up with strong momentum (ADX above 25). Long-biased cycles will dominate — shorts act as protection layers.'
    );
  } else if (aggregate.trend === 'bear_trending') {
    parts.push(
      'Market is in a downtrend. Short-biased cycles will dominate — longs act as protection layers.'
    );
  } else if (aggregate.trend === 'sideways') {
    parts.push(
      'Market is ranging with low directional conviction. Full hedge grid is optimal — both long and short legs accumulate profitable cycles as price oscillates.'
    );
  } else {
    parts.push('Market direction unclear. Bot waits for a cleaner signal before deploying aggressive layers.');
  }

  // Volatility adjustment
  if (aggregate.volatility === 'high') {
    parts.push(
      'Volatility is elevated — bot widens DCA spacing 1.5× to avoid getting stopped out and reduces leverage 50% for capital protection.'
    );
  } else if (aggregate.volatility === 'low') {
    parts.push(
      'Low volatility detected — tighter DCA spacing (0.8× ATR) to accelerate cycle completion and maximize compounding.'
    );
  }

  // Strategy reminder
  parts.push(
    `Strategy target: close cycle at ${getTargetTP(portfolio.risk_profile)}% blended profit. Bot never closes at loss — averages down via martingale sizing until aggregate returns to green, then locks in and restarts.`
  );

  if (recentEventsCount > 0) {
    parts.push(`Recent activity: ${recentEventsCount} strategy events in feed below.`);
  }

  return { text: parts.join(' '), updatedAt: now };
}

function getTargetTP(riskProfile: string): string {
  return riskProfile === 'conservative'
    ? '0.8'
    : riskProfile === 'aggressive'
    ? '1.5'
    : '1.2';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function formatLargeNum(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

// ─── Constants ──────────────────────────────────────────────

const TREND_LABELS: Record<ApexAiTrendRegime, string> = {
  bull_trending: 'Bullish',
  bear_trending: 'Bearish',
  sideways: 'Sideways',
  unknown: 'Scanning',
};

const VOL_LABELS: Record<ApexAiVolatilityRegime, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const VOL_WEIGHT: Record<ApexAiVolatilityRegime, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

// ─── Drawdown vs tolerance ──────────────────────────────────

interface DrawdownStatus {
  hasPositions: boolean;
  worstDrawdownPct: number;
  tolerancePct: number;
  bufferRemainingPct: number;
}

function computeWorstDrawdown(
  positions: Array<{ symbol: string; side: string; entry_price: number | string; layer_index?: number; parent_position_group?: string | null; exchange_position_id?: string | null }>,
  intelligenceMap: Record<string, ApexAiSymbolIntelligence>,
  tolerancePct: number
): DrawdownStatus {
  // Group by symbol + side + parent_group; for each group find L1 (min layer_index)
  const groups = new Map<string, { symbol: string; side: string; l1Entry: number }>();
  for (const p of positions) {
    // Consider only sim positions (v2 positions have layer_index); skip orphan unlabeled
    const key = `${p.symbol}-${p.side}-${p.parent_position_group ?? 'default'}`;
    const l1 = groups.get(key);
    const layerIdx = p.layer_index ?? 1;
    if (!l1 || layerIdx < 999) {
      // always keep the lowest layer_index (= L1)
      if (!l1 || layerIdx < (l1 as { layerIdx?: number }).layerIdx!) {
        groups.set(key, {
          symbol: p.symbol,
          side: p.side,
          l1Entry: Number(p.entry_price),
        });
      }
    }
  }

  let worstDrawdown = 0;

  for (const [, group] of groups.entries()) {
    const intel = intelligenceMap[group.symbol];
    const currentPrice = intel?.current_price ? Number(intel.current_price) : null;
    if (!currentPrice || !group.l1Entry) continue;

    const dd =
      group.side === 'long'
        ? Math.max(0, ((group.l1Entry - currentPrice) / group.l1Entry) * 100)
        : Math.max(0, ((currentPrice - group.l1Entry) / group.l1Entry) * 100);

    if (dd > worstDrawdown) worstDrawdown = dd;
  }

  return {
    hasPositions: groups.size > 0,
    worstDrawdownPct: worstDrawdown,
    tolerancePct,
    bufferRemainingPct: Math.max(0, tolerancePct - worstDrawdown),
  };
}
