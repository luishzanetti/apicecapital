// Supabase Edge Function: profit-monitor
// Cron-triggered (every 15 min) — detects profit-taking opportunities
// and creates smart_alerts for users whose DCA positions exceed thresholds
//
// Thresholds by investor profile:
//   Conservative Builder:  ≥30% gain → suggest selling 20%
//   Balanced Optimizer:    ≥40% gain → suggest selling 25%
//   Growth Seeker:         ≥60% gain → suggest selling 30%

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function getCorsHeaders(req?: Request): Record<string, string> {
  const allowedOrigins = [
    Deno.env.get('ALLOWED_ORIGIN'),
    'http://localhost:8080', 'http://localhost:5173',
  ].filter(Boolean) as string[];
  const origin = req?.headers.get('origin') || '';
  const allowOrigin = allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] || '*');
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// ─── Profit threshold config by investor type ───────────────

interface ProfitThreshold {
  gainPct: number;
  sellPct: number;
  label: string;
}

const PROFIT_THRESHOLDS: Record<string, ProfitThreshold> = {
  conservative: { gainPct: 30, sellPct: 20, label: 'Conservative Builder' },
  balanced: { gainPct: 40, sellPct: 25, label: 'Balanced Optimizer' },
  growth: { gainPct: 60, sellPct: 30, label: 'Growth Seeker' },
};

function getProfileType(investorType: string | null): string {
  if (!investorType) return 'balanced';
  const lower = investorType.toLowerCase();
  if (lower.includes('conservative')) return 'conservative';
  if (lower.includes('growth') || lower.includes('aggressive')) return 'growth';
  return 'balanced';
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
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify cron secret
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = Deno.env.get('CRON_SECRET');
    if (expectedSecret && cronSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Get all users with active DCA plans
    const { data: activePlans } = await supabaseAdmin
      .from('dca_plans')
      .select('user_id')
      .eq('is_active', true);

    if (!activePlans || activePlans.length === 0) {
      return new Response(
        JSON.stringify({ data: { checked: 0, alerts_created: 0 } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userIds = [...new Set(activePlans.map(p => p.user_id))];
    let alertsCreated = 0;

    for (const userId of userIds) {
      try {
        // 2. Get user's investor type
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('investor_type')
          .eq('id', userId)
          .single();

        const profileType = getProfileType(profile?.investor_type);
        const threshold = PROFIT_THRESHOLDS[profileType];

        // 3. Get user's DCA executions grouped by asset (cost basis)
        const { data: executions } = await supabaseAdmin
          .from('dca_executions')
          .select('asset_symbol, amount_usdt, quantity, price')
          .eq('user_id', userId)
          .eq('status', 'success')
          .not('quantity', 'is', null)
          .not('price', 'is', null);

        if (!executions || executions.length === 0) continue;

        // Calculate cost basis per asset
        const holdings: Record<string, { totalQty: number; totalCost: number; avgPrice: number }> = {};
        for (const exec of executions) {
          const symbol = exec.asset_symbol.toUpperCase();
          if (!holdings[symbol]) {
            holdings[symbol] = { totalQty: 0, totalCost: 0, avgPrice: 0 };
          }
          holdings[symbol].totalQty += exec.quantity;
          holdings[symbol].totalCost += exec.amount_usdt;
        }
        for (const symbol of Object.keys(holdings)) {
          const h = holdings[symbol];
          h.avgPrice = h.totalQty > 0 ? h.totalCost / h.totalQty : 0;
        }

        // 4. Get current prices from market_snapshots (most recent)
        const assetSymbols = Object.keys(holdings);
        const { data: snapshots } = await supabaseAdmin
          .from('market_snapshots')
          .select('symbol, price')
          .in('symbol', assetSymbols.map(s => s + 'USDT'))
          .order('captured_at', { ascending: false })
          .limit(assetSymbols.length);

        if (!snapshots || snapshots.length === 0) continue;

        const currentPrices: Record<string, number> = {};
        for (const snap of snapshots) {
          const base = snap.symbol.replace('USDT', '');
          if (!currentPrices[base]) {
            currentPrices[base] = snap.price;
          }
        }

        // 5. Check each asset for profit-taking opportunity
        for (const [symbol, holding] of Object.entries(holdings)) {
          const currentPrice = currentPrices[symbol];
          if (!currentPrice || holding.avgPrice <= 0) continue;

          const gainPct = ((currentPrice - holding.avgPrice) / holding.avgPrice) * 100;

          if (gainPct >= threshold.gainPct) {
            const sellQty = holding.totalQty * (threshold.sellPct / 100);
            const sellValueUsd = sellQty * currentPrice;
            const realizedPnl = sellQty * (currentPrice - holding.avgPrice);

            // Check if we already sent a recent alert for this asset
            const { data: recentAlerts } = await supabaseAdmin
              .from('smart_alerts')
              .select('id')
              .eq('user_id', userId)
              .eq('alert_type', 'take_profit')
              .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
              .like('message', `%${symbol}%`)
              .limit(1);

            if (recentAlerts && recentAlerts.length > 0) continue; // Already alerted today

            // Create smart_alert
            await supabaseAdmin.from('smart_alerts').insert({
              user_id: userId,
              alert_type: 'take_profit',
              severity: gainPct >= threshold.gainPct * 1.5 ? 'critical' : 'warning',
              title: `${symbol} up ${gainPct.toFixed(1)}% — Take Profit?`,
              message: `Your ${symbol} position is up ${gainPct.toFixed(1)}% from your avg cost of $${holding.avgPrice.toFixed(2)}. Consider selling ${threshold.sellPct}% (~${sellQty.toFixed(6)} ${symbol} = $${sellValueUsd.toFixed(2)}) to realize ~$${realizedPnl.toFixed(2)} profit.`,
              action_label: `Sell ${threshold.sellPct}% ${symbol}`,
              action_route: '/automations',
              action_data: {
                type: 'take_profit',
                asset: symbol,
                quantity: sellQty,
                currentPrice,
                costBasis: holding.avgPrice,
                gainPct,
                sellPct: threshold.sellPct,
                estimatedPnl: realizedPnl,
              },
              is_read: false,
              is_acted_on: false,
            });

            alertsCreated++;
            console.log(`[profit-monitor] Alert created: ${symbol} +${gainPct.toFixed(1)}% for user ${userId.slice(0, 8)}`);
          }
        }
      } catch (userErr: any) {
        console.error(`[profit-monitor] Error processing user ${userId.slice(0, 8)}:`, userErr.message);
      }
    }

    return new Response(
      JSON.stringify({
        data: {
          checked: userIds.length,
          alerts_created: alertsCreated,
          timestamp: new Date().toISOString(),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[profit-monitor] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
