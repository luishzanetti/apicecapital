// Supabase Edge Function: apex-ai-bot-tick
//
// Server-side bot engine for Apex AI. Invoked by pg_cron every ~60s per
// active portfolio (see migration 013_apex_ai_cron.sql). When invoked:
//
//   1. Load portfolio + active symbols + user API credentials (if any)
//   2. Circuit breaker check (drawdown 24h > trigger_pct → pause)
//   3. Fetch current Bybit mark prices (public API, no auth)
//   4. For each open simulated position:
//      - Update current_price + unrealized_pnl
//      - If TP/SL hit: close position + create trade + charge gas fee + re-open hedge leg
//   5. Log tick to apex_ai_bot_logs
//
// Modes:
//   - 'simulate' (default): all operations in DB, Bybit for prices only
//   - 'live' (future): real Bybit orders using user's encrypted API key
//
// The client-side ticker (useApexAiTicker) remains as a UI refresher but
// the server-side tick is authoritative for position lifecycle.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/bybit-api.ts';
import { aesDecryptAsync } from '../_shared/crypto.ts';
import {
  fetchApexAiBalance,
  fetchOpenFutures,
  placeFuturesOrder,
  closeFuturesPosition,
  setLeverage,
} from '../_shared/apex-ai-bybit.ts';

const CORS_HEADERS = getCorsHeaders();
const FEE_RATE_PCT = 10.0;
const DEFAULT_DRAWDOWN_TRIGGER_PCT = 20.0;

// Bybit public tickers endpoint (no auth needed)
const BYBIT_PUBLIC_BASE = 'https://api.bybit.com';

interface BotTickRequest {
  portfolio_id: string;
  bootstrap?: boolean;
  mode?: 'simulate' | 'live' | 'auto';
}

interface BybitTicker {
  symbol: string;
  markPrice: string;
  lastPrice: string;
}

interface ApexAiPosition {
  id: string;
  portfolio_id: string;
  user_id: string;
  symbol: string;
  side: 'long' | 'short';
  entry_price: number | string;
  current_price: number | string | null;
  size: number | string;
  leverage: number;
  unrealized_pnl: number | string;
  realized_pnl: number | string;
  stop_loss_price: number | string | null;
  take_profit_price: number | string | null;
  status: string;
  exchange_position_id: string | null;
  opened_at: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const startTime = Date.now();

  try {
    // Service-role client bypasses RLS (needed for writes to logs + trades)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const body = (await req.json()) as BotTickRequest;
    if (!body.portfolio_id) {
      return json({ success: false, error: 'portfolio_id required' }, 400);
    }

    // ─── 1. Load portfolio ───────────────────────────
    const { data: portfolio, error: pErr } = await supabase
      .from('apex_ai_portfolios')
      .select('*')
      .eq('id', body.portfolio_id)
      .single();

    if (pErr || !portfolio) {
      return json({ success: false, error: 'portfolio not found' }, 404);
    }

    // Skip if not active (saves compute)
    if (portfolio.status !== 'active') {
      return json({
        success: true,
        data: {
          portfolio_id: body.portfolio_id,
          skipped: true,
          reason: `status=${portfolio.status}`,
        },
      });
    }

    // ─── 2. Circuit breaker ─────────────────────────
    const currentEquity =
      Number(portfolio.capital_usdt) + Number(portfolio.total_pnl);
    const hwm =
      Number(portfolio.drawdown_high_water_mark ?? portfolio.capital_usdt) ||
      currentEquity;
    const drawdownPct = hwm > 0 ? ((hwm - currentEquity) / hwm) * 100 : 0;
    const trigger = Number(
      portfolio.drawdown_24h_trigger_pct ?? DEFAULT_DRAWDOWN_TRIGGER_PCT
    );

    if (drawdownPct >= trigger) {
      await supabase
        .from('apex_ai_portfolios')
        .update({ status: 'circuit_breaker' })
        .eq('id', portfolio.id);

      await logEvent(supabase, portfolio.id, 'critical', 'circuit_breaker_triggered', {
        drawdown_pct: drawdownPct,
        trigger_pct: trigger,
      });

      return json({
        success: true,
        data: {
          portfolio_id: body.portfolio_id,
          circuit_breaker_triggered: true,
          drawdown_pct: drawdownPct,
        },
      });
    }

    // ─── 3. Load positions + symbols ────────────────
    const [positionsRes, symbolsRes] = await Promise.all([
      supabase
        .from('apex_ai_positions')
        .select('*')
        .eq('portfolio_id', portfolio.id)
        .eq('status', 'open'),
      supabase
        .from('apex_ai_symbols')
        .select('*')
        .eq('portfolio_id', portfolio.id)
        .eq('is_active', true),
    ]);

    const positions = (positionsRes.data ?? []) as ApexAiPosition[];
    const symbols = symbolsRes.data ?? [];

    if (symbols.length === 0) {
      await logEvent(supabase, portfolio.id, 'warning', 'no_active_symbols', null);
      return json({
        success: true,
        data: { portfolio_id: body.portfolio_id, no_symbols: true },
      });
    }

    // ─── 3.5. Detect execution mode (LIVE vs SIMULATE) ───
    // Load user's Bybit credentials (if any). If present + non-empty, we run
    // in LIVE mode: real orders on Bybit testnet/mainnet per their testnet flag.
    const creds = await loadBybitCredentials(supabase, portfolio.user_id);
    const requestedMode = body.mode ?? 'auto';
    const mode: 'live' | 'simulate' =
      requestedMode === 'simulate'
        ? 'simulate'
        : requestedMode === 'live'
        ? 'live'
        : creds
        ? 'live'
        : 'simulate';

    if (import.meta.env?.DEV ?? false) {
      console.info('[apex-ai-bot-tick] mode detected', {
        portfolio_id: portfolio.id,
        mode,
        has_credentials: !!creds,
        testnet: creds?.testnet ?? null,
      });
    }

    // ─── 4. Bootstrap (if requested) ────────────────
    if (body.bootstrap === true && positions.length === 0) {
      // ★ V3 — SMA-20 filter (validated config from backtest v2) ★
      // For each symbol: if sma_filter_enabled and current_price < sma_20 × 0.95
      // for the LONG leg (or > 1.05 for SHORT), skip that symbol's L1.
      // Per backtest: bot operates 100% win rate when this filter is on.
      const filtered = await applySmaFilter(supabase, portfolio.id, symbols);
      const survivingSymbols = filtered.symbols;

      if (filtered.skippedCount > 0) {
        await logEvent(supabase, portfolio.id, 'info', 'sma_filter_applied', {
          total_symbols: symbols.length,
          skipped: filtered.skippedCount,
          surviving: survivingSymbols.length,
          rejections: filtered.rejections.slice(0, 5),
        });
      }

      let opened = 0;
      if (survivingSymbols.length === 0) {
        await logEvent(supabase, portfolio.id, 'warning', 'bootstrap_blocked_sma', {
          reason: 'all_symbols_below_sma_20_filter',
          rejections: filtered.rejections.slice(0, 5),
        });
        return json({
          success: true,
          data: {
            portfolio_id: body.portfolio_id,
            bootstrap: true,
            mode,
            actions: [],
            blocked_by_sma_filter: filtered.rejections,
          },
        });
      }

      if (mode === 'live' && creds) {
        opened = await bootstrapLiveHedgePositions(supabase, portfolio, survivingSymbols, creds);
        await logEvent(supabase, portfolio.id, 'info', 'bootstrap_opened_live', {
          positions_opened: opened,
          testnet: creds.testnet,
          sma_filtered: filtered.skippedCount,
        });
      } else {
        opened = await bootstrapHedgePositions(supabase, portfolio, survivingSymbols);
        await logEvent(supabase, portfolio.id, 'info', 'bootstrap_opened_simulated', {
          positions_opened: opened,
          sma_filtered: filtered.skippedCount,
        });
      }

      return json({
        success: true,
        data: {
          portfolio_id: body.portfolio_id,
          bootstrap: true,
          mode,
          actions: Array(opened).fill({ type: 'open_position' }),
          sma_skipped: filtered.skippedCount,
        },
      });
    }

    // ─── 5. Fetch prices for all open positions ─────
    const uniqueSymbols = Array.from(new Set(positions.map((p) => p.symbol)));
    const { prices, errors: priceErrors } = await fetchBybitTickers(uniqueSymbols);

    if (Object.keys(prices).length === 0) {
      await logEvent(supabase, portfolio.id, 'error', 'price_fetch_failed', {
        requested_symbols: uniqueSymbols,
        errors: priceErrors.slice(0, 5),
      });
    }

    // ─── 6. LIVE reconciliation (if in LIVE mode with creds) ────────
    // Fetch Bybit real positions and sync DB state. Detects:
    //   - Positions closed externally on Bybit (user manually closed)
    //   - Price + PnL updates from Bybit mark price
    //   - Missing positions (DB open but not on Bybit → mark closed)
    let livePositions: Awaited<ReturnType<typeof fetchOpenFutures>> = [];
    if (mode === 'live' && creds) {
      try {
        livePositions = await fetchOpenFutures(
          creds.apiKey,
          creds.apiSecret,
          creds.testnet,
          uniqueSymbols
        );
        await reconcileLivePositions(supabase, portfolio.id, positions, livePositions);

        await supabase
          .from('apex_ai_portfolios')
          .update({
            last_reconcile_at: new Date().toISOString(),
            reconcile_error: null,
          })
          .eq('id', portfolio.id);
      } catch (reconErr) {
        const errMsg = reconErr instanceof Error ? reconErr.message : String(reconErr);
        console.error('[apex-ai-bot-tick] reconcile failed', errMsg);
        await supabase
          .from('apex_ai_portfolios')
          .update({ reconcile_error: errMsg.slice(0, 500) })
          .eq('id', portfolio.id);
        await logEvent(supabase, portfolio.id, 'error', 'live_reconcile_failed', { error: errMsg });
      }
    }

    // ─── 7. Tick each position (PnL updates) ────────
    const actions: Array<Record<string, unknown>> = [];
    const updates: Array<Promise<unknown>> = [];

    // Build lookup of live positions by symbol+side for quick PnL pull
    const livePositionBySymbolSide: Record<string, typeof livePositions[0]> = {};
    for (const lp of livePositions) {
      livePositionBySymbolSide[`${lp.symbol}-${lp.side}`] = lp;
    }

    for (const pos of positions) {
      const isSim = (pos.exchange_position_id ?? '').startsWith('sim-');
      const currentPrice = prices[pos.symbol];
      if (!currentPrice) continue;

      const entryPrice = Number(pos.entry_price);
      const size = Number(pos.size);

      let unrealizedPnl: number;
      let effectivePrice = currentPrice;

      if (!isSim) {
        // LIVE: prefer Bybit's unrealized_pnl for accuracy (includes funding etc)
        const live = livePositionBySymbolSide[`${pos.symbol}-${pos.side}`];
        if (live) {
          unrealizedPnl = live.unrealizedPnl;
          effectivePrice = live.markPrice;
        } else {
          // Position not on Bybit anymore — reconcile marked it closed already
          continue;
        }
      } else {
        // SIM: compute from fetched ticker price
        unrealizedPnl =
          pos.side === 'long'
            ? (currentPrice - entryPrice) * size
            : (entryPrice - currentPrice) * size;
      }

      updates.push(
        supabase
          .from('apex_ai_positions')
          .update({
            current_price: effectivePrice,
            unrealized_pnl: unrealizedPnl,
            updated_at: new Date().toISOString(),
            ...(!isSim && { last_bybit_sync_at: new Date().toISOString() }),
          })
          .eq('id', pos.id)
          .eq('status', 'open')
      );
    }
    await Promise.allSettled(updates);

    // ═════════════════════════════════════════════════════════════════
    // ★ Apex AI v3.2 — SMART HEDGE CYCLING (individual TP/SL fallback) ★
    // ═════════════════════════════════════════════════════════════════
    //
    // Why this exists: the v2.0 Martingale loop only closes when
    // `aggregatePnl > 0` AND blended TP hit. In a perfect hedge with no
    // ATR data (intelligence loop never ran), aggregate stays at exactly
    // 0 forever and no layer is ever added — bot freezes.
    //
    // This block restores the v1.0 behavior as a *fallback*: when an
    // individual leg of a hedge pair hits its own TP or SL, we close
    // BOTH legs of the pair (one wins, one loses) and re-open a fresh
    // hedge at the current price. Result: short cycles, frequent profit
    // crystallization, and predictable behavior even without regime data.
    //
    // Runs ONLY for SIM positions (LIVE positions are reconciled against
    // Bybit which has its own TP/SL handling on the order itself).
    const hedgeCycleActions = await runSmartHedgeCycling({
      supabase,
      portfolio,
      positions,
      prices,
      isLiveMode: mode === 'live',
    });
    actions.push(...hedgeCycleActions);

    // ─── 7. Martingale group logic ──────────────────
    // Group positions by (symbol, side, parent_position_group).
    const groups = groupPositionsByMartingaleKey(positions);
    const layerConfigs = await loadLayerConfig(supabase, portfolio.id);
    const regimeStates = await loadRegimeStates(supabase, Array.from(new Set(positions.map(p => p.symbol))));
    const tpTargetPct = layerConfigs?.take_profit_pct ?? 1.2;
    const toleranceTargetPct = layerConfigs?.drawdown_tolerance_pct ?? 35.0;

    // ★ CATASTROPHIC PRE-CHECK ★
    // Before any group logic, verify that no active group has drawdown
    // exceeding tolerance. If one does, pause the portfolio immediately.
    for (const [, group] of groups.entries()) {
      if (!group.layers.some(l => (l.exchange_position_id ?? '').startsWith('sim-'))) continue;
      const currentPrice = prices[group.symbol];
      if (!currentPrice) continue;
      const firstLayer = group.layers.reduce((min, l) =>
        (l.layer_index ?? 1) < (min.layer_index ?? 1) ? l : min
      );
      const l1Entry = Number(firstLayer.entry_price);
      const drawdownPct =
        group.side === 'long'
          ? Math.max(0, ((l1Entry - currentPrice) / l1Entry) * 100)
          : Math.max(0, ((currentPrice - l1Entry) / l1Entry) * 100);

      if (drawdownPct >= toleranceTargetPct) {
        await supabase
          .from('apex_ai_portfolios')
          .update({ status: 'circuit_breaker' })
          .eq('id', portfolio.id);
        await logEvent(supabase, portfolio.id, 'critical', 'drawdown_tolerance_breached', {
          symbol: group.symbol,
          side: group.side,
          drawdown_pct: drawdownPct,
          tolerance_pct: toleranceTargetPct,
          l1_entry: l1Entry,
          current_price: currentPrice,
        });
        return json({
          success: true,
          data: {
            portfolio_id: body.portfolio_id,
            circuit_breaker_triggered: true,
            reason: 'drawdown_tolerance_breached',
            drawdown_pct: drawdownPct,
            tolerance_pct: toleranceTargetPct,
          },
        });
      }
    }

    for (const [groupKey, group] of groups.entries()) {
      const symbol = group.symbol;
      const side = group.side;
      const currentPrice = prices[symbol];
      if (!currentPrice) continue;

      // Only process simulated groups (skip live — needs Bybit sync)
      const isSimulated = group.layers.every((l) =>
        (l.exchange_position_id ?? '').startsWith('sim-')
      );
      if (!isSimulated) continue;

      // Compute blended avg entry + aggregate pnl
      let totalSize = 0;
      let weightedEntry = 0;
      let aggregatePnl = 0;
      for (const layer of group.layers) {
        const size = Number(layer.size);
        const entry = Number(layer.entry_price);
        totalSize += size;
        weightedEntry += entry * size;
        aggregatePnl +=
          side === 'long'
            ? (currentPrice - entry) * size
            : (entry - currentPrice) * size;
      }
      const avgEntry = totalSize > 0 ? weightedEntry / totalSize : 0;

      // Target blended exit price for TP
      const tpPrice =
        side === 'long'
          ? avgEntry * (1 + tpTargetPct / 100)
          : avgEntry * (1 - tpTargetPct / 100);

      // Check: is TP hit on blended avg?
      const tpHit =
        side === 'long'
          ? currentPrice >= tpPrice
          : currentPrice <= tpPrice;

      if (tpHit && aggregatePnl > 0) {
        // Close the whole group
        const parentGroup = group.parent_position_group ?? group.layers[0].id;

        // If this group is LIVE (has real Bybit order IDs), close each leg on Bybit first
        const isGroupLive =
          mode === 'live' && creds && group.layers.every(l =>
            l.exchange_position_id && !l.exchange_position_id.startsWith('sim-')
          );

        if (isGroupLive && creds) {
          const closeTasks = group.layers.map(async (layer) => {
            try {
              await closeFuturesPosition(
                creds.apiKey,
                creds.apiSecret,
                creds.testnet,
                layer.symbol,
                layer.side,
                Number(layer.size),
                (layer as PositionExtended & { bybit_position_idx?: number }).bybit_position_idx ??
                  (layer.side === 'long' ? 1 : 2)
              );
            } catch (err) {
              console.error('[apex-ai-bot-tick] closeFuturesPosition failed', layer.symbol, layer.side, err);
              await logEvent(supabase, portfolio.id, 'error', 'live_close_failed', {
                symbol: layer.symbol,
                side: layer.side,
                layer_index: layer.layer_index,
                error: (err as Error).message,
              });
            }
          });
          await Promise.allSettled(closeTasks);
        }

        // Then update DB + record trades + charge fee via RPC (enforces never-close-at-loss)
        const { data: closeResult } = await supabase.rpc('apex_ai_close_position_group', {
          p_parent_group: parentGroup,
          p_exit_price: currentPrice,
          p_trigger: isGroupLive ? 'live_blended_tp' : 'blended_tp',
        });

        if (closeResult && typeof closeResult === 'object') {
          const r = closeResult as Record<string, unknown>;
          actions.push({
            type: 'cycle_closed',
            symbol,
            side,
            layers_closed: r.closed,
            pnl: r.total_pnl,
            avg_entry: r.avg_entry,
            exit_price: currentPrice,
            mode: isGroupLive ? 'live' : 'simulate',
          });
        }
        continue;
      }

      // Check: should we open next layer?
      if (!layerConfigs) continue;
      if (group.layers.length >= layerConfigs.max_layers) continue;

      const regime = regimeStates[symbol];
      const atr = regime?.atr_14 ? Number(regime.atr_14) : null;
      if (!atr || atr <= 0) continue;

      const lastLayer = group.layers.reduce((max, l) =>
        (l.layer_index ?? 1) > (max.layer_index ?? 1) ? l : max
      );
      const lastEntry = Number(lastLayer.entry_price);
      const spacingAtr = Number(layerConfigs.layer_spacing_atr) * atr;

      const thresholdBreached =
        side === 'long'
          ? currentPrice <= lastEntry - spacingAtr
          : currentPrice >= lastEntry + spacingAtr;

      if (thresholdBreached && aggregatePnl < 0) {
        const isGroupLive =
          mode === 'live' && creds && group.layers.every(l =>
            l.exchange_position_id && !l.exchange_position_id.startsWith('sim-')
          );

        // Call RPC to compute sizing + reserve layer slot
        const { data: openResult } = await supabase.rpc('apex_ai_open_next_layer', {
          p_portfolio_id: portfolio.id,
          p_symbol: symbol,
          p_side: side,
          p_current_price: currentPrice,
          p_current_atr: atr,
        });

        if (openResult && typeof openResult === 'object') {
          const r = openResult as Record<string, unknown>;

          if (r.opened) {
            // If LIVE group: also place the real order on Bybit
            if (isGroupLive && creds) {
              const sizeUsdt = Number(r.size_usdt);
              const qty = roundQty(sizeUsdt / currentPrice, symbol);
              const layerIndex = Number(r.layer_index);
              const positionIdx = side === 'long' ? 1 : 2;

              // A3: Idempotency key
              const clientOrderId = `apex-${portfolio.id.slice(0, 8)}-${symbol.replace('USDT', '')}-${side}-L${layerIndex}-${Math.floor(Date.now() / 60000)}`;

              // A4: Margin buffer check
              const marginCheck = await checkMarginBuffer(creds, sizeUsdt, lastLayer.leverage);
              if (!marginCheck.ok) {
                await logEvent(supabase, portfolio.id, 'warning', 'live_margin_insufficient', {
                  symbol,
                  side,
                  layer_index: layerIndex,
                  required: marginCheck.required,
                  balance: marginCheck.balance,
                  reason: marginCheck.reason,
                });
                // Rollback the DB insert since we can't place order
                await supabase
                  .from('apex_ai_positions')
                  .delete()
                  .eq('id', r.position_id);
                continue;
              }

              try {
                const order = await placeFuturesOrder(creds.apiKey, creds.apiSecret, creds.testnet, {
                  symbol,
                  side,
                  qty,
                  leverage: lastLayer.leverage,
                  positionIdx,
                  clientOrderId,
                });

                // Update position with real Bybit order_id + client_order_id
                await supabase
                  .from('apex_ai_positions')
                  .update({
                    exchange_position_id: order.orderId,
                    client_order_id: clientOrderId,
                    bybit_position_idx: positionIdx,
                    last_bybit_sync_at: new Date().toISOString(),
                  })
                  .eq('id', r.position_id);
              } catch (err) {
                console.error('[apex-ai-bot-tick] placeFuturesOrder failed', symbol, side, err);
                // Rollback DB since Bybit didn't accept
                await supabase
                  .from('apex_ai_positions')
                  .delete()
                  .eq('id', r.position_id);
                await logEvent(supabase, portfolio.id, 'error', 'live_order_failed', {
                  symbol,
                  side,
                  layer_index: layerIndex,
                  error: (err as Error).message,
                });
                continue;
              }
            }

            actions.push({
              type: 'layer_opened',
              symbol,
              side,
              layer_index: r.layer_index,
              entry_price: r.entry_price,
              size_usdt: r.size_usdt,
              mode: isGroupLive ? 'live' : 'simulate',
            });
          }
        }
      }
    }

    // ─── 7. Update last_tick_at + log ───────────────
    await supabase
      .from('apex_ai_portfolios')
      .update({ last_tick_at: new Date().toISOString() })
      .eq('id', portfolio.id);

    const elapsedMs = Date.now() - startTime;
    await logEvent(supabase, portfolio.id, 'info', 'tick_completed', {
      elapsed_ms: elapsedMs,
      positions_touched: positions.length,
      updates_count: updates.length,
      actions_count: actions.length,
      prices_fetched: Object.keys(prices).length,
      price_errors: priceErrors.slice(0, 3),
    });

    return json({
      success: true,
      data: {
        portfolio_id: body.portfolio_id,
        ticked_at: new Date().toISOString(),
        elapsed_ms: elapsedMs,
        actions,
      },
    });
  } catch (error) {
    console.error('[apex-ai-bot-tick] exception', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal error',
      },
      500
    );
  }
});

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// V3 SMA-20 filter (validated production config)
// ═══════════════════════════════════════════════════════════════════

interface SmaFilterResult {
  symbols: Array<{ symbol: string; allocation_pct: number | string; leverage: number }>;
  skippedCount: number;
  rejections: Array<{ symbol: string; reason: string; current_price?: number; sma_20?: number }>;
}

/**
 * Apply SMA-20 filter to L1 bootstrap candidates.
 * Per backtest v2 validated config:
 *   - LONG L1 blocked if current_price < sma_20 × 0.95 (strong downtrend)
 *   - For hedge mode (long+short), if LONG fails, both legs are skipped for that symbol
 *
 * If sma_filter_enabled is false in layer_config, all symbols pass through.
 */
async function applySmaFilter(
  supabase: ReturnType<typeof createClient>,
  portfolioId: string,
  candidateSymbols: Array<{ symbol: string; allocation_pct: number | string; leverage: number }>
): Promise<SmaFilterResult> {
  // Check if filter is enabled for this portfolio
  const { data: cfg } = await supabase
    .from('apex_ai_layer_config')
    .select('sma_filter_enabled')
    .eq('portfolio_id', portfolioId)
    .maybeSingle();

  if (!cfg?.sma_filter_enabled) {
    return { symbols: candidateSymbols, skippedCount: 0, rejections: [] };
  }

  // Pull fresh prices + sma_20 for each symbol
  const symbolNames = candidateSymbols.map((s) => s.symbol);
  const [pricesResult, regimes] = await Promise.all([
    fetchBybitTickers(symbolNames),
    loadRegimeStates(supabase, symbolNames),
  ]);
  const { prices } = pricesResult;

  const survivors: typeof candidateSymbols = [];
  const rejections: SmaFilterResult['rejections'] = [];

  for (const s of candidateSymbols) {
    const price = prices[s.symbol];
    const regime = regimes[s.symbol];
    const sma20 = regime?.atr_14 != null ? null : null; // placeholder
    // Try to read sma_20 from a fresh query (loadRegimeStates only fetched limited cols)
    const { data: fullRegime } = await supabase
      .from('apex_ai_regime_state')
      .select('sma_20, trend_regime')
      .eq('symbol', s.symbol)
      .maybeSingle();

    const sma = fullRegime?.sma_20 ? Number(fullRegime.sma_20) : null;

    if (!price || !sma) {
      // No data → admit (better to operate than miss opportunity)
      survivors.push(s);
      continue;
    }

    // SMA filter: block if price < sma × 0.95 (5% below SMA-20 = strong downtrend)
    const threshold = sma * 0.95;
    if (price < threshold) {
      rejections.push({
        symbol: s.symbol,
        reason: `price ${price.toFixed(2)} < SMA20×0.95 (${threshold.toFixed(2)}) — downtrend filter`,
        current_price: price,
        sma_20: sma,
      });
      continue;
    }

    survivors.push(s);
  }

  return {
    symbols: survivors,
    skippedCount: rejections.length,
    rejections,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Martingale group helpers
// ═══════════════════════════════════════════════════════════════════

interface PositionExtended extends ApexAiPosition {
  layer_index?: number;
  parent_position_group?: string | null;
  atr_at_entry?: number | string | null;
}

interface MartingaleGroup {
  key: string; // "SYMBOL-SIDE-PARENTGROUP"
  symbol: string;
  side: 'long' | 'short';
  parent_position_group: string | null;
  layers: PositionExtended[];
}

function groupPositionsByMartingaleKey(
  positions: ApexAiPosition[]
): Map<string, MartingaleGroup> {
  const groups = new Map<string, MartingaleGroup>();
  for (const p of positions) {
    const ext = p as PositionExtended;
    // If no parent_position_group (legacy v1 position), treat as its own group
    const groupId = ext.parent_position_group ?? p.id;
    const key = `${p.symbol}-${p.side}-${groupId}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        symbol: p.symbol,
        side: p.side,
        parent_position_group: ext.parent_position_group ?? null,
        layers: [],
      });
    }
    groups.get(key)!.layers.push(ext);
  }
  return groups;
}

interface LayerConfig {
  max_layers: number;
  layer_spacing_atr: number;
  take_profit_pct: number;
  max_allocation_pct: number;
}

async function loadLayerConfig(
  supabase: ReturnType<typeof createClient>,
  portfolioId: string
): Promise<LayerConfig | null> {
  try {
    const { data } = await supabase
      .from('apex_ai_layer_config')
      .select('max_layers, layer_spacing_atr, take_profit_pct, max_allocation_pct')
      .eq('portfolio_id', portfolioId)
      .maybeSingle();
    if (!data) return null;
    return {
      max_layers: Number(data.max_layers),
      layer_spacing_atr: Number(data.layer_spacing_atr),
      take_profit_pct: Number(data.take_profit_pct),
      max_allocation_pct: Number(data.max_allocation_pct),
    };
  } catch (err) {
    console.warn('[apex-ai-bot-tick] loadLayerConfig failed', err);
    return null;
  }
}

async function loadRegimeStates(
  supabase: ReturnType<typeof createClient>,
  symbols: string[]
): Promise<Record<string, { atr_14: number | null; atr_pct: number | null; trend_regime: string; volatility_regime: string }>> {
  if (symbols.length === 0) return {};
  try {
    const { data } = await supabase
      .from('apex_ai_regime_state')
      .select('symbol, atr_14, atr_pct, trend_regime, volatility_regime')
      .in('symbol', symbols);

    const map: Record<string, { atr_14: number | null; atr_pct: number | null; trend_regime: string; volatility_regime: string }> = {};
    for (const row of data ?? []) {
      map[row.symbol] = {
        atr_14: row.atr_14 !== null ? Number(row.atr_14) : null,
        atr_pct: row.atr_pct !== null ? Number(row.atr_pct) : null,
        trend_regime: row.trend_regime,
        volatility_regime: row.volatility_regime,
      };
    }
    return map;
  } catch (err) {
    console.warn('[apex-ai-bot-tick] loadRegimeStates failed', err);
    return {};
  }
}

// ═══════════════════════════════════════════════════════════════════
// LIVE mode helpers — real Bybit order execution
// ═══════════════════════════════════════════════════════════════════

interface BybitCreds {
  apiKey: string;
  apiSecret: string;
  testnet: boolean;
}

async function loadBybitCredentials(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<BybitCreds | null> {
  try {
    const { data, error } = await supabase
      .from('bybit_credentials')
      .select('api_key, api_secret_encrypted, testnet')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data?.api_key || !data?.api_secret_encrypted) return null;

    const encryptionKey = Deno.env.get('ENCRYPTION_KEY');
    if (!encryptionKey) {
      console.error('[apex-ai-bot-tick] ENCRYPTION_KEY not configured');
      return null;
    }

    const apiSecret = await aesDecryptAsync(data.api_secret_encrypted, encryptionKey);
    return {
      apiKey: data.api_key,
      apiSecret,
      testnet: data.testnet ?? false,
    };
  } catch (err) {
    console.error('[apex-ai-bot-tick] credential decrypt error', err);
    return null;
  }
}

/**
 * Bootstrap with REAL Bybit orders. For each active symbol:
 *   - Ensure leverage set
 *   - Open LONG + SHORT legs via market order (hedge mode)
 *   - Record the real position in DB with exchange_position_id = order_id
 *
 * Uses the linear perp category on Bybit v5.
 */
async function bootstrapLiveHedgePositions(
  supabase: ReturnType<typeof createClient>,
  portfolio: {
    id: string;
    user_id: string;
    capital_usdt: number | string;
    max_leverage: number;
  },
  symbols: Array<{
    symbol: string;
    allocation_pct: number | string;
    leverage: number;
  }>,
  creds: BybitCreds
): Promise<number> {
  let opened = 0;
  const now = new Date().toISOString();

  // Fetch prices from Bybit (since we have creds, we can use auth endpoint)
  const uniqueSymbols = Array.from(new Set(symbols.map((s) => s.symbol)));
  const { prices } = await fetchBybitTickers(uniqueSymbols);

  for (const s of symbols) {
    const price = prices[s.symbol];
    if (!price) {
      // Visible in apex_ai_bot_logs so price-fetch failures stop being a
      // silent dead-end during LIVE bootstrap.
      await logEvent(supabase, portfolio.id, 'error', 'live_bootstrap_no_price', {
        symbol: s.symbol,
        all_sources_failed: true,
      });
      continue;
    }

    const leverage = Math.min(s.leverage, portfolio.max_leverage);
    const allocated = (Number(portfolio.capital_usdt) * Number(s.allocation_pct)) / 100;
    const perSide = allocated / 2;
    const qty = roundQty((perSide * leverage) / price, s.symbol);

    if (qty <= 0) {
      await logEvent(supabase, portfolio.id, 'warning', 'live_bootstrap_qty_zero', {
        symbol: s.symbol, price, perSide, leverage,
      });
      continue;
    }

    // Set leverage (idempotent)
    try {
      await setLeverage(creds.apiKey, creds.apiSecret, creds.testnet, s.symbol, leverage);
    } catch (err) {
      await logEvent(supabase, portfolio.id, 'warning', 'live_set_leverage_failed', {
        symbol: s.symbol, leverage, error: (err as Error).message,
      });
    }

    // LONG leg
    try {
      const longOrder = await placeFuturesOrder(creds.apiKey, creds.apiSecret, creds.testnet, {
        symbol: s.symbol,
        side: 'long',
        qty,
        leverage,
        stopLossPrice: price * 0.975,
        takeProfitPrice: price * 1.04,
        positionIdx: 1, // hedge mode: buy
      });
      await supabase.from('apex_ai_positions').insert({
        portfolio_id: portfolio.id,
        user_id: portfolio.user_id,
        symbol: s.symbol,
        side: 'long',
        entry_price: price,
        current_price: price,
        size: qty,
        leverage,
        unrealized_pnl: 0,
        realized_pnl: 0,
        stop_loss_price: price * 0.975,
        take_profit_price: price * 1.04,
        status: 'open',
        exchange_position_id: longOrder.orderId, // real Bybit order id
        opened_at: now,
      });
      opened++;
    } catch (err) {
      console.error('[apex-ai-bot-tick] LONG order failed', s.symbol, err);
      await logEvent(supabase, portfolio.id, 'error', 'live_order_failed', {
        symbol: s.symbol,
        side: 'long',
        error: (err as Error).message,
      });
    }

    // SHORT leg
    try {
      const shortOrder = await placeFuturesOrder(creds.apiKey, creds.apiSecret, creds.testnet, {
        symbol: s.symbol,
        side: 'short',
        qty,
        leverage,
        stopLossPrice: price * 1.025,
        takeProfitPrice: price * 0.96,
        positionIdx: 2, // hedge mode: sell
      });
      await supabase.from('apex_ai_positions').insert({
        portfolio_id: portfolio.id,
        user_id: portfolio.user_id,
        symbol: s.symbol,
        side: 'short',
        entry_price: price,
        current_price: price,
        size: qty,
        leverage,
        unrealized_pnl: 0,
        realized_pnl: 0,
        stop_loss_price: price * 1.025,
        take_profit_price: price * 0.96,
        status: 'open',
        exchange_position_id: shortOrder.orderId,
        opened_at: now,
      });
      opened++;
    } catch (err) {
      console.error('[apex-ai-bot-tick] SHORT order failed', s.symbol, err);
      await logEvent(supabase, portfolio.id, 'error', 'live_order_failed', {
        symbol: s.symbol,
        side: 'short',
        error: (err as Error).message,
      });
    }
  }

  return opened;
}

/**
 * Reconcile DB positions with real Bybit positions.
 * - If a DB position has exchange_position_id (not sim-*) but Bybit doesn't
 *   have the corresponding (symbol, side) open → mark DB as closed (external)
 * - Log events for any mismatches so user sees them in the timeline
 */
async function reconcileLivePositions(
  supabase: ReturnType<typeof createClient>,
  portfolioId: string,
  dbPositions: ApexAiPosition[],
  livePositions: Awaited<ReturnType<typeof fetchOpenFutures>>
): Promise<void> {
  const liveKeys = new Set(livePositions.map((p) => `${p.symbol}-${p.side}`));

  for (const dbPos of dbPositions) {
    const isSim = (dbPos.exchange_position_id ?? '').startsWith('sim-');
    if (isSim) continue; // skip simulated

    const key = `${dbPos.symbol}-${dbPos.side}`;
    if (!liveKeys.has(key)) {
      // Position not on Bybit anymore → closed externally
      const exitPrice = Number(dbPos.current_price ?? dbPos.entry_price);
      const entryPrice = Number(dbPos.entry_price);
      const size = Number(dbPos.size);
      const pnl =
        dbPos.side === 'long'
          ? (exitPrice - entryPrice) * size
          : (entryPrice - exitPrice) * size;

      const now = new Date().toISOString();

      // Create trade record
      await supabase.from('apex_ai_trades').insert({
        portfolio_id: dbPos.portfolio_id,
        position_id: dbPos.id,
        user_id: dbPos.user_id,
        symbol: dbPos.symbol,
        side: dbPos.side,
        entry_price: entryPrice,
        exit_price: exitPrice,
        size,
        leverage: dbPos.leverage,
        pnl,
        fee_exchange: Math.abs(pnl) * 0.0006,
        gas_fee: 0, // no fee on externally-closed (not bot's decision)
        closed_at: now,
      });

      // Mark position closed
      await supabase
        .from('apex_ai_positions')
        .update({
          status: 'closed',
          closed_at: now,
          realized_pnl: pnl,
          last_bybit_sync_at: now,
        })
        .eq('id', dbPos.id);

      // Log event
      await supabase.from('apex_ai_strategy_events').insert({
        portfolio_id: portfolioId,
        event_type: 'live_position_closed_externally',
        symbol: dbPos.symbol,
        rationale: `Position ${dbPos.symbol} ${dbPos.side} closed on Bybit outside the bot (user action or SL). Reconciled + trade recorded. PnL ${pnl.toFixed(2)} USDT.`,
        payload_json: {
          position_id: dbPos.id,
          exit_price: exitPrice,
          entry_price: entryPrice,
          pnl,
          bybit_order_id: dbPos.exchange_position_id,
        },
      });
    }
  }
}

/**
 * Check if user has enough margin buffer before opening a new order.
 * Returns { ok: true } if total_available >= required + safety_buffer_pct.
 * Safety buffer: keep at least 20% of account as free margin.
 */
async function checkMarginBuffer(
  creds: BybitCreds,
  requiredUsdt: number,
  leverage: number,
  safetyBufferPct = 20
): Promise<{ ok: boolean; reason?: string; balance?: number; required?: number }> {
  try {
    const balance = await fetchApexAiBalance(creds.apiKey, creds.apiSecret, creds.testnet);
    const marginNeeded = requiredUsdt / leverage;
    const totalEquity = balance.totalEquityUsdt;
    const available = balance.totalAvailableBalanceUsdt;
    const bufferRequired = totalEquity * (safetyBufferPct / 100);
    const bufferAfterOrder = available - marginNeeded;

    if (marginNeeded > available) {
      return {
        ok: false,
        reason: 'insufficient_margin',
        balance: available,
        required: marginNeeded,
      };
    }
    if (bufferAfterOrder < bufferRequired) {
      return {
        ok: false,
        reason: 'would_breach_safety_buffer',
        balance: available,
        required: marginNeeded,
      };
    }
    return { ok: true, balance: available, required: marginNeeded };
  } catch (err) {
    console.error('[apex-ai-bot-tick] margin check failed', err);
    // If we can't check, be conservative and block
    return { ok: false, reason: 'balance_fetch_failed' };
  }
}

/**
 * Bybit lot size rounding. Simplified per-symbol rules.
 * For BTC: step = 0.001. For ETH: 0.01. For others: 1.
 * TODO: fetch instrument info from Bybit for exact rules.
 */
function roundQty(qty: number, symbol: string): number {
  const rules: Record<string, number> = {
    BTCUSDT: 0.001,
    ETHUSDT: 0.01,
    SOLUSDT: 0.1,
    BNBUSDT: 0.01,
    XRPUSDT: 1,
    AVAXUSDT: 0.1,
    LINKUSDT: 0.1,
    ARBUSDT: 1,
    DOGEUSDT: 1,
  };
  const step = rules[symbol] ?? 0.01;
  return Math.floor(qty / step) * step;
}

// ═══════════════════════════════════════════════════════════════════

async function fetchBybitTickers(
  symbols: string[]
): Promise<{ prices: Record<string, number>; errors: string[] }> {
  if (symbols.length === 0) return { prices: {}, errors: [] };

  // Per-symbol fetch in parallel. Each response is ~1KB (vs ~440KB for the
  // full list) so this is faster, cheaper and more resilient: if one symbol
  // fails, others still succeed.
  const results = await Promise.allSettled(
    symbols.map((symbol) => fetchOneTicker(symbol))
  );

  const prices: Record<string, number> = {};
  const errors: string[] = [];

  results.forEach((r, i) => {
    const symbol = symbols[i];
    if (r.status === 'fulfilled' && r.value > 0) {
      prices[symbol] = r.value;
    } else if (r.status === 'rejected') {
      errors.push(`${symbol}: ${r.reason}`);
    }
  });

  return { prices, errors };
}

async function fetchOneTicker(symbol: string): Promise<number> {
  // Cascade through 6 sources. Supabase Edge Function IPs are routinely
  // blocked by CloudFront (Bybit, Binance), so the order is permissive-first
  // among datacenter-friendly providers.
  //
  // Order: Coinbase → CoinGecko → Bybit → Binance → OKX → Kraken
  //
  // Coinbase is the most permissive datacenter-wise; CoinGecko is the
  // canonical free public price source. The remaining four are belt-and-
  // suspenders. The first one that returns price > 0 wins.
  const errors: string[] = [];

  const sources: Array<{ name: string; fn: () => Promise<number> }> = [
    { name: 'coinbase',  fn: () => fetchCoinbaseTicker(symbol) },
    { name: 'coingecko', fn: () => fetchCoingeckoTicker(symbol) },
    { name: 'bybit',     fn: () => fetchBybitTickerWithHeaders(symbol) },
    { name: 'binance',   fn: () => fetchBinanceTicker(symbol) },
    { name: 'okx',       fn: () => fetchOkxTicker(symbol) },
    { name: 'kraken',    fn: () => fetchKrakenTicker(symbol) },
  ];

  for (const src of sources) {
    try {
      const v = await src.fn();
      if (v > 0) return v;
      errors.push(`${src.name}: zero price`);
    } catch (err) {
      errors.push(`${src.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  throw new Error(errors.join(' | '));
}

/** Coinbase Pro public spot — typically datacenter-friendly. */
async function fetchCoinbaseTicker(symbol: string): Promise<number> {
  const base = symbol.replace(/USDT$/, '');
  if (!base || base === symbol) throw new Error(`unmapped symbol: ${symbol}`);
  // Use Coinbase exchange API spot — supports BTC-USD, ETH-USD, SOL-USD, etc.
  const url = `https://api.coinbase.com/v2/prices/${base}-USD/spot`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const price = Number(json?.data?.amount);
  if (!(price > 0)) throw new Error(`invalid price`);
  return price;
}

/** OKX swap ticker — permissive global. */
async function fetchOkxTicker(symbol: string): Promise<number> {
  // OKX uses BTC-USDT-SWAP for perps
  const base = symbol.replace(/USDT$/, '');
  if (!base || base === symbol) throw new Error(`unmapped symbol: ${symbol}`);
  const url = `https://www.okx.com/api/v5/market/ticker?instId=${base}-USDT-SWAP`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.code !== '0') throw new Error(`OKX ${json.code}: ${json.msg}`);
  const price = Number(json?.data?.[0]?.last);
  if (!(price > 0)) throw new Error(`invalid price`);
  return price;
}

/** Kraken public ticker — uses XBT for BTC. */
async function fetchKrakenTicker(symbol: string): Promise<number> {
  const map: Record<string, string> = {
    BTCUSDT: 'XBTUSDT',
    ETHUSDT: 'ETHUSDT',
    SOLUSDT: 'SOLUSDT',
    XRPUSDT: 'XRPUSDT',
    LINKUSDT: 'LINKUSDT',
    AVAXUSDT: 'AVAXUSDT',
    DOGEUSDT: 'XDGUSDT',
    ARBUSDT: 'ARBUSDT',
  };
  const pair = map[symbol];
  if (!pair) throw new Error(`unmapped symbol: ${symbol}`);
  const url = `https://api.kraken.com/0/public/Ticker?pair=${pair}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const errs = json?.error;
  if (Array.isArray(errs) && errs.length > 0) throw new Error(`Kraken: ${errs.join(',')}`);
  const result = json?.result;
  const firstKey = result ? Object.keys(result)[0] : null;
  const price = firstKey ? Number(result[firstKey]?.c?.[0]) : NaN;
  if (!(price > 0)) throw new Error(`invalid price`);
  return price;
}

async function fetchBybitTickerWithHeaders(symbol: string): Promise<number> {
  const url = `${BYBIT_PUBLIC_BASE}/v5/market/tickers?category=linear&symbol=${symbol}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.retCode !== 0) throw new Error(`Bybit ${json.retCode}: ${json.retMsg}`);
  const ticker: BybitTicker | undefined = json.result?.list?.[0];
  if (!ticker) throw new Error('no ticker in response');
  const price = Number(ticker.markPrice) || Number(ticker.lastPrice);
  if (!(price > 0)) throw new Error(`invalid price: ${ticker.markPrice}`);
  return price;
}

/**
 * Fallback 1: Binance public futures ticker endpoint.
 * Historically permissive to datacenter IPs but has been tightening.
 * Note: Bybit and Binance symbol names are identical for major pairs.
 */
async function fetchBinanceTicker(symbol: string): Promise<number> {
  const url = `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const price = Number(json.price);
  if (!(price > 0)) throw new Error(`invalid price: ${json.price}`);
  return price;
}

/**
 * Fallback 2: CoinGecko public /simple/price endpoint.
 * Accepts all traffic (datacenter OK), rate-limited but sufficient for our
 * once-per-minute per-portfolio needs. Returns spot price, not perp — close
 * enough for simulation (drift < 0.1% on major pairs in normal conditions).
 *
 * Symbol mapping: we strip the "USDT" suffix and look up the CoinGecko ID.
 */
const COINGECKO_IDS: Record<string, string> = {
  BTCUSDT: 'bitcoin',
  ETHUSDT: 'ethereum',
  SOLUSDT: 'solana',
  BNBUSDT: 'binancecoin',
  XRPUSDT: 'ripple',
  AVAXUSDT: 'avalanche-2',
  LINKUSDT: 'chainlink',
  ARBUSDT: 'arbitrum',
  DOGEUSDT: 'dogecoin',
};

async function fetchCoingeckoTicker(symbol: string): Promise<number> {
  const coinId = COINGECKO_IDS[symbol];
  if (!coinId) throw new Error(`unmapped symbol: ${symbol}`);
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const price = Number(json[coinId]?.usd);
  if (!(price > 0)) throw new Error(`invalid price: ${json[coinId]}`);
  return price;
}

async function bootstrapHedgePositions(
  supabase: ReturnType<typeof createClient>,
  portfolio: {
    id: string;
    user_id: string;
    capital_usdt: number | string;
  },
  symbols: Array<{
    symbol: string;
    allocation_pct: number | string;
    leverage: number;
  }>
): Promise<number> {
  const uniqueSymbols = Array.from(new Set(symbols.map((s) => s.symbol)));
  const { prices } = await fetchBybitTickers(uniqueSymbols);

  const rows: Array<Record<string, unknown>> = [];
  const now = new Date().toISOString();

  for (const s of symbols) {
    const price = prices[s.symbol];
    if (!price) continue;

    const allocated = (Number(portfolio.capital_usdt) * Number(s.allocation_pct)) / 100;
    const perSide = allocated / 2;
    const size = (perSide * s.leverage) / price;

    rows.push({
      portfolio_id: portfolio.id,
      user_id: portfolio.user_id,
      symbol: s.symbol,
      side: 'long',
      entry_price: price,
      current_price: price,
      size,
      leverage: s.leverage,
      unrealized_pnl: 0,
      realized_pnl: 0,
      stop_loss_price: price * 0.975,
      take_profit_price: price * 1.04,
      status: 'open',
      exchange_position_id: `sim-${crypto.randomUUID()}`,
      opened_at: now,
    });

    rows.push({
      portfolio_id: portfolio.id,
      user_id: portfolio.user_id,
      symbol: s.symbol,
      side: 'short',
      entry_price: price,
      current_price: price,
      size,
      leverage: s.leverage,
      unrealized_pnl: 0,
      realized_pnl: 0,
      stop_loss_price: price * 1.025,
      take_profit_price: price * 0.96,
      status: 'open',
      exchange_position_id: `sim-${crypto.randomUUID()}`,
      opened_at: now,
    });
  }

  if (rows.length === 0) return 0;

  const { data } = await supabase
    .from('apex_ai_positions')
    .insert(rows)
    .select('id');

  return data?.length ?? 0;
}

async function closePositionAndRecord(
  supabase: ReturnType<typeof createClient>,
  position: ApexAiPosition,
  exitPrice: number,
  trigger: 'take_profit'
): Promise<{ pnl: number } | null> {
  const entryPrice = Number(position.entry_price);
  const size = Number(position.size);
  const pnl =
    position.side === 'long'
      ? (exitPrice - entryPrice) * size
      : (entryPrice - exitPrice) * size;
  const feeExchange = Math.abs(pnl) * 0.0006;
  const now = new Date().toISOString();

  // Idempotency: only close if still open
  const { data: closedRows, error: closeErr } = await supabase
    .from('apex_ai_positions')
    .update({
      status: 'closed',
      closed_at: now,
      current_price: exitPrice,
      unrealized_pnl: 0,
      realized_pnl: pnl,
    })
    .eq('id', position.id)
    .eq('status', 'open')
    .select('id');

  if (closeErr || !closedRows || closedRows.length === 0) {
    // Already closed (race condition with client-side ticker — not an error)
    return null;
  }

  const { data: trade, error: tradeErr } = await supabase
    .from('apex_ai_trades')
    .insert({
      portfolio_id: position.portfolio_id,
      position_id: position.id,
      user_id: position.user_id,
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

  if (tradeErr || !trade) return { pnl };

  // Atomic fee charge via RPC
  if (pnl > 0) {
    try {
      await supabase.rpc('apex_ai_charge_gas_fee', {
        p_trade_id: trade.id,
        p_portfolio_id: position.portfolio_id,
        p_user_id: position.user_id,
        p_pnl: pnl,
        p_fee_rate_pct: FEE_RATE_PCT,
      });
    } catch (err) {
      console.warn('[apex-ai-bot-tick] charge_gas_fee failed', err);
    }
  }

  // Update portfolio running stats
  const { data: portfolioFresh } = await supabase
    .from('apex_ai_portfolios')
    .select('total_pnl, win_count, loss_count, drawdown_high_water_mark, capital_usdt')
    .eq('id', position.portfolio_id)
    .single();

  if (portfolioFresh) {
    const newTotal = Number(portfolioFresh.total_pnl) + pnl;
    const newEquity = Number(portfolioFresh.capital_usdt) + newTotal;
    const currentHwm = Number(
      portfolioFresh.drawdown_high_water_mark ?? portfolioFresh.capital_usdt
    );
    const newHwm = Math.max(currentHwm, newEquity);

    await supabase
      .from('apex_ai_portfolios')
      .update({
        total_pnl: newTotal,
        win_count: Number(portfolioFresh.win_count) + (pnl > 0 ? 1 : 0),
        loss_count: Number(portfolioFresh.loss_count) + (pnl <= 0 ? 1 : 0),
        drawdown_high_water_mark: newHwm,
      })
      .eq('id', position.portfolio_id);
  }

  return { pnl };
}

async function reopenHedgeLeg(
  supabase: ReturnType<typeof createClient>,
  portfolio: { id: string; user_id: string; capital_usdt: number | string },
  justClosed: ApexAiPosition,
  currentPrice: number,
  symbolConfig: { allocation_pct: number | string; leverage: number }
): Promise<void> {
  const allocated = (Number(portfolio.capital_usdt) * Number(symbolConfig.allocation_pct)) / 100;
  const perSide = allocated / 2;
  const size = (perSide * symbolConfig.leverage) / currentPrice;

  const isLong = justClosed.side === 'long';
  const stopLossPrice = isLong ? currentPrice * 0.98 : currentPrice * 1.02;
  const takeProfitPrice = isLong ? currentPrice * 1.03 : currentPrice * 0.97;

  await supabase.from('apex_ai_positions').insert({
    portfolio_id: portfolio.id,
    user_id: portfolio.user_id,
    symbol: justClosed.symbol,
    side: justClosed.side,
    entry_price: currentPrice,
    current_price: currentPrice,
    size,
    leverage: symbolConfig.leverage,
    unrealized_pnl: 0,
    realized_pnl: 0,
    stop_loss_price: stopLossPrice,
    take_profit_price: takeProfitPrice,
    status: 'open',
    exchange_position_id: `sim-${crypto.randomUUID()}`,
    opened_at: new Date().toISOString(),
  });
}

// ═══════════════════════════════════════════════════════════════════
// Apex AI v3.2 — Smart Hedge Cycling
// ═══════════════════════════════════════════════════════════════════

interface SmartHedgeCyclingArgs {
  supabase: ReturnType<typeof createClient>;
  portfolio: {
    id: string;
    user_id: string;
    capital_usdt: number | string;
    status: string;
  };
  positions: ApexAiPosition[];
  prices: Record<string, number>;
  isLiveMode: boolean;
}

interface HedgeAction {
  type: string;
  symbol: string;
  side?: string;
  trigger?: string;
  pnl_long?: number;
  pnl_short?: number;
  net_pnl?: number;
  cycle?: 'closed' | 'reopened';
}

/**
 * Smart Hedge Cycling — Apice "Never Close at Loss" engine.
 *
 * CEO directive 2026-04-29: the strategy is to NEVER take a loss. When
 * one leg of a hedge moves against entry, the bot ADDS a Martingale
 * layer to that side instead of stopping it out. Only when the AGGREGATE
 * pnl turns positive (after layering and a market reversal) does the
 * group close — at a small but reliable profit.
 *
 * Triggers per group (long+short for each symbol):
 *   - close_group_in_profit:
 *       aggregate_pnl > 0 AND any leg hit its take_profit_price
 *       → close ALL layers + create trades + reopen fresh hedge
 *   - add_martingale_layer:
 *       drawdown of the losing side ≥ next_threshold
 *       AND total layers < max_layers
 *       AND has_capital_for_next_layer
 *       → open another layer on the losing side, sized 1.5× last
 *
 * Stop-loss prices on positions are IGNORED. Per validated config, the
 * portfolio-level drawdown_tolerance_pct (30% default) is the only kill
 * switch — handled elsewhere in the tick (catastrophic pre-check).
 */
async function runSmartHedgeCycling(
  args: SmartHedgeCyclingArgs
): Promise<HedgeAction[]> {
  const { supabase, portfolio, positions, prices, isLiveMode } = args;
  const actions: HedgeAction[] = [];

  // Only act on SIM positions; LIVE legs are reconciled from Bybit.
  const simPositions = positions.filter(
    (p) => (p.exchange_position_id ?? '').startsWith('sim-') && p.status === 'open'
  );
  if (simPositions.length === 0) return actions;

  // Layer config — fallback to validated defaults if missing
  const { data: layerCfg } = await supabase
    .from('apex_ai_layer_config')
    .select('max_layers, layer_spacing_atr, take_profit_pct, layer_size_multiplier')
    .eq('portfolio_id', portfolio.id)
    .maybeSingle();
  const MAX_LAYERS = Number(layerCfg?.max_layers ?? 8);
  const TP_PCT = Number(layerCfg?.take_profit_pct ?? 1.2);
  const LAYER_SIZE_MULT = Number(layerCfg?.layer_size_multiplier ?? 1.5);
  // Without ATR data we use a fixed % spacing that scales per layer.
  // 1.5% per layer is conservative; matches validated config sideways regime.
  const FIXED_LAYER_SPACING_PCT = 1.5;

  // Group all sim positions by (symbol, side) — collects layers
  const groups = new Map<string, ApexAiPosition[]>();
  for (const pos of simPositions) {
    const k = `${pos.symbol}|${pos.side}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(pos);
  }

  // Pair groups by symbol so we can compute net hedge state
  const symbols = new Set<string>(simPositions.map((p) => p.symbol));

  for (const symbol of symbols) {
    const currentPrice = prices[symbol];
    if (!currentPrice) continue;

    const longLayers = (groups.get(`${symbol}|long`) ?? []).sort(
      (a, b) => new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime()
    );
    const shortLayers = (groups.get(`${symbol}|short`) ?? []).sort(
      (a, b) => new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime()
    );

    if (longLayers.length === 0 && shortLayers.length === 0) continue;

    const pnlLong = longLayers.reduce(
      (s, l) => s + (currentPrice - Number(l.entry_price)) * Number(l.size),
      0
    );
    const pnlShort = shortLayers.reduce(
      (s, l) => s + (Number(l.entry_price) - currentPrice) * Number(l.size),
      0
    );
    const aggregatePnl = pnlLong + pnlShort;

    // Blended-average exits per side
    const blendedLong = blendedAvg(longLayers);
    const blendedShort = blendedAvg(shortLayers);

    // ────────────────────────────────────────────────────────────────
    // 1. CLOSE GROUP IN PROFIT
    //    Trigger: aggregate > 0 AND any leg crossed TP threshold from
    //    its blended average. Close ALL legs of both sides + reopen.
    // ────────────────────────────────────────────────────────────────
    const longTpHit =
      longLayers.length > 0 &&
      blendedLong != null &&
      currentPrice >= blendedLong * (1 + TP_PCT / 100);
    const shortTpHit =
      shortLayers.length > 0 &&
      blendedShort != null &&
      currentPrice <= blendedShort * (1 - TP_PCT / 100);

    if (aggregatePnl > 0 && (longTpHit || shortTpHit)) {
      const trigger = 'take_profit';
      const triggerSide: 'long' | 'short' = longTpHit ? 'long' : 'short';

      const closeResults: Array<{ side: string; pnl: number }> = [];
      const legsToClose = [...longLayers, ...shortLayers];

      for (const leg of legsToClose) {
        const entry = Number(leg.entry_price);
        const size = Number(leg.size);
        const pnl =
          leg.side === 'long'
            ? (currentPrice - entry) * size
            : (entry - currentPrice) * size;
        const feeExchange = Math.abs(pnl) * 0.0006;
        const gasFee = pnl > 0 ? pnl * 0.10 : 0;
        const now = new Date().toISOString();

        const { error: updErr } = await supabase
          .from('apex_ai_positions')
          .update({
            status: 'closed',
            closed_at: now,
            current_price: currentPrice,
            unrealized_pnl: 0,
            realized_pnl: pnl,
          })
          .eq('id', leg.id)
          .eq('status', 'open');

        if (updErr) {
          console.error('[smart-hedge] close failed', leg.id, updErr);
          continue;
        }

        await supabase.from('apex_ai_trades').insert({
          portfolio_id: portfolio.id,
          position_id: leg.id,
          user_id: portfolio.user_id,
          symbol: leg.symbol,
          side: leg.side,
          entry_price: entry,
          exit_price: currentPrice,
          size,
          leverage: leg.leverage,
          pnl,
          fee_exchange: feeExchange,
          gas_fee: gasFee,
          closed_at: now,
        });

        closeResults.push({ side: leg.side, pnl });
      }

      if (closeResults.length === 0) continue;
      const closedLongPnl = closeResults
        .filter((r) => r.side === 'long')
        .reduce((s, r) => s + r.pnl, 0);
      const closedShortPnl = closeResults
        .filter((r) => r.side === 'short')
        .reduce((s, r) => s + r.pnl, 0);
      const netPnl = aggregatePnl;

      // Apply portfolio aggregate stats atomically
      await supabase.rpc('apex_ai_apply_cycle_pnl', {
        p_portfolio_id: portfolio.id,
        p_pnl_delta: netPnl,
      }).catch(async () => {
        const { data: cur } = await supabase
          .from('apex_ai_portfolios')
          .select('total_pnl, win_count, loss_count')
          .eq('id', portfolio.id)
          .single();
        if (!cur) return;
        await supabase
          .from('apex_ai_portfolios')
          .update({
            total_pnl: Number(cur.total_pnl ?? 0) + netPnl,
            win_count: Number(cur.win_count ?? 0) + (netPnl > 0 ? 1 : 0),
            loss_count: Number(cur.loss_count ?? 0) + (netPnl < 0 ? 1 : 0),
          })
          .eq('id', portfolio.id);
      });

      await logEvent(supabase, portfolio.id, 'info', 'hedge_cycle_completed', {
        symbol,
        trigger,
        trigger_side: triggerSide,
        pnl_long: closedLongPnl,
        pnl_short: closedShortPnl,
        net_pnl: netPnl,
        exit_price: currentPrice,
        legs_closed: closeResults.length,
      });

      actions.push({
        type: 'hedge_cycle_completed',
        symbol,
        trigger,
        side: triggerSide,
        pnl_long: closedLongPnl,
        pnl_short: closedShortPnl,
        net_pnl: netPnl,
        cycle: 'closed',
      });

      // Re-open fresh hedge (without SL — never close at loss)
      if (portfolio.status !== 'active' || isLiveMode) continue;

      const template = longLayers[0] ?? shortLayers[0];
      if (!template) continue;
      const leverage = template.leverage;
      const baseSize = Number(template.size);
      const now = new Date().toISOString();

      const newRows = [
        {
          portfolio_id: portfolio.id,
          user_id: portfolio.user_id,
          symbol,
          side: 'long' as const,
          entry_price: currentPrice,
          current_price: currentPrice,
          size: baseSize,
          leverage,
          unrealized_pnl: 0,
          realized_pnl: 0,
          stop_loss_price: null, // never close at loss
          take_profit_price: currentPrice * (1 + TP_PCT / 100),
          status: 'open' as const,
          exchange_position_id: `sim-${crypto.randomUUID()}`,
          opened_at: now,
        },
        {
          portfolio_id: portfolio.id,
          user_id: portfolio.user_id,
          symbol,
          side: 'short' as const,
          entry_price: currentPrice,
          current_price: currentPrice,
          size: baseSize,
          leverage,
          unrealized_pnl: 0,
          realized_pnl: 0,
          stop_loss_price: null, // never close at loss
          take_profit_price: currentPrice * (1 - TP_PCT / 100),
          status: 'open' as const,
          exchange_position_id: `sim-${crypto.randomUUID()}`,
          opened_at: now,
        },
      ];

      const { error: insErr } = await supabase.from('apex_ai_positions').insert(newRows);
      if (insErr) {
        await logEvent(supabase, portfolio.id, 'error', 'hedge_reopen_failed', {
          symbol,
          error: insErr.message,
        });
      } else {
        actions.push({ type: 'hedge_reopened', symbol, cycle: 'reopened' });
      }

      continue; // group closed + reopened, move to next symbol
    }

    // ────────────────────────────────────────────────────────────────
    // 2. ADD MARTINGALE LAYER on the losing side (never-close-at-loss)
    //    Trigger: drawdown of losing side ≥ next_threshold.
    //    next_threshold = FIXED_LAYER_SPACING_PCT × layer_count.
    //    E.g. with 1 layer at 1.5%, second layer waits for 1.5% drop;
    //    with 2 layers, third waits for 3.0%; etc.
    // ────────────────────────────────────────────────────────────────
    const longCount = longLayers.length;
    const shortCount = shortLayers.length;

    // Long is in drawdown if price < blendedLong
    if (longCount > 0 && longCount < MAX_LAYERS && blendedLong != null && currentPrice < blendedLong) {
      const drawdownPct = ((blendedLong - currentPrice) / blendedLong) * 100;
      const threshold = FIXED_LAYER_SPACING_PCT * longCount;
      if (drawdownPct >= threshold) {
        const lastLayer = longLayers[longLayers.length - 1];
        const newSize = Number(lastLayer.size) * LAYER_SIZE_MULT;
        const now = new Date().toISOString();
        const { error: addErr } = await supabase.from('apex_ai_positions').insert({
          portfolio_id: portfolio.id,
          user_id: portfolio.user_id,
          symbol,
          side: 'long',
          entry_price: currentPrice,
          current_price: currentPrice,
          size: newSize,
          leverage: lastLayer.leverage,
          unrealized_pnl: 0,
          realized_pnl: 0,
          stop_loss_price: null,
          take_profit_price: null, // managed at group level via blendedAvg
          status: 'open',
          exchange_position_id: `sim-${crypto.randomUUID()}`,
          opened_at: now,
        });
        if (!addErr) {
          await logEvent(supabase, portfolio.id, 'info', 'martingale_layer_added', {
            symbol,
            side: 'long',
            layer_count: longCount + 1,
            drawdown_pct: drawdownPct,
            threshold_pct: threshold,
            entry_price: currentPrice,
            size: newSize,
          });
          actions.push({
            type: 'martingale_layer_added',
            symbol,
            side: 'long',
            cycle: 'reopened',
          });
        }
      }
    }

    // Short is in drawdown if price > blendedShort
    if (shortCount > 0 && shortCount < MAX_LAYERS && blendedShort != null && currentPrice > blendedShort) {
      const drawdownPct = ((currentPrice - blendedShort) / blendedShort) * 100;
      const threshold = FIXED_LAYER_SPACING_PCT * shortCount;
      if (drawdownPct >= threshold) {
        const lastLayer = shortLayers[shortLayers.length - 1];
        const newSize = Number(lastLayer.size) * LAYER_SIZE_MULT;
        const now = new Date().toISOString();
        const { error: addErr } = await supabase.from('apex_ai_positions').insert({
          portfolio_id: portfolio.id,
          user_id: portfolio.user_id,
          symbol,
          side: 'short',
          entry_price: currentPrice,
          current_price: currentPrice,
          size: newSize,
          leverage: lastLayer.leverage,
          unrealized_pnl: 0,
          realized_pnl: 0,
          stop_loss_price: null,
          take_profit_price: null,
          status: 'open',
          exchange_position_id: `sim-${crypto.randomUUID()}`,
          opened_at: now,
        });
        if (!addErr) {
          await logEvent(supabase, portfolio.id, 'info', 'martingale_layer_added', {
            symbol,
            side: 'short',
            layer_count: shortCount + 1,
            drawdown_pct: drawdownPct,
            threshold_pct: threshold,
            entry_price: currentPrice,
            size: newSize,
          });
          actions.push({
            type: 'martingale_layer_added',
            symbol,
            side: 'short',
            cycle: 'reopened',
          });
        }
      }
    }
  }

  return actions;
}

function blendedAvg(layers: ApexAiPosition[]): number | null {
  if (layers.length === 0) return null;
  let totalSize = 0;
  let weightedEntry = 0;
  for (const l of layers) {
    const size = Number(l.size);
    const entry = Number(l.entry_price);
    totalSize += size;
    weightedEntry += entry * size;
  }
  return totalSize > 0 ? weightedEntry / totalSize : null;
}

async function logEvent(
  supabase: ReturnType<typeof createClient>,
  portfolioId: string,
  level: 'info' | 'warning' | 'error' | 'critical',
  event: string,
  payload: Record<string, unknown> | null
): Promise<void> {
  try {
    await supabase.from('apex_ai_bot_logs').insert({
      portfolio_id: portfolioId,
      level,
      event,
      payload_json: payload,
    });
  } catch (err) {
    console.error('[apex-ai-bot-tick] log error', err);
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
