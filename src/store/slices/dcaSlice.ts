import { supabase } from '@/integrations/supabase/client';
import { getNextExecutionDate } from '@/lib/dca';
import type { SliceCreator, DCASlice, DCAPlan } from '../types';

function createPlanId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return Date.now().toString();
}

export const createDCASlice: SliceCreator<DCASlice> = (set, get) => ({
  dcaPlans: [],
  dcaGamification: {
    totalPlansCreated: 0,
    totalAmountCommitted: 0,
    longestActivePlan: 0,
    badges: [],
    dcaStreak: 0,
    lastDcaAction: null,
  },
  weeklyInvestment: 0,
  investmentFrequency: 'weekly',
  addDcaPlan: async (plan) => {
    const startDate = plan.startDate || new Date().toISOString();
    const newPlan: DCAPlan = {
      ...plan,
      id: plan.id || createPlanId(),
      startDate,
      totalInvested: plan.totalInvested ?? 0,
      nextExecutionDate: plan.nextExecutionDate || getNextExecutionDate(plan.frequency, startDate),
    };

    set((state) => {
      const newSetup = { ...state.setupProgress, dcaPlanConfigured: true };
      const completed = Object.values(newSetup).filter(Boolean).length;
      const total = Object.keys(newSetup).length;

      const totalAmount = newPlan.durationDays
        ? newPlan.amountPerInterval *
          Math.ceil(
            newPlan.durationDays /
              (newPlan.frequency === 'daily'
                ? 1
                : newPlan.frequency === 'weekly'
                  ? 7
                  : newPlan.frequency === 'biweekly'
                    ? 14
                    : 30)
          )
        : newPlan.amountPerInterval * 52;

      const newBadges = [...state.dcaGamification.badges];
      if (!newBadges.includes('first-step')) newBadges.push('first-step');
      if (newPlan.assets.length >= 3 && !newBadges.includes('diversifier'))
        newBadges.push('diversifier');
      if (newPlan.durationDays && newPlan.durationDays >= 90 && !newBadges.includes('long-game'))
        newBadges.push('long-game');
      if (newPlan.durationDays === null && !newBadges.includes('diamond-hands'))
        newBadges.push('diamond-hands');

      return {
        dcaPlans: [...state.dcaPlans, newPlan],
        setupProgress: newSetup,
        setupProgressPercent: Math.round((completed / total) * 100),
        dcaGamification: {
          ...state.dcaGamification,
          totalPlansCreated: state.dcaGamification.totalPlansCreated + 1,
          totalAmountCommitted: state.dcaGamification.totalAmountCommitted + totalAmount,
          badges: newBadges,
          lastDcaAction: new Date().toISOString(),
        },
      };
    });

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (user) {
        const { error } = await supabase.from('dca_plans').upsert(
          {
            id: newPlan.id,
            user_id: user.id,
            assets: newPlan.assets,
            amount_per_interval: newPlan.amountPerInterval,
            frequency: newPlan.frequency,
            duration_days: newPlan.durationDays,
            start_date: newPlan.startDate,
            is_active: newPlan.isActive,
            total_invested: newPlan.totalInvested,
            next_execution_date: newPlan.nextExecutionDate,
          },
          { onConflict: 'id' }
        );

        // Sync result handled silently
      }
    } catch {
      // Supabase sync failed; local state is authoritative
    }

    // Notify user about the new plan
    const addNotification = get().addNotification;
    addNotification({
      type: 'success',
      category: 'dca',
      title: 'New DCA Plan Created',
      message: `$${newPlan.amountPerInterval}/${newPlan.frequency} across ${newPlan.assets.length} asset${newPlan.assets.length > 1 ? 's' : ''}`,
      actionRoute: '/dca-planner',
      actionLabel: 'View plan',
    });

    return newPlan;
  },

  updateDcaPlan: (id, updates) => {
    set((state) => ({
      dcaPlans: state.dcaPlans.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
    // Sync to Supabase
    const dbUpdates: {
      is_active?: boolean;
      amount_per_interval?: number;
      frequency?: DCAPlan['frequency'];
      total_invested?: number;
      next_execution_date?: string;
    } = {};
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.amountPerInterval !== undefined) dbUpdates.amount_per_interval = updates.amountPerInterval;
    if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
    if (updates.totalInvested !== undefined) dbUpdates.total_invested = updates.totalInvested;
    if (updates.nextExecutionDate !== undefined) dbUpdates.next_execution_date = updates.nextExecutionDate;
    if (Object.keys(dbUpdates).length > 0) {
      supabase.from('dca_plans').update(dbUpdates).eq('id', id)
        .then(() => {});
    }
  },

  deleteDcaPlan: (id) => {
    set((state) => ({
      dcaPlans: state.dcaPlans.filter((p) => p.id !== id),
    }));
    // Remove from Supabase
    supabase.from('dca_plans').delete().eq('id', id)
      .then(() => {});
  },

  updateDcaGamification: (updates) =>
    set((state) => ({
      dcaGamification: { ...state.dcaGamification, ...updates },
    })),

  unlockDcaBadge: (badgeId) =>
    set((state) => ({
      dcaGamification: {
        ...state.dcaGamification,
        badges: [...new Set([...state.dcaGamification.badges, badgeId])],
      },
    })),

  setWeeklyInvestment: (amount) => {
    set({ weeklyInvestment: amount });
    try {
      supabase.auth.getSession().then(({ data: { session } }) => {
        const user = session?.user;
        if (user) {
          supabase
            .from('profiles')
            .update({
              weekly_investment: amount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .then(() => {});
        }
      }).catch(() => {});
    } catch {
      // Supabase sync failed; local state is authoritative
    }
  },

  setInvestmentFrequency: (frequency) => set({ investmentFrequency: frequency }),
});
