import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Infinity as InfinityIcon, Check, Pencil, ArrowRight, ChevronDown, ChevronUp,
  Shield,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { recommendDcaPlans, type RecommendedDcaPlan } from '@/lib/dcaRecommender';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * DCA Recommendations — Apice methodology surfaced as two ready-to-launch
 * infinite plans (Primary + Diversifier). The user can:
 *   · Apply with one tap (the "predefined experience" path)
 *   · Customize before applying (slider + asset picker still available
 *     on the existing DCA Planner page; this widget pre-fills it)
 *
 * USDC is always present as the war-chest fuel per CEO directive.
 */

const FREQ_LABEL: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
};

const ROLE_BADGE: Record<NonNullable<RecommendedDcaPlan['assets'][number]['role']>, { label: string; tone: string }> = {
  core:        { label: 'Core',       tone: 'bg-white/[0.06] text-white/75' },
  growth:      { label: 'Growth',     tone: 'bg-violet-500/15 text-violet-300' },
  defi:        { label: 'DeFi',       tone: 'bg-pink-500/15 text-pink-300' },
  'war-chest': { label: 'War Chest',  tone: 'bg-[hsl(var(--apice-emerald))]/15 text-[hsl(var(--apice-emerald))]' },
};

interface PlanCardProps {
  plan: RecommendedDcaPlan;
  onApply: (plan: RecommendedDcaPlan) => void;
  onCustomize: (plan: RecommendedDcaPlan) => void;
}

function PlanCard({ plan, onApply, onCustomize }: PlanCardProps) {
  const [expanded, setExpanded] = useState(plan.slot === 'primary');

  const monthly = useMemo(() => {
    const factor =
      plan.frequency === 'daily' ? 30
      : plan.frequency === 'weekly' ? 4.33
      : plan.frequency === 'biweekly' ? 2.17
      : 1;
    return Math.round(plan.amountPerInterval * factor);
  }, [plan.amountPerInterval, plan.frequency]);

  const isPrimary = plan.slot === 'primary';

  return (
    <motion.article
      layout
      className={cn(
        'rounded-2xl border p-3.5',
        isPrimary
          ? 'border-[hsl(var(--apice-emerald))]/25 bg-[hsl(var(--apice-emerald))]/[0.04]'
          : 'border-white/[0.06] bg-white/[0.02]',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            isPrimary
              ? 'bg-[hsl(var(--apice-emerald))]/15 text-[hsl(var(--apice-emerald))]'
              : 'bg-white/[0.06] text-white/70',
          )}
        >
          {isPrimary ? (
            <Sparkles className="h-[18px] w-[18px]" strokeWidth={1.9} />
          ) : (
            <Shield className="h-[18px] w-[18px]" strokeWidth={1.9} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{plan.label}</p>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/55">
              {plan.slot === 'primary' ? 'Primary' : 'Diversifier'}
            </span>
          </div>
          <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
            {plan.rationale}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px]">
            <span className="font-mono font-semibold tabular-nums text-foreground">
              ${plan.amountPerInterval}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{FREQ_LABEL[plan.frequency]}</span>
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex items-center gap-1 text-[hsl(var(--apice-emerald))] font-semibold">
              <InfinityIcon className="h-3 w-3" aria-hidden="true" />
              Infinite
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">~${monthly}/mo</span>
          </div>
        </div>
      </div>

      {/* Allocation strip (always visible, super-condensed) */}
      <div className="mt-3 flex h-2 overflow-hidden rounded-full">
        {plan.assets.map((a) => (
          <div
            key={a.symbol}
            className="h-full"
            style={{ width: `${a.allocation}%`, backgroundColor: a.color ?? '#888' }}
            title={`${a.symbol} ${a.allocation}%`}
          />
        ))}
      </div>

      {/* Expand to see asset breakdown */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
      >
        {expanded ? 'Hide breakdown' : 'Show breakdown'}
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.ul
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 space-y-1.5 overflow-hidden"
          >
            {plan.assets.map((a) => (
              <li key={a.symbol} className="flex items-center gap-2 text-[12px]">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: a.color ?? '#888' }}
                  aria-hidden="true"
                />
                <span className="font-semibold text-foreground">{a.symbol}</span>
                {a.role && (
                  <span className={cn('rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider', ROLE_BADGE[a.role].tone)}>
                    {ROLE_BADGE[a.role].label}
                  </span>
                )}
                <span className="ml-auto font-mono tabular-nums text-muted-foreground">
                  {a.allocation}%
                </span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  ${Math.round((plan.amountPerInterval * a.allocation) / 100)}
                </span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onApply(plan)}
          className={cn(
            'flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--apice-emerald))]/40',
            isPrimary
              ? 'bg-[hsl(var(--apice-emerald))] text-[#050816] hover:bg-[hsl(var(--apice-emerald))]/90'
              : 'bg-[hsl(var(--apice-emerald))]/15 text-[hsl(var(--apice-emerald))] hover:bg-[hsl(var(--apice-emerald))]/25',
          )}
        >
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          {isPrimary ? 'Activate plan' : 'Add as 2nd plan'}
        </button>
        <button
          type="button"
          onClick={() => onCustomize(plan)}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-white/[0.04] px-3 text-[13px] font-semibold text-foreground transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Customize
        </button>
      </div>
    </motion.article>
  );
}

interface DcaRecommendationsWidgetProps {
  /** When present, "Customize" pipes the chosen plan to this handler so the
   *  parent can prefill the DCA Planner editor. */
  onCustomize?: (plan: RecommendedDcaPlan) => void;
  /** Optional title override */
  title?: string;
}

export function DcaRecommendationsWidget({
  onCustomize,
  title = 'AI-Recommended DCA Plans',
}: DcaRecommendationsWidgetProps) {
  const userProfile = useAppStore((s) => s.userProfile);
  const investorType = useAppStore((s) => s.investorType);
  const fundingBalance = useAppStore((s) => s.currentBalances?.funding ?? 0);
  const addDcaPlan = useAppStore((s) => s.addDcaPlan);
  const dcaPlans = useAppStore((s) => s.dcaPlans);

  const recommendations = useMemo(
    () => recommendDcaPlans(userProfile, investorType, fundingBalance),
    [userProfile, investorType, fundingBalance],
  );

  const handleApply = async (plan: RecommendedDcaPlan) => {
    const draft = {
      assets: plan.assets.map((a) => ({ symbol: a.symbol, allocation: a.allocation })),
      amountPerInterval: plan.amountPerInterval,
      frequency: plan.frequency,
      durationDays: null,
      startDate: new Date().toISOString(),
      isActive: true,
      totalInvested: 0,
      nextExecutionDate: new Date().toISOString(),
      kind: plan.kind,
      label: plan.label,
    };
    try {
      await addDcaPlan(draft);
      toast.success(`${plan.label} activated`, {
        description: `${plan.amountPerInterval}/${FREQ_LABEL[plan.frequency].toLowerCase()} · running infinitely`,
      });
    } catch {
      toast.error('Could not activate plan');
    }
  };

  // If user already has 2+ active continuous plans, the widget has done
  // its job — collapse to a small reminder instead of competing for space.
  const activeContinuous = dcaPlans.filter(
    (p) => p.isActive && (p.kind ?? 'continuous') === 'continuous',
  );
  if (activeContinuous.length >= 2) {
    return (
      <section
        aria-label="DCA plans active"
        className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-3.5 flex items-start gap-3"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--apice-emerald))]/15 text-[hsl(var(--apice-emerald))]">
          <Check className="h-[18px] w-[18px]" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-foreground">
            Two engines running
          </p>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            Your Primary + Diversifier are both active. Apice will recommend tweaks if regime shifts.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label={title}
      className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.015] p-4 md:p-5"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-[60px]"
        style={{ background: 'hsl(var(--apice-emerald) / 0.08)' }}
      />

      <header className="relative mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles
              className="h-4 w-4 text-[hsl(var(--apice-emerald))]"
              aria-hidden="true"
              strokeWidth={2}
            />
            <h3 className="text-sm font-bold tracking-tight text-foreground">{title}</h3>
            <span className="rounded-full bg-[hsl(var(--apice-emerald))]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--apice-emerald))]">
              Apice methodology
            </span>
          </div>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            Two infinite plans matched to your profile · USDC included as war-chest fuel.
          </p>
        </div>
      </header>

      <div className="relative space-y-3">
        {recommendations.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onApply={handleApply}
            onCustomize={(p) => {
              if (onCustomize) onCustomize(p);
              else toast.info('Tap Customize on the DCA Planner to fine-tune');
            }}
          />
        ))}
      </div>

      <p className="relative mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <ArrowRight className="h-3 w-3" aria-hidden="true" />
        You can still tweak any allocation, amount or cadence before activating.
      </p>
    </section>
  );
}

export default DcaRecommendationsWidget;
