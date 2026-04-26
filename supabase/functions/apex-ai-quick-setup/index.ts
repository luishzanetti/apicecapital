// Supabase Edge Function: apex-ai-quick-setup
//
// Gera uma proposta de configuração inicial para um Apex AI bot, baseada em:
//   - capital_usdt (alocado pelo usuário)
//   - risk_profile (conservative | balanced | aggressive)
//
// Output: proposta com lista de símbolos, alavancagem, alocação %, rationale.
// Esta é a camada "IA" do Quick Setup (logic determinística no MVP, ML em v2).
//
// NÃO cria o portfolio — apenas retorna a proposta. O frontend mostra ao
// usuário para confirmação; após confirmar, chama outro endpoint que persiste.
//
// Referência: docs/projects/apex-ai/01-SPEC-CONSOLIDATED.md (FR-03)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/bybit-api.ts';

const CORS_HEADERS = getCorsHeaders();

interface QuickSetupRequest {
  capital_usdt: number;
  risk_profile: 'conservative' | 'balanced' | 'aggressive';
}

interface SymbolProposal {
  symbol: string;
  allocation_pct: number;
  leverage: number;
  rationale: string;
}

interface QuickSetupProposal {
  capital_usdt: number;
  risk_profile: 'conservative' | 'balanced' | 'aggressive';
  max_leverage: number;
  max_positions: number;
  risk_per_trade_pct: number;
  symbols: SymbolProposal[];
  ai_rationale: string;
}

// ─── Validated Config (CEO directive 2026-04-25) ─────────────────
// Per backtest oficial Apice (BTC/USDT, 3 anos): 100% win rate em 250 ciclos,
// +543% retorno, max drawdown 40.7%, Sharpe 1.19. Esta é a única configuração
// suportada. Risk profiles 'conservative' e 'aggressive' permanecem no schema
// apenas por compatibilidade — todos retornam a mesma config validada.

const VALIDATED_CONFIG = {
  symbols: [
    {
      symbol: 'BTCUSDT',
      allocation_pct: 100,
      leverage: 3,
      rationale: 'BTC/USDT — único par validado pelo backtest oficial (3 anos)',
    },
  ],
  max_leverage: 3,
  max_positions: 5,
  risk_per_trade_pct: 2.0,
};

const STRATEGY_MATRIX = {
  conservative: VALIDATED_CONFIG,
  balanced: VALIDATED_CONFIG,
  aggressive: VALIDATED_CONFIG,
};

// ─── Handler ────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ success: false, error: 'Missing Authorization header' }, 401);
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

    // Parse
    const body = (await req.json()) as QuickSetupRequest;

    if (!body.capital_usdt || body.capital_usdt < 100) {
      return json({ success: false, error: 'capital_usdt must be >= 100' }, 400);
    }
    if (!['conservative', 'balanced', 'aggressive'].includes(body.risk_profile)) {
      return json({ success: false, error: 'invalid risk_profile' }, 400);
    }

    // Generate proposal
    const config = STRATEGY_MATRIX[body.risk_profile];
    const proposal: QuickSetupProposal = {
      capital_usdt: body.capital_usdt,
      risk_profile: body.risk_profile,
      max_leverage: config.max_leverage,
      max_positions: config.max_positions,
      risk_per_trade_pct: config.risk_per_trade_pct,
      symbols: config.symbols,
      ai_rationale: buildRationale(body.capital_usdt, body.risk_profile, config),
    };

    return json({ success: true, data: proposal }, 200);
  } catch (error) {
    console.error('[apex-ai-quick-setup] error', error);
    return json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error' },
      500
    );
  }
});

function buildRationale(
  capital: number,
  _profile: string,
  config: { symbols: SymbolProposal[]; max_leverage: number; risk_per_trade_pct: number; max_positions?: number }
): string {
  // Validated config: BTC/USDT 3y backtest = +543% (multiplier 5.43)
  const projected3y = capital * (1 + 5.43);
  const layers = config.max_positions ?? 5;

  return (
    `Apex AI vai operar BTC/USDT com ${capital.toLocaleString()} USDT na configuração ` +
    `validada do backtest oficial Apice (3 anos, 100% win rate em 250 ciclos, +543% retorno, ` +
    `max drawdown 40.7%, Sharpe 1.19). Estratégia: alavancagem ${config.max_leverage}x, ` +
    `Martingale DCA com até ${layers} camadas, filtro SMA-20 bloqueia entradas em downtrends fortes, ` +
    `espaçamento ATR dinâmico. Bot nunca fecha em prejuízo. 10% de cada lucro alimenta o Smart Reserve ` +
    `Protocol (proteção automática contra liquidação). Fee 10% só sobre profit. ` +
    `Projeção 3 anos: ~$${projected3y.toLocaleString(undefined, { maximumFractionDigits: 0 })} ` +
    `(referência histórica, mercado real pode divergir).`
  );
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
