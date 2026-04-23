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
import { createAltisSlice } from './slices/altisSlice';
import { createEducationSlice } from './slices/educationSlice';
import { createBalanceSlice } from './slices/balanceSlice';
import { createTransferSlice } from './slices/transferSlice';
import { createApexAiSlice } from './slices/apexAiSlice';

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
  BotConfig,
  StrategyConfig,
  AltisSlice,
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
      ...createAltisSlice(...a),
      ...createEducationSlice(...a),
      ...createBalanceSlice(...a),
      ...createTransferSlice(...a),
      ...createApexAiSlice(...a),
    }),
    {
      name: 'apice-storage',
      version: 6, // v6: add Apex AI slice (wizard + landing viewed flags)
      // Only persist user-facing fields — transient server state is re-fetched on boot.
      partialize: (state) => {
        // Cast through unknown so we can explicitly control which keys are persisted.
        // Everything NOT listed here is reset to its slice default on rehydrate.
        const s = state as AppState;
        return {
          // onboarding
          hasCompletedOnboarding: s.hasCompletedOnboarding,
          onboardingSkipped: s.onboardingSkipped,
          onboardingStep: s.onboardingStep,
          currentQuizStep: s.currentQuizStep,
          userProfile: s.userProfile,
          investorType: s.investorType,
          // mission
          missionProgress: s.missionProgress,
          // portfolio
          selectedPortfolio: s.selectedPortfolio,
          setupProgress: s.setupProgress,
          setupProgressPercent: s.setupProgressPercent,
          portfolioAccepted: s.portfolioAccepted,
          userPortfolios: s.userPortfolios,
          // dca
          dcaPlans: s.dcaPlans,
          dcaGamification: s.dcaGamification,
          weeklyInvestment: s.weeklyInvestment,
          investmentFrequency: s.investmentFrequency,
          // learn (legacy)
          learnProgress: s.learnProgress,
          // subscription
          unlockState: s.unlockState,
          subscription: s.subscription,
          aiTradeWizard: s.aiTradeWizard,
          aiBotWizard: s.aiBotWizard,
          // notifications
          notifications: s.notifications,
          // app
          daysActive: s.daysActive,
          lastOpenDate: s.lastOpenDate,
          currentInsightIndex: s.currentInsightIndex,
          theme: s.theme,
          widgetOrder: s.widgetOrder,
          linkClicks: s.linkClicks,
          // altis
          bots: s.bots,
          activeBotId: s.activeBotId,
          // education — only user-facing gamification progress
          completedLessons: s.completedLessons,
          totalXP: s.totalXP,
          level: s.level,
          streak: s.streak,
          earnedBadges: s.earnedBadges,
          // balance — lastSnapshot timestamp only; payload refetched on demand
          lastSnapshot: s.lastSnapshot,
          // transfer — last 20 entries for history display
          transfers: (s.transfers ?? []).slice(0, 20),
          // apex ai — UI state only (canonical data lives in Supabase)
          apexAiActivePortfolioId: s.apexAiActivePortfolioId,
          apexAiHasViewedLanding: s.apexAiHasViewedLanding,
        } as Partial<AppState>;
      },
      migrate: (persistedState: any, version: number) => {
        if (import.meta.env.DEV) {
          console.info('[apice-storage] migrate', {
            fromVersion: version,
            toVersion: 4,
            hasBots: Array.isArray(persistedState?.bots)
              ? persistedState.bots.length
              : 'invalid',
            hasUserPortfolios: Array.isArray(persistedState?.userPortfolios)
              ? persistedState.userPortfolios.length
              : 'invalid',
          });
        }
        let state = persistedState ?? {};
        if (version === 0 || version === 1) {
          // v1 → v2: ensure new fields exist
          state = {
            ...state,
            userPortfolios: state.userPortfolios || [],
            subscription: {
              ...state.subscription,
              isTrial: state.subscription?.isTrial ?? false,
            },
          };
        }
        if (version < 3) {
          // v2 → v3: pull ALTIS bots out of legacy localStorage keys
          if (!state.bots || state.bots.length === 0) {
            try {
              if (typeof localStorage !== 'undefined') {
                const rawBots = localStorage.getItem('altis-bots');
                const rawActive = localStorage.getItem('altis-active-bot');
                if (rawBots) {
                  const parsed = JSON.parse(rawBots);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    state = {
                      ...state,
                      bots: parsed,
                      activeBotId: rawActive || parsed[0]?.id || null,
                    };
                  }
                }
              }
            } catch {
              // ignore migration failure; slice will start empty
            }
          }
          if (!state.bots) state.bots = [];
          if (state.activeBotId === undefined) state.activeBotId = null;
        }
        if (version < 4) {
          // v3 → v4: seed new education/balance/transfer fields
          state = {
            ...state,
            completedLessons: state.completedLessons ?? [],
            totalXP: state.totalXP ?? 0,
            level: state.level ?? 1,
            streak: state.streak ?? 0,
            earnedBadges: state.earnedBadges ?? [],
            lastSnapshot: state.lastSnapshot ?? null,
            transfers: state.transfers ?? [],
          };
        }
        if (version < 6) {
          // v5 → v6: seed Apex AI defaults
          state = {
            ...state,
            apexAiActivePortfolioId: state.apexAiActivePortfolioId ?? null,
            apexAiHasViewedLanding: state.apexAiHasViewedLanding ?? false,
          };
        }
        if (version < 5) {
          // v4 → v5: ALTIS collapses to single-bot. Users who accumulated
          // multiple bots via the old flow keep only the MOST RECENTLY
          // created one (highest createdAt). Their strategies / capital /
          // assets are preserved. Others are discarded.
          if (Array.isArray(state.bots) && state.bots.length > 1) {
            const sorted = [...state.bots].sort(
              (a: any, b: any) =>
                new Date(b?.createdAt ?? 0).getTime() -
                new Date(a?.createdAt ?? 0).getTime(),
            );
            const keep = sorted[0];
            state = {
              ...state,
              bots: [keep],
              activeBotId: keep?.id ?? null,
            };
            if (import.meta.env.DEV) {
              console.info('[apice-storage] v4→v5: collapsed multi-bot', {
                kept: keep?.id,
                discarded: sorted.slice(1).map((b: any) => b?.id),
              });
            }
          }
        }
        // Defensive: guarantee required arrays exist after migration chain
        state.bots = Array.isArray(state.bots) ? state.bots : [];
        state.userPortfolios = Array.isArray(state.userPortfolios)
          ? state.userPortfolios
          : [];
        return state as any;
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          if (import.meta.env.DEV) {
            console.error('[apice-storage] rehydrate error', error);
          }
          return;
        }
        if (import.meta.env.DEV) {
          console.info('[apice-storage] rehydrated', {
            bots: state?.bots?.length ?? 0,
            userPortfolios: state?.userPortfolios?.length ?? 0,
          });
        }
        // After rehydrate, attempt legacy migration if nothing landed in the store.
        if (state && typeof state.migrateFromLocalStorage === 'function') {
          try {
            state.migrateFromLocalStorage();
          } catch (err) {
            if (import.meta.env.DEV) {
              console.error('[apice-storage] legacy migration failed', err);
            }
          }
        }
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
