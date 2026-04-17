// Balance slice — fund monitoring + alert surface
// Backed by edge function: balance-monitor
//
// Actions supported by the edge function:
//   - { action: 'refresh' }                → snapshot balances + evaluate alerts
//   - { action: 'dismiss_alert', alertId } → mark alert as dismissed
//
// The UI layer consumes this slice via `useBalanceHealth` (src/hooks/useBalanceHealth.ts)
// and directly via `useAppStore` for banner/badge rendering.

import { invokeEdgeFunction } from '@/lib/supabaseFunction';
import type {
  BalanceSlice,
  CurrentBalances,
  FundAlert,
  FundAlertContext,
  SliceCreator,
} from '../types';

interface RefreshResponse {
  data?: {
    balances: CurrentBalances;
    alerts: Array<{
      id: string;
      planId: string | null;
      severity: FundAlert['severity'];
      code: string;
      message: string;
      contextJson: Record<string, unknown>;
      triggeredAt: string;
    }>;
    snapshotAt: string;
  };
  error?: string | null;
}

function normalizeAlert(raw: RefreshResponse['data'] extends { alerts: infer A }
  ? A extends Array<infer R> ? R : never
  : never): FundAlert {
  const context = (raw.contextJson ?? {}) as Record<string, unknown>;
  const ctx: FundAlertContext = {
    remainingExecutions:
      typeof context.remainingExecutions === 'number' ? context.remainingExecutions : undefined,
    remainingMonths:
      typeof context.remainingMonths === 'number' ? context.remainingMonths : undefined,
    required:
      typeof context.monthlyRequired === 'number'
        ? context.monthlyRequired
        : typeof context.required === 'number'
          ? context.required
          : undefined,
    available:
      typeof context.available === 'number' ? context.available : undefined,
  };

  return {
    id: raw.id,
    planId: raw.planId ?? null,
    severity: raw.severity,
    code: raw.code,
    message: raw.message,
    contextJson: ctx,
    triggeredAt: raw.triggeredAt,
  };
}

export const createBalanceSlice: SliceCreator<BalanceSlice> = (set, get) => ({
  currentBalances: { spot: 0, unified: 0, funding: 0, total: 0 },
  alerts: [],
  lastSnapshot: null,
  isRefreshing: false,

  refreshBalances: async () => {
    if (get().isRefreshing) return;
    set({ isRefreshing: true });
    try {
      const { data, error } = await invokeEdgeFunction<RefreshResponse>(
        'balance-monitor',
        { body: { action: 'refresh' } },
      );

      if (error) {
        // Soft failure — keep prior state, surface via console for devs.
        console.warn('[balanceSlice] refresh failed:', error.message);
        return;
      }

      const payload = data?.data;
      if (!payload) return;

      const alerts = (payload.alerts ?? []).map((a) => normalizeAlert(a));

      set({
        currentBalances: {
          spot: payload.balances?.spot ?? 0,
          unified: payload.balances?.unified ?? 0,
          funding: payload.balances?.funding ?? 0,
          total: payload.balances?.total ?? 0,
        },
        alerts,
        lastSnapshot: payload.snapshotAt ?? new Date().toISOString(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown refresh error';
      console.warn('[balanceSlice] refresh threw:', message);
    } finally {
      set({ isRefreshing: false });
    }
  },

  dismissAlert: async (id) => {
    // Optimistic removal — re-fetch on next refresh if backend rejects.
    const previous = get().alerts;
    set({ alerts: previous.filter((a) => a.id !== id) });

    try {
      const { error } = await invokeEdgeFunction(
        'balance-monitor',
        { body: { action: 'dismiss_alert', alertId: id } },
      );
      if (error) {
        console.warn('[balanceSlice] dismiss failed:', error.message);
        // Roll back optimistic update so the user can retry.
        set({ alerts: previous });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown dismiss error';
      console.warn('[balanceSlice] dismiss threw:', message);
      set({ alerts: previous });
    }
  },

  getActiveAlert: (planId) => {
    const state = get();
    const match = state.alerts.find((a) => {
      if (planId) return a.planId === planId;
      return a.planId === null;
    });
    return match ?? null;
  },
});
