// Supabase Edge Function: apex-ai-insights
//
// Generates portfolio health + recommendations + alerts using Claude (or
// another LLM) given a snapshot of the portfolio's current state.
//
// Current status: STUB — returns a placeholder response. When integrating
// with Anthropic API, replace the TODO section below with a real call.
// The client (useApexAiInsights) falls back gracefully to a deterministic
// local engine when this function returns null/error.
//
// Reference: docs/projects/apex-ai/01-SPEC-CONSOLIDATED.md (future spec)
//
// To enable real LLM:
//   1. Set ANTHROPIC_API_KEY in Supabase secrets
//   2. Uncomment the LLM block below and remove the stub response
//   3. Deploy: npx supabase functions deploy apex-ai-insights

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/bybit-api.ts';

const CORS_HEADERS = getCorsHeaders();

interface InsightsRequest {
  portfolio_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ success: false, error: 'Missing Authorization' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return json({ success: false, error: 'Unauthorized' }, 401);
    }

    const body = (await req.json()) as InsightsRequest;
    if (!body.portfolio_id) {
      return json({ success: false, error: 'portfolio_id required' }, 400);
    }

    // Verify portfolio belongs to user (RLS will also enforce this)
    const { data: portfolio, error: pErr } = await supabase
      .from('apex_ai_portfolios')
      .select('*')
      .eq('id', body.portfolio_id)
      .single();
    if (pErr || !portfolio) {
      return json({ success: false, error: 'portfolio not found' }, 404);
    }

    // ─── Stub response ────────────────────────────────────────
    //
    // Returning `null` data tells the client to fall back to the local
    // deterministic insights engine. This is intentional until the LLM
    // integration below is wired up and the ANTHROPIC_API_KEY secret is set.

    return json({
      success: true,
      data: null,
      note:
        'LLM insights not yet configured on server; client will use local engine.',
    });

    // ─── TODO: Enable real LLM analysis ───────────────────────
    //
    // const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    // if (!anthropicKey) {
    //   return json({ success: true, data: null }); // fallback
    // }
    //
    // // Build snapshot
    // const [positions, trades, credits] = await Promise.all([
    //   supabase.from('apex_ai_positions').select('*').eq('portfolio_id', portfolio.id).eq('status', 'open'),
    //   supabase.from('apex_ai_trades').select('*').eq('portfolio_id', portfolio.id).order('closed_at', { ascending: false }).limit(100),
    //   supabase.from('apex_ai_user_credits').select('*').eq('user_id', user.id).single(),
    // ]);
    //
    // const snapshot = {
    //   portfolio,
    //   open_positions: positions.data ?? [],
    //   recent_trades: trades.data ?? [],
    //   credits: credits.data,
    // };
    //
    // // Call Claude
    // const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
    //   method: 'POST',
    //   headers: {
    //     'x-api-key': anthropicKey,
    //     'anthropic-version': '2023-06-01',
    //     'content-type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     model: 'claude-haiku-4-5-20251001', // fast + cheap for periodic insights
    //     max_tokens: 2000,
    //     system: buildSystemPrompt(),
    //     messages: [{ role: 'user', content: JSON.stringify(snapshot) }],
    //   }),
    // });
    //
    // const claudeData = await claudeResponse.json();
    // const parsed = parseClaudeResponse(claudeData); // expects JSON-formatted insights
    // return json({ success: true, data: parsed });
  } catch (error) {
    console.error('[apex-ai-insights] exception', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal error',
      },
      500
    );
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
