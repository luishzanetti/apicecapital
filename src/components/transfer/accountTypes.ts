// Shared account metadata for the transfer UI.
// Matches the account types accepted by Bybit's /v5/asset/transfer/inter-transfer API
// and the fields returned by useExchangeBalance().

import type { ExchangeBalance } from '@/hooks/useExchangeBalance';

export type BybitAccountType = 'SPOT' | 'UNIFIED' | 'FUND' | 'CONTRACT';

export interface AccountOption {
  value: BybitAccountType;
  label: string;
  description: string;
}

export const ACCOUNT_OPTIONS: AccountOption[] = [
  {
    value: 'SPOT',
    label: 'Spot',
    description: 'Standard trading wallet',
  },
  {
    value: 'UNIFIED',
    label: 'Unified (AI Trade)',
    description: 'Cross-margin trading capital',
  },
  {
    value: 'FUND',
    label: 'Funding (DCA)',
    description: 'Savings and DCA reserves',
  },
  {
    value: 'CONTRACT',
    label: 'Contract',
    description: 'Derivatives margin wallet',
  },
];

export interface SupportedCoin {
  symbol: string;
  label: string;
}

export const SUPPORTED_COINS: SupportedCoin[] = [
  { symbol: 'USDT', label: 'Tether USD' },
  { symbol: 'USDC', label: 'USD Coin' },
  { symbol: 'BTC', label: 'Bitcoin' },
  { symbol: 'ETH', label: 'Ethereum' },
];

/**
 * Resolve the available balance for a given account + coin from an ExchangeBalance snapshot.
 * Falls back to 0 when the information is not present.
 */
export function getAccountCoinBalance(
  balance: ExchangeBalance | null,
  account: BybitAccountType,
  coin: string
): number {
  if (!balance) return 0;

  if (account === 'FUND') {
    const holding = balance.fundingHoldings?.find((h) => h.coin === coin);
    return holding?.balance ?? 0;
  }

  // SPOT, UNIFIED, and CONTRACT balances surface through `holdings` in the
  // ExchangeBalance payload.
  const holding = balance.holdings?.find((h) => h.coin === coin);
  if (!holding) return 0;

  return holding.availableToWithdraw ?? holding.balance ?? 0;
}

/**
 * Total USD-equivalent balance on an account (used for display labels in dropdowns).
 */
export function getAccountTotalUsd(
  balance: ExchangeBalance | null,
  account: BybitAccountType
): number {
  if (!balance) return 0;

  switch (account) {
    case 'SPOT':
      return balance.spotBalance ?? 0;
    case 'UNIFIED':
      // Unified equity excluding the futures book — closest to "spendable" unified USD.
      return balance.totalAvailableBalance ?? 0;
    case 'FUND':
      return balance.fundingBalance ?? 0;
    case 'CONTRACT':
      return balance.futuresMarginBalance ?? 0;
    default:
      return 0;
  }
}
