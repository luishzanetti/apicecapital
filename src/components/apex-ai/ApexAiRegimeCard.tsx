import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Activity,
  HelpCircle,
} from 'lucide-react';
import type {
  ApexAiRegimeState,
  ApexAiTrendRegime,
  ApexAiVolatilityRegime,
} from '@/types/apexAi';

/**
 * ApexAiRegimeCard — shows aggregated market regime across portfolio symbols.
 *
 * Aggregation: majority trend wins; worst-case volatility (safety-first).
 * Shows: trend badge, volatility badge, 1-line rationale, per-symbol breakdown.
 */

export function ApexAiRegimeCard({
  symbols,
  regimeMap,
}: {
  symbols: string[];
  regimeMap: Record<string, ApexAiRegimeState>;
}) {
  const aggregate = useMemo(() => aggregateRegime(symbols, regimeMap), [symbols, regimeMap]);

  if (!aggregate) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-4 text-sm text-muted-foreground">
          Market intelligence loading… (data refreshes every 5 minutes)
        </CardContent>
      </Card>
    );
  }

  const trendConfig = TREND_CONFIG[aggregate.trend];
  const volConfig = VOL_CONFIG[aggregate.volatility];

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`border-border/50 overflow-hidden relative ${trendConfig.cardBg}`}>
        <CardContent className="p-5 relative space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${trendConfig.iconBg}`}>
                <trendConfig.icon className={`w-6 h-6 ${trendConfig.iconColor}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base">Market Regime</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Analysis across {symbols.length} active symbol{symbols.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Regime badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={`${trendConfig.badgeBg} border-none`}>
              <trendConfig.icon className="w-3 h-3 mr-1" />
              {trendConfig.label}
            </Badge>
            <Badge className={`${volConfig.badgeBg} border-none`}>
              <Activity className="w-3 h-3 mr-1" />
              {volConfig.label} volatility
            </Badge>
            <Badge className="bg-muted text-muted-foreground border-none text-[10px]">
              ATR {aggregate.avgAtrPct.toFixed(2)}%
            </Badge>
          </div>

          {/* Rationale */}
          <div className="rounded-lg bg-background/60 p-3">
            <p className="text-sm leading-relaxed">
              <span className="font-semibold">{aggregate.rationale.headline}</span>{' '}
              <span className="text-muted-foreground">{aggregate.rationale.action}</span>
            </p>
          </div>

          {/* Per-symbol breakdown */}
          {aggregate.perSymbol.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Per symbol
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {aggregate.perSymbol.map((s) => {
                  const tc = TREND_CONFIG[s.trend];
                  return (
                    <div
                      key={s.symbol}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30"
                    >
                      <tc.icon className={`w-3 h-3 ${tc.iconColor}`} />
                      <span className="text-[11px] font-semibold">{s.symbol.replace('USDT', '')}</span>
                      <span className={`text-[10px] ${tc.iconColor}`}>{s.trendShort}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Aggregation & Config ───────────────────────────────────

interface AggregateResult {
  trend: ApexAiTrendRegime;
  volatility: ApexAiVolatilityRegime;
  avgAtrPct: number;
  rationale: { headline: string; action: string };
  perSymbol: Array<{ symbol: string; trend: ApexAiTrendRegime; trendShort: string }>;
}

function aggregateRegime(
  symbols: string[],
  map: Record<string, ApexAiRegimeState>
): AggregateResult | null {
  const perSymbol: Array<{ symbol: string; trend: ApexAiTrendRegime; trendShort: string }> = [];
  const trendVotes: Record<ApexAiTrendRegime, number> = {
    bull_trending: 0,
    bear_trending: 0,
    sideways: 0,
    unknown: 0,
  };
  let worstVol: ApexAiVolatilityRegime = 'low';
  let totalAtrPct = 0;
  let atrCount = 0;

  for (const symbol of symbols) {
    const r = map[symbol];
    if (!r) continue;
    trendVotes[r.trend_regime] = (trendVotes[r.trend_regime] ?? 0) + 1;
    perSymbol.push({
      symbol,
      trend: r.trend_regime,
      trendShort: TREND_SHORT[r.trend_regime],
    });
    if (VOL_WEIGHT[r.volatility_regime] > VOL_WEIGHT[worstVol]) {
      worstVol = r.volatility_regime;
    }
    if (r.atr_pct) {
      totalAtrPct += Number(r.atr_pct);
      atrCount++;
    }
  }

  if (perSymbol.length === 0) return null;

  // Dominant trend (majority wins, excluding unknown)
  const sortedTrends = (Object.keys(trendVotes) as ApexAiTrendRegime[])
    .filter((t) => t !== 'unknown' && trendVotes[t] > 0)
    .sort((a, b) => trendVotes[b] - trendVotes[a]);
  const dominantTrend = sortedTrends[0] ?? 'unknown';

  const avgAtrPct = atrCount > 0 ? totalAtrPct / atrCount : 0;

  return {
    trend: dominantTrend,
    volatility: worstVol,
    avgAtrPct,
    rationale: buildRationale(dominantTrend, worstVol),
    perSymbol,
  };
}

function buildRationale(
  trend: ApexAiTrendRegime,
  vol: ApexAiVolatilityRegime
): { headline: string; action: string } {
  const trendPhrase =
    trend === 'bull_trending'
      ? 'Market is trending up.'
      : trend === 'bear_trending'
      ? 'Market is trending down.'
      : trend === 'sideways'
      ? 'Market is ranging.'
      : 'Market direction unclear.';

  let action: string;
  if (vol === 'high') {
    action =
      trend === 'sideways'
        ? 'Wide grid spacing — fewer layers active. Leverage reduced 50% for safety.'
        : 'Leverage reduced due to high volatility. Bot trades carefully.';
  } else if (trend === 'bull_trending') {
    action = 'Long bias — tighter TP on longs, wider SL on shorts.';
  } else if (trend === 'bear_trending') {
    action = 'Short bias — tighter TP on shorts, wider SL on longs.';
  } else if (trend === 'sideways') {
    action = 'Full hedge grid active — profiting from price oscillation.';
  } else {
    action = 'Waiting for clearer signal before deploying aggressive layers.';
  }

  return { headline: trendPhrase, action };
}

const TREND_CONFIG: Record<
  ApexAiTrendRegime,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    iconBg: string;
    badgeBg: string;
    cardBg: string;
  }
> = {
  bull_trending: {
    label: '🐂 Bull trending',
    icon: TrendingUp,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
    badgeBg: 'bg-emerald-500/20 text-emerald-400',
    cardBg: 'bg-gradient-to-br from-emerald-500/5 to-transparent',
  },
  bear_trending: {
    label: '🐻 Bear trending',
    icon: TrendingDown,
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/15',
    badgeBg: 'bg-rose-500/20 text-rose-400',
    cardBg: 'bg-gradient-to-br from-rose-500/5 to-transparent',
  },
  sideways: {
    label: '↔️ Sideways',
    icon: Minus,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/15',
    badgeBg: 'bg-amber-500/20 text-amber-400',
    cardBg: 'bg-gradient-to-br from-amber-500/5 to-transparent',
  },
  unknown: {
    label: 'Unknown',
    icon: HelpCircle,
    iconColor: 'text-gray-400',
    iconBg: 'bg-gray-500/15',
    badgeBg: 'bg-gray-500/20 text-gray-400',
    cardBg: '',
  },
};

const TREND_SHORT: Record<ApexAiTrendRegime, string> = {
  bull_trending: 'Bull',
  bear_trending: 'Bear',
  sideways: 'Range',
  unknown: '?',
};

const VOL_CONFIG: Record<
  ApexAiVolatilityRegime,
  { label: string; badgeBg: string }
> = {
  low: { label: 'Low', badgeBg: 'bg-blue-500/15 text-blue-400' },
  medium: { label: 'Medium', badgeBg: 'bg-amber-500/15 text-amber-400' },
  high: { label: 'High', badgeBg: 'bg-rose-500/15 text-rose-400' },
};

const VOL_WEIGHT: Record<ApexAiVolatilityRegime, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

// Unused import safeguard
const _unused = { Zap };
void _unused;
