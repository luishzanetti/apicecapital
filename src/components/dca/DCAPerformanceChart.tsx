import { useState, useEffect, useMemo } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useDCAExecution } from '@/hooks/useDCAExecution';
import type { DCAExecution } from '@/hooks/useDCAExecution';
import { cn } from '@/lib/utils';

interface ChartPoint {
  date: string;
  cumulative: number;
}

function buildCumulativeData(executions: DCAExecution[]): ChartPoint[] {
  if (executions.length === 0) return [];

  // Sort ascending by date
  const sorted = [...executions]
    .filter((e) => e.status === 'success')
    .sort(
      (a, b) =>
        new Date(a.executed_at).getTime() - new Date(b.executed_at).getTime(),
    );

  // Group by date (YYYY-MM-DD) and compute cumulative sum
  const grouped = new Map<string, number>();
  for (const exec of sorted) {
    const dateKey = exec.executed_at.slice(0, 10);
    grouped.set(dateKey, (grouped.get(dateKey) ?? 0) + exec.amount_usdt);
  }

  let cumulative = 0;
  const points: ChartPoint[] = [];
  for (const [date, amount] of grouped) {
    cumulative += amount;
    points.push({ date, cumulative });
  }

  return points;
}

export function DCAPerformanceChart() {
  const { fetchHistory } = useDCAExecution();
  const [executions, setExecutions] = useState<DCAExecution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchHistory(undefined, 100);
        if (!cancelled) setExecutions(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fetchHistory]);

  const chartData = useMemo(() => buildCumulativeData(executions), [executions]);

  if (loading) {
    return (
      <div
        className={cn(
          'h-[180px] md:h-[220px] rounded-xl',
          'bg-white/5 backdrop-blur-md border border-white/10',
          'flex items-center justify-center',
        )}
      >
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div
        className={cn(
          'h-[180px] md:h-[220px] rounded-xl',
          'bg-white/5 backdrop-blur-md border border-white/10',
          'flex flex-col items-center justify-center gap-2 px-6 text-center',
        )}
      >
        <TrendingUp className="h-8 w-8 text-white/20" />
        <p className="text-sm text-white/40">
          No executions yet — your DCA buys will appear here
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'h-[180px] md:h-[220px] rounded-xl p-4',
        'bg-white/5 backdrop-blur-md border border-white/10',
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-emerald-400" />
        <span className="text-xs font-medium text-white/60">
          Cumulative Investment
        </span>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="dcaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <YAxis
            hide
            domain={['dataMin', 'dataMax']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 15, 20, 0.9)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#fff',
            }}
            formatter={(value: number) => [
              `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
              'Total',
            ]}
            labelFormatter={(label: string) => label}
          />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#dcaGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
