import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeveragedTrading } from '@/hooks/useLeveragedTrading';
import { ALTIS_STRATEGIES } from '@/constants/strategies';
import { CandlestickChart } from '@/components/altis/CandlestickChart';
import { motion } from 'framer-motion';

// ─── Strategy lookup ────────────────────────────────────────

const ST = ALTIS_STRATEGIES;
type SType = keyof typeof ST;

function fmt(v: number) { return Math.abs(v) >= 1e3 ? `$${(v / 1e3).toFixed(1)}K` : `$${v.toFixed(2)}`; }
function pc(v: number) { return v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-muted-foreground'; }
function sn(v: number) { return v >= 0 ? '+' : ''; }

const fade = { hidden: { opacity: 0, y: 8 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.3 } }) };

// What is this strategy DOING right now? (plain English)
function getStatus(type: string, regime: string | undefined, hasPos: boolean): string {
  if (!regime) return 'Waiting for market analysis...';
  const r = regime.toUpperCase();
  switch (type) {
    case 'grid': return r === 'SIDEWAYS' ? '🟢 Optimal — placing grid orders' : `⏸️ Waiting for sideways market`;
    case 'mean_reversion': return hasPos ? '🟢 Position open — monitoring exit' : '👁️ Scanning RSI for oversold/overbought';
    case 'funding_arb': return '💰 Collecting funding every 8h';
    case 'trend_following': return r === 'BULL' ? '🟢 Following uptrend (LONG)' : r === 'BEAR' ? '🔴 Following downtrend (SHORT)' : `⏸️ Waiting for trend`;
    case 'ai_signal': return '🧠 AI analyzing every 4h';
    default: return 'Active';
  }
}

// ═══════════════════════════════════════════════════════════════

export default function AiTradeDashboard() {
  const nav = useNavigate();
  const {
    bots, activeBot, setActiveBotId,
    strategies, positions, risk, signals, performance,
    marketContext, pendingSignals, isEvaluating,
    totalCapital, totalUnrealizedPnl, activeStrategies,
    isLoading, isSetupComplete, error: hookError,
    fetchAll, enableStrategy, disableStrategy, closePosition, closeAllPositions, triggerEvaluation,
  } = useLeveragedTrading();

  const [tab, setTab] = useState<'strategies' | 'trades' | 'activity'>('strategies');
  const [closingId, setClosingId] = useState<string | null>(null);
  const [confirmCloseAll, setConfirmCloseAll] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const totalPnl = totalUnrealizedPnl + performance.reduce((s, p) => s + p.totalPnlUsd, 0);
  const totalPnlPct = totalCapital > 0 ? (totalPnl / totalCapital) * 100 : 0;
  const regime = marketContext?.regime;

  const analyze = async () => {
    setStatus(null);
    const r = await triggerEvaluation();
    setStatus(
      r.executed > 0 ? `✅ ${r.executed} trades opened` :
      r.pendingSignals.length > 0 ? `📡 ${r.pendingSignals.filter(s => s.approved).length} opportunities found` :
      r.marketContext ? `${r.marketContext.regime} market — no opportunities now` :
      hookError || 'Could not connect'
    );
  };

  // ─── Empty state ───────────────────────────────────────

  if (!isSetupComplete && !isLoading) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[70vh] space-y-5">
        <span className="text-5xl">🤖</span>
        <h2 className="text-xl font-bold">ALTIS Trading</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Automated strategies with risk protection. Set your capital and let the system trade.
        </p>
        <button onClick={() => nav('/ai-trade/setup')}
          className="w-full max-w-xs py-3.5 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white active:scale-[0.98]">
          Get Started
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 pb-28">

      {/* ═══ HEADER ═══ */}
      <motion.div className="glass-card rounded-2xl p-4" initial="hidden" animate="visible" custom={0} variants={fade}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold">{activeBot?.name || 'ALTIS'}</h1>
            <p className="text-[10px] text-muted-foreground">
              {activeStrategies.length} strategies{regime ? ` • ${regime} market` : ''}
            </p>
          </div>
          <div className="flex gap-1.5">
            {bots.length > 1 && (
              <select value={activeBot?.id || ''} onChange={e => setActiveBotId(e.target.value)}
                className="bg-secondary/30 border border-border/30 rounded-lg px-2 py-1 text-[10px] text-foreground">
                {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
            <button onClick={() => nav('/ai-trade/setup')} className="px-2 py-1 rounded-lg text-[10px] glass-light text-muted-foreground">Edit</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="glass-light rounded-xl p-3 text-center">
            <p className="text-[9px] text-muted-foreground">Capital</p>
            <p className="text-base font-bold">{fmt(totalCapital)}</p>
          </div>
          <div className="glass-light rounded-xl p-3 text-center">
            <p className="text-[9px] text-muted-foreground">P&L</p>
            <p className={`text-base font-bold ${pc(totalPnl)}`}>{sn(totalPnl)}{fmt(totalPnl)}</p>
            {totalPnlPct !== 0 && <p className={`text-[8px] ${pc(totalPnlPct)}`}>{sn(totalPnlPct)}{totalPnlPct.toFixed(1)}%</p>}
          </div>
          <div className="glass-light rounded-xl p-3 text-center">
            <p className="text-[9px] text-muted-foreground">Trades</p>
            <p className="text-base font-bold">{positions.length}</p>
          </div>
        </div>

        {/* Risk — one line, clear */}
        <div className="mt-3 flex items-center gap-2 text-[10px]">
          <span className="text-muted-foreground">Risk used:</span>
          <div className="flex-1 bg-secondary/30 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${risk.totalHeat >= 0.15 ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(100, risk.totalHeat / 0.2 * 100)}%` }} />
          </div>
          <span className={risk.totalHeat >= 0.15 ? 'text-red-400' : 'text-muted-foreground'}>
            {(risk.totalHeat * 100).toFixed(0)}% / 20%
          </span>
        </div>
      </motion.div>

      {/* ═══ STATUS ═══ */}
      {(hookError || status) && (
        <div className={`rounded-xl p-2.5 text-xs flex items-center justify-between ${hookError ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
          <p>{hookError || status}</p>
          <button onClick={() => setStatus(null)} className="text-muted-foreground">✕</button>
        </div>
      )}

      {/* ═══ CHART ═══ */}
      <CandlestickChart
        symbol={positions.length > 0 ? positions[0].symbol : 'BTCUSDT'}
        height={220}
        positions={positions.map(p => ({ side: p.side, entryPrice: p.entryPrice, takeProfitPrice: p.takeProfitPrice, stopLossPrice: p.stopLossPrice }))}
      />

      {/* ═══ ANALYZE ═══ */}
      <button onClick={analyze} disabled={isEvaluating}
        className="w-full py-2.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 active:scale-[0.98] disabled:opacity-50">
        {isEvaluating ? 'Analyzing...' : '🔍 Analyze Market & Find Trades'}
      </button>

      {/* ═══ UPCOMING TRADES ═══ */}
      {pendingSignals.filter(s => s.approved).length > 0 && (
        <div className="space-y-1.5">
          <h3 className="text-[10px] text-muted-foreground uppercase tracking-wider">Upcoming</h3>
          {pendingSignals.filter(s => s.approved).map((sig, i) => (
            <div key={i} className="glass-card rounded-xl p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${sig.direction === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {sig.direction.toUpperCase()}
                </span>
                <span className="text-xs font-semibold">{sig.symbol.replace('USDT', '')}</span>
              </div>
              <span className="text-[9px] text-muted-foreground">{ST[sig.strategyType as SType]?.shortLabel} • {sig.conviction}%</span>
            </div>
          ))}
        </div>
      )}

      {/* ═══ TABS ═══ */}
      <div className="flex gap-1 bg-secondary/20 rounded-xl p-1">
        {([
          { k: 'strategies' as const, l: `Strategies (${activeStrategies.length})` },
          { k: 'trades' as const, l: `Trades (${positions.length})` },
          { k: 'activity' as const, l: 'Activity' },
        ]).map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`flex-1 py-2 rounded-lg text-[11px] font-medium ${tab === t.k ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ═══ STRATEGIES TAB ═══ */}
      {tab === 'strategies' && (
        <motion.div className="space-y-2" initial="hidden" animate="visible" custom={2} variants={fade}>
          {Object.entries(ST).map(([type, m]) => {
            const cfg = strategies.find(s => s.strategyType === type);
            const on = cfg?.isActive ?? false;
            if (!on) return null;
            const cap = totalCapital * ((cfg?.allocationPct || 0) / 100);
            const sp = performance.find(p => p.strategyType === type);
            const nPos = positions.filter(p => p.strategyType === type).length;

            return (
              <div key={type} className="glass-card rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{m.icon}</span>
                    <div>
                      <p className="text-sm font-semibold">{m.label}</p>
                      <p className="text-[10px] text-muted-foreground">{m.description}</p>
                    </div>
                  </div>
                  {sp && <p className={`text-sm font-bold ${pc(sp.totalPnlUsd)}`}>{sn(sp.totalPnlUsd)}{fmt(sp.totalPnlUsd)}</p>}
                </div>

                {/* Status — what it's doing RIGHT NOW */}
                <p className="text-[10px] glass-light rounded-lg px-3 py-1.5">{getStatus(type, regime, nPos > 0)}</p>

                {/* Key numbers */}
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <span>Capital: <b className="text-foreground">{fmt(cap)}</b></span>
                  <span>Lev: <b className="text-foreground">{cfg?.maxLeverage}x</b></span>
                  {nPos > 0 && <span>Open: <b className="text-foreground">{nPos}</b></span>}
                  {sp?.winRate ? <span>WR: <b className="text-foreground">{sp.winRate.toFixed(0)}%</b></span> : null}
                </div>
              </div>
            );
          })}

          {/* Inactive — compact */}
          {(() => {
            const inactive = Object.entries(ST).filter(([type]) => !strategies.find(s => s.strategyType === type)?.isActive);
            if (inactive.length === 0) return null;
            return (
              <div className="flex gap-2 flex-wrap">
                {inactive.map(([type, m]) => (
                  <button key={type} onClick={() => enableStrategy(type, 20, m.maxLeverage)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] glass-light text-muted-foreground hover:text-foreground">
                    {m.icon} {m.shortLabel}
                  </button>
                ))}
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* ═══ TRADES TAB ═══ */}
      {tab === 'trades' && (
        <motion.div className="space-y-2" initial="hidden" animate="visible" custom={2} variants={fade}>
          {positions.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{positions.length} open</span>
              {!confirmCloseAll ? (
                <button onClick={() => setConfirmCloseAll(true)} className="text-[10px] text-red-400">Close All</button>
              ) : (
                <div className="flex gap-1">
                  <button onClick={() => setConfirmCloseAll(false)} className="text-[10px] text-muted-foreground">Cancel</button>
                  <button onClick={async () => { await closeAllPositions(); setConfirmCloseAll(false); }}
                    className="text-[10px] text-red-400 font-bold bg-red-500/10 px-2 py-1 rounded-lg">Confirm</button>
                </div>
              )}
            </div>
          )}

          {positions.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center space-y-2">
              <span className="text-3xl">📋</span>
              <p className="text-sm text-muted-foreground">No open trades</p>
              <p className="text-[10px] text-muted-foreground">Click "Analyze Market" to find opportunities.</p>
            </div>
          ) : positions.map(pos => {
            const pp = pos.sizeUsd > 0 ? (pos.unrealizedPnl / pos.sizeUsd) * 100 : 0;
            const ld = pos.liquidationPrice && pos.markPrice ? Math.abs(pos.markPrice - pos.liquidationPrice) / pos.markPrice * 100 : null;

            return (
              <div key={pos.id} className="glass-card rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${pos.side === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {pos.side.toUpperCase()} {pos.leverage}x
                    </span>
                    <span className="text-sm font-semibold">{pos.symbol.replace('USDT', '')}</span>
                    <span className="text-[10px] text-muted-foreground">{ST[pos.strategyType as SType]?.icon}</span>
                  </div>
                  <div className="text-right">
                    <p className={`text-base font-bold ${pc(pos.unrealizedPnl)}`}>{sn(pos.unrealizedPnl)}{fmt(pos.unrealizedPnl)}</p>
                    <p className={`text-[10px] ${pc(pp)}`}>{sn(pp)}{pp.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { l: 'Entry', v: `$${pos.entryPrice.toLocaleString()}` },
                    { l: 'Now', v: `$${pos.markPrice.toLocaleString()}` },
                    { l: 'Size', v: fmt(pos.sizeUsd) },
                    { l: 'Liq', v: ld ? `${ld.toFixed(0)}%` : '—', w: ld !== null && ld < 15 },
                  ].map(({ l, v, w }) => (
                    <div key={l} className="glass-light rounded p-1.5 text-center">
                      <p className="text-[7px] text-muted-foreground">{l}</p>
                      <p className={`text-[10px] ${w ? 'text-red-400 font-bold' : ''}`}>{v}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  {pos.takeProfitPrice && <span className="text-green-400">TP ${pos.takeProfitPrice.toLocaleString()}</span>}
                  {pos.stopLossPrice && <span className="text-red-400">SL ${pos.stopLossPrice.toLocaleString()}</span>}
                  <button onClick={async () => { setClosingId(pos.id); await closePosition(pos.id); setClosingId(null); }}
                    disabled={closingId === pos.id} className="ml-auto text-red-400 font-semibold disabled:opacity-50">
                    {closingId === pos.id ? '...' : 'Close'}
                  </button>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* ═══ ACTIVITY TAB ═══ */}
      {tab === 'activity' && (
        <motion.div className="space-y-1.5" initial="hidden" animate="visible" custom={2} variants={fade}>
          {signals.length === 0 ? (
            <div className="glass-card rounded-xl p-6 text-center">
              <span className="text-2xl">📡</span>
              <p className="text-sm text-muted-foreground mt-2">No activity yet</p>
            </div>
          ) : signals.slice(0, 25).map(sig => (
            <div key={sig.id} className="glass-light rounded-xl px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{ST[sig.strategyType as SType]?.icon || '📡'}</span>
                  <span className={`text-xs font-medium ${sig.direction === 'long' ? 'text-green-400' : sig.direction === 'short' ? 'text-red-400' : ''}`}>
                    {sig.direction.toUpperCase()} {sig.symbol.replace('USDT', '')}
                  </span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                  sig.wasExecuted ? 'bg-green-500/20 text-green-400' :
                  sig.riskApproved ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                }`}>{sig.wasExecuted ? 'Traded' : sig.riskApproved ? 'Ready' : 'Filtered'}</span>
              </div>
              {sig.rationale && <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{sig.rationale}</p>}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
