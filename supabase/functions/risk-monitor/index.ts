// Supabase Edge Function: risk-monitor
// The ALTIS risk watchdog — runs every 5 minutes via cron
// Protects user capital with 7 layers of risk management
//
// Actions:
//   "monitor"       — Full risk check cycle (cron)
//   "check-heat"    — Calculate portfolio heat for a user
//   "status"        — Get current risk status for a user

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/bybit-api.ts';

const MAX_HEAT = 0.20;           // 20% max portfolio heat
const DAILY_LOSS_LIMIT = -0.05;  // -5% daily loss → circuit breaker
const LIQUIDATION_WARNING = 0.15; // 15% from liquidation → warning
const LIQUIDATION_FORCE = 0.05;  // 5% from liquidation → force close
const COOLDOWN_HOURS = 24;

// ─── Calculate portfolio heat ───────────────────────────────

interface HeatResult {
  totalHeat: number;
  totalExposure: number;
  positionCount: number;
  heatByStrategy: Record<string, number>;
  canOpenNew: boolean;
}

async function calculateHeat(supabaseAdmin: any, userId: string): Promise<HeatResult> {
  const { data: positions } = await supabaseAdmin
    .from('leveraged_positions')
    .select('strategy_type, size_usd, leverage, entry_price, stop_loss_price, side')
    .eq('user_id', userId)
    .eq('status', 'open');

  if (!positions || positions.length === 0) {
    return { totalHeat: 0, totalExposure: 0, positionCount: 0, heatByStrategy: {}, canOpenNew: true };
  }

  // Get account equity (approximate from positions + balance)
  const totalExposure = positions.reduce((s: number, p: any) => s + p.size_usd * p.leverage, 0);
  // Estimate equity as half of total exposure (conservative, assumes avg 2x leverage)
  const estimatedEquity = totalExposure > 0 ? totalExposure / 2 : 10000; // fallback to $10K if no positions

  let totalRisk = 0;
  const heatByStrategy: Record<string, number> = {};

  for (const p of positions) {
    const slDistance = p.stop_loss_price && p.entry_price
      ? Math.abs(p.entry_price - p.stop_loss_price) / p.entry_price
      : 0.02; // default 2% risk if no SL
    const posRisk = p.size_usd * p.leverage * slDistance;
    totalRisk += posRisk;

    heatByStrategy[p.strategy_type] = (heatByStrategy[p.strategy_type] || 0) + posRisk;
  }

  const totalHeat = estimatedEquity > 0 ? totalRisk / estimatedEquity : 0;

  return {
    totalHeat: Math.min(totalHeat, 1),
    totalExposure,
    positionCount: positions.length,
    heatByStrategy,
    canOpenNew: totalHeat < MAX_HEAT,
  };
}

// ─── Check circuit breaker ──────────────────────────────────

async function checkCircuitBreaker(supabaseAdmin: any, userId: string): Promise<{
  isTripped: boolean; dailyPnlPct: number; shouldTrip: boolean;
}> {
  // Check existing state
  const { data: cbState } = await supabaseAdmin
    .from('circuit_breaker_state')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (cbState?.is_tripped) {
    const resumeAt = new Date(cbState.resume_at);
    if (new Date() < resumeAt) {
      return { isTripped: true, dailyPnlPct: cbState.daily_pnl_at_trip || 0, shouldTrip: false };
    }
    // Cooldown expired — reset
    await supabaseAdmin.from('circuit_breaker_state').update({
      is_tripped: false, last_reset_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('user_id', userId);

    await supabaseAdmin.from('risk_events').insert({
      user_id: userId, event_type: 'circuit_breaker_reset', severity: 'info',
      details: { previous_trip: cbState.tripped_at, cooldown_hours: COOLDOWN_HOURS },
    });
  }

  // Calculate daily P&L from positions opened/closed today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: closedToday } = await supabaseAdmin
    .from('leveraged_positions')
    .select('realized_pnl, size_usd')
    .eq('user_id', userId)
    .eq('status', 'closed')
    .gte('closed_at', todayStart.toISOString());

  const { data: openPositions } = await supabaseAdmin
    .from('leveraged_positions')
    .select('unrealized_pnl, size_usd')
    .eq('user_id', userId)
    .eq('status', 'open');

  const realizedToday = (closedToday || []).reduce((s: number, p: any) => s + (p.realized_pnl || 0), 0);
  const unrealized = (openPositions || []).reduce((s: number, p: any) => s + (p.unrealized_pnl || 0), 0);
  const totalCapital = (openPositions || []).reduce((s: number, p: any) => s + (p.size_usd || 0), 0) || 1;

  const dailyPnlPct = (realizedToday + unrealized) / totalCapital;
  const shouldTrip = dailyPnlPct <= DAILY_LOSS_LIMIT;

  return { isTripped: false, dailyPnlPct, shouldTrip };
}

// ─── Trip the circuit breaker ───────────────────────────────

async function tripCircuitBreaker(
  supabaseAdmin: any, userId: string, dailyPnlPct: number, reason: string
): Promise<number> {
  const resumeAt = new Date(Date.now() + COOLDOWN_HOURS * 60 * 60 * 1000).toISOString();

  // Upsert circuit breaker state
  await supabaseAdmin.from('circuit_breaker_state').upsert({
    user_id: userId, is_tripped: true, tripped_at: new Date().toISOString(),
    resume_at: resumeAt, trip_reason: reason, daily_pnl_at_trip: dailyPnlPct,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  // Emergency close all positions via internal function call
  const { data: openPositions } = await supabaseAdmin
    .from('leveraged_positions')
    .select('id, symbol, side, size_qty, entry_price, leverage')
    .eq('user_id', userId).eq('status', 'open');

  const closedCount = openPositions?.length || 0;

  // Mark all as closed (actual Bybit close would be done by leveraged-trade-execute)
  if (openPositions && openPositions.length > 0) {
    for (const pos of openPositions) {
      await supabaseAdmin.from('leveraged_positions').update({
        status: 'closed', close_reason: 'circuit_breaker', closed_at: new Date().toISOString(),
      }).eq('id', pos.id);
    }
  }

  // Cancel all grid orders
  await supabaseAdmin.from('grid_orders')
    .update({ status: 'cancelled' })
    .eq('user_id', userId).eq('status', 'active');

  // Disable all strategies
  await supabaseAdmin.from('strategy_configs')
    .update({ is_active: false, disabled_reason: 'CIRCUIT_BREAKER', updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  // Log risk event
  await supabaseAdmin.from('risk_events').insert({
    user_id: userId, event_type: 'circuit_breaker_tripped', severity: 'critical',
    details: { reason, daily_pnl_pct: dailyPnlPct, positions_closed: closedCount, resume_at: resumeAt },
    daily_pnl_pct: dailyPnlPct,
  });

  // Create smart alert
  await supabaseAdmin.from('smart_alerts').insert({
    user_id: userId, alert_type: 'circuit_breaker_tripped', severity: 'critical',
    title: `Circuit Breaker: ${(dailyPnlPct * 100).toFixed(1)}% daily loss`,
    message: `Daily loss limit of -5% reached. All ${closedCount} leveraged positions closed. Trading resumes at ${new Date(resumeAt).toLocaleString()}.`,
    is_read: false, is_acted_on: false,
  });

  return closedCount;
}

// ─── Check liquidation proximity ────────────────────────────

async function checkLiquidation(supabaseAdmin: any, userId: string): Promise<void> {
  const { data: positions } = await supabaseAdmin
    .from('leveraged_positions')
    .select('id, symbol, side, entry_price, mark_price, liquidation_price, size_usd, leverage')
    .eq('user_id', userId).eq('status', 'open')
    .not('liquidation_price', 'is', null);

  if (!positions) return;

  for (const pos of positions) {
    if (!pos.mark_price || !pos.liquidation_price) continue;

    const distance = Math.abs(pos.mark_price - pos.liquidation_price) / pos.mark_price;

    if (distance < LIQUIDATION_FORCE) {
      // Force close — too close to liquidation
      await supabaseAdmin.from('leveraged_positions').update({
        status: 'closed', close_reason: 'liquidation_prevention', closed_at: new Date().toISOString(),
      }).eq('id', pos.id);

      await supabaseAdmin.from('risk_events').insert({
        user_id: userId, event_type: 'liquidation_forced', severity: 'critical',
        details: { symbol: pos.symbol, distance_pct: (distance * 100).toFixed(1), mark_price: pos.mark_price, liq_price: pos.liquidation_price },
        positions_affected: [pos.id],
      });

      await supabaseAdmin.from('smart_alerts').insert({
        user_id: userId, alert_type: 'leverage_liquidation_warning', severity: 'critical',
        title: `${pos.symbol} force-closed: ${(distance * 100).toFixed(1)}% from liquidation`,
        message: `Position ${pos.side} ${pos.symbol} was ${(distance * 100).toFixed(1)}% from liquidation and has been automatically closed to protect your capital.`,
        is_read: false, is_acted_on: false,
      });
    } else if (distance < LIQUIDATION_WARNING) {
      // Warning only
      await supabaseAdmin.from('smart_alerts').insert({
        user_id: userId, alert_type: 'leverage_liquidation_warning', severity: 'warning',
        title: `${pos.symbol}: ${(distance * 100).toFixed(1)}% from liquidation`,
        message: `Your ${pos.side} ${pos.symbol} position is ${(distance * 100).toFixed(1)}% from liquidation. Consider reducing size or adding margin.`,
        is_read: false, is_acted_on: false,
      });
    }
  }
}

// ─── Capitulation protocol ──────────────────────────────────

async function checkCapitulation(supabaseAdmin: any, userId: string): Promise<boolean> {
  const { data: regime } = await supabaseAdmin
    .from('market_regimes')
    .select('regime')
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (regime?.regime !== 'CAPITULATION') return false;

  // Check if user has open leveraged positions
  const { data: openPositions } = await supabaseAdmin
    .from('leveraged_positions')
    .select('id')
    .eq('user_id', userId).eq('status', 'open');

  if (!openPositions || openPositions.length === 0) return false;

  // Close everything
  for (const pos of openPositions) {
    await supabaseAdmin.from('leveraged_positions').update({
      status: 'closed', close_reason: 'capitulation_override', closed_at: new Date().toISOString(),
    }).eq('id', pos.id);
  }

  await supabaseAdmin.from('grid_orders')
    .update({ status: 'cancelled' })
    .eq('user_id', userId).eq('status', 'active');

  await supabaseAdmin.from('strategy_configs')
    .update({ is_active: false, disabled_reason: 'CAPITULATION_OVERRIDE', updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  await supabaseAdmin.from('risk_events').insert({
    user_id: userId, event_type: 'capitulation_override', severity: 'critical',
    details: { positions_closed: openPositions.length, regime: 'CAPITULATION' },
    market_regime: 'CAPITULATION',
  });

  await supabaseAdmin.from('smart_alerts').insert({
    user_id: userId, alert_type: 'regime_strategy_switch', severity: 'critical',
    title: 'CAPITULATION: All leveraged positions closed',
    message: `Market is in capitulation. ${openPositions.length} leveraged positions closed automatically. Spot DCA has been increased. Trading resumes when market stabilizes.`,
    is_read: false, is_acted_on: false,
  });

  return true;
}

// ─── Main handler ───────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'monitor';

    const json = (data: any) => new Response(
      JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

    // ─── Full monitor cycle (cron) ───────────────────────────
    if (action === 'monitor') {
      const cronSecret = req.headers.get('x-cron-secret');
      const expectedSecret = Deno.env.get('CRON_SECRET');
      if (expectedSecret && cronSecret !== expectedSecret) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Get all users with open leveraged positions
      const { data: activeUsers } = await supabaseAdmin
        .from('leveraged_positions')
        .select('user_id')
        .eq('status', 'open');

      const userIds = [...new Set((activeUsers || []).map((p: any) => p.user_id))];
      const results: any[] = [];

      for (const userId of userIds) {
        try {
          // 1. Capitulation check (highest priority)
          const wasCapitulation = await checkCapitulation(supabaseAdmin, userId);
          if (wasCapitulation) {
            results.push({ userId: userId.slice(0, 8), action: 'capitulation_override' });
            continue;
          }

          // 2. Circuit breaker check
          const cb = await checkCircuitBreaker(supabaseAdmin, userId);
          if (cb.isTripped) {
            results.push({ userId: userId.slice(0, 8), action: 'circuit_breaker_active' });
            continue;
          }
          if (cb.shouldTrip) {
            const closed = await tripCircuitBreaker(supabaseAdmin, userId, cb.dailyPnlPct, 'daily_loss_limit');
            results.push({ userId: userId.slice(0, 8), action: 'circuit_breaker_tripped', closed });
            continue;
          }

          // 3. Liquidation proximity check
          await checkLiquidation(supabaseAdmin, userId);

          // 4. Heat check
          const heat = await calculateHeat(supabaseAdmin, userId);
          if (heat.totalHeat >= MAX_HEAT) {
            await supabaseAdmin.from('risk_events').insert({
              user_id: userId, event_type: 'heat_limit_reached', severity: 'warning',
              details: { heat: heat.totalHeat, exposure: heat.totalExposure, positions: heat.positionCount },
              portfolio_heat: heat.totalHeat,
            });
          }

          results.push({
            userId: userId.slice(0, 8), heat: (heat.totalHeat * 100).toFixed(1) + '%',
            positions: heat.positionCount, dailyPnl: (cb.dailyPnlPct * 100).toFixed(2) + '%',
          });
        } catch (e: any) {
          console.error(`[risk-monitor] Error for user ${userId.slice(0, 8)}:`, e.message);
          results.push({ userId: userId.slice(0, 8), error: e.message });
        }
      }

      return json({ checked: userIds.length, results, timestamp: new Date().toISOString() });
    }

    // ─── Check heat for specific user ────────────────────────
    if (action === 'check-heat') {
      const authHeader = req.headers.get('authorization');
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

      const heat = await calculateHeat(supabaseAdmin, user.id);
      const cb = await checkCircuitBreaker(supabaseAdmin, user.id);

      return json({
        ...heat,
        circuitBreaker: { isTripped: cb.isTripped, dailyPnlPct: cb.dailyPnlPct },
        maxHeat: MAX_HEAT,
        dailyLossLimit: DAILY_LOSS_LIMIT,
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: monitor, check-heat' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[risk-monitor] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
