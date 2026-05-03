import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { dcaAssets } from '@/data/sampleData';
import type { DCAExecution } from '@/hooks/useDCAExecution';
import { cn } from '@/lib/utils';

interface AssetStat {
  symbol: string;
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  totalUsdt: number;
  color: string;
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

interface SuccessRateByAssetCardProps {
  executions: DCAExecution[];
}

export function SuccessRateByAssetCard({ executions }: SuccessRateByAssetCardProps) {
  const stats = useMemo<AssetStat[]>(() => {
    const grouped = new Map<string, { total: number; success: number; failed: number; usdt: number }>();
    for (const exec of executions) {
      const existing = grouped.get(exec.asset_symbol) ?? { total: 0, success: 0, failed: 0, usdt: 0 };
      existing.total += 1;
      if (exec.status === 'success') {
        existing.success += 1;
        existing.usdt += exec.amount_usdt ?? 0;
      } else if (exec.status === 'failed') {
        existing.failed += 1;
      }
      grouped.set(exec.asset_symbol, existing);
    }

    return Array.from(grouped.entries())
      .map(([symbol, s]) => {
        const meta = dcaAssets.find((a) => a.symbol === symbol);
        return {
          symbol,
          total: s.total,
          successful: s.success,
          failed: s.failed,
          successRate: s.total > 0 ? (s.success / s.total) * 100 : 0,
          totalUsdt: s.usdt,
          color: meta?.color ?? 'hsl(220 12% 60%)',
        };
      })
      .sort((a, b) => b.totalUsdt - a.totalUsdt || b.total - a.total);
  }, [executions]);

  if (stats.length === 0) return null;

  const totalSuccess = stats.reduce((s, a) => s + a.successful, 0);
  const totalFailed = stats.reduce((s, a) => s + a.failed, 0);
  const overallRate = totalSuccess + totalFailed > 0
    ? (totalSuccess / (totalSuccess + totalFailed)) * 100
    : 0;

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                Success Rate by Asset
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {stats.length} assets · {totalSuccess + totalFailed} executions
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={cn(
              'text-lg font-bold tabular-nums',
              overallRate >= 95 ? 'text-emerald-400'
                : overallRate >= 80 ? 'text-amber-400'
                : 'text-red-400',
            )}>
              {overallRate.toFixed(0)}%
            </p>
            <p className="text-[11px] text-muted-foreground">overall</p>
          </div>
        </div>

        <div className="space-y-2">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.symbol}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-2.5"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
                  >
                    <span className="text-[10px] font-bold">{stat.symbol.slice(0, 3)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{stat.symbol}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground tabular-nums">
                      <span className="inline-flex items-center gap-0.5 text-emerald-400">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        {stat.successful}
                      </span>
                      {stat.failed > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-red-400">
                          <XCircle className="h-2.5 w-2.5" />
                          {stat.failed}
                        </span>
                      )}
                      <span>·</span>
                      <span>{fmt(stat.totalUsdt, { compact: true })}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={cn(
                    'inline-block px-2 py-0.5 rounded-md text-[11px] font-bold tabular-nums',
                    stat.successRate >= 95
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : stat.successRate >= 80
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-red-500/15 text-red-400',
                  )}>
                    {stat.successRate.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Mini stacked bar */}
              <div className="flex h-1.5 rounded-full overflow-hidden bg-white/[0.04]">
                <motion.div
                  className="h-full bg-emerald-500/70"
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.successRate}%` }}
                  transition={{ duration: 0.5, delay: 0.05 + i * 0.04 }}
                />
                {stat.failed > 0 && (
                  <motion.div
                    className="h-full bg-red-500/60"
                    initial={{ width: 0 }}
                    animate={{ width: `${100 - stat.successRate}%` }}
                    transition={{ duration: 0.5, delay: 0.1 + i * 0.04 }}
                  />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
