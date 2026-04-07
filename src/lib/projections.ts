// ─── Projection Utilities for Onboarding V2 ─────────────────
// Pure functions for financial projection calculations and strategy recommendation.

export interface ChartPoint {
  year: string;
  invested: number;
  projected: number;
}

export interface StrategyAllocation {
  asset: string;
  percentage: number;
}

export interface Strategy {
  id: string;
  name: string;
  allocations: StrategyAllocation[];
}

/**
 * Calculate the projected total value of a weekly DCA investment
 * over a given number of years, assuming a conservative weekly return.
 *
 * Uses ~10.4% annualized return (conservative for crypto DCA).
 */
export function calculateProjection(weeklyAmount: number, years: number): number {
  const weeklyReturn = 0.002; // ~10.4% annualized
  const weeks = years * 52;
  let total = 0;
  for (let w = 0; w < weeks; w++) {
    total = (total + weeklyAmount) * (1 + weeklyReturn);
  }
  return Math.round(total);
}

/**
 * Generate chart data points for 1-5 year projections.
 * Each point contains the raw invested amount and the projected value.
 */
export function getProjectionData(weeklyAmount: number): ChartPoint[] {
  return [1, 2, 3, 4, 5].map((year) => ({
    year: `${year}a`,
    invested: weeklyAmount * 52 * year,
    projected: calculateProjection(weeklyAmount, year),
  }));
}

// ─── Strategy Definitions ───────────────────────────────────
// Each strategy includes a mandatory stablecoin "War Chest" (Capital de Guerra).
// The War Chest is NOT idle money — it's strategic ammunition that the
// Intelligence System deploys during market opportunities (e.g. CAPITULATION).

const strategies: Record<string, Strategy> = {
  conservative: {
    id: 'conservative',
    name: 'DCA Conservative',
    allocations: [
      { asset: 'BTC', percentage: 55 },
      { asset: 'ETH', percentage: 20 },
      { asset: 'USDT', percentage: 15 },  // War Chest — Capital de Guerra
      { asset: 'SOL', percentage: 10 },
    ],
  },
  balanced: {
    id: 'balanced',
    name: 'DCA Balanced',
    allocations: [
      { asset: 'BTC', percentage: 45 },
      { asset: 'ETH', percentage: 22 },
      { asset: 'SOL', percentage: 13 },
      { asset: 'USDT', percentage: 12 },  // War Chest — Capital de Guerra
      { asset: 'LINK', percentage: 8 },
    ],
  },
  growth: {
    id: 'growth',
    name: 'DCA Growth',
    allocations: [
      { asset: 'BTC', percentage: 35 },
      { asset: 'ETH', percentage: 20 },
      { asset: 'SOL', percentage: 18 },
      { asset: 'USDT', percentage: 10 },  // War Chest — Capital de Guerra
      { asset: 'AVAX', percentage: 9 },
      { asset: 'LINK', percentage: 8 },
    ],
  },
};

// ─── War Chest (Capital de Guerra) — Dynamic Reserve by Regime ─────
// The War Chest % adjusts based on market regime. In CAPITULATION,
// most of the reserve is deployed into assets (buy the blood).

export type MarketRegime = 'BULL' | 'BEAR' | 'SIDEWAYS' | 'HIGH_VOLATILITY' | 'ALTSEASON' | 'CAPITULATION';

export interface WarChestConfig {
  baseReservePct: number;      // Default stablecoin reserve %
  regimeReservePct: number;    // Adjusted reserve % for current regime
  deployablePct: number;       // How much of the reserve can be deployed
  deployTarget: string[];      // Which assets receive deployed capital
  explanation: string;
}

// Reserve % by regime and profile
const WAR_CHEST_MATRIX: Record<MarketRegime, Record<string, { reserve: number; deploy: number }>> = {
  BULL:            { conservative: { reserve: 10, deploy: 0 },  balanced: { reserve: 8,  deploy: 0 },  growth: { reserve: 5,  deploy: 0 } },
  SIDEWAYS:        { conservative: { reserve: 15, deploy: 0 },  balanced: { reserve: 12, deploy: 0 },  growth: { reserve: 10, deploy: 0 } },
  BEAR:            { conservative: { reserve: 20, deploy: 0 },  balanced: { reserve: 18, deploy: 0 },  growth: { reserve: 15, deploy: 0 } },
  HIGH_VOLATILITY: { conservative: { reserve: 25, deploy: 0 },  balanced: { reserve: 20, deploy: 0 },  growth: { reserve: 15, deploy: 0 } },
  ALTSEASON:       { conservative: { reserve: 12, deploy: 3 },  balanced: { reserve: 8,  deploy: 5 },  growth: { reserve: 5,  deploy: 8 } },
  CAPITULATION:    { conservative: { reserve: 5,  deploy: 10 }, balanced: { reserve: 5,  deploy: 8 },  growth: { reserve: 5,  deploy: 7 } },
};

const REGIME_EXPLANATIONS: Record<MarketRegime, string> = {
  BULL: 'Bull market — minimal reserve, capital at work.',
  SIDEWAYS: 'Sideways market — building reserve for future opportunities.',
  BEAR: 'Bear market — increasing reserve, protecting capital.',
  HIGH_VOLATILITY: 'High volatility — maximum reserve as protection.',
  ALTSEASON: 'Altseason — deploying part of reserve into alts with momentum.',
  CAPITULATION: 'CAPITULATION — deploying War Chest! Extreme fear = historic opportunity.',
};

export function getWarChestConfig(
  regime: MarketRegime,
  profileType: 'conservative' | 'balanced' | 'growth',
  currentReservePct: number
): WarChestConfig {
  const config = WAR_CHEST_MATRIX[regime]?.[profileType] || WAR_CHEST_MATRIX.SIDEWAYS[profileType];

  // Deploy targets vary by regime
  const deployTargets: Record<MarketRegime, string[]> = {
    BULL: [],
    SIDEWAYS: [],
    BEAR: [],
    HIGH_VOLATILITY: [],
    ALTSEASON: ['SOL', 'AVAX', 'LINK'],
    CAPITULATION: ['BTC', 'ETH'],
  };

  return {
    baseReservePct: currentReservePct,
    regimeReservePct: config.reserve,
    deployablePct: config.deploy,
    deployTarget: deployTargets[regime] || [],
    explanation: REGIME_EXPLANATIONS[regime] || '',
  };
}

/**
 * Recommend a strategy based on the user's risk profile.
 * Falls back to balanced if riskProfile is null or unknown.
 */
export function getRecommendedStrategy(
  _goal: string | null,
  _experience: string | null,
  riskProfile: string | null
): Strategy {
  if (riskProfile === 'conservative') return strategies.conservative;
  if (riskProfile === 'aggressive') return strategies.growth;
  return strategies.balanced;
}

/**
 * Return all three strategies for the "see others" section.
 */
export function getAllStrategies(): Strategy[] {
  return [strategies.conservative, strategies.balanced, strategies.growth];
}

/**
 * Format a number as Brazilian Real currency string.
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
