import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import {
  fetchBybitPrices,
  computeUnrealizedPnl,
  evaluateExit,
} from '@/lib/apexAi/priceFeed';
import type {
  ApexAiPortfolio,
  ApexAiPosition,
  ApexAiSymbol,
} from '@/types/apexAi';

/**
 * useApexAiTicker — client-side bot tick loop.
 *
 * Runs periodically while the portfolio is ACTIVE and the tab is visible:
 *   1. Fetches current Bybit mark prices for all open-position symbols
 *   2. Updates `current_price` + `unrealized_pnl` on each open position
 *   3. Detects TP/SL triggers → closes position + records trade + charges fee
 *   4. On close: if portfolio still active, re-opens hedge leg (DCA/grid behavior)
 *
 * This is the CLIENT-SIDE fallback that makes the simulation feel alive.
 * For real Bybit execution, the same logic lives (more robustly) in the
 * `apex-ai-bot-tick` Edge Function. When that's deployed + pg_cron enabled,
 * this client-side loop can be disabled or kept as a UI fresher.
 *
 * Features:
 *   - Visibility-aware: pauses when tab hidden (saves battery + reduces API)
 *   - Idempotent: safe if it fires twice
 *   - Bounded: only processes this user's open positions
 *   - Invalidates TanStack cache so UI reflects changes
 */

const TICK_INTERVAL_MS = 8_000; // 8s — balance between realism and API pressure

export interface ApexAiTickerOptions {
  portfolio: ApexAiPortfolio | undefined | null;
  enabled?: boolean;
}

export function useApexAiTicker({ portfolio, enabled = true }: ApexAiTickerOptions) {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const runningRef = useRef(false);
  const portfolioRef = useRef(portfolio);

  useEffect(() => {
    portfolioRef.current = portfolio;
  }, [portfolio]);

  useEffect(() => {
    if (!enabled) return;
    if (!portfolio || portfolio.status !== 'active') return;
    if (!session?.user?.id) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function doTick() {
      if (cancelled) return;
      if (runningRef.current) {
        scheduleNext();
        return;
      }
      // Skip if tab is hidden
      if (typeof document !== 'undefined' && document.hidden) {
        scheduleNext();
        return;
      }

      runningRef.current = true;
      try {
        const p = portfolioRef.current;
        if (p && p.status === 'active') {
          await tickOnce(p, session!.user.id, queryClient);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[apex-ai ticker] tick failed', err);
        }
      } finally {
        runningRef.current = false;
        scheduleNext();
      }
    }

    function scheduleNext() {
      if (cancelled) return;
      timer = setTimeout(doTick, TICK_INTERVAL_MS);
    }

    // Fire first tick quickly for instant feedback, then periodic
    timer = setTimeout(doTick, 1500);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [portfolio?.id, portfolio?.status, session?.user?.id, enabled, queryClient]);
}

/**
 * Single tick — fetches prices, updates positions, closes triggered ones,
 * opens replacement hedge legs when applicable.
 */
async function tickOnce(
  portfolio: ApexAiPortfolio,
  userId: string,
  queryClient: ReturnType<typeof useQueryClient>
): Promise<void> {
  // 1. Fetch open positions for this portfolio
  const { data: openPositions, error: posErr } = await supabase
    .from('apex_ai_positions')
    .select('*')
    .eq('portfolio_id', portfolio.id)
    .eq('status', 'open');

  if (posErr || !openPositions || openPositions.length === 0) {
    return;
  }

  // Only simulate for positions we "own" (sim-*). Real positions should be
  // updated by the Edge Function using Bybit's position list endpoint.
  const simPositions = openPositions.filter((p) =>
    (p.exchange_position_id ?? '').startsWith('sim-')
  );
  if (simPositions.length === 0) return;

  // 2. Fetch current prices for all distinct symbols
  const symbols = Array.from(new Set(simPositions.map((p) => p.symbol)));
  const prices = await fetchBybitPrices(symbols);
  if (Object.keys(prices).length === 0) return; // no prices, skip tick

  const now = new Date().toISOString();
  const positionsToClose: Array<{
    position: ApexAiPosition;
    exitPrice: number;
    trigger: 'take_profit' | 'stop_loss';
  }> = [];

  // 3. For each position: update PnL or mark for close
  const updates: Array<Promise<unknown>> = [];
  for (const pos of simPositions) {
    const typedPos = pos as ApexAiPosition;
    const currentPrice = prices[typedPos.symbol];
    if (!currentPrice) continue;

    const unrealizedPnl = computeUnrealizedPnl({
      side: typedPos.side,
      entryPrice: Number(typedPos.entry_price),
      currentPrice,
      size: Number(typedPos.size),
    });

    const exitTrigger = evaluateExit({
      side: typedPos.side,
      currentPrice,
      stopLossPrice: typedPos.stop_loss_price
        ? Number(typedPos.stop_loss_price)
        : null,
      takeProfitPrice: typedPos.take_profit_price
        ? Number(typedPos.take_profit_price)
        : null,
    });

    if (exitTrigger) {
      positionsToClose.push({
        position: typedPos,
        exitPrice: currentPrice,
        trigger: exitTrigger,
      });
    } else {
      // Just update PnL snapshot
      updates.push(
        supabase
          .from('apex_ai_positions')
          .update({
            current_price: currentPrice,
            unrealized_pnl: unrealizedPnl,
            updated_at: now,
          })
          .eq('id', typedPos.id)
      );
    }
  }

  // 4. Run PnL updates in parallel
  await Promise.allSettled(updates);

  // 5. Close triggered positions (sequentially — each closes + re-opens if needed)
  if (positionsToClose.length > 0) {
    for (const { position, exitPrice, trigger } of positionsToClose) {
      await closeAndRecord(position, exitPrice, trigger, userId);
      // Re-open the hedge leg so the bot keeps trading (DCA/grid behavior).
      // Only re-open if portfolio is still active (user may have paused).
      const fresh = await supabase
        .from('apex_ai_portfolios')
        .select('status')
        .eq('id', portfolio.id)
        .single();
      if (fresh.data?.status === 'active') {
        await reopenHedgeLeg(portfolio, position, exitPrice, userId);
      }
    }
  }

  // 6. Invalidate queries so UI updates (partial — only positions + trades)
  queryClient.invalidateQueries({ queryKey: ['apex-ai-positions', portfolio.id] });

  if (positionsToClose.length > 0) {
    queryClient.invalidateQueries({ queryKey: ['apex-ai-trades', portfolio.id] });
    queryClient.invalidateQueries({ queryKey: ['apex-ai-portfolio', portfolio.id] });
    queryClient.invalidateQueries({ queryKey: ['apex-ai-credits'] });
    queryClient.invalidateQueries({ queryKey: ['apex-ai-daily-pnl', portfolio.id] });
  }
}

async function closeAndRecord(
  position: ApexAiPosition,
  exitPrice: number,
  trigger: 'take_profit' | 'stop_loss',
  userId: string
): Promise<void> {
  const entryPrice = Number(position.entry_price);
  const size = Number(position.size);
  const pnl =
    position.side === 'long'
      ? (exitPrice - entryPrice) * size
      : (entryPrice - exitPrice) * size;
  const feeExchange = Math.abs(pnl) * 0.0006; // approx taker fee
  const now = new Date().toISOString();

  // Insert trade record (gas_fee set to 0 here — RPC will compute real value)
  const { data: trade, error: tradeErr } = await supabase
    .from('apex_ai_trades')
    .insert({
      portfolio_id: position.portfolio_id,
      position_id: position.id,
      user_id: userId,
      symbol: position.symbol,
      side: position.side,
      entry_price: entryPrice,
      exit_price: exitPrice,
      size,
      leverage: position.leverage,
      pnl,
      fee_exchange: feeExchange,
      gas_fee: 0,
      closed_at: now,
    })
    .select()
    .single();

  if (tradeErr || !trade) {
    if (import.meta.env.DEV) {
      console.warn('[apex-ai ticker] trade insert failed', tradeErr);
    }
    return;
  }

  // Charge 10% fee atomically via RPC (debits credits + updates trade + ledger + pauses if insufficient)
  if (pnl > 0) {
    try {
      await supabase.rpc('apex_ai_charge_gas_fee', {
        p_trade_id: trade.id,
        p_portfolio_id: position.portfolio_id,
        p_user_id: userId,
        p_pnl: pnl,
        p_fee_rate_pct: 10.0,
      });
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[apex-ai ticker] charge_gas_fee failed', err);
      }
    }
  }

  // Mark position as closed
  await supabase
    .from('apex_ai_positions')
    .update({
      status: 'closed',
      closed_at: now,
      current_price: exitPrice,
      unrealized_pnl: 0,
      realized_pnl: pnl,
    })
    .eq('id', position.id);

  // Update portfolio running stats
  await supabase.rpc('apex_ai_update_stats_after_trade', {
    p_portfolio_id: position.portfolio_id,
    p_pnl: pnl,
  }).then(
    () => undefined,
    // RPC may not exist yet; fall back to direct update
    async () => {
      const { data: fresh } = await supabase
        .from('apex_ai_portfolios')
        .select('total_pnl, win_count, loss_count')
        .eq('id', position.portfolio_id)
        .single();
      if (fresh) {
        await supabase
          .from('apex_ai_portfolios')
          .update({
            total_pnl: Number(fresh.total_pnl) + pnl,
            win_count: Number(fresh.win_count) + (pnl > 0 ? 1 : 0),
            loss_count: Number(fresh.loss_count) + (pnl <= 0 ? 1 : 0),
          })
          .eq('id', position.portfolio_id);
      }
    }
  );

  if (import.meta.env.DEV) {
    console.info('[apex-ai ticker] position closed', {
      symbol: position.symbol,
      side: position.side,
      pnl: pnl.toFixed(2),
      trigger,
      exitPrice,
    });
  }
}

/**
 * Re-opens a fresh hedge leg on the same symbol/side with current market
 * price as entry — mimics DCA/grid re-entry logic.
 */
async function reopenHedgeLeg(
  portfolio: ApexAiPortfolio,
  justClosed: ApexAiPosition,
  currentPrice: number,
  userId: string
): Promise<void> {
  // Fetch symbol config to respect allocation settings
  const { data: symbolConfig } = await supabase
    .from('apex_ai_symbols')
    .select('*')
    .eq('portfolio_id', portfolio.id)
    .eq('symbol', justClosed.symbol)
    .maybeSingle();

  if (!symbolConfig) return;

  const typedSymbol = symbolConfig as ApexAiSymbol;
  const allocatedCapital =
    (Number(portfolio.capital_usdt) * Number(typedSymbol.allocation_pct)) / 100;
  const perSideCapital = allocatedCapital / 2;
  const size = (perSideCapital * typedSymbol.leverage) / currentPrice;

  // Re-enter same side with tighter TP/SL around new price
  const isLong = justClosed.side === 'long';
  const stopLossPrice = isLong ? currentPrice * 0.97 : currentPrice * 1.03;
  const takeProfitPrice = isLong ? currentPrice * 1.04 : currentPrice * 0.96;

  await supabase.from('apex_ai_positions').insert({
    portfolio_id: portfolio.id,
    user_id: userId,
    symbol: justClosed.symbol,
    side: justClosed.side,
    entry_price: currentPrice,
    current_price: currentPrice,
    size,
    leverage: typedSymbol.leverage,
    unrealized_pnl: 0,
    realized_pnl: 0,
    stop_loss_price: stopLossPrice,
    take_profit_price: takeProfitPrice,
    status: 'open',
    exchange_position_id: `sim-${crypto.randomUUID()}`,
    opened_at: new Date().toISOString(),
  });

  if (import.meta.env.DEV) {
    console.info('[apex-ai ticker] hedge leg re-opened', {
      symbol: justClosed.symbol,
      side: justClosed.side,
      entryPrice: currentPrice,
    });
  }
}
