import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { usePortfolioAnalytics } from '@/hooks/usePortfolioAnalytics';
import { useAppStore } from '@/store/appStore';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import {
  ArrowLeft, TrendingUp, TrendingDown, DollarSign, Activity,
  Wallet, PieChart as PieIcon, BarChart3, Calendar, Clock,
  ArrowUpRight, ArrowDownRight, Zap, Target, ChevronRight,
  Layers, LineChart, ArrowRight, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

  const totalDeposited = useMemo(
    () => dcaPlans.reduce((sum, p) => sum + p.totalInvested, 0),
    [dcaPlans]
  );

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
      {/* Header */}
      <div
        className="px-6 pt-8 pb-5"
        style={{ background: 'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-secondary/60 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold">Analytics</h1>
            <p className="text-[11px] text-muted-foreground">History, operations & performance</p>
          </div>
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
              {/* Empty state when no exchange and no deposits */}
              {!analytics.isConnected && totalDeposited === 0 && dcaPlans.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="rounded-2xl bg-card/50 border border-border/50 p-6 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-1.5">No analytics data yet</h3>
                  <p className="text-sm text-muted-foreground mb-5 max-w-[260px] mx-auto leading-relaxed">
                    Connect your exchange to see portfolio analytics, allocation breakdown, and performance tracking.
                  </p>
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => navigate('/settings')}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-white apice-gradient-primary transition-all hover:opacity-90 active:scale-[0.98]"
                    >
                      Connect Bybit
                    </button>
                    <button
                      onClick={() => navigate('/portfolio')}
                      className="w-full py-3 rounded-xl text-sm font-semibold border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all active:scale-[0.98]"
                    >
                      Go to Portfolio
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  icon={Wallet}
                  label="Total Balance"
                  value={analytics.isConnected ? fmt(analytics.grandTotal) : '—'}
                  sub={analytics.isConnected ? `${analytics.spotCount} assets` : 'Connect exchange'}
                  color="bg-primary/10 text-primary"
                />
                <StatCard
                  icon={DollarSign}
                  label="Total Invested"
                  value={fmt(totalDeposited + analytics.totalDCAInvested)}
                  sub={`${dcaPlans.length} plans`}
                  color="bg-green-500/10 text-green-400"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Unrealized P&L"
                  value={analytics.isConnected ? `${analytics.pnlPercent >= 0 ? '+' : ''}${analytics.pnlPercent.toFixed(2)}%` : '—'}
                  sub={analytics.isConnected ? fmt(analytics.totalUnrealizedPnL) : undefined}
                  color={analytics.pnlPercent >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}
                />
                <StatCard
                  icon={Zap}
                  label="DCA Active"
                  value={`${analytics.activeDCAPlans}`}
                  sub={`${fmt(analytics.totalDCACommittedMonthly)}/mo`}
                  color="bg-purple-500/10 text-purple-400"
                />
              </div>

              {/* Asset Allocation */}
              {pieData.length > 0 && (
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <SectionHeader title="Asset Allocation" icon={PieIcon} />
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-32 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={55}
                              dataKey="value"
                              strokeWidth={2}
                              stroke="hsl(var(--card))"
                            >
                              {pieData.map((entry, i) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {pieData.map((item) => (
                          <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="text-xs font-semibold">{item.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-medium">{item.pct.toFixed(1)}%</span>
                              <span className="text-[11px] text-muted-foreground ml-1.5">{fmt(item.value)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Category Breakdown */}
              {categoryBreakdown.length > 0 && (
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <SectionHeader title="Portfolio Breakdown" icon={BarChart3} />
                    <div className="space-y-3">
                      {categoryBreakdown.map((cat) => (
                        <div key={cat.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold">{cat.name}</span>
                            <span className="text-xs text-muted-foreground">{fmt(cat.value)} · {cat.pct.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: cat.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(cat.pct, 100)}%` }}
                              transition={{ duration: 0.6, delay: 0.1 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {activeTab === 'operations' && (
            <motion.div key="operations" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
              {/* Empty state for operations */}
              {dcaNotifications.length === 0 && dcaPlans.filter(p => p.isActive).length === 0 && (
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
                      <p className="text-lg font-bold text-green-400">{successfulDCAs}</p>
                      <p className="text-[11px] text-muted-foreground">Successful</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                      <p className="text-lg font-bold text-red-400">{failedDCAs}</p>
                      <p className="text-[11px] text-muted-foreground">Failed</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10">
                      <p className="text-lg font-bold text-primary">{analytics.activeDCAPlans}</p>
                      <p className="text-[11px] text-muted-foreground">Active Plans</p>
                    </div>
                  </div>

                  {/* Recent DCA notifications */}
                  <div className="space-y-2">
                    {dcaNotifications.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">No DCA operations recorded yet</p>
                    ) : (
                      dcaNotifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-xl border',
                            n.type === 'success' ? 'bg-green-500/5 border-green-500/10' :
                            n.type === 'warning' ? 'bg-amber-500/5 border-amber-500/10' :
                            'bg-red-500/5 border-red-500/10'
                          )}
                        >
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                            n.type === 'success' ? 'bg-green-500/10' :
                            n.type === 'warning' ? 'bg-amber-500/10' : 'bg-red-500/10'
                          )}>
                            {n.type === 'success' ? <ArrowUpRight className="w-4 h-4 text-green-400" /> :
                             n.type === 'warning' ? <Activity className="w-4 h-4 text-amber-400" /> :
                             <ArrowDownRight className="w-4 h-4 text-red-400" />}
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
              </div>
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

              {/* Holdings Performance */}
              {analytics.isConnected && analytics.spotHoldings.length > 0 && (
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <SectionHeader title="Holdings" icon={PieIcon} />
                    <div className="space-y-2">
                      {analytics.spotHoldings
                        .sort((a, b) => b.usdValue - a.usdValue)
                        .map((holding) => (
                          <div key={holding.coin} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/20">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-bold text-primary">{holding.coin.slice(0, 2)}</span>
                              </div>
                              <div>
                                <p className="text-xs font-bold">{holding.coin}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {holding.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold">{fmt(holding.usdValue)}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {analytics.grandTotal > 0 ? ((holding.usdValue / analytics.grandTotal) * 100).toFixed(1) : '0'}%
                              </p>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </CardContent>
                </Card>
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
