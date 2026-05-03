import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceDot } from 'recharts';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { PortfolioSnapshot } from '@/hooks/usePortfolioHistory';
import { cn } from '@/lib/utils';

interface ChartPoint {
  date: string;
  label: string;
  value: number;
  pnl: number;
  pnlPercent: number;
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

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload as ChartPoint;
  const positive = data.pnl >= 0;
  return (
    <div className="rounded-xl bg-zinc-900/95 border border-white/10 px-3 py-2.5 shadow-xl backdrop-blur-md">
      <p className="text-xs text-white/55 mb-1">{data.date}</p>
      <p className="text-sm font-bold text-white tabular-nums">
        {fmt(data.value)}
      </p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="text-[11px] text-white/55">P&L</span>
        <span className={cn(
          'text-[11px] font-semibold tabular-nums',
          positive ? 'text-emerald-400' : 'text-red-400',
        )}>
          {positive ? '+' : ''}{fmt(data.pnl)} ({positive ? '+' : ''}{data.pnlPercent.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
}

interface PortfolioEvolutionChartProps {
  snapshots: PortfolioSnapshot[];
  isConnected: boolean;
}

export function PortfolioEvolutionChart({ snapshots, isConnected }: PortfolioEvolutionChartProps) {
  const chartData = useMemo<ChartPoint[]>(() => {
    return snapshots.map((s) => ({
      date: s.date,
      label: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: s.totalValue,
      pnl: s.pnl,
      pnlPercent: s.pnlPercent,
    }));
  }, [snapshots]);

  if (!isConnected || chartData.length < 2) {
    return (
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
              Portfolio Evolution
            </h3>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-primary/50" />
            </div>
            <p className="text-sm font-semibold text-white/60">Building your timeline</p>
            <p className="text-xs text-white/40 mt-1 max-w-xs">
              {!isConnected
                ? 'Connect your account to start tracking portfolio evolution.'
                : 'Come back tomorrow — daily snapshots are captured automatically.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const first = chartData[0];
  const last = chartData[chartData.length - 1];
  const periodReturn = first.value > 0 ? ((last.value - first.value) / first.value) * 100 : 0;
  const periodReturnAbs = last.value - first.value;
  const positive = periodReturnAbs >= 0;
  const color = positive ? '#10b981' : '#ef4444';
  const TrendIcon = positive ? TrendingUp : TrendingDown;

  // Find best/worst day for ReferenceDot
  const bestDay = chartData.reduce((best, p) => (p.value > best.value ? p : best), chartData[0]);
  const worstDay = chartData.reduce((worst, p) => (p.value < worst.value ? p : worst), chartData[0]);

  return (
    <Card>
      <CardContent className="pt-5 pb-3">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                Portfolio Evolution
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {chartData.length}-day rolling window
            </p>
          </div>
          <div className="text-right">
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-bold tabular-nums"
            >
              {fmt(last.value)}
            </motion.p>
            <div className={cn(
              'inline-flex items-center gap-1 mt-0.5',
              positive ? 'text-emerald-400' : 'text-red-400',
            )}>
              <TrendIcon className="h-3 w-3" />
              <span className="text-xs font-semibold tabular-nums">
                {positive ? '+' : ''}{periodReturn.toFixed(2)}% · {positive ? '+' : ''}{fmt(periodReturnAbs, { compact: true })}
              </span>
            </div>
          </div>
        </div>

        <div className="h-[220px] md:h-[260px] w-full px-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 14, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.32} />
                  <stop offset="55%" stopColor={color} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
                <filter id="portfolioGlow">
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
                domain={[(d: number) => Math.max(0, d * 0.95), 'dataMax']}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: 'rgba(255,255,255,0.15)',
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2.5}
                fill="url(#portfolioGrad)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: color,
                  stroke: color,
                  strokeWidth: 2,
                  strokeOpacity: 0.3,
                  filter: 'url(#portfolioGlow)',
                }}
              />
              {chartData.length > 4 && bestDay !== last && (
                <ReferenceDot
                  x={bestDay.label}
                  y={bestDay.value}
                  r={3}
                  fill="#10b981"
                  stroke="#10b981"
                  strokeWidth={6}
                  strokeOpacity={0.18}
                />
              )}
              {chartData.length > 4 && worstDay !== last && worstDay !== bestDay && (
                <ReferenceDot
                  x={worstDay.label}
                  y={worstDay.value}
                  r={3}
                  fill="#ef4444"
                  stroke="#ef4444"
                  strokeWidth={6}
                  strokeOpacity={0.18}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Footer mini-stats */}
        <div className="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-white/[0.04]">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Best</p>
            <p className="text-xs font-bold tabular-nums text-emerald-400">{fmt(bestDay.value, { compact: true })}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Worst</p>
            <p className="text-xs font-bold tabular-nums text-red-400">{fmt(worstDay.value, { compact: true })}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Range</p>
            <p className="text-xs font-bold tabular-nums">{fmt(bestDay.value - worstDay.value, { compact: true })}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
