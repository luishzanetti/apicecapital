import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceDot,
} from 'recharts';
import { TrendingUp, ArrowUpRight, ArrowDownRight, DollarSign, Calendar, Activity } from 'lucide-react';
import { useDCAExecution } from '@/hooks/useDCAExecution';
import type { DCAExecution } from '@/hooks/useDCAExecution';
import { useDCAStats } from '@/hooks/useDCAStats';
import { cn } from '@/lib/utils';

interface ChartPoint {
  date: string;
  label: string;
  cumulative: number;
  dayAmount: number;
  execCount: number;
}

function fmt(v: number) {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildCumulativeData(executions: DCAExecution[]): ChartPoint[] {
  if (executions.length === 0) return [];

  const sorted = [...executions]
    .filter((e) => e.status === 'success')
    .sort((a, b) => new Date(a.executed_at).getTime() - new Date(b.executed_at).getTime());

  const grouped = new Map<string, { amount: number; count: number }>();
  for (const exec of sorted) {
    const dateKey = exec.executed_at.slice(0, 10);
    const existing = grouped.get(dateKey) ?? { amount: 0, count: 0 };
    grouped.set(dateKey, { amount: existing.amount + exec.amount_usdt, count: existing.count + 1 });
  }

  let cumulative = 0;
  const points: ChartPoint[] = [];
  for (const [date, { amount, count }] of grouped) {
    cumulative += amount;
    const d = new Date(date);
    points.push({
      date,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      cumulative: Math.round(cumulative * 100) / 100,
      dayAmount: Math.round(amount * 100) / 100,
      execCount: count,
    });
  }

  return points;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload as ChartPoint;
  return (
    <div className="rounded-xl bg-zinc-900/95 border border-white/10 px-3 py-2.5 shadow-xl backdrop-blur-md">
      <p className="text-xs text-white/50 mb-1">{data.date}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] text-white/60">Total invested</span>
          <span className="text-xs font-bold text-white">{fmt(data.cumulative)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] text-white/60">This day</span>
          <span className="text-[11px] font-semibold text-emerald-400">+{fmt(data.dayAmount)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] text-white/60">Executions</span>
          <span className="text-[11px] text-white/80">{data.execCount}</span>
        </div>
      </div>
    </div>
  );
}

export function DCAPerformanceChart() {
  const { fetchHistory } = useDCAExecution();
  const stats = useDCAStats();
  const [executions, setExecutions] = useState<DCAExecution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchHistory(undefined, 200);
        if (!cancelled) setExecutions(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [fetchHistory]);

  const chartData = useMemo(() => buildCumulativeData(executions), [executions]);

  const totalExecs = executions.filter(e => e.status === 'success').length;
  const failedExecs = executions.filter(e => e.status === 'failed').length;
  const latestAmount = chartData.length > 0 ? chartData[chartData.length - 1].cumulative : 0;
  const avgPerExec = totalExecs > 0 ? latestAmount / totalExecs : 0;

  // Loading skeleton
  if (loading) {
    return (
      <div className="rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.06] p-4 md:p-5">
        <div className="animate-pulse space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-emerald-500/20" />
            <div className="h-3 w-32 rounded bg-white/10" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="h-12 rounded-xl bg-white/5" />
            <div className="h-12 rounded-xl bg-white/5" />
            <div className="h-12 rounded-xl bg-white/5" />
          </div>
          <div className="h-[180px] rounded-xl bg-white/5" />
        </div>
      </div>
    );
  }

  // Empty state
  if (chartData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.06] p-6 md:p-8"
      >
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="h-7 w-7 text-emerald-500/40" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/60">No execution data yet</p>
            <p className="text-xs text-white/30 mt-1 max-w-[260px]">
              Create a DCA plan and execute your first buy — your investment growth will appear here.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.06] overflow-hidden"
    >
      {/* Header + Mini Stats */}
      <div className="p-4 md:p-5 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white/80">DCA Performance</p>
              <p className="text-xs text-white/30">Cumulative investment over time</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-white">{fmt(latestAmount)}</p>
            <p className="text-xs text-white/40">{totalExecs} executions</p>
          </div>
        </div>

        {/* Mini stat pills */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-2.5 py-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <DollarSign className="w-3 h-3 text-emerald-400/60" />
              <span className="text-xs uppercase tracking-wider text-white/40 font-semibold">Avg / Exec</span>
            </div>
            <p className="text-xs font-bold text-white">{fmt(avgPerExec)}</p>
          </div>
          <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-2.5 py-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Calendar className="w-3 h-3 text-blue-400/60" />
              <span className="text-xs uppercase tracking-wider text-white/40 font-semibold">Monthly</span>
            </div>
            <p className="text-xs font-bold text-white">{fmt(stats.monthlyCommitment)}</p>
          </div>
          <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-2.5 py-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Activity className="w-3 h-3 text-amber-400/60" />
              <span className="text-xs uppercase tracking-wider text-white/40 font-semibold">Success</span>
            </div>
            <p className="text-xs font-bold text-white">
              {totalExecs > 0 ? `${Math.round((totalExecs / (totalExecs + failedExecs)) * 100)}%` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px] md:h-[240px] w-full px-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="dcaPerfGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#10b981" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <filter id="dcaGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid
              strokeDasharray="3 6"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.25)' }}
              interval="preserveStartEnd"
              minTickGap={40}
            />

            <YAxis
              hide
              domain={[(dataMin: number) => Math.max(0, dataMin * 0.9), 'dataMax']}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: 'rgba(16, 185, 129, 0.2)',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
            />

            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#dcaPerfGrad)"
              dot={false}
              activeDot={{
                r: 5,
                fill: '#10b981',
                stroke: '#10b981',
                strokeWidth: 2,
                strokeOpacity: 0.3,
                filter: 'url(#dcaGlow)',
              }}
            />

            {/* Mark the latest point */}
            {chartData.length > 0 && (
              <ReferenceDot
                x={chartData[chartData.length - 1].label}
                y={chartData[chartData.length - 1].cumulative}
                r={4}
                fill="#10b981"
                stroke="#10b981"
                strokeWidth={8}
                strokeOpacity={0.15}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="px-4 md:px-5 py-2.5 border-t border-white/[0.04] flex items-center justify-between">
        <span className="text-xs text-white/25">
          {chartData.length} data points · {chartData[0]?.date} → {chartData[chartData.length - 1]?.date}
        </span>
        {failedExecs > 0 && (
          <span className="text-xs text-red-400/60">
            {failedExecs} failed
          </span>
        )}
      </div>
    </motion.div>
  );
}
