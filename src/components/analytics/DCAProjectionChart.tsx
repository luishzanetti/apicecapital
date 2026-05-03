import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { Target, ArrowUpRight, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { DCAPlan } from '@/store/appStore';
import { cn } from '@/lib/utils';

interface ProjectionPoint {
  month: number;
  label: string;
  invested: number;
  cumulative: number;
}

const HORIZON_MONTHS = 12;

const MONTHLY_FACTOR: Record<DCAPlan['frequency'], number> = {
  daily: 30,
  weekly: 4.33,
  biweekly: 2.17,
  monthly: 1,
};

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
  const data: ProjectionPoint = payload[0].payload;
  return (
    <div className="rounded-xl bg-zinc-900/95 border border-white/10 px-3 py-2.5 shadow-xl backdrop-blur-md">
      <p className="text-xs text-white/55 mb-1">{label}</p>
      <p className="text-sm font-bold text-white tabular-nums">{fmt(data.cumulative)}</p>
      <p className="text-[11px] text-emerald-400">+{fmt(data.invested)}/month</p>
    </div>
  );
}

interface DCAProjectionChartProps {
  plans: DCAPlan[];
  alreadyInvested: number;
}

export function DCAProjectionChart({ plans, alreadyInvested }: DCAProjectionChartProps) {
  const monthlyCommitment = useMemo(
    () =>
      plans
        .filter((p) => p.isActive)
        .reduce((sum, p) => sum + p.amountPerInterval * (MONTHLY_FACTOR[p.frequency] ?? 1), 0),
    [plans],
  );

  const data = useMemo<ProjectionPoint[]>(() => {
    const out: ProjectionPoint[] = [];
    const now = new Date();
    let cumulative = alreadyInvested;
    for (let m = 0; m <= HORIZON_MONTHS; m++) {
      const date = new Date(now.getFullYear(), now.getMonth() + m, 1);
      cumulative += monthlyCommitment;
      out.push({
        month: m,
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        invested: monthlyCommitment,
        cumulative: Math.round(cumulative),
      });
    }
    return out;
  }, [monthlyCommitment, alreadyInvested]);

  const yearTotal = data[12]?.cumulative ?? alreadyInvested;
  const sixMonths = data[6]?.cumulative ?? alreadyInvested;
  const growth = yearTotal - alreadyInvested;

  if (monthlyCommitment === 0) {
    return (
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
              DCA Projection
            </h3>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6 text-primary/50" />
            </div>
            <p className="text-sm font-semibold text-white/60">Activate a DCA plan</p>
            <p className="text-xs text-white/40 mt-1 max-w-xs">
              Once you have an active commitment, your projection appears here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                DCA Projection
              </h3>
              <p className="text-[11px] text-muted-foreground">Next 12 months at current cadence</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold tabular-nums">{fmt(yearTotal, { compact: true })}</p>
            <div className="inline-flex items-center gap-1 text-emerald-400">
              <ArrowUpRight className="h-3 w-3" />
              <span className="text-[11px] font-semibold tabular-nums">+{fmt(growth, { compact: true })}</span>
            </div>
          </div>
        </div>

        <div className="h-[200px] md:h-[230px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 14, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--apice-emerald))" stopOpacity={0.4} />
                  <stop offset="60%" stopColor="hsl(var(--apice-emerald))" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="hsl(var(--apice-emerald))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.30)' }}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis hide domain={[alreadyInvested, 'dataMax']} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1, strokeDasharray: '4 4' }} />
              {alreadyInvested > 0 && (
                <ReferenceLine
                  y={alreadyInvested}
                  stroke="rgba(255,255,255,0.2)"
                  strokeDasharray="4 4"
                  label={{ value: 'Today', fill: 'rgba(255,255,255,0.4)', fontSize: 9, position: 'insideLeft' }}
                />
              )}
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="hsl(var(--apice-emerald))"
                strokeWidth={2.5}
                fill="url(#projGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/[0.04]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Monthly</p>
            <p className={cn('text-xs font-bold tabular-nums text-[hsl(var(--apice-emerald))]')}>
              +{fmt(monthlyCommitment, { compact: true })}
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">6 months</p>
            <p className="text-xs font-bold tabular-nums">{fmt(sixMonths, { compact: true })}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">12 months</p>
            <p className="text-xs font-bold tabular-nums text-[hsl(var(--apice-emerald))]">{fmt(yearTotal, { compact: true })}</p>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
