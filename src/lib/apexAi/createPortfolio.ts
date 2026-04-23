/**
 * Apex AI — Create Portfolio (client-side fallback)
 *
 * Mirrors `apex-ai-create-portfolio` Edge Function. Uses supabase-js directly
 * with RLS protection (user_id = auth.uid() enforced by policies in
 * migration 011_apex_ai.sql).
 *
 * Why a client-side version exists:
 *  - The Edge Function adds an extra deploy step; the DB INSERT doesn't need
 *    server-side privileges since RLS protects access.
 *  - Lets the flow work end-to-end for MVP demo without edge deploy.
 *
 * IMPORTANT: migration 011_apex_ai.sql must be applied (see DEPLOY-CHECKLIST).
 * Otherwise the INSERT fails with "relation apex_ai_portfolios does not exist".
 */

import { supabase } from '@/integrations/supabase/client';
import type { ApexAiRiskProfile } from '@/types/apexAi';

export interface CreatePortfolioInput {
  name: string;
  capital_usdt: number;
  risk_profile: ApexAiRiskProfile;
  max_leverage: number;
  max_positions: number;
  risk_per_trade_pct: number;
  symbols: Array<{
    symbol: string;
    allocation_pct: number;
    leverage: number;
  }>;
}

export interface CreatePortfolioResult {
  portfolio_id: string;
}

export async function createApexAiPortfolio(
  input: CreatePortfolioInput,
  userId: string
): Promise<CreatePortfolioResult> {
  // Validations
  if (!input.name?.trim()) throw new Error('name required');
  if (!input.capital_usdt || input.capital_usdt < 100) {
    throw new Error('capital_usdt must be >= 100');
  }
  if (!Array.isArray(input.symbols) || input.symbols.length === 0) {
    throw new Error('symbols required');
  }

  const totalPct = input.symbols.reduce((s, x) => s + x.allocation_pct, 0);
  if (Math.abs(totalPct - 100) > 0.01) {
    throw new Error(`symbol allocations must sum to 100% (got ${totalPct})`);
  }

  // Insert portfolio
  const { data: portfolio, error: pErr } = await supabase
    .from('apex_ai_portfolios')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      exchange: 'bybit',
      capital_usdt: input.capital_usdt,
      risk_profile: input.risk_profile,
      status: 'paused', // always starts paused
      max_leverage: input.max_leverage,
      max_positions: input.max_positions,
      risk_per_trade_pct: input.risk_per_trade_pct,
      drawdown_high_water_mark: input.capital_usdt,
    })
    .select()
    .single();

  if (pErr || !portfolio) {
    // Detect "missing table" specifically to give a clear error
    const code = (pErr as { code?: string })?.code;
    const msg = pErr?.message ?? 'portfolio insert failed';
    if (msg.toLowerCase().includes('does not exist') || code === '42P01') {
      throw new Error(
        'Database schema not migrated yet. Apply migration 011_apex_ai.sql first. See DEPLOY-CHECKLIST.md.'
      );
    }
    throw new Error(msg);
  }

  // Insert symbols
  const symbolRows = input.symbols.map((s) => ({
    portfolio_id: portfolio.id,
    symbol: s.symbol,
    allocation_pct: s.allocation_pct,
    leverage: s.leverage,
    is_active: true,
  }));

  const { error: sErr } = await supabase
    .from('apex_ai_symbols')
    .insert(symbolRows);

  if (sErr) {
    // Rollback: delete the portfolio we just created
    await supabase.from('apex_ai_portfolios').delete().eq('id', portfolio.id);
    throw new Error(sErr.message);
  }

  // Ensure user_credits row exists (idempotent)
  await supabase
    .from('apex_ai_user_credits')
    .upsert(
      { user_id: userId },
      { onConflict: 'user_id', ignoreDuplicates: true }
    );

  return { portfolio_id: portfolio.id as string };
}
