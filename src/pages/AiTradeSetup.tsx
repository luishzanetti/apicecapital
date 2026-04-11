import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeveragedTrading } from '@/hooks/useLeveragedTrading';
import { useExchangeBalance } from '@/hooks/useExchangeBalance';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════
// STRATEGY DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const STRATEGIES = [
  {
    type: 'grid', label: 'Grid Trading', icon: '📊',
    desc: 'Captures profit from price bouncing in a range',
    longDesc: 'Places buy orders below and sell orders above current price. When price oscillates, each bounce generates profit. Works best in sideways markets which occur 49% of the time.',
    minCapital: 50, riskPerTrade: 2, maxLeverage: 3,
    backtest: { pf: 5.93, wr: 52.1, trades: 576, regime: 'SIDEWAYS' },
    riskLevel: 'low' as const,
  },
  {
    type: 'mean_reversion', label: 'Mean Reversion', icon: '🔄',
    desc: 'Buys oversold, sells overbought using RSI',
    longDesc: 'When RSI drops below 35, the asset is oversold — historically bounces back 93% of the time. Tight 3% stop-loss limits downside. Best risk-reward ratio in the system.',
    minCapital: 30, riskPerTrade: 2, maxLeverage: 2,
    backtest: { pf: 28.55, wr: 93.3, trades: 30, regime: 'ANY' },
    riskLevel: 'low' as const,
  },
  {
    type: 'funding_arb', label: 'Funding Rate Arb', icon: '💰',
    desc: 'Delta-neutral yield — zero market risk',
    longDesc: 'Long spot + short perpetual = zero net exposure. Collects funding rate payments 3x/day. Like a savings account but with crypto yields. Completely market-neutral.',
    minCapital: 200, riskPerTrade: 0, maxLeverage: 1,
    backtest: { pf: 9280, wr: 96.6, trades: 59, regime: 'Funding > 0.01%' },
    riskLevel: 'minimal' as const,
  },
  {
    type: 'trend_following', label: 'Trend Following', icon: '📈',
    desc: 'Rides momentum with SMA crossovers',
    longDesc: 'Detects trend direction using moving average crossovers. Goes long in uptrends, short in downtrends. Captures big moves but has lower win rate — few big wins compensate many small losses.',
    minCapital: 30, riskPerTrade: 3, maxLeverage: 3,
    backtest: { pf: 0.84, wr: 31.3, trades: 16, regime: 'BULL/BEAR' },
    riskLevel: 'medium' as const,
  },
  {
    type: 'ai_signal', label: 'AI Signal (Claude)', icon: '🧠',
    desc: 'AI analyzes market every 4h for high-conviction plays',
    longDesc: 'Claude AI receives full market context (regime, RSI, SMA, funding, positions) and generates trading signals. Only acts on conviction ≥70%. Uses Haiku for speed, Sonnet for daily deep analysis.',
    minCapital: 20, riskPerTrade: 2, maxLeverage: 5,
    backtest: { pf: null, wr: null, trades: null, regime: 'Always' },
    riskLevel: 'variable' as const,
  },
];

// ═══════════════════════════════════════════════════════════════
// RISK PROFILES + AI RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════

const RISK_PROFILES = {
  conservative: {
    label: 'Conservative', icon: '🛡️', desc: 'Steady income, lower risk. Focus on proven strategies.',
    maxLeverage: 2, color: 'blue',
    defaults: { grid: 40, mean_reversion: 25, funding_arb: 30, trend_following: 0, ai_signal: 5 },
  },
  balanced: {
    label: 'Balanced', icon: '⚖️', desc: 'Mix of income + directional plays. Best diversification.',
    maxLeverage: 3, color: 'purple',
    defaults: { grid: 30, mean_reversion: 20, funding_arb: 20, trend_following: 20, ai_signal: 10 },
  },
  growth: {
    label: 'Growth', icon: '🚀', desc: 'Higher risk for higher reward. More directional exposure.',
    maxLeverage: 5, color: 'amber',
    defaults: { grid: 20, mean_reversion: 15, funding_arb: 15, trend_following: 30, ai_signal: 20 },
  },
};

function getAIRecommendation(capital: number, profile: string) {
  // AI recommendation based on backtest results + capital
  if (capital < 100) {
    return {
      text: 'With less than $100, focus on Mean Reversion (93% win rate). Single strategy, maximum efficiency.',
      highlight: 'mean_reversion',
      suggested: { grid: 0, mean_reversion: 70, funding_arb: 0, trend_following: 0, ai_signal: 30 },
    };
  }
  if (capital < 500) {
    return {
      text: 'Best combo for your capital: Mean Reversion + Grid Trading. Both validated with strong profit factors.',
      highlight: 'mean_reversion',
      suggested: { grid: 40, mean_reversion: 40, funding_arb: 0, trend_following: 0, ai_signal: 20 },
    };
  }
  if (capital < 2000) {
    return {
      text: 'Add Funding Arb for risk-free yield alongside Grid and Mean Rev. 3 strategies = optimal diversification.',
      highlight: 'funding_arb',
      suggested: { grid: 35, mean_reversion: 25, funding_arb: 25, trend_following: 0, ai_signal: 15 },
    };
  }
  return {
    text: 'Full 5-strategy deployment. Maximum diversification across all market regimes.',
    highlight: null,
    suggested: RISK_PROFILES[profile as keyof typeof RISK_PROFILES]?.defaults || RISK_PROFILES.balanced.defaults,
  };
}

function getTierInfo(capital: number) {
  if (capital >= 5000) return { name: 'Full', emoji: '👑', maxStrats: 5, color: 'text-green-400 bg-green-500/20' };
  if (capital >= 2000) return { name: 'Standard', emoji: '⭐', maxStrats: 5, color: 'text-blue-400 bg-blue-500/20' };
  if (capital >= 500)  return { name: 'Starter', emoji: '🌱', maxStrats: 3, color: 'text-purple-400 bg-purple-500/20' };
  if (capital >= 100)  return { name: 'Micro', emoji: '🔬', maxStrats: 2, color: 'text-amber-400 bg-amber-500/20' };
  return { name: 'Nano', emoji: '⚡', maxStrats: 1, color: 'text-muted-foreground bg-secondary/40' };
}

const RISK_COLORS = { minimal: 'text-green-400', low: 'text-blue-400', medium: 'text-amber-400', variable: 'text-purple-400' };

function formatUsd(v: number) {
  if (v >= 10000) return `$${(v / 1000).toFixed(1)}K`;
  return `$${v.toLocaleString()}`;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function AiTradeSetup() {
  const navigate = useNavigate();
  const { enableStrategy, setTotalCapital: saveTotalCapital, addBot, bots } = useLeveragedTrading();
  const { data: balanceData, status: balanceStatus } = useExchangeBalance();

  const [step, setStep] = useState(0);
  const [capitalMode, setCapitalMode] = useState<'auto' | 'custom'>('auto');
  const [customCapital, setCustomCapital] = useState(5000);
  const [profile, setProfile] = useState<keyof typeof RISK_PROFILES | null>(null);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);
  const [robotName, setRobotName] = useState('ALTIS Bot #1');
  const [isActivating, setIsActivating] = useState(false);

  // Detect available balance
  const unifiedBalance = balanceData?.totalAvailableBalance || 0;
  const totalCapital = capitalMode === 'auto' ? unifiedBalance : customCapital;
  const hasBalance = balanceStatus === 'connected' && unifiedBalance > 0;
  const isEditingExisting = bots.length > 0;

  // Auto-set capital mode based on balance detection
  useEffect(() => {
    if (hasBalance && capitalMode === 'auto') {
      setCustomCapital(Math.floor(unifiedBalance));
    }
  }, [hasBalance, unifiedBalance, capitalMode]);

  const tier = getTierInfo(totalCapital);
  const aiRec = useMemo(() => getAIRecommendation(totalCapital, profile || 'balanced'), [totalCapital, profile]);

  const strategyDetails = useMemo(() => {
    return STRATEGIES.map(s => {
      const allocPct = allocations[s.type] || 0;
      const capital = totalCapital * (allocPct / 100);
      const canAfford = capital >= s.minCapital || allocPct === 0;
      const riskPerTradeUsd = capital * (s.riskPerTrade / 100);
      const maxPositions = s.riskPerTrade > 0 ? Math.floor(20 / s.riskPerTrade) : 1;
      return { ...s, allocPct, capital, canAfford, riskPerTradeUsd, maxPositions };
    });
  }, [allocations, totalCapital]);

  const totalAllocPct = Object.values(allocations).reduce((s, v) => s + v, 0);
  const activeStratCount = strategyDetails.filter(s => s.allocPct > 0).length;

  const handleActivate = async () => {
    if (!profile) return;
    setIsActivating(true);
    try {
      const config = RISK_PROFILES[profile];
      const stratConfigs: { id: string; strategyType: string; isActive: boolean; allocationPct: number; maxLeverage: number; assets: string[] }[] = [];
      for (const strat of strategyDetails) {
        if (strat.allocPct > 0 && strat.canAfford) {
          stratConfigs.push({
            id: `local-${strat.type}`,
            strategyType: strat.type,
            isActive: true,
            allocationPct: strat.allocPct,
            maxLeverage: config.maxLeverage,
            assets: ['BTCUSDT', 'ETHUSDT'],
          });
        }
      }
      addBot(robotName, totalCapital, profile, stratConfigs);

      // Also sync to Supabase if available
      for (const strat of stratConfigs) {
        await enableStrategy(strat.strategyType, strat.allocationPct, strat.maxLeverage);
      }

      toast.success(`${robotName} activated — ${formatUsd(totalCapital)}`, {
        description: `${stratConfigs.length} strategies, ${config.label} profile`,
      });
      setTimeout(() => navigate('/ai-trade'), 300);
    } catch {
      toast.error('Failed to activate. Try again.');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="p-4 min-h-screen flex flex-col pb-28">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-5">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-primary' : 'bg-secondary/40'}`} />
        ))}
      </div>

      {/* ═══ STEP 0: Capital Source ═══ */}
      {step === 0 && (
        <div className="flex-1 space-y-5">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {isEditingExisting ? 'Create New Robot' : 'Set Up ALTIS'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isEditingExisting
                ? 'Create a new trading robot with its own capital and strategies.'
                : 'Your AI trading engine. Capital stays separate from DCA savings.'}
            </p>
          </div>

          {/* Robot name */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <label className="text-xs text-muted-foreground">Robot Name</label>
            <input
              type="text"
              value={robotName}
              onChange={e => setRobotName(e.target.value)}
              placeholder="ALTIS Bot #1"
              className="w-full bg-secondary/30 border border-border/30 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          {/* Capital source selection */}
          <div className="glass-card rounded-xl p-4 space-y-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Capital Source</p>

            {/* Auto: use Unified balance */}
            <button
              onClick={() => setCapitalMode('auto')}
              className={`w-full text-left rounded-xl p-4 transition-all border ${
                capitalMode === 'auto' ? 'border-primary/50 ring-1 ring-primary/30 bg-primary/5' : 'border-border/20 glass-light'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔗</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Use Unified Account Balance</p>
                    <p className="text-[10px] text-muted-foreground">Auto-detect your available trading capital</p>
                  </div>
                </div>
                <div className="text-right">
                  {hasBalance ? (
                    <p className="text-sm font-bold text-green-400">{formatUsd(unifiedBalance)}</p>
                  ) : balanceStatus === 'loading' ? (
                    <p className="text-xs text-muted-foreground animate-pulse">Loading...</p>
                  ) : (
                    <p className="text-xs text-amber-400">Connect API</p>
                  )}
                </div>
              </div>
            </button>

            {/* Custom amount */}
            <button
              onClick={() => setCapitalMode('custom')}
              className={`w-full text-left rounded-xl p-4 transition-all border ${
                capitalMode === 'custom' ? 'border-primary/50 ring-1 ring-primary/30 bg-primary/5' : 'border-border/20 glass-light'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">✏️</span>
                <div>
                  <p className="text-sm font-medium text-foreground">Set Custom Amount</p>
                  <p className="text-[10px] text-muted-foreground">Manually define how much to allocate</p>
                </div>
              </div>
            </button>

            {/* Custom amount slider (shown when custom selected) */}
            {capitalMode === 'custom' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-foreground">{formatUsd(customCapital)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tier.color}`}>
                    {tier.emoji} {tier.name}
                  </span>
                </div>
                <input
                  type="range" min={50} max={50000} step={50}
                  value={customCapital}
                  onChange={e => setCustomCapital(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex gap-2 flex-wrap">
                  {[100, 500, 1000, 2500, 5000, 10000].map(v => (
                    <button key={v} onClick={() => setCustomCapital(v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        customCapital === v ? 'bg-primary/20 text-primary border border-primary/30' : 'glass-light text-muted-foreground'
                      }`}>
                      {formatUsd(v)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tier info */}
            {totalCapital > 0 && (
              <div className="glass-light rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${tier.color.split(' ')[0]}`}>{tier.emoji} {tier.name} Tier</span>
                  <span className="text-[10px] text-muted-foreground">Up to {tier.maxStrats} strategies</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div><span className="text-muted-foreground block">Risk/trade</span><span className="text-foreground font-medium">{formatUsd(totalCapital * 0.02)}</span></div>
                  <div><span className="text-muted-foreground block">Max at risk</span><span className="text-foreground font-medium">{formatUsd(totalCapital * 0.20)}</span></div>
                  <div><span className="text-muted-foreground block">Daily limit</span><span className="text-red-400 font-medium">-{formatUsd(totalCapital * 0.05)}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* DCA separation note */}
          <div className="glass-light rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="text-sm">🔒</span>
            <p className="text-[10px] text-muted-foreground">
              Your DCA savings in the <strong>Funding Account</strong> are completely separate and untouched.
            </p>
          </div>

          <button onClick={() => totalCapital >= 50 && setStep(1)} disabled={totalCapital < 50}
            className="w-full py-3.5 rounded-xl font-semibold bg-primary text-primary-foreground disabled:opacity-40 transition-opacity">
            {totalCapital < 50 ? 'Minimum $50 required' : `Continue with ${formatUsd(totalCapital)}`}
          </button>
        </div>
      )}

      {/* ═══ STEP 1: Risk Profile ═══ */}
      {step === 1 && (
        <div className="flex-1 space-y-5">
          <div>
            <h1 className="text-xl font-bold text-foreground">Risk Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">Determines leverage limits and default strategy mix.</p>
          </div>

          {/* AI recommendation */}
          <div className="glass-card rounded-xl p-3 border border-blue-500/20 bg-blue-500/5">
            <div className="flex items-center gap-2 mb-1">
              <span>🧠</span>
              <span className="text-xs font-medium text-blue-400">AI Recommendation</span>
            </div>
            <p className="text-xs text-foreground/80">{aiRec.text}</p>
          </div>

          <div className="space-y-3">
            {Object.entries(RISK_PROFILES).map(([key, p]) => (
              <button key={key} onClick={() => { setProfile(key as keyof typeof RISK_PROFILES); setAllocations({ ...aiRec.suggested }); }}
                className={`w-full text-left glass-card rounded-xl p-4 transition-all border ${
                  profile === key ? 'border-primary/50 ring-1 ring-primary/30' : 'border-border/20'
                }`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{p.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-primary font-medium">Max {p.maxLeverage}x</p>
                    <p className="text-[10px] text-muted-foreground">{Object.values(p.defaults).filter(v => v > 0).length} strategies</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl glass-light text-muted-foreground font-medium">Back</button>
            <button onClick={() => profile && setStep(2)} disabled={!profile}
              className="flex-1 py-3 rounded-xl font-semibold bg-primary text-primary-foreground disabled:opacity-40">Continue</button>
          </div>
        </div>
      )}

      {/* ═══ STEP 2: Strategy Allocation ═══ */}
      {step === 2 && profile && (
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Customize Strategies</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {formatUsd(totalCapital)} split across strategies. Tap a strategy for details.
            </p>
          </div>

          {/* Total allocation bar */}
          <div className="glass-card rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">{activeStratCount} strategies • {formatUsd(totalCapital)}</span>
              <span className={`text-xs font-bold ${totalAllocPct === 100 ? 'text-green-400' : totalAllocPct > 100 ? 'text-red-400' : 'text-amber-400'}`}>
                {totalAllocPct}%
              </span>
            </div>
            {/* Stacked allocation bar */}
            <div className="w-full bg-secondary/40 rounded-full h-3 flex overflow-hidden">
              {strategyDetails.filter(s => s.allocPct > 0).map((s, i) => {
                const colors = ['bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-green-500', 'bg-cyan-500'];
                return (
                  <div key={s.type} className={`h-3 ${colors[i % colors.length]} transition-all`}
                    style={{ width: `${Math.min(s.allocPct, 100)}%` }} title={`${s.label}: ${s.allocPct}%`} />
                );
              })}
            </div>
          </div>

          {/* AI suggestion button */}
          <button onClick={() => setAllocations({ ...aiRec.suggested })}
            className="w-full py-2 rounded-lg text-xs font-medium glass-light text-blue-400 border border-blue-500/20 hover:bg-blue-500/10 transition-colors">
            🧠 Apply AI-recommended allocation for {formatUsd(totalCapital)}
          </button>

          {/* Strategy cards */}
          <div className="space-y-2">
            {strategyDetails.map(s => {
              const isExpanded = expandedStrategy === s.type;
              return (
                <div key={s.type} className={`glass-card rounded-xl overflow-hidden transition-opacity ${s.allocPct === 0 ? 'opacity-50' : ''}`}>
                  {/* Header — tap to expand */}
                  <button onClick={() => setExpandedStrategy(isExpanded ? null : s.type)}
                    className="w-full text-left p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{s.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{s.label}</p>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${RISK_COLORS[s.riskLevel]} bg-current/10`}>
                              {s.riskLevel}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                        </div>
                      </div>
                      <div className="text-right min-w-[60px]">
                        <p className="text-sm font-bold text-foreground">{s.allocPct}%</p>
                        <p className="text-[10px] text-muted-foreground">{formatUsd(s.capital)}</p>
                      </div>
                    </div>
                  </button>

                  {/* Slider + details */}
                  <div className="px-3 pb-3 space-y-2.5">
                    <input type="range" min={0} max={60} step={5} value={s.allocPct}
                      onChange={e => setAllocations(prev => ({ ...prev, [s.type]: Number(e.target.value) }))}
                      className="w-full accent-primary" />

                    {/* Quick stats row */}
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-muted-foreground">Risk: {s.riskPerTrade}%</span>
                      <span className="text-muted-foreground">({formatUsd(s.riskPerTradeUsd)}/trade)</span>
                      <span className="text-muted-foreground">Lev: {s.maxLeverage}x</span>
                      <span className="text-muted-foreground">Min: {formatUsd(s.minCapital)}</span>
                      {!s.canAfford && s.allocPct > 0 && <span className="text-red-400 font-medium">Under min!</span>}
                    </div>

                    {/* Backtest stats */}
                    {s.backtest.wr !== null && (
                      <div className="flex items-center gap-3 text-[10px] glass-light rounded-lg px-2.5 py-1.5">
                        <span className="text-muted-foreground">Backtest:</span>
                        <span className="text-green-400 font-medium">WR {s.backtest.wr}%</span>
                        <span className="text-blue-400 font-medium">PF {s.backtest.pf}</span>
                        <span className="text-muted-foreground">{s.backtest.trades} trades</span>
                        <span className="text-muted-foreground">Best: {s.backtest.regime}</span>
                      </div>
                    )}

                    {/* Expanded description */}
                    {isExpanded && (
                      <div className="glass-light rounded-lg p-3 text-xs text-foreground/70 leading-relaxed">
                        {s.longDesc}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl glass-light text-muted-foreground font-medium">Back</button>
            <button onClick={() => totalAllocPct === 100 && setStep(3)} disabled={totalAllocPct !== 100}
              className="flex-1 py-3 rounded-xl font-semibold bg-primary text-primary-foreground disabled:opacity-40">
              {totalAllocPct === 100 ? 'Review' : `${totalAllocPct}% — need 100%`}
            </button>
          </div>
        </div>
      )}

      {/* ═══ STEP 3: Review & Activate ═══ */}
      {step === 3 && profile && (
        <div className="flex-1 space-y-5">
          <div>
            <h1 className="text-xl font-bold text-foreground">Review — {robotName}</h1>
            <p className="text-sm text-muted-foreground mt-1">Confirm your configuration before activating.</p>
          </div>

          {/* Summary card */}
          <div className="glass-card rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{RISK_PROFILES[profile].icon}</span>
                <div>
                  <p className="font-semibold text-foreground">{RISK_PROFILES[profile].label}</p>
                  <p className="text-[10px] text-muted-foreground">Max {RISK_PROFILES[profile].maxLeverage}x leverage</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">{formatUsd(totalCapital)}</p>
                <p className={`text-[10px] font-medium ${tier.color.split(' ')[0]}`}>{tier.emoji} {tier.name}</p>
              </div>
            </div>

            {/* Per-strategy breakdown */}
            <div className="space-y-1">
              {strategyDetails.filter(s => s.allocPct > 0).map(s => (
                <div key={s.type} className="glass-light rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">{s.icon} {s.label}</span>
                    <span className="text-xs font-bold text-foreground">{formatUsd(s.capital)} <span className="text-muted-foreground font-normal">({s.allocPct}%)</span></span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                    <span>Risk: {formatUsd(s.riskPerTradeUsd)}/trade</span>
                    <span>Max {s.maxPositions} positions</span>
                    <span>Lev: {s.maxLeverage}x</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Risk limits */}
            <div className="border-t border-border/20 pt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Max risk/trade</span><span className="font-medium">{formatUsd(totalCapital * 0.02)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Heat cap</span><span className="font-medium">{formatUsd(totalCapital * 0.20)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Daily limit</span><span className="text-red-400 font-medium">-{formatUsd(totalCapital * 0.05)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Capitulation</span><span className="text-amber-400 font-medium">Auto-close</span></div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="glass-light rounded-xl p-3 border border-amber-500/20">
            <p className="text-[10px] text-amber-300 font-medium mb-1">Risk Notice</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Leveraged trading carries risk. ALTIS uses 7 protection layers but cannot eliminate all risk.
              DCA savings (Funding Account) are completely separate. Only risk capital you can afford to lose.
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl glass-light text-muted-foreground font-medium">Back</button>
            <button onClick={handleActivate} disabled={isActivating}
              className="flex-1 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white disabled:opacity-50 active:scale-[0.98]">
              {isActivating ? 'Activating...' : `Activate ${robotName}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
