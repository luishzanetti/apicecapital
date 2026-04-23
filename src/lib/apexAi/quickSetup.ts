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
  const symbolList = config.symbols
    .map((s) => s.symbol.replace('USDT', ''))
    .join(', ');

  if (locale === 'pt') {
    const profileLabel =
      profile === 'conservative'
        ? 'conservador'
        : profile === 'balanced'
        ? 'equilibrado'
        : 'agressivo';
    return (
      `Com capital de ${capital.toLocaleString()} USDT no perfil ${profileLabel}, ` +
      `a IA recomenda diversificação em ${config.symbols.length} pares (${symbolList}) ` +
      `operando com alavancagem máxima ${config.max_leverage}x e risco de ${config.risk_per_trade_pct}% por trade. ` +
      `Estratégia: grid + DCA em hedge mode (long + short simultâneo), cross margin. ` +
      `Fee de 10% aplica apenas sobre lucro líquido — sem lucro, sem cobrança.`
    );
  }

  const profileLabel =
    profile === 'conservative'
      ? 'conservative'
      : profile === 'balanced'
      ? 'balanced'
      : 'aggressive';
  return (
    `With ${capital.toLocaleString()} USDT on a ${profileLabel} profile, ` +
    `the AI recommends diversifying across ${config.symbols.length} pairs (${symbolList}) ` +
    `with up to ${config.max_leverage}x leverage and ${config.risk_per_trade_pct}% risk per trade. ` +
    `Strategy: grid + DCA in hedge mode (long + short simultaneously), cross margin. ` +
    `10% fee applies only to net profit — no profit, no charge.`
  );
}
