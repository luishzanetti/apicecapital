// Supabase Edge Function: market-data
// Proxies Bybit V5 API calls server-side to avoid CORS issues and keep API patterns hidden from client
// Usage: POST /functions/v1/market-data { action: "tickers" | "ticker", symbol?: string, limit?: number }

const BYBIT_BASE = 'https://api.bybit.com/v5/market/tickers';

function getCorsHeaders(req?: Request): Record<string, string> {
  const allowedOrigins = [
    Deno.env.get('ALLOWED_ORIGIN'),
    'http://localhost:8080', 'http://localhost:8081',
    'http://localhost:5173', 'http://localhost:3000',
  ].filter(Boolean) as string[];
  const origin = req?.headers.get('origin') || '';
  const allowOrigin = allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] || '*');
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// In-memory cache (persists across warm invocations)
let tickerCache: { data: Record<string, { lastPrice: string; price24hPcnt: string }>; timestamp: number } | null = null;
const CACHE_TTL = 15_000; // 15s server-side cache

const SUPPORTED_SYMBOLS = new Set([
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'DOTUSDT', 'LINKUSDT',
  'MATICUSDT', 'LTCUSDT', 'TRXUSDT', 'SHIBUSDT', 'UNIUSDT',
]);

// ─── Rate Limiting ───────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60; // requests per minute
const RATE_WINDOW = 60_000; // 1 minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

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
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify auth header exists (anon key or JWT)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    let userId = 'anonymous';
    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub || 'anonymous';
    } catch { /* fall back to anonymous rate limiting */ }

    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        JSON.stringify({ data: result, cached: !!(tickerCache && Date.now() - tickerCache.timestamp < CACHE_TTL) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=15' } }
      );
    }

    if (action === 'ticker') {
      // Single ticker fetch
      const symbol = body.symbol as string;
      if (!symbol || !SUPPORTED_SYMBOLS.has(symbol)) {
        return new Response(
          JSON.stringify({ error: 'Invalid or unsupported symbol' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tickers = await fetchAllTickers();
      const ticker = tickers[symbol] || null;

      return new Response(
        JSON.stringify({ data: ticker }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=15' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "tickers" or "ticker".' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[market-data] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
