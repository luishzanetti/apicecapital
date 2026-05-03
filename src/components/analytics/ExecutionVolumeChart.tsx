import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { DCAExecution } from '@/hooks/useDCAExecution';

const MONTHS = 6;

interface MonthBucket {
  key: string;
  label: string;
  total: number;
  successCount: number;
  failedCount: number;
  successUsdt: number;
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

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.[0]) return null;
  const data: MonthBucket = payload[0].payload;
  return (
    <div className="rounded-xl bg-zinc-900/95 border border-white/10 px-3 py-2.5 shadow-xl backdrop-blur-md">
      <p className="text-xs text-white/55 mb-1">{label}</p>
      <p className="text-sm font-bold text-white tabular-nums">{fmt(data.successUsdt)}</p>
      <div className="mt-1 space-y-0.5">
        <p className="text-[11px] text-emerald-400">
          {data.successCount} successful
        </p>
        {data.failedCount > 0 && (
          <p className="text-[11px] text-red-400">{data.failedCount} failed</p>
        )}
      </div>
    </div>
  );
}

interface ExecutionVolumeChartProps {
  executions: DCAExecution[];
}

export function ExecutionVolumeChart({ executions }: ExecutionVolumeChartProps) {
  const data = useMemo<MonthBucket[]>(() => {
    const grouped = new Map<string, MonthBucket>();
    const now = new Date();

    // Pre-fill last N months
    for (let i = MONTHS - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      grouped.set(key, {
        key,
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        total: 0,
        successCount: 0,
        failedCount: 0,
        successUsdt: 0,
      });
    }

    for (const exec of executions) {
      const dt = new Date(exec.executed_at);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      const bucket = grouped.get(key);
      if (!bucket) continue;
      bucket.total += 1;
      if (exec.status === 'success') {
        bucket.successCount += 1;
        bucket.successUsdt += exec.amount_usdt ?? 0;
      } else if (exec.status === 'failed') {
        bucket.failedCount += 1;
      }
    }

    return Array.from(grouped.values());
  }, [executions]);

  const totalVolume = useMemo(() => data.reduce((s, m) => s + m.successUsdt, 0), [data]);
  const totalExec = useMemo(() => data.reduce((s, m) => s + m.successCount, 0), [data]);
  const avgPerMonth = totalVolume / Math.max(1, data.filter((m) => m.successCount > 0).length || 1);

  const hasData = totalExec > 0;

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                Monthly Volume
              </h3>
              <p className="text-[11px] text-muted-foreground">DCA capital deployed by month</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold tabular-nums">{fmt(totalVolume, { compact: true })}</p>
            <p className="text-[11px] text-muted-foreground">{totalExec} successful</p>
          </div>
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <BarChart3 className="w-6 h-6 text-primary/50" />
            </div>
            <p className="text-sm font-semibold text-white/60">No executions yet</p>
            <p className="text-xs text-white/40 mt-1">
              Once your DCA plans run, monthly volume will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="h-[180px] md:h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="execVolGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(152 78% 45%)" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="hsl(152 78% 35%)" stopOpacity={0.55} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }}
                  />
                  <YAxis hide domain={[0, 'dataMax']} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="successUsdt" radius={[6, 6, 0, 0]} maxBarSize={42}>
                    {data.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill="url(#execVolGrad)"
                        opacity={entry.successCount === 0 ? 0.25 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/[0.04]">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Total</p>
                <p className="text-xs font-bold tabular-nums">{fmt(totalVolume, { compact: true })}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Avg/mo</p>
                <p className="text-xs font-bold tabular-nums">{fmt(avgPerMonth, { compact: true })}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Months</p>
                <p className="text-xs font-bold tabular-nums">{data.filter((m) => m.successCount > 0).length}/{MONTHS}</p>
              </motion.div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
