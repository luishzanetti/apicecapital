// BalanceHealthBadge — compact status pill for DCA plan cards / home cards.
//
// States:
//   green   → "Funds OK"
//   yellow  → "X.Xmo left"       (warning: >=1.5 months)
//   red     → "N executions left" (critical: <1.5 months)
//   blocked → "Execution blocked" (insufficient funds)
//
// Usage:
//   <BalanceHealthBadge planId={plan.id} />
//   <BalanceHealthBadge />          // global / highest-severity

import { useMemo } from 'react';
import { CheckCircle2, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBalanceHealth, type BalanceHealth } from '@/hooks/useBalanceHealth';

interface BalanceHealthBadgeProps {
  planId?: string;
  className?: string;
  /** Render nothing when health is green. Default false so badge always shows. */
  hideWhenGreen?: boolean;
}

interface BadgeDescriptor {
  label: string;
  icon: typeof CheckCircle2;
  classes: string;
}

function getBadgeDescriptor(
  health: BalanceHealth,
  remainingMonths: number | undefined,
  remainingExecutions: number | undefined,
): BadgeDescriptor {
  switch (health) {
    case 'blocked':
      return {
        label: 'Execution blocked',
        icon: ShieldAlert,
        classes: 'bg-red-500/15 text-red-400 border-red-500/30',
      };
    case 'red': {
      const count = typeof remainingExecutions === 'number' ? remainingExecutions : 0;
      return {
        label: `${count} execution${count === 1 ? '' : 's'} left`,
        icon: AlertTriangle,
        classes: 'bg-red-500/10 text-red-400 border-red-500/20',
      };
    }
    case 'yellow': {
      const months = typeof remainingMonths === 'number' ? remainingMonths : 0;
      return {
        label: `${months.toFixed(1)}mo left`,
        icon: Clock,
        classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      };
    }
    case 'green':
    default:
      return {
        label: 'Funds OK',
        icon: CheckCircle2,
        classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      };
  }
}

export function BalanceHealthBadge({
  planId,
  className,
  hideWhenGreen = false,
}: BalanceHealthBadgeProps) {
  const { health, remainingMonths, remainingExecutions } = useBalanceHealth(planId);

  const descriptor = useMemo(
    () => getBadgeDescriptor(health, remainingMonths, remainingExecutions),
    [health, remainingMonths, remainingExecutions],
  );

  if (hideWhenGreen && health === 'green') {
    return null;
  }

  const Icon = descriptor.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none',
        descriptor.classes,
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Icon className="w-3 h-3" aria-hidden="true" />
      <span>{descriptor.label}</span>
    </span>
  );
}

export default BalanceHealthBadge;
