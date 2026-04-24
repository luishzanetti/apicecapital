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

// ═══════════════════════════════════════════════════════════════════
// V2.0 TYPES — multi-layer grid DCA + regime intelligence
// ═══════════════════════════════════════════════════════════════════

export type ApexAiTrendRegime = 'bull_trending' | 'bear_trending' | 'sideways' | 'high_volatility' | 'unknown';
export type ApexAiVolatilityRegime = 'low' | 'medium' | 'high';
export type ApexAiStrategyTag = 'grid_dca' | 'trend' | 'funding_arb' | 'mean_reversion';

export interface ApexAiLayerConfig {
  portfolio_id: string;
  max_layers: number;
  layer_spacing_atr: number;
  layer_size_multiplier: number;
  take_profit_pct: number;
  max_allocation_pct: number;
  updated_at: string;
}

export interface ApexAiRegimeState {
  symbol: string;
  trend_regime: ApexAiTrendRegime;
  volatility_regime: ApexAiVolatilityRegime;
  ema_50: number | null;
  ema_200: number | null;
  adx_14: number | null;
  atr_14: number | null;
  atr_pct: number | null;
  // V3 multi-signal additions
  rsi_14: number | null;
  sma_20: number | null;
  sma_50: number | null;
  sma_200: number | null;
  volume_ratio: number | null;
  regime_score: number | null;
  detected_at: string;
}

// V3 — Reserve fund types
export interface ApexAiReserveFund {
  portfolio_id: string;
  user_id: string;
  balance_usdt: number;
  lifetime_contributions: number;
  lifetime_deploys: number;
  contribution_pct: number;
  consecutive_positive_days: number;
  last_consistency_bonus_at: string | null;
  updated_at: string;
}

export type ApexAiReserveEventType =
  | 'contribution'
  | 'protection_deploy'
  | 'strategic_close'
  | 'emergency_layer'
  | 'consistency_bonus';

export interface ApexAiReserveEvent {
  id: string;
  portfolio_id: string;
  user_id: string;
  event_type: ApexAiReserveEventType;
  amount_usdt: number;
  related_trade_id: string | null;
  related_position_id: string | null;
  rationale: string | null;
  payload_json: Record<string, unknown> | null;
  created_at: string;
}

export interface ApexAiRegimeParams {
  regime: ApexAiTrendRegime;
  tp_min_pct: number;
  tp_max_pct: number;
  spacing_atr_multiplier: number;
  max_layers: number;
  cb_tolerance_pct: number;
  l1_action: 'open' | 'filter' | 'block' | 'selective';
  description: string | null;
}

export interface ApexAiSymbolIntelligence {
  symbol: string;
  current_price: number | null;
  funding_rate: number | null;
  next_funding_at: string | null;
  volume_24h_usd: number | null;
  open_interest_usd: number | null;
  correlations: Record<string, number> | null;
  updated_at: string;
}

export interface ApexAiAggregatedPosition {
  portfolio_id: string;
  user_id: string;
  symbol: string;
  side: ApexAiPositionSide;
  layer_count: number;
  first_layer: number;
  last_layer: number;
  total_size: number;
  avg_entry_price: number;
  total_unrealized_pnl: number;
  min_leverage: number;
  max_leverage: number;
  first_opened_at: string;
  last_opened_at: string;
  parent_position_group: string;
  strategy_tag: ApexAiStrategyTag;
  avg_take_profit: number | null;
  aggregate_stop_loss: number | null;
}

export interface ApexAiStrategyEvent {
  id: string;
  portfolio_id: string;
  event_type: string;
  symbol: string | null;
  from_value: string | null;
  to_value: string | null;
  rationale: string | null;
  payload_json: Record<string, unknown> | null;
  created_at: string;
}

// Extended position with layer metadata
export interface ApexAiPositionV2 extends ApexAiPosition {
  layer_index: number;
  parent_position_group: string | null;
  strategy_tag: ApexAiStrategyTag;
  intended_exit_price: number | null;
  atr_at_entry: number | null;
}
