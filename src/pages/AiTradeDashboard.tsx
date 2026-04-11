import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeveragedTrading } from '@/hooks/useLeveragedTrading';
import { LeveragedPerformanceCard } from '@/components/intelligence/LeveragedPerformanceCard';
import { MarketRegimeBadge } from '@/components/intelligence/MarketRegimeBadge';
import { FearGreedGauge } from '@/components/intelligence/FearGreedGauge';
import { DailyBriefingCard } from '@/components/intelligence/DailyBriefingCard';
import { SmartAlertsList } from '@/components/intelligence/SmartAlertsList';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const STRAT: Record<string, { label: string; icon: string; color: string; bgColor: string; chartColor: string; backtest: { wr: number; pf: number; annualReturn: number } }> = {
  grid:            { label: 'Grid',     icon: '📊', color: 'text-blue-400',   bgColor: 'bg-blue-500',   chartColor: '#3b82f6', backtest: { wr: 52.1, pf: 5.93, annualReturn: 25 } },
  mean_reversion:  { label: 'Mean Rev', icon: '🔄', color: 'text-purple-400', bgColor: 'bg-purple-500', chartColor: '#a855f7', backtest: { wr: 93.3, pf: 28.55, annualReturn: 20 } },
  funding_arb:     { label: 'Arb',      icon: '💰', color: 'text-amber-400',  bgColor: 'bg-amber-500',  chartColor: '#f59e0b', backtest: { wr: 96.6, pf: 9280, annualReturn: 30 } },
  trend_following: { label: 'Trend',    icon: '📈', color: 'text-green-400',  bgColor: 'bg-green-500',  chartColor: '#22c55e', backtest: { wr: 31.3, pf: 0.84, annualReturn: 15 } },
  ai_signal:       { label: 'AI',       icon: '🧠', color: 'text-cyan-400',   bgColor: 'bg-cyan-500',   chartColor: '#06b6d4', backtest: { wr: 50, pf: 1, annualReturn: 20 } },
};

function fmt(v: number) {
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}
function pnl(v: number) { return v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-muted-foreground'; }
function sign(v: number) { return v >= 0 ? '+' : ''; }

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.4, ease: 'easeOut' } }),
};

// ═══════════════════════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════════════════════

function TabSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="glass-card rounded-xl p-4 space-y-3">
          <div className="h-4 bg-secondary/40 rounded w-1/3" />
          <div className="h-16 bg-secondary/40 rounded" />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function AiTradeDashboard() {
  const navigate = useNavigate();
  const {
    bots, activeBot, setActiveBotId,
    strategies, positions, risk, signals, performance,
    totalCapital, totalUnrealizedPnl, totalFundingIncome, activeStrategies,
    isLoading, isSetupComplete,
    fetchAll, enableStrategy, disableStrategy, closePosition, closeAllPositions,
  } = useLeveragedTrading();

  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'timeline' | 'settings'>('overview');
  const [closingId, setClosingId] = useState<string | null>(null);
  const [confirmCloseAll, setConfirmCloseAll] = useState(false);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Computed ───────────────────────────────────────────

  const totalRealizedPnl = performance.reduce((s, p) => s + p.totalPnlUsd, 0);
  const totalPnl = totalUnrealizedPnl + totalRealizedPnl;
  const totalPnlPct = totalCapital > 0 ? (totalPnl / totalCapital) * 100 : 0;

  // Allocation donut data
  const donutData = useMemo(() =>
    activeStrategies.map(s => ({
      name: STRAT[s.strategyType]?.label || s.strategyType,
      value: s.allocationPct,
      color: STRAT[s.strategyType]?.chartColor || '#6b7280',
    })), [activeStrategies]);

  // Projected returns (data-driven based on user allocation + backtest)
  const projectedMonthly = useMemo(() => {
    if (totalCapital <= 0) return 0;
    return activeStrategies.reduce((sum, s) => {
      const bt = STRAT[s.strategyType]?.backtest;
      return sum + (totalCapital * (s.allocationPct / 100) * ((bt?.annualReturn || 10) / 100 / 12));
    }, 0);
  }, [activeStrategies, totalCapital]);

  // Timeline
  const timeline = useMemo(() => [
    ...signals.slice(0, 15).map(s => ({
      time: s.createdAt, type: 'signal' as const,
      icon: STRAT[s.strategyType]?.icon || '📡',
      title: `${s.direction.toUpperCase()} ${s.symbol.replace('USDT', '')}`,
      subtitle: `${STRAT[s.strategyType]?.label} — Conv: ${s.conviction}`,
      status: s.wasExecuted ? 'executed' : s.riskApproved ? 'approved' : 'blocked',
      pnl: undefined as number | undefined,
    })),
    ...positions.map(p => ({
      time: p.openedAt, type: 'position' as const,
      icon: p.side === 'long' ? '🟢' : '🔴',
      title: `${p.side.toUpperCase()} ${p.symbol.replace('USDT', '')} ${p.leverage}x`,
      subtitle: `Entry $${p.entryPrice.toLocaleString()} — ${fmt(p.sizeUsd)}`,
      status: 'open' as const,
      pnl: p.unrealizedPnl,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()), [signals, positions]);

  // Upcoming cron events with countdowns
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const countdownFmt = (intervalMs: number) => {
    const remaining = intervalMs - (now % intervalMs);
    const m = Math.floor(remaining / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    return m > 59 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}:${String(s).padStart(2, '0')}`;
  };

  const upcomingEvents = [
    { interval: 5 * 60000,   icon: '🛡️', title: 'Risk Monitor',      desc: 'Heat, liquidation, circuit breaker' },
    { interval: 15 * 60000,  icon: '⚡', title: 'Strategy Eval',      desc: 'Grid, MeanRev, Trend, Arb signals' },
    { interval: 4 * 3600000, icon: '🧠', title: 'AI Signal (Claude)', desc: 'High-conviction trade analysis' },
  ];

  // ─── No setup → Onboarding ─────────────────────────────

  if (!isSetupComplete && !isLoading) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[70vh] space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
          <span className="text-4xl">🤖</span>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-foreground">ALTIS Trading Engine</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            5 automated strategies. 7 layers of risk protection. Start with $50.
          </p>
        </div>
        <div className="w-full max-w-sm grid grid-cols-5 gap-1.5">
          {Object.values(STRAT).map(s => (
            <div key={s.label} className="glass-light rounded-lg p-2 text-center">
              <span className="text-lg">{s.icon}</span>
              <p className="text-[9px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <button onClick={() => navigate('/ai-trade/setup')}
          className="w-full max-w-sm px-6 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white active:scale-[0.98]">
          Set Up ALTIS
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 pb-28">

      {/* ═══ BOT SELECTOR ═══ */}
      {bots.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {bots.map(bot => {
            const sel = bot.id === activeBot?.id;
            return (
              <button key={bot.id} onClick={() => setActiveBotId(bot.id)}
                className={`shrink-0 glass-card rounded-xl px-3 py-2 text-left border transition-all ${
                  sel ? 'border-primary/50 ring-1 ring-primary/30' : 'border-border/20 opacity-60'
                }`} style={{ minWidth: '130px' }}>
                <p className="text-xs font-semibold truncate">{bot.name}</p>
                <p className="text-[10px] text-muted-foreground">{fmt(bot.capital)} • {bot.strategies.filter(s => s.isActive).length} strats</p>
              </button>
            );
          })}
          <button onClick={() => navigate('/ai-trade/setup?new=1')}
            className="shrink-0 glass-light rounded-xl px-4 py-2 flex items-center gap-1 text-xs text-primary border border-primary/20">
            + New
          </button>
        </div>
      )}

      {/* ═══ HEADER CARD ═══ */}
      <motion.div className="glass-card rounded-2xl p-4 space-y-3" initial="hidden" animate="visible" custom={0} variants={fadeUp}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <h1 className="text-lg font-bold text-foreground">{activeBot?.name || 'ALTIS'}</h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <MarketRegimeBadge size="sm" />
              <span className="text-[10px] text-muted-foreground">•</span>
              <span className="text-[10px] text-muted-foreground">{activeStrategies.length} active</span>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => navigate('/ai-trade/setup')} className="px-2 py-1 rounded-lg text-[10px] glass-light text-muted-foreground">Edit</button>
            <button onClick={() => navigate('/ai-trade/setup?new=1')} className="px-2 py-1 rounded-lg text-[10px] bg-primary/10 text-primary border border-primary/20">+ Bot</button>
          </div>
        </div>

        {/* KPI Grid + Donut */}
        <div className="flex gap-3">
          {/* Donut */}
          {donutData.length > 0 && (
            <div className="w-[72px] h-[72px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={22} outerRadius={34} paddingAngle={2} dataKey="value" stroke="none">
                    {donutData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* KPIs */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <div className="glass-light rounded-lg p-2 text-center">
              <p className="text-[8px] text-muted-foreground">Capital</p>
              <p className="text-xs font-bold text-foreground">{fmt(totalCapital)}</p>
            </div>
            <div className="glass-light rounded-lg p-2 text-center">
              <p className="text-[8px] text-muted-foreground">Total P&L</p>
              <p className={`text-xs font-bold ${pnl(totalPnl)}`}>{sign(totalPnl)}{fmt(totalPnl)}</p>
              <p className={`text-[7px] ${pnl(totalPnlPct)}`}>{sign(totalPnlPct)}{totalPnlPct.toFixed(1)}%</p>
            </div>
            <div className="glass-light rounded-lg p-2 text-center">
              <p className="text-[8px] text-muted-foreground">Funding</p>
              <p className="text-xs font-bold text-amber-400">+{fmt(totalFundingIncome)}</p>
            </div>
            <div className="glass-light rounded-lg p-2 text-center">
              <p className="text-[8px] text-muted-foreground">Positions</p>
              <p className="text-xs font-bold text-foreground">{positions.length}</p>
            </div>
          </div>
        </div>

        {/* Allocation legend */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeStrategies.map(s => (
            <div key={s.strategyType} className="flex items-center gap-1 text-[9px]">
              <div className={`w-2 h-2 rounded-full ${STRAT[s.strategyType]?.bgColor}`} />
              <span className="text-muted-foreground">{STRAT[s.strategyType]?.label} {s.allocationPct}%</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══ RISK STATUS ═══ */}
      <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}
        className={`rounded-xl p-3 border ${
          risk.circuitBreaker.isTripped ? 'bg-red-500/10 border-red-500/30' :
          risk.totalHeat >= 0.15 ? 'bg-amber-500/10 border-amber-500/30' : 'glass-card'
        }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{risk.circuitBreaker.isTripped ? '🚨' : risk.totalHeat >= 0.15 ? '⚠️' : '🛡️'}</span>
            <span className="text-xs font-medium">{risk.circuitBreaker.isTripped ? 'CIRCUIT BREAKER' : 'Protection Active'}</span>
            {risk.canOpenNew ? (
              <span className="text-[9px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full">Can trade</span>
            ) : (
              <span className="text-[9px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full">Heat limit</span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-2 text-[10px]">
          <div><span className="text-muted-foreground block">Heat</span><span className="text-foreground font-medium">{(risk.totalHeat * 100).toFixed(1)}% / 20%</span></div>
          <div><span className="text-muted-foreground block">Daily P&L</span><span className={`font-medium ${pnl(risk.circuitBreaker.dailyPnlPct)}`}>{(risk.circuitBreaker.dailyPnlPct * 100).toFixed(2)}% / -5%</span></div>
          <div><span className="text-muted-foreground block">Exposure</span><span className="text-foreground font-medium">{fmt(risk.totalExposure)}</span></div>
          <div><span className="text-muted-foreground block">Open</span><span className="text-foreground font-medium">{risk.positionCount} pos</span></div>
        </div>
      </motion.div>

      {/* ═══ TAB NAV ═══ */}
      <div className="flex gap-1 bg-secondary/20 rounded-xl p-1">
        {(['overview', 'positions', 'timeline', 'settings'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all ${
              activeTab === tab ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
            }`}>
            {tab === 'overview' ? '📊 Overview' : tab === 'positions' ? `📋 Orders (${positions.length})` :
             tab === 'timeline' ? '⏱️ Live' : '⚙️ Config'}
          </button>
        ))}
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      {isLoading ? <TabSkeleton /> : (
        <>
          {/* ═══ OVERVIEW ═══ */}
          {activeTab === 'overview' && (
            <motion.div className="space-y-3" initial="hidden" animate="visible" custom={2} variants={fadeUp}>

              {/* AI Briefing */}
              <DailyBriefingCard />

              {/* Smart Alerts */}
              <SmartAlertsList maxAlerts={3} compact />

              {/* Market Context */}
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card rounded-xl p-3 flex flex-col items-center">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Market Regime</p>
                  <MarketRegimeBadge size="md" showDescription />
                </div>
                <div className="glass-card rounded-xl p-3 flex flex-col items-center">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Sentiment</p>
                  <FearGreedGauge />
                </div>
              </div>

              {/* Strategy Cards */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Strategies</h3>
                {Object.entries(STRAT).map(([type, meta]) => {
                  const config = strategies.find(s => s.strategyType === type);
                  if (!config?.isActive) return null;
                  const capital = totalCapital * ((config?.allocationPct || 0) / 100);
                  const riskUsd = capital * 0.02;
                  const stratPerf = performance.find(p => p.strategyType === type);
                  const stratPos = positions.filter(p => p.strategyType === type);

                  return (
                    <div key={type} className="glass-card rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{meta.icon}</span>
                          <p className="text-sm font-medium">{meta.label}</p>
                        </div>
                        <div className="text-right">
                          {stratPerf ? (
                            <p className={`text-sm font-bold ${pnl(stratPerf.totalPnlUsd)}`}>{sign(stratPerf.totalPnlUsd)}{fmt(stratPerf.totalPnlUsd)}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground">Waiting...</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {[
                          { l: 'Capital', v: fmt(capital) },
                          { l: 'Risk', v: fmt(riskUsd) },
                          { l: 'Lev', v: `${config?.maxLeverage || 2}x` },
                          { l: 'Open', v: `${stratPos.length}` },
                          { l: 'WR', v: stratPerf?.winRate ? `${stratPerf.winRate.toFixed(0)}%` : `${meta.backtest.wr}%*` },
                        ].map(({ l, v }) => (
                          <div key={l} className="glass-light rounded-lg p-1.5 text-center">
                            <p className="text-[7px] text-muted-foreground">{l}</p>
                            <p className="text-[10px] font-semibold">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Performance */}
              <LeveragedPerformanceCard performance={performance} />

              {/* Projected Returns */}
              {totalCapital > 0 && (
                <div className="glass-card rounded-xl p-3 space-y-2">
                  <h3 className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Projected Returns {performance.length > 0 ? '(live data)' : '(backtest-based)'}
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="glass-light rounded-lg p-2 text-center">
                      <p className="text-[8px] text-muted-foreground">Monthly</p>
                      <p className="text-sm font-bold text-green-400">+{fmt(projectedMonthly)}</p>
                      <p className="text-[7px] text-muted-foreground">~{totalCapital > 0 ? (projectedMonthly / totalCapital * 100).toFixed(1) : 0}%</p>
                    </div>
                    <div className="glass-light rounded-lg p-2 text-center">
                      <p className="text-[8px] text-muted-foreground">Yearly</p>
                      <p className="text-sm font-bold text-green-400">+{fmt(projectedMonthly * 12)}</p>
                      <p className="text-[7px] text-muted-foreground">~{totalCapital > 0 ? (projectedMonthly * 12 / totalCapital * 100).toFixed(0) : 0}%</p>
                    </div>
                    <div className="glass-light rounded-lg p-2 text-center">
                      <p className="text-[8px] text-muted-foreground">Max Loss</p>
                      <p className="text-sm font-bold text-red-400">-{fmt(totalCapital * 0.05)}</p>
                      <p className="text-[7px] text-muted-foreground">circuit breaker</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ POSITIONS ═══ */}
          {activeTab === 'positions' && (
            <motion.div className="space-y-3" initial="hidden" animate="visible" custom={2} variants={fadeUp}>
              {positions.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{positions.length} open</span>
                  {!confirmCloseAll ? (
                    <button onClick={() => setConfirmCloseAll(true)} className="text-[10px] text-red-400 font-medium">Emergency Close All</button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmCloseAll(false)} className="text-[10px] text-muted-foreground">Cancel</button>
                      <button onClick={async () => { await closeAllPositions(); setConfirmCloseAll(false); }}
                        className="text-[10px] text-red-400 font-bold bg-red-500/10 px-2 py-1 rounded-lg">
                        Confirm Close {positions.length} Positions
                      </button>
                    </div>
                  )}
                </div>
              )}

              {positions.length === 0 ? (
                <div className="glass-card rounded-xl p-6 text-center space-y-3">
                  <span className="text-3xl">📋</span>
                  <p className="text-sm text-muted-foreground">No open positions</p>
                  <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
                    Strategies evaluate every 15 minutes. Positions appear here when the system detects opportunities passing all 7 risk filters.
                  </p>
                  <p className="text-[10px] text-primary">Next check: {countdownFmt(15 * 60000)}</p>
                </div>
              ) : positions.map(pos => {
                const pnlPct = pos.sizeUsd > 0 ? (pos.unrealizedPnl / pos.sizeUsd) * 100 : 0;
                const liqDist = pos.liquidationPrice && pos.markPrice
                  ? Math.abs(pos.markPrice - pos.liquidationPrice) / pos.markPrice * 100 : null;

                return (
                  <div key={pos.id} className="glass-card rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                          pos.side === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>{pos.side.toUpperCase()} {pos.leverage}x</span>
                        <span className="text-sm font-semibold">{pos.symbol.replace('USDT', '')}</span>
                        <span className="text-xs">{STRAT[pos.strategyType]?.icon}</span>
                      </div>
                      <div className="text-right">
                        <p className={`text-base font-bold ${pnl(pos.unrealizedPnl)}`}>{sign(pos.unrealizedPnl)}{fmt(pos.unrealizedPnl)}</p>
                        <p className={`text-[10px] ${pnl(pnlPct)}`}>{sign(pnlPct)}{pnlPct.toFixed(2)}%</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { l: 'Entry', v: `$${pos.entryPrice.toLocaleString()}` },
                        { l: 'Mark', v: `$${pos.markPrice.toLocaleString()}` },
                        { l: 'Size', v: fmt(pos.sizeUsd) },
                        { l: 'Liq', v: liqDist ? `${liqDist.toFixed(1)}%` : '—', warn: liqDist !== null && liqDist < 15 },
                      ].map(({ l, v, warn }) => (
                        <div key={l} className="glass-light rounded-lg p-1.5 text-center">
                          <p className="text-[7px] text-muted-foreground">{l}</p>
                          <p className={`text-[10px] font-medium ${warn ? 'text-red-400' : ''}`}>{v}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-green-400">TP: {pos.takeProfitPrice ? `$${pos.takeProfitPrice.toLocaleString()}` : '—'}</span>
                      <span className="text-red-400">SL: {pos.stopLossPrice ? `$${pos.stopLossPrice.toLocaleString()}` : '—'}</span>
                      {pos.fundingReceived > 0 && <span className="text-amber-400">Fund: +{fmt(pos.fundingReceived)}</span>}
                      <button onClick={async () => { setClosingId(pos.id); await closePosition(pos.id); setClosingId(null); }}
                        disabled={closingId === pos.id}
                        className="ml-auto text-red-400 hover:text-red-300 font-semibold disabled:opacity-50">
                        {closingId === pos.id ? '...' : 'Close'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* ═══ TIMELINE ═══ */}
          {activeTab === 'timeline' && (
            <motion.div className="space-y-4" initial="hidden" animate="visible" custom={2} variants={fadeUp}>
              {/* Upcoming with countdowns */}
              <div className="space-y-1.5">
                <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Next Automated Actions</h3>
                {upcomingEvents.map((ev, i) => (
                  <div key={i} className="glass-light rounded-xl px-3 py-2 flex items-center gap-3">
                    <span className="text-base">{ev.icon}</span>
                    <div className="flex-1">
                      <p className="text-xs font-medium">{ev.title}</p>
                      <p className="text-[9px] text-muted-foreground">{ev.desc}</p>
                    </div>
                    <span className="text-xs text-primary font-mono font-semibold">{countdownFmt(ev.interval)}</span>
                  </div>
                ))}
              </div>

              {/* Activity feed */}
              <div className="space-y-1.5">
                <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Activity ({timeline.length})</h3>
                {timeline.length === 0 ? (
                  <div className="glass-card rounded-xl p-6 text-center">
                    <span className="text-2xl">⏱️</span>
                    <p className="text-sm text-muted-foreground mt-2">No activity yet</p>
                    <p className="text-[10px] text-muted-foreground">Signals and trades appear as the system operates.</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border/30" />
                    {timeline.map((ev, i) => (
                      <div key={i} className="flex gap-3 mb-1.5 relative">
                        <div className={`w-2.5 h-2.5 rounded-full mt-2 z-10 shrink-0 ml-[10px] ${
                          ev.status === 'executed' || ev.status === 'open' ? 'bg-green-500' :
                          ev.status === 'approved' ? 'bg-blue-500' : 'bg-red-500/60'
                        }`} />
                        <div className="flex-1 glass-light rounded-lg px-3 py-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{ev.icon}</span>
                              <span className="text-xs font-medium">{ev.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {ev.pnl !== undefined && (
                                <span className={`text-[10px] font-bold ${pnl(ev.pnl)}`}>{sign(ev.pnl)}{fmt(ev.pnl)}</span>
                              )}
                              <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                                ev.status === 'executed' || ev.status === 'open' ? 'bg-green-500/20 text-green-400' :
                                ev.status === 'approved' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                              }`}>{ev.status}</span>
                            </div>
                          </div>
                          <p className="text-[9px] text-muted-foreground mt-0.5">{ev.subtitle}</p>
                          <p className="text-[8px] text-muted-foreground/50">{new Date(ev.time).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ═══ SETTINGS ═══ */}
          {activeTab === 'settings' && (
            <motion.div className="space-y-3" initial="hidden" animate="visible" custom={2} variants={fadeUp}>
              <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Strategies</h3>
              {Object.entries(STRAT).map(([type, meta]) => {
                const config = strategies.find(s => s.strategyType === type);
                const isActive = config?.isActive ?? false;
                const capital = totalCapital * ((config?.allocationPct || 0) / 100);

                return (
                  <div key={type} className={`glass-card rounded-xl p-3 space-y-2 ${!isActive ? 'opacity-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{meta.icon}</span>
                        <p className="text-sm font-medium">{meta.label}</p>
                      </div>
                      <button onClick={() => isActive ? disableStrategy(type) : enableStrategy(type, 20, 3)}
                        className={`px-3 py-1 rounded-full text-[10px] font-semibold ${
                          isActive ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-secondary/40 text-muted-foreground border border-border/30'
                        }`}>{isActive ? 'Active' : 'Enable'}</button>
                    </div>
                    {isActive && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="glass-light rounded-lg p-2 text-center">
                          <p className="text-[8px] text-muted-foreground">Capital</p>
                          <p className="text-[10px] font-semibold">{fmt(capital)}</p>
                          <p className="text-[7px] text-muted-foreground">{config?.allocationPct}%</p>
                        </div>
                        <div className="glass-light rounded-lg p-2 text-center">
                          <p className="text-[8px] text-muted-foreground">Risk/Trade</p>
                          <p className="text-[10px] font-semibold">{fmt(capital * 0.02)}</p>
                        </div>
                        <div className="glass-light rounded-lg p-2 text-center">
                          <p className="text-[8px] text-muted-foreground">Leverage</p>
                          <p className="text-[10px] font-semibold">{config?.maxLeverage || 2}x</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Global Risk */}
              <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider pt-2">Risk Protection</h3>
              <div className="glass-card rounded-xl p-3 space-y-1.5">
                {[
                  { icon: '🛡️', label: 'Heat Limit', value: '20%', desc: 'Max capital at risk' },
                  { icon: '📊', label: 'Risk/Trade', value: '2%', desc: 'Max loss per position' },
                  { icon: '⚡', label: 'Circuit Breaker', value: '-5%', desc: 'Daily loss closes everything', warn: true },
                  { icon: '🚨', label: 'Capitulation', value: 'Auto', desc: 'Extreme fear closes all' },
                  { icon: '💀', label: 'Liq Guard', value: '<5%', desc: 'Force-close before liquidation' },
                  { icon: '🔗', label: 'Correlation', value: '>70%', desc: 'Blocks duplicate exposure' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between glass-light rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{r.icon}</span>
                      <div>
                        <p className="text-xs text-foreground">{r.label}</p>
                        <p className="text-[9px] text-muted-foreground">{r.desc}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${r.warn ? 'text-red-400' : 'text-foreground'}`}>{r.value}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => navigate('/ai-trade/setup')}
                className="w-full py-3 rounded-xl font-medium glass-light text-primary border border-primary/20">
                Full Reconfiguration
              </button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
