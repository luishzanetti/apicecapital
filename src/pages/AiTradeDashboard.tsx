import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeveragedTrading } from '@/hooks/useLeveragedTrading';
import { ALTIS_STRATEGIES } from '@/constants/strategies';
import { CandlestickChart } from '@/components/altis/CandlestickChart';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, YAxis, Tooltip } from 'recharts';

// Strategy lookup from single source of truth
const S = Object.fromEntries(
  Object.entries(ALTIS_STRATEGIES).map(([k, v]) => [k, {
    l: v.shortLabel, i: v.icon, c: v.textClass, bg: v.bgClass, cc: v.chartColor,
  }])
) as Record<string, { l: string; i: string; c: string; bg: string; cc: string }>;

function fmt(v: number) { return Math.abs(v) >= 1e3 ? `$${(v / 1e3).toFixed(1)}K` : `$${v.toFixed(2)}`; }
function pc(v: number) { return v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-muted-foreground'; }
function sn(v: number) { return v >= 0 ? '+' : ''; }

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.35 } }),
};

function Skel() {
  return <div className="space-y-3 animate-pulse">{[1,2,3].map(i => <div key={i} className="glass-card rounded-xl p-4"><div className="h-4 bg-secondary/40 rounded w-1/3 mb-2"/><div className="h-16 bg-secondary/40 rounded"/></div>)}</div>;
}

// ═══════════════════════════════════════════════════════════════

export default function AiTradeDashboard() {
  const nav = useNavigate();
  const {
    bots, activeBot, setActiveBotId, removeBot,
    strategies, positions, risk, signals, performance,
    marketContext, pendingSignals, isEvaluating,
    totalCapital, totalUnrealizedPnl, totalFundingIncome, activeStrategies,
    isLoading, isSetupComplete, error: hookError,
    fetchAll, enableStrategy, disableStrategy, closePosition, closeAllPositions, triggerEvaluation,
  } = useLeveragedTrading();
  const [evalResult, setEvalResult] = useState<string | null>(null);

  const [tab, setTab] = useState<'overview' | 'positions' | 'timeline' | 'config'>('overview');
  const [closingId, setClosingId] = useState<string | null>(null);
  const [confirmCloseAll, setConfirmCloseAll] = useState(false);
  const [showAllBots, setShowAllBots] = useState(false);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Computed ───────────────────────────────────────────

  const realizedPnl = performance.reduce((s, p) => s + p.totalPnlUsd, 0);
  const totalPnl = totalUnrealizedPnl + realizedPnl;
  const totalPnlPct = totalCapital > 0 ? (totalPnl / totalCapital) * 100 : 0;

  const donut = useMemo(() => activeStrategies.map(s => ({
    name: S[s.strategyType]?.l || s.strategyType,
    value: s.allocationPct,
    color: S[s.strategyType]?.cc || '#6b7280',
  })), [activeStrategies]);

  // Real P&L from performance data — no projections from fake backtests
  const realizedTotal = performance.reduce((s, p) => s + p.totalPnlUsd, 0);

  // Real equity curve — only show with actual performance data
  const equityData = useMemo(() => {
    if (performance.length === 0) return [];
    let cum = totalCapital;
    return performance.map((p, i) => {
      cum += p.totalPnlUsd;
      return { day: i, value: Math.round(cum) };
    });
  }, [performance, totalCapital]);

  const chartPositive = equityData.length > 1 && equityData[equityData.length - 1].value >= equityData[0].value;

  // Timeline
  const timeline = useMemo(() => [
    ...signals.slice(0, 15).map(s => ({
      time: s.createdAt, icon: S[s.strategyType]?.i || '📡',
      title: `${s.direction.toUpperCase()} ${s.symbol.replace('USDT', '')}`,
      sub: `${S[s.strategyType]?.l} — Conv: ${s.conviction}`,
      status: s.wasExecuted ? 'executed' : s.riskApproved ? 'approved' : 'blocked',
      pnl: undefined as number | undefined,
    })),
    ...positions.map(p => ({
      time: p.openedAt, icon: p.side === 'long' ? '🟢' : '🔴',
      title: `${p.side.toUpperCase()} ${p.symbol.replace('USDT', '')} ${p.leverage}x`,
      sub: `Entry $${p.entryPrice.toLocaleString()} — ${fmt(p.sizeUsd)}`,
      status: 'open',
      pnl: p.unrealizedPnl,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()), [signals, positions]);

  // Live countdown
  // Last fetch timestamp for honest "last checked" display
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // ─── No setup ───────────────────────────────────────────

  if (!isSetupComplete && !isLoading) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[70vh] space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center"><span className="text-4xl">🤖</span></div>
        <h2 className="text-xl font-bold">ALTIS Trading Engine</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">5 automated strategies with active risk protection. Start with $50.</p>
        <div className="w-full max-w-sm grid grid-cols-5 gap-1.5">
          {Object.values(S).map(s => <div key={s.l} className="glass-light rounded-lg p-2 text-center"><span className="text-lg">{s.i}</span><p className="text-xs text-muted-foreground mt-0.5">{s.l}</p></div>)}
        </div>
        <button onClick={() => nav('/ai-trade/setup')} className="w-full max-w-sm py-3.5 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white active:scale-[0.98]">Set Up ALTIS</button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 pb-28">

      {/* ═══ AI VALUE PROP HERO ═══ */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20 p-5 mb-2">
        <h2 className="text-lg font-bold mb-1">AI-Powered Trading</h2>
        <p className="text-xs text-muted-foreground max-w-lg">
          Our AI analyzes market regime, fear &amp; greed, and technical indicators 24/7 to optimize your trading strategies automatically.
        </p>
      </div>

      {/* ═══ BOT SELECTOR + ALL BOTS VIEW ═══ */}
      {bots.length > 0 && (
        <div className="space-y-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {bots.map(b => (
              <button key={b.id} onClick={() => { setShowAllBots(false); setActiveBotId(b.id); }}
                className={`shrink-0 rounded-xl px-3 py-2 text-left border transition-all ${
                  !showAllBots && b.id === activeBot?.id ? 'glass-card border-primary/50 ring-1 ring-primary/20' : 'glass-light border-border/20 opacity-60'
                }`} style={{ minWidth: '130px' }}>
                <p className="text-xs font-semibold truncate">{b.name}</p>
                <p className="text-xs text-muted-foreground">{fmt(b.capital)} • {b.profile}</p>
              </button>
            ))}
            {bots.length > 1 && (
              <button onClick={() => setShowAllBots(!showAllBots)}
                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-medium border transition-all ${
                  showAllBots ? 'bg-primary/10 text-primary border-primary/30' : 'glass-light text-muted-foreground border-border/20'
                }`}>
                {showAllBots ? '✕ Close' : '📊 All Bots'}
              </button>
            )}
            <button onClick={() => nav('/ai-trade/setup?new=1')} className="shrink-0 rounded-xl px-4 py-2 flex items-center text-xs text-primary border border-dashed border-primary/30 hover:bg-primary/5">+ New</button>
          </div>

          {/* All Bots Overview Panel */}
          {showAllBots && bots.length > 1 && (() => {
            const totalCap = bots.reduce((s, b) => s + b.capital, 0);
            const totalStrats = bots.reduce((s, b) => s + b.strategies.filter(st => st.isActive).length, 0);
            const totalPos = positions.length; // Current bot only for now
            return (
              <motion.div className="glass-card rounded-2xl p-4 space-y-4" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-foreground">All Robots — Overview</h2>
                  <span className="text-xs text-muted-foreground">{bots.length} robots</span>
                </div>

                {/* Aggregated KPIs */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="glass-light rounded-lg p-2.5 text-center">
                    <p className="text-[8px] text-muted-foreground">Total Capital</p>
                    <p className="text-sm font-bold text-foreground">{fmt(totalCap)}</p>
                  </div>
                  <div className="glass-light rounded-lg p-2.5 text-center">
                    <p className="text-[8px] text-muted-foreground">Active Strategies</p>
                    <p className="text-sm font-bold text-foreground">{totalStrats}</p>
                  </div>
                  <div className="glass-light rounded-lg p-2.5 text-center">
                    <p className="text-[8px] text-muted-foreground">Robots</p>
                    <p className="text-sm font-bold text-foreground">{bots.length}</p>
                  </div>
                </div>

                {/* Per-bot breakdown */}
                <div className="space-y-2">
                  {bots.map(b => {
                    const botStrats = b.strategies.filter(s => s.isActive);
                    const allocBar = botStrats.map(s => ({
                      type: s.strategyType, pct: s.allocationPct, color: S[s.strategyType]?.cc || '#6b7280',
                    }));
                    return (
                      <button key={b.id} onClick={() => { setShowAllBots(false); setActiveBotId(b.id); }}
                        className="w-full text-left glass-light rounded-xl p-3 space-y-2 hover:bg-secondary/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-foreground">{b.name}</p>
                            <p className="text-xs text-muted-foreground">{b.profile} • {botStrats.length} strategies • Lev {b.maxLeverage || 5}x</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">{fmt(b.capital)}</p>
                            <p className="text-xs text-muted-foreground">Risk {b.riskPerTradePct || 33}%</p>
                          </div>
                        </div>
                        {/* Mini allocation bar */}
                        <div className="w-full bg-secondary/30 rounded-full h-1.5 flex overflow-hidden">
                          {allocBar.map((a, i) => (
                            <div key={i} style={{ width: `${a.pct}%`, backgroundColor: a.color }} className="h-1.5" />
                          ))}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {botStrats.map(s => (
                            <span key={s.strategyType} className="text-[8px] text-muted-foreground">
                              {S[s.strategyType]?.i} {s.allocationPct}%
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })()}
        </div>
      )}

      {/* ═══ HEADER ═══ */}
      <motion.div className="glass-card rounded-2xl p-4 space-y-3" initial="hidden" animate="visible" custom={0} variants={fadeUp}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{activeBot?.name || 'ALTIS'}</h1>
            <p className="text-xs text-muted-foreground">{activeStrategies.length} strategies • {activeBot?.profile} profile</p>
          </div>
          <button onClick={() => nav('/ai-trade/setup')} className="px-2.5 py-1 rounded-lg text-xs glass-light text-muted-foreground">Edit</button>
        </div>

        {/* Equity Curve + Donut + KPIs */}
        <div className="flex gap-3">
          {/* Mini equity chart */}
          <div className="flex-1 h-[72px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData} margin={{ top: 2, right: 2, left: 0, bottom: 2 }}>
                <defs>
                  <linearGradient id="altis-eq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={chartPositive ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis domain={['dataMin', 'dataMax']} hide />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '10px', fontSize: '11px' }}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, 'Value']} labelFormatter={() => ''} />
                <Area type="monotone" dataKey="value" stroke={chartPositive ? '#22c55e' : '#ef4444'} strokeWidth={2} fill="url(#altis-eq)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Donut */}
          {donut.length > 0 && (
            <div className="w-[72px] h-[72px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donut} cx="50%" cy="50%" innerRadius={22} outerRadius={34} paddingAngle={2} dataKey="value" stroke="none">
                    {donut.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <div className="glass-light rounded-lg p-2 text-center">
            <p className="text-[8px] text-muted-foreground">Capital</p>
            <p className="text-xs font-bold">{fmt(totalCapital)}</p>
          </div>
          <div className="glass-light rounded-lg p-2 text-center">
            <p className="text-[8px] text-muted-foreground">Total P&L</p>
            <p className={`text-xs font-bold ${pc(totalPnl)}`}>{sn(totalPnl)}{fmt(totalPnl)}</p>
            <p className={`text-[7px] ${pc(totalPnlPct)}`}>{sn(totalPnlPct)}{totalPnlPct.toFixed(1)}%</p>
          </div>
          <div className="glass-light rounded-lg p-2 text-center">
            <p className="text-[8px] text-muted-foreground">Funding</p>
            <p className="text-xs font-bold text-amber-400">+{fmt(totalFundingIncome)}</p>
          </div>
          <div className="glass-light rounded-lg p-2 text-center">
            <p className="text-[8px] text-muted-foreground">Positions</p>
            <p className="text-xs font-bold">{positions.length}</p>
          </div>
        </div>

        {/* Allocation legend */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeStrategies.map(s => (
            <span key={s.strategyType} className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className={`w-2 h-2 rounded-full ${S[s.strategyType]?.bg}`} />{S[s.strategyType]?.l} {s.allocationPct}%
            </span>
          ))}
        </div>
      </motion.div>

      {/* ═══ ERROR/STATUS BANNER ═══ */}
      {(hookError || evalResult) && (
        <div className={`rounded-xl p-3 text-xs ${hookError ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'}`}>
          <div className="flex items-center justify-between">
            <p className="font-medium">{hookError || evalResult}</p>
            <button onClick={() => { setEvalResult(null); }} className="text-muted-foreground ml-2">✕</button>
          </div>
        </div>
      )}

      {/* ═══ RISK ═══ */}
      <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}
        className={`rounded-xl p-3 border ${risk.circuitBreaker.isTripped ? 'bg-red-500/10 border-red-500/30' : risk.totalHeat >= 0.15 ? 'bg-amber-500/10 border-amber-500/30' : 'glass-card'}`}>
        <div className="flex items-center gap-2">
          <span>{risk.circuitBreaker.isTripped ? '🚨' : '🛡️'}</span>
          <span className="text-xs font-medium flex-1">{risk.circuitBreaker.isTripped ? 'CIRCUIT BREAKER' : 'Risk Active'}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${risk.canOpenNew ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {risk.canOpenNew ? 'Can trade' : 'Heat limit'}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-2 text-xs">
          <div><span className="text-muted-foreground block text-[8px]">Heat</span>{(risk.totalHeat * 100).toFixed(1)}%<span className="text-muted-foreground">/20%</span></div>
          <div><span className="text-muted-foreground block text-[8px]">Daily</span><span className={pc(risk.circuitBreaker.dailyPnlPct)}>{(risk.circuitBreaker.dailyPnlPct * 100).toFixed(2)}%</span><span className="text-muted-foreground">/−5%</span></div>
          <div><span className="text-muted-foreground block text-[8px]">Exposure</span>{fmt(risk.totalExposure)}</div>
          <div><span className="text-muted-foreground block text-[8px]">Open</span>{risk.positionCount}</div>
        </div>
      </motion.div>

      {/* ═══ TABS ═══ */}
      <div className="flex gap-1 bg-secondary/20 rounded-xl p-1">
        {(['overview', 'positions', 'timeline', 'config'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all ${tab === t ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'positions' ? `📋 (${positions.length})` : t === 'timeline' ? '⏱️ Live' : '⚙️ Config'}
          </button>
        ))}
      </div>

      {isLoading ? <Skel /> : <>

      {/* ═══ OVERVIEW ═══ */}
      {tab === 'overview' && (
        <motion.div className="space-y-3" initial="hidden" animate="visible" custom={2} variants={fadeUp}>

          {/* ═══ CANDLESTICK CHART ═══ */}
          <CandlestickChart
            symbol={positions.length > 0 ? positions[0].symbol : 'BTCUSDT'}
            height={280}
            positions={positions.map(p => ({
              side: p.side,
              entryPrice: p.entryPrice,
              takeProfitPrice: p.takeProfitPrice,
              stopLossPrice: p.stopLossPrice,
            }))}
          />

          {/* ═══ MARKET ANALYSIS ═══ */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Market Analysis</h3>
              <button onClick={async () => { setEvalResult(null); const r = await triggerEvaluation(); setEvalResult(r.executed > 0 ? `${r.executed} orders placed!` : r.pendingSignals.length > 0 ? `${r.pendingSignals.length} signals found` : r.marketContext ? `Market: ${r.marketContext.regime} — no signals` : hookError || 'Check console for details'); }} disabled={isEvaluating}
                className="text-xs text-primary font-medium disabled:opacity-50">
                {isEvaluating ? 'Analyzing...' : '↻ Refresh'}
              </button>
            </div>

            {marketContext ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <div className="glass-light rounded-lg p-2 text-center" title="Current market trend classification based on price action and momentum">
                    <p className="text-[8px] text-muted-foreground">Regime</p>
                    <p className={`text-xs font-bold ${
                      marketContext.regime === 'BULL' ? 'text-green-400' :
                      marketContext.regime === 'BEAR' ? 'text-red-400' :
                      marketContext.regime === 'CAPITULATION' ? 'text-red-500' : 'text-foreground'
                    }`}>{marketContext.regime}</p>
                    <p className="text-[7px] text-muted-foreground">{marketContext.confidence}% conf</p>
                  </div>
                  {marketContext.data['BTCUSDT'] && (
                    <>
                      <div className="glass-light rounded-lg p-2 text-center" title="Current Bitcoin price in USD">
                        <p className="text-[8px] text-muted-foreground">BTC</p>
                        <p className="text-xs font-bold">${marketContext.data['BTCUSDT'].price?.toLocaleString()}</p>
                      </div>
                      <div className="glass-light rounded-lg p-2 text-center" title="Relative Strength Index: below 30 = oversold (buy signal), above 70 = overbought (sell signal)">
                        <p className="text-[8px] text-muted-foreground">RSI</p>
                        <p className={`text-xs font-bold ${
                          marketContext.data['BTCUSDT'].rsi < 35 ? 'text-green-400' :
                          marketContext.data['BTCUSDT'].rsi > 65 ? 'text-red-400' : 'text-foreground'
                        }`}>{marketContext.data['BTCUSDT'].rsi?.toFixed(0)}</p>
                      </div>
                      <div className="glass-light rounded-lg p-2 text-center" title="Fear & Greed Index: 0-25 = extreme fear, 75-100 = extreme greed">
                        <p className="text-[8px] text-muted-foreground">Sentiment</p>
                        <p className={`text-xs font-bold ${
                          marketContext.data['BTCUSDT'].fg < 30 ? 'text-red-400' :
                          marketContext.data['BTCUSDT'].fg > 70 ? 'text-green-400' : 'text-foreground'
                        }`}>{marketContext.data['BTCUSDT'].fg}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Strategy status based on market */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Strategy conditions:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(marketContext.strategyStatus).map(([strat, status]) => (
                      <span key={strat} className={`text-xs px-2 py-0.5 rounded-full ${
                        status === 'optimal' || status === 'collecting' ? 'bg-green-500/15 text-green-400' :
                        status === 'active' || status === 'signal' ? 'bg-blue-500/15 text-blue-400' :
                        status === 'analyzing' ? 'bg-purple-500/15 text-purple-400' :
                        'bg-secondary/40 text-muted-foreground'
                      }`}>
                        {S[strat]?.i} {S[strat]?.l}: {status}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-3">
                <button onClick={async () => { setEvalResult(null); const r = await triggerEvaluation(); setEvalResult(r.executed > 0 ? `${r.executed} orders placed!` : r.pendingSignals.length > 0 ? `${r.pendingSignals.length} signals found` : r.marketContext ? `Market: ${r.marketContext.regime} — no signals` : hookError || 'Check console for details'); }} disabled={isEvaluating}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20 disabled:opacity-50">
                  {isEvaluating ? 'Analyzing market...' : 'Run Market Analysis'}
                </button>
                <p className="text-xs text-muted-foreground mt-2">Analyze current conditions and find trading opportunities</p>
              </div>
            )}
          </div>

          {/* ═══ PLANNED ENTRIES / PENDING SIGNALS ═══ */}
          {pendingSignals.length > 0 && (
            <div className="glass-card rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {pendingSignals.filter(s => s.approved).length > 0 ? 'Planned Entries' : 'Signals Detected'}
              </h3>
              {pendingSignals.map((sig, i) => (
                <div key={i} className={`rounded-xl p-3 border ${
                  sig.approved ? 'glass-card border-green-500/20' : 'glass-light border-border/20 opacity-60'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        sig.direction === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>{sig.direction.toUpperCase()} {sig.suggestedLeverage}x</span>
                      <span className="text-sm font-semibold">{sig.symbol.replace('USDT', '')}</span>
                      <span className="text-xs">{S[sig.strategyType]?.i}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold">{fmt(sig.suggestedSizeUsd)}</p>
                      <p className="text-xs text-muted-foreground">Conv: {sig.conviction}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs">
                    {sig.takeProfit && <span className="text-green-400">TP: ${sig.takeProfit.toLocaleString()}</span>}
                    {sig.stopLoss && <span className="text-red-400">SL: ${sig.stopLoss.toLocaleString()}</span>}
                    <span className={sig.approved ? 'text-green-400' : 'text-muted-foreground'}>
                      {sig.approved ? (activeBot?.autoExecute ? '✓ Auto-executing' : '◯ Awaiting') : '✗ Filtered'}
                    </span>
                  </div>
                  {sig.rationale && <p className="text-xs text-muted-foreground mt-1">{sig.rationale}</p>}
                </div>
              ))}
            </div>
          )}

          {/* If no signals and no market context, show prompt */}
          {pendingSignals.length === 0 && !marketContext && !isEvaluating && (
            <div className="glass-light rounded-xl p-4 text-center space-y-2">
              <span className="text-2xl">🔍</span>
              <p className="text-xs text-muted-foreground">No market analysis yet</p>
              <p className="text-xs text-muted-foreground">Run an analysis to detect trading opportunities based on current market conditions.</p>
            </div>
          )}

          {/* Strategy cards */}
          {Object.entries(S).map(([type, m]) => {
            const cfg = strategies.find(s => s.strategyType === type);
            if (!cfg?.isActive) return null;
            const cap = totalCapital * ((cfg.allocationPct || 0) / 100);
            const sp = performance.find(p => p.strategyType === type);
            const nPos = positions.filter(p => p.strategyType === type).length;
            return (
              <div key={type} className="glass-card rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><span>{m.i}</span><p className="text-sm font-medium">{m.l}</p></div>
                  <div className="text-right">
                    {sp ? <p className={`text-sm font-bold ${pc(sp.totalPnlUsd)}`}>{sn(sp.totalPnlUsd)}{fmt(sp.totalPnlUsd)}</p> : <p className="text-xs text-muted-foreground">—</p>}
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {[
                    { l: 'Capital', v: fmt(cap), tip: 'Amount allocated to this strategy' },
                    { l: 'Risk', v: fmt(cap * 0.02), tip: 'Maximum loss per trade (2% of capital)' },
                    { l: 'Lev', v: `${cfg.maxLeverage}x`, tip: 'Maximum leverage multiplier' },
                    { l: 'Open', v: `${nPos}`, tip: 'Currently open positions' },
                    { l: 'WR', v: sp?.winRate ? `${sp.winRate.toFixed(0)}%` : '—', tip: 'Percentage of profitable trades' },
                  ].map(({ l, v, tip }) => (
                    <div key={l} className="glass-light rounded p-1.5 text-center" title={tip}>
                      <p className="text-[7px] text-muted-foreground">{l}</p>
                      <p className="text-xs font-semibold">{v}</p>
                    </div>
                  ))}
                </div>
                {sp?.winRate != null && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      sp.winRate > 60 ? 'bg-green-500/15 text-green-400' :
                      sp.winRate >= 40 ? 'bg-amber-500/15 text-amber-400' :
                      'bg-red-500/15 text-red-400'
                    }`}>
                      {sp.winRate > 60 ? 'Strong' : sp.winRate >= 40 ? 'Moderate' : 'Review Strategy'}
                    </span>
                    <span className="text-[10px] text-muted-foreground" title="Win rate measures profitability of closed trades">
                      {sp.tradesClosed} trades closed
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Performance breakdown */}
          {performance.length > 0 && (
            <div className="glass-card rounded-xl p-3 space-y-2">
              <h3 className="text-xs text-muted-foreground uppercase tracking-wider">Performance</h3>
              {performance.sort((a, b) => b.totalPnlUsd - a.totalPnlUsd).map(p => {
                const maxP = Math.max(...performance.map(x => Math.abs(x.totalPnlUsd)), 1);
                const logW = maxP > 0 ? (Math.log10(Math.abs(p.totalPnlUsd) + 1) / Math.log10(maxP + 1)) * 100 : 0;
                const wins = Math.round(p.tradesClosed * p.winRate / 100);
                const losses = p.tradesClosed - wins;
                return (
                  <div key={p.strategyType} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${S[p.strategyType]?.bg}`} />{S[p.strategyType]?.l}</span>
                      <div className="flex items-center gap-2 text-xs">
                        {p.tradesClosed > 0 && <span className="text-muted-foreground">{wins}W {losses}L</span>}
                        <span className={pc(p.totalPnlUsd)}>{sn(p.totalPnlUsd)}{fmt(p.totalPnlUsd)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-secondary/30 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${p.totalPnlUsd >= 0 ? S[p.strategyType]?.bg || 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, logW)}%`, opacity: 0.7 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Risk limits summary */}
          <div className="glass-card rounded-xl p-3 space-y-2">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider">Risk Limits</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="glass-light rounded-lg p-2 text-center">
                <p className="text-[8px] text-muted-foreground">Max Risk/Trade</p>
                <p className="text-sm font-bold text-foreground">{fmt(totalCapital * (activeBot?.riskPerTradePct || 33) / 100)}</p>
                <p className="text-[7px] text-muted-foreground">{activeBot?.riskPerTradePct || 33}%</p>
              </div>
              <div className="glass-light rounded-lg p-2 text-center">
                <p className="text-[8px] text-muted-foreground">Circuit Breaker</p>
                <p className="text-sm font-bold text-red-400">-{fmt(totalCapital * 0.05)}</p>
                <p className="text-[7px] text-muted-foreground">-5% daily</p>
              </div>
              <div className="glass-light rounded-lg p-2 text-center">
                <p className="text-[8px] text-muted-foreground">Realized P&L</p>
                <p className={`text-sm font-bold ${pc(realizedTotal)}`}>{sn(realizedTotal)}{fmt(realizedTotal)}</p>
                <p className="text-[7px] text-muted-foreground">{performance.length > 0 ? 'live data' : 'no trades yet'}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ POSITIONS ═══ */}
      {tab === 'positions' && (
        <motion.div className="space-y-3" initial="hidden" animate="visible" custom={2} variants={fadeUp}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{positions.length} open</span>
            <div className="flex gap-2">
              {positions.length > 0 && (
                !confirmCloseAll ? (
                  <button onClick={() => setConfirmCloseAll(true)} className="text-xs text-red-400">Close All</button>
                ) : (
                  <div className="flex gap-1">
                    <button onClick={() => setConfirmCloseAll(false)} className="text-xs text-muted-foreground">Cancel</button>
                    <button onClick={async () => { await closeAllPositions(); setConfirmCloseAll(false); }}
                      className="text-xs text-red-400 font-bold bg-red-500/10 px-2 py-1 rounded-lg">Confirm Close {positions.length}</button>
                  </div>
                )
              )}
            </div>
          </div>

          {positions.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center space-y-3">
              <span className="text-3xl">📋</span>
              <p className="text-sm text-muted-foreground">No open positions</p>
              <p className="text-[10px] text-muted-foreground">Strategies evaluate when market conditions change.</p>
              <button onClick={async () => { setEvalResult(null); const r = await triggerEvaluation(); setEvalResult(r.executed > 0 ? `${r.executed} orders placed!` : r.pendingSignals.length > 0 ? `${r.pendingSignals.length} signals found` : r.marketContext ? `Market: ${r.marketContext.regime} — no signals` : hookError || 'Check console for details'); }} disabled={isEvaluating}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 disabled:opacity-50">
                {isEvaluating ? 'Analyzing...' : 'Run Analysis Now'}
              </button>
            </div>
          ) : (
            positions.map(pos => {
              const pp = pos.sizeUsd > 0 ? (pos.unrealizedPnl / pos.sizeUsd) * 100 : 0;
              const ld = pos.liquidationPrice && pos.markPrice ? Math.abs(pos.markPrice - pos.liquidationPrice) / pos.markPrice * 100 : null;
              return (
                <div key={pos.id} className="glass-card rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${pos.side === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {pos.side.toUpperCase()} {pos.leverage}x
                      </span>
                      <span className="text-sm font-semibold">{pos.symbol.replace('USDT', '')}</span>
                      <span className="text-xs">{S[pos.strategyType]?.i}</span>
                    </div>
                    <div className="text-right">
                      <p className={`text-base font-bold ${pc(pos.unrealizedPnl)}`}>{sn(pos.unrealizedPnl)}{fmt(pos.unrealizedPnl)}</p>
                      <p className={`text-xs ${pc(pp)}`}>{sn(pp)}{pp.toFixed(2)}%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { l: 'Entry', v: `$${pos.entryPrice.toLocaleString()}` },
                      { l: 'Mark', v: `$${pos.markPrice.toLocaleString()}` },
                      { l: 'Size', v: fmt(pos.sizeUsd) },
                      { l: 'Liq', v: ld ? `${ld.toFixed(1)}%` : '—', w: ld !== null && ld < 15 },
                    ].map(({ l, v, w }) => (
                      <div key={l} className="glass-light rounded p-1.5 text-center">
                        <p className="text-[7px] text-muted-foreground">{l}</p>
                        <p className={`text-xs font-medium ${w ? 'text-red-400' : ''}`}>{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-green-400">TP: {pos.takeProfitPrice ? `$${pos.takeProfitPrice.toLocaleString()}` : '—'}</span>
                    <span className="text-red-400">SL: {pos.stopLossPrice ? `$${pos.stopLossPrice.toLocaleString()}` : '—'}</span>
                    {pos.fundingReceived > 0 && <span className="text-amber-400">Fund: +{fmt(pos.fundingReceived)}</span>}
                    <button onClick={async () => { setClosingId(pos.id); await closePosition(pos.id); setClosingId(null); }}
                      disabled={closingId === pos.id} className="ml-auto text-red-400 font-semibold disabled:opacity-50">
                      {closingId === pos.id ? '...' : 'Close'}
                    </button>
                  </div>
                </div>
              );
            })
          )}

        </motion.div>
      )}

      {/* ═══ TIMELINE ═══ */}
      {tab === 'timeline' && (
        <motion.div className="space-y-3" initial="hidden" animate="visible" custom={2} variants={fadeUp}>
          {/* System status */}
          <div className="glass-card rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs text-muted-foreground uppercase tracking-wider">System</h3>
              <button onClick={async () => { setEvalResult(null); const r = await triggerEvaluation(); setLastChecked(new Date()); setEvalResult(r.executed > 0 ? `${r.executed} orders placed!` : r.marketContext ? `${r.marketContext.regime} — ${r.pendingSignals.length} signals` : hookError || 'No response'); }} disabled={isEvaluating}
                className="text-[10px] text-primary font-medium disabled:opacity-50">
                {isEvaluating ? 'Analyzing...' : 'Run Analysis'}
              </button>
            </div>
            {lastChecked && (
              <p className="text-[10px] text-muted-foreground">Last checked: {lastChecked.toLocaleTimeString()}</p>
            )}
            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              <div className="glass-light rounded-lg p-2 text-center">
                <span className="block text-muted-foreground">Signals</span>
                <span className="font-medium">{signals.length}</span>
              </div>
              <div className="glass-light rounded-lg p-2 text-center">
                <span className="block text-muted-foreground">Positions</span>
                <span className="font-medium">{positions.length}</span>
              </div>
              <div className="glass-light rounded-lg p-2 text-center">
                <span className="block text-muted-foreground">Heat</span>
                <span className="font-medium">{(risk.totalHeat * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Feed */}
          <div className="space-y-1.5">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider">Activity ({timeline.length})</h3>
            {timeline.length === 0 ? (
              <div className="glass-card rounded-xl p-6 text-center"><span className="text-2xl">⏱️</span><p className="text-sm text-muted-foreground mt-2">No activity yet</p></div>
            ) : (
              <div className="relative">
                <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border/30" />
                {timeline.slice(0, 20).map((ev, i) => (
                  <div key={i} className="flex gap-3 mb-1.5 relative">
                    <div className={`w-2.5 h-2.5 rounded-full mt-2 z-10 shrink-0 ml-[10px] ${
                      ev.status === 'executed' || ev.status === 'open' ? 'bg-green-500' : ev.status === 'approved' ? 'bg-blue-500' : 'bg-red-500/60'
                    }`} />
                    <div className="flex-1 glass-light rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{ev.icon} {ev.title}</span>
                        <div className="flex items-center gap-1.5">
                          {ev.pnl !== undefined && <span className={`text-xs font-bold ${pc(ev.pnl)}`}>{sn(ev.pnl)}{fmt(ev.pnl)}</span>}
                          <span className={`text-[8px] px-1 py-0.5 rounded-full ${
                            ev.status === 'executed' || ev.status === 'open' ? 'bg-green-500/20 text-green-400' :
                            ev.status === 'approved' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                          }`}>{ev.status}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{ev.sub}</p>
                      <p className="text-[8px] text-muted-foreground/50">{new Date(ev.time).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ═══ CONFIG ═══ */}
      {tab === 'config' && (
        <motion.div className="space-y-3" initial="hidden" animate="visible" custom={2} variants={fadeUp}>
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider">Strategies</h3>
          {Object.entries(S).map(([type, m]) => {
            const cfg = strategies.find(s => s.strategyType === type);
            const on = cfg?.isActive ?? false;
            const cap = totalCapital * ((cfg?.allocationPct || 0) / 100);
            return (
              <div key={type} className={`glass-card rounded-xl p-3 space-y-2 ${!on ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><span>{m.i}</span><p className="text-sm font-medium">{m.l}</p></div>
                  <button onClick={() => on ? disableStrategy(type) : enableStrategy(type, 20, 3)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${on ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-secondary/40 text-muted-foreground border border-border/30'}`}>
                    {on ? 'On' : 'Off'}
                  </button>
                </div>
                {on && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="glass-light rounded-lg p-2 text-center">
                      <p className="text-[8px] text-muted-foreground">Capital</p>
                      <p className="text-xs font-semibold">{fmt(cap)}<span className="text-muted-foreground text-[8px]"> ({cfg?.allocationPct}%)</span></p>
                    </div>
                    <div className="glass-light rounded-lg p-2 text-center">
                      <p className="text-[8px] text-muted-foreground">Risk/Trade</p>
                      <p className="text-xs font-semibold">{fmt(cap * 0.02)}</p>
                    </div>
                    <div className="glass-light rounded-lg p-2 text-center">
                      <p className="text-[8px] text-muted-foreground">Leverage</p>
                      <p className="text-xs font-semibold">{cfg?.maxLeverage || 2}x</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <h3 className="text-xs text-muted-foreground uppercase tracking-wider pt-2">Risk Protection</h3>
          <div className="glass-card rounded-xl p-3 space-y-1.5">
            {[
              { i: '🛡️', l: 'Heat Limit', v: '20%', d: 'Max capital at risk' },
              { i: '📊', l: 'Risk/Trade', v: '2%', d: 'Max loss per position' },
              { i: '⚡', l: 'Circuit Breaker', v: '-5%', d: 'Daily loss closes all', w: true },
              { i: '🚨', l: 'Capitulation', v: 'Auto', d: 'Extreme fear closes all' },
              { i: '💀', l: 'Liq Guard', v: '<5%', d: 'Force-close before liq' },
              { i: '🔗', l: 'Correlation', v: '>70%', d: 'Blocks duplicate exposure' },
            ].map(r => (
              <div key={r.l} className="flex items-center justify-between glass-light rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{r.i}</span>
                  <div><p className="text-xs">{r.l}</p><p className="text-xs text-muted-foreground">{r.d}</p></div>
                </div>
                <span className={`text-xs font-bold ${r.w ? 'text-red-400' : ''}`}>{r.v}</span>
              </div>
            ))}
          </div>

          {/* Bot management */}
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider pt-2">Robot</h3>
          <div className="glass-card rounded-xl p-3 space-y-2">
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Name</span><span className="font-medium">{activeBot?.name}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Profile</span><span className="font-medium">{activeBot?.profile}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Capital</span><span className="font-medium">{fmt(totalCapital)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Created</span><span className="font-medium">{activeBot?.createdAt ? new Date(activeBot.createdAt).toLocaleDateString() : '—'}</span></div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => nav('/ai-trade/setup')} className="flex-1 py-2 rounded-lg text-xs glass-light text-primary border border-primary/20">Reconfigure</button>
              {bots.length > 1 && activeBot && (
                <button onClick={() => { removeBot(activeBot.id); }} className="px-4 py-2 rounded-lg text-xs text-red-400 glass-light border border-red-500/20">Delete</button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      </>}

    </div>
  );
}
