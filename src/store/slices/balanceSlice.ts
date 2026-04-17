// Balance slice — fund monitoring + alert surface scaffold (Week 1 extended)
// Backed by edge function: balance-monitor
// Current implementation returns placeholder values; real logic lands in Week 1 extended.

import type { SliceCreator, BalanceSlice } from '../types';

export const createBalanceSlice: SliceCreator<BalanceSlice> = (set, get) => ({
  currentBalances: { spot: 0, unified: 0, funding: 0, total: 0 },
  alerts: [],
  lastSnapshot: null,
  isRefreshing: false,

  refreshBalances: async () => {
    // TODO: Week 1 extended — invoke balance-monitor with action='refresh'
    // - set isRefreshing=true; await response
    // - on success: merge currentBalances + alerts, update lastSnapshot = ISO timestamp
    // - on failure: keep previous state, log via notifications slice
    set({ isRefreshing: true });
    try {
      // placeholder no-op
    } finally {
      set({ isRefreshing: false });
    }
  },

  dismissAlert: async (id) => {
    // TODO: Week 1 extended — PATCH alert row to dismissed=true on Supabase.
    set((state) => ({
      alerts: state.alerts.filter((alert) => alert.id !== id),
    }));
  },

  getActiveAlert: (planId) => {
    const { alerts } = get();
    if (alerts.length === 0) return null;
    // Prefer plan-scoped alerts when a planId is provided.
    const planScoped = planId ? alerts.find((a) => a.planId === planId) : undefined;
    return planScoped ?? alerts[0] ?? null;
  },
});
