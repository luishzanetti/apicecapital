import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, RotateCcw, AlertCircle, Sparkles, Activity, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

/**
 * Apex AI — Live Cycles Feed
 *
 * Real-time feed of hedge cycle events emitted by `apex-ai-bot-tick` v3.2.
 * Each entry shows what happened (close hedge, reopen hedge, error) and
 * the financial outcome. Auto-refreshes every 15s while the tab is visible.
 *
 * Filters to events with concrete trading meaning — not the noisy
 * `tick_completed` heartbeat. The feed is the lived proof that the bot
 * is actually working.
 */

interface BotLogEvent {
  id: string;
  created_at: string;
  level: string;
  event: string;
  payload_json: Record<string, unknown> | null;
}

const EVENTS_OF_INTEREST = [
  'hedge_cycle_completed',
  'hedge_reopened',
  'hedge_reopen_failed',
  'cycle_closed',
  'layer_opened',
  'circuit_breaker_triggered',
  'drawdown_tolerance_breached',
  'sma_filter_applied',
  'bootstrap_opened_simulated',
  'bootstrap_opened_live',
  'bootstrap_blocked_sma',
];

interface ApexAiLiveCyclesFeedProps {
  portfolioId: string | null | undefined;
  /** Max number of rows to render. Default 12. */
  limit?: number;
}

export function ApexAiLiveCyclesFeed({
  portfolioId,
  limit = 12,
}: ApexAiLiveCyclesFeedProps) {
  const { data: events = [] } = useQuery({
    queryKey: ['apex-ai-live-feed', portfolioId, limit],
    queryFn: async (): Promise<BotLogEvent[]> => {
      if (!portfolioId) return [];
      const { data, error } = await supabase
        .from('apex_ai_bot_logs')
        .select('id, created_at, level, event, payload_json')
        .eq('portfolio_id', portfolioId)
        .in('event', EVENTS_OF_INTEREST)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as BotLogEvent[];
    },
    enabled: !!portfolioId,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  // Re-render every 30s so "Xs ago" stays fresh
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      aria-label="Live cycles feed"
      className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.015] p-4 md:p-5"
    >
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[hsl(var(--apice-emerald))]" strokeWidth={2} />
          <h3 className="text-sm font-bold tracking-tight text-foreground">
            Strategy Decisions
          </h3>
          <motion.span
            className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--apice-emerald))]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--apice-emerald))]"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--apice-emerald))]" />
            Live
          </motion.span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          last {events.length}
        </span>
      </header>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.08] p-4 text-center">
          <Sparkles className="mx-auto h-4 w-4 text-muted-foreground" />
          <p className="mt-2 text-[12.5px] font-medium text-foreground">
            Waiting for the next cycle
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            The bot ticks every minute. Cycles fire when the market moves through TP or SL.
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {events.map((evt) => (
              <FeedRow key={evt.id} event={evt} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}

function FeedRow({ event }: { event: BotLogEvent }) {
  const meta = describeEvent(event);
  const ageMs = Date.now() - new Date(event.created_at).getTime();
  const Icon = meta.icon;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-start gap-2.5 rounded-xl bg-white/[0.02] px-3 py-2"
    >
      <span
        className={cn(
          'mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg',
          meta.toneClass,
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] leading-snug">
          <span className={cn('font-semibold', meta.titleClass)}>{meta.title}</span>
          {meta.subtitle && (
            <>
              <span className="text-muted-foreground"> · </span>
              <span className="font-mono tabular-nums text-foreground">{meta.subtitle}</span>
            </>
          )}
        </p>
        <p className="mt-0.5 text-[10.5px] text-muted-foreground tabular-nums">
          {formatAge(ageMs)} ago
        </p>
      </div>
      {meta.amount != null && (
        <span
          className={cn(
            'shrink-0 font-mono text-[12.5px] font-bold tabular-nums',
            meta.amount >= 0 ? 'text-[hsl(var(--apice-emerald))]' : 'text-rose-400',
          )}
        >
          {meta.amount >= 0 ? '+' : ''}${Math.abs(meta.amount).toFixed(2)}
        </span>
      )}
    </motion.li>
  );
}

interface EventMeta {
  title: string;
  subtitle?: string;
  amount?: number;
  icon: typeof Sparkles;
  toneClass: string;
  titleClass: string;
}

function describeEvent(evt: BotLogEvent): EventMeta {
  const p = (evt.payload_json ?? {}) as Record<string, unknown>;
  const symbol = String(p.symbol ?? '').replace('USDT', '');
  const num = (k: string): number | undefined => {
    const v = p[k];
    if (v == null) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  switch (evt.event) {
    case 'hedge_cycle_completed': {
      const trigger = String(p.trigger ?? '');
      const triggerLabel = trigger === 'take_profit' ? 'TP hit' : trigger === 'stop_loss' ? 'SL hit' : 'cycle';
      const triggerSide = String(p.trigger_side ?? '');
      const netPnl = num('net_pnl');
      return {
        title: `${symbol || 'BTC'} cycle closed`,
        subtitle: `${triggerLabel}${triggerSide ? ` · ${triggerSide}` : ''}`,
        amount: netPnl,
        icon: CheckCircle2,
        toneClass: (netPnl ?? 0) >= 0
          ? 'bg-[hsl(var(--apice-emerald))]/15 text-[hsl(var(--apice-emerald))]'
          : 'bg-rose-500/15 text-rose-400',
        titleClass: 'text-foreground',
      };
    }
    case 'hedge_reopened':
      return {
        title: `${symbol || 'BTC'} hedge reopened`,
        subtitle: 'fresh entries',
        icon: RotateCcw,
        toneClass: 'bg-sky-500/15 text-sky-300',
        titleClass: 'text-foreground',
      };
    case 'hedge_reopen_failed':
      return {
        title: `${symbol || 'BTC'} reopen failed`,
        subtitle: String(p.error ?? 'unknown'),
        icon: AlertCircle,
        toneClass: 'bg-amber-500/15 text-amber-300',
        titleClass: 'text-amber-300',
      };
    case 'cycle_closed': {
      const layers = num('layers_closed');
      const pnl = num('pnl');
      return {
        title: `${symbol || 'BTC'} blended close`,
        subtitle: layers ? `${layers} layers · TP blended` : 'TP blended',
        amount: pnl,
        icon: CheckCircle2,
        toneClass: 'bg-[hsl(var(--apice-emerald))]/15 text-[hsl(var(--apice-emerald))]',
        titleClass: 'text-foreground',
      };
    }
    case 'layer_opened': {
      const layer = num('layer_index');
      return {
        title: `${symbol || 'BTC'} layer L${layer ?? '?'}`,
        subtitle: `Martingale add · ${String(p.side ?? '')}`,
        icon: Zap,
        toneClass: 'bg-violet-500/15 text-violet-300',
        titleClass: 'text-foreground',
      };
    }
    case 'bootstrap_opened_simulated':
    case 'bootstrap_opened_live': {
      const opened = num('positions_opened');
      const isLive = evt.event === 'bootstrap_opened_live';
      return {
        title: `Bootstrap ${isLive ? 'LIVE' : 'simulated'}`,
        subtitle: `${opened ?? '?'} positions opened`,
        icon: Sparkles,
        toneClass: isLive
          ? 'bg-[hsl(var(--apice-emerald))]/15 text-[hsl(var(--apice-emerald))]'
          : 'bg-sky-500/15 text-sky-300',
        titleClass: 'text-foreground',
      };
    }
    case 'sma_filter_applied': {
      const skipped = num('skipped');
      const surviving = num('surviving');
      return {
        title: 'SMA filter applied',
        subtitle: `${surviving ?? '?'} pass · ${skipped ?? 0} blocked`,
        icon: Sparkles,
        toneClass: 'bg-amber-500/15 text-amber-300',
        titleClass: 'text-foreground',
      };
    }
    case 'bootstrap_blocked_sma':
      return {
        title: 'Bootstrap blocked by SMA',
        subtitle: 'all symbols below SMA-20 × 0.95',
        icon: AlertCircle,
        toneClass: 'bg-amber-500/15 text-amber-300',
        titleClass: 'text-amber-300',
      };
    case 'circuit_breaker_triggered':
      return {
        title: 'Circuit breaker',
        subtitle: `drawdown ${num('drawdown_pct')?.toFixed(1) ?? '?'}%`,
        icon: AlertCircle,
        toneClass: 'bg-rose-500/15 text-rose-400',
        titleClass: 'text-rose-400',
      };
    case 'drawdown_tolerance_breached':
      return {
        title: 'Drawdown tolerance breached',
        subtitle: `${num('drawdown_pct')?.toFixed(1) ?? '?'}% / ${num('tolerance_pct')?.toFixed(1) ?? '?'}%`,
        icon: AlertCircle,
        toneClass: 'bg-rose-500/15 text-rose-400',
        titleClass: 'text-rose-400',
      };
    default:
      return {
        title: evt.event.replace(/_/g, ' '),
        icon: Sparkles,
        toneClass: 'bg-white/[0.06] text-muted-foreground',
        titleClass: 'text-foreground',
      };
  }
}

function formatAge(ms: number): string {
  if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h`;
  return `${Math.round(ms / 86_400_000)}d`;
}

export default ApexAiLiveCyclesFeed;
