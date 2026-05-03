import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Zap, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { useDCAStats } from '@/hooks/useDCAStats';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function formatUsd(value: number, opts?: { compact?: boolean }): string {
  if (opts?.compact && value >= 1000) {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    });
  }
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  const now = Date.now();
  const target = new Date(dateStr).getTime();
  const diffMs = target - now;
  if (diffMs <= 0) return 'Due now';
  const diffHours = Math.floor(diffMs / 3_600_000);
  if (diffHours < 1) return '<1h';
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

interface KpiPillProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  delay?: number;
}

function KpiPill({ icon, label, value, accent, delay = 0 }: KpiPillProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay }}
      className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2.5"
    >
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', accent)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-semibold">
          {label}
        </p>
        <p className="text-sm font-bold text-white truncate tabular-nums">{value}</p>
      </div>
    </motion.div>
  );
}

interface DCAHeroDashboardProps {
  onCreatePlan: () => void;
}

export function DCAHeroDashboard({ onCreatePlan }: DCAHeroDashboardProps) {
  const { totalInvested, monthlyCommitment, activeCount, nextExecution } = useDCAStats();

  const isEmpty = activeCount === 0 && totalInvested === 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'relative overflow-hidden rounded-3xl border border-white/[0.08]',
        'bg-gradient-to-br from-[hsl(var(--apice-emerald))]/[0.06] via-white/[0.02] to-transparent',
        'apice-shadow-elevated p-5 md:p-6',
      )}
    >
      {/* Decorative emerald glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full blur-[80px]"
        style={{ background: 'hsl(var(--apice-emerald) / 0.12)' }}
      />

      <div className="relative">
        {/* Hero number row */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-[hsl(var(--apice-emerald))]" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/55 font-semibold">
                {isEmpty ? 'DCA capacity' : 'Total invested via DCA'}
              </span>
            </div>
            <motion.h1
              key={totalInvested}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-4xl md:text-5xl font-bold text-white tracking-tight tabular-nums leading-none"
            >
              {isEmpty ? '$0' : formatUsd(totalInvested)}
            </motion.h1>
            <p className="text-xs text-white/50 mt-2">
              {isEmpty ? (
                'Start small. Compound does the heavy lifting.'
              ) : (
                <>
                  Across{' '}
                  <span className="text-white/80 font-semibold">{activeCount}</span>{' '}
                  active {activeCount === 1 ? 'plan' : 'plans'}
                </>
              )}
            </p>
          </div>

          {isEmpty ? (
            <Button
              variant="premium"
              size="lg"
              onClick={onCreatePlan}
              className="shrink-0 gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Start your first plan
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 rounded-full bg-[hsl(var(--apice-emerald))]/15 px-3 py-1.5 border border-[hsl(var(--apice-emerald))]/25">
                <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--apice-emerald))] animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--apice-emerald))]">
                  Compounding
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-3 gap-2.5">
          <KpiPill
            icon={<Calendar className="h-4 w-4 text-blue-400" />}
            label="Monthly"
            value={monthlyCommitment > 0 ? formatUsd(monthlyCommitment, { compact: true }) : '—'}
            accent="bg-blue-500/15"
            delay={0.05}
          />
          <KpiPill
            icon={<Zap className="h-4 w-4 text-violet-400" />}
            label="Active"
            value={activeCount > 0 ? String(activeCount) : '—'}
            accent="bg-violet-500/15"
            delay={0.12}
          />
          <KpiPill
            icon={<Clock className="h-4 w-4 text-amber-400" />}
            label="Next"
            value={relativeTime(nextExecution)}
            accent="bg-amber-500/15"
            delay={0.19}
          />
        </div>
      </div>
    </motion.section>
  );
}
