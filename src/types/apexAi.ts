/**
 * Apex AI — TypeScript types
 *
 * Mirror do schema Supabase (migration 011_apex_ai.sql).
 * Centralizado aqui para evitar divergência.
 */

// ─── Enums ──────────────────────────────────────────────

export type ApexAiRiskProfile = 'conservative' | 'balanced' | 'aggressive';

export type ApexAiPortfolioStatus =
  | 'active'
  | 'paused'
  | 'stopped'
  | 'error'
  | 'circuit_breaker';

export type ApexAiPositionSide = 'long' | 'short';

export type ApexAiPositionStatus = 'open' | 'closed' | 'liquidated';

export type ApexAiLogLevel = 'info' | 'warning' | 'error' | 'critical';

export type ApexAiExchange = 'bybit' | 'okx' | 'bitget' | 'binance';

// ─── Tables ─────────────────────────────────────────────

export interface ApexAiPortfolio {
  id: string;
  user_id: string;
  name: string;
  exchange: ApexAiExchange;
  capital_usdt: number;
  risk_profile: ApexAiRiskProfile;
  status: ApexAiPortfolioStatus;
  max_leverage: number;
  max_positions: number;
  risk_per_trade_pct: number;
  drawdown_high_water_mark: number | null;
  drawdown_24h_trigger_pct: number;
  total_pnl: number;
  win_count: number;
  loss_count: number;
  created_at: string;
  updated_at: string;
  last_tick_at: string | null;
}

export interface ApexAiSymbol {
  id: string;
  portfolio_id: string;
  symbol: string;
  allocation_pct: number;
  leverage: number;
  is_active: boolean;
  created_at: string;
}

export interface ApexAiPosition {
  id: string;
  portfolio_id: string;
  user_id: string;
  symbol: string;
  side: ApexAiPositionSide;
  entry_price: number;
  current_price: number | null;
  size: number;
  leverage: number;
  unrealized_pnl: number;
  realized_pnl: number;
  stop_loss_price: number | null;
  take_profit_price: number | null;
  status: ApexAiPositionStatus;
  exchange_position_id: string | null;
  opened_at: string;
  closed_at: string | null;
  updated_at: string;
}

export interface ApexAiTrade {
  id: string;
  portfolio_id: string;
  position_id: string | null;
  user_id: string;
  symbol: string;
  side: ApexAiPositionSide;
  entry_price: number;
  exit_price: number;
  size: number;
  leverage: number;
  pnl: number;
  fee_exchange: number;
  gas_fee: number;
  net_pnl: number;
  closed_at: string;
}

export interface ApexAiUserCredits {
  user_id: string;
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  low_balance_threshold: number;
  updated_at: string;
}

export interface ApexAiGasFeeLedgerEntry {
  id: string;
  trade_id: string;
  portfolio_id: string;
  user_id: string;
  gas_fee_usdt: number;
  credits_charged: number;
  fee_rate_pct: number;
  created_at: string;
}

export interface ApexAiBotLog {
  id: string;
  portfolio_id: string;
  level: ApexAiLogLevel;
  event: string;
  payload_json: Record<string, unknown> | null;
  created_at: string;
}

// ─── Derived / UI types ─────────────────────────────────

export interface ApexAiPortfolioStats {
  total_pnl: number;
  total_pnl_24h: number;
  win_rate: number;
  win_count: number;
  loss_count: number;
  total_trades: number;
  open_positions: number;
  avg_profit_per_trade: number;
}

export interface ApexAiDashboardData {
  portfolio: ApexAiPortfolio;
  stats: ApexAiPortfolioStats;
  credits: ApexAiUserCredits;
  open_positions: ApexAiPosition[];
  recent_trades: ApexAiTrade[];
  daily_pnl_series: Array<{ date: string; pnl: number }>;
}

export interface ApexAiQuickSetupProposal {
  capital_usdt: number;
  risk_profile: ApexAiRiskProfile;
  max_leverage: number;
  max_positions: number;
  risk_per_trade_pct: number;
  symbols: Array<{
    symbol: string;
    allocation_pct: number;
    leverage: number;
    rationale: string;
  }>;
  ai_rationale: string;
}

// ─── Constants ──────────────────────────────────────────

export const APEX_AI_FEE_RATE_PCT = 10.0; // CEO directive (vs CoinTech2u 20%)
export const APEX_AI_CREDITS_PER_USDT = 100;
export const APEX_AI_DEFAULT_TICK_INTERVAL_SEC = 30;
export const APEX_AI_DEFAULT_DRAWDOWN_TRIGGER_PCT = 20;

export const APEX_AI_SUPPORTED_EXCHANGES: ApexAiExchange[] = ['bybit']; // MVP

export const APEX_AI_RECOMMENDED_SYMBOLS = {
  conservative: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'],
  balanced: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'],
  aggressive: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'AVAXUSDT', 'LINKUSDT', 'ARBUSDT', 'DOGEUSDT'],
} as const;
