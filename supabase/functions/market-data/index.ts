// Supabase Edge Function: market-data
// Proxies Bybit V5 API calls server-side to avoid CORS issues and keep API patterns hidden from client
// Usage: POST /functions/v1/market-data { action: "tickers" | "ticker", symbol?: string, limit?: number }

const BYBIT_BASE = 'https://api.bybit.com/v5/market/tickers';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// In-memory cache (persists across warm invocations)
let tickerCache: { data: Record<string, { lastPrice: string; price24hPcnt: string }>; timestamp: number } | null = null;
const CACHE_TTL = 15_000; // 15s server-side cache

const SUPPORTED_SYMBOLS = new Set([
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'DOTUSDT', 'LINKUSDT',
  'MATICUSDT', 'LTCUSDT', 'TRXUSDT', 'SHIBUSDT', 'UNIUSDT',
]);

async function fetchAllTickers(): Promise<Record<string, { lastPrice: string; price24hPcnt: string }>> {
  const now = Date.now();
  if (tickerCache && now - tickerCache.timestamp < CACHE_TTL) {
    return tickerCache.data;
  }

  const res = await fetch(`${BYBIT_BASE}?category=spot`);
  if (!res.ok) {
    throw new Error(`Bybit API returned ${res.status}`);
  }

  const json = await res.json();
  const list: Array<{ symbol: string; lastPrice: string; price24hPcnt: string }> = json?.result?.list || [];

  const results: Record<string, { lastPrice: string; price24hPcnt: string }> = {};
  for (const item of list) {
    if (SUPPORTED_SYMBOLS.has(item.symbol)) {
      results[item.symbol] = { lastPrice: item.lastPrice, price24hPcnt: item.price24hPcnt };
    }
  }

  tickerCache = { data: results, timestamp: now };
  return results;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Verify auth header exists (anon key or JWT)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'tickers';

    if (action === 'tickers') {
      // Bulk fetch — return all supported tickers
      const limit = Math.min(body.limit || 15, 15);
      const tickers = await fetchAllTickers();

      // Return as ordered array matching client expectations
      const symbols = body.symbols as string[] | undefined;
      let result: Record<string, { lastPrice: string; price24hPcnt: string }>;

      if (symbols && Array.isArray(symbols)) {
        result = {};
        for (const sym of symbols) {
          if (tickers[sym]) result[sym] = tickers[sym];
        }
      } else {
        result = tickers;
      }

      return new Response(
        JSON.stringify({ data: result, cached: tickerCache?.timestamp === Date.now() }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=15' } }
      );
    }

    if (action === 'ticker') {
      // Single ticker fetch
      const symbol = body.symbol as string;
      if (!symbol || !SUPPORTED_SYMBOLS.has(symbol)) {
        return new Response(
          JSON.stringify({ error: 'Invalid or unsupported symbol' }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      const tickers = await fetchAllTickers();
      const ticker = tickers[symbol] || null;

      return new Response(
        JSON.stringify({ data: ticker }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=15' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "tickers" or "ticker".' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[market-data] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
