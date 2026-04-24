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

const STRATEGY_MATRIX: Record<ApexAiRiskProfile, StrategyTemplate> = {
  conservative: {
    symbols: [
      {
        symbol: 'BTCUSDT',
        allocation_pct: 50,
        leverage: 3,
        rationale: 'Blue chip — maximum liquidity, lower volatility than altcoins',
      },
      {
        symbol: 'ETHUSDT',
        allocation_pct: 35,
        leverage: 3,
        rationale: 'Second-largest cap, 0.85 correlation with BTC',
      },
      {
        symbol: 'BNBUSDT',
        allocation_pct: 15,
        leverage: 2,
        rationale: 'Consolidated exchange coin, lower beta',
      },
    ],
    max_leverage: 3,
    max_positions: 3,
    risk_per_trade_pct: 1.5,
  },
  balanced: {
    symbols: [
      {
        symbol: 'BTCUSDT',
        allocation_pct: 35,
        leverage: 5,
        rationale: 'Core position — anchors the portfolio',
      },
      {
        symbol: 'ETHUSDT',
        allocation_pct: 25,
        leverage: 5,
        rationale: 'Smart contract leader',
      },
      {
        symbol: 'SOLUSDT',
        allocation_pct: 20,
        leverage: 5,
        rationale: 'High volume, medium-high volatility',
      },
      {
        symbol: 'BNBUSDT',
        allocation_pct: 10,
        leverage: 4,
        rationale: 'Exchange-coin diversification',
      },
      {
        symbol: 'XRPUSDT',
        allocation_pct: 10,
        leverage: 4,
        rationale: 'Low correlation with top tier',
      },
    ],
    max_leverage: 5,
    max_positions: 5,
    risk_per_trade_pct: 2.0,
  },
  aggressive: {
    symbols: [
      {
        symbol: 'BTCUSDT',
        allocation_pct: 25,
        leverage: 8,
        rationale: 'Base position — aggressive leverage',
      },
      {
        symbol: 'ETHUSDT',
        allocation_pct: 20,
        leverage: 8,
        rationale: 'High beta with volume',
      },
      {
        symbol: 'SOLUSDT',
        allocation_pct: 15,
        leverage: 8,
        rationale: 'High volatility exploited',
      },
      {
        symbol: 'AVAXUSDT',
        allocation_pct: 10,
        leverage: 8,
        rationale: 'Alt L1 with momentum',
      },
      {
        symbol: 'LINKUSDT',
        allocation_pct: 10,
        leverage: 6,
        rationale: 'Oracle leader, low correlation',
      },
      {
        symbol: 'ARBUSDT',
        allocation_pct: 10,
        leverage: 6,
        rationale: 'Ethereum L2, expanding sector',
      },
      {
        symbol: 'DOGEUSDT',
        allocation_pct: 10,
        leverage: 6,
        rationale: 'Meme-coin with institutional liquidity',
      },
    ],
    max_leverage: 8,
    max_positions: 7,
    risk_per_trade_pct: 3.0,
  },
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
  profile: ApexAiRiskProfile,
  config: StrategyTemplate,
  locale: 'en' | 'pt'
): string {
  const symbolList = config.symbols.map((s) => s.symbol.replace('USDT', '')).join(', ');

  // Backtest scaled projection (validated config: BTC/USDT 3y, balanced = +543%)
  const projectedMultiplier = profile === 'balanced' ? 5.43 : profile === 'conservative' ? 3.0 : 7.5;
  const projected3y = capital * (1 + projectedMultiplier);

  if (locale === 'pt') {
    const profileLabel =
      profile === 'conservative' ? 'conservador'
      : profile === 'balanced' ? 'equilibrado (Moderado — config oficial validada)'
      : 'agressivo';

    const backtestNote = profile === 'balanced'
      ? ` Backtest oficial Apice (BTC/USDT, 3 anos): 100% win rate em 250 ciclos, +543% retorno, max drawdown 40.7%, Sharpe 1.19. Projeção 3 anos com $${capital.toLocaleString()}: ~$${projected3y.toLocaleString()} (referência histórica).`
      : '';

    return (
      `Com capital de ${capital.toLocaleString()} USDT no perfil ${profileLabel}, ` +
      `aplicamos diversificação em ${config.symbols.length} pares (${symbolList}), ` +
      `alavancagem ${config.max_leverage}x, Martingale DCA com filtro SMA-20, espaçamento ATR dinâmico. ` +
      `Bot nunca fecha em prejuízo. 10% de cada lucro alimenta o Smart Reserve Protocol (proteção contra liquidação). ` +
      `Fee 10% só sobre profit.${backtestNote}`
    );
  }

  const profileLabel =
    profile === 'conservative' ? 'conservative'
    : profile === 'balanced' ? 'balanced (Moderado — official validated config)'
    : 'aggressive';

  const backtestNote = profile === 'balanced'
    ? ` Apice official backtest (BTC/USDT, 3 years): 100% win rate over 250 cycles, +543% return, max drawdown 40.7%, Sharpe 1.19. 3-year projection on $${capital.toLocaleString()}: ~$${projected3y.toLocaleString()} (historical reference).`
    : '';

  return (
    `With ${capital.toLocaleString()} USDT on ${profileLabel}, ` +
    `we diversify across ${config.symbols.length} pairs (${symbolList}), ` +
    `${config.max_leverage}x leverage, Martingale DCA with SMA-20 filter, dynamic ATR spacing. ` +
    `Bot never closes at loss. 10% of each profit feeds the Smart Reserve Protocol (liquidation protection). ` +
    `10% fee only on profit.${backtestNote}`
  );
}
