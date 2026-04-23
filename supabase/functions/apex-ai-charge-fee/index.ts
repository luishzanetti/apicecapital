// Supabase Edge Function: apex-ai-charge-fee
//
// Wrapper fino sobre o RPC `apex_ai_charge_gas_fee` para cobrar 10% do profit
// de um trade fechado. Invocado pelo bot-tick ao fechar uma posição lucrativa.
//
// Lógica atômica (no RPC): debita credits, atualiza trade, registra ledger.
// Se saldo insuficiente: pausa portfolio.
//
// Referência: docs/projects/apex-ai/01-SPEC-CONSOLIDATED.md (FR-04.4, FR-04.5)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/bybit-api.ts';

const CORS_HEADERS = getCorsHeaders();

interface ChargeFeeRequest {
  trade_id: string;
  portfolio_id: string;
  user_id: string;
  pnl: number;
  fee_rate_pct?: number; // default 10
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const body = (await req.json()) as ChargeFeeRequest;

    if (!body.trade_id || !body.portfolio_id || !body.user_id || body.pnl === undefined) {
      return json({ success: false, error: 'missing required fields' }, 400);
    }

    const { data, error } = await supabase.rpc('apex_ai_charge_gas_fee', {
      p_trade_id: body.trade_id,
      p_portfolio_id: body.portfolio_id,
      p_user_id: body.user_id,
      p_pnl: body.pnl,
      p_fee_rate_pct: body.fee_rate_pct ?? 10.0,
    });

    if (error) {
      console.error('[apex-ai-charge-fee] rpc error', error);
      return json({ success: false, error: error.message }, 500);
    }

    return json({ success: true, data });
  } catch (error) {
    console.error('[apex-ai-charge-fee] exception', error);
    return json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error' },
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
