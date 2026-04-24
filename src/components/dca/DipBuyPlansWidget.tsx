import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, Zap, Calendar, Check, Activity } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import {
  recommendDipPlans,
  dipDailyAmount,
  type DipPlanTemplate,
} from '@/lib/dcaRecommender';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * Dip-Buy Plans — Apice's "be greedy when others are fearful, in a structured
 * way" engine. Two templates surface here:
 *
 *   · 7-Day Burst        — daily buys for 7d, 1.6× the base weekly rate
 *   · 21-Day Deep Discount — daily buys for 21d, 2.4× the base
 *
 * The bot reads market regime (eventually from apex_ai_regime_state) and
 * highlights the recommended template; user taps Activate to spawn a
 * scoped DCA plan. Bursts auto-expire via durationDays, so they never
 * outstay the opportunity.
 */

interface DipPlanCardProps {
  template: DipPlanTemplate;
  baseWeekly: number;
  recommended?: boolean;
  alreadyRunning?: boolean;
  onActivate: (template: DipPlanTemplate) => void;
}

function DipPlanCard({
  template,
  baseWeekly,
  recommended,
  alreadyRunning,
  onActivate,
}: DipPlanCardProps) {
  const dailyAmount = dipDailyAmount(template, baseWeekly);
  const totalCommit = dailyAmount * template.durationDays;

  const Icon = template.kind === 'dip_burst_7d' ? Zap : Calendar;

  return (
    <motion.article
      layout
      className={cn(
        'rounded-2xl border p-3.5',
        recommended
          ? 'border-[hsl(var(--apice-emerald))]/30 bg-[hsl(var(--apice-emerald))]/[0.04]'
          : 'border-white/[0.06] bg-white/[0.02]',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            recommended
              ? 'bg-[hsl(var(--apice-emerald))]/15 text-[hsl(var(--apice-emerald))]'
              : 'bg-amber-500/15 text-amber-300',
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{template.label}</p>
            {recommended && (
              <span className="rounded-full bg-[hsl(var(--apice-emerald))]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--apice-emerald))]">
                AI suggests now
              </span>
            )}
            {alreadyRunning && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/70">
                <Activity className="h-2.5 w-2.5" aria-hidden="true" />
                Running
              </span>
            )}
          </div>
          <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
            {template.rationale}
          </p>

          <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
            <div>
              <p className="text-muted-foreground">Daily</p>
              <p className="font-mono font-semibold tabular-nums text-foreground">
                ${dailyAmount}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Window</p>
              <p className="font-semibold text-foreground">{template.durationDays}d</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-mono font-semibold tabular-nums text-foreground">
                ${totalCommit.toLocaleString('en-US')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Allocation strip */}
      <div className="mt-3 flex h-2 overflow-hidden rounded-full">
        {template.assets.map((a) => (
          <div
            key={a.symbol}
            className="h-full"
            style={{ width: `${a.allocation}%`, backgroundColor: a.color ?? '#888' }}
            title={`${a.symbol} ${a.allocation}%`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {template.assets.map((a) => (
          <span key={a.symbol} className="inline-flex items-center gap-1">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: a.color ?? '#888' }}
              aria-hidden="true"
            />
            <span className="font-semibold text-foreground">{a.symbol}</span>
            <span>{a.allocation}%</span>
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onActivate(template)}
        disabled={alreadyRunning}
        className={cn(
          'mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--apice-emerald))]/40',
          alreadyRunning
            ? 'cursor-not-allowed bg-white/[0.04] text-muted-foreground'
            : recommended
              ? 'bg-[hsl(var(--apice-emerald))] text-[#050816] hover:bg-[hsl(var(--apice-emerald))]/90'
              : 'bg-[hsl(var(--apice-emerald))]/15 text-[hsl(var(--apice-emerald))] hover:bg-[hsl(var(--apice-emerald))]/25',
        )}
      >
        {alreadyRunning ? (
          <>
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Already active
          </>
        ) : (
          <>
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            Activate {template.label}
          </>
        )}
      </button>
    </motion.article>
  );
}

interface DipBuyPlansWidgetProps {
  /** Optional regime hint — when wired to apex_ai_regime_state will inform
   *  which template is highlighted. Defaults to neutral (both shown). */
  marketHint?: 'sharp_drop' | 'bear_leg' | 'neutral';
}

export function DipBuyPlansWidget({ marketHint = 'neutral' }: DipBuyPlansWidgetProps) {
  const baseWeekly = useAppStore((s) => s.weeklyInvestment) || 35;
  const dcaPlans = useAppStore((s) => s.dcaPlans);
  const addDcaPlan = useAppStore((s) => s.addDcaPlan);

  const templates = useMemo(
    () => recommendDipPlans({ baseWeeklyUsd: baseWeekly, marketHint }),
    [baseWeekly, marketHint],
  );

  const recommendedKind: DipPlanTemplate['kind'] | null =
    marketHint === 'sharp_drop' ? 'dip_burst_7d'
    : marketHint === 'bear_leg' ? 'dip_intensive_21d'
    : null;

  const handleActivate = async (template: DipPlanTemplate) => {
    const dailyAmount = dipDailyAmount(template, baseWeekly);
    try {
      await addDcaPlan({
        assets: template.assets.map((a) => ({ symbol: a.symbol, allocation: a.allocation })),
        amountPerInterval: dailyAmount,
        frequency: template.frequency,
        durationDays: template.durationDays,
        startDate: new Date().toISOString(),
        isActive: true,
        totalInvested: 0,
        nextExecutionDate: new Date().toISOString(),
        kind: template.kind,
        label: template.label,
      });
      toast.success(`${template.label} activated`, {
        description: `$${dailyAmount}/day for ${template.durationDays} days`,
      });
    } catch {
      toast.error('Could not activate dip plan');
    }
  };

  return (
    <section
      aria-label="Dip-buy plans"
      className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.015] p-4 md:p-5"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full blur-[55px]"
        style={{ background: 'hsl(0, 65%, 55%, 0.08)' }}
      />

      <header className="relative mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <TrendingDown
              className="h-4 w-4 text-amber-300"
              aria-hidden="true"
              strokeWidth={2}
            />
            <h3 className="text-sm font-bold tracking-tight text-foreground">
              Dip-Buy Plans
            </h3>
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Buy the fear
            </span>
          </div>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            Time-boxed bursts. Apice intensifies buying during sharp drawdowns and stops automatically when the window ends.
          </p>
        </div>
      </header>

      <div className="relative space-y-3">
        {templates.map((tpl) => {
          const alreadyRunning = dcaPlans.some(
            (p) => p.isActive && p.kind === tpl.kind,
          );
          return (
            <DipPlanCard
              key={tpl.id}
              template={tpl}
              baseWeekly={baseWeekly}
              recommended={tpl.kind === recommendedKind}
              alreadyRunning={alreadyRunning}
              onActivate={handleActivate}
            />
          );
        })}
      </div>
    </section>
  );
}

export default DipBuyPlansWidget;
