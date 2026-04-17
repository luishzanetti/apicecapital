// FundForecast — card showing execution runway vs. current balance.
//
// Purpose:
//   Projects the balance curve as it's drawn down by the active DCA plan (or
//   the aggregate monthly commitment when no planId is passed). Renders an
//   inline mini chart so the user can see when funds run out at a glance.
//
// Usage:
//   <FundForecast />                     // aggregate across all active plans
//   <FundForecast planId={plan.id} />    // scoped to one plan

import { useMemo } from 'react';
import { TrendingDown, Zap, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/appStore';
import { useBalanceHealth } from '@/hooks/useBalanceHealth';
import type { BalanceHealth } from '@/hooks/useBalanceHealth';
import type { DCAPlan } from '@/store/types';

interface FundForecastProps {
  planId?: string;
  className?: string;
}

const EXECUTIONS_PER_MONTH: Record<DCAPlan['frequency'], number> = {
  daily: 30,
  weekly: 4.33,
  biweekly: 2.17,
  monthly: 1,
};

interface ForecastMetrics {
  available: number;
  amountPerInterval: number;
  executionsPerMonth: number;
  monthlyRequired: number;
  remainingExecutions: number;
  remainingMonths: number;
}

function computeMetricsForPlan(plan: DCAPlan, available: number): ForecastMetrics {
  const epm = EXECUTIONS_PER_MONTH[plan.frequency];
  const monthlyRequired = plan.amountPerInterval * epm;
  const remainingExecutions = plan.amountPerInterval > 0
    ? Math.max(0, Math.floor(available / plan.amountPerInterval))
    : 0;
  const remainingMonths = monthlyRequired > 0 ? available / monthlyRequired : 0;
  return {
    available,
    amountPerInterval: plan.amountPerInterval,
    executionsPerMonth: epm,
    monthlyRequired,
    remainingExecutions,
    remainingMonths,
  };
}

function computeAggregateMetrics(plans: DCAPlan[], available: number): ForecastMetrics {
  const monthlyRequired = plans.reduce(
    (sum, plan) => sum + plan.amountPerInterval * EXECUTIONS_PER_MONTH[plan.frequency],
    0,
  );
  // Aggregate "executions" is not meaningful across mixed frequencies, but we
  // surface the nearest integer count of a monthly-equivalent bucket.
  const remainingMonths = monthlyRequired > 0 ? available / monthlyRequired : 0;
  const remainingExecutions = Math.max(0, Math.floor(remainingMonths));
  return {
    available,
    amountPerInterval: 0,
    executionsPerMonth: 0,
    monthlyRequired,
    remainingExecutions,
    remainingMonths,
  };
}

function healthClasses(health: BalanceHealth): { bar: string; text: string; ring: string } {
  switch (health) {
    case 'blocked':
      return {
        bar: 'from-red-500 to-red-600',
        text: 'text-red-400',
        ring: 'ring-red-500/20',
      };
    case 'red':
      return {
        bar: 'from-red-400 to-red-500',
        text: 'text-red-400',
        ring: 'ring-red-400/20',
      };
    case 'yellow':
      return {
        bar: 'from-amber-400 to-amber-500',
        text: 'text-amber-400',
        ring: 'ring-amber-400/20',
      };
    case 'green':
    default:
      return {
        bar: 'from-emerald-400 to-emerald-500',
        text: 'text-emerald-400',
        ring: 'ring-emerald-400/20',
      };
  }
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function FundForecast({ planId, className }: FundForecastProps) {
  const currentBalances = useAppStore((s) => s.currentBalances);
  const dcaPlans = useAppStore((s) => s.dcaPlans);
  const { health, refresh, isRefreshing } = useBalanceHealth(planId);

  const available = currentBalances.unified;

  const metrics = useMemo<ForecastMetrics>(() => {
    if (planId) {
      const plan = dcaPlans.find((p) => p.id === planId);
      if (plan) return computeMetricsForPlan(plan, available);
      // Fallback when plan is missing — treat as aggregate of zero.
      return {
        available,
        amountPerInterval: 0,
        executionsPerMonth: 0,
        monthlyRequired: 0,
        remainingExecutions: 0,
        remainingMonths: 0,
      };
    }
    const active = dcaPlans.filter((p) => p.isActive);
    return computeAggregateMetrics(active, available);
  }, [planId, dcaPlans, available]);

  const colors = healthClasses(health);

  // Bar fill maps runway onto the 0-3 month reference range where 3 months = full.
  const runwayPct = Math.max(0, Math.min(100, (metrics.remainingMonths / 3) * 100));

  // 6-step bar chart visualising consumption (crude but effective on mobile).
  const barSegments = useMemo(() => {
    const totalSteps = 6;
    const filled = Math.round((runwayPct / 100) * totalSteps);
    return Array.from({ length: totalSteps }, (_, i) => i < filled);
  }, [runwayPct]);

  const runwayLabel = metrics.monthlyRequired > 0
    ? `${metrics.remainingMonths.toFixed(1)} months`
    : 'No active commitments';

  const headline = planId
    ? `${metrics.remainingExecutions} execution${metrics.remainingExecutions === 1 ? '' : 's'} remaining`
    : metrics.monthlyRequired > 0
      ? `${metrics.remainingMonths.toFixed(1)} months of runway`
      : 'No active DCA commitments';

  const subline = planId
    ? `Based on ${formatCurrency(metrics.amountPerInterval)} per execution`
    : `Monthly burn: ${formatCurrency(metrics.monthlyRequired)}`;

  return (
    <Card variant="glass" className={cn('overflow-hidden', className)}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-1">
              <TrendingDown className="w-3 h-3" />
              <span>Fund Forecast</span>
            </div>
            <h3 className={cn('text-sm font-semibold', colors.text)}>{headline}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{subline}</p>
          </div>

          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => { void refresh(); }}
            disabled={isRefreshing}
            aria-label="Refresh balance"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
          </Button>
        </div>

        {/* Mini bar chart — consumption over a 3-month horizon */}
        <div className="flex items-end gap-1 h-10 mb-3" aria-hidden="true">
          {barSegments.map((filled, idx) => (
            <div
              key={idx}
              className={cn(
                'flex-1 rounded-sm transition-all',
                filled
                  ? `bg-gradient-to-t ${colors.bar}`
                  : 'bg-secondary/40',
              )}
              style={{ height: `${30 + idx * 12}%` }}
            />
          ))}
        </div>

        {/* Runway progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Runway</span>
            <span className={colors.text}>{runwayLabel}</span>
          </div>
          <div className={cn('h-1.5 rounded-full bg-secondary/50 overflow-hidden ring-1', colors.ring)}>
            <div
              className={cn('h-full bg-gradient-to-r rounded-full transition-all duration-500', colors.bar)}
              style={{ width: `${runwayPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {formatCurrency(available)} available
            </span>
            <span>3 mo target</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FundForecast;
