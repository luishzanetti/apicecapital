import { supabase } from '@/integrations/supabase/client';
import type { SliceCreator, MissionSlice, AppState, MissionProgress } from '../types';
import { defaultMissionProgress } from '../defaults';

export const createMissionSlice: SliceCreator<MissionSlice> = (set, get) => ({
  missionProgress: defaultMissionProgress,

  completeMissionTask: (task, value) =>
    set((state) => {
      const val = value !== undefined ? value : true;
      const newMission = { ...state.missionProgress, [task]: val };
      let newState: Partial<AppState> = { missionProgress: newMission };

      if (task === 'm1_onboardingCompleted' && val) {
        newState = { ...newState, hasCompletedOnboarding: true };
      }
      if (task === 'm1_profileQuizDone' && val) {
        newState = { ...newState, hasCompletedOnboarding: true };
      }
      if (task === 'm3_portfolioSelected' && val) {
        newState = {
          ...newState,
          setupProgress: { ...state.setupProgress, corePortfolioSelected: true },
        };
      }
      if (task === 'm4_weeklyPlanSet' && val) {
        newState = {
          ...newState,
          setupProgress: { ...state.setupProgress, dcaPlanConfigured: true },
        };
      }
      if (task === 'm2_bybitAccountCreated' && val) {
        newState = {
          ...newState,
          setupProgress: { ...state.setupProgress, exchangeAccountCreated: true },
        };
      }

      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from('profiles')
            .update({
              mission_progress: newMission,
              has_completed_onboarding:
                (newState as any).hasCompletedOnboarding ?? state.hasCompletedOnboarding,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);
        }
      });

      return newState;
    }),

  startActivationChallenge: () =>
    set((state) => ({
      missionProgress: {
        ...state.missionProgress,
        m2_challengeStartDate: new Date().toISOString(),
        m2_activationChallengeDay: 1,
      },
    })),

  advanceChallengeDay: () =>
    set((state) => {
      const nextDay = Math.min(state.missionProgress.m2_activationChallengeDay + 1, 7);
      return {
        missionProgress: {
          ...state.missionProgress,
          m2_activationChallengeDay: nextDay,
        },
      };
    }),
});
