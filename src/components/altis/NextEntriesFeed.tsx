import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Clock,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { ALTIS_STRATEGIES } from '@/constants/strategies';
import { cn } from '@/lib/utils';
import type { PendingSignal } from '@/hooks/useLeveragedTrading';

interface Props {
  signals: PendingSignal[];
  /** Regime label from the orchestrator, e.g. "BULL", "SIDEWAYS". */
  regime: string | undefined;
  /** Whether the orchestrator is currently evaluating (disables manual button). */
  isEvaluating?: boolean;
  /** Optional handler for "Run now" button. */
  onEvaluate?: () => void;
  /** When a signal is clicked, open the command center for its strategy. */
  onSignalClick?: (strategyType: string) => void;
}

/**
 * Live pipeline of the next trades ALTIS is about to open. Highlights the
 * top 3 by conviction, then lists the remainder. Makes the "AI thinks…"
 * loop visible so the user can anticipate action.
 */
export function NextEntriesFeed({
  signals,
  regime,
  isEvaluating,
  onEvaluate,
  onSignalClick,
}: Props) {
  const sorted = [...signals].sort((a, b) => b.conviction - a.conviction);
  const approved = sorted.filter((s) => s.approved);
  const watchlist = sorted.filter((s) => !s.approved);
  const top3 = approved.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl glass-card"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(500px at 88% 0%, hsl(var(--apice-emerald) / 0.07), transparent 55%)',
        }}
      />

      <div className="relative p-4 md:p-5">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[hsl(var(--apice-emerald))]/15">
              <Zap className="h-3 w-3 text-[hsl(var(--apice-emerald))]" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--apice-emerald))]">
                Next entries · live
              </p>
              <p className="mt-0.5 text-[11px] text-white/55">
                Regime {regime ? <span className="font-mono font-semibold text-white/80">{regime}</span> : 'loading…'}
                {approved.length > 0 && ` · ${approved.length} ready`}
              </p>
            </div>
          </div>
          {onEvaluate && (
            <button
              type="button"
              onClick={onEvaluate}
              disabled={isEvaluating}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
                isEvaluating
                  ? 'bg-white/[0.04] text-white/45'
                  : 'bg-[hsl(var(--apice-emerald))]/10 text-[hsl(var(--apice-emerald))] hover:bg-[hsl(var(--apice-emerald))]/15',
              )}
            >
              {isEvaluating ? (
                <>
                  <Activity className="h-3 w-3 animate-pulse" aria-hidden="true" />
                  Scanning…
                </>
              ) : (
                <>
                  <Zap className="h-3 w-3" aria-hidden="true" />
                  Run now
                </>
              )}
            </button>
          )}
        </div>

        {/* Empty state */}
        {top3.length === 0 && watchlist.length === 0 && (
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] p-3 text-xs text-white/55">
            <Clock className="h-3.5 w-3.5 shrink-0 text-white/40" aria-hidden="true" />
            <span>
              No pending signals. ALTIS is waiting for the next evaluation window.
              Runs automatically every 15 min; press <em>Run now</em> to force-scan.
            </span>
          </div>
        )}

        {/* Top 3 — ready to execute */}
        {top3.length > 0 && (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {top3.map((s, i) => (
                <motion.li
                  key={`${s.symbol}-${s.strategyType}-${s.direction}`}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <SignalRow s={s} onClick={onSignalClick} emphasized />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}

        {/* Watchlist — detected but not approved yet */}
        {watchlist.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
              Watching · awaiting conditions
            </p>
            <ul className="space-y-1.5">
              {watchlist.slice(0, 3).map((s, i) => (
                <li key={`${s.symbol}-${s.strategyType}-${i}`}>
                  <SignalRow s={s} onClick={onSignalClick} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SignalRow({
  s,
  emphasized,
  onClick,
}: {
  s: PendingSignal;
  emphasized?: boolean;
  onClick?: (strategyType: string) => void;
}) {
  const meta = ALTIS_STRATEGIES[s.strategyType as keyof typeof ALTIS_STRATEGIES];
  const pos = s.direction === 'long';
  const handleClick = () => onClick?.(s.strategyType);
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      {...(onClick ? { type: 'button' as const, onClick: handleClick } : {})}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors',
        emphasized
          ? 'bg-[hsl(var(--apice-emerald))]/[0.04] hover:bg-[hsl(var(--apice-emerald))]/[0.08]'
          : 'bg-white/[0.02] hover:bg-white/[0.04]',
        onClick && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
      )}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
        style={{ background: `${meta?.chartColor ?? '#16A661'}22`, color: meta?.chartColor ?? '#16A661' }}
        aria-hidden="true"
      >
        {meta?.icon ?? '⚡'}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-semibold text-white">
            {s.symbol.replace('USDT', '')}
          </p>
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]',
              pos
                ? 'bg-[hsl(var(--apice-emerald))]/10 text-[hsl(var(--apice-emerald))]'
                : 'bg-red-500/10 text-red-400',
            )}
          >
            {pos ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
            {s.direction}
          </span>
          {meta && (
            <span className="text-[10px] text-white/50">· {meta.shortLabel}</span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-white/55">
          {s.rationale || (emphasized ? 'Risk-approved — executes on next tick.' : 'Awaiting confirmation.')}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={cn(
            'font-mono text-[12px] font-semibold tabular-nums',
            emphasized ? 'text-[hsl(var(--apice-emerald))]' : 'text-white/85',
          )}
        >
          {(s.conviction * 100).toFixed(0)}%
        </p>
        <p className="font-mono text-[10px] tabular-nums text-white/40">
          ${Math.round(s.suggestedSizeUsd).toLocaleString()}
        </p>
      </div>

      {onClick && (
        <ArrowRight
          className="h-3 w-3 shrink-0 text-white/25 transition-transform group-hover:translate-x-0.5 group-hover:text-white/60"
          aria-hidden="true"
        />
      )}
    </Component>
  );
}
