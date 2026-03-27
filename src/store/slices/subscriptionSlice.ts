import type { SliceCreator, SubscriptionSlice, UnlockState } from '../types';
import { defaultUnlockState } from '../defaults';

export const createSubscriptionSlice: SliceCreator<SubscriptionSlice> = (set) => ({
  unlockState: defaultUnlockState,
  subscription: {
    tier: 'free',
    activeSince: null,
    expiresAt: null,
  },
  aiTradeWizard: {},
  aiBotWizard: {},

  completeWizardStep: (wizard, step) =>
    set((state) => {
      if (wizard === 'aiTrade') {
        return { aiTradeWizard: { ...state.aiTradeWizard, [step]: true } };
      }
      return { aiBotWizard: { ...state.aiBotWizard, [step]: true } };
    }),

  unlockFeature: (feature) =>
    set((state) => ({
      unlockState: { ...state.unlockState, [feature]: true },
    })),

  setSubscription: (tier) =>
    set((state) => {
      const newUnlocks = { ...state.unlockState };
      if (tier === 'pro' || tier === 'club') {
        newUnlocks.optimizedPortfolios = true;
        newUnlocks.explosiveList = true;
        newUnlocks.advancedDcaTemplates = true;
        newUnlocks.aiTradeGuides = true;
        newUnlocks.aiBotGuides = true;
        newUnlocks.copyPortfolios = true;
        newUnlocks.premiumInsights = true;
        newUnlocks.weeklyReports = true;
      }
      if (tier === 'club') {
        newUnlocks.community = true;
        newUnlocks.advancedRiskModes = true;
      }

      return {
        subscription: {
          tier,
          activeSince: new Date().toISOString(),
          expiresAt: null,
        },
        unlockState: newUnlocks,
        learnProgress: {
          ...state.learnProgress,
          unlockedTracks: ['foundations', 'portfolio-mastery', 'automation', 'copy-trading'],
        },
      };
    }),
});
