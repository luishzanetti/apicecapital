import { useEffect, useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Activity, RefreshCw, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ApexAiPortfolio } from '@/types/apexAi';

/**
 * Apex AI Health Bar
 *
 * Diagnostic strip that surfaces whether the autonomous tick loop is
 * actually running. The CEO's complaint — "active bot, nothing happens
 * for days" — usually traces to one of:
 *
 *   1. Edge function not deployed (we proved it IS — that's not it)
 *   2. pg_cron not scheduled or paused → no server-side ticks
 *   3. Portfolio `last_tick_at` stale (>5 min) → bot is silent
 *
 * This widget shows time-since-last-tick prominently and gives the user
 * a "Run Now" button to manually fire a tick — proves the engine works,
 * unblocks them while infra issues are fixed, and surfaces real errors.
 */

interface ApexAiHealthBarProps {
  portfolio: ApexAiPortfolio;
  /** Re-fetch helper (typed loosely so caller doesn't have to import the hook) */
  onRefresh?: () => void;
}

const STALE_MS = 3 * 60 * 1000; // 3 min — pg_cron fires every minute, give 3x slack
const VERY_STALE_MS = 10 * 60 * 1000; // 10 min — definitely broken

function formatAge(ms: number): string {
  if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h`;
  return `${Math.round(ms / 86_400_000)}d`;
}

export function ApexAiHealthBar({ portfolio, onRefresh }: ApexAiHealthBarProps) {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);
  // Re-render every 15s so "ago" stays fresh without re-fetching the row
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  const lastTickAt = portfolio.last_tick_at ?? null;
  const ageMs = useMemo(() => {
    if (!lastTickAt) return Infinity;
    const t = new Date(lastTickAt).getTime();
    if (Number.isNaN(t)) return Infinity;
    return Date.now() - t;
  }, [lastTickAt]);

  const isActive = portfolio.status === 'active';

  let tone: 'ok' | 'warn' | 'fail' | 'idle' = 'idle';
  let label: string;
  if (!isActive) {
    tone = 'idle';
    label = 'Idle (paused)';
  } else if (ageMs === Infinity) {
    tone = 'fail';
    label = 'Never ticked';
  } else if (ageMs > VERY_STALE_MS) {
    tone = 'fail';
    label = `Last tick ${formatAge(ageMs)} ago — engine appears stalled`;
  } else if (ageMs > STALE_MS) {
    tone = 'warn';
    label = `Last tick ${formatAge(ageMs)} ago — checking…`;
  } else {
    tone = 'ok';
    label = `Last tick ${formatAge(ageMs)} ago`;
  }

  const Icon =
    tone === 'ok' ? CheckCircle2
    : tone === 'warn' ? Activity
    : tone === 'fail' ? AlertTriangle
    : Activity;

  const handleRunNow = async () => {
    if (running) return;
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('apex-ai-bot-tick', {
        body: { portfolio_id: portfolio.id },
      });

      if (error) throw error;
      if (data && data.success === false) {
        throw new Error(data.error ?? 'tick returned success=false');
      }

      const actions = (data?.data?.actions ?? []) as Array<{ type?: string }>;
      const summary =
        actions.length === 0
          ? 'Tick ran — no triggers fired (positions still within band).'
          : `Tick ran — ${actions.length} action${actions.length === 1 ? '' : 's'} executed.`;

      toast.success('Bot ticked', { description: summary });

      queryClient.invalidateQueries({ queryKey: ['apex-ai-portfolio', portfolio.id] });
      queryClient.invalidateQueries({ queryKey: ['apex-ai-portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['apex-ai-positions', portfolio.id] });
      queryClient.invalidateQueries({ queryKey: ['apex-ai-trades', portfolio.id] });
      onRefresh?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      toast.error('Tick failed', { description: msg });
    } finally {
      setRunning(false);
    }
  };

  const toneClasses = {
    ok:   'border-emerald-500/30 bg-emerald-500/[0.05] text-emerald-300',
    warn: 'border-amber-500/30 bg-amber-500/[0.05] text-amber-300',
    fail: 'border-red-500/30 bg-red-500/[0.06] text-red-300',
    idle: 'border-white/10 bg-white/[0.02] text-white/60',
  } as const;

  const showRunButton = isActive;

  return (
    <motion.section
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      aria-label="Apex AI engine health"
      className={cn(
        'flex items-center gap-3 rounded-2xl border px-3.5 py-2.5',
        toneClasses[tone],
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', tone === 'warn' && 'animate-pulse')} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold leading-tight">
          {label}
        </p>
        {tone === 'fail' && isActive && (
          <p className="mt-0.5 text-[11px] text-red-300/80 leading-snug">
            Server cron may be down. Tap “Run Now” to advance the engine manually while ops checks the schedule.
          </p>
        )}
      </div>

      {showRunButton && (
        <button
          type="button"
          onClick={handleRunNow}
          disabled={running}
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40',
            running
              ? 'cursor-not-allowed bg-white/[0.04] text-muted-foreground'
              : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25',
          )}
        >
          {running ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Ticking…
            </>
          ) : (
            <>
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
              Run Now
            </>
          )}
        </button>
      )}
    </motion.section>
  );
}

export default ApexAiHealthBar;
