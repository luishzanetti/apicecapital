/**
 * Apex AI — Price feed
 *
 * Fetches current mark prices from Bybit's public REST API (no auth required).
 * This is the source of truth for:
 *   - updating `current_price` on open positions
 *   - computing `unrealized_pnl` in real time
 *   - evaluating TP/SL triggers
 *
 * Bybit public endpoint handles 600+ req/sec and doesn't require the user's
 * API key — safe to call directly from the browser.
 *
 * Usage:
 *   const prices = await fetchBybitPrices(['BTCUSDT', 'ETHUSDT']);
 *   // { BTCUSDT: 65234.50, ETHUSDT: 3421.80 }
 */

const BYBIT_PUBLIC_BASE = 'https://api.bybit.com';
// Cache prices for 3s to avoid hammering the API on rapid ticks
const CACHE_TTL_MS = 3000;

interface CachedPrice {
  price: number;
  fetchedAt: number;
}

const priceCache = new Map<string, CachedPrice>();

interface BybitTicker {
  symbol: string;
  markPrice: string;
  lastPrice: string;
  indexPrice: string;
}

interface BybitTickersResponse {
  retCode: number;
  retMsg: string;
  result?: { list: BybitTicker[] };
}

/**
 * Fetch mark prices for a batch of symbols in a single request.
 * Returns a map { symbol → price }. Missing symbols are omitted.
 */
export async function fetchBybitPrices(
  symbols: string[]
): Promise<Record<string, number>> {
  if (symbols.length === 0) return {};

  const now = Date.now();
  const result: Record<string, number> = {};
  const missing: string[] = [];

  // Serve from cache where possible
  for (const symbol of symbols) {
    const cached = priceCache.get(symbol);
    if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
      result[symbol] = cached.price;
    } else {
      missing.push(symbol);
    }
  }

  if (missing.length === 0) return result;

  // Bybit's /v5/market/tickers with category=linear returns ALL tickers at once.
  // Cheaper than N requests for N symbols.
  try {
    const res = await fetch(
      `${BYBIT_PUBLIC_BASE}/v5/market/tickers?category=linear`
    );
    if (!res.ok) throw new Error(`Bybit ticker ${res.status}`);

    const json = (await res.json()) as BybitTickersResponse;
    if (json.retCode !== 0) {
      throw new Error(`Bybit ${json.retCode}: ${json.retMsg}`);
    }

    const list = json.result?.list ?? [];
    for (const ticker of list) {
      const price = Number(ticker.markPrice) || Number(ticker.lastPrice);
      if (price > 0) {
        result[ticker.symbol] = price;
        priceCache.set(ticker.symbol, { price, fetchedAt: now });
      }
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[apex-ai priceFeed] fetch failed, using cache', err);
    }
    // Fall through — return whatever we had cached
  }

  return result;
}

/**
 * Compute unrealized PnL for an open position given current price.
 * Linear perpetual contract: pnl = size * (priceDelta * sign).
 */
export function computeUnrealizedPnl(params: {
  side: 'long' | 'short';
  entryPrice: number;
  currentPrice: number;
  size: number;
}): number {
  const { side, entryPrice, currentPrice, size } = params;
  if (!(entryPrice > 0 && currentPrice > 0 && size > 0)) return 0;
  const delta = currentPrice - entryPrice;
  return side === 'long' ? delta * size : -delta * size;
}

/**
 * Check whether a position should close at current price based on its
 * TP/SL. Returns the trigger type, or null if neither is hit.
 */
export function evaluateExit(params: {
  side: 'long' | 'short';
  currentPrice: number;
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
}): 'take_profit' | 'stop_loss' | null {
  const { side, currentPrice, stopLossPrice, takeProfitPrice } = params;
  if (!(currentPrice > 0)) return null;

  if (side === 'long') {
    if (takeProfitPrice && currentPrice >= takeProfitPrice) return 'take_profit';
    if (stopLossPrice && currentPrice <= stopLossPrice) return 'stop_loss';
  } else {
    if (takeProfitPrice && currentPrice <= takeProfitPrice) return 'take_profit';
    if (stopLossPrice && currentPrice >= stopLossPrice) return 'stop_loss';
  }
  return null;
}
