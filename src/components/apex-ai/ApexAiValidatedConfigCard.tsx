import { motion } from 'framer-motion';
import { Shield, Zap, TrendingUp, Target, BarChart3, Sparkles, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Apex AI — Validated Config Card.
 *
 * Surfaces the credibility behind the "Apex AI Moderado" recommendation:
 * the 3-year backtest results that earned this configuration "validated"
 * status. CEO directive 2026-04-29: only the validated config runs in
 * production. This card makes that promise visible to the user.
 *
 * Source of numbers: docs/projects/apex-ai/04-VALIDATED-CONFIG.md
 */

interface BacktestKpi {
  label: string;
  value: string;
  sub: string;
  tone: 'emerald' | 'gold' | 'sky' | 'violet';
  icon: typeof Sparkles;
}

const KPIS: BacktestKpi[] = [
  {
    label: 'Win Rate',
    value: '100%',
    sub: '250 / 250 cycles',
    tone: 'emerald',
    icon: Target,
  },
  {
    label: 'Total Return',
    value: '+543%',
    sub: '3-year backtest',
    tone: 'emerald',
    icon: TrendingUp,
  },
  {
    label: 'Max Drawdown',
    value: '40.7%',
    sub: 'Peak-to-trough',
    tone: 'gold',
    icon: BarChart3,
  },
  {
    label: 'Circuit Brakes',
    value: '0',
    sub: 'in 3 years',
    tone: 'sky',
    icon: Shield,
  },
];

const TONE_CLASSES = {
  emerald: 'text-[hsl(var(--apice-emerald))] bg-[hsl(var(--apice-emerald))]/10',
  gold:    'text-amber-300 bg-amber-500/10',
  sky:     'text-sky-300 bg-sky-500/10',
  violet:  'text-violet-300 bg-violet-500/10',
} as const;

interface ApexAiValidatedConfigCardProps {
  /** When true, render in compact mode (smaller, no spec table) */
  compact?: boolean;
}

export function ApexAiValidatedConfigCard({ compact = false }: ApexAiValidatedConfigCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-[hsl(var(--apice-emerald))]/25 bg-gradient-to-br from-[hsl(var(--apice-emerald))]/[0.07] via-background to-background"
    >
      {/* Animated scan line */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[hsl(var(--apice-emerald))] to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />

      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full blur-[60px]"
        style={{ background: 'hsl(var(--apice-emerald) / 0.15)' }}
      />

      <div className="relative p-4 md:p-5 space-y-4">
        {/* Header */}
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--apice-emerald))]/15">
                <Shield className="h-4 w-4 text-[hsl(var(--apice-emerald))]" strokeWidth={2.2} />
              </span>
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                Validated Strategy
              </h3>
              <span className="rounded-full bg-[hsl(var(--apice-emerald))]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--apice-emerald))]">
                Moderado · Apice tested
              </span>
            </div>
            <p className="mt-1.5 text-[12px] leading-snug text-muted-foreground">
              The only configuration running in production. Backtested on 3 years of real BTCUSDT data, every cycle closed in profit.
            </p>
          </div>
        </header>

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          {KPIS.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="rounded-2xl bg-white/[0.03] p-3 border border-white/[0.04]"
              >
                <div className="flex items-center gap-1.5">
                  <span className={cn('inline-flex h-5 w-5 items-center justify-center rounded-md', TONE_CLASSES[kpi.tone])}>
                    <Icon className="h-3 w-3" strokeWidth={2.2} />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {kpi.label}
                  </span>
                </div>
                <p className="mt-1.5 font-display font-mono text-xl font-bold tabular-nums tracking-tight">
                  {kpi.value}
                </p>
                <p className="mt-0.5 text-[10.5px] text-muted-foreground">{kpi.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Never-close-at-loss banner */}
        <div className="rounded-2xl bg-[hsl(var(--apice-emerald))]/[0.06] border border-[hsl(var(--apice-emerald))]/20 p-3">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 shrink-0 text-[hsl(var(--apice-emerald))] mt-0.5" strokeWidth={2.2} />
            <div className="min-w-0">
              <p className="text-[12.5px] font-bold text-[hsl(var(--apice-emerald))]">
                Never close at loss
              </p>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground leading-snug">
                When a leg moves against entry, the bot adds a Martingale layer (1.5% spacing) instead of stopping out. Closes only when aggregate turns positive. Drawdown ceiling: 30% (only kill switch).
              </p>
            </div>
          </div>
        </div>

        {/* Spec strip — only when not compact */}
        {!compact && (
          <div className="rounded-2xl bg-white/[0.02] p-3 border border-white/[0.04]">
            <div className="flex items-center gap-1.5 mb-2">
              <Lock className="h-3 w-3 text-muted-foreground" strokeWidth={2} />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Locked configuration · cannot be changed in production
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11.5px] md:grid-cols-4">
              <SpecItem label="Symbol" value="BTCUSDT" mono />
              <SpecItem label="Leverage" value="3×" mono />
              <SpecItem label="TP target" value="1.2%" mono accent />
              <SpecItem label="Max layers" value="8" mono />
              <SpecItem label="Layer spacing" value="1.5%" mono />
              <SpecItem label="SMA-20 filter" value="ON" accent />
              <SpecItem label="Reserve" value="10% / cycle" mono />
              <SpecItem label="Drawdown limit" value="30%" mono />
            </dl>
          </div>
        )}
      </div>
    </motion.section>
  );
}

function SpecItem({
  label,
  value,
  mono = false,
  accent = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 min-w-0">
      <dt className="text-muted-foreground truncate">{label}</dt>
      <dd
        className={cn(
          'font-semibold text-foreground shrink-0 tabular-nums',
          mono && 'font-mono',
          accent && 'text-[hsl(var(--apice-emerald))]',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export default ApexAiValidatedConfigCard;
