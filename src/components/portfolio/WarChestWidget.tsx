import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Sparkles, Zap, ChevronDown, ChevronUp, Check, X,
  TrendingUp, TrendingDown, Repeat, Rocket, Clock,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type {
  WarChestRecommendation,
  WarChestRecType,
  WarChestDeployment,
} from '@/store/types';
import { cn } from '@/lib/utils';

/**
 * War Chest — opportunistic capital pool denominated in USDC.
 *
 * Distinct from systematic DCA (which uses USDT, fixed weekly cadence).
 * The bot proposes time-bound recommendations against this bucket; the user
 * picks how it gets deployed:
 *   · Auto    — IA applies highest-confidence pending recs immediately
 *   · Manual  — user reviews each rec and approves/dismisses
 *
 * Currency separation rationale: USDT funds the predictable engine, USDC is
 * the war chest. Two pools, two intents, zero accidental cross-spending.
 */

const TYPE_META: Record<
  WarChestRecType,
  { label: string; icon: typeof Sparkles; color: string }
> = {
  'dip-buy':    { label: 'Dip Buy',    icon: TrendingDown, color: 'hsl(152, 70%, 50%)' },
  'momentum':   { label: 'Momentum',   icon: Rocket,       color: 'hsl(33, 100%, 55%)' },
  'rebalance':  { label: 'Rebalance',  icon: Repeat,       color: 'hsl(217, 100%, 60%)' },
  'protective': { label: 'Protective', icon: Shield,       color: 'hsl(45, 100%, 55%)' },
  'breakout':   { label: 'Breakout',   icon: TrendingUp,   color: 'hsl(280, 100%, 65%)' },
};

const fmtUsd = (n: number): string =>
  n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function timeLeft(expiresAt: number): string {
  const ms = expiresAt - Date.now();
  if (ms <= 0) return 'expired';
  const h = Math.floor(ms / 3_600_000);
  if (h >= 24) return `${Math.floor(h / 24)}d left`;
  if (h >= 1) return `${h}h left`;
  return `${Math.max(1, Math.floor(ms / 60_000))}m left`;
}

interface RecommendationRowProps {
  rec: WarChestRecommendation;
  mode: 'auto' | 'manual';
  onApply: (id: string) => void;
  onDismiss: (id: string) => void;
}

function RecommendationRow({ rec, mode, onApply, onDismiss }: RecommendationRowProps) {
  const meta = TYPE_META[rec.type];
  const Icon = meta.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${meta.color}1A`, color: meta.color }}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">
              {rec.asset}{' '}
              <span className="text-muted-foreground font-medium">
                · ${fmtUsd(rec.amountUsdc)} USDC
              </span>
            </p>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
              style={{ background: `${meta.color}1A`, color: meta.color }}
            >
              {meta.label}
            </span>
          </div>
          <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
            {rec.rationale}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[hsl(var(--apice-emerald))]" aria-hidden="true" />
              {rec.confidence}% conf
            </span>
            <span>·</span>
            <span>~{rec.expectedHoldDays}d hold</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {timeLeft(rec.expiresAt)}
            </span>
          </div>
        </div>
      </div>

      {mode === 'manual' && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => onApply(rec.id)}
            className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[hsl(var(--apice-emerald))]/15 text-[13px] font-semibold text-[hsl(var(--apice-emerald))] transition-colors hover:bg-[hsl(var(--apice-emerald))]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--apice-emerald))]/40"
            aria-label={`Deploy ${rec.amountUsdc} USDC into ${rec.asset}`}
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Deploy ${fmtUsd(rec.amountUsdc)}
          </button>
          <button
            type="button"
            onClick={() => onDismiss(rec.id)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            aria-label="Dismiss recommendation"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {mode === 'auto' && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-[hsl(var(--apice-emerald))]/80">
          <Zap className="h-3 w-3" aria-hidden="true" />
          Will auto-deploy as soon as your gates allow
        </p>
      )}
    </motion.div>
  );
}

interface DeploymentRowProps {
  d: WarChestDeployment;
}

function DeploymentRow({ d }: DeploymentRowProps) {
  const meta = TYPE_META[d.type];
  const Icon = meta.icon;
  const when = new Date(d.appliedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  return (
    <li className="flex items-center gap-3 py-2">
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${meta.color}1A`, color: meta.color }}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-foreground">
          {d.asset} · ${fmtUsd(d.amountUsdc)}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {meta.label} · {when} · {d.appliedBy === 'auto' ? 'auto' : 'manual'}
        </p>
      </div>
    </li>
  );
}

export function WarChestWidget() {
  const mode = useAppStore((s) => s.warChestMode);
  const setMode = useAppStore((s) => s.setWarChestMode);
  const recommendations = useAppStore((s) => s.warChestRecommendations);
  const deployments = useAppStore((s) => s.warChestDeployments);
  const refresh = useAppStore((s) => s.refreshWarChestRecommendations);
  const apply = useAppStore((s) => s.applyWarChestRecommendation);
  const dismiss = useAppStore((s) => s.dismissWarChestRecommendation);

  // Real USDC availability from balance-monitor edge function. Falls back
  // to FUND total when the breakdown isn't populated yet (older deploy).
  const usdcAvailableRaw = useAppStore((s) => s.currentBalances?.usdcAvailable ?? 0);
  const fundingFallback = useAppStore((s) => s.currentBalances?.funding ?? 0);
  const usdcAvailable = useMemo(
    () => Math.max(0, Math.floor(usdcAvailableRaw > 0 ? usdcAvailableRaw : fundingFallback)),
    [usdcAvailableRaw, fundingFallback],
  );

  const [showHistory, setShowHistory] = useState(false);

  // Bootstrap & top-up recommendations on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  const pending = useMemo(
    () =>
      recommendations
        .filter((r) => r.status === 'pending' && r.expiresAt > Date.now())
        .sort((a, b) => b.confidence - a.confidence),
    [recommendations],
  );

  const totalSuggested = useMemo(
    () => pending.reduce((sum, r) => sum + r.amountUsdc, 0),
    [pending],
  );

  const recentDeployments = deployments.slice(0, 5);

  return (
    <section
      aria-label="War Chest"
      className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.015] p-4 md:p-5"
    >
      {/* ambient emerald glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-[60px]"
        style={{ background: 'hsl(var(--apice-emerald) / 0.10)' }}
      />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Shield
              className="h-4 w-4 text-[hsl(var(--apice-emerald))]"
              aria-hidden="true"
              strokeWidth={2}
            />
            <h3 className="text-sm font-bold tracking-tight text-foreground">
              War Chest
            </h3>
            <span className="rounded-full bg-[hsl(var(--apice-emerald))]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--apice-emerald))]">
              USDC
            </span>
          </div>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            Opportunistic capital · separate from your weekly DCA (USDT).
          </p>
        </div>

        {/* Mode toggle */}
        <div
          role="tablist"
          aria-label="War Chest deployment mode"
          className="flex shrink-0 rounded-xl bg-white/[0.04] p-0.5"
        >
          <button
            role="tab"
            aria-selected={mode === 'manual'}
            onClick={() => setMode('manual')}
            className={cn(
              'inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold transition-colors',
              mode === 'manual'
                ? 'bg-white/[0.08] text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Manual
          </button>
          <button
            role="tab"
            aria-selected={mode === 'auto'}
            onClick={() => setMode('auto')}
            className={cn(
              'inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold transition-colors',
              mode === 'auto'
                ? 'bg-[hsl(var(--apice-emerald))]/15 text-[hsl(var(--apice-emerald))]'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Zap className="h-3 w-3" aria-hidden="true" />
            Auto
          </button>
        </div>
      </div>

      {/* Balance row */}
      <div className="relative mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/[0.03] p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold">
            Available USDC
          </p>
          <p className="mt-0.5 font-display text-xl font-bold tabular-nums">
            ${fmtUsd(usdcAvailable)}
          </p>
        </div>
        <div className="rounded-2xl bg-white/[0.03] p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold">
            AI Suggested
          </p>
          <p className="mt-0.5 font-display text-xl font-bold tabular-nums">
            ${fmtUsd(totalSuggested)}
            <span className="ml-1 text-[10.5px] font-medium text-muted-foreground">
              {pending.length} pick{pending.length === 1 ? '' : 's'}
            </span>
          </p>
        </div>
      </div>

      {/* Recommendations */}
      <div className="relative mt-4">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--apice-emerald))]" aria-hidden="true" />
          <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            AI Recommendations
          </h4>
        </div>

        {pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center">
            <p className="text-[13px] font-medium text-foreground">
              No fresh setups right now
            </p>
            <p className="mt-1 text-[11.5px] text-muted-foreground">
              The bot scans markets continuously. We'll surface a recommendation here as soon as edge appears.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence initial={false}>
              {pending.map((rec) => (
                <RecommendationRow
                  key={rec.id}
                  rec={rec}
                  mode={mode}
                  onApply={(id) => apply(id, 'manual')}
                  onDismiss={dismiss}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* History */}
      {recentDeployments.length > 0 && (
        <div className="relative mt-4 border-t border-white/5 pt-3">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            aria-expanded={showHistory}
            aria-controls="war-chest-history"
            className="flex w-full items-center justify-between rounded-lg px-1 text-left transition-colors hover:bg-white/[0.02]"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Recent deployments · {deployments.length}
            </span>
            {showHistory ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
          {showHistory && (
            <ul id="war-chest-history" className="mt-2 divide-y divide-white/5">
              {recentDeployments.map((d) => (
                <DeploymentRow key={d.id} d={d} />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

export default WarChestWidget;
