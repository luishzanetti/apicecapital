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
import { getReturnRateForInvestorType } from '@/data/sampleData';
import {
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STABLECOINS = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'FDUSD'];
const RANGE_OPTIONS = ['7D', '30D', '90D', '1Y'] as const;

type RangeKey = (typeof RANGE_OPTIONS)[number];

function formatCurrency(value: number, hidden: boolean) {
  if (hidden) return '••••••';
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function generateSeries(total: number, range: RangeKey) {
  const pointsByRange: Record<RangeKey, number> = { '7D': 7, '30D': 30, '90D': 42, '1Y': 24 };
  const points = pointsByRange[range];
  const series: { label: string; value: number }[] = [];

  let seed = total > 0 ? Math.round(total) : 137;
  const rand = () => {
    seed = (seed * 48271 + 1) % 2147483647;
    return (seed % 1000) / 1000;
  };

  let value = Math.max(1, total * (1 - 0.04 + rand() * 0.03));
  for (let index = 0; index < points; index += 1) {
    const drift = (total - value) * 0.035;
    const noise = (rand() - 0.5) * total * (range === '7D' ? 0.01 : range === '30D' ? 0.018 : range === '90D' ? 0.03 : 0.05);
    value = Math.max(value * 0.88, value + drift + noise);
    series.push({
      label:
        range === '7D'
          ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index % 7]
          : range === '30D'
            ? `${index + 1}`
            : range === '90D'
              ? `W${index + 1}`
              : `M${index + 1}`,
      value: Math.round(value * 100) / 100,
    });
  }

  series.push({ label: 'Now', value: total });
  return series;
}

function calcPeriodDeposits(entries: { amount: number; confirmedAt: string }[]) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  return entries.reduce(
    (acc, entry) => {
      const confirmedAt = new Date(entry.confirmedAt);
      if (Number.isNaN(confirmedAt.getTime())) return acc;
      if (confirmedAt >= monthStart) acc.mtd += entry.amount;
      if (confirmedAt >= yearStart) acc.ytd += entry.amount;
      return acc;
    },
    { mtd: 0, ytd: 0 }
  );
}

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function ExecutivePortfolioBoard() {
  const navigate = useNavigate();
  const analytics = usePortfolioAnalytics();
  const { language } = useTranslation();
  const investorType = useAppStore((s) => s.investorType);
  const weeklyDepositHistory = useAppStore((s) => s.weeklyDepositHistory);
  const [hideBalance, setHideBalance] = useState(false);
  const [timeRange, setTimeRange] = useState<RangeKey>('30D');

  const copy = useMemo(
    () =>
      language === 'pt'
        ? {
            title: 'Visão executiva',
            subtitle: 'Spot, futuros, funding e alocação numa única tela.',
            live: 'Ao vivo',
            estimated: 'Estimado',
            spot: 'Spot',
            futures: 'Futures',
            funding: 'Funding',
            mtd: 'MTD',
            ytd: 'YTD',
            allocation: 'Alocação',
            portfolios: 'Portfólios ativos',
            stablecoins: 'Stablecoins',
            topHoldings: 'Top holdings',
            available: 'Disponível',
            refresh: 'Atualizar',
            hide: 'Ocultar',
            show: 'Exibir',
            details: 'Ver portfólio',
            active: 'Ativo',
            noData: 'Conecte a Bybit para ver saldos ao vivo.',
            futureHint: 'Margem + P&L não realizado',
            portfolioHint: 'Templates e alocações em execução.',
            depositHint: 'vs aportes do período',
            resultHint: 'Resultado estimado',
            noPortfolios: 'Nenhum portfólio configurado.',
            consolidated: 'Saldo consolidado',
            equityLine: 'Linha do patrimônio',
            equityLineHint: 'Tendência visual do valor consolidado',
            assets: 'ativos',
            coins: 'moedas',
            targetAssets: 'ativos-alvo',
            allocationHint: 'BTC, ETH, stablecoins e altcoins.',
            holdingsHint: 'Alocação visual e leitura rápida.',
          }
        : {
            title: 'Executive view',
            subtitle: 'Spot, futures, funding, and allocation in one control surface.',
            live: 'Live',
            estimated: 'Estimated',
            spot: 'Spot',
            futures: 'Futures',
            funding: 'Funding',
            mtd: 'MTD',
            ytd: 'YTD',
            allocation: 'Allocation',
            portfolios: 'Active portfolios',
            stablecoins: 'Stablecoins',
            topHoldings: 'Top holdings',
            available: 'Available',
            refresh: 'Refresh',
            hide: 'Hide',
            show: 'Show',
            details: 'View portfolio',
            active: 'Active',
            noData: 'Connect Bybit to see live balances.',
            futureHint: 'Margin + unrealized P&L',
            portfolioHint: 'Templates and allocations in execution.',
            depositHint: 'vs period contributions',
            resultHint: 'Estimated result',
            noPortfolios: 'No portfolio configured yet.',
            consolidated: 'Consolidated balance',
            equityLine: 'Equity line',
            equityLineHint: 'Visual trend of consolidated value',
            assets: 'assets',
            coins: 'coins',
            targetAssets: 'target assets',
            allocationHint: 'BTC, ETH, stablecoins, and altcoins.',
            holdingsHint: 'Visual allocation and quick read.',
          },
    [language]
  );
  const userPortfolios = useAppStore((s) => s.userPortfolios);
  const showFallback =
    analytics.isLoading ||
    analytics.status === 'no_credentials' ||
    (analytics.status === 'error' && !analytics.isConnected);

  const chartData = useMemo(
    () => (analytics.isConnected ? generateSeries(analytics.grandTotal, timeRange) : []),
    [analytics.grandTotal, analytics.isConnected, timeRange]
  );

  const chartDelta = useMemo(() => {
    if (chartData.length < 2) return { pct: 0, abs: 0 };
    const first = chartData[0].value;
    const last = chartData[chartData.length - 1].value;
    return {
      pct: first > 0 ? ((last - first) / first) * 100 : 0,
      abs: last - first,
    };
  }, [chartData]);

  const periodDeposits = useMemo(() => calcPeriodDeposits(weeklyDepositHistory), [weeklyDepositHistory]);
  const annualRate = getReturnRateForInvestorType(investorType);
  const now = new Date();
  const monthProgress = now.getDate() / new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const yearProgress = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000) / (isLeapYear(now.getFullYear()) ? 366 : 365);
  const monthResult = periodDeposits.mtd > 0 ? periodDeposits.mtd * annualRate * monthProgress : null;
  const yearResult = periodDeposits.ytd > 0 ? periodDeposits.ytd * annualRate * yearProgress : null;
  const monthReturnPct = periodDeposits.mtd > 0 && monthResult !== null ? (monthResult / periodDeposits.mtd) * 100 : 0;
  const yearReturnPct = periodDeposits.ytd > 0 && yearResult !== null ? (yearResult / periodDeposits.ytd) * 100 : 0;

  const categoryData = useMemo(() => {
    if (!analytics.isConnected) return [];
    return [
      { name: 'BTC', value: analytics.btcValue, color: '#f59e0b' },
      { name: 'ETH', value: analytics.ethValue, color: '#6366f1' },
      { name: copy.stablecoins, value: analytics.stablecoinsValue, color: '#22c55e' },
      { name: 'Altcoins', value: analytics.altcoinsValue, color: '#38bdf8' },
    ].filter((item) => item.value > 0);
  }, [analytics, copy.stablecoins]);

  const topHoldings = useMemo(
    () => analytics.spotHoldings.slice().sort((a, b) => b.usdValue - a.usdValue).slice(0, 5),
    [analytics.spotHoldings]
  );
  const stablecoinHoldings = useMemo(
    () => analytics.spotHoldings.filter((holding) => STABLECOINS.includes(holding.coin)),
    [analytics.spotHoldings]
  );
  const visiblePortfolios = useMemo(() => userPortfolios.slice(0, 3), [userPortfolios]);

  const futuresPositive = analytics.futuresUnrealizedPnl >= 0;
  const chartPositive = chartDelta.pct >= 0;
  const statusLabel = analytics.hasLiveBalance ? copy.live : copy.estimated;
  const statusBadgeClass = analytics.hasLiveBalance
    ? 'border-green-500/30 bg-green-500/10 text-green-300'
    : 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  const statusDotClass = analytics.hasLiveBalance ? 'bg-green-400' : 'bg-amber-300';

  const metricCards = [
    {
      label: copy.funding,
      value: analytics.fundingBalance,
      helper: `${analytics.fundingHoldings.length} ${copy.coins}`,
      tone: 'text-amber-400',
      badge: 'bg-amber-500/10',
    },
    {
      label: 'Unified',
      value: analytics.totalEquity,
      helper: `${analytics.spotCount} ${copy.assets}${analytics.futuresPositionCount > 0 ? ` · ${analytics.futuresPositionCount} pos.` : ''}`,
      tone: 'text-sky-400',
      badge: 'bg-sky-500/10',
    },
  ] as const;

  if (showFallback) {
    // Single clean fallback — no duplicate cards
    if (analytics.isLoading) {
      return (
        <Card className="relative overflow-hidden border-0 shadow-2xl shadow-primary/5">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-3 w-32 rounded bg-secondary/60" />
              <div className="h-10 w-48 rounded bg-secondary/40" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 rounded-2xl bg-secondary/30" />
                <div className="h-20 rounded-2xl bg-secondary/30" />
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    return (
      <Card className="relative overflow-hidden border-0 shadow-2xl shadow-primary/5">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Wallet className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">{copy.consolidated}</p>
              <p className="text-xs text-muted-foreground">
                {analytics.status === 'no_credentials' ? 'Connect Bybit to see live data' : 'Tap refresh to load balance'}
              </p>
            </div>
          </div>
          {analytics.status === 'no_credentials' ? (
            <Button variant="outline" size="sm" onClick={() => navigate('/settings')} className="gap-2">
              Connect
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={analytics.refresh} disabled={analytics.isRefreshing} className="gap-2">
              <RefreshCw className={cn('w-3.5 h-3.5', analytics.isRefreshing && 'animate-spin')} />
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <Card className="relative overflow-hidden border-0 shadow-2xl shadow-primary/5">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at top left, rgba(99,102,241,0.20), transparent 32%), radial-gradient(circle at top right, rgba(16,185,129,0.12), transparent 28%), linear-gradient(180deg, rgba(15,23,42,0.75), rgba(15,23,42,0.94))',
          }}
        />
        <CardContent className="relative space-y-5 p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase tracking-[0.22em] text-primary/80">{copy.title}</span>
                {analytics.isConnected ? (
                  <Badge variant="outline" className={cn('text-[11px]', statusBadgeClass)}>
                    <span className={cn('mr-1 h-1.5 w-1.5 rounded-full', statusDotClass)} />
                    {statusLabel}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-border/40 text-[11px] text-muted-foreground">
                    {copy.noData}
                  </Badge>
                )}
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground">{copy.subtitle}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-muted-foreground" onClick={() => setHideBalance((value) => !value)}>
                {hideBalance ? <Eye className="mr-1.5 h-3.5 w-3.5" /> : <EyeOff className="mr-1.5 h-3.5 w-3.5" />}
                {hideBalance ? copy.show : copy.hide}
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-muted-foreground" onClick={analytics.refresh} disabled={analytics.isRefreshing}>
                <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', analytics.isRefreshing && 'animate-spin')} />
                {copy.refresh}
              </Button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.55fr_0.95fr]">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{copy.consolidated}</p>
                <div className="flex flex-wrap items-end gap-3">
                  <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">{formatCurrency(analytics.grandTotal, hideBalance)}</h2>
                  <div className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', chartPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400')}>
                    {chartPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {hideBalance ? '•••' : `${chartDelta.pct >= 0 ? '+' : ''}${chartDelta.pct.toFixed(2)}%`}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {hideBalance ? '••••' : `${chartDelta.abs >= 0 ? '+' : ''}${formatCurrency(Math.abs(chartDelta.abs), false)}`} {timeRange}
                  </span>
                </div>
                  <p className="text-xs text-muted-foreground">
                    {copy.available}: {formatCurrency(analytics.totalAvailableBalance, hideBalance)}
                  </p>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                {metricCards.map((card) => (
                  <div key={card.label} className="rounded-2xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className={cn('flex h-8 w-8 items-center justify-center rounded-xl', card.badge)}>
                        <Wallet className={cn('h-4 w-4', card.tone)} />
                      </div>
                      <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{card.label}</span>
                    </div>
                    <p className="mt-3 text-lg font-semibold tracking-tight">{formatCurrency(card.value, hideBalance)}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{card.helper}</p>
                  </div>
                ))}
              </div>

                <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-2xl border border-border/30 bg-black/20 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{copy.mtd}</span>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', monthResult === null ? 'bg-secondary/40 text-muted-foreground' : monthResult >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400')}>
                      {monthResult === null ? '—' : `${monthResult >= 0 ? '+' : ''}${monthReturnPct.toFixed(1)}%`}
                    </span>
                  </div>
                  <p className={cn('mt-2 text-xl font-semibold tracking-tight', monthResult === null ? 'text-muted-foreground' : monthResult >= 0 ? 'text-green-400' : 'text-red-400')}>
                    {monthResult === null ? '—' : formatCurrency(monthResult, hideBalance)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {copy.resultHint} · {copy.depositHint} {periodDeposits.mtd > 0 ? formatCurrency(periodDeposits.mtd, hideBalance) : '—'}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/30 bg-black/20 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{copy.ytd}</span>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', yearResult === null ? 'bg-secondary/40 text-muted-foreground' : yearResult >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400')}>
                      {yearResult === null ? '—' : `${yearResult >= 0 ? '+' : ''}${yearReturnPct.toFixed(1)}%`}
                    </span>
                  </div>
                  <p className={cn('mt-2 text-xl font-semibold tracking-tight', yearResult === null ? 'text-muted-foreground' : yearResult >= 0 ? 'text-green-400' : 'text-red-400')}>
                    {yearResult === null ? '—' : formatCurrency(yearResult, hideBalance)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {copy.resultHint} · {copy.depositHint} {periodDeposits.ytd > 0 ? formatCurrency(periodDeposits.ytd, hideBalance) : '—'}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-border/30 bg-black/20 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{copy.equityLine}</p>
                    <p className="text-xs text-muted-foreground">{copy.equityLineHint}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-secondary/40 p-1">
                    {RANGE_OPTIONS.map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={cn(
                          'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
                          timeRange === range ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-[190px] w-full">
                  {analytics.isConnected ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="home-board-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={chartPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.24} />
                            <stop offset="100%" stopColor={chartPositive ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <YAxis domain={['dataMin', 'dataMax']} hide />
                        <Tooltip
                          formatter={(value: number) => [formatCurrency(value, false), '']}
                          contentStyle={{
                            background: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '12px',
                            fontSize: '11px',
                          }}
                          labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: '10px' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={chartPositive ? '#22c55e' : '#ef4444'}
                          strokeWidth={2.25}
                          fill="url(#home-board-gradient)"
                          dot={false}
                          activeDot={{ r: 3 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border/40 text-sm text-muted-foreground">
                      {copy.noData}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-border/30 bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{copy.allocation}</p>
                    <p className="text-xs text-muted-foreground">{copy.allocationHint}</p>
                  </div>
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div className="h-[190px]">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={46} outerRadius={76} paddingAngle={3} dataKey="value" stroke="hsl(var(--card))" strokeWidth={2}>
                          {categoryData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [formatCurrency(value, false), '']}
                          contentStyle={{
                            background: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '12px',
                            fontSize: '11px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{copy.noData}</div>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  {categoryData.map((item) => {
                    const pct = analytics.totalEquity > 0 ? (item.value / analytics.totalEquity) * 100 : 0;
                    return (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="text-muted-foreground">{pct.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-border/30 bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{copy.portfolios}</p>
                    <p className="text-xs text-muted-foreground">{copy.portfolioHint}</p>
                  </div>
                  <Badge variant="outline" className="border-primary/20 text-[11px] text-primary">
                    {visiblePortfolios.length}
                  </Badge>
                </div>
                {visiblePortfolios.length > 0 ? (
                  <div className="space-y-2.5">
                    {visiblePortfolios.map((portfolio) => (
                      <div key={portfolio.id} className="rounded-2xl border border-white/5 bg-white/5 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold">{portfolio.name}</p>
                            <p className="text-[11px] text-muted-foreground">{portfolio.allocations.length} {copy.targetAssets}</p>
                          </div>
                          {portfolio.isActive && (
                            <Badge variant="outline" className="border-green-500/20 text-[10px] text-green-400">
                              {copy.active}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-secondary/40">
                          {portfolio.allocations.map((allocation) => (
                            <div
                              key={`${portfolio.id}-${allocation.asset}`}
                              className="h-full"
                              style={{
                                width: `${allocation.percentage}%`,
                                backgroundColor: allocation.color ?? '#6366f1',
                              }}
                            />
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {portfolio.allocations.slice(0, 4).map((allocation) => (
                            <div key={`${portfolio.id}-${allocation.asset}-pill`} className="rounded-full border border-border/30 px-2 py-1 text-[11px] text-muted-foreground">
                              {allocation.asset} {allocation.percentage}%
                            </div>
                          ))}
                          {portfolio.allocations.length > 4 && (
                            <div className="rounded-full border border-border/30 px-2 py-1 text-[11px] text-muted-foreground">
                              +{portfolio.allocations.length - 4}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-24 items-center justify-center rounded-2xl border border-dashed border-border/30 text-sm text-muted-foreground">
                    {copy.noPortfolios}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-border/30 bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{copy.topHoldings}</p>
                    <p className="text-xs text-muted-foreground">{copy.holdingsHint}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => navigate('/portfolio')}>
                    {copy.details}
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {topHoldings.map((holding) => {
                    const pct = analytics.totalEquity > 0 ? (holding.usdValue / analytics.totalEquity) * 100 : 0;
                    const isStable = STABLECOINS.includes(holding.coin);
                    return (
                      <div key={holding.coin} className="space-y-1.5 rounded-2xl border border-white/5 bg-white/5 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={cn('flex h-7 w-7 items-center justify-center rounded-full', isStable ? 'bg-green-500/10 text-green-400' : 'bg-primary/10 text-primary')}>
                              {holding.coin.slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-xs font-semibold">{holding.coin}</p>
                              <p className="text-[11px] text-muted-foreground">{holding.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold">{formatCurrency(holding.usdValue, hideBalance)}</p>
                            <p className="text-[11px] text-muted-foreground">{pct.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-secondary/40">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400" style={{ width: `${Math.max(pct, 2)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {stablecoinHoldings.length > 0 && (
                <div className="rounded-3xl border border-border/30 bg-black/20 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{copy.stablecoins}</p>
                      <p className="text-xs text-muted-foreground">Tactical reserve and opportunity vault.</p>
                    </div>
                    <Badge variant="outline" className="border-green-500/20 text-[11px] text-green-400">
                      {stablecoinHoldings.length}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {stablecoinHoldings.map((holding) => (
                      <div key={holding.coin} className="flex items-center gap-2 rounded-full border border-green-500/10 bg-green-500/5 px-3 py-1.5">
                        <span className="text-[11px] font-semibold text-green-300">{holding.coin}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {hideBalance ? '•••' : formatCurrency(holding.usdValue, false)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
}
