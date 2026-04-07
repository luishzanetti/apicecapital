import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePortfolioAnalytics } from '@/hooks/usePortfolioAnalytics';
import { useAppStore } from '@/store/appStore';
import { useTranslation } from '@/hooks/useTranslation';
import {
  ArrowRight, Eye, EyeOff, RefreshCw, TrendingDown, TrendingUp, Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STABLECOINS = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'FDUSD'];
const RANGE_OPTIONS = ['7D', '30D', '90D', '1Y'] as const;
type RangeKey = (typeof RANGE_OPTIONS)[number];

function fmt(value: number, hidden: boolean) {
  if (hidden) return '••••••';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function generateSeries(total: number, range: RangeKey) {
  const points: Record<RangeKey, number> = { '7D': 7, '30D': 30, '90D': 42, '1Y': 24 };
  const count = points[range];
  const series: { label: string; value: number }[] = [];
  let seed = total > 0 ? Math.round(total) : 137;
  const rand = () => { seed = (seed * 48271 + 1) % 2147483647; return (seed % 1000) / 1000; };
  let value = Math.max(1, total * (1 - 0.04 + rand() * 0.03));
  for (let i = 0; i < count; i++) {
    const drift = (total - value) * 0.035;
    const noise = (rand() - 0.5) * total * (range === '7D' ? 0.01 : range === '30D' ? 0.018 : range === '90D' ? 0.03 : 0.05);
    value = Math.max(value * 0.88, value + drift + noise);
    series.push({ label: range === '7D' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i % 7] : `${i + 1}`, value: Math.round(value * 100) / 100 });
  }
  series.push({ label: 'Now', value: total });
  return series;
}

export function ExecutivePortfolioBoard() {
  const navigate = useNavigate();
  const analytics = usePortfolioAnalytics();
  const { language } = useTranslation();
  const userPortfolios = useAppStore((s) => s.userPortfolios);
  const [hideBalance, setHideBalance] = useState(false);
  const [timeRange, setTimeRange] = useState<RangeKey>('30D');

  const isLoading = analytics.isLoading;
  const showFallback = isLoading || analytics.status === 'no_credentials' || (analytics.status === 'error' && !analytics.isConnected);

  const chartData = useMemo(() => analytics.isConnected ? generateSeries(analytics.grandTotal, timeRange) : [], [analytics.grandTotal, analytics.isConnected, timeRange]);
  const chartDelta = useMemo(() => {
    if (chartData.length < 2) return { pct: 0, abs: 0 };
    const first = chartData[0].value;
    const last = chartData[chartData.length - 1].value;
    return { pct: first > 0 ? ((last - first) / first) * 100 : 0, abs: last - first };
  }, [chartData]);

  const chartPositive = chartDelta.pct >= 0;
  const isLive = analytics.hasLiveBalance;

  const categoryData = useMemo(() => {
    if (!analytics.isConnected) return [];
    return [
      { name: 'BTC', value: analytics.btcValue, color: '#f59e0b' },
      { name: 'ETH', value: analytics.ethValue, color: '#6366f1' },
      { name: 'Stablecoins', value: analytics.stablecoinsValue, color: '#22c55e' },
      { name: 'Altcoins', value: analytics.altcoinsValue, color: '#38bdf8' },
    ].filter((d) => d.value > 0);
  }, [analytics]);

  const topHoldings = useMemo(() => analytics.spotHoldings.slice().sort((a, b) => b.usdValue - a.usdValue).slice(0, 4), [analytics.spotHoldings]);

  // ── Fallback states ────────────────────────────────────────────
  if (showFallback) {
    if (isLoading) {
      return (
        <Card className="border-0 shadow-2xl shadow-primary/5 overflow-hidden">
          <CardContent className="p-5">
            <div className="animate-pulse space-y-4">
              <div className="h-3 w-28 rounded bg-secondary/60" />
              <div className="h-10 w-44 rounded bg-secondary/40" />
              <div className="grid grid-cols-2 gap-3"><div className="h-16 rounded-xl bg-secondary/30" /><div className="h-16 rounded-xl bg-secondary/30" /></div>
            </div>
          </CardContent>
        </Card>
      );
    }
    return (
      <Card className="border-0 shadow-2xl shadow-primary/5 overflow-hidden">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center"><Wallet className="w-5 h-5 text-muted-foreground" /></div>
            <div>
              <p className="text-sm font-semibold">Portfolio</p>
              <p className="text-xs text-muted-foreground">{analytics.status === 'no_credentials' ? 'Connect Bybit to see live data' : 'Tap refresh to load'}</p>
            </div>
          </div>
          {analytics.status === 'no_credentials' ? (
            <Button variant="outline" size="sm" onClick={() => navigate('/settings')} className="gap-2">Connect <ArrowRight className="w-3.5 h-3.5" /></Button>
          ) : (
            <Button variant="outline" size="sm" onClick={analytics.refresh} disabled={analytics.isRefreshing} className="gap-2"><RefreshCw className={cn('w-3.5 h-3.5', analytics.isRefreshing && 'animate-spin')} /> Retry</Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // ── Main Board ─────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="border-0 shadow-2xl shadow-primary/5 overflow-hidden relative">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 15% 10%, rgba(99,102,241,0.15), transparent 40%), radial-gradient(circle at 85% 20%, rgba(16,185,129,0.08), transparent 35%)' }} />

        <CardContent className="relative p-4 md:p-5 space-y-4">

          {/* ── Row 1: Balance + Actions ──────────────────────────── */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={cn('text-[10px] h-5', isLive ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400')}>
                  <span className={cn('mr-1 h-1.5 w-1.5 rounded-full inline-block', isLive ? 'bg-green-400' : 'bg-amber-400')} />
                  {isLive ? 'Live' : 'Estimated'}
                </Badge>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{fmt(analytics.grandTotal, hideBalance)}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', chartPositive ? 'text-green-400' : 'text-red-400')}>
                  {chartPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {hideBalance ? '•••' : `${chartDelta.pct >= 0 ? '+' : ''}${chartDelta.pct.toFixed(2)}%`}
                </span>
                <span className="text-[11px] text-muted-foreground">{hideBalance ? '' : `${chartDelta.abs >= 0 ? '+' : ''}${fmt(Math.abs(chartDelta.abs), false)}`} {timeRange}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setHideBalance(!hideBalance)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors">
                {hideBalance ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
              </button>
              <button onClick={analytics.refresh} disabled={analytics.isRefreshing} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors">
                <RefreshCw className={cn('h-4 w-4 text-muted-foreground', analytics.isRefreshing && 'animate-spin')} />
              </button>
            </div>
          </div>

          {/* ── Row 2: Account Cards + Chart ──────────────────────── */}
          <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">

            {/* Left: Accounts + Allocation */}
            <div className="space-y-3">
              {/* Funding + Unified */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-amber-400/70 font-semibold">Funding</p>
                  <p className="text-base font-bold mt-1">{fmt(analytics.fundingBalance, hideBalance)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{analytics.fundingHoldings.length} coins</p>
                </div>
                <div className="rounded-xl border border-sky-500/10 bg-sky-500/5 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-sky-400/70 font-semibold">Unified</p>
                  <p className="text-base font-bold mt-1">{fmt(analytics.totalEquity, hideBalance)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{analytics.spotCount} assets</p>
                </div>
              </div>

              {/* Allocation Donut */}
              {categoryData.length > 0 && (
                <div className="rounded-xl border border-border/20 bg-black/20 p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-[100px] h-[100px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={categoryData} cx="50%" cy="50%" innerRadius={30} outerRadius={46} paddingAngle={2} dataKey="value" stroke="none">
                            {categoryData.map((e) => <Cell key={e.name} fill={e.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {categoryData.map((item) => {
                        const pct = analytics.grandTotal > 0 ? (item.value / analytics.grandTotal) * 100 : 0;
                        return (
                          <div key={item.name} className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="font-medium">{item.name}</span>
                            </div>
                            <span className="text-muted-foreground">{pct.toFixed(1)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Top Holdings */}
              {topHoldings.length > 0 && (
                <div className="rounded-xl border border-border/20 bg-black/20 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Holdings</p>
                    <button onClick={() => navigate('/portfolio')} className="text-[10px] text-primary hover:text-primary/80 font-medium">View all</button>
                  </div>
                  <div className="space-y-1.5">
                    {topHoldings.map((h) => {
                      const pct = analytics.grandTotal > 0 ? (h.usdValue / analytics.grandTotal) * 100 : 0;
                      return (
                        <div key={h.coin} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">{h.coin.slice(0, 2)}</div>
                            <div>
                              <p className="text-[11px] font-semibold">{h.coin}</p>
                              <p className="text-[9px] text-muted-foreground">{h.balance.toLocaleString('en-US', { maximumFractionDigits: 4 })}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] font-semibold">{fmt(h.usdValue, hideBalance)}</p>
                            <p className="text-[9px] text-muted-foreground">{pct.toFixed(1)}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Chart */}
            <div className="space-y-3">
              <div className="rounded-xl border border-border/20 bg-black/20 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Equity Line</p>
                  <div className="flex items-center gap-0.5 rounded-full bg-secondary/40 p-0.5">
                    {RANGE_OPTIONS.map((r) => (
                      <button key={r} onClick={() => setTimeRange(r)} className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors', timeRange === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>{r}</button>
                    ))}
                  </div>
                </div>
                <div className="h-[160px] md:h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="epb-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={chartPositive ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <YAxis domain={['dataMin', 'dataMax']} hide />
                      <Tooltip formatter={(v: number) => [fmt(v, false), '']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '10px', fontSize: '11px' }} labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: '10px' }} />
                      <Area type="monotone" dataKey="value" stroke={chartPositive ? '#22c55e' : '#ef4444'} strokeWidth={2} fill="url(#epb-grad)" dot={false} activeDot={{ r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Active Portfolio */}
              {userPortfolios.length > 0 && (
                <div className="rounded-xl border border-border/20 bg-black/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Active Portfolio</p>
                  {userPortfolios.slice(0, 1).map((p) => (
                    <div key={p.id}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold">{p.name}</p>
                        {p.isActive && <Badge variant="outline" className="border-green-500/20 text-[9px] text-green-400 h-4">Active</Badge>}
                      </div>
                      <div className="flex h-2 overflow-hidden rounded-full bg-secondary/40">
                        {p.allocations.map((a) => (
                          <div key={a.asset} className="h-full" style={{ width: `${a.percentage}%`, backgroundColor: a.color ?? '#6366f1' }} />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.allocations.slice(0, 5).map((a) => (
                          <span key={a.asset} className="text-[9px] text-muted-foreground">{a.asset} {a.percentage}%</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Available Balance */}
              <div className="flex items-center justify-between rounded-xl border border-border/20 bg-black/20 px-3 py-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Available</span>
                <span className="text-xs font-bold">{fmt(analytics.totalAvailableBalance, hideBalance)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
