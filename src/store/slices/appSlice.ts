import { supabase } from '@/integrations/supabase/client';
import type { SliceCreator, AppSlice, LinkClick, SetupProgress } from '../types';
import {
  defaultUserProfile,
  defaultSetupProgress,
  defaultMissionProgress,
  defaultLearnProgress,
  defaultUnlockState,
  defaultLinkClicks,
} from '../defaults';

export const createAppSlice: SliceCreator<AppSlice> = (set, get) => ({
  daysActive: 0,
  lastOpenDate: null,
  currentInsightIndex: 0,
  widgetOrder: [
    'nextstep',
    'insight',
    'quickactions',
    'market',
    'journey',
    'ai-score',
    'gamification',
    'milestone',
  ],
  linkClicks: defaultLinkClicks,

  trackLinkClick: (link) =>
    set((state) => {
      const now = new Date().toISOString();
      const updates: Partial<LinkClick> = {};
      const setupUpdates: Partial<SetupProgress> = {};

      if (link === 'bybit') {
        updates.bybitClicked = true;
        updates.bybitClickedAt = now;
        setupUpdates.exchangeAccountCreated = true;
      } else if (link === 'aiBot') {
        updates.aiBotClicked = true;
        updates.aiBotClickedAt = now;
      } else if (link === 'aiTrade') {
        updates.aiTradeClicked = true;
        updates.aiTradeClickedAt = now;
      }

      const newSetup = { ...state.setupProgress, ...setupUpdates };
      const completed = Object.values(newSetup).filter(Boolean).length;
      const total = Object.keys(newSetup).length;

      return {
        linkClicks: { ...state.linkClicks, ...updates },
        setupProgress: newSetup,
        setupProgressPercent: Math.round((completed / total) * 100),
      };
    }),

  incrementDaysActive: () =>
    set((state) => {
      const today = new Date().toDateString();
      if (state.lastOpenDate !== today) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          const user = session?.user;
          if (user) {
            supabase
              .from('profiles')
              .update({
                days_active: state.daysActive + 1,
                updated_at: new Date().toISOString(),
              })
              .eq('id', user.id)
              .then(({ error }) => {
                if (error) console.error('[appSlice] Failed to sync days_active:', error);
              });
          }
        });
        return {
          daysActive: state.daysActive + 1,
          lastOpenDate: today,
        };
      }
      return {};
    }),

  advanceInsight: () =>
    set((state) => ({
      currentInsightIndex: state.currentInsightIndex + 1,
    })),

  updateWidgetOrder: (order) => set({ widgetOrder: order }),

  resetApp: () =>
    set({
      onboardingSkipped: false,
      onboardingStep: 0,
      hasCompletedOnboarding: false,
      currentQuizStep: 0,
      userProfile: defaultUserProfile,
      investorType: null,
      setupProgress: defaultSetupProgress,
      setupProgressPercent: 0,
      selectedPortfolio: { portfolioId: null, allocations: [], selectedAt: null },
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
      portfolioAccepted: false,
      linkClicks: defaultLinkClicks,
      learnProgress: defaultLearnProgress,
      unlockState: defaultUnlockState,
      subscription: { tier: 'free', activeSince: null, expiresAt: null, isTrial: false },
      daysActive: 0,
      lastOpenDate: null,
      currentInsightIndex: 0,
      aiTradeWizard: {},
      aiBotWizard: {},
      missionProgress: defaultMissionProgress,
    }),
});
