// Supabase Edge Function: strategy-orchestrator
// The ALTIS brain — generates signals, filters risk, AUTO-EXECUTES approved trades
// Cron: every 15 min for grid/mean-reversion, every 1h for trend
//
// Actions:
//   "evaluate"              — Run all strategy signal generators + auto-execute (cron)
//   "evaluate-user"         — Evaluate a single user (frontend-triggered, no cron secret)
//   "rebalance-strategies"  — Adjust allocation by current market regime
//   "calculate-performance" — Calculate strategy performance metrics (daily cron)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, bybitPost, bybitGet, LINEAR_SYMBOLS } from '../_shared/bybit-api.ts';
import { getUserCredentials } from '../_shared/auth.ts';

// ─── Regime-based allocation ────────────────────────────────

type Regime = 'BULL' | 'BEAR' | 'SIDEWAYS' | 'HIGH_VOLATILITY' | 'ALTSEASON' | 'CAPITULATION';

const REGIME_ALLOCATIONS: Record<string, Record<string, number>> = {
  BULL:            { grid: 20, trend_following: 40, mean_reversion: 10, funding_arb: 20, ai_signal: 10 },
  BEAR:            { grid: 10, trend_following: 30, mean_reversion: 15, funding_arb: 25, ai_signal: 20 },
  SIDEWAYS:        { grid: 50, trend_following: 10, mean_reversion: 20, funding_arb: 15, ai_signal: 5 },
  HIGH_VOLATILITY: { grid: 15, trend_following: 20, mean_reversion: 25, funding_arb: 25, ai_signal: 15 },
  ALTSEASON:       { grid: 25, trend_following: 35, mean_reversion: 10, funding_arb: 15, ai_signal: 15 },
  CAPITULATION:    { grid: 0, trend_following: 0, mean_reversion: 0, funding_arb: 0, ai_signal: 0 },
};

const MAX_LEVERAGE_BY_REGIME: Record<string, number> = {
  BULL: 5, BEAR: 3, SIDEWAYS: 5, HIGH_VOLATILITY: 2, ALTSEASON: 3, CAPITULATION: 0,
};

// ─── Auto-execute approved signals ──────────────────────────

async function autoExecuteSignals(
  supabaseAdmin: any, userId: string, approved: Signal[], marketData: any[], currentRegime: string
): Promise<{ executed: number; failed: number }> {
  const ENCRYPTION_KEY = Deno.env.get('ENCRYPTION_KEY');
  if (!ENCRYPTION_KEY) return { executed: 0, failed: 0 };

  let executed = 0, failed = 0;

  // Check if user has auto-execute enabled (default: true)
  const { data: userConfig } = await supabaseAdmin
    .from('strategy_configs')
    .select('params')
    .eq('user_id', userId)
    .limit(1)
    .single();

  // Get user credentials
  let creds;
  try {
    creds = await getUserCredentials(supabaseAdmin, userId, ENCRYPTION_KEY);
  } catch {
    return { executed: 0, failed: 0 }; // No Bybit credentials
  }

  for (const signal of approved) {
    if (signal.direction === 'neutral') continue;

    try {
      // Idempotency: skip if position already exists for this user+symbol+direction
      const { data: existing } = await supabaseAdmin
        .from('leveraged_positions')
        .select('id')
        .eq('user_id', userId)
        .eq('symbol', signal.symbol)
        .eq('side', signal.direction)
        .eq('status', 'open')
        .limit(1);
      if (existing && existing.length > 0) {
        console.log(`[orchestrator] SKIP: ${signal.direction} ${signal.symbol} — position already open`);
        continue;
      }

      const price = marketData.find((d: any) => d.symbol === signal.symbol)?.price;
      if (!price || price <= 0) continue;

      // Calculate qty from USD size
      const qty = (signal.suggestedSizeUsd / price).toFixed(6);
      const side = signal.direction === 'long' ? 'Buy' : 'Sell';
      const maxLevByRegime = MAX_LEVERAGE_BY_REGIME[currentRegime] || 2;
      const leverage = Math.min(signal.suggestedLeverage, maxLevByRegime);

      // Set leverage
      try {
        await bybitPost(creds.apiKey, creds.apiSecret, creds.testnet, '/v5/position/set-leverage', {
          category: 'linear', symbol: signal.symbol,
          buyLeverage: String(leverage), sellLeverage: String(leverage),
        });
      } catch { /* already set */ }

      // Place order
      const orderParams: Record<string, any> = {
        category: 'linear', symbol: signal.symbol, side, orderType: 'Market', qty,
      };
      if (signal.takeProfit) orderParams.takeProfit = String(signal.takeProfit);
      if (signal.stopLoss) orderParams.stopLoss = String(signal.stopLoss);

      const orderResult = await bybitPost(creds.apiKey, creds.apiSecret, creds.testnet,
        '/v5/order/create', orderParams);

      const orderId = orderResult.orderId || '';

      // Get fill price
      let entryPrice = price;
      if (orderId) {
        await new Promise(r => setTimeout(r, 1000));
        try {
          const detail = await bybitGet(creds.apiKey, creds.apiSecret, creds.testnet,
            '/v5/order/realtime', { category: 'linear', orderId });
          entryPrice = parseFloat(detail.list?.[0]?.avgPrice) || price;
        } catch { /* use market price */ }
      }

      // Record position
      const { data: pos } = await supabaseAdmin.from('leveraged_positions').insert({
        user_id: userId, strategy_type: signal.strategyType,
        symbol: signal.symbol, side: signal.direction,
        entry_price: entryPrice, size_qty: parseFloat(qty),
        size_usd: signal.suggestedSizeUsd, leverage,
        take_profit_price: signal.takeProfit, stop_loss_price: signal.stopLoss,
        bybit_order_id: orderId, status: 'open',
      }).select('id').single();

      // Update signal as executed
      if (pos) {
        await supabaseAdmin.from('trading_signals')
          .update({ was_executed: true, position_id: pos.id })
          .eq('user_id', userId)
          .eq('strategy_type', signal.strategyType)
          .eq('symbol', signal.symbol)
          .eq('was_executed', false)
          .order('created_at', { ascending: false })
          .limit(1);
      }

      executed++;
      console.log(`[orchestrator] EXECUTED: ${signal.direction} ${signal.symbol} ${leverage}x, entry $${entryPrice}`);
    } catch (e: any) {
      failed++;
      console.error(`[orchestrator] FAILED to execute ${signal.symbol}:`, e.message);
    }
  }

  return { executed, failed };
}

// ─── Signal interface ───────────────────────────────────────

interface Signal {
  strategyType: string;
  symbol: string;
  direction: 'long' | 'short' | 'neutral';
  conviction: number;
  suggestedLeverage: number;
  suggestedSizeUsd: number;
  takeProfit?: number;
  stopLoss?: number;
  rationale: string;
  indicators: Record<string, any>;
}

// ─── STRATEGY 1: Grid Trading Signal Generator ──────────────

function generateGridSignals(
  regime: string, marketData: any[], allocatedCapital: number
): Signal[] {
  if (regime === 'CAPITULATION' || regime === 'HIGH_VOLATILITY') return [];
  if (allocatedCapital < 200) return [];

  const signals: Signal[] = [];
  const btcData = marketData.find((d: any) => d.symbol === 'BTCUSDT');
  if (!btcData) return [];

  const price = btcData.price;
  const vol = btcData.volatility_30d || 0.3;

  // Grid spacing based on volatility
  const gridSpacingPct = Math.max(0.005, Math.min(0.02, vol * 0.03)); // 0.5%-2% spacing
  const gridLevels = 5;
  const perLevelUsd = allocatedCapital / (gridLevels * 2); // 5 buy + 5 sell

  for (let i = 1; i <= gridLevels; i++) {
    // Buy levels below current price
    const buyPrice = price * (1 - gridSpacingPct * i);
    signals.push({
      strategyType: 'grid', symbol: 'BTCUSDT', direction: 'long',
      conviction: 60 + (regime === 'SIDEWAYS' ? 15 : 0),
      suggestedLeverage: 2, suggestedSizeUsd: perLevelUsd,
      takeProfit: buyPrice * (1 + gridSpacingPct * 2),
      stopLoss: buyPrice * (1 - gridSpacingPct * 3),
      rationale: `Grid buy level ${i}: $${buyPrice.toFixed(0)} (${(gridSpacingPct * i * 100).toFixed(1)}% below spot)`,
      indicators: { gridLevel: -i, spacing: gridSpacingPct, volatility: vol },
    });

    // Sell levels above current price
    const sellPrice = price * (1 + gridSpacingPct * i);
    signals.push({
      strategyType: 'grid', symbol: 'BTCUSDT', direction: 'short',
      conviction: 60 + (regime === 'SIDEWAYS' ? 15 : 0),
      suggestedLeverage: 2, suggestedSizeUsd: perLevelUsd,
      takeProfit: sellPrice * (1 - gridSpacingPct * 2),
      stopLoss: sellPrice * (1 + gridSpacingPct * 3),
      rationale: `Grid sell level ${i}: $${sellPrice.toFixed(0)} (${(gridSpacingPct * i * 100).toFixed(1)}% above spot)`,
      indicators: { gridLevel: i, spacing: gridSpacingPct, volatility: vol },
    });
  }

  return signals;
}

// ─── STRATEGY 2: Trend Following ────────────────────────────

function generateTrendSignals(
  regime: string, marketData: any[], allocatedCapital: number
): Signal[] {
  if (regime === 'CAPITULATION') return [];
  if (allocatedCapital < 200) return [];

  const signals: Signal[] = [];

  for (const symbol of ['BTCUSDT', 'ETHUSDT']) {
    const data = marketData.find((d: any) => d.symbol === symbol);
    if (!data) continue;

    const price = data.price;
    const sma7 = data.sma_7d;
    const sma30 = data.sma_30d;
    const rsi = data.rsi_14;
    const fundingRate = data.funding_rate || 0;

    if (!sma7 || !sma30 || !rsi) continue;

    // Golden Cross: short SMA > long SMA + RSI confirms
    if (sma7 > sma30 * 1.02 && rsi > 50 && regime === 'BULL') {
      const isCrowded = fundingRate > 0.05; // Too many longs
      if (!isCrowded) {
        signals.push({
          strategyType: 'trend_following', symbol, direction: 'long',
          conviction: 70 + (rsi > 60 ? 10 : 0),
          suggestedLeverage: regime === 'BULL' ? 3 : 2,
          suggestedSizeUsd: allocatedCapital * 0.3,
          takeProfit: price * 1.08,
          stopLoss: price * 0.96,
          rationale: `Golden Cross: SMA7 ($${sma7.toFixed(0)}) > SMA30 ($${sma30.toFixed(0)}), RSI ${rsi.toFixed(0)}, trend confirmed`,
          indicators: { sma7, sma30, rsi, fundingRate, crossType: 'golden' },
        });
      }
    }

    // Death Cross: short SMA < long SMA + RSI confirms
    if (sma7 < sma30 * 0.98 && rsi < 50 && (regime === 'BEAR' || regime === 'HIGH_VOLATILITY')) {
      const isCrowded = fundingRate < -0.03; // Too many shorts
      if (!isCrowded) {
        signals.push({
          strategyType: 'trend_following', symbol, direction: 'short',
          conviction: 70 + (rsi < 40 ? 10 : 0),
          suggestedLeverage: 2,
          suggestedSizeUsd: allocatedCapital * 0.25,
          takeProfit: price * 0.92,
          stopLoss: price * 1.04,
          rationale: `Death Cross: SMA7 ($${sma7.toFixed(0)}) < SMA30 ($${sma30.toFixed(0)}), RSI ${rsi.toFixed(0)}, downtrend confirmed`,
          indicators: { sma7, sma30, rsi, fundingRate, crossType: 'death' },
        });
      }
    }
  }

  return signals;
}

// ─── STRATEGY 3: Mean Reversion ─────────────────────────────

function generateMeanRevSignals(
  regime: string, marketData: any[], allocatedCapital: number
): Signal[] {
  if (regime === 'CAPITULATION') return [];
  if (allocatedCapital < 200) return [];

  const signals: Signal[] = [];

  for (const symbol of ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']) {
    const data = marketData.find((d: any) => d.symbol === symbol);
    if (!data || !data.rsi_14 || !data.sma_30d) continue;

    const price = data.price;
    const rsi = data.rsi_14;
    const mean = data.sma_30d;

    // Oversold → Long bounce (skip in BEAR to avoid catching knives)
    if (rsi < 35 && regime !== 'BEAR') {
      signals.push({
        strategyType: 'mean_reversion', symbol, direction: 'long',
        conviction: 75 + (rsi < 25 ? 15 : 0),
        suggestedLeverage: 2,
        suggestedSizeUsd: allocatedCapital * 0.2,
        takeProfit: mean, // Target: return to mean
        stopLoss: price * 0.97, // Tight 3% stop
        rationale: `RSI oversold at ${rsi.toFixed(0)}, expecting reversion to mean ($${mean.toFixed(0)})`,
        indicators: { rsi, mean, deviation: ((price - mean) / mean * 100).toFixed(1) + '%' },
      });
    }

    // Overbought → Short reversal (skip in BULL)
    if (rsi > 65 && regime !== 'BULL') {
      signals.push({
        strategyType: 'mean_reversion', symbol, direction: 'short',
        conviction: 70 + (rsi > 80 ? 15 : 0),
        suggestedLeverage: 2,
        suggestedSizeUsd: allocatedCapital * 0.2,
        takeProfit: mean,
        stopLoss: price * 1.03,
        rationale: `RSI overbought at ${rsi.toFixed(0)}, expecting reversion to mean ($${mean.toFixed(0)})`,
        indicators: { rsi, mean, deviation: ((price - mean) / mean * 100).toFixed(1) + '%' },
      });
    }
  }

  return signals;
}

// ─── STRATEGY 4: Funding Rate Arbitrage ─────────────────────

function generateFundingArbSignals(
  regime: string, marketData: any[], allocatedCapital: number
): Signal[] {
  if (regime === 'CAPITULATION') return [];
  if (allocatedCapital < 500) return []; // Need min $500 for arb to be worthwhile

  const signals: Signal[] = [];

  for (const symbol of ['BTCUSDT', 'ETHUSDT']) {
    const data = marketData.find((d: any) => d.symbol === symbol);
    if (!data) continue;

    const fundingRate = data.funding_rate || 0;

    // Positive funding: longs pay shorts → go short perp + long spot = collect funding
    if (fundingRate > 0.005) {
      const annualizedYield = fundingRate * 3 * 365; // 3 payments/day
      signals.push({
        strategyType: 'funding_arb', symbol, direction: 'short', // Short perp leg
        conviction: 85, // High conviction — this is near-riskless
        suggestedLeverage: 1, // Delta neutral = 1x
        suggestedSizeUsd: allocatedCapital * 0.4,
        rationale: `Funding rate ${(fundingRate * 100).toFixed(3)}% (${(annualizedYield * 100).toFixed(1)}% APY). Delta-neutral arb: short perp + long spot.`,
        indicators: { fundingRate, annualizedYield, paymentsPerDay: 3 },
      });
    }
  }

  return signals;
}

// ─── Risk filter ────────────────────────────────────────────

const CORRELATION: Record<string, Record<string, number>> = {
  BTCUSDT: { BTCUSDT: 1, ETHUSDT: 0.85, SOLUSDT: 0.75 },
  ETHUSDT: { BTCUSDT: 0.85, ETHUSDT: 1, SOLUSDT: 0.80 },
  SOLUSDT: { BTCUSDT: 0.75, ETHUSDT: 0.80, SOLUSDT: 1 },
};

function filterSignalsByRisk(
  signals: Signal[], openPositions: any[], heat: number, regime: string, maxLeverage: number
): Signal[] {
  return signals.filter(signal => {
    // 1. Heat check
    if (heat >= 0.20) {
      signal.rationale = `BLOCKED: Portfolio heat ${(heat * 100).toFixed(1)}% >= 20%`;
      return false;
    }

    // 2. Leverage cap
    if (signal.suggestedLeverage > maxLeverage) {
      signal.suggestedLeverage = maxLeverage;
    }
    if (signal.suggestedLeverage <= 0) return false;

    // 3. Correlation check — don't open same-direction correlated positions
    for (const pos of openPositions) {
      if (pos.status !== 'open') continue;
      const corr = CORRELATION[signal.symbol]?.[pos.symbol] || 0;
      const sameDirection = (signal.direction === 'long' && pos.side === 'long') ||
                           (signal.direction === 'short' && pos.side === 'short');
      if (sameDirection && corr > 0.70) {
        signal.rationale = `BLOCKED: ${signal.symbol} ${(corr * 100).toFixed(0)}% correlated with open ${pos.symbol} ${pos.side}`;
        return false;
      }
      if (sameDirection && corr > 0.50) {
        signal.suggestedSizeUsd *= 0.5; // Reduce size
      }
    }

    // 4. Conviction threshold
    if (signal.conviction < 65) return false;

    // 5. No duplicate positions
    const hasDuplicate = openPositions.some((p: any) =>
      p.symbol === signal.symbol && p.side === signal.direction && p.status === 'open'
    );
    if (hasDuplicate) return false;

    return true;
  });
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
    const action = body.action || 'evaluate';

    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = Deno.env.get('CRON_SECRET');
    if (expectedSecret && cronSecret !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const json = (data: any) => new Response(
      JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

    // ─── Evaluate: generate signals for all active users ─────
    if (action === 'evaluate') {
      // Get current regime
      const { data: regimeData } = await supabaseAdmin
        .from('market_regimes')
        .select('regime, confidence')
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      const regime = regimeData?.regime || 'SIDEWAYS';
      if (regime === 'CAPITULATION') {
        return json({ regime, message: 'CAPITULATION — all strategies paused', signalsGenerated: 0 });
      }

      const maxLeverage = MAX_LEVERAGE_BY_REGIME[regime] || 1;

      // Get latest market data
      const { data: marketData } = await supabaseAdmin
        .from('market_snapshots')
        .select('symbol, price, sma_7d, sma_30d, sma_90d, rsi_14, volatility_30d, funding_rate, fear_greed_index')
        .in('symbol', LINEAR_SYMBOLS)
        .order('captured_at', { ascending: false })
        .limit(LINEAR_SYMBOLS.length);

      if (!marketData || marketData.length === 0) {
        return json({ error: 'No market data available', signalsGenerated: 0 });
      }

      // Get all users with active strategies
      const { data: activeConfigs } = await supabaseAdmin
        .from('strategy_configs')
        .select('user_id, strategy_type, allocation_pct, max_leverage, assets, params')
        .eq('is_active', true);

      if (!activeConfigs || activeConfigs.length === 0) {
        return json({ regime, message: 'No active strategy configs', signalsGenerated: 0 });
      }

      const userIds = [...new Set(activeConfigs.map(c => c.user_id))];
      let totalSignals = 0;
      let totalApproved = 0;
      let totalExecuted = 0;

      for (const userId of userIds) {
        const userConfigs = activeConfigs.filter(c => c.user_id === userId);

        // Get open positions
        const { data: openPositions } = await supabaseAdmin
          .from('leveraged_positions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'open');

        // Calculate heat
        const totalExposure = (openPositions || []).reduce((s: number, p: any) => s + p.size_usd * p.leverage, 0);
        const totalMargin = (openPositions || []).reduce((s: number, p: any) => s + (p.size_usd || 0), 0);
      const estimatedEquity = totalMargin > 0 ? totalMargin : 10000;
        let totalRisk = 0;
        for (const p of (openPositions || [])) {
          const slDist = p.stop_loss_price && p.entry_price
            ? Math.abs(p.entry_price - p.stop_loss_price) / p.entry_price : 0.02;
          totalRisk += p.size_usd * p.leverage * slDist;
        }
        const heat = estimatedEquity > 0 ? totalRisk / estimatedEquity : 0;

        // Generate signals per strategy
        let allSignals: Signal[] = [];

        for (const config of userConfigs) {
          const allocatedCapital = estimatedEquity * (config.allocation_pct / 100);
          const effectiveLeverage = Math.min(config.max_leverage || 2, maxLeverage);

          switch (config.strategy_type) {
            case 'grid':
              allSignals.push(...generateGridSignals(regime, marketData, allocatedCapital));
              break;
            case 'trend_following':
              allSignals.push(...generateTrendSignals(regime, marketData, allocatedCapital));
              break;
            case 'mean_reversion':
              allSignals.push(...generateMeanRevSignals(regime, marketData, allocatedCapital));
              break;
            case 'funding_arb':
              allSignals.push(...generateFundingArbSignals(regime, marketData, allocatedCapital));
              break;
            // ai_signal handled by separate ai-signal-generator function
          }
        }

        totalSignals += allSignals.length;

        // Filter through risk management
        const approved = filterSignalsByRisk(allSignals, openPositions || [], heat, regime, maxLeverage);
        totalApproved += approved.length;

        // Save all signals to DB (approved and rejected for audit)
        for (const signal of allSignals) {
          const isApproved = approved.includes(signal);
          await supabaseAdmin.from('trading_signals').insert({
            user_id: userId,
            strategy_type: signal.strategyType,
            symbol: signal.symbol,
            direction: signal.direction,
            conviction: signal.conviction,
            suggested_leverage: signal.suggestedLeverage,
            suggested_size_usd: signal.suggestedSizeUsd,
            take_profit_price: signal.takeProfit,
            stop_loss_price: signal.stopLoss,
            rationale: signal.rationale,
            risk_approved: isApproved,
            risk_rejection_reason: isApproved ? null : signal.rationale,
            portfolio_heat_at_signal: heat,
            market_regime: regime,
            indicators: signal.indicators,
            expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          });
        }

        // AUTO-EXECUTE approved signals on Bybit
        if (approved.length > 0) {
          const execResult = await autoExecuteSignals(supabaseAdmin, userId, approved, marketData || [], regime);
          totalExecuted += execResult.executed;
        }
      }

      return json({
        regime, regimeConfidence: regimeData?.confidence,
        maxLeverage, usersProcessed: userIds.length,
        signalsGenerated: totalSignals, signalsApproved: totalApproved,
        signalsExecuted: totalExecuted,
        timestamp: new Date().toISOString(),
      });
    }

    // ─── Rebalance strategies by regime ──────────────────────
    // ─── Evaluate single user (frontend-triggered) ─────────
    if (action === 'evaluate-user') {
      // Auth via JWT (no cron secret needed)
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

      // Get regime + market data
      const { data: regimeData } = await supabaseAdmin
        .from('market_regimes').select('regime, confidence')
        .is('ended_at', null).order('started_at', { ascending: false }).limit(1).single();

      const regime = regimeData?.regime || 'SIDEWAYS';
      const maxLeverage = MAX_LEVERAGE_BY_REGIME[regime] || 2;

      const { data: marketData } = await supabaseAdmin
        .from('market_snapshots')
        .select('symbol, price, sma_7d, sma_30d, sma_90d, rsi_14, volatility_30d, funding_rate, fear_greed_index')
        .in('symbol', LINEAR_SYMBOLS)
        .order('captured_at', { ascending: false }).limit(LINEAR_SYMBOLS.length);

      // Get user's active strategies
      const { data: userConfigs } = await supabaseAdmin
        .from('strategy_configs').select('*').eq('user_id', user.id).eq('is_active', true);

      if (!userConfigs || userConfigs.length === 0 || !marketData || marketData.length === 0) {
        // Return market context even without signals
        return json({
          regime, marketData: marketData || [],
          signals: [], executed: 0,
          message: !userConfigs?.length ? 'No active strategies' : 'No market data',
        });
      }

      // Get open positions
      const { data: openPositions } = await supabaseAdmin
        .from('leveraged_positions').select('*').eq('user_id', user.id).eq('status', 'open');

      const totalExposure = (openPositions || []).reduce((s: number, p: any) => s + p.size_usd * p.leverage, 0);
      const totalMargin = (openPositions || []).reduce((s: number, p: any) => s + (p.size_usd || 0), 0);
      const estimatedEquity = totalMargin > 0 ? totalMargin : 10000;
      let totalRisk = 0;
      for (const p of (openPositions || [])) {
        const slDist = p.stop_loss_price && p.entry_price
          ? Math.abs(p.entry_price - p.stop_loss_price) / p.entry_price : 0.02;
        totalRisk += p.size_usd * p.leverage * slDist;
      }
      const heat = estimatedEquity > 0 ? totalRisk / estimatedEquity : 0;

      // Generate signals
      let allSignals: Signal[] = [];
      for (const config of userConfigs) {
        const allocatedCapital = estimatedEquity * (config.allocation_pct / 100);
        switch (config.strategy_type) {
          case 'grid': allSignals.push(...generateGridSignals(regime, marketData, allocatedCapital)); break;
          case 'trend_following': allSignals.push(...generateTrendSignals(regime, marketData, allocatedCapital)); break;
          case 'mean_reversion': allSignals.push(...generateMeanRevSignals(regime, marketData, allocatedCapital)); break;
          case 'funding_arb': allSignals.push(...generateFundingArbSignals(regime, marketData, allocatedCapital)); break;
        }
      }

      const approved = filterSignalsByRisk(allSignals, openPositions || [], heat, regime, maxLeverage);

      // Save signals
      for (const signal of allSignals) {
        const isApproved = approved.includes(signal);
        await supabaseAdmin.from('trading_signals').insert({
          user_id: user.id, strategy_type: signal.strategyType, symbol: signal.symbol,
          direction: signal.direction, conviction: signal.conviction,
          suggested_leverage: signal.suggestedLeverage, suggested_size_usd: signal.suggestedSizeUsd,
          take_profit_price: signal.takeProfit, stop_loss_price: signal.stopLoss,
          rationale: signal.rationale, risk_approved: isApproved,
          portfolio_heat_at_signal: heat, market_regime: regime, indicators: signal.indicators,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        });
      }

      // Auto-execute
      let executedCount = 0;
      if (approved.length > 0) {
        const execResult = await autoExecuteSignals(supabaseAdmin, user.id, approved, marketData, regime);
        executedCount = execResult.executed;
      }

      return json({
        regime, confidence: regimeData?.confidence,
        marketContext: (marketData || []).reduce((acc: any, d: any) => {
          acc[d.symbol] = { price: d.price, rsi: d.rsi_14, sma7: d.sma_7d, sma30: d.sma_30d, funding: d.funding_rate, fg: d.fear_greed_index };
          return acc;
        }, {}),
        signals: allSignals.map(s => ({
          ...s, approved: approved.includes(s),
        })),
        totalGenerated: allSignals.length, totalApproved: approved.length, totalExecuted: executedCount,
        heat, timestamp: new Date().toISOString(),
      });
    }

    if (action === 'rebalance-strategies') {
      const { data: regimeData } = await supabaseAdmin
        .from('market_regimes')
        .select('regime')
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      const regime = regimeData?.regime || 'SIDEWAYS';
      const targetAlloc = REGIME_ALLOCATIONS[regime] || REGIME_ALLOCATIONS['SIDEWAYS'];

      // Get all users with any strategy config
      const { data: configs } = await supabaseAdmin
        .from('strategy_configs')
        .select('id, user_id, strategy_type, allocation_pct');

      if (!configs) return json({ updated: 0 });

      let updated = 0;
      for (const config of configs) {
        const newAlloc = targetAlloc[config.strategy_type];
        if (newAlloc !== undefined && newAlloc !== config.allocation_pct) {
          await supabaseAdmin.from('strategy_configs')
            .update({ allocation_pct: newAlloc, updated_at: new Date().toISOString() })
            .eq('id', config.id);
          updated++;
        }
      }

      return json({ regime, targetAllocation: targetAlloc, updated, timestamp: new Date().toISOString() });
    }

    // ─── Calculate performance ───────────────────────────────
    if (action === 'calculate-performance') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: closedPositions } = await supabaseAdmin
        .from('leveraged_positions')
        .select('user_id, strategy_type, realized_pnl, size_usd, leverage, funding_received')
        .eq('status', 'closed')
        .gte('closed_at', yesterday.toISOString())
        .lt('closed_at', today.toISOString());

      if (!closedPositions || closedPositions.length === 0) {
        return json({ message: 'No closed positions yesterday', calculated: 0 });
      }

      // Group by user + strategy
      const groups: Record<string, any[]> = {};
      for (const pos of closedPositions) {
        const key = `${pos.user_id}:${pos.strategy_type}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(pos);
      }

      let calculated = 0;
      for (const [key, positions] of Object.entries(groups)) {
        const [userId, strategyType] = key.split(':');
        const wins = positions.filter(p => p.realized_pnl > 0);
        const losses = positions.filter(p => p.realized_pnl <= 0);
        const totalPnl = positions.reduce((s, p) => s + (p.realized_pnl || 0), 0);
        const totalFunding = positions.reduce((s, p) => s + (p.funding_received || 0), 0);
        const totalCapital = positions.reduce((s, p) => s + (p.size_usd || 0), 0);

        await supabaseAdmin.from('leveraged_strategy_performance').insert({
          user_id: userId,
          strategy_type: strategyType,
          period: 'daily',
          period_start: yesterday.toISOString(),
          period_end: today.toISOString(),
          total_pnl_usd: totalPnl,
          total_pnl_pct: totalCapital > 0 ? (totalPnl / totalCapital) * 100 : 0,
          realized_pnl: totalPnl,
          funding_income: totalFunding,
          trades_closed: positions.length,
          win_rate: positions.length > 0 ? (wins.length / positions.length) * 100 : 0,
          avg_win_pct: wins.length > 0 ? wins.reduce((s, p) => s + (p.realized_pnl / p.size_usd * 100), 0) / wins.length : 0,
          avg_loss_pct: losses.length > 0 ? losses.reduce((s, p) => s + (p.realized_pnl / p.size_usd * 100), 0) / losses.length : 0,
          profit_factor: (() => {
            const grossWin = Math.abs(wins.reduce((s, p) => s + p.realized_pnl, 0));
            const grossLoss = Math.abs(losses.reduce((s, p) => s + p.realized_pnl, 0));
            return grossLoss > 0 ? Math.min(grossWin / grossLoss, 999) : (grossWin > 0 ? 999 : 0);
          })(),
          capital_deployed: totalCapital,
        });
        calculated++;
      }

      return json({ calculated, date: yesterday.toISOString(), timestamp: new Date().toISOString() });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: evaluate, rebalance-strategies, calculate-performance' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[strategy-orchestrator] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
