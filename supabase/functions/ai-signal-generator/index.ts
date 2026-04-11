// Supabase Edge Function: ai-signal-generator
// Uses Claude API (Haiku for real-time, Sonnet for daily analysis) to generate trading signals
// Cron: every 4 hours for signals, daily for deep analysis
//
// Actions:
//   "generate-signals"   — Produce AI trading signals with conviction scores
//   "daily-analysis"     — Deep portfolio + market analysis (uses Sonnet)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, LINEAR_SYMBOLS } from '../_shared/bybit-api.ts';

const CONVICTION_THRESHOLD = 70;
const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const SONNET_MODEL = 'claude-sonnet-4-5-20241022';

// ─── Call Claude API ────────────────────────────────────────

async function callClaude(
  apiKey: string, model: string, systemPrompt: string, userPrompt: string, maxTokens: number = 1024
): Promise<any> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`Claude API ${response.status}: ${errBody}`);
  }

  const result = await response.json();
  const text = result.content?.[0]?.text || '';

  // Extract JSON from response — try direct parse first, then regex fallback
  try {
    return JSON.parse(text.trim());
  } catch {
    // Find the outermost balanced { } block
    let depth = 0, start = -1;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '{') { if (depth === 0) start = i; depth++; }
      if (text[i] === '}') { depth--; if (depth === 0 && start >= 0) return JSON.parse(text.slice(start, i + 1)); }
    }
    throw new Error('No valid JSON found in Claude response');
  }
}

// ─── Build market context for Claude ────────────────────────

function buildMarketContext(
  regime: any, marketData: any[], positions: any[], heat: number, performance: any[]
): string {
  const btc = marketData.find((d: any) => d.symbol === 'BTCUSDT');
  const eth = marketData.find((d: any) => d.symbol === 'ETHUSDT');

  return JSON.stringify({
    market_regime: {
      current: regime?.regime || 'UNKNOWN',
      confidence: regime?.confidence || 0,
    },
    btc: btc ? {
      price: btc.price, sma_7d: btc.sma_7d, sma_30d: btc.sma_30d, sma_90d: btc.sma_90d,
      rsi_14: btc.rsi_14, volatility_30d: btc.volatility_30d,
      funding_rate: btc.funding_rate, fear_greed: btc.fear_greed_index,
    } : null,
    eth: eth ? {
      price: eth.price, sma_7d: eth.sma_7d, sma_30d: eth.sma_30d,
      rsi_14: eth.rsi_14, volatility_30d: eth.volatility_30d, funding_rate: eth.funding_rate,
    } : null,
    portfolio: {
      heat_pct: (heat * 100).toFixed(1),
      open_positions: positions.map((p: any) => ({
        symbol: p.symbol, side: p.side, leverage: p.leverage,
        entry: p.entry_price, pnl_pct: p.entry_price > 0
          ? ((p.unrealized_pnl / (p.size_usd || 1)) * 100).toFixed(1) + '%' : '0%',
        strategy: p.strategy_type,
      })),
    },
    recent_performance: performance.slice(0, 5).map((p: any) => ({
      strategy: p.strategy_type, pnl: p.total_pnl_usd, win_rate: p.win_rate,
    })),
  }, null, 0);
}

const SYSTEM_PROMPT = `You are a quantitative crypto trading analyst for Apice Capital's ALTIS system.
You analyze market data and generate conviction-based trading signals.

RULES:
- Output ONLY valid JSON. No commentary, no markdown, no explanation outside JSON.
- Be risk-averse: false negatives (missing a trade) are better than false positives (bad trades).
- Never suggest leverage above 3x.
- Consider correlation: don't suggest BTC long if ETH long is already open (0.85 correlation).
- Conviction must be 0-100. Only signals >= 70 will be executed.
- Include a brief rationale for each signal.
- Consider funding rate: high positive funding means longs are crowded (contrarian short bias).

OUTPUT FORMAT:
{
  "signals": [
    {
      "asset": "BTC",
      "direction": "long" | "short" | "neutral",
      "conviction": 0-100,
      "suggested_leverage": 1-3,
      "rationale": "brief reason",
      "time_horizon": "4h" | "24h" | "48h" | "1w",
      "take_profit_pct": 3-10,
      "stop_loss_pct": 2-5
    }
  ],
  "allocation_override": {
    "grid": 0-100,
    "trend_following": 0-100,
    "mean_reversion": 0-100,
    "funding_arb": 0-100,
    "ai_signal": 0-100
  },
  "risk_assessment": "brief portfolio risk summary",
  "market_narrative": "1-2 sentence market view"
}`;

// ─── Main handler ───────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'generate-signals';

    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = Deno.env.get('CRON_SECRET');
    if (expectedSecret && cronSecret !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const json = (data: any) => new Response(
      JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

    // ─── Generate signals ────────────────────────────────────
    if (action === 'generate-signals') {
      // Get regime
      const { data: regime } = await supabaseAdmin
        .from('market_regimes')
        .select('regime, confidence')
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1).single();

      if (regime?.regime === 'CAPITULATION') {
        return json({ regime: 'CAPITULATION', signals: [], message: 'No signals in CAPITULATION' });
      }

      // Get market data
      const { data: marketData } = await supabaseAdmin
        .from('market_snapshots')
        .select('symbol, price, sma_7d, sma_30d, sma_90d, rsi_14, volatility_30d, funding_rate, fear_greed_index')
        .in('symbol', LINEAR_SYMBOLS)
        .order('captured_at', { ascending: false })
        .limit(LINEAR_SYMBOLS.length);

      // Get users with ai_signal strategy active
      const { data: aiConfigs } = await supabaseAdmin
        .from('strategy_configs')
        .select('user_id, allocation_pct, max_leverage')
        .eq('strategy_type', 'ai_signal')
        .eq('is_active', true);

      if (!aiConfigs || aiConfigs.length === 0) {
        return json({ message: 'No users with ai_signal active', signals: 0 });
      }

      let totalSignals = 0;

      for (const config of aiConfigs) {
        try {
          // Get user's positions
          const { data: positions } = await supabaseAdmin
            .from('leveraged_positions')
            .select('symbol, side, leverage, entry_price, size_usd, unrealized_pnl, strategy_type')
            .eq('user_id', config.user_id).eq('status', 'open');

          // Get recent performance
          const { data: perf } = await supabaseAdmin
            .from('leveraged_strategy_performance')
            .select('strategy_type, total_pnl_usd, win_rate')
            .eq('user_id', config.user_id)
            .order('period_end', { ascending: false })
            .limit(5);

          // Calculate heat
          const totalExposure = (positions || []).reduce((s: number, p: any) => s + (p.size_usd || 0) * (p.leverage || 1), 0);
          const heat = totalExposure > 0 ? 0.1 : 0; // simplified

          const context = buildMarketContext(regime, marketData || [], positions || [], heat, perf || []);

          // Call Claude Haiku
          const aiResponse = await callClaude(
            ANTHROPIC_API_KEY, HAIKU_MODEL, SYSTEM_PROMPT,
            `Analyze this market data and generate trading signals:\n${context}`
          );

          // Process signals
          const signals = aiResponse.signals || [];
          for (const signal of signals) {
            if (signal.conviction < CONVICTION_THRESHOLD) continue;

            const symbolMap: Record<string, string> = { BTC: 'BTCUSDT', ETH: 'ETHUSDT', SOL: 'SOLUSDT' };
            const symbol = symbolMap[signal.asset] || signal.asset + 'USDT';
            const price = (marketData || []).find((d: any) => d.symbol === symbol)?.price || 0;

            // Skip signals where price is unknown — TP/SL would be invalid
            if (price <= 0) continue;

            await supabaseAdmin.from('trading_signals').insert({
              user_id: config.user_id,
              strategy_type: 'ai_signal',
              symbol,
              direction: signal.direction,
              conviction: signal.conviction,
              suggested_leverage: Math.min(signal.suggested_leverage || 2, config.max_leverage || 3),
              suggested_size_usd: (config.allocation_pct / 100) * 10000 * 0.2, // 20% of AI allocation
              take_profit_price: price > 0 ? price * (1 + (signal.take_profit_pct || 5) / 100) : null,
              stop_loss_price: price > 0 ? price * (1 - (signal.stop_loss_pct || 3) / 100) : null,
              rationale: signal.rationale,
              risk_approved: true, // Pre-approved by AI conviction threshold
              market_regime: regime?.regime,
              indicators: { time_horizon: signal.time_horizon },
              ai_response: aiResponse,
              expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
            });
            totalSignals++;
          }

          // Apply allocation override if suggested
          if (aiResponse.allocation_override) {
            const overrides = aiResponse.allocation_override;
            for (const [stratType, pct] of Object.entries(overrides)) {
              if (typeof pct === 'number' && pct >= 0 && pct <= 100) {
                await supabaseAdmin.from('strategy_configs')
                  .update({ allocation_pct: pct, updated_at: new Date().toISOString() })
                  .eq('user_id', config.user_id)
                  .eq('strategy_type', stratType);
              }
            }
          }
        } catch (e: any) {
          console.error(`[ai-signal-generator] Error for user ${config.user_id.slice(0, 8)}:`, e.message);
        }
      }

      return json({
        usersProcessed: aiConfigs.length, signalsGenerated: totalSignals,
        model: HAIKU_MODEL, timestamp: new Date().toISOString(),
      });
    }

    // ─── Daily deep analysis ─────────────────────────────────
    if (action === 'daily-analysis') {
      const { data: regime } = await supabaseAdmin
        .from('market_regimes')
        .select('regime, confidence')
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1).single();

      const { data: marketData } = await supabaseAdmin
        .from('market_snapshots')
        .select('*')
        .in('symbol', ['BTCUSDT', 'ETHUSDT'])
        .order('captured_at', { ascending: false })
        .limit(2);

      const analysis = await callClaude(
        ANTHROPIC_API_KEY, SONNET_MODEL,
        `You are a senior quant analyst. Provide a daily market analysis for a crypto portfolio.
Output JSON: { "summary": "...", "outlook": "bullish|bearish|neutral", "key_levels": { "btc_support": N, "btc_resistance": N, "eth_support": N, "eth_resistance": N }, "risk_factors": ["..."], "opportunities": ["..."], "recommendation": "..." }`,
        `Market regime: ${regime?.regime || 'UNKNOWN'}\nData: ${JSON.stringify(marketData)}`,
        2048
      );

      // Store as smart_alert for all active users
      const { data: activeUsers } = await supabaseAdmin
        .from('strategy_configs')
        .select('user_id')
        .eq('is_active', true);

      const uniqueUsers = [...new Set((activeUsers || []).map(u => u.user_id))];
      for (const userId of uniqueUsers) {
        await supabaseAdmin.from('smart_alerts').insert({
          user_id: userId,
          alert_type: 'strategy_outperforming',
          severity: 'info',
          title: `Daily Analysis: ${analysis.outlook?.toUpperCase() || 'N/A'} outlook`,
          message: analysis.summary || 'See full analysis.',
          action_data: analysis,
          is_read: false, is_acted_on: false,
        });
      }

      return json({ analysis, model: SONNET_MODEL, usersNotified: uniqueUsers.length });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: generate-signals, daily-analysis' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[ai-signal-generator] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
