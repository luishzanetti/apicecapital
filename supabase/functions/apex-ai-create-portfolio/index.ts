// Supabase Edge Function: apex-ai-create-portfolio
//
// Persiste um novo portfolio Apex AI após o usuário confirmar a proposta do Quick Setup.
// Cria o portfolio (status 'paused' inicialmente) e os símbolos.
// Usuário inicia manualmente via botão "Ativar Bot" no dashboard.
//
// Referência: docs/projects/apex-ai/01-SPEC-CONSOLIDATED.md (FR-03.3, FR-06)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/bybit-api.ts';

const CORS_HEADERS = getCorsHeaders();

interface CreatePortfolioRequest {
  name: string;
  capital_usdt: number;
  risk_profile: 'conservative' | 'balanced' | 'aggressive';
  max_leverage: number;
  max_positions: number;
  risk_per_trade_pct: number;
  symbols: Array<{
    symbol: string;
    allocation_pct: number;
    leverage: number;
  }>;
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

    const body = (await req.json()) as CreatePortfolioRequest;

    // Validations
    if (!body.name?.trim()) return json({ success: false, error: 'name required' }, 400);
    if (!body.capital_usdt || body.capital_usdt < 100) {
      return json({ success: false, error: 'capital_usdt >= 100' }, 400);
    }
    if (!Array.isArray(body.symbols) || body.symbols.length === 0) {
      return json({ success: false, error: 'symbols required' }, 400);
    }

    const totalPct = body.symbols.reduce((s, x) => s + x.allocation_pct, 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      return json({ success: false, error: `symbol allocations must sum to 100% (got ${totalPct})` }, 400);
    }

    // Insert portfolio
    const { data: portfolio, error: pErr } = await supabase
      .from('apex_ai_portfolios')
      .insert({
        user_id: user.id,
        name: body.name.trim(),
        exchange: 'bybit', // MVP only
        capital_usdt: body.capital_usdt,
        risk_profile: body.risk_profile,
        status: 'paused', // starts paused; user activates manually
        max_leverage: body.max_leverage,
        max_positions: body.max_positions,
        risk_per_trade_pct: body.risk_per_trade_pct,
        drawdown_high_water_mark: body.capital_usdt,
      })
      .select()
      .single();

    if (pErr || !portfolio) {
      console.error('[apex-ai-create-portfolio] portfolio insert error', pErr);
      return json({ success: false, error: pErr?.message ?? 'portfolio insert failed' }, 500);
    }

    // Insert symbols
    const symbolRows = body.symbols.map((s) => ({
      portfolio_id: portfolio.id,
      symbol: s.symbol,
      allocation_pct: s.allocation_pct,
      leverage: s.leverage,
      is_active: true,
    }));

    const { error: sErr } = await supabase.from('apex_ai_symbols').insert(symbolRows);
    if (sErr) {
      console.error('[apex-ai-create-portfolio] symbols insert error', sErr);
      // rollback portfolio
      await supabase.from('apex_ai_portfolios').delete().eq('id', portfolio.id);
      return json({ success: false, error: sErr.message }, 500);
    }

    // Ensure user_credits row exists
    await supabase
      .from('apex_ai_user_credits')
      .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true });

    return json({ success: true, data: { portfolio_id: portfolio.id } }, 201);
  } catch (error) {
    console.error('[apex-ai-create-portfolio] exception', error);
    return json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error' },
      500
    );
  }
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
