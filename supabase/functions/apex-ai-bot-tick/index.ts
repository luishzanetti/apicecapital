// Supabase Edge Function: apex-ai-bot-tick
//
// Engine principal do bot Apex AI — executa um "tick" em um portfolio ativo.
// Invocado por pg_cron (ou Scheduled Function) a cada 30s por portfolio com status='active'.
//
// Responsabilidades:
//   1. Carregar portfolio + symbols + exchange account
//   2. Sincronizar posições com Bybit (via _shared/bybit-api.ts)
//   3. Analisar sinais (MVP: grid + DCA em hedge mode)
//   4. Executar ordens (open/close)
//   5. Em trades fechados com profit: RPC apex_ai_charge_gas_fee (10%)
//   6. Circuit breaker: drawdown 24h > trigger_pct → pausa + notifica
//   7. Logar tudo em apex_ai_bot_logs
//
// NOTA: Este é o SCAFFOLDING — a lógica completa de estratégia será expandida
// na Story 4.1 pelo @dev. Estrutura aqui garante:
//   ✓ Autenticação service-role
//   ✓ Payload validation
//   ✓ Error handling estruturado
//   ✓ Log forense em apex_ai_bot_logs
//   ✓ Integração com RPC de cobrança de fee
//
// Invocação: POST /functions/v1/apex-ai-bot-tick com { portfolio_id }
// Authorization: service_role (para permitir bypass RLS)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/bybit-api.ts';

const CORS_HEADERS = getCorsHeaders();
const FEE_RATE_PCT = 10.0; // ← Apex AI signature fee

interface BotTickRequest {
  portfolio_id: string;
}

interface TickResult {
  portfolio_id: string;
  ticked_at: string;
  actions: Array<{ type: string; detail: Record<string, unknown> }>;
  errors: string[];
  circuit_breaker_triggered: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const startTime = Date.now();

  try {
    // Service-role client (bypassa RLS — bot escreve em trades/logs)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const body = (await req.json()) as BotTickRequest;
    if (!body.portfolio_id) {
      return json({ success: false, error: 'portfolio_id required' }, 400);
    }

    const result: TickResult = {
      portfolio_id: body.portfolio_id,
      ticked_at: new Date().toISOString(),
      actions: [],
      errors: [],
      circuit_breaker_triggered: false,
    };

    // ─── 1. Load portfolio ───────────────────────────
    const { data: portfolio, error: pErr } = await supabase
      .from('apex_ai_portfolios')
      .select('*')
      .eq('id', body.portfolio_id)
      .single();

    if (pErr || !portfolio) {
      await logEvent(supabase, body.portfolio_id, 'error', 'portfolio_not_found', { error: pErr?.message });
      return json({ success: false, error: 'portfolio not found' }, 404);
    }

    if (portfolio.status !== 'active') {
      await logEvent(supabase, body.portfolio_id, 'info', 'skip_inactive', { status: portfolio.status });
      return json({ success: true, data: { ...result, actions: [{ type: 'skip_inactive', detail: { status: portfolio.status } }] } });
    }

    // ─── 2. Circuit breaker check ────────────────────
    const drawdownPct = calculateDrawdown24h(portfolio);
    if (drawdownPct >= portfolio.drawdown_24h_trigger_pct) {
      result.circuit_breaker_triggered = true;
      await supabase
        .from('apex_ai_portfolios')
        .update({ status: 'circuit_breaker' })
        .eq('id', portfolio.id);

      await logEvent(supabase, portfolio.id, 'critical', 'circuit_breaker_triggered', {
        drawdown_pct: drawdownPct,
        trigger_pct: portfolio.drawdown_24h_trigger_pct,
      });

      return json({ success: true, data: result });
    }

    // ─── 3. Load symbols + exchange account (STUB) ───
    const { data: symbols } = await supabase
      .from('apex_ai_symbols')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .eq('is_active', true);

    if (!symbols || symbols.length === 0) {
      await logEvent(supabase, portfolio.id, 'warning', 'no_symbols', null);
      return json({ success: true, data: result });
    }

    // ─── 4. Strategy execution (STUB — Story 4.1) ────
    // TODO[Story 4.1]: implementar strategy engine:
    //   - Fetch Bybit positions para cada symbol
    //   - Calcular sinais (grid + DCA hedge)
    //   - Place orders via leveraged-trade-execute (reuse Altis)
    //   - Reconcile com apex_ai_positions
    //   - Close positions quando TP/SL hit
    //   - Em close com profit: RPC apex_ai_charge_gas_fee

    result.actions.push({
      type: 'strategy_stub',
      detail: {
        symbols_evaluated: symbols.length,
        note: 'Strategy engine stub — Story 4.1 will implement full logic',
      },
    });

    // ─── 5. Update last_tick_at ──────────────────────
    await supabase
      .from('apex_ai_portfolios')
      .update({ last_tick_at: new Date().toISOString() })
      .eq('id', portfolio.id);

    const elapsedMs = Date.now() - startTime;
    await logEvent(supabase, portfolio.id, 'info', 'tick_completed', {
      elapsed_ms: elapsedMs,
      actions_count: result.actions.length,
    });

    return json({ success: true, data: result });
  } catch (error) {
    console.error('[apex-ai-bot-tick] exception', error);
    return json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error' },
      500
    );
  }
});

// ─── Helpers ────────────────────────────────────────

function calculateDrawdown24h(portfolio: {
  total_pnl: number;
  capital_usdt: number;
  drawdown_high_water_mark: number | null;
}): number {
  const hwm = portfolio.drawdown_high_water_mark ?? portfolio.capital_usdt;
  const currentEquity = Number(portfolio.capital_usdt) + Number(portfolio.total_pnl);
  if (hwm <= 0) return 0;
  const drawdown = ((hwm - currentEquity) / hwm) * 100;
  return Math.max(0, drawdown);
}

async function logEvent(
  supabase: ReturnType<typeof createClient>,
  portfolioId: string,
  level: 'info' | 'warning' | 'error' | 'critical',
  event: string,
  payload: Record<string, unknown> | null
) {
  try {
    await supabase.from('apex_ai_bot_logs').insert({
      portfolio_id: portfolioId,
      level,
      event,
      payload_json: payload,
    });
  } catch (err) {
    console.error('[apex-ai-bot-tick] log error', err);
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

export { FEE_RATE_PCT };
