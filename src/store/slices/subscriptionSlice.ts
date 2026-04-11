import type { SliceCreator, SubscriptionSlice, UnlockState } from '../types';
import { defaultUnlockState } from '../defaults';

export const createSubscriptionSlice: SliceCreator<SubscriptionSlice> = (set, get) => ({
  unlockState: defaultUnlockState,
  subscription: {
    tier: 'free',
    activeSince: null,
    expiresAt: null,
    isTrial: false,
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

  setSubscription: (tier) => {
    const addNotification = get().addNotification;
    const previousTier = get().subscription.tier;

    if (tier !== previousTier) {
      const tierLabels: Record<string, string> = { free: 'Free', pro: 'Pro', club: 'Club' };
      addNotification({
        type: 'success',
        category: 'system',
        title: `Welcome to ${tierLabels[tier] || tier}!`,
        message: tier === 'free'
          ? 'Your subscription has been updated.'
          : 'All premium features are now unlocked.',
        actionRoute: '/settings',
        actionLabel: 'View plan',
      });
    }

    return set((state) => {
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
          isTrial: false,
        },
        unlockState: newUnlocks,
        learnProgress: {
          ...state.learnProgress,
          unlockedTracks: ['foundations', 'portfolio-mastery', 'automation', 'copy-trading'],
        },
      };
    });
  },

  startFreeTrial: () =>
    set((state) => {
      // Don't start trial if already on a paid plan or already trialing
      if (state.subscription.tier !== 'free' || state.subscription.isTrial) {
        return {};
      }

      const newUnlocks = { ...state.unlockState };
      newUnlocks.optimizedPortfolios = true;
      newUnlocks.explosiveList = true;
      newUnlocks.advancedDcaTemplates = true;
      newUnlocks.aiTradeGuides = true;
      newUnlocks.aiBotGuides = true;
      newUnlocks.copyPortfolios = true;
      newUnlocks.premiumInsights = true;
      newUnlocks.weeklyReports = true;

      return {
        subscription: {
          tier: 'pro',
          activeSince: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isTrial: true,
        },
        unlockState: newUnlocks,
        learnProgress: {
          ...state.learnProgress,
          unlockedTracks: ['foundations', 'portfolio-mastery', 'automation', 'copy-trading'],
        },
      };
    }),

  checkTrialExpiry: () =>
    set((state) => {
      if (!state.subscription.isTrial || !state.subscription.expiresAt) {
        return {};
      }

      const now = Date.now();
      const expiresAt = new Date(state.subscription.expiresAt).getTime();

      if (now >= expiresAt) {
        return {
          subscription: {
            tier: 'free',
            activeSince: null,
            expiresAt: null,
            isTrial: false,
          },
          unlockState: {
            ...state.unlockState,
            optimizedPortfolios: false,
            explosiveList: false,
            advancedDcaTemplates: false,
            aiTradeGuides: false,
            aiBotGuides: false,
            copyPortfolios: false,
            premiumInsights: false,
            weeklyReports: false,
          },
        };
      }

      return {};
    }),
});
