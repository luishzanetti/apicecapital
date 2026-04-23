-- 011 · Apex AI — Trading IA 24/7 (clone CoinTech2u otimizado)
--
-- Apex AI é a estratégia de trading automatizado 24/7 com fee de 10% sobre profit líquido.
-- Modelo Zero-Custody: fundos permanecem na Bybit do usuário; plataforma apenas executa ordens via API Key.
--
-- Tabelas:
--   apex_ai_portfolios        — bot configs (capital, risk, status)
--   apex_ai_symbols           — pares por portfolio (BTCUSDT, ETHUSDT, ...)
--   apex_ai_positions         — posições abertas (sync com exchange)
--   apex_ai_trades            — trades fechados + PnL + gas fee
--   apex_ai_user_credits      — saldo de credits (1 USDT = 100 Credits)
--   apex_ai_gas_fee_ledger    — auditoria das cobranças de 10% profit
--   apex_ai_bot_logs          — logs estruturados de cada tick (forense)
--
-- Referências:
--   - PRD: docs/projects/apex-ai/01-SPEC-CONSOLIDATED.md
--   - Base de reuso: docs/projects/cointech-mvp/ (IDS ADAPT)
--   - Engenharia reversa: referencias/cointech2u-reverse-engineering.md
--
-- Idempotent — safe to re-run.

-- ════════════════════════════════════════════════════════════════
-- 1. ENUMS
-- ════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE apex_ai_risk_profile AS ENUM ('conservative', 'balanced', 'aggressive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE apex_ai_portfolio_status AS ENUM ('active', 'paused', 'stopped', 'error', 'circuit_breaker');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE apex_ai_position_side AS ENUM ('long', 'short');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE apex_ai_position_status AS ENUM ('open', 'closed', 'liquidated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE apex_ai_log_level AS ENUM ('info', 'warning', 'error', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════
-- 2. PORTFOLIOS
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.apex_ai_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exchange TEXT NOT NULL DEFAULT 'bybit' CHECK (exchange IN ('bybit', 'okx', 'bitget', 'binance')),
  capital_usdt NUMERIC(18, 8) NOT NULL CHECK (capital_usdt > 0),
  risk_profile apex_ai_risk_profile NOT NULL DEFAULT 'balanced',
  status apex_ai_portfolio_status NOT NULL DEFAULT 'paused',
  max_leverage INT NOT NULL DEFAULT 5 CHECK (max_leverage BETWEEN 1 AND 20),
  max_positions INT NOT NULL DEFAULT 5 CHECK (max_positions BETWEEN 1 AND 20),
  risk_per_trade_pct NUMERIC(5, 2) NOT NULL DEFAULT 2.0 CHECK (risk_per_trade_pct > 0 AND risk_per_trade_pct <= 20),
  -- circuit breaker — drawdown trigger
  drawdown_high_water_mark NUMERIC(18, 8),
  drawdown_24h_trigger_pct NUMERIC(5, 2) NOT NULL DEFAULT 20.0,
  -- stats cache (atualizado pelo bot tick)
  total_pnl NUMERIC(18, 8) NOT NULL DEFAULT 0,
  win_count INT NOT NULL DEFAULT 0,
  loss_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_tick_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS apex_ai_portfolios_user_idx ON public.apex_ai_portfolios(user_id);
CREATE INDEX IF NOT EXISTS apex_ai_portfolios_status_idx ON public.apex_ai_portfolios(status) WHERE status = 'active';

-- ════════════════════════════════════════════════════════════════
-- 3. SYMBOLS (pares por portfolio)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.apex_ai_symbols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.apex_ai_portfolios(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  allocation_pct NUMERIC(5, 2) NOT NULL CHECK (allocation_pct > 0 AND allocation_pct <= 100),
  leverage INT NOT NULL DEFAULT 5 CHECK (leverage BETWEEN 1 AND 20),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (portfolio_id, symbol)
);

CREATE INDEX IF NOT EXISTS apex_ai_symbols_portfolio_idx ON public.apex_ai_symbols(portfolio_id);

-- ════════════════════════════════════════════════════════════════
-- 4. POSITIONS
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.apex_ai_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.apex_ai_portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  side apex_ai_position_side NOT NULL,
  entry_price NUMERIC(18, 8) NOT NULL,
  current_price NUMERIC(18, 8),
  size NUMERIC(18, 8) NOT NULL,
  leverage INT NOT NULL,
  unrealized_pnl NUMERIC(18, 8) NOT NULL DEFAULT 0,
  realized_pnl NUMERIC(18, 8) NOT NULL DEFAULT 0,
  stop_loss_price NUMERIC(18, 8),
  take_profit_price NUMERIC(18, 8),
  status apex_ai_position_status NOT NULL DEFAULT 'open',
  exchange_position_id TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS apex_ai_positions_portfolio_idx ON public.apex_ai_positions(portfolio_id);
CREATE INDEX IF NOT EXISTS apex_ai_positions_user_idx ON public.apex_ai_positions(user_id);
CREATE INDEX IF NOT EXISTS apex_ai_positions_open_idx
  ON public.apex_ai_positions(portfolio_id, status)
  WHERE status = 'open';

-- Dedup: previne posições abertas duplicadas no mesmo portfolio/symbol/side
CREATE UNIQUE INDEX IF NOT EXISTS apex_ai_positions_open_dedup_idx
  ON public.apex_ai_positions(portfolio_id, symbol, side)
  WHERE status = 'open';

-- ════════════════════════════════════════════════════════════════
-- 5. TRADES (posições fechadas + ordens manuais)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.apex_ai_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.apex_ai_portfolios(id) ON DELETE CASCADE,
  position_id UUID REFERENCES public.apex_ai_positions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  side apex_ai_position_side NOT NULL,
  entry_price NUMERIC(18, 8) NOT NULL,
  exit_price NUMERIC(18, 8) NOT NULL,
  size NUMERIC(18, 8) NOT NULL,
  leverage INT NOT NULL,
  pnl NUMERIC(18, 8) NOT NULL,
  fee_exchange NUMERIC(18, 8) NOT NULL DEFAULT 0,
  gas_fee NUMERIC(18, 8) NOT NULL DEFAULT 0, -- 10% do profit líquido (0 se loss)
  net_pnl NUMERIC(18, 8) GENERATED ALWAYS AS (pnl - fee_exchange - gas_fee) STORED,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS apex_ai_trades_portfolio_idx ON public.apex_ai_trades(portfolio_id);
CREATE INDEX IF NOT EXISTS apex_ai_trades_user_idx ON public.apex_ai_trades(user_id);
CREATE INDEX IF NOT EXISTS apex_ai_trades_closed_at_idx ON public.apex_ai_trades(closed_at DESC);

-- ════════════════════════════════════════════════════════════════
-- 6. USER CREDITS (fee prepay — 1 USDT = 100 Credits)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.apex_ai_user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned NUMERIC(18, 2) NOT NULL DEFAULT 0,
  lifetime_spent NUMERIC(18, 2) NOT NULL DEFAULT 0,
  low_balance_threshold NUMERIC(18, 2) NOT NULL DEFAULT 500,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════
-- 7. GAS FEE LEDGER (auditoria de cobranças)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.apex_ai_gas_fee_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES public.apex_ai_trades(id) ON DELETE CASCADE,
  portfolio_id UUID NOT NULL REFERENCES public.apex_ai_portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gas_fee_usdt NUMERIC(18, 8) NOT NULL CHECK (gas_fee_usdt >= 0),
  credits_charged NUMERIC(18, 2) NOT NULL CHECK (credits_charged >= 0),
  fee_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 10.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS apex_ai_gas_fee_user_idx ON public.apex_ai_gas_fee_ledger(user_id);
CREATE INDEX IF NOT EXISTS apex_ai_gas_fee_portfolio_idx ON public.apex_ai_gas_fee_ledger(portfolio_id);

-- ════════════════════════════════════════════════════════════════
-- 8. BOT LOGS (forense — cada tick)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.apex_ai_bot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.apex_ai_portfolios(id) ON DELETE CASCADE,
  level apex_ai_log_level NOT NULL DEFAULT 'info',
  event TEXT NOT NULL,
  payload_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS apex_ai_bot_logs_portfolio_idx ON public.apex_ai_bot_logs(portfolio_id);
CREATE INDEX IF NOT EXISTS apex_ai_bot_logs_created_idx ON public.apex_ai_bot_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS apex_ai_bot_logs_level_idx ON public.apex_ai_bot_logs(level)
  WHERE level IN ('warning', 'error', 'critical');

-- ════════════════════════════════════════════════════════════════
-- 9. RLS — Row-Level Security
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.apex_ai_portfolios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apex_ai_symbols        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apex_ai_positions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apex_ai_trades         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apex_ai_user_credits   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apex_ai_gas_fee_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apex_ai_bot_logs       ENABLE ROW LEVEL SECURITY;

-- Portfolios: owner-only
DO $$ BEGIN
  CREATE POLICY "apex_ai_portfolios_owner" ON public.apex_ai_portfolios
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Symbols: via portfolio owner
DO $$ BEGIN
  CREATE POLICY "apex_ai_symbols_owner" ON public.apex_ai_symbols
    FOR ALL USING (
      EXISTS (SELECT 1 FROM public.apex_ai_portfolios p
              WHERE p.id = apex_ai_symbols.portfolio_id AND p.user_id = auth.uid())
    ) WITH CHECK (
      EXISTS (SELECT 1 FROM public.apex_ai_portfolios p
              WHERE p.id = apex_ai_symbols.portfolio_id AND p.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Positions: owner
DO $$ BEGIN
  CREATE POLICY "apex_ai_positions_owner" ON public.apex_ai_positions
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trades: owner read-only (trades são escritos apenas via service role)
DO $$ BEGIN
  CREATE POLICY "apex_ai_trades_owner_select" ON public.apex_ai_trades
    FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- User credits: owner
DO $$ BEGIN
  CREATE POLICY "apex_ai_user_credits_owner" ON public.apex_ai_user_credits
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Gas fee ledger: owner read-only
DO $$ BEGIN
  CREATE POLICY "apex_ai_gas_fee_owner_select" ON public.apex_ai_gas_fee_ledger
    FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Bot logs: owner read-only (via portfolio)
DO $$ BEGIN
  CREATE POLICY "apex_ai_bot_logs_owner_select" ON public.apex_ai_bot_logs
    FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.apex_ai_portfolios p
              WHERE p.id = apex_ai_bot_logs.portfolio_id AND p.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════
-- 10. REALTIME — publications para live UI
-- ════════════════════════════════════════════════════════════════

DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.apex_ai_positions REPLICA IDENTITY FULL';
  EXECUTE 'ALTER TABLE public.apex_ai_trades    REPLICA IDENTITY FULL';
  EXECUTE 'ALTER TABLE public.apex_ai_portfolios REPLICA IDENTITY FULL';
  EXECUTE 'ALTER TABLE public.apex_ai_user_credits REPLICA IDENTITY FULL';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.apex_ai_positions;
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.apex_ai_trades;
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.apex_ai_portfolios;
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.apex_ai_user_credits;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════
-- 11. RPC — charge_gas_fee (atomic — trade close + credit debit + ledger)
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.apex_ai_charge_gas_fee(
  p_trade_id UUID,
  p_portfolio_id UUID,
  p_user_id UUID,
  p_pnl NUMERIC,
  p_fee_rate_pct NUMERIC DEFAULT 10.0
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gas_fee NUMERIC;
  v_credits_to_charge NUMERIC;
  v_current_balance NUMERIC;
BEGIN
  -- Só cobra fee em profit positivo
  IF p_pnl <= 0 THEN
    RETURN jsonb_build_object('charged', false, 'reason', 'no_profit');
  END IF;

  v_gas_fee := p_pnl * (p_fee_rate_pct / 100.0);
  v_credits_to_charge := v_gas_fee * 100.0; -- 1 USDT = 100 Credits

  SELECT balance INTO v_current_balance
    FROM public.apex_ai_user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;

  IF v_current_balance IS NULL THEN
    -- cria conta zerada, pausa portfolio
    INSERT INTO public.apex_ai_user_credits (user_id, balance) VALUES (p_user_id, 0);
    UPDATE public.apex_ai_portfolios SET status = 'paused' WHERE id = p_portfolio_id;
    RETURN jsonb_build_object('charged', false, 'reason', 'no_credits_account');
  END IF;

  IF v_current_balance < v_credits_to_charge THEN
    UPDATE public.apex_ai_portfolios SET status = 'paused' WHERE id = p_portfolio_id;
    RETURN jsonb_build_object('charged', false, 'reason', 'insufficient_credits', 'required', v_credits_to_charge, 'balance', v_current_balance);
  END IF;

  -- Debita credits
  UPDATE public.apex_ai_user_credits
    SET balance = balance - v_credits_to_charge,
        lifetime_spent = lifetime_spent + v_credits_to_charge,
        updated_at = NOW()
    WHERE user_id = p_user_id;

  -- Atualiza trade com gas_fee
  UPDATE public.apex_ai_trades
    SET gas_fee = v_gas_fee
    WHERE id = p_trade_id;

  -- Registra ledger
  INSERT INTO public.apex_ai_gas_fee_ledger
    (trade_id, portfolio_id, user_id, gas_fee_usdt, credits_charged, fee_rate_pct)
    VALUES (p_trade_id, p_portfolio_id, p_user_id, v_gas_fee, v_credits_to_charge, p_fee_rate_pct);

  RETURN jsonb_build_object(
    'charged', true,
    'gas_fee_usdt', v_gas_fee,
    'credits_charged', v_credits_to_charge,
    'remaining_balance', v_current_balance - v_credits_to_charge
  );
END;
$$;

COMMENT ON FUNCTION public.apex_ai_charge_gas_fee IS
  'Apex AI — cobra gas fee (10% default) do profit de um trade fechado. Atomic: debita credits + atualiza trade + registra ledger. Pausa portfolio se insufficient.';

-- ════════════════════════════════════════════════════════════════
-- 12. TRIGGER — updated_at auto
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.apex_ai_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER apex_ai_portfolios_updated_at
    BEFORE UPDATE ON public.apex_ai_portfolios
    FOR EACH ROW EXECUTE FUNCTION public.apex_ai_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER apex_ai_positions_updated_at
    BEFORE UPDATE ON public.apex_ai_positions
    FOR EACH ROW EXECUTE FUNCTION public.apex_ai_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER apex_ai_user_credits_updated_at
    BEFORE UPDATE ON public.apex_ai_user_credits
    FOR EACH ROW EXECUTE FUNCTION public.apex_ai_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════
-- 13. COMMENTS — documentação inline
-- ════════════════════════════════════════════════════════════════

COMMENT ON TABLE public.apex_ai_portfolios IS
  'Apex AI — configuração de um bot de trading automatizado por usuário/exchange.';

COMMENT ON TABLE public.apex_ai_trades IS
  'Apex AI — histórico de trades fechados com PnL, fee da exchange e gas fee (10%).';

COMMENT ON TABLE public.apex_ai_user_credits IS
  'Apex AI — saldo de Credits pré-pagos (1 USDT depositado = 100 Credits). Usado para cobrar fee.';

COMMENT ON TABLE public.apex_ai_gas_fee_ledger IS
  'Apex AI — auditoria imutável de toda cobrança de 10% profit fee.';
