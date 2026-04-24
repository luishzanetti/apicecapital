// Apex AI — Bybit adapter (Edge-Function-side)
//
// High-level helpers that wrap the primitives in `bybit-api.ts` for the
// specific needs of the Apex AI bot engine:
//
//   - fetchApexAiBalance()   → UNIFIED account balance (USDT) with fallback to CONTRACT
//   - fetchOpenFutures()     → all open perpetual positions for the bot
//   - placeFuturesOrder()    → market-open a position (long/short)
//   - closeFuturesPosition() → market-close an open position
//   - setLeverage()          → set leverage before opening a position
//
// These wrappers are futures-only (category='linear', settleCoin='USDT').
// The generic `bybit-api.ts` primitives handle signing, CORS and shared
// envelope parsing; this module owns the Apex AI business semantics.
//
// Usage (from apex-ai-bot-tick/index.ts):
//   import { fetchOpenFutures, placeFuturesOrder } from '../_shared/apex-ai-bybit.ts';
//
// Reference: Bybit v5 REST API docs.

import { bybitGet, bybitPost } from './bybit-api.ts';

// ─── Types ──────────────────────────────────────────────────

export interface ApexAiBalanceSnapshot {
  accountType: 'UNIFIED' | 'CONTRACT';
  totalEquityUsdt: number;
  totalAvailableBalanceUsdt: number;
  totalUnrealizedPnlUsdt: number;
  totalInitialMarginUsdt: number;
  usdtWalletBalance: number;
  testnet: boolean;
}

export interface ApexAiPositionSnapshot {
  symbol: string;
  side: 'long' | 'short';
  size: number; // in base asset (e.g. BTC units)
  entryPrice: number;
  markPrice: number;
  leverage: number;
  unrealizedPnl: number;
  notionalUsdt: number;
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
  positionIdx: number; // 0 = one-way, 1 = buy hedge, 2 = sell hedge
  createdTime: string | null;
}

export interface PlaceOrderInput {
  symbol: string;
  side: 'long' | 'short';
  qty: number; // in base asset
  leverage: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  reduceOnly?: boolean;
  positionIdx?: number;
  /** Idempotency key — prevents duplicate orders on retry. Max 36 chars. */
  clientOrderId?: string;
}

export interface OrderResult {
  orderId: string;
  orderLinkId: string;
}

// ─── Balance ────────────────────────────────────────────────

export async function fetchApexAiBalance(
  apiKey: string,
  apiSecret: string,
  testnet: boolean
): Promise<ApexAiBalanceSnapshot> {
  // Try UNIFIED first (UTA-upgraded accounts — the Apex AI primary target),
  // then CONTRACT for legacy Standard Accounts. Mirrors the bybit-account
  // probing logic but keeps the response focused on what the bot needs.
  const tryOrder: Array<'UNIFIED' | 'CONTRACT'> = ['UNIFIED', 'CONTRACT'];

  let lastError: Error | null = null;

  for (const accountType of tryOrder) {
    try {
      const res = await bybitGet(
        apiKey,
        apiSecret,
        testnet,
        '/v5/account/wallet-balance',
        { accountType }
      );

      const account = res.list?.[0];
      if (!account) continue;

      const totalEquity = Number(account.totalEquity ?? 0);
      // Accept this account if funded, OR as the last resort if nothing funded
      if (totalEquity > 0 || accountType === tryOrder[tryOrder.length - 1]) {
        const usdtCoin = (account.coin ?? []).find(
          (c: { coin: string; walletBalance: string }) => c.coin === 'USDT'
        );

        return {
          accountType,
          totalEquityUsdt: totalEquity,
          totalAvailableBalanceUsdt: Number(account.totalAvailableBalance ?? 0),
          totalUnrealizedPnlUsdt: Number(account.totalPerpUPL ?? 0),
          totalInitialMarginUsdt: Number(account.totalInitialMargin ?? 0),
          usdtWalletBalance: Number(usdtCoin?.walletBalance ?? 0),
          testnet,
        };
      }
    } catch (err) {
      lastError = err as Error;
    }
  }

  throw lastError ?? new Error('No account data returned');
}

// ─── Positions ──────────────────────────────────────────────

interface BybitPosition {
  symbol: string;
  side: 'Buy' | 'Sell' | ''; // empty when no position
  size: string;
  avgPrice: string;
  markPrice: string;
  leverage: string;
  unrealisedPnl: string;
  positionValue: string;
  stopLoss: string;
  takeProfit: string;
  positionIdx: number;
  createdTime: string;
}

export async function fetchOpenFutures(
  apiKey: string,
  apiSecret: string,
  testnet: boolean,
  symbols?: string[]
): Promise<ApexAiPositionSnapshot[]> {
  const params: Record<string, string> = {
    category: 'linear',
    settleCoin: 'USDT',
  };

  // Bybit allows filtering by symbol but not a list. If specific symbols
  // requested, fetch one by one.
  if (symbols && symbols.length > 0 && symbols.length <= 5) {
    const results = await Promise.all(
      symbols.map((symbol) =>
        bybitGet(apiKey, apiSecret, testnet, '/v5/position/list', {
          ...params,
          symbol,
        }).catch(() => ({ list: [] }))
      )
    );
    return results
      .flatMap((r) => (r.list as BybitPosition[]) ?? [])
      .filter((p) => Number(p.size) > 0)
      .map(mapBybitPosition);
  }

  // Otherwise fetch all linear perpetuals
  const res = await bybitGet(
    apiKey,
    apiSecret,
    testnet,
    '/v5/position/list',
    params
  );
  return ((res.list as BybitPosition[]) ?? [])
    .filter((p) => Number(p.size) > 0)
    .map(mapBybitPosition);
}

function mapBybitPosition(p: BybitPosition): ApexAiPositionSnapshot {
  return {
    symbol: p.symbol,
    side: p.side === 'Buy' ? 'long' : 'short',
    size: Number(p.size),
    entryPrice: Number(p.avgPrice),
    markPrice: Number(p.markPrice),
    leverage: Number(p.leverage),
    unrealizedPnl: Number(p.unrealisedPnl ?? 0),
    notionalUsdt: Number(p.positionValue ?? 0),
    stopLossPrice: p.stopLoss && Number(p.stopLoss) > 0 ? Number(p.stopLoss) : null,
    takeProfitPrice:
      p.takeProfit && Number(p.takeProfit) > 0 ? Number(p.takeProfit) : null,
    positionIdx: p.positionIdx ?? 0,
    createdTime: p.createdTime ?? null,
  };
}

// ─── Leverage ───────────────────────────────────────────────

export async function setLeverage(
  apiKey: string,
  apiSecret: string,
  testnet: boolean,
  symbol: string,
  leverage: number
): Promise<void> {
  try {
    await bybitPost(apiKey, apiSecret, testnet, '/v5/position/set-leverage', {
      category: 'linear',
      symbol,
      buyLeverage: String(leverage),
      sellLeverage: String(leverage),
    });
  } catch (err) {
    // retCode 110043 = "Leverage not modified" — not an error
    const msg = (err as Error).message;
    if (!msg.includes('110043')) throw err;
  }
}

// ─── Orders ─────────────────────────────────────────────────

export async function placeFuturesOrder(
  apiKey: string,
  apiSecret: string,
  testnet: boolean,
  input: PlaceOrderInput
): Promise<OrderResult> {
  // Ensure leverage is set BEFORE placing order
  await setLeverage(apiKey, apiSecret, testnet, input.symbol, input.leverage);

  const body: Record<string, unknown> = {
    category: 'linear',
    symbol: input.symbol,
    side: input.side === 'long' ? 'Buy' : 'Sell',
    orderType: 'Market',
    qty: String(input.qty),
    timeInForce: 'IOC',
    reduceOnly: Boolean(input.reduceOnly),
    positionIdx: input.positionIdx ?? 0,
  };

  if (input.stopLossPrice) {
    body.stopLoss = String(input.stopLossPrice);
  }
  if (input.takeProfitPrice) {
    body.takeProfit = String(input.takeProfitPrice);
  }
  // Idempotency: Bybit dedupe by orderLinkId if provided (max 36 chars).
  // Same orderLinkId → Bybit returns the existing order instead of creating
  // a duplicate — safe retry even if request times out.
  if (input.clientOrderId) {
    body.orderLinkId = input.clientOrderId.slice(0, 36);
  }

  const res = await bybitPost(
    apiKey,
    apiSecret,
    testnet,
    '/v5/order/create',
    body
  );

  return {
    orderId: res.orderId ?? '',
    orderLinkId: res.orderLinkId ?? '',
  };
}

export async function closeFuturesPosition(
  apiKey: string,
  apiSecret: string,
  testnet: boolean,
  symbol: string,
  side: 'long' | 'short',
  qty: number,
  positionIdx?: number
): Promise<OrderResult> {
  // Close = opposite side, reduceOnly=true
  const oppositeSide = side === 'long' ? 'short' : 'long';
  return placeFuturesOrder(apiKey, apiSecret, testnet, {
    symbol,
    side: oppositeSide,
    qty,
    leverage: 1, // irrelevant for close, but setLeverage is idempotent
    reduceOnly: true,
    positionIdx,
  });
}

// ─── Ticker (for mark price) ────────────────────────────────

export async function fetchTicker(
  testnet: boolean,
  symbol: string
): Promise<{ lastPrice: number; markPrice: number; indexPrice: number }> {
  // Public endpoint — no auth needed
  const baseURL = testnet
    ? 'https://api-testnet.bybit.com'
    : 'https://api.bybit.com';
  const res = await fetch(
    `${baseURL}/v5/market/tickers?category=linear&symbol=${symbol}`
  );
  if (!res.ok) throw new Error(`Ticker ${res.status}`);
  const json = await res.json();
  if (json.retCode !== 0) throw new Error(`Ticker ${json.retCode}: ${json.retMsg}`);

  const t = json.result?.list?.[0];
  if (!t) throw new Error(`No ticker for ${symbol}`);

  return {
    lastPrice: Number(t.lastPrice),
    markPrice: Number(t.markPrice),
    indexPrice: Number(t.indexPrice),
  };
}
