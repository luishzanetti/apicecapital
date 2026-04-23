/**
 * Apex AI — Demo data seeder
 *
 * Populates apex_ai_positions + apex_ai_trades with realistic-looking
 * historical + live data for a given portfolio. Useful when demoing the
 * dashboard before the real bot engine has generated any activity.
 *
 * All inserts go through the user's Supabase session (RLS enforced).
 * The seeded rows belong to the authenticated user and are safely
 * distinguishable by their generated symbols/timing pattern.
 *
 * Safe to re-run: each call appends fresh demo rows (doesn't dedupe).
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  ApexAiPortfolio,
  ApexAiPositionSide,
} from '@/types/apexAi';

interface SeedResult {
  positions_inserted: number;
  trades_inserted: number;
  error?: string;
}

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'AVAXUSDT'];

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function pickSide(): ApexAiPositionSide {
  return Math.random() > 0.45 ? 'long' : 'short';
}

function pickSymbol(excluding?: Set<string>): string {
  const pool = excluding
    ? SYMBOLS.filter((s) => !excluding.has(s))
    : SYMBOLS;
  return pool[randInt(0, pool.length - 1)] ?? SYMBOLS[0];
}

function basePrice(symbol: string): number {
  const map: Record<string, number> = {
    BTCUSDT: 65000,
    ETHUSDT: 3400,
    SOLUSDT: 165,
    BNBUSDT: 590,
    XRPUSDT: 0.56,
    AVAXUSDT: 32,
  };
  return map[symbol] ?? 100;
}

/**
 * Seed open positions (2-4 random active positions) for the dashboard's
 * "Open positions" section to look populated.
 */
async function seedOpenPositions(
  portfolio: ApexAiPortfolio,
  userId: string
): Promise<number> {
  const count = randInt(2, 4);
  const used = new Set<string>();
  const rows = [];

  for (let i = 0; i < count; i++) {
    const symbol = pickSymbol(used);
    used.add(symbol);

    const price = basePrice(symbol);
    const side = pickSide();
    const entryPrice = price * rand(0.96, 1.04);
    const currentPrice = entryPrice * rand(0.93, 1.07);
    const leverage = Math.min(portfolio.max_leverage, randInt(3, 7));
    const allocatedCapital = (portfolio.capital_usdt / count) * rand(0.7, 1.1);
    const size = (allocatedCapital * leverage) / entryPrice;

    // PnL: + if side direction matches price movement
    const priceDelta = currentPrice - entryPrice;
    const pnlSign = side === 'long' ? 1 : -1;
    const unrealizedPnl = size * priceDelta * pnlSign;

    const openedMinsAgo = randInt(5, 180);

    rows.push({
      portfolio_id: portfolio.id,
      user_id: userId,
      symbol,
      side,
      entry_price: entryPrice,
      current_price: currentPrice,
      size,
      leverage,
      unrealized_pnl: unrealizedPnl,
      realized_pnl: 0,
      stop_loss_price:
        side === 'long' ? entryPrice * 0.95 : entryPrice * 1.05,
      take_profit_price:
        side === 'long' ? entryPrice * 1.08 : entryPrice * 0.92,
      status: 'open',
      exchange_position_id: `demo-${Date.now()}-${i}`,
      opened_at: new Date(Date.now() - openedMinsAgo * 60_000).toISOString(),
    });
  }

  const { error, count: inserted } = await supabase
    .from('apex_ai_positions')
    .insert(rows, { count: 'exact' });

  if (error) {
    // Duplicate open position is fine (unique index on portfolio+symbol+side)
    // Just log and continue with what we could insert.
    if (!error.message?.toLowerCase().includes('duplicate')) {
      console.warn('[apex-ai seed] positions error:', error.message);
    }
  }

  return inserted ?? 0;
}

/**
 * Seed closed trades spread over the last 30 days — gives the P&L chart
 * a realistic shape and populates the "Recent trades" + statements views.
 */
async function seedHistoricalTrades(
  portfolio: ApexAiPortfolio,
  userId: string
): Promise<number> {
  const count = randInt(25, 40);
  const rows = [];

  // Win rate approx 62% with avg profit slightly positive
  for (let i = 0; i < count; i++) {
    const symbol = pickSymbol();
    const side = pickSide();
    const leverage = Math.min(portfolio.max_leverage, randInt(3, 7));
    const price = basePrice(symbol);
    const entryPrice = price * rand(0.92, 1.08);

    const daysAgo = rand(0.1, 30);
    const durationHours = rand(0.2, 8);

    // Outcome: 62% wins
    const isWin = Math.random() < 0.62;
    const movementPct = isWin
      ? rand(0.003, 0.025) // 0.3% – 2.5% win
      : rand(0.002, 0.018); // 0.2% – 1.8% loss
    const sign = isWin ? 1 : -1;
    const priceDelta = entryPrice * movementPct * sign;
    const exitPrice =
      side === 'long' ? entryPrice + priceDelta : entryPrice - priceDelta;

    const allocatedCapital = (portfolio.capital_usdt / 5) * rand(0.6, 1.2);
    const size = (allocatedCapital * leverage) / entryPrice;

    // PnL in USDT
    const pnl =
      side === 'long'
        ? (exitPrice - entryPrice) * size
        : (entryPrice - exitPrice) * size;

    const feeExchange = Math.abs(pnl) * 0.0006; // 0.06% taker fee approx
    const gasFee = pnl > 0 ? pnl * 0.1 : 0; // 10% of profit (Apex AI fee)

    rows.push({
      portfolio_id: portfolio.id,
      user_id: userId,
      symbol,
      side,
      entry_price: entryPrice,
      exit_price: exitPrice,
      size,
      leverage,
      pnl,
      fee_exchange: feeExchange,
      gas_fee: gasFee,
      closed_at: new Date(
        Date.now() - daysAgo * 86_400_000 + durationHours * 3_600_000
      ).toISOString(),
    });
  }

  const { error, count: inserted } = await supabase
    .from('apex_ai_trades')
    .insert(rows, { count: 'exact' });

  if (error) {
    console.warn('[apex-ai seed] trades error:', error.message);
    return 0;
  }

  return inserted ?? 0;
}

/**
 * Aggregate stats on the portfolio row (total_pnl, win_count, loss_count)
 * from seeded trades, so KPI cards reflect reality without waiting for
 * bot-tick to compute them.
 */
async function updatePortfolioStats(portfolioId: string): Promise<void> {
  const { data: trades } = await supabase
    .from('apex_ai_trades')
    .select('pnl, net_pnl')
    .eq('portfolio_id', portfolioId);

  if (!trades || trades.length === 0) return;

  const total_pnl = trades.reduce(
    (sum, t) => sum + Number(t.net_pnl ?? t.pnl),
    0
  );
  const win_count = trades.filter((t) => Number(t.pnl) > 0).length;
  const loss_count = trades.length - win_count;

  await supabase
    .from('apex_ai_portfolios')
    .update({ total_pnl, win_count, loss_count })
    .eq('id', portfolioId);
}

/**
 * Ensure user has credits topped up for demos.
 */
async function seedCredits(userId: string): Promise<void> {
  await supabase
    .from('apex_ai_user_credits')
    .upsert(
      {
        user_id: userId,
        balance: 10000, // 10,000 Credits = $100
        lifetime_earned: 10000,
      },
      { onConflict: 'user_id' }
    );
}

export async function seedApexAiDemoData(
  portfolio: ApexAiPortfolio,
  userId: string
): Promise<SeedResult> {
  try {
    const [positionsInserted, tradesInserted] = await Promise.all([
      seedOpenPositions(portfolio, userId),
      seedHistoricalTrades(portfolio, userId),
    ]);

    await Promise.all([
      updatePortfolioStats(portfolio.id),
      seedCredits(userId),
    ]);

    return {
      positions_inserted: positionsInserted,
      trades_inserted: tradesInserted,
    };
  } catch (err) {
    return {
      positions_inserted: 0,
      trades_inserted: 0,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Wipe all demo data for a portfolio (keep the portfolio row + symbols).
 * Useful for resetting between demos.
 */
export async function wipeApexAiDemoData(
  portfolioId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await supabase
      .from('apex_ai_positions')
      .delete()
      .eq('portfolio_id', portfolioId);
    await supabase
      .from('apex_ai_trades')
      .delete()
      .eq('portfolio_id', portfolioId);
    await supabase
      .from('apex_ai_portfolios')
      .update({ total_pnl: 0, win_count: 0, loss_count: 0 })
      .eq('id', portfolioId);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
