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

const strategies: Record<string, Strategy> = {
  conservative: {
    id: 'conservative',
    name: 'DCA Conservative',
    allocations: [
      { asset: 'BTC', percentage: 80 },
      { asset: 'ETH', percentage: 15 },
      { asset: 'USDT', percentage: 5 },
    ],
  },
  balanced: {
    id: 'balanced',
    name: 'DCA Balanced',
    allocations: [
      { asset: 'BTC', percentage: 70 },
      { asset: 'ETH', percentage: 20 },
      { asset: 'SOL', percentage: 10 },
    ],
  },
  growth: {
    id: 'growth',
    name: 'DCA Growth',
    allocations: [
      { asset: 'BTC', percentage: 50 },
      { asset: 'ETH', percentage: 25 },
      { asset: 'SOL', percentage: 15 },
      { asset: 'ALT', percentage: 10 },
    ],
  },
};

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
