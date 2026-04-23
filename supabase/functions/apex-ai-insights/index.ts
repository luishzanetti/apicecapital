// Supabase Edge Function: apex-ai-insights
//
// AI-powered portfolio insights. When ANTHROPIC_API_KEY is configured, calls
// Claude Haiku 4.5 with a compact portfolio snapshot and returns structured
// insights (health score + recommendations + alerts).
//
// Fallback: if no key or error, returns `data: null` so client falls back to
// its deterministic local engine.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/bybit-api.ts';

const CORS_HEADERS = getCorsHeaders();
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 1500;

interface InsightsRequest {
  portfolio_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ success: false, error: 'Missing Authorization' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ success: false, error: 'Unauthorized' }, 401);

    const body = (await req.json()) as InsightsRequest;
    if (!body.portfolio_id) return json({ success: false, error: 'portfolio_id required' }, 400);

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      // LLM not configured yet — client falls back to local engine
      return json({ success: true, data: null, note: 'LLM not configured' });
    }

    // Use service role for data read so we can bypass RLS (we already auth'd user)
    const svc = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // ─── Build compact snapshot ─────────────────────
    const [pRes, posRes, tradesRes, creditsRes, layerCfgRes, eventsRes, regimeRes] = await Promise.all([
      svc.from('apex_ai_portfolios').select('*').eq('id', body.portfolio_id).single(),
      svc.from('apex_ai_positions').select('*').eq('portfolio_id', body.portfolio_id).eq('status', 'open'),
      svc.from('apex_ai_trades').select('*').eq('portfolio_id', body.portfolio_id).order('closed_at', { ascending: false }).limit(30),
      svc.from('apex_ai_user_credits').select('*').eq('user_id', user.id).maybeSingle(),
      svc.from('apex_ai_layer_config').select('*').eq('portfolio_id', body.portfolio_id).maybeSingle(),
      svc.from('apex_ai_strategy_events').select('*').eq('portfolio_id', body.portfolio_id).order('created_at', { ascending: false }).limit(10),
      svc.from('apex_ai_regime_state').select('*'),
    ]);

    if (pRes.error || !pRes.data) return json({ success: false, error: 'portfolio not found' }, 404);

    const portfolio = pRes.data;
    const positions = posRes.data ?? [];
    const trades = tradesRes.data ?? [];
    const credits = creditsRes.data;
    const layerCfg = layerCfgRes.data;
    const recentEvents = eventsRes.data ?? [];
    const regimes: Record<string, unknown> = {};
    for (const r of regimeRes.data ?? []) regimes[(r as { symbol: string }).symbol] = r;

    // Compute key stats inline to feed LLM
    const winCount = trades.filter((t) => Number((t as { pnl: number }).pnl) > 0).length;
    const lossCount = trades.length - winCount;
    const totalPnl = trades.reduce((s, t) => s + Number((t as { net_pnl?: number; pnl: number }).net_pnl ?? (t as { pnl: number }).pnl), 0);
    const winRate = trades.length > 0 ? (winCount / trades.length) * 100 : 0;

    // Group positions by symbol/side for martingale awareness
    const positionGroups: Record<string, { symbol: string; side: string; layers: number; total_size: number; avg_entry: number; unrealized_pnl: number }> = {};
    for (const p of positions) {
      const pos = p as Record<string, unknown>;
      const key = `${pos.symbol}-${pos.side}-${pos.parent_position_group ?? pos.id}`;
      if (!positionGroups[key]) {
        positionGroups[key] = {
          symbol: String(pos.symbol),
          side: String(pos.side),
          layers: 0,
          total_size: 0,
          avg_entry: 0,
          unrealized_pnl: 0,
        };
      }
      const g = positionGroups[key];
      g.layers++;
      g.total_size += Number(pos.size);
      g.avg_entry += Number(pos.entry_price) * Number(pos.size);
      g.unrealized_pnl += Number(pos.unrealized_pnl);
    }
    for (const g of Object.values(positionGroups)) {
      g.avg_entry = g.total_size > 0 ? g.avg_entry / g.total_size : 0;
    }

    const snapshot = {
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        capital_usdt: Number(portfolio.capital_usdt),
        risk_profile: portfolio.risk_profile,
        status: portfolio.status,
        max_leverage: portfolio.max_leverage,
        total_pnl: Number(portfolio.total_pnl),
        drawdown_high_water_mark: Number(portfolio.drawdown_high_water_mark ?? portfolio.capital_usdt),
      },
      layer_config: layerCfg ? {
        max_layers: layerCfg.max_layers,
        take_profit_pct: Number(layerCfg.take_profit_pct),
        layer_spacing_atr: Number(layerCfg.layer_spacing_atr),
      } : null,
      stats: {
        total_trades: trades.length,
        win_count: winCount,
        loss_count: lossCount,
        win_rate_pct: Number(winRate.toFixed(1)),
        total_pnl_from_trades: Number(totalPnl.toFixed(2)),
      },
      credits: credits ? {
        balance: Number(credits.balance),
        lifetime_spent: Number(credits.lifetime_spent),
      } : null,
      open_position_groups: Object.values(positionGroups).slice(0, 10),
      regimes: Object.fromEntries(
        Object.entries(regimes).slice(0, 10).map(([k, v]) => {
          const r = v as { trend_regime: string; volatility_regime: string; atr_pct: number | string | null };
          return [k, { trend: r.trend_regime, volatility: r.volatility_regime, atr_pct: r.atr_pct }];
        })
      ),
      recent_events: recentEvents.map((e) => {
        const ev = e as { event_type: string; symbol: string | null; rationale: string | null; created_at: string };
        return {
          type: ev.event_type,
          symbol: ev.symbol,
          rationale: ev.rationale,
          at: ev.created_at,
        };
      }),
    };

    // ─── Call Claude ────────────────────────────────
    const systemPrompt = `You are Apex AI's portfolio advisor. Analyze the snapshot and return ONLY a valid JSON object with this exact schema:
{
  "health": {
    "score": <0-100 integer>,
    "grade": "A" | "B" | "C" | "D",
    "summary": "<1-2 sentences describing current state>",
    "factors": [
      {"label": "<Short>", "value": "<value>", "tone": "success" | "info" | "warning" | "critical"}
    ]
  },
  "recommendations": [
    {
      "id": "<kebab-case-unique>",
      "severity": "info" | "success" | "warning" | "critical",
      "title": "<short actionable title>",
      "description": "<explain the why + what to do, 1-2 sentences>",
      "actionLabel": "<optional CTA text>"
    }
  ],
  "alerts": [
    {
      "id": "<kebab-case-unique>",
      "severity": "info" | "success" | "warning" | "critical",
      "title": "<alert title>",
      "description": "<detail>"
    }
  ]
}

Strategy context: Apex AI uses Martingale DCA grid (layers 1=base, 2=base, 3+=double progressively, max 3-7 layers depending on profile). Bot NEVER closes at loss — waits for blended average to hit TP target (0.8%-1.5%). Adapts to volatility regime. Focus recommendations on: win rate trends, drawdown risk, position sizing, credit balance, regime alignment, cycle completion times. Max 5 recommendations and 3 alerts. Be concise and actionable.

Return ONLY the JSON, no markdown, no explanation.`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Analyze this portfolio snapshot:\n\n${JSON.stringify(snapshot, null, 2)}`,
        }],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text().catch(() => '');
      console.error('[apex-ai-insights] Claude error', claudeRes.status, errText);
      return json({ success: true, data: null, note: `Claude ${claudeRes.status}` });
    }

    const claudeJson = await claudeRes.json();
    const text = claudeJson.content?.[0]?.text ?? '';

    // Parse the JSON from Claude's response (strip any markdown fences if present)
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    let insights;
    try {
      insights = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('[apex-ai-insights] parse fail', parseErr, 'raw:', cleaned.slice(0, 500));
      return json({ success: true, data: null, note: 'parse_error' });
    }

    // Add generatedAt timestamp
    insights.generatedAt = new Date().toISOString();

    return json({ success: true, data: insights });
  } catch (error) {
    console.error('[apex-ai-insights] exception', error);
    return json({ success: false, error: error instanceof Error ? error.message : 'Internal error' }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
