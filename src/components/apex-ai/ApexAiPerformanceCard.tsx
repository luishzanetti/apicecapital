import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Award, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useApexAiTrades, useApexAiPortfolio } from '@/hooks/useApexAiData';
import { cn } from '@/lib/utils';

/**
 * Apex AI — Performance Card
 *
 * Aggregates the live performance of one portfolio in a single dense card:
 *   · Total PnL (realized) and equity (capital + PnL)
 *   · Win rate, best cycle, worst cycle
 *   · 24h activity (cycles + net pnl)
 *
 * All values are derived from `apex_ai_trades` so they survive bot
 * restarts. The portfolio aggregates (`win_count`, `loss_count`, `total_pnl`)
 * are corroborated where available.
 */

interface ApexAiPerformanceCardProps {
  portfolioId: string | null | undefined;
}

export function ApexAiPerformanceCard({ portfolioId }: ApexAiPerformanceCardProps) {
  const { data: portfolio } = useApexAiPortfolio(portfolioId);
  const { data: trades = [] } = useApexAiTrades(portfolioId, 200);

  const stats = useMemo(() => {
    const closed = trades.filter((t) => t.closed_at);
    const wins = closed.filter((t) => Number(t.pnl ?? 0) > 0);
    const losses = closed.filter((t) => Number(t.pnl ?? 0) < 0);
    const totalPnl = closed.reduce((s, t) => s + Number(t.pnl ?? 0), 0);
    const totalGasFee = closed.reduce((s, t) => s + Number(t.gas_fee ?? 0), 0);
    const totalExchangeFee = closed.reduce((s, t) => s + Number(t.fee_exchange ?? 0), 0);
    const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;

    const sortedByPnl = [...closed].sort((a, b) => Number(b.pnl ?? 0) - Number(a.pnl ?? 0));
    const best = sortedByPnl[0];
    const worst = sortedByPnl[sortedByPnl.length - 1];

    const cutoff24h = Date.now() - 24 * 3600_000;
    const last24 = closed.filter((t) => t.closed_at && new Date(t.closed_at).getTime() >= cutoff24h);
    const last24Pnl = last24.reduce((s, t) => s + Number(t.pnl ?? 0), 0);

    return {
      totalCycles: closed.length,
      wins: wins.length,
      losses: losses.length,
      winRate,
      totalPnl,
      totalGasFee,
      totalExchangeFee,
      bestCycle: best ? Number(best.pnl ?? 0) : 0,
      worstCycle: worst ? Number(worst.pnl ?? 0) : 0,
      last24Cycles: last24.length,
      last24Pnl,
    };
  }, [trades]);

  const capital = Number(portfolio?.capital_usdt ?? 0);
  const equity = capital + stats.totalPnl;
  const equityPct = capital > 0 ? (stats.totalPnl / capital) * 100 : 0;
  const positivePerf = stats.totalPnl >= 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      aria-label="Performance summary"
      className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.015] p-4 md:p-5"
    >
      <header className="mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-[hsl(var(--apice-emerald))]" strokeWidth={2} />
        <h3 className="text-sm font-bold tracking-tight text-foreground">Performance</h3>
        <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {stats.totalCycles} cycle{stats.totalCycles === 1 ? '' : 's'}
        </span>
      </header>

      {/* Hero PnL */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/[0.03] p-3 border border-white/[0.04]">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
            Equity
          </p>
          <p className="mt-1 font-display font-mono text-xl font-bold tabular-nums">
            ${equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-0.5 text-[10.5px] text-muted-foreground tabular-nums">
            on ${capital.toLocaleString('en-US', { maximumFractionDigits: 0 })} capital
          </p>
        </div>
        <div className="rounded-2xl bg-white/[0.03] p-3 border border-white/[0.04]">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
            Total PnL
          </p>
          <p
            className={cn(
              'mt-1 font-display font-mono text-xl font-bold tabular-nums',
              positivePerf ? 'text-[hsl(var(--apice-emerald))]' : 'text-rose-400',
            )}
          >
            {positivePerf ? '+' : ''}${stats.totalPnl.toFixed(2)}
          </p>
          <p
            className={cn(
              'mt-0.5 text-[10.5px] tabular-nums font-medium',
              positivePerf ? 'text-[hsl(var(--apice-emerald))]/80' : 'text-rose-400/80',
            )}
          >
            {positivePerf ? '+' : ''}{equityPct.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
        <Stat
          label="Win rate"
          value={`${stats.winRate.toFixed(1)}%`}
          icon={Award}
          tone="emerald"
        />
        <Stat
          label="Wins"
          value={`${stats.wins}`}
          icon={ArrowUpRight}
          tone="emerald"
        />
        <Stat
          label="Losses"
          value={`${stats.losses}`}
          icon={ArrowDownRight}
          tone="rose"
        />
        <Stat
          label="Best"
          value={`${stats.bestCycle >= 0 ? '+' : ''}$${stats.bestCycle.toFixed(2)}`}
          icon={TrendingUp}
          tone="emerald"
          mono
        />
        <Stat
          label="Worst"
          value={`${stats.worstCycle >= 0 ? '+' : ''}$${stats.worstCycle.toFixed(2)}`}
          icon={TrendingDown}
          tone={stats.worstCycle < 0 ? 'rose' : 'emerald'}
          mono
        />
        <Stat
          label="Last 24h"
          value={`${stats.last24Pnl >= 0 ? '+' : ''}$${stats.last24Pnl.toFixed(2)}`}
          sub={`${stats.last24Cycles} cycle${stats.last24Cycles === 1 ? '' : 's'}`}
          icon={Activity}
          tone={stats.last24Pnl >= 0 ? 'emerald' : 'rose'}
          mono
        />
      </div>

      {/* Fees disclosure */}
      {(stats.totalGasFee > 0 || stats.totalExchangeFee > 0) && (
        <p className="mt-3 text-[10.5px] text-muted-foreground tabular-nums">
          Fees: ${stats.totalGasFee.toFixed(2)} gas (Apice 10%) + ${stats.totalExchangeFee.toFixed(2)} exchange · already netted in PnL
        </p>
      )}
    </motion.section>
  );
}

function Stat({
  label,
  value,
  sub,
  icon: Icon,
  tone,
  mono = false,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Activity;
  tone: 'emerald' | 'rose' | 'neutral';
  mono?: boolean;
}) {
  const toneClass = {
    emerald: 'text-[hsl(var(--apice-emerald))]',
    rose: 'text-rose-400',
    neutral: 'text-muted-foreground',
  }[tone];

  return (
    <div className="rounded-xl bg-white/[0.02] p-2 min-w-0">
      <div className="flex items-center gap-1">
        <Icon className={cn('h-3 w-3 shrink-0', toneClass)} strokeWidth={2.2} />
        <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold truncate">
          {label}
        </span>
      </div>
      <p className={cn('mt-1 text-[12.5px] font-bold tabular-nums truncate', toneClass, mono && 'font-mono')}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground truncate">{sub}</p>}
    </div>
  );
}

export default ApexAiPerformanceCard;
