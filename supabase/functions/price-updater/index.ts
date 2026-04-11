// Supabase Edge Function: price-updater
// Cron: every 60 seconds
// 1. Fetches live prices from Bybit public API (no auth needed)
// 2. Updates mark_price + unrealized_pnl on all open leveraged_positions
// 3. Every 5 min: writes to market_snapshots for historical data accumulation
// 4. Triggers Supabase Realtime → frontend gets instant updates

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LINEAR_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'DOTUSDT', 'LINKUSDT',
];

function getCorsHeaders(req?: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const json = (data: any) => new Response(
      JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

    // ─── 1. Fetch live prices from Bybit (public, no auth) ──

    const tickerResp = await fetch('https://api.bybit.com/v5/market/tickers?category=linear');
    const tickerJson = await tickerResp.json();

    if (tickerJson.retCode !== 0 || !tickerJson.result?.list) {
      return json({ error: 'Failed to fetch Bybit tickers', retCode: tickerJson.retCode });
    }

    const symbolSet = new Set(LINEAR_SYMBOLS);
    const prices: Record<string, { price: number; change24h: number; volume: number; high24h: number; low24h: number; fundingRate: number }> = {};

    for (const ticker of tickerJson.result.list) {
      if (symbolSet.has(ticker.symbol)) {
        prices[ticker.symbol] = {
          price: parseFloat(ticker.lastPrice) || 0,
          change24h: parseFloat(ticker.price24hPcnt) || 0,
          volume: parseFloat(ticker.volume24h) || 0,
          high24h: parseFloat(ticker.highPrice24h) || 0,
          low24h: parseFloat(ticker.lowPrice24h) || 0,
          fundingRate: parseFloat(ticker.fundingRate) || 0,
        };
      }
    }

    const symbolCount = Object.keys(prices).length;
    if (symbolCount === 0) {
      return json({ error: 'No prices fetched', tickers: tickerJson.result.list?.length || 0 });
    }

    // ─── 2. Update all open leveraged positions ─────────────

    const { data: openPositions } = await supabaseAdmin
      .from('leveraged_positions')
      .select('id, symbol, side, entry_price, size_qty, leverage')
      .eq('status', 'open');

    let positionsUpdated = 0;

    if (openPositions && openPositions.length > 0) {
      for (const pos of openPositions) {
        const tickerData = prices[pos.symbol];
        if (!tickerData) continue;

        const markPrice = tickerData.price;
        const unrealizedPnl = pos.side === 'long'
          ? (markPrice - pos.entry_price) * pos.size_qty
          : (pos.entry_price - markPrice) * pos.size_qty;

        await supabaseAdmin
          .from('leveraged_positions')
          .update({
            mark_price: markPrice,
            unrealized_pnl: Math.round(unrealizedPnl * 100) / 100,
          })
          .eq('id', pos.id);

        positionsUpdated++;
      }
    }

    // ─── 3. Write to market_snapshots (every 5 min) ─────────

    let snapshotsWritten = 0;
    const now = new Date();
    const minute = now.getMinutes();

    // Only write snapshots at 0, 5, 10, 15... minute marks
    if (minute % 5 === 0) {
      // Check if we already wrote this 5-min window
      const windowStart = new Date(now);
      windowStart.setSeconds(0, 0);
      windowStart.setMinutes(minute);

      const { data: existing } = await supabaseAdmin
        .from('market_snapshots')
        .select('id')
        .eq('symbol', 'BTCUSDT')
        .gte('captured_at', windowStart.toISOString())
        .limit(1);

      if (!existing || existing.length === 0) {
        // Write snapshots for all symbols
        const snapshots = Object.entries(prices).map(([symbol, data]) => ({
          symbol,
          price: data.price,
          volume_24h: data.volume,
          change_24h_pct: data.change24h * 100,
          high_24h: data.high24h,
          low_24h: data.low24h,
          funding_rate: data.fundingRate,
          source: 'price-updater',
          captured_at: now.toISOString(),
        }));

        const { error: insertError } = await supabaseAdmin
          .from('market_snapshots')
          .insert(snapshots);

        if (!insertError) {
          snapshotsWritten = snapshots.length;
        } else {
          console.error('[price-updater] Failed to write snapshots:', insertError.message);
        }

        // Cleanup: delete snapshots older than 90 days
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        await supabaseAdmin
          .from('market_snapshots')
          .delete()
          .lt('captured_at', ninetyDaysAgo);
      }
    }

    // ─── 4. Fetch Fear & Greed Index (every 15 min) ─────────

    let fearGreed: number | null = null;
    if (minute % 15 === 0) {
      try {
        const fgResp = await fetch('https://api.alternative.me/fng/?limit=1');
        const fgJson = await fgResp.json();
        fearGreed = parseInt(fgJson.data?.[0]?.value) || null;

        if (fearGreed !== null && snapshotsWritten > 0) {
          // Update the snapshots we just wrote with fear/greed
          await supabaseAdmin
            .from('market_snapshots')
            .update({ fear_greed_index: fearGreed })
            .gte('captured_at', new Date(Date.now() - 60000).toISOString())
            .eq('source', 'price-updater');
        }
      } catch (e: any) {
        console.error('[price-updater] Fear&Greed fetch failed:', e.message);
      }
    }

    return json({
      prices: symbolCount,
      positionsUpdated,
      snapshotsWritten,
      fearGreed,
      btcPrice: prices['BTCUSDT']?.price || 0,
      ethPrice: prices['ETHUSDT']?.price || 0,
      timestamp: now.toISOString(),
    });

  } catch (error: any) {
    console.error('[price-updater] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
