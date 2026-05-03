import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { usePortfolioAnalytics } from '@/hooks/usePortfolioAnalytics';
import { useAppStore } from '@/store/appStore';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  ArrowLeft, TrendingUp, TrendingDown, DollarSign, Activity,
  Wallet, PieChart as PieIcon, BarChart3, Clock,
  ArrowUpRight, ArrowDownRight, Zap, Target, ChevronRight,
  LineChart, ArrowRight, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnalyticsHero } from '@/components/analytics/AnalyticsHero';
import { PortfolioEvolutionChart } from '@/components/analytics/PortfolioEvolutionChart';
import { TopMoversCard } from '@/components/analytics/TopMoversCard';
import { DCAExecutionHeatmap } from '@/components/analytics/DCAExecutionHeatmap';
import { ExecutionVolumeChart } from '@/components/analytics/ExecutionVolumeChart';
import { AssetROITable } from '@/components/analytics/AssetROITable';
import { InsightsCard } from '@/components/analytics/InsightsCard';
import { DCAProjectionChart } from '@/components/analytics/DCAProjectionChart';
import { PerformanceMetricsCard } from '@/components/analytics/PerformanceMetricsCard';
import { SuccessRateByAssetCard } from '@/components/analytics/SuccessRateByAssetCard';
import { DCAByAssetCard } from '@/components/analytics/DCAByAssetCard';
import { useDCAExecution, type DCAExecution } from '@/hooks/useDCAExecution';
import { usePortfolioSnapshotCapture } from '@/hooks/usePortfolioHistory';

type TabId = 'overview' | 'operations' | 'investments' | 'performance';

const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/30 space-y-1.5">
      <div className="flex items-center gap-2">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', color)}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, icon: Icon }: { title: string; icon: any }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-primary" />
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">{title}</h3>
    </div>
  );
}

export default function Analytics() {
  const navigate = useNavigate();
  const analytics = usePortfolioAnalytics();
  const dcaPlans = useAppStore((s) => s.dcaPlans);
  const notifications = useAppStore((s) => s.notifications);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [executions, setExecutions] = useState<DCAExecution[]>([]);
  const { fetchHistory } = useDCAExecution();

  const totalDeposited = useMemo(
    () => dcaPlans.reduce((sum, p) => sum + p.totalInvested, 0),
    [dcaPlans]
  );

  // Capture daily snapshot of portfolio state when connected
  const snapshots = usePortfolioSnapshotCapture({
    enabled: analytics.isConnected,
    totalValue: analytics.grandTotal,
    invested: totalDeposited + analytics.totalDCAInvested,
    pnl: analytics.totalUnrealizedPnL,
    pnlPercent: analytics.pnlPercent,
  });

  // Fetch DCA execution history once on mount
  useEffect(() => {
    let cancelled = false;
    fetchHistory(undefined, 200).then((data) => {
      if (!cancelled && data) setExecutions(data);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchHistory]);

  const dcaNotifications = useMemo(
    () => notifications.filter((n) => n.category === 'dca'),
    [notifications]
  );

  const successfulDCAs = useMemo(
    () => dcaNotifications.filter((n) => n.type === 'success').length,
    [dcaNotifications]
  );

  const failedDCAs = useMemo(
    () => dcaNotifications.filter((n) => n.type === 'error').length,
    [dcaNotifications]
  );

  // Allocation pie chart data
  const pieData = useMemo(() => {
    if (!analytics.isConnected) return [];
    return analytics.allocationMap
      .filter((a) => a.spotUsdValue > 0)
      .sort((a, b) => b.spotUsdValue - a.spotUsdValue)
      .slice(0, 8)
      .map((a, i) => ({
        name: a.coin,
        value: Math.round(a.spotUsdValue * 100) / 100,
        pct: a.totalAllocationPct,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }));
  }, [analytics]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    if (!analytics.isConnected) return [];
    return [
      { name: 'BTC', value: analytics.btcValue, pct: analytics.btcPct, color: '#f59e0b' },
      { name: 'ETH', value: analytics.ethValue, pct: analytics.ethPct, color: '#6366f1' },
      { name: 'Altcoins', value: analytics.altcoinsValue, pct: analytics.altcoinsPct, color: '#22c55e' },
      { name: 'Stablecoins', value: analytics.stablecoinsValue, pct: analytics.stablecoinsPct, color: '#94a3b8' },
    ].filter((c) => c.value > 0);
  }, [analytics]);

  const fmt = (v: number) =>
    `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'operations', label: 'Operations', icon: BarChart3 },
    { id: 'investments', label: 'Investments', icon: DollarSign },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header — sticky to keep tabs visible while scrolling */}
      <div className="sticky top-0 z-30 px-5 pt-6 pb-4 safe-top border-b border-border/40 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-secondary/80"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Analytics</h1>
            <p className="text-xs text-muted-foreground">Portfolio, performance & operations</p>
          </div>
          {analytics.refresh && (
            <button
              onClick={() => analytics.refresh()}
              disabled={analytics.isRefreshing || analytics.isLoading}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-secondary/80 disabled:opacity-50"
              title="Refresh data"
            >
              <Activity
                className={cn('w-4 h-4', (analytics.isRefreshing || analytics.isLoading) && 'animate-pulse')}
              />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-secondary/40 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all flex-1',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {analytics.isLoading && (
        <div className="px-6 mt-4 space-y-4 animate-pulse">
          <div className="h-6 w-48 rounded bg-secondary/40" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-xl bg-secondary/30" />)}
          </div>
          <div className="h-[200px] rounded-xl bg-secondary/30" />
        </div>
      )}

      <div className="px-6 space-y-5 mt-2" style={{ display: analytics.isLoading ? 'none' : undefined }}>
        {/* Simulated data banner */}
        {!analytics.isConnected && dcaPlans.length > 0 && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-300">
                Portfolio data is simulated — connect Bybit for real analytics.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/settings')} className="shrink-0 text-xs">
              Connect
            </Button>
          </div>
        )}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
              {/* 1. Hero — Total Portfolio + P&L + KPIs */}
              <AnalyticsHero
                analytics={analytics}
                totalDeposited={totalDeposited}
                dcaPlansCount={dcaPlans.length}
                onConnect={() => navigate('/settings')}
              />

              {/* 1.5. Portfolio evolution chart (when connected) */}
              {analytics.isConnected && (
                <PortfolioEvolutionChart snapshots={snapshots} isConnected={analytics.isConnected} />
              )}

              {/* 1.6. Top movers — winners + losers */}
              {analytics.isConnected && analytics.spotHoldings.length > 0 && (
                <TopMoversCard holdings={analytics.spotHoldings} isConnected={analytics.isConnected} />
              )}

              {/* 1.7. Onboarding hint when totally empty */}
              {!analytics.isConnected && totalDeposited === 0 && dcaPlans.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="rounded-2xl glass-card p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold">Unlock your analytics</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    Connect your Bybit account and create a DCA plan to see live performance, P&L tracking, and asset breakdowns.
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Button variant="premium" size="sm" onClick={() => navigate('/settings')} className="gap-1.5">
                      <Zap className="h-3.5 w-3.5" />
                      Connect
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate('/dca-planner')} className="gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      DCA Plan
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* 2. Asset Allocation — pie chart prominent */}
              {pieData.length > 0 && (
                <Card>
                  <CardContent className="pt-5 pb-5">
                    <SectionHeader title="Asset Allocation" icon={PieIcon} />
                    <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-5 items-center">
                      <div className="w-44 h-44 mx-auto md:mx-0 shrink-0 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              dataKey="value"
                              strokeWidth={2}
                              stroke="hsl(var(--card))"
                              paddingAngle={2}
                            >
                              {pieData.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        {/* Center label */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {pieData.length} assets
                          </span>
                          <span className="text-sm font-bold tabular-nums">
                            {fmt(pieData.reduce((s, p) => s + p.value, 0))}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {pieData.map((item) => (
                          <div key={item.name} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="text-xs font-semibold truncate">{item.name}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold tabular-nums">{item.pct.toFixed(1)}%</span>
                              <span className="text-[11px] text-muted-foreground ml-1.5 tabular-nums">{fmt(item.value)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 3. Portfolio Breakdown — by category */}
              {categoryBreakdown.length > 0 && (
                <Card>
                  <CardContent className="pt-5 pb-5">
                    <SectionHeader title="Portfolio Breakdown" icon={BarChart3} />
                    <div className="space-y-3.5">
                      {categoryBreakdown.map((cat, i) => (
                        <motion.div
                          key={cat.name}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold">{cat.name}</span>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {fmt(cat.value)} · <span className="font-semibold text-foreground/80">{cat.pct.toFixed(1)}%</span>
                            </span>
                          </div>
                          <div className="h-2 bg-secondary/60 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: cat.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(cat.pct, 100)}%` }}
                              transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 4. Insights — auto-derived */}
              {(executions.length > 0 || analytics.isConnected) && (
                <InsightsCard analytics={analytics} executions={executions} snapshots={snapshots} />
              )}
            </motion.div>
          )}

          {activeTab === 'operations' && (
            <motion.div key="operations" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
              {/* 1. Monthly volume bar chart */}
              <ExecutionVolumeChart executions={executions} />

              {/* 2. Calendar heatmap of execution activity */}
              <DCAExecutionHeatmap executions={executions} />

              {/* 3. Success rate by asset */}
              {executions.length > 0 && <SuccessRateByAssetCard executions={executions} />}

              {/* Empty state for operations */}
              {dcaNotifications.length === 0 && dcaPlans.filter(p => p.isActive).length === 0 && executions.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="rounded-2xl bg-card/50 border border-border/50 p-6 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-1.5">No operations yet</h3>
                  <p className="text-sm text-muted-foreground mb-5 max-w-[260px] mx-auto leading-relaxed">
                    Create a DCA plan to start automated buying. Every execution will appear here.
                  </p>
                  <button
                    onClick={() => navigate('/dca-planner')}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white apice-gradient-primary transition-all hover:opacity-90 active:scale-[0.98]"
                  >
                    Create a DCA Plan
                  </button>
                </motion.div>
              )}

              {/* DCA Execution History */}
              <Card>
                <CardContent className="pt-4 pb-4">
                  <SectionHeader title="DCA Executions" icon={Zap} />
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                      <p className="text-lg font-bold text-green-400 tabular-nums">
                        {executions.filter((e) => e.status === 'success').length || successfulDCAs}
                      </p>
                      <p className="text-[11px] text-muted-foreground">Successful</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                      <p className="text-lg font-bold text-red-400 tabular-nums">
                        {executions.filter((e) => e.status === 'failed').length || failedDCAs}
                      </p>
                      <p className="text-[11px] text-muted-foreground">Failed</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10">
                      <p className="text-lg font-bold text-primary tabular-nums">{analytics.activeDCAPlans}</p>
                      <p className="text-[11px] text-muted-foreground">Active Plans</p>
                    </div>
                  </div>

                  {/* Recent executions (real data preferred, falls back to notifications) */}
                  <div className="space-y-2">
                    {executions.length > 0 ? (
                      executions.slice(0, 10).map((exec) => {
                        const success = exec.status === 'success';
                        const failed = exec.status === 'failed';
                        return (
                          <div
                            key={exec.id}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-xl border',
                              success
                                ? 'bg-green-500/5 border-green-500/10'
                                : failed
                                  ? 'bg-red-500/5 border-red-500/10'
                                  : 'bg-amber-500/5 border-amber-500/10',
                            )}
                          >
                            <div
                              className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                                success
                                  ? 'bg-green-500/10'
                                  : failed
                                    ? 'bg-red-500/10'
                                    : 'bg-amber-500/10',
                              )}
                            >
                              {success ? (
                                <ArrowUpRight className="w-4 h-4 text-green-400" />
                              ) : failed ? (
                                <ArrowDownRight className="w-4 h-4 text-red-400" />
                              ) : (
                                <Activity className="w-4 h-4 text-amber-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate">
                                {exec.asset_symbol} · {fmt(exec.amount_usdt ?? 0)}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate tabular-nums">
                                {exec.quantity ? `${Number(exec.quantity).toFixed(6)} units` : '—'}
                                {exec.price ? ` @ $${Number(exec.price).toFixed(2)}` : ''}
                                {failed && exec.error_message ? ` · ${exec.error_message}` : ''}
                              </p>
                            </div>
                            <span className="text-[11px] text-muted-foreground/60 shrink-0">
                              {new Date(exec.executed_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        );
                      })
                    ) : dcaNotifications.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        No DCA operations recorded yet
                      </p>
                    ) : (
                      dcaNotifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-xl border',
                            n.type === 'success'
                              ? 'bg-green-500/5 border-green-500/10'
                              : n.type === 'warning'
                                ? 'bg-amber-500/5 border-amber-500/10'
                                : 'bg-red-500/5 border-red-500/10',
                          )}
                        >
                          <div
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                              n.type === 'success'
                                ? 'bg-green-500/10'
                                : n.type === 'warning'
                                  ? 'bg-amber-500/10'
                                  : 'bg-red-500/10',
                            )}
                          >
                            {n.type === 'success' ? (
                              <ArrowUpRight className="w-4 h-4 text-green-400" />
                            ) : n.type === 'warning' ? (
                              <Activity className="w-4 h-4 text-amber-400" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{n.title}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{n.message}</p>
                          </div>
                          <span className="text-[11px] text-muted-foreground/60 shrink-0">
                            {new Date(n.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Active DCA Plans Detail */}
              <Card>
                <CardContent className="pt-4 pb-4">
                  <SectionHeader title="Active Plans" icon={Target} />
                  {dcaPlans.filter((p) => p.isActive).length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">No active DCA plans</p>
                  ) : (
                    <div className="space-y-3">
                      {dcaPlans.filter((p) => p.isActive).map((plan) => (
                        <button
                          key={plan.id}
                          onClick={() => navigate('/dca-planner')}
                          className="w-full p-3.5 rounded-xl bg-secondary/30 border border-border/30 text-left hover:border-primary/20 transition-all group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold">{plan.assets.map((a) => a.symbol).join(', ')}</span>
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold uppercase">
                                {plan.frequency}
                              </span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                            <span>{fmt(plan.amountPerInterval)} / interval</span>
                            <span>·</span>
                            <span>Invested: {fmt(plan.totalInvested)}</span>
                          </div>
                          {plan.nextExecutionDate && (
                            <div className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground/60">
                              <Clock className="w-2.5 h-2.5" />
                              Next: {new Date(plan.nextExecutionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'investments' && (
            <motion.div key="investments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
              {/* Empty state for investments */}
              {totalDeposited === 0 && analytics.totalDCAInvested === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="rounded-2xl bg-card/50 border border-border/50 p-6 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-1.5">No investments recorded</h3>
                  <p className="text-sm text-muted-foreground mb-5 max-w-[260px] mx-auto leading-relaxed">
                    Your deposit history and DCA investments will be tracked here once you start investing.
                  </p>
                  <button
                    onClick={() => navigate('/portfolio')}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white apice-gradient-primary transition-all hover:opacity-90 active:scale-[0.98]"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Start Investing
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </button>
                </motion.div>
              )}

              {/* Investment Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  icon={DollarSign}
                  label="Total Deposited"
                  value={fmt(totalDeposited)}
                  sub={`${dcaPlans.length} plans`}
                  color="bg-green-500/10 text-green-400"
                />
                <StatCard
                  icon={Zap}
                  label="DCA Invested"
                  value={fmt(analytics.totalDCAInvested)}
                  sub={`${dcaPlans.length} total plans`}
                  color="bg-purple-500/10 text-purple-400"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Monthly Commit"
                  value={fmt(analytics.totalDCACommittedMonthly)}
                  sub={`${analytics.activeDCAPlans} active plans`}
                  color="bg-primary/10 text-primary"
                />
                <StatCard
                  icon={Target}
                  label="Avg per Buy"
                  value={
                    executions.filter((e) => e.status === 'success').length > 0
                      ? fmt(
                          executions
                            .filter((e) => e.status === 'success')
                            .reduce((s, e) => s + (e.amount_usdt ?? 0), 0) /
                            executions.filter((e) => e.status === 'success').length,
                        )
                      : '—'
                  }
                  sub={`${executions.filter((e) => e.status === 'success').length} buys executed`}
                  color="bg-amber-500/10 text-amber-400"
                />
              </div>

              {/* DCA Projection — what 12 months looks like at current cadence */}
              <DCAProjectionChart
                plans={dcaPlans}
                alreadyInvested={totalDeposited + analytics.totalDCAInvested}
              />

              {/* DCA Distribution — VWAP per asset */}
              {executions.length > 0 && <DCAByAssetCard executions={executions} />}

              {/* Insights — auto-derived from executions + analytics */}
              <InsightsCard analytics={analytics} executions={executions} snapshots={snapshots} />
            </motion.div>
          )}

          {activeTab === 'performance' && (
            <motion.div key="performance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
              {/* Performance Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  icon={Wallet}
                  label="Current Value"
                  value={analytics.isConnected ? fmt(analytics.grandTotal) : '—'}
                  color="bg-primary/10 text-primary"
                />
                <StatCard
                  icon={analytics.pnlPercent >= 0 ? TrendingUp : TrendingDown}
                  label="Total Return"
                  value={analytics.isConnected ? `${analytics.pnlPercent >= 0 ? '+' : ''}${analytics.pnlPercent.toFixed(2)}%` : '—'}
                  sub={analytics.isConnected ? fmt(analytics.totalUnrealizedPnL) : undefined}
                  color={analytics.pnlPercent >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}
                />
              </div>

              {/* Performance metrics — quant signals from snapshots */}
              {analytics.isConnected && (
                <PerformanceMetricsCard analytics={analytics} snapshots={snapshots} />
              )}

              {/* Holdings ROI table — sortable */}
              {analytics.isConnected && analytics.spotHoldings.length > 0 && (
                <AssetROITable
                  holdings={analytics.spotHoldings}
                  totalValue={analytics.grandTotal}
                />
              )}

              {/* Top movers row */}
              {analytics.isConnected && analytics.spotHoldings.length > 0 && (
                <TopMoversCard holdings={analytics.spotHoldings} isConnected={analytics.isConnected} />
              )}

              {/* Funding Account */}
              {analytics.fundingBalance > 0 && (
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <SectionHeader title="Funding Account" icon={Wallet} />
                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 mb-3">
                      <span className="text-xs font-semibold">Total Funding</span>
                      <span className="text-sm font-bold">{fmt(analytics.fundingBalance)}</span>
                    </div>
                    <div className="space-y-1.5">
                      {analytics.fundingHoldings.map((fh) => (
                        <div key={fh.coin} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/20">
                          <span className="text-xs font-semibold">{fh.coin}</span>
                          <span className="text-xs text-muted-foreground">
                            {fh.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {!analytics.isConnected && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="rounded-2xl bg-card/50 border border-border/50 p-6 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
                    <LineChart className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-1.5">Track your performance</h3>
                  <p className="text-sm text-muted-foreground mb-5 max-w-[260px] mx-auto leading-relaxed">
                    Link your Bybit account to see live P&L, holdings breakdown, and portfolio performance.
                  </p>
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white apice-gradient-primary transition-all hover:opacity-90 active:scale-[0.98]"
                  >
                    Connect Exchange
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
