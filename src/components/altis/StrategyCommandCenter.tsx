import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Gauge,
  Info,
  Lightbulb,
  Pause,
  Play,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { ALTIS_STRATEGIES } from '@/constants/strategies';
import {
  STRATEGY_INTELLIGENCE,
  type StrategyKey,
  type StrategyRecommendation,
} from '@/data/strategyIntelligence';
import { cn } from '@/lib/utils';
import type { StrategyConfig } from '@/store/types';
import type { PendingSignal, StrategyPerformance } from '@/hooks/useLeveragedTrading';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategyType: StrategyKey | null;
  strategy: StrategyConfig | undefined;
  /** Pending signals filtered to this strategy. */
  pendingSignals: PendingSignal[];
  /** Performance history for this strategy. */
  performance: StrategyPerformance | undefined;
  /** Live regime detection from market context. */
  regime: string;
  /** AI recommendation for this strategy (if any). */
  recommendation: StrategyRecommendation | undefined;
  /** Whether the strategy is currently active. */
  isActive: boolean;
  /** Current allocation percentage. */
  allocationPct: number;
  /** Total capital for this bot, for USD sizing preview. */
  totalCapital: number;
  // Controls
  onToggle: (nextActive: boolean) => void | Promise<void>;
  onAllocationChange: (nextPct: number) => void | Promise<void>;
}

const TONE_STYLES: Record<StrategyRecommendation['tone'], { bg: string; text: string; border: string; icon: typeof Lightbulb }> = {
  activate: { bg: 'bg-[hsl(var(--apice-emerald))]/10', text: 'text-[hsl(var(--apice-emerald))]', border: 'border-[hsl(var(--apice-emerald))]/25', icon: Zap },
  increase: { bg: 'bg-[hsl(var(--apice-emerald))]/10', text: 'text-[hsl(var(--apice-emerald))]', border: 'border-[hsl(var(--apice-emerald))]/25', icon: TrendingUp },
  decrease: { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/25', icon: TrendingDown },
  pause:    { bg: 'bg-red-500/10',   text: 'text-red-400',  border: 'border-red-500/25',   icon: Pause },
  hold:     { bg: 'bg-sky-500/10',   text: 'text-sky-300',  border: 'border-sky-500/25',   icon: CheckCircle2 },
};

function fmtPct(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

function fmtUSD(n: number): string {
  return `${n >= 0 ? '+' : '−'}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function StrategyCommandCenter({
  open,
  onOpenChange,
  strategyType,
  strategy,
  pendingSignals,
  performance,
  regime,
  recommendation,
  isActive,
  allocationPct,
  totalCapital,
  onToggle,
  onAllocationChange,
}: Props) {
  const intel = strategyType ? STRATEGY_INTELLIGENCE[strategyType] : null;
  const meta = strategyType ? ALTIS_STRATEGIES[strategyType] : null;
  const [draftPct, setDraftPct] = useState(allocationPct);
  const [savingPct, setSavingPct] = useState(false);

  // Sync draft when a different strategy is opened.
  useMemo(() => {
    setDraftPct(allocationPct);
  }, [allocationPct, strategyType]);

  if (!intel || !meta) return null;

  const regimeThrives = intel.thrivesIn.includes(regime.toUpperCase() as never);
  const regimeStruggles = intel.strugglesIn.includes(regime.toUpperCase() as never);
  const statusLabel =
    !isActive ? 'Paused' :
      regimeThrives ? 'Optimal conditions' :
        regimeStruggles ? 'Unfavorable regime' :
          'Active · monitoring';

  const statusTone =
    !isActive ? 'amber' :
      regimeThrives ? 'emerald' :
        regimeStruggles ? 'red' :
          'sky';

  const capitalForStrategy = totalCapital * (allocationPct / 100);

  const hasPendingChange = draftPct !== allocationPct;

  const handleSaveAllocation = async () => {
    setSavingPct(true);
    try {
      await onAllocationChange(draftPct);
    } finally {
      setSavingPct(false);
    }
  };

  const RecoIcon = recommendation ? TONE_STYLES[recommendation.tone].icon : Lightbulb;
  const recoStyle = recommendation ? TONE_STYLES[recommendation.tone] : TONE_STYLES.hold;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto border-l border-white/10 bg-[#0F1626] p-0"
      >
        {/* Header */}
        <SheetHeader className="sticky top-0 z-10 border-b border-white/5 bg-[#0F1626]/95 p-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
              style={{ background: `${meta.chartColor}20`, color: meta.chartColor }}
              aria-hidden="true"
            >
              {meta.icon}
            </span>
            <div className="flex-1 min-w-0">
              <SheetTitle className="flex items-center gap-2 text-left text-base font-semibold text-white">
                {meta.label}
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]',
                    statusTone === 'emerald' && 'bg-[hsl(var(--apice-emerald))]/10 text-[hsl(var(--apice-emerald))]',
                    statusTone === 'amber' && 'bg-amber-500/10 text-amber-300',
                    statusTone === 'red' && 'bg-red-500/10 text-red-400',
                    statusTone === 'sky' && 'bg-sky-500/10 text-sky-300',
                  )}
                >
                  <span
                    className={cn(
                      'h-1 w-1 rounded-full',
                      statusTone === 'emerald' && 'bg-[hsl(var(--apice-emerald))] animate-pulse',
                      statusTone === 'amber' && 'bg-amber-400',
                      statusTone === 'red' && 'bg-red-400',
                      statusTone === 'sky' && 'bg-sky-400 animate-pulse',
                    )}
                  />
                  {statusLabel}
                </span>
              </SheetTitle>
              <SheetDescription className="mt-0.5 text-left text-xs text-white/60">
                {intel.oneLiner}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5 p-5">
          {/* ── AI Recommendation (top) ────────────────────────── */}
          {recommendation && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('rounded-2xl border p-4', recoStyle.bg, recoStyle.border)}
            >
              <div className="flex items-center gap-2">
                <RecoIcon className={cn('h-4 w-4', recoStyle.text)} aria-hidden="true" />
                <p className={cn('text-[10px] font-semibold uppercase tracking-[0.14em]', recoStyle.text)}>
                  Apice AI recommendation
                </p>
              </div>
              <p className={cn('mt-1.5 text-sm font-semibold', recoStyle.text)}>
                {recommendation.action}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-white/70">
                {recommendation.reason}
              </p>
            </motion.div>
          )}

          {/* ── Live controls: toggle + allocation ──────────────── */}
          <div className="rounded-2xl bg-white/[0.02] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
                  Strategy status
                </p>
                <p className="mt-0.5 text-xs text-white/60">
                  {isActive ? 'Actively trading' : 'Paused — no new entries'}
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={onToggle}
                aria-label={isActive ? 'Pause strategy' : 'Activate strategy'}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
                  Allocation
                </p>
                <p className="font-mono text-sm font-semibold tabular-nums text-white">
                  {draftPct}%
                  <span className="ml-2 font-normal text-white/45">
                    ≈ ${(totalCapital * draftPct / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </p>
              </div>
              <Slider
                value={[draftPct]}
                onValueChange={(v) => setDraftPct(Math.round(v[0]))}
                min={0}
                max={100}
                step={5}
                className="mt-3"
                disabled={!isActive}
              />
              <AnimatePresence>
                {hasPendingChange && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 flex items-center justify-between gap-2"
                  >
                    <span className="text-[11px] text-white/50">
                      {draftPct > allocationPct ? 'Increasing' : 'Reducing'} from {allocationPct}%
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => setDraftPct(allocationPct)}
                        disabled={savingPct}
                      >
                        Reset
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 px-3 text-[11px] bg-[hsl(var(--apice-emerald))] text-[#050816] hover:bg-[hsl(var(--apice-emerald))]/90"
                        onClick={handleSaveAllocation}
                        disabled={savingPct}
                      >
                        {savingPct ? 'Saving…' : 'Apply'}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Thesis ─────────────────────────────────────────── */}
          <Section icon={Info} title="How it works">
            <p className="text-sm leading-relaxed text-white/75">{intel.thesis}</p>
          </Section>

          {/* ── Entry / Exit / Sizing ───────────────────────────── */}
          <div className="grid gap-3 md:grid-cols-2">
            <Section icon={Target} title="Entry triggers" compact>
              <ul className="space-y-1.5">
                {intel.entryTriggers.map((t) => (
                  <li key={t} className="flex gap-2 text-xs leading-relaxed text-white/75">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--apice-emerald))]" />
                    {t}
                  </li>
                ))}
              </ul>
            </Section>
            <Section icon={ShieldCheck} title="Exit rules" compact>
              <ul className="space-y-1.5">
                {intel.exitRules.map((t) => (
                  <li key={t} className="flex gap-2 text-xs leading-relaxed text-white/75">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                    {t}
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          {/* ── Performance stats ──────────────────────────────── */}
          <Section icon={Gauge} title="Edge & expectations">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Win rate" value={`${intel.expectedWinRate[0]}–${intel.expectedWinRate[1]}%`} />
              <Stat label="Edge/trade" value={intel.edgePerTrade} />
              <Stat label="Hold time" value={intel.avgHoldTime} />
            </div>
            {performance && performance.tradesClosed > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-white/[0.03] p-3">
                <Stat
                  label="Realized"
                  value={fmtUSD(performance.totalPnlUsd)}
                  tone={performance.totalPnlUsd >= 0 ? 'positive' : 'negative'}
                />
                <Stat
                  label="Win rate"
                  value={`${(performance.winRate * 100).toFixed(0)}%`}
                  tone={performance.winRate > 0.55 ? 'positive' : 'neutral'}
                />
                <Stat
                  label="Trades"
                  value={String(performance.tradesClosed)}
                />
              </div>
            )}
          </Section>

          {/* ── Pending signals (next entries) ─────────────────── */}
          <Section icon={Zap} title="Next entries">
            {pendingSignals.length === 0 ? (
              <div className="rounded-xl bg-white/[0.02] p-3 text-xs text-white/50">
                No pending signals. Waiting for the next evaluation window.
              </div>
            ) : (
              <ul className="space-y-2">
                {pendingSignals.slice(0, 5).map((s, i) => (
                  <li
                    key={`${s.symbol}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] p-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {s.direction === 'long' ? (
                        <TrendingUp className="h-4 w-4 shrink-0 text-[hsl(var(--apice-emerald))]" />
                      ) : (
                        <TrendingDown className="h-4 w-4 shrink-0 text-red-400" />
                      )}
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-white">
                          {s.symbol.replace('USDT', '')} {s.direction.toUpperCase()}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-white/55">
                          {s.rationale || 'Awaiting execution conditions.'}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-[11px] font-semibold tabular-nums text-white">
                        {(s.conviction * 100).toFixed(0)}% conv.
                      </p>
                      <p className="font-mono text-[10px] tabular-nums text-white/50">
                        ${Math.round(s.suggestedSizeUsd).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* ── Risk notes ─────────────────────────────────────── */}
          <Section icon={AlertTriangle} title="Risk notes">
            <p className="text-xs leading-relaxed text-white/65">{intel.riskNotes}</p>
          </Section>

          {/* ── Footer actions ─────────────────────────────────── */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="ghost"
              className="justify-between bg-white/[0.04] text-[12px] hover:bg-white/[0.08]"
              onClick={() => onToggle(!isActive)}
            >
              <span className="flex items-center gap-2">
                {isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {isActive ? 'Pause strategy' : 'Resume strategy'}
              </span>
              <ArrowRight className="h-3 w-3 opacity-50" />
            </Button>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-white/[0.02] p-3 text-[11px] text-white/55">
            <Activity className="h-3.5 w-3.5 shrink-0 text-white/40" />
            <span>Capital now: ${capitalForStrategy.toLocaleString('en-US', { maximumFractionDigits: 0 })} — updates live as regime shifts.</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
  compact,
}: {
  icon: typeof Lightbulb;
  title: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn('rounded-2xl bg-white/[0.02]', compact ? 'p-3' : 'p-4')}>
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-white/45" aria-hidden="true" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'positive' | 'negative' | 'neutral';
}) {
  return (
    <div className="rounded-lg bg-white/[0.02] p-2">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/45">
        {label}
      </p>
      <p
        className={cn(
          'mt-1 font-mono text-[12px] font-semibold tabular-nums',
          tone === 'positive' && 'text-[hsl(var(--apice-emerald))]',
          tone === 'negative' && 'text-red-400',
          tone === 'neutral' && 'text-white/90',
        )}
      >
        {value}
      </p>
    </div>
  );
}
