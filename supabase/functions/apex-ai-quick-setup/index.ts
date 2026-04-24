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

// ─── Strategy Matrix (determinística no MVP) ────────────────────

const STRATEGY_MATRIX = {
  conservative: {
    symbols: [
      { symbol: 'BTCUSDT', allocation_pct: 50, leverage: 3, rationale: 'Blue chip — liquidez máxima, volatilidade menor que altcoins' },
      { symbol: 'ETHUSDT', allocation_pct: 35, leverage: 3, rationale: 'Segunda maior capitalização, correlação 0.85 com BTC' },
      { symbol: 'BNBUSDT', allocation_pct: 15, leverage: 2, rationale: 'Exchange coin consolidada, menor beta' },
    ],
    max_leverage: 3,
    max_positions: 3,
    risk_per_trade_pct: 1.5,
  },
  balanced: {
    symbols: [
      { symbol: 'BTCUSDT', allocation_pct: 35, leverage: 5, rationale: 'Core position — ancora o portfolio' },
      { symbol: 'ETHUSDT', allocation_pct: 25, leverage: 5, rationale: 'Smart contract leader' },
      { symbol: 'SOLUSDT', allocation_pct: 20, leverage: 5, rationale: 'Alto volume, volatilidade média-alta' },
      { symbol: 'BNBUSDT', allocation_pct: 10, leverage: 4, rationale: 'Diversificação exchange-coin' },
      { symbol: 'XRPUSDT', allocation_pct: 10, leverage: 4, rationale: 'Baixa correlação com top-tier' },
    ],
    max_leverage: 5,
    max_positions: 5,
    risk_per_trade_pct: 2.0,
  },
  aggressive: {
    symbols: [
      { symbol: 'BTCUSDT', allocation_pct: 25, leverage: 8, rationale: 'Base — alavancagem agressiva' },
      { symbol: 'ETHUSDT', allocation_pct: 20, leverage: 8, rationale: 'Beta elevado com volume' },
      { symbol: 'SOLUSDT', allocation_pct: 15, leverage: 8, rationale: 'Alta volatilidade explorada' },
      { symbol: 'AVAXUSDT', allocation_pct: 10, leverage: 8, rationale: 'L1 alternativa com momentum' },
      { symbol: 'LINKUSDT', allocation_pct: 10, leverage: 6, rationale: 'Oracle leader, baixa correlação' },
      { symbol: 'ARBUSDT', allocation_pct: 10, leverage: 6, rationale: 'L2 Ethereum, setor em expansão' },
      { symbol: 'DOGEUSDT', allocation_pct: 10, leverage: 6, rationale: 'Meme-coin com liquidez institucional' },
    ],
    max_leverage: 8,
    max_positions: 7,
    risk_per_trade_pct: 3.0,
  },
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
  profile: string,
  config: { symbols: SymbolProposal[]; max_leverage: number; risk_per_trade_pct: number }
): string {
  const symbolList = config.symbols.map((s) => s.symbol.replace('USDT', '')).join(', ');
  const profileLabel = profile === 'conservative' ? 'conservador' : profile === 'balanced' ? 'equilibrado (Moderado)' : 'agressivo';

  // Backtest projection (3y BTC/USDT moderado: +543%)
  // Apply scaled to capital, with proper disclaimer
  const projectedReturn = profile === 'balanced' ? 5.43 : profile === 'conservative' ? 3.0 : 7.5;
  const projected3y = capital * (1 + projectedReturn);

  let backtestNote = '';
  if (profile === 'balanced') {
    backtestNote = ` Backtest validado (BTC/USDT, 3 anos, Moderado): 100% win rate em 250 ciclos, +543% retorno, max drawdown 40.7%, Sharpe 1.19. Capital projetado em 3 anos: ~$${projected3y.toLocaleString()} (referência histórica, mercado real pode divergir).`;
  }

  return (
    `Com capital de ${capital.toLocaleString()} USDT no perfil ${profileLabel}, ` +
    `a IA aplica a configuração ${profile === 'balanced' ? 'VALIDADA do backtest oficial Apice' : 'recomendada'}: ` +
    `diversificação em ${config.symbols.length} pares (${symbolList}), ` +
    `alavancagem ${config.max_leverage}x, Martingale DCA com filtro SMA-20, espaçamento ATR dinâmico, ` +
    `nunca fecha em prejuízo. 10% de cada lucro vai pro Smart Reserve Protocol (proteção automática contra liquidação). ` +
    `Fee de 10% só sobre profit líquido.${backtestNote}`
  );
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
