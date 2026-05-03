import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight,
  Zap, DollarSign, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PortfolioAnalytics } from '@/hooks/usePortfolioAnalytics';

function fmt(value: number, opts?: { compact?: boolean }): string {
  if (opts?.compact && Math.abs(value) >= 1000) {
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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
      initial={{ opacity: 0, y: 6 }}
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

interface AnalyticsHeroProps {
  analytics: PortfolioAnalytics;
  totalDeposited: number;
  dcaPlansCount: number;
  onConnect: () => void;
}

export function AnalyticsHero({
  analytics,
  totalDeposited,
  dcaPlansCount,
  onConnect,
}: AnalyticsHeroProps) {
  const isConnected = analytics.isConnected;
  const isPositive = analytics.pnlPercent >= 0;
  const PnlIcon = isPositive ? ArrowUpRight : ArrowDownRight;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  // When not connected, totalInvested fallbacks to dca-tracked deposits only
  const totalInvested = isConnected
    ? totalDeposited + analytics.totalDCAInvested
    : analytics.totalDCAInvested;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'relative overflow-hidden rounded-3xl border border-white/[0.08]',
        'apice-shadow-elevated p-5 md:p-6',
        isPositive && isConnected
          ? 'bg-gradient-to-br from-[hsl(var(--apice-emerald))]/[0.08] via-white/[0.02] to-transparent'
          : !isPositive && isConnected
            ? 'bg-gradient-to-br from-red-500/[0.06] via-white/[0.02] to-transparent'
            : 'bg-gradient-to-br from-blue-500/[0.05] via-white/[0.02] to-transparent',
      )}
    >
      {/* Decorative glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-14 -top-20 h-56 w-56 rounded-full blur-[80px]"
        style={{
          background: isPositive && isConnected
            ? 'hsl(var(--apice-emerald) / 0.14)'
            : !isPositive && isConnected
              ? 'rgb(239 68 68 / 0.10)'
              : 'rgb(59 130 246 / 0.10)',
        }}
      />

      <div className="relative">
        {/* Hero number row */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Wallet className="h-3.5 w-3.5 text-white/55" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/55 font-semibold">
                {isConnected ? 'Total portfolio value' : 'Portfolio not connected'}
              </span>
            </div>
            <motion.h1
              key={analytics.grandTotal}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-4xl md:text-5xl font-bold text-white tracking-tight tabular-nums leading-none"
            >
              {isConnected ? fmt(analytics.grandTotal) : '$—'}
            </motion.h1>
            {isConnected ? (
              <div className="flex items-center gap-2 mt-2.5">
                <div
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 border',
                    isPositive
                      ? 'bg-[hsl(var(--apice-emerald))]/15 border-[hsl(var(--apice-emerald))]/25 text-[hsl(var(--apice-emerald))]'
                      : 'bg-red-500/15 border-red-500/25 text-red-400',
                  )}
                >
                  <PnlIcon className="h-3 w-3" />
                  <span className="text-xs font-bold tabular-nums">
                    {isPositive ? '+' : ''}{analytics.pnlPercent.toFixed(2)}%
                  </span>
                </div>
                <span className="text-xs text-white/55 tabular-nums">
                  {fmt(analytics.totalUnrealizedPnL)} unrealized
                </span>
              </div>
            ) : (
              <p className="text-xs text-white/50 mt-2">
                Connect Bybit to see live P&L, holdings, and performance.
              </p>
            )}
          </div>

          {!isConnected && (
            <button
              type="button"
              onClick={onConnect}
              className={cn(
                'shrink-0 inline-flex items-center gap-2 rounded-xl px-4 h-10',
                'bg-[hsl(var(--apice-emerald))] text-[#050816] text-[13px] font-semibold',
                'hover:bg-[hsl(var(--apice-emerald))]/90 transition-colors',
              )}
            >
              <Zap className="h-4 w-4" />
              Connect Bybit
            </button>
          )}

          {isConnected && (
            <div className="flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 border border-white/[0.08] shrink-0">
              <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--apice-emerald))] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                {analytics.isTestnet ? 'Testnet' : 'Live'}
              </span>
            </div>
          )}
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <KpiPill
            icon={<DollarSign className="h-4 w-4 text-blue-400" />}
            label="Invested"
            value={totalInvested > 0 ? fmt(totalInvested, { compact: true }) : '—'}
            accent="bg-blue-500/15"
            delay={0.05}
          />
          <KpiPill
            icon={<TrendIcon className={cn('h-4 w-4', isPositive ? 'text-[hsl(var(--apice-emerald))]' : 'text-red-400')} />}
            label="P&L"
            value={isConnected ? `${isPositive ? '+' : ''}${fmt(analytics.totalUnrealizedPnL, { compact: true })}` : '—'}
            accent={isPositive ? 'bg-[hsl(var(--apice-emerald))]/15' : 'bg-red-500/15'}
            delay={0.10}
          />
          <KpiPill
            icon={<Zap className="h-4 w-4 text-violet-400" />}
            label="DCA Active"
            value={String(analytics.activeDCAPlans)}
            accent="bg-violet-500/15"
            delay={0.15}
          />
          <KpiPill
            icon={<Activity className="h-4 w-4 text-amber-400" />}
            label="Holdings"
            value={isConnected ? String(analytics.spotCount) : `${dcaPlansCount} plans`}
            accent="bg-amber-500/15"
            delay={0.20}
          />
        </div>
      </div>
    </motion.section>
  );
}
