/**
 * Apex AI — Quick Setup (client-side fallback)
 *
 * This module mirrors the deterministic strategy matrix used by the
 * `apex-ai-quick-setup` Edge Function. It lets the Quick Setup flow work
 * even when the Edge Function is not yet deployed — no server round-trip
 * needed, since the logic has no secrets and no external state.
 *
 * The Edge Function version remains the canonical path for production
 * (allows future ML-based calibration without client update). This fallback
 * is for MVP dev/demo and graceful degradation.
 */

import type {
  ApexAiQuickSetupProposal,
  ApexAiRiskProfile,
} from '@/types/apexAi';

interface StrategySymbol {
  symbol: string;
  allocation_pct: number;
  leverage: number;
  rationale: string;
}

interface StrategyTemplate {
  symbols: StrategySymbol[];
  max_leverage: number;
  max_positions: number;
  risk_per_trade_pct: number;
}

// VALIDATED CONFIG (CEO-approved, backtest v2 BTC/USDT 3y):
//   - 100% win rate em 250 ciclos
//   - +543% retorno cumulativo
//   - Max drawdown 40.7% · Sharpe 1.19 · Calmar 13.36
//   - 0 circuit breaker triggers em 3 anos
//
// Per directive 2026-04-25: a única configuração é BTC-only, 3x leverage,
// 5 layers Martingale DCA, 2% risk per trade, SMA-20 filter habilitado,
// Smart Reserve Protocol 10%. Não há outras opções.
//
// Os perfis 'conservative' e 'aggressive' permanecem no tipo apenas por
// compatibilidade de schema mas mapeiam para a mesma config validada.
const VALIDATED_CONFIG: StrategyTemplate = {
  symbols: [
    {
      symbol: 'BTCUSDT',
      allocation_pct: 100,
      leverage: 3,
      rationale:
        'BTC/USDT — único par validado pelo backtest oficial (3 anos, 100% win rate em 250 ciclos)',
    },
  ],
  max_leverage: 3,
  max_positions: 5, // 5 Martingale layers max
  risk_per_trade_pct: 2.0,
};

const STRATEGY_MATRIX: Record<ApexAiRiskProfile, StrategyTemplate> = {
  conservative: VALIDATED_CONFIG,
  balanced: VALIDATED_CONFIG,
  aggressive: VALIDATED_CONFIG,
};

export interface GenerateProposalInput {
  capital_usdt: number;
  risk_profile: ApexAiRiskProfile;
  locale?: 'en' | 'pt';
}

export function generateQuickSetupProposal(
  input: GenerateProposalInput
): ApexAiQuickSetupProposal {
  if (!input.capital_usdt || input.capital_usdt < 100) {
    throw new Error('capital_usdt must be >= 100');
  }

  const config = STRATEGY_MATRIX[input.risk_profile];

  return {
    capital_usdt: input.capital_usdt,
    risk_profile: input.risk_profile,
    max_leverage: config.max_leverage,
    max_positions: config.max_positions,
    risk_per_trade_pct: config.risk_per_trade_pct,
    symbols: config.symbols,
    ai_rationale: buildRationale(
      input.capital_usdt,
      input.risk_profile,
      config,
      input.locale ?? 'en'
    ),
  };
}

function buildRationale(
  capital: number,
  _profile: ApexAiRiskProfile,
  config: StrategyTemplate,
  locale: 'en' | 'pt'
): string {
  // Validated config: BTC/USDT 3y backtest = +543% (multiplier 5.43)
  const projected3y = capital * (1 + 5.43);

  if (locale === 'pt') {
    return (
      `Apex AI vai operar BTC/USDT com ${capital.toLocaleString()} USDT na configuração ` +
      `validada do backtest oficial Apice (3 anos, 100% win rate em 250 ciclos, +543% retorno, ` +
      `max drawdown 40.7%, Sharpe 1.19). Estratégia: alavancagem ${config.max_leverage}x, ` +
      `Martingale DCA com até ${config.max_positions} camadas, filtro SMA-20 bloqueia entradas ` +
      `em downtrends fortes, espaçamento ATR dinâmico. Bot nunca fecha em prejuízo. 10% de cada ` +
      `lucro alimenta o Smart Reserve Protocol (proteção automática contra liquidação). ` +
      `Fee 10% só sobre profit. Projeção 3 anos: ~$${projected3y.toLocaleString(undefined, { maximumFractionDigits: 0 })} ` +
      `(referência histórica, mercado real pode divergir).`
    );
  }

  return (
    `Apex AI will trade BTC/USDT with ${capital.toLocaleString()} USDT using the Apice ` +
    `validated config (3-year backtest, 100% win rate over 250 cycles, +543% return, ` +
    `max drawdown 40.7%, Sharpe 1.19). Strategy: ${config.max_leverage}x leverage, ` +
    `Martingale DCA up to ${config.max_positions} layers, SMA-20 filter blocks entries during ` +
    `strong downtrends, dynamic ATR spacing. Bot never closes at loss. 10% of every profit feeds ` +
    `the Smart Reserve Protocol (automatic liquidation protection). 10% fee on profit only. ` +
    `3-year projection: ~$${projected3y.toLocaleString(undefined, { maximumFractionDigits: 0 })} ` +
    `(historical reference, live market may diverge).`
  );
}
