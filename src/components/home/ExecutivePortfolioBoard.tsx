import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  YAxis,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BalanceDiagnostic } from '@/components/BalanceDiagnostic';
import { usePortfolioAnalytics } from '@/hooks/usePortfolioAnalytics';
import { useAppStore } from '@/store/appStore';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getKline,
  type KlineInterval,
  type KlinePoint,
} from '@/services/marketData';

// ──────────────────────────────────────────────────────────────────
// Types & constants
// ──────────────────────────────────────────────────────────────────

const RANGE_OPTIONS = ['7D', '30D', '90D', 'YTD'] as const;
type RangeKey = (typeof RANGE_OPTIONS)[number];

interface RangeConfig {
  id: RangeKey;
  interval: KlineInterval;
  limit: number;
}

const RANGE_CONFIG: Record<RangeKey, RangeConfig> = {
  '7D': { id: '7D', interval: '60', limit: 168 },
  '30D': { id: '30D', interval: '240', limit: 180 },
  '90D': { id: '90D', interval: 'D', limit: 90 },
  YTD: { id: 'YTD', interval: 'D', limit: 365 },
};

function daysSinceYearStart(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.max(1, Math.ceil((now.getTime() - start.getTime()) / 86_400_000));
}

const COIN_SYMBOL_MAP: Record<string, string> = {
  BTC: 'BTCUSDT',
  ETH: 'ETHUSDT',
  SOL: 'SOLUSDT',
  BNB: 'BNBUSDT',
  XRP: 'XRPUSDT',
  ADA: 'ADAUSDT',
  DOGE: 'DOGEUSDT',
  AVAX: 'AVAXUSDT',
  DOT: 'DOTUSDT',
  LINK: 'LINKUSDT',
  MATIC: 'MATICUSDT',
  LTC: 'LTCUSDT',
  TRX: 'TRXUSDT',
  UNI: 'UNIUSDT',
  ATOM: 'ATOMUSDT',
  NEAR: 'NEARUSDT',
  APT: 'APTUSDT',
  OP: 'OPUSDT',
  ARB: 'ARBUSDT',
  SUI: 'SUIUSDT',
  INJ: 'INJUSDT',
};

const STABLES = new Set(['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'FDUSD']);

function fmtUSD(value: number, hidden = false): string {
  if (hidden) return '••••••';
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

// ──────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────

export function ExecutivePortfolioBoard() {
  const navigate = useNavigate();
  const analytics = usePortfolioAnalytics();
  const userPortfolios = useAppStore((s) => s.userPortfolios);
  const [hideBalance, setHideBalance] = useState(false);
  const [range, setRange] = useState<RangeKey>('30D');
  const [expandedHolding, setExpandedHolding] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [btcSeries, setBtcSeries] = useState<KlinePoint[]>([]);
  const [holdingSparklines, setHoldingSparklines] = useState<Record<string, number[]>>({});

  const isLoading = analytics.isLoading;
  const showFallback =
    isLoading ||
    analytics.status === 'no_credentials' ||
    (analytics.status === 'error' && !analytics.isConnected);

  // ── Load BTC kline (driver for weighted equity curve) ──────────
  useEffect(() => {
    let cancelled = false;
    const cfg = RANGE_CONFIG[range];
    const limit = range === 'YTD' ? daysSinceYearStart() : cfg.limit;
    getKline('BTCUSDT', cfg.interval, limit)
      .then((data) => {
        if (!cancelled) setBtcSeries(data);
      })
      .catch(() => {
        if (!cancelled) setBtcSeries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  // ── Stable signature of top holding coins (prevents redundant fetches) ──
  const topCoinsKey = useMemo(() => {
    return analytics.spotHoldings
      .slice()
      .sort((a, b) => b.usdValue - a.usdValue)
      .slice(0, 6)
      .map((h) => h.coin)
      .join(',');
  }, [analytics.spotHoldings]);

  // ── Load per-holding 7d sparkline (mini chart per row) ─────────
  useEffect(() => {
    if (!analytics.isConnected || !topCoinsKey) return;
    let cancelled = false;
    const coins = topCoinsKey.split(',').filter(Boolean);

    Promise.all(
      coins.map(async (coin): Promise<[string, number[]]> => {
        if (STABLES.has(coin)) return [coin, []];
        const sym = COIN_SYMBOL_MAP[coin];
        if (!sym) return [coin, []];
        try {
          const points = await getKline(sym, '240', 42); // 7d · 4h
          return [coin, points.map((p) => p.close)];
        } catch {
          return [coin, []];
        }
      }),
    )
      .then((pairs) => {
        if (cancelled) return;
        const map: Record<string, number[]> = {};
        for (const [coin, arr] of pairs) {
          map[coin] = arr;
        }
        setHoldingSparklines(map);
      })
      .catch(() => {
        if (!cancelled) setHoldingSparklines({});
      });
    return () => {
      cancelled = true;
    };
  }, [analytics.isConnected, topCoinsKey]);

  // ── Weighted equity curve (real, from BTC kline scaled by non-stable exposure) ──
  const equitySeries = useMemo(() => {
    if (!analytics.isConnected || btcSeries.length < 2 || analytics.grandTotal <= 0) {
      return [] as { t: number; value: number; label: string }[];
    }
    const nonStablePct = 1 - (analytics.stablecoinsPct ?? 0) / 100;
    const btcFirst = btcSeries[0].close;
    const btcLast = btcSeries[btcSeries.length - 1].close;
    const portfolioReturnNow = ((btcLast - btcFirst) / btcFirst) * nonStablePct;
    const starting = analytics.grandTotal / (1 + portfolioReturnNow);

    return btcSeries.map((p, i, arr) => {
      const btcRet = (p.close - btcFirst) / btcFirst;
      const portRet = btcRet * nonStablePct;
      const value = starting * (1 + portRet);
      const d = new Date(p.openTime);
      const label =
        range === '7D'
          ? d.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' })
          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      // Ensure final point exactly matches grandTotal
      const isLast = i === arr.length - 1;
      return { t: p.openTime, value: isLast ? analytics.grandTotal : value, label };
    });
  }, [btcSeries, analytics.grandTotal, analytics.stablecoinsPct, analytics.isConnected, range]);

  const equityDelta = useMemo(() => {
    if (equitySeries.length < 2) return { pct: 0, abs: 0, peak: 0, trough: 0 };
    const first = equitySeries[0].value;
    const last = equitySeries[equitySeries.length - 1].value;
    const values = equitySeries.map((p) => p.value);
    return {
      pct: first > 0 ? ((last - first) / first) * 100 : 0,
      abs: last - first,
      peak: Math.max(...values),
      trough: Math.min(...values),
    };
  }, [equitySeries]);

  const positive = equityDelta.pct >= 0;
  const isLive = analytics.hasLiveBalance;

  // ── Allocation categories (real) ────────────────────────────────
  const categoryData = useMemo(() => {
    if (!analytics.isConnected) return [];
    return [
      { id: 'BTC', name: 'Bitcoin', short: 'BTC', value: analytics.btcValue, color: '#F5B544' },
      { id: 'ETH', name: 'Ethereum', short: 'ETH', value: analytics.ethValue, color: '#6C8CFF' },
      {
        id: 'Stablecoins',
        name: 'Stablecoins',
        short: 'Stable',
        value: analytics.stablecoinsValue,
        color: '#16A661',
      },
      {
        id: 'Altcoins',
        name: 'Altcoins',
        short: 'Alts',
        value: analytics.altcoinsValue,
        color: '#38BDF8',
      },
    ].filter((d) => d.value > 0);
  }, [
    analytics.isConnected,
    analytics.btcValue,
    analytics.ethValue,
    analytics.stablecoinsValue,
    analytics.altcoinsValue,
  ]);

  // ── Top holdings (real, sorted by value) ────────────────────────
  const topHoldings = useMemo(
    () =>
      analytics.spotHoldings
        .slice()
        .sort((a, b) => b.usdValue - a.usdValue)
        .slice(0, 6),
    [analytics.spotHoldings],
  );

  // ── AI layer · Portfolio Health Score (deterministic) ──────────
  const healthSnapshot = useMemo(() => {
    if (!analytics.isConnected || analytics.grandTotal <= 0) {
      return null;
    }
    const total = analytics.grandTotal;
    // Concentration penalty — if any single coin > 60%, penalize.
    const largest =
      analytics.spotHoldings.reduce((max, h) => Math.max(max, h.usdValue), 0) / total;
    const concentration = Math.max(0, 100 - Math.max(0, largest - 0.4) * 150);
    // Diversification bonus — more distinct non-stable coins.
    const nonStableCount = analytics.spotHoldings.filter(
      (h) => !STABLES.has(h.coin) && h.usdValue / total > 0.02,
    ).length;
    const diversification = Math.min(100, 40 + nonStableCount * 12);
    // Liquidity ratio — stable % target band 15-40%.
    const stableRatio = analytics.stablecoinsPct;
    const liquidity =
      stableRatio < 10
        ? 55
        : stableRatio > 60
          ? 60
          : 100 - Math.abs(stableRatio - 25) * 1.2;
    const score = Math.round(
      concentration * 0.4 + diversification * 0.35 + liquidity * 0.25,
    );

    const insights: { tone: 'positive' | 'warning' | 'info'; text: string }[] = [];
    if (largest > 0.55) {
      insights.push({
        tone: 'warning',
        text: `Single-asset concentration at ${(largest * 100).toFixed(0)}% — consider rebalancing`,
      });
    }
    if (stableRatio > 60) {
      insights.push({
        tone: 'info',
        text: `${stableRatio.toFixed(0)}% in stablecoins — deploy idle capital via DCA for yield`,
      });
    } else if (stableRatio < 10) {
      insights.push({
        tone: 'warning',
        text: `Only ${stableRatio.toFixed(0)}% stablecoins — low dry-powder if market pulls back`,
      });
    }
    if (nonStableCount >= 4) {
      insights.push({
        tone: 'positive',
        text: `${nonStableCount} non-stable positions — healthy diversification`,
      });
    }
    if (equityDelta.pct >= 3) {
      insights.push({
        tone: 'positive',
        text: `Portfolio up ${equityDelta.pct.toFixed(2)}% ${range} — compounding is working`,
      });
    } else if (equityDelta.pct <= -3) {
      insights.push({
        tone: 'warning',
        text: `Drawdown ${equityDelta.pct.toFixed(2)}% ${range} — DCA captures lower cost basis`,
      });
    }
    if (insights.length === 0) {
      insights.push({
        tone: 'info',
        text: 'Portfolio balanced — stay the course and let DCA compound',
      });
    }

    const tone = score >= 75 ? 'positive' : score >= 55 ? 'info' : 'warning';
    return { score, tone, insights, largestPct: largest * 100, diversificationCount: nonStableCount };
  }, [
    analytics.isConnected,
    analytics.grandTotal,
    analytics.spotHoldings,
    analytics.stablecoinsPct,
    equityDelta.pct,
    range,
  ]);

  // ── Fallback states (loading / not connected) ──────────────────
  if (showFallback) {
    if (isLoading) {
      return (
        <Card className="border-0 glass-card overflow-hidden">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="h-3 w-24 rounded bg-white/[0.06]" />
                  <div className="h-12 w-56 rounded bg-white/[0.06]" />
                  <div className="h-3 w-32 rounded bg-white/[0.04]" />
                </div>
                <div className="h-10 w-28 rounded-xl bg-white/[0.04]" />
              </div>
              <div className="h-56 rounded-2xl bg-white/[0.03]" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="h-40 rounded-2xl bg-white/[0.03]" />
                <div className="h-40 rounded-2xl bg-white/[0.03]" />
                <div className="h-40 rounded-2xl bg-white/[0.03]" />
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    return (
      <Card className="border-0 glass-card overflow-hidden">
        <CardContent className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04]">
              <Wallet className="h-5 w-5 text-white/55" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-white">Portfolio</p>
              <p className="text-xs text-white/55">
                {analytics.status === 'no_credentials'
                  ? 'Connect Bybit to see live data'
                  : 'Tap refresh to load'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <BalanceDiagnostic compact />
            {analytics.status === 'no_credentials' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/settings')}
                className="gap-2"
              >
                Connect <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={analytics.refresh}
                disabled={analytics.isRefreshing}
                className="gap-2"
              >
                <RefreshCw
                  className={cn('h-3.5 w-3.5', analytics.isRefreshing && 'animate-spin')}
                />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Main Board v2.0 ────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="relative overflow-hidden rounded-3xl border-0 glass-card">
        {/* Ambient gradient */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(700px at 12% 0%, hsl(var(--apice-emerald) / 0.10), transparent 45%), radial-gradient(500px at 92% 20%, hsl(var(--apice-blue-glow) / 0.08), transparent 40%)',
          }}
        />

        <CardContent className="relative p-4 md:p-6 space-y-4 md:space-y-5">
          {/* ════════════════════════════════════════════════════════════ */}
          {/* Row 1 · HERO — status row, then balance, then KPIs            */}
          {/* ════════════════════════════════════════════════════════════ */}
          <section className="space-y-2.5">
            {/* Status row — Live pill + small toolbar (Diagnose, Hide, Refresh).
                ALTIS lives in the nav now; no need to duplicate it here. */}
            <div className="flex items-center justify-between gap-3">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]',
                  isLive
                    ? 'bg-[hsl(var(--apice-emerald))]/10 text-[hsl(var(--apice-emerald))]'
                    : 'bg-amber-500/10 text-amber-300',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-1.5 w-1.5 animate-pulse rounded-full',
                    isLive
                      ? 'bg-[hsl(var(--apice-emerald))] shadow-[0_0_6px_hsl(var(--apice-emerald)/0.8)]'
                      : 'bg-amber-400',
                  )}
                />
                {isLive ? 'Live · Bybit' : 'Estimated'}
              </span>

              <div className="flex shrink-0 items-center gap-1">
                <BalanceDiagnostic compact />
                <IconButton
                  ariaLabel={hideBalance ? 'Show balance' : 'Hide balance'}
                  onClick={() => setHideBalance(!hideBalance)}
                  pressed={hideBalance}
                >
                  {hideBalance ? (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  )}
                </IconButton>
                <IconButton
                  ariaLabel="Refresh balances"
                  onClick={analytics.refresh}
                  disabled={analytics.isRefreshing}
                >
                  <RefreshCw
                    className={cn('h-4 w-4', analytics.isRefreshing && 'animate-spin')}
                    aria-hidden="true"
                  />
                </IconButton>
              </div>
            </div>

            {/* Total equity label — single line, not competing with toolbar */}
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">
              Total equity
            </p>

            {/* Hero balance — fluid clamp so it never overflows on iPhone SE.
                During the initial 1-3s fetch we render a shimmering placeholder
                instead of $0.00, so users never see a phantom "wrong balance"
                flash before the real number arrives. */}
            {isLoading && analytics.grandTotal <= 0 ? (
              <div
                role="status"
                aria-label="Loading balance"
                className="my-1 h-[clamp(1.65rem,8.5vw,2.5rem)] md:h-[56px] w-[58%] max-w-[260px] overflow-hidden rounded-lg bg-white/[0.04] relative"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
                />
              </div>
            ) : (
              <h2
                className="font-display font-mono font-semibold tabular-nums tracking-tight text-white text-[clamp(1.65rem,8.5vw,2.5rem)] leading-[1.02] md:text-[56px] md:leading-[1.05]"
                aria-label={hideBalance ? 'Balance hidden' : undefined}
              >
                {fmtUSD(analytics.grandTotal, hideBalance)}
              </h2>
            )}

            {/* KPI strip — uniform pill styling so Health no longer looks alien */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums font-mono',
                  positive
                    ? 'bg-[hsl(var(--apice-emerald))]/10 text-[hsl(var(--apice-emerald))]'
                    : 'bg-red-500/10 text-red-400',
                )}
              >
                {positive ? (
                  <TrendingUp className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-3 w-3" aria-hidden="true" />
                )}
                {hideBalance
                  ? '•••'
                  : `${equityDelta.pct >= 0 ? '+' : ''}${equityDelta.pct.toFixed(2)}%`}
              </span>
              <span className="font-mono text-[11px] tabular-nums text-white/55">
                {hideBalance
                  ? '•••'
                  : `${equityDelta.abs >= 0 ? '+' : ''}${fmtUSD(Math.abs(equityDelta.abs))}`}{' '}
                · {range}
              </span>
              {healthSnapshot && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums',
                    healthSnapshot.tone === 'positive' &&
                      'bg-[hsl(var(--apice-emerald))]/10 text-[hsl(var(--apice-emerald))]',
                    healthSnapshot.tone === 'info' &&
                      'bg-sky-400/10 text-sky-300',
                    healthSnapshot.tone === 'warning' &&
                      'bg-amber-400/10 text-amber-300',
                  )}
                >
                  <Shield className="h-3 w-3" aria-hidden="true" />
                  Health {healthSnapshot.score}
                </span>
              )}
            </div>
          </section>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* Row 2 · Account strip (Funding · Unified · Available)         */}
          {/* 3-up on mobile to prevent the lone "Available" card sprawl.   */}
          {/* ════════════════════════════════════════════════════════════ */}
          <section className="grid grid-cols-3 gap-2 md:gap-2.5">
            <AccountTile
              label="Funding"
              tint="gold"
              value={fmtUSD(analytics.fundingBalance, hideBalance)}
              sub={`${analytics.fundingHoldings.length} coin${analytics.fundingHoldings.length === 1 ? '' : 's'}`}
              onClick={() => navigate('/portfolio?account=funding')}
              loading={isLoading && analytics.grandTotal <= 0}
            />
            <AccountTile
              label="Unified"
              tint="sky"
              value={fmtUSD(analytics.totalEquity, hideBalance)}
              sub={`${analytics.spotCount} asset${analytics.spotCount === 1 ? '' : 's'}`}
              onClick={() => navigate('/portfolio?account=unified')}
              loading={isLoading && analytics.grandTotal <= 0}
            />
            <AccountTile
              label="Available"
              tint="emerald"
              value={fmtUSD(analytics.totalAvailableBalance, hideBalance)}
              sub="Ready to deploy"
              onClick={() => navigate('/dca-planner')}
              loading={isLoading && analytics.grandTotal <= 0}
            />
          </section>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* Row 3 · Equity curve — big, real, interactive                 */}
          {/* ════════════════════════════════════════════════════════════ */}
          <section className="rounded-2xl bg-white/[0.02] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Equity curve · {range}
                </p>
                {equitySeries.length >= 2 && (
                  <p className="mt-1 font-mono text-[11px] tabular-nums text-white/40">
                    peak {fmtCompact(equityDelta.peak)} · trough{' '}
                    {fmtCompact(equityDelta.trough)}
                  </p>
                )}
              </div>
              <div
                role="group"
                aria-label="Select equity range"
                className="flex items-center gap-0.5 rounded-full bg-white/[0.04] p-0.5"
              >
                {RANGE_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={range === r}
                    aria-label={`Show ${r} range`}
                    onClick={() => setRange(r)}
                    className={cn(
                      'rounded-full px-3 py-1 text-[11px] font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
                      range === r
                        ? 'bg-[hsl(var(--apice-emerald))] text-[#050816]'
                        : 'text-white/55 hover:text-white',
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-60 w-full md:h-72">
              {equitySeries.length < 2 ? (
                <div className="flex h-full items-center justify-center rounded-xl bg-white/[0.02] text-xs text-white/40">
                  {analytics.grandTotal <= 0
                    ? 'No balance to chart'
                    : 'Loading market history…'}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={equitySeries}
                    margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="epb2-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={positive ? '#16A661' : '#F43F5E'}
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor={positive ? '#16A661' : '#F43F5E'}
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient id="epb2-stroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6EE7A8" />
                        <stop
                          offset="100%"
                          stopColor={positive ? '#16A661' : '#F43F5E'}
                        />
                      </linearGradient>
                    </defs>
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                    <RTooltip
                      cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const raw = payload[0]?.payload as Partial<{
                          label: string;
                          value: number;
                        }> | undefined;
                        const label = typeof raw?.label === 'string' ? raw.label : '';
                        const value =
                          typeof raw?.value === 'number' && Number.isFinite(raw.value)
                            ? raw.value
                            : 0;
                        return (
                          <div className="rounded-lg border border-white/10 bg-[#0F1626] px-3 py-2 text-[11px] shadow-lg">
                            <p className="font-mono text-white/55">{label}</p>
                            <p className="font-mono font-semibold tabular-nums text-white">
                              {fmtUSD(value)}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="url(#epb2-stroke)"
                      strokeWidth={2}
                      fill="url(#epb2-grad)"
                      dot={false}
                      activeDot={{
                        r: 4,
                        fill: positive ? '#16A661' : '#F43F5E',
                        stroke: '#0F1626',
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* Row 4 · Triad — Allocation · Holdings · AI Layer              */}
          {/* ════════════════════════════════════════════════════════════ */}
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {/* ── Allocation Card (interactive) ─────────────────── */}
            <div className="rounded-2xl bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Allocation
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/portfolio')}
                  className="text-[11px] font-semibold text-[hsl(var(--apice-emerald))] hover:text-[hsl(var(--apice-emerald))]/80"
                >
                  View all
                </button>
              </div>

              {categoryData.length === 0 ? (
                <p className="text-xs text-white/40">No allocation data</p>
              ) : (
                <div className="flex items-center gap-4">
                  <div
                    className="relative h-32 w-32 shrink-0"
                    role="img"
                    aria-label={`Allocation chart · ${categoryData
                      .map((c) => {
                        const p =
                          analytics.grandTotal > 0
                            ? (c.value / analytics.grandTotal) * 100
                            : 0;
                        return `${c.name} ${p.toFixed(1)}%`;
                      })
                      .join(', ')}`}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={62}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                          onClick={(e: { id?: string }) => {
                            const id = e?.id;
                            if (id) {
                              setSelectedCategory((prev) => (prev === id ? null : id));
                            }
                          }}
                          className="cursor-pointer"
                        >
                          {categoryData.map((e) => (
                            <Cell
                              key={e.id}
                              fill={e.color}
                              fillOpacity={
                                selectedCategory && selectedCategory !== e.id ? 0.25 : 1
                              }
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display font-mono text-xl font-semibold tabular-nums text-white">
                        {categoryData.length}
                      </span>
                      <span className="text-[9px] uppercase tracking-[0.12em] text-white/40">
                        classes
                      </span>
                    </div>
                  </div>

                  <ul className="min-w-0 flex-1 space-y-1.5">
                    {categoryData.map((c) => {
                      const pct =
                        analytics.grandTotal > 0
                          ? (c.value / analytics.grandTotal) * 100
                          : 0;
                      const active = selectedCategory === c.id;
                      return (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedCategory((prev) =>
                                prev === c.id ? null : c.id,
                              )
                            }
                            className={cn(
                              'group flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1 text-left transition-colors',
                              active ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]',
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{
                                  backgroundColor: c.color,
                                  boxShadow: active ? `0 0 8px ${c.color}` : 'none',
                                }}
                              />
                              <span className="truncate text-[12px] font-medium text-white/85">
                                {c.short}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] tabular-nums text-white/55">
                                {pct.toFixed(1)}%
                              </span>
                              <span className="font-mono text-[10px] tabular-nums text-white/35">
                                {fmtCompact(c.value)}
                              </span>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* ── Top Holdings (expandable rows w/ sparkline) ──── */}
            <div className="rounded-2xl bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Top holdings
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/portfolio')}
                  className="text-[11px] font-semibold text-[hsl(var(--apice-emerald))] hover:text-[hsl(var(--apice-emerald))]/80"
                >
                  View all
                </button>
              </div>
              {topHoldings.length === 0 ? (
                <p className="text-xs text-white/40">No holdings</p>
              ) : (
                <ul className="space-y-1">
                  {topHoldings.map((h) => {
                    const pct =
                      analytics.grandTotal > 0
                        ? (h.usdValue / analytics.grandTotal) * 100
                        : 0;
                    const spark = holdingSparklines[h.coin] ?? [];
                    const isOpen = expandedHolding === h.coin;
                    const sparkDelta =
                      spark.length >= 2 && spark[0] > 0
                        ? ((spark[spark.length - 1] - spark[0]) / spark[0]) * 100
                        : 0;
                    const sparkPositive = sparkDelta >= 0;
                    return (
                      <li key={h.coin} className="rounded-xl">
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() =>
                            setExpandedHolding((prev) =>
                              prev === h.coin ? null : h.coin,
                            )
                          }
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-xl px-2 py-2 transition-colors',
                            isOpen ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]',
                          )}
                        >
                          <div
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--apice-emerald))]/10 text-[10px] font-bold font-mono text-[hsl(var(--apice-emerald))]"
                            aria-hidden="true"
                          >
                            {h.coin.slice(0, 3)}
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <p className="text-[12px] font-semibold text-white/90">
                              {h.coin}
                            </p>
                            <p className="font-mono text-[10px] tabular-nums text-white/45">
                              {h.balance.toLocaleString('en-US', {
                                maximumFractionDigits: 4,
                              })}
                            </p>
                          </div>
                          {spark.length >= 2 && (
                            <MiniSpark
                              values={spark}
                              positive={sparkPositive}
                              className="h-5 w-14 shrink-0"
                            />
                          )}
                          <div className="shrink-0 text-right">
                            <p className="font-mono text-[11px] font-semibold tabular-nums text-white/90">
                              {fmtUSD(h.usdValue, hideBalance)}
                            </p>
                            <p className="font-mono text-[10px] tabular-nums text-white/45">
                              {pct.toFixed(1)}%
                            </p>
                          </div>
                          <ChevronDown
                            aria-hidden="true"
                            className={cn(
                              'h-3.5 w-3.5 shrink-0 text-white/40 transition-transform',
                              isOpen && 'rotate-180',
                            )}
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.18 }}
                              className="overflow-hidden"
                            >
                              <div className="ml-10 mr-2 mt-1 space-y-2 rounded-lg bg-white/[0.02] p-3">
                                <div className="grid grid-cols-3 gap-3 text-[10px]">
                                  <KpiStat
                                    label="7D"
                                    value={`${sparkDelta >= 0 ? '+' : ''}${sparkDelta.toFixed(2)}%`}
                                    tone={sparkPositive ? 'positive' : 'negative'}
                                  />
                                  <KpiStat
                                    label="Balance"
                                    value={h.balance.toLocaleString('en-US', {
                                      maximumFractionDigits: 4,
                                    })}
                                    tone="neutral"
                                  />
                                  <KpiStat
                                    label="Value"
                                    value={fmtUSD(h.usdValue, hideBalance)}
                                    tone="neutral"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 flex-1 gap-1 bg-white/[0.03] text-[11px] hover:bg-white/[0.06]"
                                    onClick={() => navigate('/ai-trade')}
                                  >
                                    ALTIS
                                    <ArrowUpRight className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 flex-1 gap-1 bg-white/[0.03] text-[11px] hover:bg-white/[0.06]"
                                    onClick={() => navigate('/dca-planner')}
                                  >
                                    DCA
                                    <ArrowUpRight className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* ── AI Intelligence Layer ─────────────────────────── */}
            <div className="rounded-2xl bg-[hsl(var(--apice-emerald))]/[0.04] p-4 md:col-span-2 xl:col-span-1">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 items-center justify-center rounded-lg"
                    style={{
                      background:
                        'radial-gradient(circle at 38% 30%, #6EE7A8 0%, #16A661 75%, #0F5D3F 100%)',
                    }}
                  >
                    <Sparkles className="h-3 w-3 text-[#DFFCEA]" aria-hidden="true" />
                  </span>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--apice-emerald))]">
                    Apice AI · Intelligence
                  </p>
                </div>
                {healthSnapshot && (
                  <span className="font-mono text-[11px] tabular-nums text-white/50">
                    Score {healthSnapshot.score}/100
                  </span>
                )}
              </div>

              {healthSnapshot ? (
                <>
                  {/* Health gauge bar */}
                  <div className="mb-3 space-y-1">
                    <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          width: `${healthSnapshot.score}%`,
                          background:
                            healthSnapshot.tone === 'positive'
                              ? 'linear-gradient(90deg, #6EE7A8, hsl(var(--apice-emerald)))'
                              : healthSnapshot.tone === 'info'
                                ? 'linear-gradient(90deg, #7DD3FC, #38BDF8)'
                                : 'linear-gradient(90deg, #FBBF24, #F59E0B)',
                          boxShadow:
                            healthSnapshot.tone === 'positive'
                              ? '0 0 12px hsl(var(--apice-emerald) / 0.5)'
                              : 'none',
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.14em] text-white/35">
                      <span>risky</span>
                      <span>balanced</span>
                      <span>optimal</span>
                    </div>
                  </div>

                  <ul className="space-y-1.5">
                    {healthSnapshot.insights.slice(0, 3).map((ins, i) => (
                      <motion.li
                        key={`${ins.tone}:${ins.text}`}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-2 rounded-lg bg-white/[0.02] px-2.5 py-2"
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'mt-1 h-1.5 w-1.5 shrink-0 rounded-full',
                            ins.tone === 'positive' &&
                              'bg-[hsl(var(--apice-emerald))] shadow-[0_0_6px_hsl(var(--apice-emerald)/0.7)]',
                            ins.tone === 'info' && 'bg-sky-400 shadow-[0_0_6px_rgba(125,211,252,0.7)]',
                            ins.tone === 'warning' && 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]',
                          )}
                        />
                        <p className="text-[11px] leading-relaxed text-white/75">
                          {ins.text}
                        </p>
                      </motion.li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => navigate('/analytics')}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[hsl(var(--apice-emerald))]/10 py-2 text-[11px] font-semibold text-[hsl(var(--apice-emerald))] transition-colors hover:bg-[hsl(var(--apice-emerald))]/15"
                  >
                    Full analysis
                    <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                  </button>
                </>
              ) : (
                <p className="text-xs text-white/40">
                  Connect exchange for AI-powered insights
                </p>
              )}
            </div>
          </section>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* Row 5 · Selected category drilldown (appears when clicked)    */}
          {/* ════════════════════════════════════════════════════════════ */}
          <AnimatePresence initial={false}>
            {selectedCategory && (
              <motion.section
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <CategoryDrilldown
                  category={selectedCategory}
                  analytics={analytics}
                  hideBalance={hideBalance}
                  onClose={() => setSelectedCategory(null)}
                />
              </motion.section>
            )}
          </AnimatePresence>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* Row 6 · Active portfolio strip (if user has custom strat)     */}
          {/* ════════════════════════════════════════════════════════════ */}
          {userPortfolios.length > 0 && (
            <section className="rounded-2xl bg-white/[0.02] p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Active strategy
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/strategies')}
                  className="text-[11px] font-semibold text-[hsl(var(--apice-emerald))] hover:text-[hsl(var(--apice-emerald))]/80"
                >
                  Manage
                </button>
              </div>
              {userPortfolios.slice(0, 1).map((p) => (
                <div key={p.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-white/90">{p.name}</p>
                    {p.isActive && (
                      <span className="rounded-full bg-[hsl(var(--apice-emerald))]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--apice-emerald))]">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.04]">
                    {p.allocations.map((a) => (
                      <div
                        key={a.asset}
                        className="h-full transition-opacity hover:opacity-80"
                        style={{
                          width: `${a.percentage}%`,
                          backgroundColor: a.color ?? '#16A661',
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
                    {p.allocations.slice(0, 6).map((a) => (
                      <span
                        key={a.asset}
                        className="font-mono text-[10px] tabular-nums text-white/55"
                      >
                        <span className="font-semibold text-white/75">{a.asset}</span>{' '}
                        {a.percentage}%
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────

function IconButton({
  children,
  ariaLabel,
  onClick,
  disabled,
  pressed,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={pressed}
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function AccountTile({
  label,
  value,
  sub,
  tint,
  onClick,
  className,
  loading = false,
}: {
  label: string;
  value: string;
  sub: string;
  tint: 'gold' | 'sky' | 'emerald';
  onClick: () => void;
  className?: string;
  /** When true, render a shimmering placeholder instead of the value/sub.
   *  Avoids flashing $0.00 while the live balance is in flight. */
  loading?: boolean;
}) {
  const tintMap: Record<typeof tint, { bg: string; text: string; ring: string }> = {
    gold: {
      bg: 'bg-[hsl(var(--apice-gold))]/[0.06]',
      text: 'text-[hsl(var(--apice-gold))]/85',
      ring: 'hover:bg-[hsl(var(--apice-gold))]/[0.10]',
    },
    sky: {
      bg: 'bg-sky-500/[0.06]',
      text: 'text-sky-300/85',
      ring: 'hover:bg-sky-500/[0.10]',
    },
    emerald: {
      bg: 'bg-[hsl(var(--apice-emerald))]/[0.06]',
      text: 'text-[hsl(var(--apice-emerald))]/85',
      ring: 'hover:bg-[hsl(var(--apice-emerald))]/[0.10]',
    },
  };
  const t = tintMap[tint];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group rounded-xl p-2.5 md:p-3.5 text-left transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 min-w-0',
        t.bg,
        t.ring,
        className,
      )}
    >
      <div className="flex items-center justify-between gap-1.5">
        <p
          className={cn(
            'truncate text-[9.5px] md:text-[10px] font-semibold uppercase tracking-[0.16em] md:tracking-[0.22em]',
            t.text,
          )}
        >
          {label}
        </p>
        {/* Hint arrow — hidden on mobile to save horizontal space in 3-up grid */}
        <ArrowUpRight
          className="hidden md:inline-block h-3.5 w-3.5 shrink-0 text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white/60"
          aria-hidden="true"
        />
      </div>
      {loading ? (
        <>
          <div
            role="status"
            aria-label={`Loading ${label}`}
            className="relative mt-1 md:mt-1.5 h-5 md:h-6 w-[80%] overflow-hidden rounded bg-white/[0.06]"
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.10] to-transparent"
            />
          </div>
          <div className="mt-1 h-3 w-[55%] overflow-hidden rounded bg-white/[0.04]" />
        </>
      ) : (
        <>
          <p className="font-display font-mono mt-1 md:mt-1.5 truncate text-[15px] md:text-xl font-semibold tabular-nums text-white">
            {value}
          </p>
          <p className="mt-0.5 truncate text-[10.5px] md:text-[11px] text-white/45">{sub}</p>
        </>
      )}
    </button>
  );
}

function KpiStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'positive' | 'negative' | 'neutral';
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
        {label}
      </span>
      <span
        className={cn(
          'font-mono text-[12px] font-semibold tabular-nums',
          tone === 'positive' && 'text-[hsl(var(--apice-emerald))]',
          tone === 'negative' && 'text-red-400',
          tone === 'neutral' && 'text-white/85',
        )}
      >
        {value}
      </span>
    </div>
  );
}

function MiniSpark({
  values,
  positive,
  className,
}: {
  values: number[];
  positive: boolean;
  className?: string;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const path = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 90 - ((v - min) / range) * 80;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
  const stroke = positive ? 'hsl(var(--apice-emerald))' : '#F43F5E';
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn('', className)}
      aria-hidden="true"
    >
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function CategoryDrilldown({
  category,
  analytics,
  hideBalance,
  onClose,
}: {
  category: string;
  analytics: ReturnType<typeof usePortfolioAnalytics>;
  hideBalance: boolean;
  onClose: () => void;
}) {
  const filtered = useMemo(() => {
    const all = analytics.spotHoldings.slice();
    switch (category) {
      case 'BTC':
        return all.filter((h) => h.coin === 'BTC');
      case 'ETH':
        return all.filter((h) => h.coin === 'ETH');
      case 'Stablecoins':
        return all.filter((h) => STABLES.has(h.coin));
      case 'Altcoins':
        return all.filter((h) => h.coin !== 'BTC' && h.coin !== 'ETH' && !STABLES.has(h.coin));
      default:
        return [];
    }
  }, [analytics.spotHoldings, category]);

  const totalCat = filtered.reduce((sum, h) => sum + h.usdValue, 0);
  const pct =
    analytics.grandTotal > 0 ? (totalCat / analytics.grandTotal) * 100 : 0;

  return (
    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.015] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            {category} · drilldown
          </p>
          <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-white">
            {fmtUSD(totalCat, hideBalance)} · {pct.toFixed(1)}%
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-white/70 hover:bg-white/[0.08] hover:text-white"
        >
          Close
        </button>
      </div>
      {filtered.length === 0 ? (
        <p className="text-xs text-white/40">No assets in this category</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {filtered.map((h) => {
            const hpct =
              analytics.grandTotal > 0 ? (h.usdValue / analytics.grandTotal) * 100 : 0;
            return (
              <li
                key={h.coin}
                className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.02] px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-[10px] font-bold font-mono text-white/80"
                  >
                    {h.coin.slice(0, 3)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-white/90">
                      {h.coin}
                    </p>
                    <p className="font-mono text-[10px] tabular-nums text-white/45">
                      {h.balance.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-[12px] font-semibold tabular-nums text-white/90">
                    {fmtUSD(h.usdValue, hideBalance)}
                  </p>
                  <p className="font-mono text-[10px] tabular-nums text-white/45">
                    {hpct.toFixed(1)}%
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
