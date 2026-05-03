import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { DCAExecution } from '@/hooks/useDCAExecution';
import { cn } from '@/lib/utils';

const WEEKS = 12;

interface DayCell {
  date: string;
  count: number;
  totalUsdt: number;
  successCount: number;
  failedCount: number;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface DCAExecutionHeatmapProps {
  executions: DCAExecution[];
}

export function DCAExecutionHeatmap({ executions }: DCAExecutionHeatmapProps) {
  const { weeks, totals } = useMemo(() => {
    const grouped = new Map<string, { count: number; usdt: number; success: number; failed: number }>();
    for (const exec of executions) {
      const key = exec.executed_at.slice(0, 10);
      const existing = grouped.get(key) ?? { count: 0, usdt: 0, success: 0, failed: 0 };
      existing.count += 1;
      existing.usdt += exec.amount_usdt ?? 0;
      if (exec.status === 'success') existing.success += 1;
      else if (exec.status === 'failed') existing.failed += 1;
      grouped.set(key, existing);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = startOfWeek(today);
    const startDate = new Date(weekStart);
    startDate.setDate(startDate.getDate() - 7 * (WEEKS - 1));

    const weeksData: DayCell[][] = [];
    let totalCount = 0;
    let totalUsdt = 0;
    let activeDays = 0;

    for (let w = 0; w < WEEKS; w++) {
      const days: DayCell[] = [];
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(cellDate.getDate() + w * 7 + d);
        if (cellDate > today) {
          days.push({ date: dayKey(cellDate), count: 0, totalUsdt: 0, successCount: 0, failedCount: 0 });
          continue;
        }
        const key = dayKey(cellDate);
        const stats = grouped.get(key);
        if (stats) {
          totalCount += stats.count;
          totalUsdt += stats.usdt;
          activeDays += 1;
        }
        days.push({
          date: key,
          count: stats?.count ?? 0,
          totalUsdt: stats?.usdt ?? 0,
          successCount: stats?.success ?? 0,
          failedCount: stats?.failed ?? 0,
        });
      }
      weeksData.push(days);
    }

    return {
      weeks: weeksData,
      totals: {
        totalCount,
        totalUsdt,
        activeDays,
      },
    };
  }, [executions]);

  const maxCount = useMemo(() => {
    return Math.max(1, ...weeks.flat().map((d) => d.count));
  }, [weeks]);

  function intensity(count: number): string {
    if (count === 0) return 'bg-white/[0.04]';
    const ratio = count / maxCount;
    if (ratio < 0.25) return 'bg-[hsl(var(--apice-emerald))]/20';
    if (ratio < 0.5) return 'bg-[hsl(var(--apice-emerald))]/40';
    if (ratio < 0.75) return 'bg-[hsl(var(--apice-emerald))]/65';
    return 'bg-[hsl(var(--apice-emerald))]';
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                Execution Activity
              </h3>
              <p className="text-[11px] text-muted-foreground">{WEEKS} weeks rolling</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold tabular-nums">{totals.totalCount}</p>
            <p className="text-[11px] text-muted-foreground">{totals.activeDays} active days</p>
          </div>
        </div>

        {/* Heatmap grid */}
        <div className="overflow-x-auto pb-1">
          <div className="flex items-start gap-1 min-w-max">
            <div className="flex flex-col gap-1 pt-0.5 pr-1">
              {dayLabels.map((label, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-3 text-[9px] text-muted-foreground/60 leading-3',
                    i % 2 === 0 ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  {label}
                </span>
              ))}
            </div>

            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => {
                  const isFuture = new Date(day.date) > new Date();
                  return (
                    <motion.div
                      key={day.date}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: isFuture ? 0.3 : 1, scale: 1 }}
                      transition={{ delay: (wi * 7 + di) * 0.005 }}
                      className={cn(
                        'h-3 w-3 rounded-sm transition-all hover:ring-1 hover:ring-white/30 cursor-default',
                        isFuture ? 'bg-transparent border border-white/[0.04]' : intensity(day.count),
                      )}
                      title={
                        day.count === 0
                          ? `${day.date} — no executions`
                          : `${day.date} — ${day.count} exec${day.count === 1 ? '' : 's'} · $${day.totalUsdt.toFixed(2)}${day.failedCount > 0 ? ` · ${day.failedCount} failed` : ''}`
                      }
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer: totals + legend */}
        <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground tabular-nums">
            Total volume: <span className="font-bold text-foreground/80">${totals.totalUsdt.toFixed(2)}</span>
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Less</span>
            <div className="h-2.5 w-2.5 rounded-sm bg-white/[0.04]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[hsl(var(--apice-emerald))]/20" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[hsl(var(--apice-emerald))]/40" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[hsl(var(--apice-emerald))]/65" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[hsl(var(--apice-emerald))]" />
            <span className="text-[10px] text-muted-foreground">More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
