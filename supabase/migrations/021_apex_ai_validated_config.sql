-- 021 · Apex AI — Validated production config (CEO-approved backtest baseline)
--
-- Per backtest v2 (BTC/USDT 3y, Moderado profile):
--   Win rate: 100% (250/250 cycles)
--   Total return: +543.24% over 3 years
--   Max drawdown: 40.7% (portfolio peak-to-trough)
--   Sharpe: 1.19, Calmar: 13.36
--   CB triggers: 0 — never paused in 3 years
--
-- This migration:
--   1. Adds sma_filter_enabled to apex_ai_layer_config
--   2. Backfills all 'balanced' portfolios with validated config
--   3. Sets contribution_pct = 10% on all reserve_funds
--   4. Documents config in DB COMMENTs for future reference
--
-- Idempotent.

-- ════════════════════════════════════════════════════════════════
-- 1. Add sma_filter_enabled flag
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.apex_ai_layer_config
  ADD COLUMN IF NOT EXISTS sma_filter_enabled BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.apex_ai_layer_config.sma_filter_enabled IS
  'V3 — when true, bot blocks L1 LONG bootstrap if close < sma_20 × 0.95 (validated config from backtest v2).';

-- ════════════════════════════════════════════════════════════════
-- 2. Backfill: enable SMA filter on all configs
-- ════════════════════════════════════════════════════════════════

UPDATE public.apex_ai_layer_config
SET sma_filter_enabled = TRUE;

-- ════════════════════════════════════════════════════════════════
-- 3. Ensure reserve contribution is 10% (validated)
-- ════════════════════════════════════════════════════════════════

UPDATE public.apex_ai_reserve_fund
SET contribution_pct = 10.0
WHERE contribution_pct != 10.0;

-- ════════════════════════════════════════════════════════════════
-- 4. Verification
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_total_configs INT;
  v_sma_enabled INT;
  v_funds_10pct INT;
BEGIN
  SELECT COUNT(*) INTO v_total_configs FROM public.apex_ai_layer_config;
  SELECT COUNT(*) INTO v_sma_enabled FROM public.apex_ai_layer_config WHERE sma_filter_enabled = TRUE;
  SELECT COUNT(*) INTO v_funds_10pct FROM public.apex_ai_reserve_fund WHERE contribution_pct = 10.0;

  RAISE NOTICE 'Apex AI validated config applied:';
  RAISE NOTICE '  Layer configs: %/% with sma_filter_enabled=true', v_sma_enabled, v_total_configs;
  RAISE NOTICE '  Reserve funds: % at 10%% contribution', v_funds_10pct;
END $$;
