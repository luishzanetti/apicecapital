import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Target, Layers, ArrowDownUp } from 'lucide-react';
import { useApexAiPositions } from '@/hooks/useApexAiData';
import { cn } from '@/lib/utils';
import type { ApexAiPosition } from '@/types/apexAi';

/**
 * Apex AI — Hedge Board
 *
 * Live visualization of every hedge pair currently open for the portfolio.
 * Highlights:
 *   - Symbol + side counters
 *   - Aggregate PnL (long + short = net hedge state)
 *   - Distance-to-trigger for each leg (% to TP / % to SL)
 *   - Layer count when Martingale stacking is active
 *
 * Inspired by professional desk terminals — dense but legible. Updates
 * automatically as the cron tick refreshes positions.
 */

interface ApexAiHedgeBoardProps {
  portfolioId: string | null | undefined;
}

interface HedgePair {
  symbol: string;
  long?: ApexAiPosition;
  short?: ApexAiPosition;
  pnlLong: number;
  pnlShort: number;
  netPnl: number;
  layers: number;
}

function pctToTarget(side: 'long' | 'short', current: number, target: number | null): number | null {
  if (!target || !current) return null;
  if (side === 'long') return ((target - current) / current) * 100;
  return ((current - target) / current) * 100;
}

export function ApexAiHedgeBoard({ portfolioId }: ApexAiHedgeBoardProps) {
  const { data: positions = [] } = useApexAiPositions(portfolioId);

  const pairs = useMemo<HedgePair[]>(() => {
    const map = new Map<string, HedgePair>();
    for (const pos of positions) {
      if (pos.status !== 'open') continue;
      let pair = map.get(pos.symbol);
      if (!pair) {
        pair = { symbol: pos.symbol, pnlLong: 0, pnlShort: 0, netPnl: 0, layers: 0 };
        map.set(pos.symbol, pair);
      }
      const pnl = Number(pos.unrealized_pnl ?? 0);
      pair.layers += 1;
      if (pos.side === 'long') {
        pair.long = pos;
        pair.pnlLong += pnl;
      } else if (pos.side === 'short') {
        pair.short = pos;
        pair.pnlShort += pnl;
      }
      pair.netPnl = pair.pnlLong + pair.pnlShort;
    }
    return Array.from(map.values()).sort((a, b) => a.symbol.localeCompare(b.symbol));
  }, [positions]);

  if (pairs.length === 0) {
    return (
      <section
        aria-label="Hedge board empty"
        className="rounded-3xl border border-white/[0.06] bg-white/[0.015] p-5 text-center"
      >
        <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.04]">
          <Layers className="h-5 w-5 text-muted-foreground" strokeWidth={1.8} />
        </div>
        <p className="mt-3 text-sm font-semibold text-foreground">
          No active hedge yet
        </p>
        <p className="mt-1 text-[11.5px] text-muted-foreground">
          When the bot bootstraps, you&rsquo;ll see the long + short legs here with live PnL.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Hedge board"
      className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.015] p-4 md:p-5"
    >
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ArrowDownUp className="h-4 w-4 text-[hsl(var(--apice-emerald))]" strokeWidth={2} />
          <h3 className="text-sm font-bold tracking-tight text-foreground">Hedge Board</h3>
          <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Live
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {pairs.length} pair{pairs.length === 1 ? '' : 's'} · {positions.filter((p) => p.status === 'open').length} legs
        </span>
      </header>

      <ul className="space-y-2.5">
        {pairs.map((pair) => (
          <HedgeRow key={pair.symbol} pair={pair} />
        ))}
      </ul>
    </section>
  );
}

function HedgeRow({ pair }: { pair: HedgePair }) {
  const { symbol, long, short, pnlLong, pnlShort, netPnl, layers } = pair;

  const longCurrent = long ? Number(long.current_price ?? long.entry_price) : 0;
  const shortCurrent = short ? Number(short.current_price ?? short.entry_price) : 0;

  const longTpPct = long ? pctToTarget('long', longCurrent, long.take_profit_price ? Number(long.take_profit_price) : null) : null;
  const shortTpPct = short ? pctToTarget('short', shortCurrent, short.take_profit_price ? Number(short.take_profit_price) : null) : null;

  // Closest TP across both legs (informs likelihood of next cycle close).
  // No SL — Apice strategy is "never close at loss" → losing side adds layer instead.
  const closestTpPct = Math.min(
    longTpPct == null ? Infinity : Math.abs(longTpPct),
    shortTpPct == null ? Infinity : Math.abs(shortTpPct),
  );

  // Distance until next Martingale layer add (1.5% × layer count on the losing side)
  const FIXED_SPACING_PCT = 1.5;
  const longLayerCount = long ? layers / 2 : 0; // approx: split between sides
  const nextLayerThreshold = FIXED_SPACING_PCT * Math.max(1, Math.floor(layers / 2));

  return (
    <motion.li
      layout
      className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-[15px] tracking-tight">
              {symbol.replace('USDT', '')}
              <span className="text-muted-foreground/60 text-[12px] font-normal">/USDT</span>
            </span>
            {layers > 2 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                <Layers className="h-2.5 w-2.5" />
                {layers} layers
              </span>
            )}
          </div>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground tabular-nums">
            mark ${(longCurrent || shortCurrent).toFixed(2)}
          </p>
        </div>

        <div className="text-right">
          <p
            className={cn(
              'font-mono text-base font-bold tabular-nums',
              netPnl >= 0 ? 'text-[hsl(var(--apice-emerald))]' : 'text-red-400',
            )}
          >
            {netPnl >= 0 ? '+' : ''}${netPnl.toFixed(2)}
          </p>
          <p className="text-[10.5px] text-muted-foreground">net</p>
        </div>
      </div>

      {/* Long + short legs */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <LegBox side="long" pos={long} pnl={pnlLong} tpDistance={longTpPct} />
        <LegBox side="short" pos={short} pnl={pnlShort} tpDistance={shortTpPct} />
      </div>

      {/* Cycle proximity bar (TP only — no SL by design) */}
      {closestTpPct < Infinity && (
        <div className="mt-2.5 flex items-center justify-between gap-2 text-[10.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-[hsl(var(--apice-emerald))]/70" />
            cycle close:{' '}
            <span className="font-mono font-semibold text-foreground tabular-nums">
              {closestTpPct.toFixed(2)}% to TP
            </span>
          </span>
          {layers >= 2 && (
            <span className="inline-flex items-center gap-1 text-violet-300/85">
              <Layers className="h-3 w-3" />
              next layer at {nextLayerThreshold.toFixed(1)}% drawdown
            </span>
          )}
        </div>
      )}
    </motion.li>
  );
}

function LegBox({
  side,
  pos,
  pnl,
  tpDistance,
}: {
  side: 'long' | 'short';
  pos?: ApexAiPosition;
  pnl: number;
  tpDistance: number | null;
}) {
  const isLong = side === 'long';
  const Icon = isLong ? TrendingUp : TrendingDown;
  const tone = isLong ? 'emerald' : 'rose';

  return (
    <div
      className={cn(
        'rounded-xl px-3 py-2.5 min-w-0',
        tone === 'emerald'
          ? 'bg-[hsl(var(--apice-emerald))]/[0.06] border border-[hsl(var(--apice-emerald))]/15'
          : 'bg-rose-500/[0.06] border border-rose-500/15',
      )}
    >
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <Icon
            className={cn('h-3.5 w-3.5', isLong ? 'text-[hsl(var(--apice-emerald))]' : 'text-rose-400')}
            strokeWidth={2.2}
          />
          <span
            className={cn(
              'text-[10px] font-bold uppercase tracking-[0.16em]',
              isLong ? 'text-[hsl(var(--apice-emerald))]' : 'text-rose-300',
            )}
          >
            {side}
          </span>
        </div>
        <span
          className={cn(
            'font-mono text-[11px] font-bold tabular-nums',
            pnl >= 0 ? 'text-[hsl(var(--apice-emerald))]' : 'text-rose-400',
          )}
        >
          {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
        </span>
      </div>
      {pos ? (
        <>
          <p className="mt-1.5 font-mono text-[10.5px] text-muted-foreground tabular-nums truncate">
            entry ${Number(pos.entry_price).toFixed(2)} · {Number(pos.size).toFixed(4)}
          </p>
          {tpDistance != null && (
            <p className="font-mono text-[10px] text-muted-foreground/80 tabular-nums truncate">
              TP <span className="text-[hsl(var(--apice-emerald))]/80">{Math.abs(tpDistance).toFixed(2)}%</span>
            </p>
          )}
        </>
      ) : (
        <p className="mt-1.5 text-[11px] italic text-muted-foreground">missing leg</p>
      )}
    </div>
  );
}

export default ApexAiHedgeBoard;
