// InsufficientFundsAlert — full-width banner for Home page.
//
// Renders when the user has at least one RED (critical) or BLOCKED alert.
// Dismissing snoozes the alert for 72h on the backend.

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, ArrowRight, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/appStore';
import { useBalanceHealth } from '@/hooks/useBalanceHealth';

interface InsufficientFundsAlertProps {
  className?: string;
  /** Route to navigate to when "Add Funds" is clicked. Defaults to the transfer page. */
  addFundsRoute?: string;
}

export function InsufficientFundsAlert({
  className,
  addFundsRoute = '/transfer',
}: InsufficientFundsAlertProps) {
  const navigate = useNavigate();
  const alerts = useAppStore((s) => s.alerts);
  const { dismiss } = useBalanceHealth();
  const [dismissing, setDismissing] = useState(false);

  // We specifically surface the first critical/blocked alert — warnings do not
  // warrant a full banner.
  const critical = useMemo(
    () => alerts.find((a) => a.severity === 'critical' || a.severity === 'blocked') ?? null,
    [alerts],
  );

  if (!critical) return null;

  const isBlocked = critical.severity === 'blocked';
  const Icon = isBlocked ? ShieldAlert : AlertTriangle;

  const title = isBlocked
    ? 'Execution blocked — add funds to resume'
    : 'Critical: low funds on active plan';

  const description = critical.message;

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      await dismiss();
    } finally {
      setDismissing(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={critical.id}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={cn(
          'w-full rounded-2xl border p-4 md:p-5 backdrop-blur-sm',
          isBlocked
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-amber-500/10 border-amber-500/30',
          className,
        )}
        role="alert"
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
              isBlocked ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400',
            )}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <h3
              className={cn(
                'text-sm font-semibold mb-0.5',
                isBlocked ? 'text-red-300' : 'text-amber-200',
              )}
            >
              {title}
            </h3>
            <p
              className={cn(
                'text-xs leading-relaxed',
                isBlocked ? 'text-red-200/80' : 'text-amber-100/80',
              )}
            >
              {description}
            </p>

            {typeof critical.contextJson?.remainingExecutions === 'number' && (
              <p className="text-[11px] text-muted-foreground mt-1">
                {critical.contextJson.remainingExecutions} execution
                {critical.contextJson.remainingExecutions === 1 ? '' : 's'} remaining
                {typeof critical.contextJson.remainingMonths === 'number'
                  ? ` · ${critical.contextJson.remainingMonths.toFixed(1)} months of runway`
                  : ''}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={isBlocked ? 'default' : 'outline'}
                className={cn(
                  'h-8 text-xs gap-1.5',
                  isBlocked
                    ? 'bg-red-500 hover:bg-red-500/90 text-white border-0'
                    : 'border-amber-500/40 hover:bg-amber-500/10 text-amber-200',
                )}
                onClick={() => navigate(addFundsRoute)}
              >
                Add Funds
                <ArrowRight className="w-3 h-3" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleDismiss}
                disabled={dismissing}
              >
                {dismissing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <X className="w-3 h-3" />
                )}
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default InsufficientFundsAlert;
