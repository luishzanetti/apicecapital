import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

// Types
export interface UserProfile {
  goal: 'passive-income' | 'growth' | 'balanced' | 'protection' | null;
  experience: 'new' | 'intermediate' | 'experienced' | null;
  riskTolerance: 'low' | 'medium' | 'high' | null;
  capitalRange: 'under-200' | '200-1k' | '1k-5k' | '5k-plus' | null;
  habitType: 'passive' | 'minimal' | 'active' | null;
  preferredAssets: 'btc-eth' | 'majors' | 'majors-alts' | null;
}

export interface SetupProgress {
  exchangeAccountCreated: boolean;
  corePortfolioSelected: boolean;
  dcaPlanConfigured: boolean;
}

export interface DCAPlan {
  id: string;
  assets: { symbol: string; allocation: number }[];
  amountPerInterval: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  durationDays: number | null; // null = indefinite/forever
  startDate: string;
  isActive: boolean;
  totalInvested: number;
  nextExecutionDate: string;
}

export interface DCAGamification {
  totalPlansCreated: number;
  totalAmountCommitted: number;
  longestActivePlan: number;
  badges: string[];
  dcaStreak: number;
  lastDcaAction: string | null;
}

export interface DCABadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  unlockedAt: string | null;
}

export interface SelectedPortfolio {
  portfolioId: string | null;
  allocations: { asset: string; percentage: number }[];
  selectedAt: string | null;
}

export interface LinkClick {
  bybitClicked: boolean;
  bybitClickedAt: string | null;
  aiBotClicked: boolean;
  aiBotClickedAt: string | null;
  aiTradeClicked: boolean;
  aiTradeClickedAt: string | null;
}

export interface LearnProgress {
  completedLessons: string[];
  currentStreak: number;
  lastLessonDate: string | null;
  unlockedTracks: string[];
}

export interface UnlockState {
  // Free tier
  basicDashboard: boolean;
  limitedInsights: boolean;
  classicPortfolios: boolean;
  basicDcaPlanner: boolean;
  foundationalLessons: boolean;
  // Pro tier
  optimizedPortfolios: boolean;
  explosiveList: boolean;
  advancedDcaTemplates: boolean;
  aiTradeGuides: boolean;
  aiBotGuides: boolean;
  copyPortfolios: boolean;
  premiumInsights: boolean;
  weeklyReports: boolean;
  // Club tier
  community: boolean;
  advancedRiskModes: boolean;
}

export interface SubscriptionState {
  tier: 'free' | 'pro' | 'club';
  activeSince: string | null;
  expiresAt: string | null;
}

export type InvestorType =
  | 'Conservative Builder'
  | 'Balanced Optimizer'
  | 'Growth Seeker';

export interface AppState {
  // Onboarding
  hasCompletedOnboarding: boolean;
  currentQuizStep: number;

  // User profile
  userProfile: UserProfile;
  investorType: InvestorType | null;

  // Setup progress (3-step path)
  setupProgress: SetupProgress;
  setupProgressPercent: number;

  // Portfolio
  selectedPortfolio: SelectedPortfolio;

  // DCA Plans
  dcaPlans: DCAPlan[];
  dcaGamification: DCAGamification;

  // Link tracking
  linkClicks: LinkClick;

  // Learning
  learnProgress: LearnProgress;

  // Unlocks
  unlockState: UnlockState;
  subscription: SubscriptionState;

  // App state
  daysActive: number;
  lastOpenDate: string | null;
  currentInsightIndex: number;

  // Wizard states (checklist completion)
  aiTradeWizard: { [step: string]: boolean };
  aiBotWizard: { [step: string]: boolean };

  // Actions
  syncFromSupabase: () => Promise<void>;
  setQuizStep: (step: number) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  updateSetupProgress: (updates: Partial<SetupProgress>) => void;
  calculateInvestorType: () => void;
  setSelectedPortfolio: (portfolioId: string, allocations: { asset: string; percentage: number }[]) => void;
  addDcaPlan: (plan: Omit<DCAPlan, 'id'>) => void;
  updateDcaPlan: (id: string, updates: Partial<DCAPlan>) => void;
  deleteDcaPlan: (id: string) => void;
  updateDcaGamification: (updates: Partial<DCAGamification>) => void;
  unlockDcaBadge: (badgeId: string) => void;
  trackLinkClick: (link: 'bybit' | 'aiBot' | 'aiTrade') => void;
  completeLesson: (lessonId: string) => void;
  unlockTrack: (trackId: string) => void;
  completeWizardStep: (wizard: 'aiTrade' | 'aiBot', step: string) => void;
  unlockFeature: (feature: keyof UnlockState) => void;
  setSubscription: (tier: 'free' | 'pro' | 'club') => void;
  incrementDaysActive: () => void;
  advanceInsight: () => void;
  resetApp: () => void;
}

const defaultUserProfile: UserProfile = {
  goal: null,
  experience: null,
  riskTolerance: null,
  capitalRange: null,
  habitType: null,
  preferredAssets: null,
};

const defaultSetupProgress: SetupProgress = {
  exchangeAccountCreated: false,
  corePortfolioSelected: false,
  dcaPlanConfigured: false,
};

const defaultUnlockState: UnlockState = {
  // Free tier - enabled by default
  basicDashboard: true,
  limitedInsights: true,
  classicPortfolios: true,
  basicDcaPlanner: true,
  foundationalLessons: true,
  // Pro tier - locked
  optimizedPortfolios: false,
  explosiveList: false,
  advancedDcaTemplates: false,
  aiTradeGuides: false,
  aiBotGuides: false,
  copyPortfolios: false,
  premiumInsights: false,
  weeklyReports: false,
  // Club tier - locked
  community: false,
  advancedRiskModes: false,
};

const defaultLearnProgress: LearnProgress = {
  completedLessons: [],
  currentStreak: 0,
  lastLessonDate: null,
  unlockedTracks: ['foundations'],
};

const defaultLinkClicks: LinkClick = {
  bybitClicked: false,
  bybitClickedAt: null,
  aiBotClicked: false,
  aiBotClickedAt: null,
  aiTradeClicked: false,
  aiTradeClickedAt: null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasCompletedOnboarding: false,
      currentQuizStep: 0,
      userProfile: defaultUserProfile,
      investorType: null,
      setupProgress: defaultSetupProgress,
      setupProgressPercent: 0,
      selectedPortfolio: {
        portfolioId: null,
        allocations: [],
        selectedAt: null,
      },
      dcaPlans: [],
      linkClicks: defaultLinkClicks,
      learnProgress: defaultLearnProgress,
      unlockState: defaultUnlockState,
      subscription: {
        tier: 'free',
        activeSince: null,
        expiresAt: null,
      },
      daysActive: 0,
      lastOpenDate: null,
      currentInsightIndex: 0,
      aiTradeWizard: {},
      aiBotWizard: {},
      dcaGamification: {
        totalPlansCreated: 0,
        totalAmountCommitted: 0,
        longestActivePlan: 0,
        badges: [],
        dcaStreak: 0,
        lastDcaAction: null,
      },

      setQuizStep: (step) => set({ currentQuizStep: step }),

      syncFromSupabase: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch Profile
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
            // Merge other fields as needed
          }));
        }

        // Fetch Portfolios
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
              selectedAt: portfolios.created_at
            }
          })
        }

        // Fetch DCA Plans
        const { data: dcaPlans } = await supabase
          .from('dca_plans')
          .select('*')
          .eq('user_id', user.id);

        if (dcaPlans) {
          const formattedPlans = dcaPlans.map(p => ({
            id: p.id,
            assets: p.assets as any,
            amountPerInterval: p.amount_per_interval,
            frequency: p.frequency as any,
            durationDays: p.duration_days,
            startDate: p.start_date,
            isActive: p.is_active,
            totalInvested: p.total_invested,
            nextExecutionDate: p.next_execution_date
          }));
          set({ dcaPlans: formattedPlans });
        }
      },

      updateUserProfile: (updates) => {
        set((state) => {
          const newProfile = { ...state.userProfile, ...updates };

          // Sync to Supabase
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              supabase.from('profiles').upsert({
                id: user.id,
                updated_at: new Date().toISOString(),
                // Map camelCase to snake_case
                goal: newProfile.goal,
                experience: newProfile.experience,
                risk_tolerance: newProfile.riskTolerance,
                capital_range: newProfile.capitalRange,
                habit_type: newProfile.habitType,
                preferred_assets: newProfile.preferredAssets,
              }).then(({ error }) => {
                if (error) console.error('Error syncing profile:', error);
              });
            }
          });

          return { userProfile: newProfile };
        });
      },

      completeOnboarding: () => {
        const state = get();
        state.calculateInvestorType();
        set({ hasCompletedOnboarding: true });
      },

      updateSetupProgress: (updates) =>
        set((state) => {
          const newProgress = { ...state.setupProgress, ...updates };
          const completed = Object.values(newProgress).filter(Boolean).length;
          const total = Object.keys(newProgress).length;
          const setupProgressPercent = Math.round((completed / total) * 100);
          return { setupProgress: newProgress, setupProgressPercent };
        }),

      calculateInvestorType: () => {
        const { userProfile } = get();
        let type: InvestorType = 'Balanced Optimizer';

        if (userProfile.riskTolerance === 'low' || userProfile.goal === 'protection') {
          type = 'Conservative Builder';
        } else if (userProfile.riskTolerance === 'high' || userProfile.goal === 'growth') {
          type = 'Growth Seeker';
        }

        set({ investorType: type });

        // Sync to Supabase
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            supabase.from('profiles').update({
              investor_type: type,
              updated_at: new Date().toISOString()
            }).eq('id', user.id).then(({ error }) => {
              if (error) console.error('Error syncing investor type:', error);
            });
          }
        });
      },

      setSelectedPortfolio: (portfolioId, allocations) =>
        set((state) => {
          const newSetup = { ...state.setupProgress, corePortfolioSelected: true };
          const completed = Object.values(newSetup).filter(Boolean).length;
          const total = Object.keys(newSetup).length;

          // Sync to Supabase
          supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (user) {
              // Deselect previous portfolios
              await supabase.from('portfolios')
                .update({ is_selected: false })
                .eq('user_id', user.id);

              // Insert new selected portfolio
              await supabase.from('portfolios').insert({
                user_id: user.id,
                name: portfolioId,
                allocations: allocations,
                is_selected: true,
                created_at: new Date().toISOString()
              });
            }
          });

          return {
            selectedPortfolio: {
              portfolioId,
              allocations,
              selectedAt: new Date().toISOString(),
            },
            setupProgress: newSetup,
            setupProgressPercent: Math.round((completed / total) * 100),
          };
        }),

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

          // Update gamification
          const totalAmount = plan.durationDays
            ? plan.amountPerInterval * Math.ceil(plan.durationDays / (plan.frequency === 'daily' ? 1 : plan.frequency === 'weekly' ? 7 : plan.frequency === 'biweekly' ? 14 : 30))
            : plan.amountPerInterval * 52; // Assume 1 year for indefinite

          const newBadges = [...state.dcaGamification.badges];
          if (!newBadges.includes('first-step')) {
            newBadges.push('first-step');
          }
          if (plan.assets.length >= 3 && !newBadges.includes('diversifier')) {
            newBadges.push('diversifier');
          }
          if (plan.durationDays && plan.durationDays >= 90 && !newBadges.includes('long-game')) {
            newBadges.push('long-game');
          }
          if (plan.durationDays === null && !newBadges.includes('diamond-hands')) {
            newBadges.push('diamond-hands');
          }

          // Sync to Supabase
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              supabase.from('dca_plans').insert({
                user_id: user.id,
                assets: newPlan.assets,
                amount_per_interval: newPlan.amountPerInterval,
                frequency: newPlan.frequency,
                duration_days: newPlan.durationDays,
                start_date: newPlan.startDate,
                is_active: newPlan.isActive,
                total_invested: newPlan.totalInvested,
                next_execution_date: newPlan.nextExecutionDate
              }).then(({ error }) => {
                if (error) console.error('Error syncing DCA plan:', error);
              });
            }
          });

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

      updateDcaPlan: (id, updates) =>
        set((state) => {
          // Sync to Supabase - Note: This relies on the local ID matching,
          // but for new plans created offline vs online, IDs might mismatch.
          // For MVP, we assume mostly online or simple usage.
          // Ideally we'd map local ID to Supabase UUID.
          // Here we just try to update based on some logic or skip complex sync for now.
          // Let's implement a basic update using the 'id' if possible, or skip for MVP simplicity/robustness trade-off.
          // Actually, we can fetch the plan by some property or just log it.
          // A proper sync would require storing the Supabase UUID in the DCAPlan interface.
          // Let's modify DCAPlan interface later if needed. For now, we skip detailed update sync
          // or assume we only sync adds/fetches properly.

          // To be safe and simple for MVP: We won't implement deep sync for updates yet
          // to avoid ID mismatch errors, as Supabase ID is UUID and local is Date.now().
          return {
            dcaPlans: state.dcaPlans.map((p) =>
              p.id === id ? { ...p, ...updates } : p
            ),
          };
        }),

      deleteDcaPlan: (id) =>
        set((state) => ({
          dcaPlans: state.dcaPlans.filter((p) => p.id !== id),
        })),

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

      completeLesson: (lessonId) =>
        set((state) => {
          const today = new Date().toDateString();
          const lastDate = state.learnProgress.lastLessonDate;
          const yesterday = new Date(Date.now() - 86400000).toDateString();

          let newStreak = state.learnProgress.currentStreak;
          if (lastDate === yesterday) {
            newStreak += 1;
          } else if (lastDate !== today) {
            newStreak = 1;
          }

          return {
            learnProgress: {
              ...state.learnProgress,
              completedLessons: [...new Set([...state.learnProgress.completedLessons, lessonId])],
              currentStreak: newStreak,
              lastLessonDate: today,
            },
          };
        }),

      unlockTrack: (trackId) =>
        set((state) => ({
          learnProgress: {
            ...state.learnProgress,
            unlockedTracks: [...new Set([...state.learnProgress.unlockedTracks, trackId])],
          },
        })),

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

      incrementDaysActive: () =>
        set((state) => {
          const today = new Date().toDateString();

          // Sync days active
          if (state.lastOpenDate !== today) {
            supabase.auth.getUser().then(({ data: { user } }) => {
              if (user) {
                supabase.from('profiles').update({
                  days_active: state.daysActive + 1,
                  updated_at: new Date().toISOString()
                }).eq('id', user.id);
              }
            });
          }

          if (state.lastOpenDate !== today) {
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

      resetApp: () =>
        set({
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
          linkClicks: defaultLinkClicks,
          learnProgress: defaultLearnProgress,
          unlockState: defaultUnlockState,
          subscription: { tier: 'free', activeSince: null, expiresAt: null },
          daysActive: 0,
          lastOpenDate: null,
          currentInsightIndex: 0,
          aiTradeWizard: {},
          aiBotWizard: {},
        }),
    }),
    {
      name: 'apice-storage',
    }
  )
);

// Investor type descriptions
export const investorTypeDescriptions: Record<InvestorType, {
  wants: string;
  avoids: string;
  firstStep: string;
}> = {
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
