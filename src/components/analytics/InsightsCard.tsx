import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb, TrendingUp, TrendingDown, Calendar, Target,
  ShieldCheck, Flame, Zap,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { DCAExecution } from '@/hooks/useDCAExecution';
import type { PortfolioSnapshot } from '@/hooks/usePortfolioHistory';
import type { PortfolioAnalytics } from '@/hooks/usePortfolioAnalytics';
import { cn } from '@/lib/utils';

interface InsightsCardProps {
  analytics: PortfolioAnalytics;
  executions: DCAExecution[];
  snapshots: PortfolioSnapshot[];
}

interface Insight {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: 'positive' | 'neutral' | 'negative';
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

export function InsightsCard({ analytics, executions, snapshots }: InsightsCardProps) {
  const insights = useMemo<Insight[]>(() => {
    const out: Insight[] = [];
    const successExec = executions.filter((e) => e.status === 'success');
    const failedExec = executions.filter((e) => e.status === 'failed');
    const totalExec = successExec.length + failedExec.length;
    const winRate = totalExec > 0 ? (successExec.length / totalExec) * 100 : 0;

    // 1. Overall return
    if (analytics.isConnected) {
      const positive = analytics.pnlPercent >= 0;
      out.push({
        id: 'return',
        icon: positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />,
        label: 'Total return',
        value: `${positive ? '+' : ''}${analytics.pnlPercent.toFixed(2)}%`,
        detail: `${positive ? '+' : ''}${fmt(analytics.totalUnrealizedPnL)} unrealized`,
        tone: positive ? 'positive' : 'negative',
      });
    }

    // 2. Best day (snapshots)
    if (snapshots.length > 1) {
      const best = snapshots.reduce((b, s) => (s.totalValue > b.totalValue ? s : b), snapshots[0]);
      out.push({
        id: 'best-day',
        icon: <Flame className="h-3.5 w-3.5" />,
        label: 'Peak value',
        value: fmt(best.totalValue, { compact: true }),
        detail: new Date(best.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tone: 'positive',
      });
    }

    // 3. DCA win rate
    if (totalExec > 0) {
      out.push({
        id: 'win-rate',
        icon: <ShieldCheck className="h-3.5 w-3.5" />,
        label: 'Execution rate',
        value: `${winRate.toFixed(0)}%`,
        detail: `${successExec.length}/${totalExec} successful`,
        tone: winRate >= 95 ? 'positive' : winRate >= 80 ? 'neutral' : 'negative',
      });
    }

    // 4. Avg buy size
    if (successExec.length > 0) {
      const avgUsdt = successExec.reduce((s, e) => s + (e.amount_usdt ?? 0), 0) / successExec.length;
      out.push({
        id: 'avg-size',
        icon: <Target className="h-3.5 w-3.5" />,
        label: 'Avg DCA size',
        value: fmt(avgUsdt),
        detail: `Across ${successExec.length} buys`,
        tone: 'neutral',
      });
    }

    // 5. Total deployed
    if (analytics.totalDCAInvested > 0) {
      out.push({
        id: 'deployed',
        icon: <Zap className="h-3.5 w-3.5" />,
        label: 'DCA deployed',
        value: fmt(analytics.totalDCAInvested, { compact: true }),
        detail: `${analytics.activeDCAPlans} active plans`,
        tone: 'neutral',
      });
    }

    // 6. Cadence (most active asset)
    if (successExec.length > 0) {
      const byAsset = new Map<string, number>();
      for (const e of successExec) {
        byAsset.set(e.asset_symbol, (byAsset.get(e.asset_symbol) ?? 0) + 1);
      }
      const sorted = Array.from(byAsset.entries()).sort((a, b) => b[1] - a[1]);
      if (sorted[0]) {
        out.push({
          id: 'most-active',
          icon: <Calendar className="h-3.5 w-3.5" />,
          label: 'Most accumulated',
          value: sorted[0][0],
          detail: `${sorted[0][1]} buys`,
          tone: 'neutral',
        });
      }
    }

    return out;
  }, [analytics, executions, snapshots]);

  if (insights.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-primary" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
              Insights
            </h3>
            <p className="text-[11px] text-muted-foreground">Auto-derived from your data</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {insights.map((i, idx) => (
            <motion.div
              key={i.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-md',
                  i.tone === 'positive' ? 'bg-emerald-500/15 text-emerald-400'
                    : i.tone === 'negative' ? 'bg-red-500/15 text-red-400'
                    : 'bg-blue-500/15 text-blue-400',
                )}>
                  {i.icon}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {i.label}
                </span>
              </div>
              <p className={cn(
                'text-base font-bold tabular-nums',
                i.tone === 'positive' ? 'text-emerald-400'
                  : i.tone === 'negative' ? 'text-red-400'
                  : 'text-foreground',
              )}>
                {i.value}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {i.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
