import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/store/appStore';
import { fetchExplosiveScores } from '@/services/explosiveScore';
import { PROFILE_CONFIGS, type ExplosiveCoin, type ExplosiveProfileConfig } from '@/types/explosive';

function filterByProfile(coins: ExplosiveCoin[], config: ExplosiveProfileConfig): ExplosiveCoin[] {
  return coins.filter(coin => {
    const riskMap: Record<string, number> = { conservative: 3, balanced: 5, high: 7, extreme: 9 };
    const coinRisk = riskMap[coin.riskLevel] || 5;
    if (coinRisk > config.maxRiskLevel) return false;
    if (coin.pillars.fundamental < config.minFundamentalScore) return false;
    if (!config.allowedSectors.includes(coin.sector)) return false;
    return true;
  });
}

export function useExplosivePicks(limit = 30) {
  const investorType = useAppStore(s => s.investorType);
  const subscription = useAppStore(s => s.subscription);

  const query = useQuery({
    queryKey: ['explosive-scores'],
    queryFn: () => fetchExplosiveScores(limit),
    staleTime: 4 * 60 * 60 * 1000, // 4 hours
    gcTime: 24 * 60 * 60 * 1000,
    retry: 2,
  });

  const profileConfig = PROFILE_CONFIGS[investorType || 'Balanced Optimizer']
    || PROFILE_CONFIGS['Balanced Optimizer'];

  const allCoins = query.data || [];
  const filteredCoins = filterByProfile(allCoins, profileConfig);
  const isPro = subscription?.tier === 'pro' || subscription?.tier === 'club';

  return {
    coins: filteredCoins,
    allCoins,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isPro,
    profileConfig,
  };
}
