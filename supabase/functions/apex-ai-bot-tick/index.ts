// Supabase Edge Function: apex-ai-bot-tick
//
// Server-side bot engine for Apex AI. Invoked by pg_cron every ~60s per
// active portfolio (see migration 013_apex_ai_cron.sql). When invoked:
//
//   1. Load portfolio + active symbols + user API credentials (if any)
//   2. Circuit breaker check (drawdown 24h > trigger_pct → pause)
//   3. Fetch current Bybit mark prices (public API, no auth)
//   4. For each open simulated position:
//      - Update current_price + unrealized_pnl
//      - If TP/SL hit: close position + create trade + charge gas fee + re-open hedge leg
//   5. Log tick to apex_ai_bot_logs
//
// Modes:
//   - 'simulate' (default): all operations in DB, Bybit for prices only
//   - 'live' (future): real Bybit orders using user's encrypted API key
//
// The client-side ticker (useApexAiTicker) remains as a UI refresher but
// the server-side tick is authoritative for position lifecycle.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/bybit-api.ts';
import { aesDecryptAsync } from '../_shared/crypto.ts';
import {
  fetchApexAiBalance,
  fetchOpenFutures,
  placeFuturesOrder,
  closeFuturesPosition,
  setLeverage,
} from '../_shared/apex-ai-bybit.ts';

const CORS_HEADERS = getCorsHeaders();
const FEE_RATE_PCT = 10.0;
const DEFAULT_DRAWDOWN_TRIGGER_PCT = 20.0;

// Bybit public tickers endpoint (no auth needed)
const BYBIT_PUBLIC_BASE = 'https://api.bybit.com';

interface BotTickRequest {
  portfolio_id: string;
  bootstrap?: boolean;
  mode?: 'simulate' | 'live' | 'auto';
}

interface BybitTicker {
  symbol: string;
  markPrice: string;
  lastPrice: string;
}

interface ApexAiPosition {
  id: string;
  portfolio_id: string;
  user_id: string;
  symbol: string;
  side: 'long' | 'short';
  entry_price: number | string;
  current_price: number | string | null;
  size: number | string;
  leverage: number;
  unrealized_pnl: number | string;
  realized_pnl: number | string;
  stop_loss_price: number | string | null;
  take_profit_price: number | string | null;
  status: string;
  exchange_position_id: string | null;
  opened_at: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const startTime = Date.now();

  try {
    // Service-role client bypasses RLS (needed for writes to logs + trades)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const body = (await req.json()) as BotTickRequest;
    if (!body.portfolio_id) {
      return json({ success: false, error: 'portfolio_id required' }, 400);
    }

    // ─── 1. Load portfolio ───────────────────────────
    const { data: portfolio, error: pErr } = await supabase
      .from('apex_ai_portfolios')
      .select('*')
      .eq('id', body.portfolio_id)
      .single();

    if (pErr || !portfolio) {
      return json({ success: false, error: 'portfolio not found' }, 404);
    }

    // Skip if not active (saves compute)
    if (portfolio.status !== 'active') {
      return json({
        success: true,
        data: {
          portfolio_id: body.portfolio_id,
          skipped: true,
          reason: `status=${portfolio.status}`,
        },
      });
    }

    // ─── 2. Circuit breaker ─────────────────────────
    const currentEquity =
      Number(portfolio.capital_usdt) + Number(portfolio.total_pnl);
    const hwm =
      Number(portfolio.drawdown_high_water_mark ?? portfolio.capital_usdt) ||
      currentEquity;
    const drawdownPct = hwm > 0 ? ((hwm - currentEquity) / hwm) * 100 : 0;
    const trigger = Number(
      portfolio.drawdown_24h_trigger_pct ?? DEFAULT_DRAWDOWN_TRIGGER_PCT
    );

    if (drawdownPct >= trigger) {
      await supabase
        .from('apex_ai_portfolios')
        .update({ status: 'circuit_breaker' })
        .eq('id', portfolio.id);

      await logEvent(supabase, portfolio.id, 'critical', 'circuit_breaker_triggered', {
        drawdown_pct: drawdownPct,
        trigger_pct: trigger,
      });

      return json({
        success: true,
        data: {
          portfolio_id: body.portfolio_id,
          circuit_breaker_triggered: true,
          drawdown_pct: drawdownPct,
        },
      });
    }

    // ─── 3. Load positions + symbols ────────────────
    const [positionsRes, symbolsRes] = await Promise.all([
      supabase
        .from('apex_ai_positions')
        .select('*')
        .eq('portfolio_id', portfolio.id)
        .eq('status', 'open'),
      supabase
        .from('apex_ai_symbols')
        .select('*')
        .eq('portfolio_id', portfolio.id)
        .eq('is_active', true),
    ]);

    const positions = (positionsRes.data ?? []) as ApexAiPosition[];
    const symbols = symbolsRes.data ?? [];

    if (symbols.length === 0) {
      await logEvent(supabase, portfolio.id, 'warning', 'no_active_symbols', null);
      return json({
        success: true,
        data: { portfolio_id: body.portfolio_id, no_symbols: true },
      });
    }

    // ─── 3.5. Detect execution mode (LIVE vs SIMULATE) ───
    // Load user's Bybit credentials (if any). If present + non-empty, we run
    // in LIVE mode: real orders on Bybit testnet/mainnet per their testnet flag.
    const creds = await loadBybitCredentials(supabase, portfolio.user_id);
    const requestedMode = body.mode ?? 'auto';
    const mode: 'live' | 'simulate' =
      requestedMode === 'simulate'
        ? 'simulate'
        : requestedMode === 'live'
        ? 'live'
        : creds
        ? 'live'
        : 'simulate';

    if (import.meta.env?.DEV ?? false) {
      console.info('[apex-ai-bot-tick] mode detected', {
        portfolio_id: portfolio.id,
        mode,
        has_credentials: !!creds,
        testnet: creds?.testnet ?? null,
      });
    }

    // ─── 4. Bootstrap (if requested) ────────────────
    if (body.bootstrap === true && positions.length === 0) {
      let opened = 0;
      if (mode === 'live' && creds) {
        opened = await bootstrapLiveHedgePositions(supabase, portfolio, symbols, creds);
        await logEvent(supabase, portfolio.id, 'info', 'bootstrap_opened_live', {
          positions_opened: opened,
          testnet: creds.testnet,
        });
      } else {
        opened = await bootstrapHedgePositions(supabase, portfolio, symbols);
        await logEvent(supabase, portfolio.id, 'info', 'bootstrap_opened_simulated', {
          positions_opened: opened,
        });
      }

      return json({
        success: true,
        data: {
          portfolio_id: body.portfolio_id,
          bootstrap: true,
          mode,
          actions: Array(opened).fill({ type: 'open_position' }),
        },
      });
    }

    // ─── 5. Fetch prices for all open positions ─────
    const uniqueSymbols = Array.from(new Set(positions.map((p) => p.symbol)));
    const { prices, errors: priceErrors } = await fetchBybitTickers(uniqueSymbols);

    if (Object.keys(prices).length === 0) {
      await logEvent(supabase, portfolio.id, 'error', 'price_fetch_failed', {
        requested_symbols: uniqueSymbols,
        errors: priceErrors.slice(0, 5),
      });
    }

    // ─── 6. Tick each position ──────────────────────
    const actions: Array<Record<string, unknown>> = [];
    const updates: Array<Promise<unknown>> = [];
    const toClose: Array<{
      position: ApexAiPosition;
      exitPrice: number;
      trigger: 'take_profit';
    }> = [];

    for (const pos of positions) {
      // Only process simulated positions here. Real positions require
      // full Bybit API sync (fetchOpenFutures from _shared/apex-ai-bybit.ts)
      // which is the 'live' mode — future Story 4.1 scope.
      if (!(pos.exchange_position_id ?? '').startsWith('sim-')) continue;

      const currentPrice = prices[pos.symbol];
      if (!currentPrice) continue;

      const entryPrice = Number(pos.entry_price);
      const size = Number(pos.size);
      const unrealizedPnl =
        pos.side === 'long'
          ? (currentPrice - entryPrice) * size
          : (entryPrice - currentPrice) * size;

      const tpPrice = pos.take_profit_price ? Number(pos.take_profit_price) : null;
      const slPrice = pos.stop_loss_price ? Number(pos.stop_loss_price) : null;

      // MARTINGALE STRATEGY: NEVER close at loss (stop_loss).
      // Only close on take_profit (individual TP per layer). The RPC
      // apex_ai_close_position_group additionally enforces "only close when
      // aggregate PnL > 0" for safety.
      let exitTrigger: 'take_profit' | null = null;
      if (pos.side === 'long') {
        if (tpPrice && currentPrice >= tpPrice) exitTrigger = 'take_profit';
        // SL hit → do NOT close. Bot will open next martingale layer instead.
      } else {
        if (tpPrice && currentPrice <= tpPrice) exitTrigger = 'take_profit';
        // SL hit → do NOT close. Bot will open next martingale layer instead.
      }

      if (exitTrigger) {
        toClose.push({ position: pos, exitPrice: currentPrice, trigger: exitTrigger });
      } else {
        updates.push(
          supabase
            .from('apex_ai_positions')
            .update({
              current_price: currentPrice,
              unrealized_pnl: unrealizedPnl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', pos.id)
            .eq('status', 'open') // idempotency guard
        );
        actions.push({
          type: 'pnl_update',
          symbol: pos.symbol,
          side: pos.side,
          unrealized_pnl: unrealizedPnl,
        });
      }
    }

    // Run PnL updates in parallel
    await Promise.allSettled(updates);

    // Close triggered positions sequentially (order matters for credits)
    for (const { position, exitPrice, trigger } of toClose) {
      const closed = await closePositionAndRecord(
        supabase,
        position,
        exitPrice,
        trigger
      );
      if (closed) {
        actions.push({
          type: 'position_closed',
          symbol: position.symbol,
          side: position.side,
          trigger,
          pnl: closed.pnl,
        });

        // Re-open hedge leg if portfolio still active
        const { data: fresh } = await supabase
          .from('apex_ai_portfolios')
          .select('status')
          .eq('id', portfolio.id)
          .single();

        if (fresh?.status === 'active') {
          const symbolConfig = symbols.find((s) => s.symbol === position.symbol);
          if (symbolConfig) {
            await reopenHedgeLeg(
              supabase,
              portfolio,
              position,
              exitPrice,
              symbolConfig
            );
            actions.push({
              type: 'position_reopened',
              symbol: position.symbol,
              side: position.side,
              entry_price: exitPrice,
            });
          }
        }
      }
    }

    // ─── 7. Update last_tick_at + log ───────────────
    await supabase
      .from('apex_ai_portfolios')
      .update({ last_tick_at: new Date().toISOString() })
      .eq('id', portfolio.id);

    const elapsedMs = Date.now() - startTime;
    await logEvent(supabase, portfolio.id, 'info', 'tick_completed', {
      elapsed_ms: elapsedMs,
      positions_touched: positions.length,
      updates_count: updates.length,
      closed_count: toClose.length,
      prices_fetched: Object.keys(prices).length,
      price_errors: priceErrors.slice(0, 3),
    });

    return json({
      success: true,
      data: {
        portfolio_id: body.portfolio_id,
        ticked_at: new Date().toISOString(),
        elapsed_ms: elapsedMs,
        actions,
      },
    });
  } catch (error) {
    console.error('[apex-ai-bot-tick] exception', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal error',
      },
      500
    );
  }
});

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// LIVE mode helpers — real Bybit order execution
// ═══════════════════════════════════════════════════════════════════

interface BybitCreds {
  apiKey: string;
  apiSecret: string;
  testnet: boolean;
}

async function loadBybitCredentials(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<BybitCreds | null> {
  try {
    const { data, error } = await supabase
      .from('bybit_credentials')
      .select('api_key, api_secret_encrypted, testnet')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data?.api_key || !data?.api_secret_encrypted) return null;

    const encryptionKey = Deno.env.get('ENCRYPTION_KEY');
    if (!encryptionKey) {
      console.error('[apex-ai-bot-tick] ENCRYPTION_KEY not configured');
      return null;
    }

    const apiSecret = await aesDecryptAsync(data.api_secret_encrypted, encryptionKey);
    return {
      apiKey: data.api_key,
      apiSecret,
      testnet: data.testnet ?? false,
    };
  } catch (err) {
    console.error('[apex-ai-bot-tick] credential decrypt error', err);
    return null;
  }
}

/**
 * Bootstrap with REAL Bybit orders. For each active symbol:
 *   - Ensure leverage set
 *   - Open LONG + SHORT legs via market order (hedge mode)
 *   - Record the real position in DB with exchange_position_id = order_id
 *
 * Uses the linear perp category on Bybit v5.
 */
async function bootstrapLiveHedgePositions(
  supabase: ReturnType<typeof createClient>,
  portfolio: {
    id: string;
    user_id: string;
    capital_usdt: number | string;
    max_leverage: number;
  },
  symbols: Array<{
    symbol: string;
    allocation_pct: number | string;
    leverage: number;
  }>,
  creds: BybitCreds
): Promise<number> {
  let opened = 0;
  const now = new Date().toISOString();

  // Fetch prices from Bybit (since we have creds, we can use auth endpoint)
  const uniqueSymbols = Array.from(new Set(symbols.map((s) => s.symbol)));
  const { prices } = await fetchBybitTickers(uniqueSymbols);

  for (const s of symbols) {
    const price = prices[s.symbol];
    if (!price) {
      console.warn('[apex-ai-bot-tick] skip bootstrap, no price', s.symbol);
      continue;
    }

    const leverage = Math.min(s.leverage, portfolio.max_leverage);
    const allocated = (Number(portfolio.capital_usdt) * Number(s.allocation_pct)) / 100;
    const perSide = allocated / 2;
    const qty = roundQty((perSide * leverage) / price, s.symbol);

    if (qty <= 0) continue;

    // Set leverage (idempotent)
    try {
      await setLeverage(creds.apiKey, creds.apiSecret, creds.testnet, s.symbol, leverage);
    } catch (err) {
      console.warn('[apex-ai-bot-tick] setLeverage failed', s.symbol, err);
    }

    // LONG leg
    try {
      const longOrder = await placeFuturesOrder(creds.apiKey, creds.apiSecret, creds.testnet, {
        symbol: s.symbol,
        side: 'long',
        qty,
        leverage,
        stopLossPrice: price * 0.975,
        takeProfitPrice: price * 1.04,
        positionIdx: 1, // hedge mode: buy
      });
      await supabase.from('apex_ai_positions').insert({
        portfolio_id: portfolio.id,
        user_id: portfolio.user_id,
        symbol: s.symbol,
        side: 'long',
        entry_price: price,
        current_price: price,
        size: qty,
        leverage,
        unrealized_pnl: 0,
        realized_pnl: 0,
        stop_loss_price: price * 0.975,
        take_profit_price: price * 1.04,
        status: 'open',
        exchange_position_id: longOrder.orderId, // real Bybit order id
        opened_at: now,
      });
      opened++;
    } catch (err) {
      console.error('[apex-ai-bot-tick] LONG order failed', s.symbol, err);
      await logEvent(supabase, portfolio.id, 'error', 'live_order_failed', {
        symbol: s.symbol,
        side: 'long',
        error: (err as Error).message,
      });
    }

    // SHORT leg
    try {
      const shortOrder = await placeFuturesOrder(creds.apiKey, creds.apiSecret, creds.testnet, {
        symbol: s.symbol,
        side: 'short',
        qty,
        leverage,
        stopLossPrice: price * 1.025,
        takeProfitPrice: price * 0.96,
        positionIdx: 2, // hedge mode: sell
      });
      await supabase.from('apex_ai_positions').insert({
        portfolio_id: portfolio.id,
        user_id: portfolio.user_id,
        symbol: s.symbol,
        side: 'short',
        entry_price: price,
        current_price: price,
        size: qty,
        leverage,
        unrealized_pnl: 0,
        realized_pnl: 0,
        stop_loss_price: price * 1.025,
        take_profit_price: price * 0.96,
        status: 'open',
        exchange_position_id: shortOrder.orderId,
        opened_at: now,
      });
      opened++;
    } catch (err) {
      console.error('[apex-ai-bot-tick] SHORT order failed', s.symbol, err);
      await logEvent(supabase, portfolio.id, 'error', 'live_order_failed', {
        symbol: s.symbol,
        side: 'short',
        error: (err as Error).message,
      });
    }
  }

  return opened;
}

/**
 * Bybit lot size rounding. Simplified per-symbol rules.
 * For BTC: step = 0.001. For ETH: 0.01. For others: 1.
 * TODO: fetch instrument info from Bybit for exact rules.
 */
function roundQty(qty: number, symbol: string): number {
  const rules: Record<string, number> = {
    BTCUSDT: 0.001,
    ETHUSDT: 0.01,
    SOLUSDT: 0.1,
    BNBUSDT: 0.01,
    XRPUSDT: 1,
    AVAXUSDT: 0.1,
    LINKUSDT: 0.1,
    ARBUSDT: 1,
    DOGEUSDT: 1,
  };
  const step = rules[symbol] ?? 0.01;
  return Math.floor(qty / step) * step;
}

// ═══════════════════════════════════════════════════════════════════

async function fetchBybitTickers(
  symbols: string[]
): Promise<{ prices: Record<string, number>; errors: string[] }> {
  if (symbols.length === 0) return { prices: {}, errors: [] };

  // Per-symbol fetch in parallel. Each response is ~1KB (vs ~440KB for the
  // full list) so this is faster, cheaper and more resilient: if one symbol
  // fails, others still succeed.
  const results = await Promise.allSettled(
    symbols.map((symbol) => fetchOneTicker(symbol))
  );

  const prices: Record<string, number> = {};
  const errors: string[] = [];

  results.forEach((r, i) => {
    const symbol = symbols[i];
    if (r.status === 'fulfilled' && r.value > 0) {
      prices[symbol] = r.value;
    } else if (r.status === 'rejected') {
      errors.push(`${symbol}: ${r.reason}`);
    }
  });

  return { prices, errors };
}

async function fetchOneTicker(symbol: string): Promise<number> {
  // Cascade: Bybit → Binance → CoinGecko. Datacenter IPs (Supabase/AWS)
  // often get 403 from Bybit/Binance; CoinGecko allows datacenter traffic
  // and covers all major pairs. Accuracy is ~spot price (close to perp for
  // major symbols). First successful source wins.
  const errors: string[] = [];

  try {
    return await fetchBybitTickerWithHeaders(symbol);
  } catch (err) {
    errors.push(`bybit: ${err instanceof Error ? err.message : err}`);
  }

  try {
    return await fetchBinanceTicker(symbol);
  } catch (err) {
    errors.push(`binance: ${err instanceof Error ? err.message : err}`);
  }

  try {
    return await fetchCoingeckoTicker(symbol);
  } catch (err) {
    errors.push(`coingecko: ${err instanceof Error ? err.message : err}`);
  }

  throw new Error(errors.join(' | '));
}

async function fetchBybitTickerWithHeaders(symbol: string): Promise<number> {
  const url = `${BYBIT_PUBLIC_BASE}/v5/market/tickers?category=linear&symbol=${symbol}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.retCode !== 0) throw new Error(`Bybit ${json.retCode}: ${json.retMsg}`);
  const ticker: BybitTicker | undefined = json.result?.list?.[0];
  if (!ticker) throw new Error('no ticker in response');
  const price = Number(ticker.markPrice) || Number(ticker.lastPrice);
  if (!(price > 0)) throw new Error(`invalid price: ${ticker.markPrice}`);
  return price;
}

/**
 * Fallback 1: Binance public futures ticker endpoint.
 * Historically permissive to datacenter IPs but has been tightening.
 * Note: Bybit and Binance symbol names are identical for major pairs.
 */
async function fetchBinanceTicker(symbol: string): Promise<number> {
  const url = `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const price = Number(json.price);
  if (!(price > 0)) throw new Error(`invalid price: ${json.price}`);
  return price;
}

/**
 * Fallback 2: CoinGecko public /simple/price endpoint.
 * Accepts all traffic (datacenter OK), rate-limited but sufficient for our
 * once-per-minute per-portfolio needs. Returns spot price, not perp — close
 * enough for simulation (drift < 0.1% on major pairs in normal conditions).
 *
 * Symbol mapping: we strip the "USDT" suffix and look up the CoinGecko ID.
 */
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

async function fetchCoingeckoTicker(symbol: string): Promise<number> {
  const coinId = COINGECKO_IDS[symbol];
  if (!coinId) throw new Error(`unmapped symbol: ${symbol}`);
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const price = Number(json[coinId]?.usd);
  if (!(price > 0)) throw new Error(`invalid price: ${json[coinId]}`);
  return price;
}

async function bootstrapHedgePositions(
  supabase: ReturnType<typeof createClient>,
  portfolio: {
    id: string;
    user_id: string;
    capital_usdt: number | string;
  },
  symbols: Array<{
    symbol: string;
    allocation_pct: number | string;
    leverage: number;
  }>
): Promise<number> {
  const uniqueSymbols = Array.from(new Set(symbols.map((s) => s.symbol)));
  const { prices } = await fetchBybitTickers(uniqueSymbols);

  const rows: Array<Record<string, unknown>> = [];
  const now = new Date().toISOString();

  for (const s of symbols) {
    const price = prices[s.symbol];
    if (!price) continue;

    const allocated = (Number(portfolio.capital_usdt) * Number(s.allocation_pct)) / 100;
    const perSide = allocated / 2;
    const size = (perSide * s.leverage) / price;

    rows.push({
      portfolio_id: portfolio.id,
      user_id: portfolio.user_id,
      symbol: s.symbol,
      side: 'long',
      entry_price: price,
      current_price: price,
      size,
      leverage: s.leverage,
      unrealized_pnl: 0,
      realized_pnl: 0,
      stop_loss_price: price * 0.975,
      take_profit_price: price * 1.04,
      status: 'open',
      exchange_position_id: `sim-${crypto.randomUUID()}`,
      opened_at: now,
    });

    rows.push({
      portfolio_id: portfolio.id,
      user_id: portfolio.user_id,
      symbol: s.symbol,
      side: 'short',
      entry_price: price,
      current_price: price,
      size,
      leverage: s.leverage,
      unrealized_pnl: 0,
      realized_pnl: 0,
      stop_loss_price: price * 1.025,
      take_profit_price: price * 0.96,
      status: 'open',
      exchange_position_id: `sim-${crypto.randomUUID()}`,
      opened_at: now,
    });
  }

  if (rows.length === 0) return 0;

  const { data } = await supabase
    .from('apex_ai_positions')
    .insert(rows)
    .select('id');

  return data?.length ?? 0;
}

async function closePositionAndRecord(
  supabase: ReturnType<typeof createClient>,
  position: ApexAiPosition,
  exitPrice: number,
  trigger: 'take_profit'
): Promise<{ pnl: number } | null> {
  const entryPrice = Number(position.entry_price);
  const size = Number(position.size);
  const pnl =
    position.side === 'long'
      ? (exitPrice - entryPrice) * size
      : (entryPrice - exitPrice) * size;
  const feeExchange = Math.abs(pnl) * 0.0006;
  const now = new Date().toISOString();

  // Idempotency: only close if still open
  const { data: closedRows, error: closeErr } = await supabase
    .from('apex_ai_positions')
    .update({
      status: 'closed',
      closed_at: now,
      current_price: exitPrice,
      unrealized_pnl: 0,
      realized_pnl: pnl,
    })
    .eq('id', position.id)
    .eq('status', 'open')
    .select('id');

  if (closeErr || !closedRows || closedRows.length === 0) {
    // Already closed (race condition with client-side ticker — not an error)
    return null;
  }

  const { data: trade, error: tradeErr } = await supabase
    .from('apex_ai_trades')
    .insert({
      portfolio_id: position.portfolio_id,
      position_id: position.id,
      user_id: position.user_id,
      symbol: position.symbol,
      side: position.side,
      entry_price: entryPrice,
      exit_price: exitPrice,
      size,
      leverage: position.leverage,
      pnl,
      fee_exchange: feeExchange,
      gas_fee: 0,
      closed_at: now,
    })
    .select()
    .single();

  if (tradeErr || !trade) return { pnl };

  // Atomic fee charge via RPC
  if (pnl > 0) {
    try {
      await supabase.rpc('apex_ai_charge_gas_fee', {
        p_trade_id: trade.id,
        p_portfolio_id: position.portfolio_id,
        p_user_id: position.user_id,
        p_pnl: pnl,
        p_fee_rate_pct: FEE_RATE_PCT,
      });
    } catch (err) {
      console.warn('[apex-ai-bot-tick] charge_gas_fee failed', err);
    }
  }

  // Update portfolio running stats
  const { data: portfolioFresh } = await supabase
    .from('apex_ai_portfolios')
    .select('total_pnl, win_count, loss_count, drawdown_high_water_mark, capital_usdt')
    .eq('id', position.portfolio_id)
    .single();

  if (portfolioFresh) {
    const newTotal = Number(portfolioFresh.total_pnl) + pnl;
    const newEquity = Number(portfolioFresh.capital_usdt) + newTotal;
    const currentHwm = Number(
      portfolioFresh.drawdown_high_water_mark ?? portfolioFresh.capital_usdt
    );
    const newHwm = Math.max(currentHwm, newEquity);

    await supabase
      .from('apex_ai_portfolios')
      .update({
        total_pnl: newTotal,
        win_count: Number(portfolioFresh.win_count) + (pnl > 0 ? 1 : 0),
        loss_count: Number(portfolioFresh.loss_count) + (pnl <= 0 ? 1 : 0),
        drawdown_high_water_mark: newHwm,
      })
      .eq('id', position.portfolio_id);
  }

  return { pnl };
}

async function reopenHedgeLeg(
  supabase: ReturnType<typeof createClient>,
  portfolio: { id: string; user_id: string; capital_usdt: number | string },
  justClosed: ApexAiPosition,
  currentPrice: number,
  symbolConfig: { allocation_pct: number | string; leverage: number }
): Promise<void> {
  const allocated = (Number(portfolio.capital_usdt) * Number(symbolConfig.allocation_pct)) / 100;
  const perSide = allocated / 2;
  const size = (perSide * symbolConfig.leverage) / currentPrice;

  const isLong = justClosed.side === 'long';
  const stopLossPrice = isLong ? currentPrice * 0.98 : currentPrice * 1.02;
  const takeProfitPrice = isLong ? currentPrice * 1.03 : currentPrice * 0.97;

  await supabase.from('apex_ai_positions').insert({
    portfolio_id: portfolio.id,
    user_id: portfolio.user_id,
    symbol: justClosed.symbol,
    side: justClosed.side,
    entry_price: currentPrice,
    current_price: currentPrice,
    size,
    leverage: symbolConfig.leverage,
    unrealized_pnl: 0,
    realized_pnl: 0,
    stop_loss_price: stopLossPrice,
    take_profit_price: takeProfitPrice,
    status: 'open',
    exchange_position_id: `sim-${crypto.randomUUID()}`,
    opened_at: new Date().toISOString(),
  });
}

async function logEvent(
  supabase: ReturnType<typeof createClient>,
  portfolioId: string,
  level: 'info' | 'warning' | 'error' | 'critical',
  event: string,
  payload: Record<string, unknown> | null
): Promise<void> {
  try {
    await supabase.from('apex_ai_bot_logs').insert({
      portfolio_id: portfolioId,
      level,
      event,
      payload_json: payload,
    });
  } catch (err) {
    console.error('[apex-ai-bot-tick] log error', err);
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
