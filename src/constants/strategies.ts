// Single source of truth for ALTIS strategy definitions
// Import this everywhere — do NOT duplicate these values

export const ALTIS_STRATEGIES = {
  grid: {
    type: 'grid',
    label: 'Grid Trading',
    shortLabel: 'Grid',
    icon: '📊',
    description: 'Captures profit from price bouncing in a range',
    longDescription: 'Places buy orders below and sell orders above current price. When price oscillates, each bounce generates profit.',
    minCapital: 50,
    riskPerTrade: 2,
    maxLeverage: 3,
    riskLevel: 'low' as const,
    chartColor: '#3b82f6',
    bgClass: 'bg-blue-500',
    textClass: 'text-blue-400',
    bestRegime: 'SIDEWAYS',
  },
  mean_reversion: {
    type: 'mean_reversion',
    label: 'Mean Reversion',
    shortLabel: 'Mean Rev',
    icon: '🔄',
    description: 'Buys oversold, sells overbought using RSI',
    longDescription: 'When RSI drops below 35, the asset is oversold — historically bounces back. Tight 3% stop-loss limits downside.',
    minCapital: 30,
    riskPerTrade: 2,
    maxLeverage: 2,
    riskLevel: 'low' as const,
    chartColor: '#a855f7',
    bgClass: 'bg-purple-500',
    textClass: 'text-purple-400',
    bestRegime: 'ANY',
  },
  funding_arb: {
    type: 'funding_arb',
    label: 'Funding Rate Arb',
    shortLabel: 'Arb',
    icon: '💰',
    description: 'Delta-neutral yield — zero market risk',
    longDescription: 'Long spot + short perpetual = zero net exposure. Collects funding rate payments 3x/day.',
    minCapital: 200,
    riskPerTrade: 0,
    maxLeverage: 1,
    riskLevel: 'minimal' as const,
    chartColor: '#f59e0b',
    bgClass: 'bg-amber-500',
    textClass: 'text-amber-400',
    bestRegime: 'Funding > 0.01%',
  },
  trend_following: {
    type: 'trend_following',
    label: 'Trend Following',
    shortLabel: 'Trend',
    icon: '📈',
    description: 'Rides momentum with SMA crossovers',
    longDescription: 'Detects trend direction using moving average crossovers. Goes long in uptrends, short in downtrends.',
    minCapital: 30,
    riskPerTrade: 3,
    maxLeverage: 3,
    riskLevel: 'medium' as const,
    chartColor: '#22c55e',
    bgClass: 'bg-green-500',
    textClass: 'text-green-400',
    bestRegime: 'BULL/BEAR',
  },
  ai_signal: {
    type: 'ai_signal',
    label: 'AI Signal (Claude)',
    shortLabel: 'AI',
    icon: '🧠',
    description: 'AI analyzes market every 4h for high-conviction plays',
    longDescription: 'Claude AI receives full market context and generates trading signals. Only acts on conviction ≥70%.',
    minCapital: 20,
    riskPerTrade: 2,
    maxLeverage: 5,
    riskLevel: 'variable' as const,
    chartColor: '#06b6d4',
    bgClass: 'bg-cyan-500',
    textClass: 'text-cyan-400',
    bestRegime: 'Always',
  },
} as const;

export type StrategyType = keyof typeof ALTIS_STRATEGIES;

export const STRATEGY_TYPES = Object.keys(ALTIS_STRATEGIES) as StrategyType[];

export const RISK_PROFILES = {
  conservative: {
    label: 'Conservative',
    icon: '🛡️',
    description: 'Steady income, lower risk. Focus on proven strategies.',
    maxLeverage: 2,
    defaults: { grid: 40, mean_reversion: 25, funding_arb: 30, trend_following: 0, ai_signal: 5 },
  },
  balanced: {
    label: 'Balanced',
    icon: '⚖️',
    description: 'Mix of income + directional plays. Best diversification.',
    maxLeverage: 3,
    defaults: { grid: 30, mean_reversion: 20, funding_arb: 20, trend_following: 20, ai_signal: 10 },
  },
  growth: {
    label: 'Growth',
    icon: '🚀',
    description: 'Higher risk for higher reward. More directional exposure.',
    maxLeverage: 5,
    defaults: { grid: 20, mean_reversion: 15, funding_arb: 15, trend_following: 30, ai_signal: 20 },
  },
} as const;

export type RiskProfile = keyof typeof RISK_PROFILES;

// Suggested allocation based on capital (not AI, just smart defaults)
export function getSuggestedAllocation(capital: number, profile: RiskProfile): Record<string, number> {
  if (capital < 100) {
    return { grid: 0, mean_reversion: 70, funding_arb: 0, trend_following: 0, ai_signal: 30 };
  }
  if (capital < 500) {
    return { grid: 40, mean_reversion: 40, funding_arb: 0, trend_following: 0, ai_signal: 20 };
  }
  if (capital < 2000) {
    return { grid: 35, mean_reversion: 25, funding_arb: 25, trend_following: 0, ai_signal: 15 };
  }
  return RISK_PROFILES[profile].defaults;
}

export function getCapitalTier(capital: number) {
  if (capital >= 5000) return { name: 'Full', emoji: '👑', maxStrats: 5, color: 'text-green-400 bg-green-500/20' };
  if (capital >= 2000) return { name: 'Standard', emoji: '⭐', maxStrats: 5, color: 'text-blue-400 bg-blue-500/20' };
  if (capital >= 500)  return { name: 'Starter', emoji: '🌱', maxStrats: 3, color: 'text-purple-400 bg-purple-500/20' };
  if (capital >= 100)  return { name: 'Micro', emoji: '🔬', maxStrats: 2, color: 'text-amber-400 bg-amber-500/20' };
  return { name: 'Nano', emoji: '⚡', maxStrats: 1, color: 'text-muted-foreground bg-secondary/40' };
}
