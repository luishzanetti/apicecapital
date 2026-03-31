import { useMemo } from 'react';
import { useExchangeBalance, CoinHolding, FundingHolding } from './useExchangeBalance';
import { useAppStore } from '@/store/appStore';

export interface AssetSummary {
  coin: string;
  spotBalance: number;
  spotUsdValue: number;
  dcaAllocatedPct: number;
  totalAllocationPct: number;
  source: 'spot' | 'dca' | 'both';
}

export interface PortfolioAnalytics {
  // Totals
  totalEquity: number;
  totalAvailableBalance: number;
  totalUnrealizedPnL: number;
  pnlPercent: number;
  grandTotal: number;

  // Funding account
  fundingBalance: number;
  fundingHoldings: FundingHolding[];

  // Spot holdings from exchange
  spotHoldings: CoinHolding[];
  spotCount: number;

  // DCA info
  activeDCAPlans: number;
  totalDCAInvested: number;
  totalDCACommittedMonthly: number;
  dcaAssets: string[];

  // Allocation breakdown
  allocationMap: AssetSummary[];
  stablecoinsValue: number;
  stablecoinsPct: number;
  altcoinsValue: number;
  altcoinsPct: number;
  btcValue: number;
  btcPct: number;
  ethValue: number;
  ethPct: number;

  // Connection state
  isConnected: boolean;
  isTestnet: boolean;
  isLoading: boolean;
  error: string | null;
  status: 'idle' | 'loading' | 'connected' | 'no_credentials' | 'error';
}

const STABLECOINS = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'FDUSD'];

function getMonthlyCommitment(frequency: string, amount: number): number {
  switch (frequency) {
    case 'daily': return amount * 30;
    case 'weekly': return amount * 4;
    case 'biweekly': return amount * 2;
    case 'monthly': return amount;
    default: return amount * 4;
  }
}

export function usePortfolioAnalytics(): PortfolioAnalytics {
  const { data, isLoading, error, status } = useExchangeBalance();
  const dcaPlans = useAppStore((s) => s.dcaPlans);

  return useMemo(() => {
    const isConnected = status === 'connected' && !!data;
    const holdings = data?.holdings ?? [];
    const totalEquity = data?.totalEquity ?? 0;
    const fundingBalance = data?.fundingBalance ?? 0;
    const fundingHoldings = data?.fundingHoldings ?? [];
    const grandTotal = data?.grandTotal ?? totalEquity;

    // DCA calculations
    const activePlans = dcaPlans.filter((p) => p.isActive);
    const totalDCAInvested = dcaPlans.reduce((sum, p) => sum + (p.totalInvested ?? 0), 0);
    const totalDCACommittedMonthly = activePlans.reduce(
      (sum, p) => sum + getMonthlyCommitment(p.frequency, p.amountPerInterval),
      0
    );
    const dcaAssets = [...new Set(activePlans.flatMap((p) => p.assets.map((a) => a.symbol)))];

    // Category breakdown
    const stablecoinsValue = holdings
      .filter((h) => STABLECOINS.includes(h.coin))
      .reduce((sum, h) => sum + h.usdValue, 0);
    const btcValue = holdings.find((h) => h.coin === 'BTC')?.usdValue ?? 0;
    const ethValue = holdings.find((h) => h.coin === 'ETH')?.usdValue ?? 0;
    const altcoinsValue = totalEquity - stablecoinsValue - btcValue - ethValue;

    const pct = (v: number) => (totalEquity > 0 ? (v / totalEquity) * 100 : 0);

    // Build unified allocation map
    const allocationMap: AssetSummary[] = holdings.map((h) => {
      const dcaPlan = activePlans.find((p) => p.assets.some((a) => a.symbol === h.coin));
      const dcaAlloc = dcaPlan?.assets.find((a) => a.symbol === h.coin)?.allocation ?? 0;
      const hasDca = dcaAlloc > 0;

      return {
        coin: h.coin,
        spotBalance: h.balance,
        spotUsdValue: h.usdValue,
        dcaAllocatedPct: dcaAlloc,
        totalAllocationPct: pct(h.usdValue),
        source: hasDca ? 'both' : 'spot',
      };
    });

    // Add DCA-only assets not in spot holdings
    for (const asset of dcaAssets) {
      if (!allocationMap.find((a) => a.coin === asset)) {
        const dcaPlan = activePlans.find((p) => p.assets.some((a) => a.symbol === asset));
        const dcaAlloc = dcaPlan?.assets.find((a) => a.symbol === asset)?.allocation ?? 0;
        allocationMap.push({
          coin: asset,
          spotBalance: 0,
          spotUsdValue: 0,
          dcaAllocatedPct: dcaAlloc,
          totalAllocationPct: 0,
          source: 'dca',
        });
      }
    }

    const totalWallet = data?.totalWalletBalance ?? 0;
    const pnl = data?.totalUnrealizedPnL ?? 0;
    const pnlPercent = totalWallet > 0 ? (pnl / totalWallet) * 100 : 0;

    return {
      totalEquity,
      totalAvailableBalance: data?.totalAvailableBalance ?? 0,
      totalUnrealizedPnL: pnl,
      pnlPercent,
      grandTotal,
      fundingBalance,
      fundingHoldings,
      spotHoldings: holdings,
      spotCount: holdings.length,
      activeDCAPlans: activePlans.length,
      totalDCAInvested,
      totalDCACommittedMonthly,
      dcaAssets,
      allocationMap,
      stablecoinsValue,
      stablecoinsPct: pct(stablecoinsValue),
      altcoinsValue: Math.max(0, altcoinsValue),
      altcoinsPct: pct(Math.max(0, altcoinsValue)),
      btcValue,
      btcPct: pct(btcValue),
      ethValue,
      ethPct: pct(ethValue),
      isConnected,
      isTestnet: data?.testnet ?? false,
      isLoading,
      error,
      status,
    };
  }, [data, isLoading, error, status, dcaPlans]);
}
