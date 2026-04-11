// Supabase Edge Function: trade-execute
// Executes sell orders, take-profit, and stop-loss on Bybit
//
// Actions:
//   "sell-spot"     — Market sell (Funding → Unified transfer, then sell)
//   "take-profit"   — Limit sell at target price
//   "stop-loss"     — Conditional stop order
//   "buy-spot"      — Market buy (for rebalancing into under-allocated assets)
//   "history"       — Get trade order history

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { bybitPost, bybitGet, ASSET_TO_SYMBOL, getCorsHeaders } from '../_shared/bybit-api.ts';
import { getUserCredentials } from '../_shared/auth.ts';

// ─── Trade execution types ──────────────────────────────────

interface TradeResult {
  asset: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number | null;
  price: number | null;
  amountUsdt: number | null;
  orderId: string | null;
  status: 'success' | 'failed';
  error: string | null;
}

// ─── Execute a sell order ───────────────────────────────────

async function executeSellSpot(
  apiKey: string, apiSecret: string, testnet: boolean,
  assetSymbol: string, quantity: number, supabaseAdmin: any, userId: string,
  source: string, regime: string | null
): Promise<TradeResult> {
  const tradingSymbol = ASSET_TO_SYMBOL[assetSymbol.toUpperCase()];
  if (!tradingSymbol || tradingSymbol === 'USDTUSDT') {
    return { asset: assetSymbol, symbol: 'UNKNOWN', side: 'sell', quantity: null, price: null, amountUsdt: null, orderId: null, status: 'failed', error: `Unsupported asset: ${assetSymbol}` };
  }

  // Transfer from FUND → UNIFIED for selling
  try {
    await bybitPost(apiKey, apiSecret, testnet, '/v5/asset/transfer/inter-transfer', {
      transferId: crypto.randomUUID(),
      coin: assetSymbol.toUpperCase(),
      amount: quantity.toFixed(8),
      fromAccountType: 'FUND',
      toAccountType: 'UNIFIED',
    });
  } catch (e: any) {
    console.warn(`[trade-execute] Transfer FUND→UNIFIED failed for ${assetSymbol}: ${e.message}`);
    // May already be in Unified — continue
  }

  // Place spot market sell order (base quantity)
  const orderResult = await bybitPost(apiKey, apiSecret, testnet, '/v5/order/create', {
    category: 'spot',
    symbol: tradingSymbol,
    side: 'Sell',
    orderType: 'Market',
    qty: quantity.toFixed(8),
  });

  const orderId = orderResult.orderId || null;
  let filledPrice: number | null = null;
  let filledQty: number | null = null;
  let amountUsdt: number | null = null;

  if (orderId) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      const orderDetail = await bybitGet(apiKey, apiSecret, testnet, '/v5/order/realtime', {
        category: 'spot', orderId,
      });
      const order = orderDetail.list?.[0];
      if (order) {
        filledQty = parseFloat(order.cumExecQty) || null;
        filledPrice = parseFloat(order.avgPrice) || null;
        amountUsdt = filledQty && filledPrice ? filledQty * filledPrice : null;
      }
    } catch {
      // Fallback: estimate from ticker
      try {
        const ticker = await bybitGet(apiKey, apiSecret, testnet, '/v5/market/tickers', {
          category: 'spot', symbol: tradingSymbol,
        });
        filledPrice = parseFloat(ticker.list?.[0]?.lastPrice || '0');
        filledQty = quantity;
        amountUsdt = filledPrice > 0 ? quantity * filledPrice : null;
      } catch { /* skip */ }
    }
  }

  // Record in trade_orders
  await supabaseAdmin.from('trade_orders').insert({
    user_id: userId,
    asset_symbol: assetSymbol.toUpperCase(),
    side: 'sell',
    order_type: 'market',
    quantity: filledQty,
    fill_price: filledPrice,
    fill_quantity: filledQty,
    amount_usdt: amountUsdt,
    bybit_order_id: orderId,
    status: 'filled',
    source,
    market_regime: regime,
    filled_at: new Date().toISOString(),
  });

  // Record as transaction for portfolio tracking
  if (filledQty && filledPrice) {
    await supabaseAdmin.from('transactions').insert({
      user_id: userId,
      asset_symbol: assetSymbol.toUpperCase(),
      type: 'sell',
      amount: filledQty,
      price_per_unit: filledPrice,
      date: new Date().toISOString(),
    });
  }

  return {
    asset: assetSymbol, symbol: tradingSymbol, side: 'sell',
    quantity: filledQty, price: filledPrice, amountUsdt,
    orderId, status: 'success', error: null,
  };
}

// ─── Execute a buy order (for rebalancing) ──────────────────

async function executeBuySpot(
  apiKey: string, apiSecret: string, testnet: boolean,
  assetSymbol: string, amountUsdt: number, supabaseAdmin: any, userId: string,
  source: string, regime: string | null
): Promise<TradeResult> {
  const tradingSymbol = ASSET_TO_SYMBOL[assetSymbol.toUpperCase()];
  if (!tradingSymbol) {
    return { asset: assetSymbol, symbol: 'UNKNOWN', side: 'buy', quantity: null, price: null, amountUsdt, orderId: null, status: 'failed', error: `Unsupported asset: ${assetSymbol}` };
  }
  if (amountUsdt < 1) {
    return { asset: assetSymbol, symbol: tradingSymbol, side: 'buy', quantity: null, price: null, amountUsdt, orderId: null, status: 'failed', error: `Amount too small: $${amountUsdt.toFixed(2)}` };
  }

  const orderResult = await bybitPost(apiKey, apiSecret, testnet, '/v5/order/create', {
    category: 'spot',
    symbol: tradingSymbol,
    side: 'Buy',
    orderType: 'Market',
    qty: amountUsdt.toFixed(2),
    marketUnit: 'quoteCoin',
  });

  const orderId = orderResult.orderId || null;
  let filledQty: number | null = null;
  let filledPrice: number | null = null;

  if (orderId) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      const orderDetail = await bybitGet(apiKey, apiSecret, testnet, '/v5/order/realtime', {
        category: 'spot', orderId,
      });
      const order = orderDetail.list?.[0];
      if (order) {
        filledQty = parseFloat(order.cumExecQty) || null;
        filledPrice = parseFloat(order.avgPrice) || null;
      }
    } catch { /* skip */ }
  }

  // Record in trade_orders
  await supabaseAdmin.from('trade_orders').insert({
    user_id: userId,
    asset_symbol: assetSymbol.toUpperCase(),
    side: 'buy',
    order_type: 'market',
    quantity: filledQty,
    amount_usdt: amountUsdt,
    fill_price: filledPrice,
    fill_quantity: filledQty,
    bybit_order_id: orderId,
    status: 'filled',
    source,
    market_regime: regime,
    filled_at: new Date().toISOString(),
  });

  if (filledQty && filledPrice) {
    await supabaseAdmin.from('transactions').insert({
      user_id: userId,
      asset_symbol: assetSymbol.toUpperCase(),
      type: 'buy',
      amount: filledQty,
      price_per_unit: filledPrice,
      date: new Date().toISOString(),
    });
  }

  return {
    asset: assetSymbol, symbol: tradingSymbol, side: 'buy',
    quantity: filledQty, price: filledPrice, amountUsdt,
    orderId, status: 'success', error: null,
  };
}

// ─── Set take-profit limit order ────────────────────────────

async function setTakeProfit(
  apiKey: string, apiSecret: string, testnet: boolean,
  assetSymbol: string, quantity: number, targetPrice: number,
  supabaseAdmin: any, userId: string, regime: string | null
): Promise<TradeResult> {
  const tradingSymbol = ASSET_TO_SYMBOL[assetSymbol.toUpperCase()];
  if (!tradingSymbol) {
    return { asset: assetSymbol, symbol: 'UNKNOWN', side: 'sell', quantity: null, price: null, amountUsdt: null, orderId: null, status: 'failed', error: `Unsupported asset: ${assetSymbol}` };
  }

  // Transfer to Unified for placing the order
  try {
    await bybitPost(apiKey, apiSecret, testnet, '/v5/asset/transfer/inter-transfer', {
      transferId: crypto.randomUUID(),
      coin: assetSymbol.toUpperCase(),
      amount: quantity.toFixed(8),
      fromAccountType: 'FUND',
      toAccountType: 'UNIFIED',
    });
  } catch { /* may already be in Unified */ }

  const orderResult = await bybitPost(apiKey, apiSecret, testnet, '/v5/order/create', {
    category: 'spot',
    symbol: tradingSymbol,
    side: 'Sell',
    orderType: 'Limit',
    qty: quantity.toFixed(8),
    price: targetPrice.toFixed(2),
    timeInForce: 'GTC',
  });

  const orderId = orderResult.orderId || null;

  await supabaseAdmin.from('trade_orders').insert({
    user_id: userId,
    asset_symbol: assetSymbol.toUpperCase(),
    side: 'sell',
    order_type: 'take_profit',
    quantity,
    target_price: targetPrice,
    amount_usdt: quantity * targetPrice,
    bybit_order_id: orderId,
    status: 'active',
    source: 'take_profit_rule',
    market_regime: regime,
  });

  return {
    asset: assetSymbol, symbol: tradingSymbol, side: 'sell',
    quantity, price: targetPrice, amountUsdt: quantity * targetPrice,
    orderId, status: 'success', error: null,
  };
}

// ─── Set stop-loss conditional order ────────────────────────

async function setStopLoss(
  apiKey: string, apiSecret: string, testnet: boolean,
  assetSymbol: string, quantity: number, triggerPrice: number,
  supabaseAdmin: any, userId: string, regime: string | null
): Promise<TradeResult> {
  const tradingSymbol = ASSET_TO_SYMBOL[assetSymbol.toUpperCase()];
  if (!tradingSymbol) {
    return { asset: assetSymbol, symbol: 'UNKNOWN', side: 'sell', quantity: null, price: null, amountUsdt: null, orderId: null, status: 'failed', error: `Unsupported asset: ${assetSymbol}` };
  }

  try {
    await bybitPost(apiKey, apiSecret, testnet, '/v5/asset/transfer/inter-transfer', {
      transferId: crypto.randomUUID(),
      coin: assetSymbol.toUpperCase(),
      amount: quantity.toFixed(8),
      fromAccountType: 'FUND',
      toAccountType: 'UNIFIED',
    });
  } catch { /* may already be in Unified */ }

  const orderResult = await bybitPost(apiKey, apiSecret, testnet, '/v5/order/create', {
    category: 'spot',
    symbol: tradingSymbol,
    side: 'Sell',
    orderType: 'Market',
    qty: quantity.toFixed(8),
    triggerPrice: triggerPrice.toFixed(2),
    triggerDirection: 2, // 2 = triggered when price falls below
    orderFilter: 'StopOrder',
  });

  const orderId = orderResult.orderId || null;

  await supabaseAdmin.from('trade_orders').insert({
    user_id: userId,
    asset_symbol: assetSymbol.toUpperCase(),
    side: 'sell',
    order_type: 'stop_loss',
    quantity,
    trigger_price: triggerPrice,
    bybit_order_id: orderId,
    status: 'active',
    source: 'manual',
    market_regime: regime,
  });

  return {
    asset: assetSymbol, symbol: tradingSymbol, side: 'sell',
    quantity, price: triggerPrice, amountUsdt: quantity * triggerPrice,
    orderId, status: 'success', error: null,
  };
}

// ─── Main handler ───────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ENCRYPTION_KEY = Deno.env.get('ENCRYPTION_KEY');
    if (!ENCRYPTION_KEY) {
      return new Response(
        JSON.stringify({ error: 'ENCRYPTION_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    // ─── Auth: get user from JWT ─────────────────────────────
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Action: sell-spot ────────────────────────────────────
    if (action === 'sell-spot') {
      const { asset, quantity, source = 'manual', regime = null } = body;
      if (!asset || !quantity || quantity <= 0) {
        return new Response(
          JSON.stringify({ error: 'Missing asset or quantity' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const creds = await getUserCredentials(supabaseAdmin, user.id, ENCRYPTION_KEY);
      const result = await executeSellSpot(
        creds.apiKey, creds.apiSecret, creds.testnet,
        asset, quantity, supabaseAdmin, user.id, source, regime
      );

      return new Response(
        JSON.stringify({ data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Action: buy-spot ────────────────────────────────────
    if (action === 'buy-spot') {
      const { asset, amountUsdt, source = 'manual', regime = null } = body;
      if (!asset || !amountUsdt || amountUsdt <= 0) {
        return new Response(
          JSON.stringify({ error: 'Missing asset or amountUsdt' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const creds = await getUserCredentials(supabaseAdmin, user.id, ENCRYPTION_KEY);
      const result = await executeBuySpot(
        creds.apiKey, creds.apiSecret, creds.testnet,
        asset, amountUsdt, supabaseAdmin, user.id, source, regime
      );

      return new Response(
        JSON.stringify({ data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Action: take-profit ─────────────────────────────────
    if (action === 'take-profit') {
      const { asset, quantity, targetPrice, regime = null } = body;
      if (!asset || !quantity || !targetPrice) {
        return new Response(
          JSON.stringify({ error: 'Missing asset, quantity, or targetPrice' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const creds = await getUserCredentials(supabaseAdmin, user.id, ENCRYPTION_KEY);
      const result = await setTakeProfit(
        creds.apiKey, creds.apiSecret, creds.testnet,
        asset, quantity, targetPrice, supabaseAdmin, user.id, regime
      );

      return new Response(
        JSON.stringify({ data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Action: stop-loss ───────────────────────────────────
    if (action === 'stop-loss') {
      const { asset, quantity, triggerPrice, regime = null } = body;
      if (!asset || !quantity || !triggerPrice) {
        return new Response(
          JSON.stringify({ error: 'Missing asset, quantity, or triggerPrice' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const creds = await getUserCredentials(supabaseAdmin, user.id, ENCRYPTION_KEY);
      const result = await setStopLoss(
        creds.apiKey, creds.apiSecret, creds.testnet,
        asset, quantity, triggerPrice, supabaseAdmin, user.id, regime
      );

      return new Response(
        JSON.stringify({ data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Action: cancel-order ────────────────────────────────
    if (action === 'cancel-order') {
      const { orderId, asset } = body;
      if (!orderId || !asset) {
        return new Response(
          JSON.stringify({ error: 'Missing orderId or asset' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tradingSymbol = ASSET_TO_SYMBOL[asset.toUpperCase()];
      if (!tradingSymbol) {
        return new Response(
          JSON.stringify({ error: `Unsupported asset: ${asset}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const creds = await getUserCredentials(supabaseAdmin, user.id, ENCRYPTION_KEY);
      await bybitPost(creds.apiKey, creds.apiSecret, creds.testnet, '/v5/order/cancel', {
        category: 'spot', symbol: tradingSymbol, orderId,
      });

      await supabaseAdmin
        .from('trade_orders')
        .update({ status: 'cancelled' })
        .eq('bybit_order_id', orderId)
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({ data: { orderId, status: 'cancelled' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Action: history ─────────────────────────────────────
    if (action === 'history') {
      const limit = body.limit || 50;
      const { data: orders, error } = await supabaseAdmin
        .from('trade_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return new Response(
        JSON.stringify({ data: orders }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "sell-spot", "buy-spot", "take-profit", "stop-loss", "cancel-order", or "history".' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[trade-execute] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
