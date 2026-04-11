import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, InvestorType } from './types';

// Slice creators
import { createOnboardingSlice } from './slices/onboardingSlice';
import { createMissionSlice } from './slices/missionSlice';
import { createPortfolioSlice } from './slices/portfolioSlice';
import { createDCASlice } from './slices/dcaSlice';
import { createLearnSlice } from './slices/learnSlice';
import { createSubscriptionSlice } from './slices/subscriptionSlice';
import { createNotificationSlice } from './slices/notificationSlice';
import { createAppSlice } from './slices/appSlice';

// Re-export all types for backward compatibility
export type {
  UserProfile,
  SetupProgress,
  MissionProgress,
  DCAPlan,
  DCAGamification,
  DCABadge,
  SelectedPortfolio,
  UserPortfolio,
  LinkClick,
  LearnProgress,
  HomeWidget,
  UnlockState,
  SubscriptionState,
  AppNotification,
  InvestorType,
  AppState,
} from './types';

export const useAppStore = create<AppState>()(
  persist(
    (...a) => ({
      ...createOnboardingSlice(...a),
      ...createMissionSlice(...a),
      ...createPortfolioSlice(...a),
      ...createDCASlice(...a),
      ...createLearnSlice(...a),
      ...createSubscriptionSlice(...a),
      ...createNotificationSlice(...a),
      ...createAppSlice(...a),
    }),
    {
      name: 'apice-storage',
      version: 2, // Increment this when schema changes
      migrate: (persistedState: any, version: number) => {
        if (version === 0 || version === 1) {
          // Migration from v1 to v2: ensure new fields exist
          return {
            ...persistedState,
            userPortfolios: persistedState.userPortfolios || [],
            subscription: {
              ...persistedState.subscription,
              isTrial: persistedState.subscription?.isTrial ?? false,
            },
          };
        }
        return persistedState as any;
      },
    }
  )
);

// Investor type descriptions
export const investorTypeDescriptions: Record<
  InvestorType,
  { wants: string; avoids: string; firstStep: string }
> = {
  'Conservative Builder': {
    wants: 'Steady, predictable returns with minimal volatility',
    avoids: 'High-risk positions and aggressive trading strategies',
    firstStep: 'Start with a conservative DCA plan into BTC & ETH',
  },
  'Balanced Optimizer': {
    wants: 'Optimized risk-reward with diversified exposure',
    avoids: 'Overconcentration and emotional decision-making',
    firstStep: 'Select the Balanced Core portfolio and configure weekly DCA',
  },
  'Growth Seeker': {
    wants: 'Maximum capital appreciation with calculated risks',
    avoids: 'Missing high-potential opportunities by being too cautious',
    firstStep: 'Explore growth portfolios with higher altcoin allocation',
  },
};

// Recommended portfolio path based on investor type
export const recommendedPath: Record<InvestorType, 'conservative' | 'balanced' | 'growth'> = {
  'Conservative Builder': 'conservative',
  'Balanced Optimizer': 'balanced',
  'Growth Seeker': 'growth',
};
