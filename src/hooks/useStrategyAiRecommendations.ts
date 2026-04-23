import { useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import { useLeveragedTrading } from '@/hooks/useLeveragedTrading';
import {
  computeStrategyRecommendations,
  type InvestorProfile,
  type MarketRegime,
  type StrategyKey,
  type StrategyRecommendation,
} from '@/data/strategyIntelligence';

/**
 * Derives AI strategy recommendations from the live context:
 * investor profile, total ALTIS capital, detected market regime, and
 * the current per-strategy allocation / active state.
 *
 * Pure rule-based (no LLM call). Deterministic, fast, zero-cost.
 * Designed to match the backend Claude layer's typical guidance so the
 * client can surface recommendations without an API round-trip.
 */
export function useStrategyAiRecommendations(): {
  recommendations: StrategyRecommendation[];
  regime: MarketRegime;
  profile: InvestorProfile | null;
  totalCapital: number;
} {
  const {
    strategies,
    activeBot,
    marketContext,
    totalCapital,
  } = useLeveragedTrading();
  const investorType = useAppStore((s) => s.investorType) as InvestorProfile | null;

  const regime = useMemo<MarketRegime>(() => {
    const r = (marketContext?.regime ?? '').toUpperCase();
    switch (r) {
      case 'BULL':
      case 'BEAR':
      case 'SIDEWAYS':
      case 'HIGH_VOLATILITY':
        return r as MarketRegime;
      default:
        return 'UNKNOWN';
    }
  }, [marketContext]);

  const recommendations = useMemo(() => {
    const allocations: Partial<Record<StrategyKey, number>> = {};
    const activeMap: Partial<Record<StrategyKey, boolean>> = {};
    for (const s of strategies) {
      allocations[s.strategyType as StrategyKey] = s.allocationPct;
      activeMap[s.strategyType as StrategyKey] = s.isActive;
    }
    const capital = activeBot?.capital ?? totalCapital ?? 0;
    return computeStrategyRecommendations({
      regime,
      profile: investorType,
      capital,
      allocations,
      activeMap,
    });
  }, [strategies, activeBot, totalCapital, regime, investorType]);

  return {
    recommendations,
    regime,
    profile: investorType,
    totalCapital: activeBot?.capital ?? totalCapital ?? 0,
  };
}
