import { supabase } from '@/integrations/supabase/client';
import type { SliceCreator, DCASlice, DCAPlan } from '../types';

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
  weeklyDepositHistory: [],
  weeklyDepositStreak: 0,

  addDcaPlan: (plan) =>
    set((state) => {
      const newPlan: DCAPlan = {
        ...plan,
        id: Date.now().toString(),
        totalInvested: 0,
        nextExecutionDate: new Date().toISOString(),
      };
      const newSetup = { ...state.setupProgress, dcaPlanConfigured: true };
      const completed = Object.values(newSetup).filter(Boolean).length;
      const total = Object.keys(newSetup).length;

      const totalAmount = plan.durationDays
        ? plan.amountPerInterval *
          Math.ceil(
            plan.durationDays /
              (plan.frequency === 'daily'
                ? 1
                : plan.frequency === 'weekly'
                  ? 7
                  : plan.frequency === 'biweekly'
                    ? 14
                    : 30)
          )
        : plan.amountPerInterval * 52;

      const newBadges = [...state.dcaGamification.badges];
      if (!newBadges.includes('first-step')) newBadges.push('first-step');
      if (plan.assets.length >= 3 && !newBadges.includes('diversifier'))
        newBadges.push('diversifier');
      if (plan.durationDays && plan.durationDays >= 90 && !newBadges.includes('long-game'))
        newBadges.push('long-game');
      if (plan.durationDays === null && !newBadges.includes('diamond-hands'))
        newBadges.push('diamond-hands');

      // Sync to Supabase (important: must succeed for DCA execution to work)
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return;
        const { error } = await supabase
          .from('dca_plans')
          .upsert({
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
          }, { onConflict: 'id' });
        if (error) console.error('Error syncing DCA plan to Supabase:', error);
        else console.log('[DCA] Plan synced to Supabase:', newPlan.id);
      }).catch((e) => console.error('Supabase add DCA plan error', e));

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
    }),

  updateDcaPlan: (id, updates) => {
    set((state) => ({
      dcaPlans: state.dcaPlans.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
    // Sync to Supabase
    const dbUpdates: Record<string, any> = {};
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.amountPerInterval !== undefined) dbUpdates.amount_per_interval = updates.amountPerInterval;
    if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
    if (updates.totalInvested !== undefined) dbUpdates.total_invested = updates.totalInvested;
    if (updates.nextExecutionDate !== undefined) dbUpdates.next_execution_date = updates.nextExecutionDate;
    if (Object.keys(dbUpdates).length > 0) {
      supabase.from('dca_plans').update(dbUpdates).eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Error syncing DCA plan update:', error);
        });
    }
  },

  deleteDcaPlan: (id) => {
    set((state) => ({
      dcaPlans: state.dcaPlans.filter((p) => p.id !== id),
    }));
    // Remove from Supabase
    supabase.from('dca_plans').delete().eq('id', id)
      .then(({ error }) => {
        if (error) console.error('Error deleting DCA plan from Supabase:', error);
      });
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
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from('profiles')
            .update({
              weekly_investment: amount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .then(({ error }) => {
              if (error) console.error('Error syncing weekly investment:', error);
            });
        }
      }).catch(console.error);
    } catch (e) {
      console.error('Supabase set weekly investment error', e);
    }
  },

  setInvestmentFrequency: (frequency) => set({ investmentFrequency: frequency }),

  confirmWeeklyDeposit: (weekId, amount, allocations) =>
    set((state) => {
      const deposit = {
        weekId,
        amount,
        confirmedAt: new Date().toISOString(),
        allocations,
      };

      const lastDeposit = state.weeklyDepositHistory[state.weeklyDepositHistory.length - 1];
      let newStreak = state.weeklyDepositStreak;
      if (lastDeposit) {
        const lastWeekNum = parseInt(lastDeposit.weekId.split('-W')[1]);
        const thisWeekNum = parseInt(weekId.split('-W')[1]);
        newStreak = thisWeekNum - lastWeekNum === 1 ? newStreak + 1 : 1;
      } else {
        newStreak = 1;
      }

      const newTotalCommitted = state.dcaGamification.totalAmountCommitted + amount;

      try {
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            supabase
              .from('transactions')
              .insert(
                allocations.map((a) => ({
                  user_id: user.id,
                  asset_symbol: a.asset,
                  type: 'buy',
                  amount: a.amount / 1,
                  price_per_unit: 1,
                  date: new Date().toISOString(),
                  fees: 0,
                  notes: `Weekly deposit W${weekId}`,
                }))
              )
              .then(({ error }) => {
                if (error) console.error('Error syncing deposit:', error);
              });
          }
        }).catch(console.error);
      } catch (e) {
        console.error('Supabase transaction insert error', e);
      }

      return {
        weeklyDepositHistory: [...state.weeklyDepositHistory, deposit],
        weeklyDepositStreak: newStreak,
        dcaGamification: {
          ...state.dcaGamification,
          totalAmountCommitted: newTotalCommitted,
          lastDcaAction: new Date().toISOString(),
        },
      };
    }),

  editDeposit: (weekId, newAmount) =>
    set((state) => {
      const history = state.weeklyDepositHistory.map((d) => {
        if (d.weekId !== weekId) return d;
        const ratio = newAmount / d.amount;
        return {
          ...d,
          amount: newAmount,
          allocations: d.allocations.map((a) => ({ ...a, amount: a.amount * ratio })),
        };
      });
      return { weeklyDepositHistory: history };
    }),

  removeDeposit: (weekId) =>
    set((state) => ({
      weeklyDepositHistory: state.weeklyDepositHistory.filter((d) => d.weekId !== weekId),
    })),
});
