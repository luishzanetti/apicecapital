// Supabase Edge Function: dca-execute
// Executes DCA buy orders on Bybit for plans that are due
// Can be triggered by: Supabase Cron, manual user action, or webhook
//
// Actions:
//   "execute-plan"  — Execute a specific plan (user-triggered)
//   "execute-due"   — Execute ALL due plans (cron-triggered, requires service role)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { aesDecryptAsync } from '../_shared/crypto.ts';
import { bybitPost, bybitGet, ASSET_TO_SYMBOL, getCorsHeaders } from '../_shared/bybit-api.ts';

// ─── Frequency to milliseconds ──────────────────────────────

function frequencyToMs(freq: string): number {
  switch (freq) {
    case 'daily': return 24 * 60 * 60 * 1000;
    case 'weekly': return 7 * 24 * 60 * 60 * 1000;
    case 'biweekly': return 14 * 24 * 60 * 60 * 1000;
    case 'monthly': return 30 * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}

// ─── Execute a single DCA plan ──────────────────────────────

interface ExecutionResult {
  planId: string;
  executions: Array<{
    asset: string;
    symbol: string;
    amountUsdt: number;
    quantity: string | null;
    price: string | null;
    orderId: string | null;
    status: 'success' | 'failed';
    error: string | null;
  }>;
  totalSpent: number;
}

async function executePlan(
  plan: any,
  apiKey: string,
  apiSecret: string,
  testnet: boolean,
  supabaseAdmin: any
): Promise<ExecutionResult> {
  const result: ExecutionResult = {
    planId: plan.id,
    executions: [],
    totalSpent: 0,
  };

  let assets: Array<{ symbol: string; allocation: number }> = plan.assets || [];
  let effectiveAmount = plan.amount_per_interval;

  // ─── Smart DCA Override: apply regime-adjusted amount & allocation ───
  const override = plan.smart_dca_override;
  if (override && override.applied_at) {
    const appliedAt = new Date(override.applied_at).getTime();
    const maxAge = 2 * frequencyToMs(plan.frequency);
    const isRecent = Date.now() - appliedAt < maxAge;

    if (isRecent) {
      if (override.adjusted_amount && override.adjusted_amount > 0) {
        effectiveAmount = override.adjusted_amount;
      }
      if (override.allocation_adjustments && Object.keys(override.allocation_adjustments).length > 0) {
        assets = assets.map(a => {
          const overrideAlloc = override.allocation_adjustments[a.symbol] ??
            override.allocation_adjustments[a.symbol.toUpperCase()];
          return overrideAlloc != null ? { ...a, allocation: overrideAlloc } : a;
        });
      }
      console.log(`[dca-execute] Smart DCA override active: $${effectiveAmount} (was $${plan.amount_per_interval}), regime: ${override.regime || 'unknown'}`);
    }
  }

  for (const asset of assets) {
    const tradingSymbol = ASSET_TO_SYMBOL[asset.symbol.toUpperCase()];
    if (!tradingSymbol) {
      result.executions.push({
        asset: asset.symbol,
        symbol: 'UNKNOWN',
        amountUsdt: 0,
        quantity: null,
        price: null,
        orderId: null,
        status: 'failed',
        error: `Unsupported asset: ${asset.symbol}`,
      });
      continue;
    }

    const amountUsdt = (effectiveAmount * asset.allocation) / 100;

    // Skip tiny orders (Bybit minimum is ~$1)
    if (amountUsdt < 1) {
      result.executions.push({
        asset: asset.symbol,
        symbol: tradingSymbol,
        amountUsdt,
        quantity: null,
        price: null,
        orderId: null,
        status: 'failed',
        error: `Amount too small: $${amountUsdt.toFixed(2)} (min $1)`,
      });
      continue;
    }

    try {
      // Place spot market buy order (quote quantity = USDT amount)
      const orderResult = await bybitPost(apiKey, apiSecret, testnet, '/v5/order/create', {
        category: 'spot',
        symbol: tradingSymbol,
        side: 'Buy',
        orderType: 'Market',
        qty: amountUsdt.toFixed(2),
        marketUnit: 'quoteCoin', // Buy using USDT amount
      });

      // Query order details to get actual filled qty and price
      // Bybit's placeOrder response doesn't include fill details for market orders
      let filledQty: number | null = null;
      let filledPrice: number | null = null;
      const orderId = orderResult.orderId || null;

      if (orderId) {
        try {
          // Wait briefly for order to fill (market orders fill instantly)
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const orderDetail = await bybitGet(apiKey, apiSecret, testnet, '/v5/order/realtime', {
            category: 'spot',
            orderId,
          });
          const order = orderDetail.list?.[0];
          if (order) {
            filledQty = parseFloat(order.cumExecQty) || null;
            filledPrice = parseFloat(order.avgPrice) || null;
          }
        } catch {
          // If order query fails, estimate from amountUsdt and current price
        }
      }

      // If we still don't have qty, estimate from ticker price (never use amountUsdt as qty)
      if (!filledQty) {
        try {
          const ticker = await bybitGet(apiKey, apiSecret, testnet, '/v5/market/tickers', {
            category: 'spot',
            symbol: tradingSymbol,
          });
          const lastPrice = parseFloat(ticker.list?.[0]?.lastPrice || '0');
          if (lastPrice > 0) {
            filledQty = amountUsdt / lastPrice;
            filledPrice = lastPrice;
          }
        } catch {
          // Last resort: skip transaction record to avoid corrupted data
        }
      }

      result.executions.push({
        asset: asset.symbol,
        symbol: tradingSymbol,
        amountUsdt,
        quantity: filledQty ? filledQty.toString() : null,
        price: filledPrice ? filledPrice.toString() : null,
        orderId,
        status: 'success',
        error: null,
      });
      result.totalSpent += amountUsdt;

      // Record execution in DB
      await supabaseAdmin.from('dca_executions').insert({
        plan_id: plan.id,
        user_id: plan.user_id,
        asset_symbol: asset.symbol,
        amount_usdt: amountUsdt,
        quantity: filledQty,
        price: filledPrice,
        status: 'success',
        bybit_order_id: orderId,
      });

      // Record as transaction for portfolio tracking — ONLY if we have real qty
      if (filledQty && filledPrice) {
        await supabaseAdmin.from('transactions').insert({
          user_id: plan.user_id,
          asset_symbol: asset.symbol.toUpperCase(),
          type: 'buy',
          amount: filledQty,
          price_per_unit: filledPrice,
          date: new Date().toISOString(),
          fees: 0,
          notes: `DCA auto-buy [Plan ${plan.id}]`,
        });

        // Transfer bought crypto from Unified → Funding (savings vault)
        try {
          await bybitPost(apiKey, apiSecret, testnet, '/v5/asset/transfer/inter-transfer', {
            transferId: crypto.randomUUID(),
            coin: asset.symbol.toUpperCase(),
            amount: filledQty.toFixed(8),
            fromAccountType: 'UNIFIED',
            toAccountType: 'FUND',
          });
        } catch {
          // Transfer failed — crypto stays in Unified, not critical
        }
      }

    } catch (err: any) {
      console.error(`[dca-execute] Order failed for ${tradingSymbol}:`, err);

      result.executions.push({
        asset: asset.symbol,
        symbol: tradingSymbol,
        amountUsdt,
        quantity: null,
        price: null,
        orderId: null,
        status: 'failed',
        error: err.message || 'Order failed',
      });

      // Record failed execution
      await supabaseAdmin.from('dca_executions').insert({
        plan_id: plan.id,
        user_id: plan.user_id,
        asset_symbol: asset.symbol,
        amount_usdt: amountUsdt,
        status: 'failed',
        error_message: err.message || 'Order failed',
      });
    }
  }

  // Update plan's next execution date and total invested
  // Clear smart_dca_override after execution (one-time use)
  const nextDate = new Date(Date.now() + frequencyToMs(plan.frequency)).toISOString();
  const failedCount = result.executions.filter(e => e.status === 'failed').length;
  await supabaseAdmin
    .from('dca_plans')
    .update({
      next_execution_date: nextDate,
      total_invested: (plan.total_invested || 0) + result.totalSpent,
      last_execution_date: new Date().toISOString(),
      execution_count: (plan.execution_count || 0) + 1,
      failed_executions: (plan.failed_executions || 0) + failedCount,
      smart_dca_override: null,
    })
    .eq('id', plan.id);

  // Check if plan has expired
  if (plan.duration_days) {
    const startDate = new Date(plan.start_date).getTime();
    const endDate = startDate + plan.duration_days * 24 * 60 * 60 * 1000;
    if (Date.now() > endDate) {
      await supabaseAdmin
        .from('dca_plans')
        .update({ is_active: false })
        .eq('id', plan.id);
    }
  }

  return result;
}

// ─── Main Handler ───────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ENCRYPTION_KEY = Deno.env.get('ENCRYPTION_KEY');
    if (!ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY not configured');
    }
    const encryptionKey = ENCRYPTION_KEY;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'execute-plan';

    // ─── Action: execute-plan (user-triggered) ───────────
    if (action === 'execute-plan') {
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

      const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const planId = body.planId;
      if (!planId) {
        return new Response(
          JSON.stringify({ error: 'Missing planId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch the plan (verify ownership)
      const { data: plan, error: planError } = await supabaseAdmin
        .from('dca_plans')
        .select('*')
        .eq('id', planId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (planError || !plan) {
        return new Response(
          JSON.stringify({ error: 'Plan not found or inactive' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get credentials
      const { data: creds } = await supabaseAdmin
        .from('bybit_credentials')
        .select('api_key, api_secret_encrypted, testnet')
        .eq('user_id', user.id)
        .single();

      if (!creds) {
        return new Response(
          JSON.stringify({ error: 'no_credentials', message: 'Connect Bybit first' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const apiSecret = await aesDecryptAsync(creds.api_secret_encrypted, encryptionKey);
      const result = await executePlan(plan, creds.api_key, apiSecret, creds.testnet || false, supabaseAdmin);

      return new Response(
        JSON.stringify({ data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Action: execute-due (cron-triggered) ────────────
    if (action === 'execute-due') {
      // This should be called by Supabase Cron with service role
      const cronSecret = req.headers.get('x-cron-secret');
      const expectedSecret = Deno.env.get('CRON_SECRET');
      if (!expectedSecret) {
        console.error('[dca-execute] CRON_SECRET not configured');
        return new Response(
          JSON.stringify({ error: 'Server configuration error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (cronSecret !== expectedSecret) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch all active plans that are due
      const now = new Date().toISOString();
      const { data: duePlans, error: plansError } = await supabaseAdmin
        .from('dca_plans')
        .select('*')
        .eq('is_active', true)
        .lte('next_execution_date', now);

      if (plansError || !duePlans || duePlans.length === 0) {
        return new Response(
          JSON.stringify({ data: { executed: 0, message: 'No plans due' } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const results: ExecutionResult[] = [];
      const errors: string[] = [];

      for (const plan of duePlans) {
        try {
          const { data: creds } = await supabaseAdmin
            .from('bybit_credentials')
            .select('api_key, api_secret_encrypted, testnet')
            .eq('user_id', plan.user_id)
            .single();

          if (!creds) {
            errors.push(`Plan ${plan.id}: No credentials for user ${plan.user_id}`);
            continue;
          }

          const apiSecret = await aesDecryptAsync(creds.api_secret_encrypted, encryptionKey);
          const result = await executePlan(plan, creds.api_key, apiSecret, creds.testnet || false, supabaseAdmin);
          results.push(result);
        } catch (err: any) {
          errors.push(`Plan ${plan.id}: ${err.message}`);
        }
      }

      return new Response(
        JSON.stringify({
          data: {
            executed: results.length,
            total_plans_due: duePlans.length,
            results,
            errors: errors.length > 0 ? errors : undefined,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Action: history (get execution history) ─────────
    if (action === 'history') {
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
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const planId = body.planId;
      const limit = body.limit || 20;

      let query = supabaseAdmin
        .from('dca_executions')
        .select('*')
        .eq('user_id', user.id)
        .order('executed_at', { ascending: false })
        .limit(limit);

      if (planId) query = query.eq('plan_id', planId);

      const { data: executions, error } = await query;

      return new Response(
        JSON.stringify({ data: executions || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "execute-plan", "execute-due", or "history".' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[dca-execute] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
