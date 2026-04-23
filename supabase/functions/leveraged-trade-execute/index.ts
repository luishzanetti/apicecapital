// Supabase Edge Function: leveraged-trade-execute
// Executes perpetual futures trades on Bybit (linear category)
// Used by: strategy-orchestrator, risk-monitor, frontend
//
// Actions:
//   "set-leverage"       — Set leverage for a symbol
//   "open-long"          — Open long position (market buy)
//   "open-short"         — Open short position (market sell)
//   "close-position"     — Close an existing position
//   "set-tp-sl"          — Set take-profit, stop-loss, trailing stop
//   "place-grid"         — Place grid of limit orders
//   "cancel-grid"        — Cancel all grid orders for a symbol
//   "emergency-close-all"— Close ALL positions (circuit breaker)
//   "positions"          — List open positions
//   "funding-history"    — Get funding rate history

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { bybitPost, bybitGet, getCorsHeaders } from '../_shared/bybit-api.ts';
import { getUserCredentials } from '../_shared/auth.ts';

// ─── Open a leveraged position ──────────────────────────────

async function openPosition(
  apiKey: string, apiSecret: string, testnet: boolean,
  symbol: string, side: 'Buy' | 'Sell', qty: string, leverage: number,
  tpPrice?: number, slPrice?: number
): Promise<{ orderId: string; entryPrice: number | null }> {
  // Set leverage first
  try {
    await bybitPost(apiKey, apiSecret, testnet, '/v5/position/set-leverage', {
      category: 'linear', symbol, buyLeverage: String(leverage), sellLeverage: String(leverage),
    });
  } catch (e: any) {
    // "leverage not modified" is OK — already set
    if (!e.message?.includes('110043')) throw e;
  }

  // Build order params
  const orderParams: Record<string, any> = {
    category: 'linear', symbol, side, orderType: 'Market', qty,
  };
  if (tpPrice) orderParams.takeProfit = String(tpPrice);
  if (slPrice) orderParams.stopLoss = String(slPrice);

  const result = await bybitPost(apiKey, apiSecret, testnet, '/v5/order/create', orderParams);
  const orderId = result.orderId || '';

  // Get fill price
  let entryPrice: number | null = null;
  if (orderId) {
    await new Promise(r => setTimeout(r, 1000));
    try {
      const detail = await bybitGet(apiKey, apiSecret, testnet, '/v5/order/realtime', {
        category: 'linear', orderId,
      });
      entryPrice = parseFloat(detail.list?.[0]?.avgPrice) || null;
    } catch { /* use mark price fallback */ }
  }

  return { orderId, entryPrice };
}

// ─── Close a position ───────────────────────────────────────

async function closePosition(
  apiKey: string, apiSecret: string, testnet: boolean,
  symbol: string, side: 'Buy' | 'Sell', qty: string
): Promise<{ orderId: string; closePrice: number | null }> {
  // To close: opposite side, reduceOnly
  const closeSide = side === 'Buy' ? 'Sell' : 'Buy';
  const result = await bybitPost(apiKey, apiSecret, testnet, '/v5/order/create', {
    category: 'linear', symbol, side: closeSide, orderType: 'Market', qty, reduceOnly: true,
  });

  const orderId = result.orderId || '';
  let closePrice: number | null = null;

  if (orderId) {
    await new Promise(r => setTimeout(r, 1000));
    try {
      const detail = await bybitGet(apiKey, apiSecret, testnet, '/v5/order/realtime', {
        category: 'linear', orderId,
      });
      closePrice = parseFloat(detail.list?.[0]?.avgPrice) || null;
    } catch { /* skip */ }
  }

  return { orderId, closePrice };
}

// ─── Set TP/SL/Trailing ─────────────────────────────────────

async function setTpSlTrailing(
  apiKey: string, apiSecret: string, testnet: boolean,
  symbol: string, tpPrice?: number, slPrice?: number, trailingStop?: number
): Promise<void> {
  const params: Record<string, any> = { category: 'linear', symbol };
  if (tpPrice) params.takeProfit = String(tpPrice);
  if (slPrice) params.stopLoss = String(slPrice);
  if (trailingStop) params.trailingStop = String(trailingStop);

  await bybitPost(apiKey, apiSecret, testnet, '/v5/position/trading-stop', params);
}

// ─── Get open positions from Bybit ──────────────────────────

async function getPositions(
  apiKey: string, apiSecret: string, testnet: boolean, symbol?: string
): Promise<any[]> {
  const params: Record<string, string> = { category: 'linear', limit: '200' };
  if (symbol) params.symbol = symbol;

  const result = await bybitGet(apiKey, apiSecret, testnet, '/v5/position/list', params);
  return (result.list || []).filter((p: any) => parseFloat(p.size) > 0);
}

// ─── Main handler ───────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ENCRYPTION_KEY = Deno.env.get('ENCRYPTION_KEY');
    if (!ENCRYPTION_KEY) {
      return new Response(JSON.stringify({ error: 'ENCRYPTION_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    // Auth
    const authHeader = req.headers.get('authorization');
    const cronSecret = req.headers.get('x-cron-secret');
    let userId: string;

    if (cronSecret) {
      // Cron/service call — userId must be in body
      const expectedSecret = Deno.env.get('CRON_SECRET');
      if (expectedSecret && cronSecret !== expectedSecret) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      userId = body.userId;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId required for cron calls' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } else {
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Missing authorization' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await supabaseUser.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      userId = user.id;
    }

    const json = (data: any, status = 200) => new Response(
      JSON.stringify({ data }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    const err = (msg: string, status = 400) => new Response(
      JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

    // ─── set-leverage ────────────────────────────────────────
    if (action === 'set-leverage') {
      const { symbol, leverage } = body;
      if (!symbol || !leverage) return err('Missing symbol or leverage');
      if (leverage > 10) return err('Max leverage is 10x');

      const creds = await getUserCredentials(supabaseAdmin, userId, ENCRYPTION_KEY);
      await bybitPost(creds.apiKey, creds.apiSecret, creds.testnet, '/v5/position/set-leverage', {
        category: 'linear', symbol, buyLeverage: String(leverage), sellLeverage: String(leverage),
      });
      return json({ symbol, leverage, status: 'set' });
    }

    // ─── open-long / open-short ──────────────────────────────
    if (action === 'open-long' || action === 'open-short') {
      const { symbol, qty, leverage = 2, takeProfit, stopLoss, strategyType, signalId } = body;
      if (!symbol || !qty) return err('Missing symbol or qty');
      if (leverage > 10) return err('Max leverage is 10x');

      // Idempotency: reject if an open position on (user, symbol, side) exists.
      // strategy-orchestrator already checks this, but direct callers (manual
      // trades, re-queued signals, retries) bypass it — this guard prevents
      // duplicate positions across the board.
      const intendedSide = action === 'open-long' ? 'long' : 'short';
      const { data: existingOpen } = await supabaseAdmin
        .from('leveraged_positions')
        .select('id, symbol, side, entry_price')
        .eq('user_id', userId)
        .eq('symbol', symbol)
        .eq('side', intendedSide)
        .eq('status', 'open')
        .limit(1);
      if (existingOpen && existingOpen.length > 0) {
        console.log(`[trade-execute] SKIP duplicate: ${intendedSide} ${symbol} — already open (${existingOpen[0].id})`);
        return json({
          skipped: true,
          reason: 'duplicate_open_position',
          existingPositionId: existingOpen[0].id,
        });
      }

      const creds = await getUserCredentials(supabaseAdmin, userId, ENCRYPTION_KEY);
      const side = action === 'open-long' ? 'Buy' as const : 'Sell' as const;
      const { orderId, entryPrice } = await openPosition(
        creds.apiKey, creds.apiSecret, creds.testnet,
        symbol, side, String(qty), leverage, takeProfit, stopLoss
      );

      // Get liquidation price
      let liqPrice: number | null = null;
      try {
        const positions = await getPositions(creds.apiKey, creds.apiSecret, creds.testnet, symbol);
        const pos = positions.find((p: any) => p.symbol === symbol);
        if (pos) liqPrice = parseFloat(pos.liqPrice) || null;
      } catch { /* skip */ }

      // Record in DB
      const { data: position } = await supabaseAdmin.from('leveraged_positions').insert({
        user_id: userId,
        strategy_type: strategyType || 'manual',
        symbol,
        side: action === 'open-long' ? 'long' : 'short',
        entry_price: entryPrice || 0,
        size_qty: parseFloat(String(qty)),
        size_usd: (entryPrice || 0) * parseFloat(String(qty)),
        leverage,
        take_profit_price: takeProfit || null,
        stop_loss_price: stopLoss || null,
        liquidation_price: liqPrice,
        bybit_order_id: orderId,
        signal_id: signalId || null,
        status: 'open',
      }).select('id').single();

      // Update signal if provided
      if (signalId && position) {
        await supabaseAdmin.from('trading_signals')
          .update({ was_executed: true, position_id: position.id })
          .eq('id', signalId);
      }

      return json({
        positionId: position?.id,
        orderId, entryPrice, leverage, symbol,
        side: action === 'open-long' ? 'long' : 'short',
        liquidationPrice: liqPrice,
      });
    }

    // ─── close-position ──────────────────────────────────────
    if (action === 'close-position') {
      const { positionId, reason = 'manual' } = body;
      if (!positionId) return err('Missing positionId');

      const { data: pos } = await supabaseAdmin.from('leveraged_positions')
        .select('*').eq('id', positionId).eq('user_id', userId).eq('status', 'open').single();
      if (!pos) return err('Position not found or already closed');

      const creds = await getUserCredentials(supabaseAdmin, userId, ENCRYPTION_KEY);
      const bybitSide = pos.side === 'long' ? 'Buy' as const : 'Sell' as const;
      const { orderId, closePrice } = await closePosition(
        creds.apiKey, creds.apiSecret, creds.testnet,
        pos.symbol, bybitSide, String(pos.size_qty)
      );

      const realizedPnl = closePrice && pos.entry_price
        ? pos.side === 'long'
          ? (closePrice - pos.entry_price) * pos.size_qty
          : (pos.entry_price - closePrice) * pos.size_qty
        : 0;

      await supabaseAdmin.from('leveraged_positions').update({
        status: 'closed', close_price: closePrice, close_reason: reason,
        realized_pnl: realizedPnl, closed_at: new Date().toISOString(),
      }).eq('id', positionId);

      return json({ positionId, closePrice, realizedPnl, reason });
    }

    // ─── set-tp-sl ───────────────────────────────────────────
    if (action === 'set-tp-sl') {
      const { symbol, takeProfit, stopLoss, trailingStop, positionId } = body;
      if (!symbol) return err('Missing symbol');

      const creds = await getUserCredentials(supabaseAdmin, userId, ENCRYPTION_KEY);
      await setTpSlTrailing(creds.apiKey, creds.apiSecret, creds.testnet, symbol, takeProfit, stopLoss, trailingStop);

      if (positionId) {
        const updates: Record<string, any> = {};
        if (takeProfit) updates.take_profit_price = takeProfit;
        if (stopLoss) updates.stop_loss_price = stopLoss;
        if (trailingStop) updates.trailing_stop_pct = trailingStop;
        await supabaseAdmin.from('leveraged_positions').update(updates).eq('id', positionId);
      }

      return json({ symbol, takeProfit, stopLoss, trailingStop, status: 'set' });
    }

    // ─── place-grid ──────────────────────────────────────────
    if (action === 'place-grid') {
      const { symbol, levels, leverage = 2, configId } = body;
      if (!symbol || !levels || !Array.isArray(levels)) return err('Missing symbol or levels');
      if (leverage > 3) return err('Max grid leverage is 3x');

      const creds = await getUserCredentials(supabaseAdmin, userId, ENCRYPTION_KEY);

      // Set leverage
      try {
        await bybitPost(creds.apiKey, creds.apiSecret, creds.testnet, '/v5/position/set-leverage', {
          category: 'linear', symbol, buyLeverage: String(leverage), sellLeverage: String(leverage),
        });
      } catch { /* already set */ }

      const results: any[] = [];
      for (const level of levels) {
        try {
          const orderResult = await bybitPost(creds.apiKey, creds.apiSecret, creds.testnet, '/v5/order/create', {
            category: 'linear', symbol,
            side: level.side, // 'Buy' or 'Sell'
            orderType: 'Limit',
            qty: String(level.qty),
            price: String(level.price),
            timeInForce: 'GTC',
          });

          await supabaseAdmin.from('grid_orders').insert({
            user_id: userId, config_id: configId || null,
            symbol, side: level.side.toLowerCase(), grid_level: level.level,
            price: level.price, quantity: level.qty, leverage,
            bybit_order_id: orderResult.orderId, status: 'active',
          });

          results.push({ level: level.level, orderId: orderResult.orderId, status: 'placed' });
        } catch (e: any) {
          results.push({ level: level.level, status: 'failed', error: e.message });
        }
      }

      return json({ symbol, gridOrders: results, total: results.length });
    }

    // ─── cancel-grid ─────────────────────────────────────────
    if (action === 'cancel-grid') {
      const { symbol } = body;
      if (!symbol) return err('Missing symbol');

      const creds = await getUserCredentials(supabaseAdmin, userId, ENCRYPTION_KEY);
      await bybitPost(creds.apiKey, creds.apiSecret, creds.testnet, '/v5/order/cancel-all', {
        category: 'linear', symbol,
      });

      await supabaseAdmin.from('grid_orders')
        .update({ status: 'cancelled' })
        .eq('user_id', userId).eq('symbol', symbol).eq('status', 'active');

      return json({ symbol, status: 'all_cancelled' });
    }

    // ─── emergency-close-all ─────────────────────────────────
    if (action === 'emergency-close-all') {
      const { reason = 'circuit_breaker' } = body;

      const { data: openPositions } = await supabaseAdmin.from('leveraged_positions')
        .select('*').eq('user_id', userId).eq('status', 'open');

      if (!openPositions || openPositions.length === 0) {
        return json({ closed: 0, reason });
      }

      const creds = await getUserCredentials(supabaseAdmin, userId, ENCRYPTION_KEY);
      const results: any[] = [];

      for (const pos of openPositions) {
        try {
          const bybitSide = pos.side === 'long' ? 'Buy' as const : 'Sell' as const;
          const { closePrice } = await closePosition(
            creds.apiKey, creds.apiSecret, creds.testnet,
            pos.symbol, bybitSide, String(pos.size_qty)
          );

          const realizedPnl = closePrice && pos.entry_price
            ? pos.side === 'long'
              ? (closePrice - pos.entry_price) * pos.size_qty
              : (pos.entry_price - closePrice) * pos.size_qty
            : 0;

          await supabaseAdmin.from('leveraged_positions').update({
            status: 'closed', close_price: closePrice, close_reason: reason,
            realized_pnl: realizedPnl, closed_at: new Date().toISOString(),
          }).eq('id', pos.id);

          results.push({ positionId: pos.id, symbol: pos.symbol, closePrice, realizedPnl, status: 'closed' });
        } catch (e: any) {
          results.push({ positionId: pos.id, symbol: pos.symbol, status: 'failed', error: e.message });
        }
      }

      // Cancel all pending grid orders too
      try {
        for (const symbol of [...new Set(openPositions.map((p: any) => p.symbol))]) {
          await bybitPost(creds.apiKey, creds.apiSecret, creds.testnet, '/v5/order/cancel-all', {
            category: 'linear', symbol: symbol as string,
          });
        }
        await supabaseAdmin.from('grid_orders')
          .update({ status: 'cancelled' })
          .eq('user_id', userId).eq('status', 'active');
      } catch { /* best effort */ }

      return json({ closed: results.filter(r => r.status === 'closed').length, total: results.length, reason, results });
    }

    // ─── positions ───────────────────────────────────────────
    if (action === 'positions') {
      const creds = await getUserCredentials(supabaseAdmin, userId, ENCRYPTION_KEY);
      const positions = await getPositions(creds.apiKey, creds.apiSecret, creds.testnet, body.symbol);

      // Also update mark prices in DB
      for (const pos of positions) {
        const markPrice = parseFloat(pos.markPrice) || 0;
        const unrealizedPnl = parseFloat(pos.unrealisedPnl) || 0;
        await supabaseAdmin.from('leveraged_positions')
          .update({ mark_price: markPrice, unrealized_pnl: unrealizedPnl })
          .eq('user_id', userId).eq('symbol', pos.symbol).eq('status', 'open');
      }

      return json(positions.map((p: any) => ({
        symbol: p.symbol,
        side: p.side,
        size: parseFloat(p.size),
        entryPrice: parseFloat(p.avgPrice || p.entryPrice),
        markPrice: parseFloat(p.markPrice),
        leverage: parseFloat(p.leverage),
        unrealizedPnl: parseFloat(p.unrealisedPnl),
        liquidationPrice: parseFloat(p.liqPrice),
        takeProfit: p.takeProfit,
        stopLoss: p.stopLoss,
      })));
    }

    // ─── funding-history ─────────────────────────────────────
    if (action === 'funding-history') {
      const { symbol = 'BTCUSDT', limit = '20' } = body;
      const creds = await getUserCredentials(supabaseAdmin, userId, ENCRYPTION_KEY);
      const result = await bybitGet(creds.apiKey, creds.apiSecret, creds.testnet,
        '/v5/market/funding/history', { category: 'linear', symbol, limit: String(limit) });
      return json(result.list || []);
    }

    return err('Invalid action. Use: set-leverage, open-long, open-short, close-position, set-tp-sl, place-grid, cancel-grid, emergency-close-all, positions, funding-history');

  } catch (error: any) {
    console.error('[leveraged-trade-execute] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
