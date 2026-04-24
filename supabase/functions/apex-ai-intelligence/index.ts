// Supabase Edge Function: apex-ai-intelligence
//
// Market intelligence collector for Apex AI v2.0.
//
// Per tick:
//   1. For each symbol with active positions or in symbol universe:
//      - Fetch last 200 hourly candles (CoinGecko OHLC or Bybit public kline)
//      - Compute EMA 50, EMA 200, ADX 14, ATR 14
//      - Detect trend regime (bull/bear/sideways) + volatility regime (low/med/high)
//      - Fetch funding rate + open interest (Bybit public)
//   2. Upsert apex_ai_regime_state + apex_ai_symbol_intelligence
//
// Called every 5 minutes by its own pg_cron job (see migration 016).
//
// Intelligence fuels the bot-tick's strategy decisions:
//   - In high-volatility regime: reduce leverage, wider grid spacing
//   - In trending regime: bias strategy (full long in bull, full short in bear)
//   - In sideways: full hedge grid
//   - High funding rate: open funding arbitrage trade

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/bybit-api.ts';

const CORS_HEADERS = getCorsHeaders();
const BYBIT_PUBLIC = 'https://api.bybit.com';

// Symbols tracked. Extend as needed.
const UNIVERSE = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
  'AVAXUSDT', 'LINKUSDT', 'ARBUSDT', 'DOGEUSDT',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const start = Date.now();
    const results: Array<Record<string, unknown>> = [];

    // Process symbols in parallel (batches of 3 to be nice to APIs)
    const batches: string[][] = [];
    for (let i = 0; i < UNIVERSE.length; i += 3) {
      batches.push(UNIVERSE.slice(i, i + 3));
    }

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map((symbol) => processSymbol(supabase, symbol))
      );
      batchResults.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          results.push({ symbol: batch[i], ...r.value });
        } else {
          results.push({ symbol: batch[i], error: String(r.reason) });
        }
      });
    }

    return json({
      success: true,
      data: {
        processed: results.length,
        elapsed_ms: Date.now() - start,
        results,
      },
    });
  } catch (error) {
    console.error('[apex-ai-intelligence] exception', error);
    return json({ success: false, error: error instanceof Error ? error.message : 'error' }, 500);
  }
});

async function processSymbol(
  supabase: ReturnType<typeof createClient>,
  symbol: string
): Promise<Record<string, unknown>> {
  // 1. Fetch recent kline data (Bybit works here on public endpoint for datacenter sometimes,
  //    fallback to CoinGecko ohlc if it fails)
  const candles = await fetchCandles(symbol);
  if (candles.length < 30) {
    return { skipped: true, reason: 'insufficient_candles', got: candles.length };
  }

  // 2. Compute indicators
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  // V3 multi-signal: EMA + SMA + RSI + ATR + ADX + volume
  const ema50 = ema(closes, Math.min(50, Math.floor(closes.length / 3)));
  const ema200 = ema(closes, Math.min(200, Math.floor(closes.length * 0.8)));
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, Math.min(200, closes.length - 5));
  const atr14 = atr(highs, lows, closes, 14);
  const adx14 = adx(highs, lows, closes, 14);
  const rsi14 = rsi(closes, 14);
  const volumes = candles.map((c) => c.volume).filter((v) => v > 0);
  const volRatio = volumes.length >= 20
    ? volumes[volumes.length - 1] / (volumes.slice(-20).reduce((a, b) => a + b, 0) / 20)
    : 1;

  const currentPrice = closes[closes.length - 1];
  const atrPct = (atr14 / currentPrice) * 100;

  // 3. Detect regimes (now with high_volatility as a separate regime)
  const trendRegime = detectTrendRegime(ema50, ema200, adx14, atrPct);
  const volatilityRegime = detectVolatilityRegime(atrPct);

  // 4. Fetch funding rate
  const funding = await fetchFundingRate(symbol).catch(() => null);

  // V3: confidence score for regime detection (0-100)
  // Higher when ADX is strong + EMAs aligned + RSI not extreme
  const adxComponent = Math.min(adx14, 50) * 1.5; // up to 75
  const emaAligned = (trendRegime === 'bull_trending' && ema50 > ema200) ||
    (trendRegime === 'bear_trending' && ema50 < ema200) ||
    trendRegime === 'sideways';
  const regimeScore = Math.min(100, adxComponent + (emaAligned ? 15 : 0) +
    (rsi14 >= 30 && rsi14 <= 70 ? 10 : 0));

  // 5. Upsert regime_state with full multi-signal payload
  await supabase.from('apex_ai_regime_state').upsert(
    {
      symbol,
      trend_regime: trendRegime,
      volatility_regime: volatilityRegime,
      ema_50: ema50,
      ema_200: ema200,
      adx_14: adx14,
      atr_14: atr14,
      atr_pct: atrPct,
      rsi_14: rsi14,
      sma_20: sma20,
      sma_50: sma50,
      sma_200: sma200,
      volume_ratio: volRatio,
      regime_score: regimeScore,
      detected_at: new Date().toISOString(),
    },
    { onConflict: 'symbol' }
  );

  // 6. Upsert symbol_intelligence
  await supabase.from('apex_ai_symbol_intelligence').upsert(
    {
      symbol,
      current_price: currentPrice,
      funding_rate: funding?.rate ?? null,
      next_funding_at: funding?.nextAt ?? null,
      volume_24h_usd: funding?.volume ?? null,
      open_interest_usd: funding?.oi ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'symbol' }
  );

  return {
    trend: trendRegime,
    volatility: volatilityRegime,
    atr_pct: Number(atrPct.toFixed(2)),
    rsi: Number(rsi14.toFixed(1)),
    regime_score: Number(regimeScore.toFixed(0)),
    funding_rate: funding?.rate,
  };
}

// ─── Indicators ──────────────────────────────────────────────

function ema(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1] ?? 0;
  const k = 2 / (period + 1);
  let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
  }
  return ema;
}

function sma(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1] ?? 0;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function rsi(closes: number[], period: number): number {
  if (closes.length < period + 1) return 50;
  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gainSum += diff;
    else lossSum += -diff;
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function atr(highs: number[], lows: number[], closes: number[], period: number): number {
  if (highs.length < period + 1) return 0;
  const trs: number[] = [];
  for (let i = 1; i < highs.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trs.push(tr);
  }
  // Wilder's smoothing
  let a = trs.slice(0, period).reduce((x, y) => x + y, 0) / period;
  for (let i = period; i < trs.length; i++) {
    a = (a * (period - 1) + trs[i]) / period;
  }
  return a;
}

function adx(highs: number[], lows: number[], closes: number[], period: number): number {
  if (highs.length < period * 2) return 0;

  const tr: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < highs.length; i++) {
    tr.push(
      Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      )
    );
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  const smooth = (arr: number[]) => {
    let s = arr.slice(0, period).reduce((x, y) => x + y, 0);
    const out = [s];
    for (let i = period; i < arr.length; i++) {
      s = s - s / period + arr[i];
      out.push(s);
    }
    return out;
  };

  const smTR = smooth(tr);
  const smPDM = smooth(plusDM);
  const smMDM = smooth(minusDM);

  const dx: number[] = [];
  for (let i = 0; i < smTR.length; i++) {
    const pdi = (smPDM[i] / smTR[i]) * 100;
    const mdi = (smMDM[i] / smTR[i]) * 100;
    const d = Math.abs(pdi - mdi) / (pdi + mdi || 1) * 100;
    dx.push(d);
  }

  if (dx.length < period) return dx[dx.length - 1] ?? 0;
  let a = dx.slice(0, period).reduce((x, y) => x + y, 0) / period;
  for (let i = period; i < dx.length; i++) a = (a * (period - 1) + dx[i]) / period;
  return a;
}

// ─── Regime detection ───────────────────────────────────────

function detectTrendRegime(
  ema50: number,
  ema200: number,
  adx14: number,
  atrPct: number
): 'bull_trending' | 'bear_trending' | 'sideways' | 'high_volatility' | 'unknown' {
  if (!ema50 || !ema200) return 'unknown';

  // V3: high volatility takes precedence over trend (capital protection mode)
  if (atrPct >= 4.0) return 'high_volatility';

  const trendStrong = adx14 > 25;
  const trendSideways = adx14 < 20;
  const bullish = ema50 > ema200;

  if (trendSideways) return 'sideways';
  if (trendStrong && bullish) return 'bull_trending';
  if (trendStrong && !bullish) return 'bear_trending';
  return 'sideways';
}

function detectVolatilityRegime(atrPct: number): 'low' | 'medium' | 'high' {
  if (atrPct < 1.5) return 'low';
  if (atrPct < 3.0) return 'medium';
  return 'high';
}

// ─── Data fetchers ──────────────────────────────────────────

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

async function fetchCandles(symbol: string): Promise<Candle[]> {
  // Try Bybit public kline (200 hourly candles)
  try {
    const url = `${BYBIT_PUBLIC}/v5/market/kline?category=linear&symbol=${symbol}&interval=60&limit=200`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.retCode === 0 && json.result?.list) {
        // Bybit returns newest first — reverse for chronological order
        return json.result.list
          .slice()
          .reverse()
          .map((row: string[]) => ({
            open: Number(row[1]),
            high: Number(row[2]),
            low: Number(row[3]),
            close: Number(row[4]),
            volume: Number(row[5]),
          }));
      }
    }
  } catch {
    /* fallthrough */
  }

  // Fallback: CoinGecko OHLC. Note: CoinGecko uses variable intervals:
  // - days=1-2 → 30min candles
  // - days=3-30 → 4h candles (~180 points at 30 days)
  // - days=31+ → 4d candles
  // Use 30d to get enough candles for EMA200 (need >= 30)
  const coinId = COINGECKO_IDS[symbol];
  if (!coinId) return [];
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=30`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<[number, number, number, number, number]>;
    return data.map((row) => ({
      open: row[1],
      high: row[2],
      low: row[3],
      close: row[4],
      volume: 0,
    }));
  } catch {
    return [];
  }
}

const COINGECKO_IDS: Record<string, string> = {
  BTCUSDT: 'bitcoin',
  ETHUSDT: 'ethereum',
  SOLUSDT: 'solana',
  BNBUSDT: 'binancecoin',
  XRPUSDT: 'ripple',
  AVAXUSDT: 'avalanche-2',
  LINKUSDT: 'chainlink',
  ARBUSDT: 'arbitrum',
  DOGEUSDT: 'dogecoin',
};

async function fetchFundingRate(symbol: string): Promise<{
  rate: number;
  nextAt: string | null;
  volume: number | null;
  oi: number | null;
} | null> {
  // Bybit first (with browser UA to bypass WAF)
  try {
    const url = `${BYBIT_PUBLIC}/v5/market/tickers?category=linear&symbol=${symbol}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.retCode === 0 && json.result?.list?.[0]) {
        const t = json.result.list[0];
        return {
          rate: Number(t.fundingRate),
          nextAt: t.nextFundingTime ? new Date(Number(t.nextFundingTime)).toISOString() : null,
          volume: Number(t.volume24h) * Number(t.lastPrice),
          oi: Number(t.openInterestValue),
        };
      }
    }
  } catch { /* fall through */ }

  // Binance fallback (has funding rate + volume for USDT-M perps)
  try {
    const [premRes, tickerRes] = await Promise.all([
      fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      }),
      fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      }),
    ]);

    if (premRes.ok) {
      const prem = await premRes.json();
      let volume: number | null = null;
      if (tickerRes.ok) {
        const ticker = await tickerRes.json();
        volume = Number(ticker.quoteVolume);
      }
      return {
        rate: Number(prem.lastFundingRate),
        nextAt: prem.nextFundingTime ? new Date(Number(prem.nextFundingTime)).toISOString() : null,
        volume,
        oi: null,
      };
    }
  } catch { /* fall through */ }

  return null;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
