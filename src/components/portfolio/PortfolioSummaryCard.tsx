import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePortfolioAnalytics } from '@/hooks/usePortfolioAnalytics';
import { useExchangeBalance } from '@/hooks/useExchangeBalance';
import { useAppStore } from '@/store/appStore';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import {
  Wallet, RefreshCw, Link2, Sparkles, ArrowRight,
  Eye, EyeOff, ArrowUpRight, ArrowDownRight,
  ArrowDownToLine, Repeat2, BarChart3,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Chart data generation (simulated from balance) ────────

type TimeRange = '24H' | '7D' | '30D' | '90D' | '1Y';

function generateChartData(total: number, range: TimeRange): { time: string; value: number }[] {
  const points: Record<TimeRange, number> = { '24H': 24, '7D': 7, '30D': 30, '90D': 90, '1Y': 365 };
  const volatility: Record<TimeRange, number> = { '24H': 0.003, '7D': 0.008, '30D': 0.02, '90D': 0.05, '1Y': 0.12 };
  const count = points[range];
  const vol = volatility[range];
  const data: { time: string; value: number }[] = [];

  let seed = range.charCodeAt(0) * 137 + range.charCodeAt(1) * 31;
  const rand = () => { seed = (seed * 16807 + 7) % 2147483647; return (seed % 1000) / 1000; };

  let value = total * (1 - vol * 0.5 + rand() * vol * 0.3);
  for (let i = 0; i < count; i++) {
    const drift = (total - value) * 0.05;
    const noise = (rand() - 0.48) * total * vol * 0.15;
    value = Math.max(value * 0.85, value + drift + noise);
    const label = range === '24H'
      ? `${String(i).padStart(2, '0')}:00`
      : range === '7D'
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i % 7]
        : `D${i + 1}`;
    data.push({ time: label, value: Math.round(value * 100) / 100 });
  }
  data.push({ time: 'Now', value: total });
  return data;
}

// ─── Mini Chart Component ──────────────────────────────────

function PortfolioChart({
  data,
  isPositive,
  hideBalance,
}: {
  data: { time: string; value: number }[];
  isPositive: boolean;
  hideBalance: boolean;
}) {
  const color = isPositive ? '#22c55e' : '#ef4444';
  const gradientId = isPositive ? 'chartGradientGreen' : 'chartGradientRed';

  if (hideBalance) {
    return (
      <div className="h-[120px] flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Balance hidden</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis domain={['dataMin', 'dataMax']} hide />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '10px',
            fontSize: '11px',
            padding: '6px 10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
          labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: '10px' }}
          formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, '']}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          animationDuration={800}
          dot={false}
          activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Time Range Selector ───────────────────────────────────

function TimeRangeSelector({
  selected,
  onChange,
}: {
  selected: TimeRange;
  onChange: (r: TimeRange) => void;
}) {
  const ranges: TimeRange[] = ['24H', '7D', '30D', '90D', '1Y'];
  return (
    <div className="flex gap-1 p-0.5 rounded-lg bg-secondary/40">
      {ranges.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={cn(
            'px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all',
            selected === r
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

// ─── Quick Action Buttons ──────────────────────────────────

function QuickActions({ onNavigate }: { onNavigate: (path: string) => void }) {
  const actions = [
    { icon: Repeat2, label: 'Strategies', color: 'text-primary', bg: 'bg-primary/10', path: '/strategies' },
    { icon: BarChart3, label: 'Operations', color: 'text-blue-400', bg: 'bg-blue-500/10', path: '/portfolio' },
    { icon: ArrowDownToLine, label: 'DCA', color: 'text-purple-400', bg: 'bg-purple-500/10', path: '/dca-planner' },
    { icon: BarChart3, label: 'Analytics', color: 'text-amber-400', bg: 'bg-amber-500/10', path: '/analytics' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={() => onNavigate(a.path)}
          className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl hover:bg-secondary/40 transition-all active:scale-95"
        >
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', a.bg)}>
            <a.icon className={cn('w-[18px] h-[18px]', a.color)} />
          </div>
          <span className="text-[9px] font-medium text-muted-foreground">{a.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────

function SummarySkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-5 pb-5 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-[120px] w-full rounded-xl" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ────────────────────────────────────────

export function PortfolioSummaryCard() {
  const navigate = useNavigate();
  const analytics = usePortfolioAnalytics();
  const { refresh, isRefreshing } = useExchangeBalance();
  const [hideBalance, setHideBalance] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('7D');
  const [showAccounts, setShowAccounts] = useState(false);

  const chartData = useMemo(
    () => (analytics.isConnected ? generateChartData(analytics.grandTotal, timeRange) : []),
    [analytics.grandTotal, analytics.isConnected, timeRange]
  );

  const chartChange = useMemo(() => {
    if (chartData.length < 2) return { pct: 0, abs: 0 };
    const first = chartData[0].value;
    const last = chartData[chartData.length - 1].value;
    return {
      pct: first > 0 ? ((last - first) / first) * 100 : 0,
      abs: last - first,
    };
  }, [chartData]);

  const missionProgress = useAppStore((s) => s.missionProgress);
  const hasCreatedBybitAccount = missionProgress.m2_bybitAccountCreated;
  const handleNavigate = useCallback((path: string) => navigate(path), [navigate]);

  if (analytics.isLoading) return <SummarySkeleton />;

  if (!analytics.isConnected) {
    // New user who hasn't gone through the journey yet — show friendly guidance
    if (!hasCreatedBybitAccount) {
      return (
        <Card className="overflow-hidden border-dashed border-primary/20">
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, hsl(var(--primary)), transparent 70%)' }}
          />
          <CardContent className="pt-6 pb-6 relative">
            <div className="flex items-start gap-4">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0"
              >
                <Sparkles className="w-6 h-6 text-primary" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold mb-1">Welcome to Apice</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  Follow the Apice Journey below to set up your account step by step. Once ready, your live portfolio will appear here.
                </p>
                <button
                  onClick={() => {
                    const el = document.getElementById('apice-journey');
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary"
                >
                  Start your journey
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // User has completed journey but needs to connect API
    return (
      <Card className="overflow-hidden border-dashed border-primary/20">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, hsl(var(--primary)), transparent 70%)' }}
        />
        <CardContent className="pt-8 pb-8 relative">
          <div className="flex flex-col items-center text-center gap-5">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
            >
              <Link2 className="w-8 h-8 text-primary" />
            </motion.div>
            <div>
              <p className="text-lg font-bold mb-1">Connect Your Exchange</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px]">
                Link your Bybit account to see live balances, auto-invest with DCA, and track performance in real-time.
              </p>
            </div>
            <Button onClick={() => navigate('/settings')} className="gap-2">
              <Wallet className="w-4 h-4" />
              Connect Bybit
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { grandTotal, totalEquity, fundingBalance } = analytics;
  const hasFunding = fundingBalance > 0;
  const changePositive = chartChange.pct >= 0;

  const fmt = (v: number) =>
    hideBalance
      ? '••••••'
      : `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden border-0 shadow-xl shadow-primary/5">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at top right, ${changePositive ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)'}, transparent 60%)`,
          }}
        />

        <CardContent className="pt-5 pb-4 space-y-3 relative">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {analytics.isTestnet && (
                <Badge variant="outline" className="text-[8px] border-amber-500/30 text-amber-400 px-1.5">TESTNET</Badge>
              )}
              <Badge variant="outline" className="text-[8px] gap-1 border-green-500/30 text-green-400 px-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setHideBalance(!hideBalance)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
              >
                {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={refresh}
                disabled={isRefreshing}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
              </button>
            </div>
          </div>

          {/* Balance */}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Total Balance</p>
            <motion.p
              key={hideBalance ? 'hidden' : String(grandTotal)}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[32px] font-bold tracking-tight leading-none"
            >
              {fmt(grandTotal)}
            </motion.p>
            <div className="flex items-center gap-2 mt-1.5">
              <div
                className={cn(
                  'flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-md',
                  changePositive ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
                )}
              >
                {changePositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {hideBalance ? '•••' : `${changePositive ? '+' : ''}${chartChange.pct.toFixed(2)}%`}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {hideBalance ? '••••' : `${changePositive ? '+' : ''}$${Math.abs(chartChange.abs).toFixed(2)}`} {timeRange}
              </span>
            </div>
          </div>

          {/* Chart */}
          <div className="-mx-2">
            <PortfolioChart data={chartData} isPositive={changePositive} hideBalance={hideBalance} />
          </div>

          {/* Time Range */}
          <div className="flex justify-center">
            <TimeRangeSelector selected={timeRange} onChange={setTimeRange} />
          </div>

          {/* Account Summary (collapsible) */}
          <button
            onClick={() => setShowAccounts(!showAccounts)}
            className="w-full flex items-center justify-between py-2 px-1 group"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[10px] text-muted-foreground">Spot</span>
                <span className="text-xs font-semibold">{hideBalance ? '••••' : fmt(totalEquity)}</span>
              </div>
              {hasFunding && (
                <>
                  <span className="text-muted-foreground/30">|</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[10px] text-muted-foreground">Funding</span>
                    <span className="text-xs font-semibold">{hideBalance ? '••••' : fmt(fundingBalance)}</span>
                  </div>
                </>
              )}
            </div>
            <motion.div animate={{ rotate: showAccounts ? 180 : 0 }} className="text-muted-foreground">
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showAccounts && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-2"
              >
                {hasFunding && analytics.fundingHoldings.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {analytics.fundingHoldings.slice(0, 6).map((fh) => (
                      <div key={fh.coin} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/5 border border-amber-500/10">
                        <span className="text-[10px] font-semibold">{fh.coin}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {hideBalance ? '•••' : fh.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between px-1 pt-1">
                  <span className="text-[10px] text-muted-foreground">
                    {analytics.spotCount} assets · {analytics.activeDCAPlans} DCA plans
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Available: {fmt(analytics.totalAvailableBalance)}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Actions */}
          <div className="pt-1">
            <QuickActions onNavigate={handleNavigate} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
