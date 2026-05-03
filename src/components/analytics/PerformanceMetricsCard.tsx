import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, TrendingUp, TrendingDown, ShieldCheck, Gauge,
  ArrowDown, Sparkles, Calendar,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { PortfolioSnapshot } from '@/hooks/usePortfolioHistory';
import type { PortfolioAnalytics } from '@/hooks/usePortfolioAnalytics';
import { cn } from '@/lib/utils';

interface PerfMetric {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: 'positive' | 'neutral' | 'negative';
  hint?: string;
}

function fmt(v: number, opts?: { compact?: boolean }) {
  if (opts?.compact && Math.abs(v) >= 1000) {
    return v.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    });
  }
  return v.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

interface PerformanceMetricsCardProps {
  analytics: PortfolioAnalytics;
  snapshots: PortfolioSnapshot[];
}

export function PerformanceMetricsCard({ analytics, snapshots }: PerformanceMetricsCardProps) {
  const metrics = useMemo<PerfMetric[]>(() => {
    const out: PerfMetric[] = [];

    // 1. Total return (always present when connected)
    if (analytics.isConnected) {
      const positive = analytics.pnlPercent >= 0;
      out.push({
        id: 'total-return',
        icon: positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />,
        label: 'Total Return',
        value: `${positive ? '+' : ''}${analytics.pnlPercent.toFixed(2)}%`,
        detail: `${positive ? '+' : ''}${fmt(analytics.totalUnrealizedPnL, { compact: true })}`,
        tone: positive ? 'positive' : 'negative',
        hint: 'Unrealized P&L vs cost basis',
      });
    }

    // Compute snapshot-derived metrics
    const validSnapshots = snapshots.filter((s) => s.totalValue > 0);

    if (validSnapshots.length >= 2) {
      const first = validSnapshots[0];
      const last = validSnapshots[validSnapshots.length - 1];

      // 2. Period return
      const periodReturn = ((last.totalValue - first.totalValue) / first.totalValue) * 100;
      out.push({
        id: 'period-return',
        icon: <Calendar className="h-3.5 w-3.5" />,
        label: `${validSnapshots.length}-day Return`,
        value: `${periodReturn >= 0 ? '+' : ''}${periodReturn.toFixed(2)}%`,
        detail: `${first.date.slice(5)} → ${last.date.slice(5)}`,
        tone: periodReturn >= 0 ? 'positive' : 'negative',
        hint: 'Change since first snapshot',
      });

      // 3. Max drawdown
      let peak = validSnapshots[0].totalValue;
      let maxDD = 0;
      for (const s of validSnapshots) {
        if (s.totalValue > peak) peak = s.totalValue;
        const dd = peak > 0 ? ((s.totalValue - peak) / peak) * 100 : 0;
        if (dd < maxDD) maxDD = dd;
      }
      out.push({
        id: 'max-dd',
        icon: <ArrowDown className="h-3.5 w-3.5" />,
        label: 'Max Drawdown',
        value: `${maxDD.toFixed(2)}%`,
        detail: maxDD === 0 ? 'No drawdown' : 'From peak to trough',
        tone: maxDD < -10 ? 'negative' : maxDD < -3 ? 'neutral' : 'positive',
        hint: 'Largest peak-to-trough decline',
      });

      // 4. Volatility (stddev of daily returns)
      if (validSnapshots.length >= 4) {
        const dailyReturns: number[] = [];
        for (let i = 1; i < validSnapshots.length; i++) {
          const prev = validSnapshots[i - 1].totalValue;
          const curr = validSnapshots[i].totalValue;
          if (prev > 0) {
            dailyReturns.push(((curr - prev) / prev) * 100);
          }
        }
        const avg = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length;
        const variance =
          dailyReturns.reduce((s, r) => s + (r - avg) ** 2, 0) / dailyReturns.length;
        const volatility = Math.sqrt(variance);
        out.push({
          id: 'volatility',
          icon: <Gauge className="h-3.5 w-3.5" />,
          label: 'Volatility',
          value: `${volatility.toFixed(2)}%`,
          detail: `Daily σ over ${dailyReturns.length}d`,
          tone: volatility > 5 ? 'negative' : volatility > 2 ? 'neutral' : 'positive',
          hint: 'Standard deviation of daily returns',
        });

        // 5. Sharpe approximation (avg return / volatility)
        const sharpe = volatility > 0 ? avg / volatility : 0;
        out.push({
          id: 'sharpe',
          icon: <ShieldCheck className="h-3.5 w-3.5" />,
          label: 'Sharpe (approx)',
          value: sharpe.toFixed(2),
          detail: sharpe > 1 ? 'Strong risk-adjusted' : sharpe > 0 ? 'Positive risk-adjusted' : 'Below break-even',
          tone: sharpe > 1 ? 'positive' : sharpe > 0 ? 'neutral' : 'negative',
          hint: 'Avg daily return ÷ daily volatility',
        });
      }

      // 6. Days in profit
      const initialInvested = first.invested || first.totalValue;
      const inProfit = validSnapshots.filter((s) => s.totalValue >= initialInvested).length;
      const inProfitPct = (inProfit / validSnapshots.length) * 100;
      out.push({
        id: 'days-profit',
        icon: <Sparkles className="h-3.5 w-3.5" />,
        label: 'Days in Profit',
        value: `${inProfit}/${validSnapshots.length}`,
        detail: `${inProfitPct.toFixed(0)}% of tracked days`,
        tone: inProfitPct >= 60 ? 'positive' : inProfitPct >= 40 ? 'neutral' : 'negative',
        hint: 'Days where value ≥ initial invested',
      });
    }

    // 7. Activity metric (always)
    if (analytics.spotCount > 0) {
      out.push({
        id: 'diversification',
        icon: <Activity className="h-3.5 w-3.5" />,
        label: 'Diversification',
        value: String(analytics.spotCount),
        detail: `${analytics.spotCount} positions held`,
        tone: analytics.spotCount >= 4 ? 'positive' : analytics.spotCount >= 2 ? 'neutral' : 'negative',
        hint: 'More positions = lower concentration risk',
      });
    }

    return out;
  }, [analytics, snapshots]);

  if (metrics.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-primary" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                Performance Metrics
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Risk-adjusted returns & quant signals
              </p>
            </div>
          </div>
          {snapshots.length < 4 && (
            <span className="text-[10px] text-amber-400/80 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              Building dataset
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {metrics.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3 group relative"
              title={m.hint}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-md',
                  m.tone === 'positive' ? 'bg-emerald-500/15 text-emerald-400'
                    : m.tone === 'negative' ? 'bg-red-500/15 text-red-400'
                    : 'bg-blue-500/15 text-blue-400',
                )}>
                  {m.icon}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold truncate">
                  {m.label}
                </span>
              </div>
              <p className={cn(
                'text-base font-bold tabular-nums',
                m.tone === 'positive' ? 'text-emerald-400'
                  : m.tone === 'negative' ? 'text-red-400'
                  : 'text-foreground',
              )}>
                {m.value}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {m.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
