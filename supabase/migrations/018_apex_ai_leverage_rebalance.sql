-- 018 · Apex AI — Leverage rebalance per CEO directive
--
-- New defaults (CEO decision 2026-04-23):
--   Conservative: 2x (aguenta ~50% queda)
--   Balanced:     3x (aguenta ~33% queda)
--   Aggressive:   5x (aguenta ~20% queda)
--
-- Drawdown tolerance automatically adjusts to ~5pp BELOW the liquidation
-- threshold, so circuit breaker always fires before Bybit auto-liquidates.
--
--   Leverage → Liq drawdown → Safe tolerance
--     2x    →    49.75%    →    45.0%  (5pp buffer)
--     3x    →    33.17%    →    28.0%  (5pp buffer)
--     5x    →    19.90%    →    16.0%  (4pp buffer)
--
-- Trade-off note: higher leverage = more capital efficiency per cycle, but
-- tighter drawdown tolerance = circuit breaker fires on smaller moves.
-- Aggressive users should be aware: portfolio will pause on -16% drawdown
-- from L1 entry, not the -35% that conservative profiles can handle.
--
-- Idempotent.

-- ════════════════════════════════════════════════════════════════
-- 1. Update portfolio max_leverage per risk_profile
-- ════════════════════════════════════════════════════════════════

UPDATE public.apex_ai_portfolios
SET max_leverage = CASE risk_profile
  WHEN 'conservative' THEN 2
  WHEN 'balanced' THEN 3
  WHEN 'aggressive' THEN 5
  ELSE 2
END;

-- Sync per-symbol leverage to match portfolio ceiling
UPDATE public.apex_ai_symbols s
SET leverage = LEAST(s.leverage, p.max_leverage)
FROM public.apex_ai_portfolios p
WHERE s.portfolio_id = p.id;

-- Also bump symbols that were forced down to something absurdly low
-- (e.g. all at 2 when profile now allows 5 — let them climb)
UPDATE public.apex_ai_symbols s
SET leverage = CASE
  WHEN p.risk_profile = 'conservative' THEN LEAST(GREATEST(s.leverage, 2), 2)
  WHEN p.risk_profile = 'balanced' THEN LEAST(GREATEST(s.leverage, 3), 3)
  WHEN p.risk_profile = 'aggressive' THEN LEAST(GREATEST(s.leverage, 5), 5)
  ELSE s.leverage
END
FROM public.apex_ai_portfolios p
WHERE s.portfolio_id = p.id;

-- ════════════════════════════════════════════════════════════════
-- 2. Rebalance layer_config — tolerance follows leverage
-- ════════════════════════════════════════════════════════════════

UPDATE public.apex_ai_layer_config c
SET
  drawdown_tolerance_pct = CASE p.risk_profile
    WHEN 'conservative' THEN 45.0   -- 2x → 50% liq → 45% tolerance (5pp buffer)
    WHEN 'balanced' THEN 28.0       -- 3x → 33% liq → 28% tolerance (5pp buffer)
    WHEN 'aggressive' THEN 16.0     -- 5x → 20% liq → 16% tolerance (4pp buffer)
    ELSE 30.0
  END,
  -- Keep allocations conservative so margin buffer stays generous
  max_allocation_pct = CASE p.risk_profile
    WHEN 'conservative' THEN 15.0
    WHEN 'balanced' THEN 20.0       -- slightly reduced (was 25) since higher leverage
    WHEN 'aggressive' THEN 25.0     -- reduced (was 35) because 5x amplifies exposure
    ELSE 20.0
  END
FROM public.apex_ai_portfolios p
WHERE c.portfolio_id = p.id;

-- ════════════════════════════════════════════════════════════════
-- 3. Verification — log the new leverage → tolerance mapping
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_lev_2 NUMERIC;
  v_lev_3 NUMERIC;
  v_lev_5 NUMERIC;
  v_dd_2 NUMERIC;
  v_dd_3 NUMERIC;
  v_dd_5 NUMERIC;
BEGIN
  v_lev_2 := public.apex_ai_estimate_liq_price('long', 100, 2);
  v_lev_3 := public.apex_ai_estimate_liq_price('long', 100, 3);
  v_lev_5 := public.apex_ai_estimate_liq_price('long', 100, 5);
  v_dd_2 := ((100 - v_lev_2) / 100) * 100;
  v_dd_3 := ((100 - v_lev_3) / 100) * 100;
  v_dd_5 := ((100 - v_lev_5) / 100) * 100;

  RAISE NOTICE 'New Apex AI matrix:';
  RAISE NOTICE '  Conservative 2x → liq at -%.1f%% → tolerance 45%% (buffer %.1fpp)', v_dd_2, v_dd_2 - 45;
  RAISE NOTICE '  Balanced     3x → liq at -%.1f%% → tolerance 28%% (buffer %.1fpp)', v_dd_3, v_dd_3 - 28;
  RAISE NOTICE '  Aggressive   5x → liq at -%.1f%% → tolerance 16%% (buffer %.1fpp)', v_dd_5, v_dd_5 - 16;
END $$;
