// useBalanceHealth — surfaces fund-alert health for Home / DCA cards.
//
// Inputs:
//   planId (optional) — when provided, scope to a specific DCA plan.
//                       When omitted, return the highest-severity global alert.
//
// Output:
//   - health: green | yellow | red | blocked
//   - alert:  the matching FundAlert (if any)
//   - remainingMonths / remainingExecutions extracted from contextJson
//   - refresh: bound refresher from balance slice
//   - dismiss: bound dismissal for the current alert (no-op if no alert)

import { useMemo, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import type { FundAlert } from '@/store/types';

export type BalanceHealth = 'green' | 'yellow' | 'red' | 'blocked';

interface UseBalanceHealthResult {
  health: BalanceHealth;
  alert: FundAlert | null;
  remainingMonths: number | undefined;
  remainingExecutions: number | undefined;
  refresh: () => Promise<void>;
  dismiss: () => Promise<void>;
  isRefreshing: boolean;
  lastSnapshot: string | null;
}

// Highest-severity-wins ranking when selecting a fallback alert.
const SEVERITY_RANK: Record<FundAlert['severity'], number> = {
  info: 0,
  warning: 1,
  critical: 2,
  blocked: 3,
};

function severityToHealth(severity: FundAlert['severity'] | undefined): BalanceHealth {
  if (severity === 'blocked') return 'blocked';
  if (severity === 'critical') return 'red';
  if (severity === 'warning') return 'yellow';
  return 'green';
}

export function useBalanceHealth(planId?: string): UseBalanceHealthResult {
  const alerts = useAppStore((s) => s.alerts);
  const refreshBalances = useAppStore((s) => s.refreshBalances);
  const dismissAlert = useAppStore((s) => s.dismissAlert);
  const isRefreshing = useAppStore((s) => s.isRefreshing);
  const lastSnapshot = useAppStore((s) => s.lastSnapshot);

  const alert = useMemo<FundAlert | null>(() => {
    if (planId) {
      const planAlert = alerts.find((a) => a.planId === planId);
      return planAlert ?? null;
    }

    // Global view: highest-severity alert across all plans.
    if (alerts.length === 0) return null;
    return alerts.reduce<FundAlert | null>((best, candidate) => {
      if (!best) return candidate;
      return SEVERITY_RANK[candidate.severity] > SEVERITY_RANK[best.severity]
        ? candidate
        : best;
    }, null);
  }, [alerts, planId]);

  const health = severityToHealth(alert?.severity);

  const dismiss = useCallback(async () => {
    if (!alert) return;
    await dismissAlert(alert.id);
  }, [alert, dismissAlert]);

  return {
    health,
    alert,
    remainingMonths: alert?.contextJson?.remainingMonths,
    remainingExecutions: alert?.contextJson?.remainingExecutions,
    refresh: refreshBalances,
    dismiss,
    isRefreshing,
    lastSnapshot,
  };
}
