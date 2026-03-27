import { supabase } from '@/integrations/supabase/client';
import type { SliceCreator, OnboardingSlice, UserProfile, InvestorType } from '../types';
import { defaultUserProfile, defaultMissionProgress } from '../defaults';

export const createOnboardingSlice: SliceCreator<OnboardingSlice> = (set, get) => ({
  hasCompletedOnboarding: false,
  onboardingSkipped: false,
  onboardingStep: 0,
  currentQuizStep: 0,
  userProfile: defaultUserProfile,
  investorType: null,

  syncFromSupabase: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        set((state) => ({
          userProfile: {
            goal: profile.goal as any,
            experience: profile.experience as any,
            riskTolerance: profile.risk_tolerance as any,
            capitalRange: profile.capital_range as any,
            habitType: profile.habit_type as any,
            preferredAssets: profile.preferred_assets as any,
          },
          investorType: profile.investor_type as any,
          hasCompletedOnboarding: profile.has_completed_onboarding || false,
          onboardingSkipped: profile.onboarding_skipped || false,
          missionProgress: (profile.mission_progress as any) || defaultMissionProgress,
          weeklyInvestment: profile.weekly_investment || 0,
        }));
      }

      const { data: portfolios } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_selected', true)
        .single();

      if (portfolios) {
        set({
          selectedPortfolio: {
            portfolioId: portfolios.id,
            allocations: portfolios.allocations as any,
            selectedAt: portfolios.created_at,
          },
        });
      }

      const { data: dcaPlans } = await supabase
        .from('dca_plans')
        .select('*')
        .eq('user_id', user.id);

      if (dcaPlans) {
        const formattedPlans = dcaPlans.map((p) => ({
          id: p.id,
          assets: p.assets as any,
          amountPerInterval: p.amount_per_interval,
          frequency: p.frequency as any,
          durationDays: p.duration_days,
          startDate: p.start_date,
          isActive: p.is_active,
          totalInvested: p.total_invested,
          nextExecutionDate: p.next_execution_date,
        }));
        set({ dcaPlans: formattedPlans });
      }
    } catch (error) {
      console.error('Supabase sync error (using local state)', error);
    }
  },

  setQuizStep: (step) => set({ currentQuizStep: step }),

  setOnboardingStep: (step) => set({ onboardingStep: step }),

  skipOnboarding: () => {
    set({ onboardingSkipped: true, hasCompletedOnboarding: false });
    try {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from('profiles')
            .update({
              onboarding_skipped: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .then(() => {}, console.error);
        }
      }).then(() => {}, console.error);
    } catch (e) {
      console.error('Supabase skipped onboarding error', e);
    }
  },

  updateUserProfile: (updates) => {
    set((state) => {
      const newProfile = { ...state.userProfile, ...updates };
      try {
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            supabase
              .from('profiles')
              .upsert({
                id: user.id,
                updated_at: new Date().toISOString(),
                goal: newProfile.goal,
                experience: newProfile.experience,
                risk_tolerance: newProfile.riskTolerance,
                capital_range: newProfile.capitalRange,
                habit_type: newProfile.habitType,
                preferred_assets: newProfile.preferredAssets,
              })
              .then(({ error }) => {
                if (error) console.error('Error syncing profile:', error);
              });
          }
        }).catch(console.error);
      } catch (e) {
        console.error('Supabase profile upsert error', e);
      }
      return { userProfile: newProfile };
    });
  },

  completeOnboarding: () => {
    const state = get();
    state.calculateInvestorType();
    set({
      hasCompletedOnboarding: true,
      missionProgress: {
        ...state.missionProgress,
        m1_onboardingCompleted: true,
        m1_profileQuizDone: true,
      },
    });
    try {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from('profiles')
            .update({
              has_completed_onboarding: true,
              mission_progress: {
                ...state.missionProgress,
                m1_onboardingCompleted: true,
                m1_profileQuizDone: true,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .then(() => {}, console.error);
        }
      }).then(() => {}, console.error);
    } catch (e) {
      console.error('Supabase complete onboarding error', e);
    }
  },

  calculateInvestorType: () => {
    const { userProfile } = get();
    let type: InvestorType = 'Balanced Optimizer';
    if (userProfile.riskTolerance === 'low' || userProfile.goal === 'protection') {
      type = 'Conservative Builder';
    } else if (userProfile.riskTolerance === 'high' || userProfile.goal === 'growth') {
      type = 'Growth Seeker';
    }
    set({ investorType: type });
    try {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from('profiles')
            .update({
              investor_type: type,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .then(({ error }) => {
              if (error) console.error('Error syncing investor type:', error);
            });
        }
      }).catch(console.error);
    } catch (e) {
      console.error('Supabase update investor type error', e);
    }
  },
});
