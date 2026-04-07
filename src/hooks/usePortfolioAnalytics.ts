import { useMemo } from 'react';
import { useExchangeBalance, CoinHolding, FundingHolding, FuturesPosition } from './useExchangeBalance';
import { usePortfolioData } from './usePortfolioData';
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
  totalEquity: number;
  totalAvailableBalance: number;
  totalUnrealizedPnL: number;
  totalCostBasis: number;
  pnlPercent: number;
  grandTotal: number;
  spotBalance: number;
  futuresBalance: number;
  futuresInitialMargin: number;
  futuresPositionCount: number;
  futuresNotional: number;
  futuresMarginBalance: number;
  futuresMaintenanceMargin: number;
  futuresUnrealizedPnl: number;
  futuresPositions: FuturesPosition[];
  fundingBalance: number;
  fundingHoldings: FundingHolding[];
  spotHoldings: CoinHolding[];
  spotCount: number;
  activeDCAPlans: number;
  totalDCAInvested: number;
  totalDCACommittedMonthly: number;
  dcaAssets: string[];
  allocationMap: AssetSummary[];
  stablecoinsValue: number;
  stablecoinsPct: number;
  altcoinsValue: number;
  altcoinsPct: number;
  btcValue: number;
  btcPct: number;
  ethValue: number;
  ethPct: number;
  isConnected: boolean;
  isTestnet: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  status: 'idle' | 'loading' | 'connected' | 'no_credentials' | 'error';
  dataSource: 'exchange' | 'portfolio' | 'none';
  hasLiveBalance: boolean;
  refresh: () => void;
}

const STABLECOINS = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'FDUSD'];

function getMonthlyCommitment(frequency: string, amount: number): number {
  switch (frequency) {
    case 'daily':
      return amount * 30;
    case 'weekly':
      return amount * 4;
    case 'biweekly':
      return amount * 2;
    case 'monthly':
      return amount;
    default:
      return amount * 4;
  }
}

export function usePortfolioAnalytics(): PortfolioAnalytics {
  const exchange = useExchangeBalance();
  const portfolio = usePortfolioData();
  const dcaPlans = useAppStore((s) => s.dcaPlans);

  return useMemo(() => {
    const activePlans = dcaPlans.filter((p) => p.isActive);
    const totalDCAInvested = dcaPlans.reduce((sum, p) => sum + (p.totalInvested ?? 0), 0);
    const totalDCACommittedMonthly = activePlans.reduce(
      (sum, p) => sum + getMonthlyCommitment(p.frequency, p.amountPerInterval),
      0
    );
    const dcaAssets = [...new Set(activePlans.flatMap((p) => p.assets.map((a) => a.symbol)))];

    const fallbackHoldings: CoinHolding[] = portfolio.holdings.map((holding) => {
      const fallbackUsdValue =
        holding.currentValue > 0 ? holding.currentValue : holding.avgBuyPrice * holding.amount;
      const isStablecoin = STABLECOINS.includes(holding.symbol);

      return {
        coin: holding.symbol,
        balance: holding.amount,
        equity: holding.amount,
        usdValue: fallbackUsdValue,
        unrealisedPnl: holding.currentPrice > 0 ? holding.pnl : 0,
        availableToWithdraw: isStablecoin ? holding.amount : 0,
      };
    });

    const fallbackTotalEquity = fallbackHoldings.reduce((sum, holding) => sum + holding.usdValue, 0);
    const fallbackCostBasis = portfolio.totalInvested;
    const fallbackPnL = fallbackTotalEquity - fallbackCostBasis;
    const fallbackAvailableBalance = fallbackHoldings
      .filter((holding) => STABLECOINS.includes(holding.coin))
      .reduce((sum, holding) => sum + holding.usdValue, 0);

    const hasExchangeData = exchange.status === 'connected' && !!exchange.data;
    const hasFallbackData = !hasExchangeData && (fallbackHoldings.length > 0 || fallbackCostBasis > 0);

    const dataSource: PortfolioAnalytics['dataSource'] = hasExchangeData
      ? 'exchange'
      : hasFallbackData
        ? 'portfolio'
        : 'none';

    const holdings = hasExchangeData ? exchange.data?.holdings ?? [] : fallbackHoldings;
    const totalEquity = hasExchangeData ? exchange.data?.totalEquity ?? 0 : fallbackTotalEquity;
    const spotBalance = hasExchangeData ? exchange.data?.spotBalance ?? exchange.data?.totalWalletBalance ?? totalEquity : fallbackTotalEquity;
    const futuresBalance = hasExchangeData ? exchange.data?.futuresBalance ?? 0 : 0;
    const futuresInitialMargin = hasExchangeData ? exchange.data?.futuresInitialMargin ?? 0 : 0;
    const futuresPositionCount = hasExchangeData ? exchange.data?.futuresPositionCount ?? 0 : 0;
    const futuresNotional = hasExchangeData ? exchange.data?.futuresNotional ?? 0 : 0;
    const futuresMarginBalance = hasExchangeData ? exchange.data?.futuresMarginBalance ?? futuresBalance : 0;
    const futuresMaintenanceMargin = hasExchangeData ? exchange.data?.futuresMaintenanceMargin ?? 0 : 0;
    const futuresUnrealizedPnl = hasExchangeData ? exchange.data?.futuresUnrealizedPnl ?? 0 : 0;
    const futuresPositions = hasExchangeData ? exchange.data?.futuresPositions ?? [] : [];
    const fundingBalance = hasExchangeData ? exchange.data?.fundingBalance ?? 0 : 0;
    const fundingHoldings = hasExchangeData ? exchange.data?.fundingHoldings ?? [] : [];
    const totalCostBasis = hasExchangeData
      ? exchange.data?.totalWalletBalance ?? totalEquity
      : fallbackCostBasis;
    const grandTotal = hasExchangeData
      ? exchange.data?.grandTotal ?? totalEquity
      : fallbackTotalEquity;
    const totalAvailableBalance = hasExchangeData
      ? exchange.data?.totalAvailableBalance ?? 0
      : fallbackAvailableBalance;
    const totalUnrealizedPnL = hasExchangeData
      ? exchange.data?.totalUnrealizedPnL ?? 0
      : fallbackPnL;

    const pct = (value: number) => (totalEquity > 0 ? (value / totalEquity) * 100 : 0);

    const stablecoinsValue = holdings
      .filter((holding) => STABLECOINS.includes(holding.coin))
      .reduce((sum, holding) => sum + holding.usdValue, 0);
    const btcValue = holdings.find((holding) => holding.coin === 'BTC')?.usdValue ?? 0;
    const ethValue = holdings.find((holding) => holding.coin === 'ETH')?.usdValue ?? 0;
    const altcoinsValue = totalEquity - stablecoinsValue - btcValue - ethValue;

    const allocationMap: AssetSummary[] = holdings.map((holding) => {
      const dcaPlan = activePlans.find((plan) => plan.assets.some((asset) => asset.symbol === holding.coin));
      const dcaAlloc = dcaPlan?.assets.find((asset) => asset.symbol === holding.coin)?.allocation ?? 0;
      const hasDca = dcaAlloc > 0;

      return {
        coin: holding.coin,
        spotBalance: holding.balance,
        spotUsdValue: holding.usdValue,
        dcaAllocatedPct: dcaAlloc,
        totalAllocationPct: pct(holding.usdValue),
        source: hasDca ? 'both' : 'spot',
      };
    });

    for (const asset of dcaAssets) {
      if (!allocationMap.find((item) => item.coin === asset)) {
        const dcaPlan = activePlans.find((plan) => plan.assets.some((planAsset) => planAsset.symbol === asset));
        const dcaAlloc = dcaPlan?.assets.find((planAsset) => planAsset.symbol === asset)?.allocation ?? 0;
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

    const pnlPercent = totalCostBasis > 0 ? (totalUnrealizedPnL / totalCostBasis) * 100 : 0;

    return {
      totalEquity,
      totalAvailableBalance,
      totalUnrealizedPnL,
      totalCostBasis,
      pnlPercent,
      grandTotal,
      spotBalance,
      futuresBalance,
      futuresInitialMargin,
      futuresPositionCount,
      futuresNotional,
      futuresMarginBalance,
      futuresMaintenanceMargin,
      futuresUnrealizedPnl,
      futuresPositions,
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
      isConnected: hasExchangeData || hasFallbackData,
      isTestnet: hasExchangeData ? exchange.data?.testnet ?? false : false,
      isLoading: hasExchangeData ? exchange.isLoading : exchange.isLoading && portfolio.loading,
      isRefreshing: exchange.isRefreshing,
      error: hasFallbackData ? null : exchange.error,
      status: hasExchangeData || hasFallbackData ? 'connected' : exchange.status,
      dataSource,
      hasLiveBalance: dataSource === 'exchange',
      refresh: exchange.refresh,
    };
  }, [dcaPlans, exchange, portfolio]);
}
