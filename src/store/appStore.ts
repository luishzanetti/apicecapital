import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface UserProfile {
  goal: 'passive-income' | 'growth' | 'balanced' | 'protection' | null;
  experience: 'new' | 'intermediate' | 'experienced' | null;
  riskTolerance: 'low' | 'medium' | 'high' | null;
  capitalRange: 'under-200' | '200-1k' | '1k-5k' | '5k-plus' | null;
  timeInvolvement: 'zero' | 'minimal' | 'moderate' | null;
  investorStyle: 'conservative' | 'balanced' | 'aggressive' | null;
  region: string | null;
}

export interface SetupProgress {
  exchangeConnected: boolean;
  securityCompleted: boolean;
  pathSelected: boolean;
  moduleActivated: boolean;
  confirmationDone: boolean;
}

export interface UnlockState {
  basicDashboard: boolean;
  limitedInsights: boolean;
  basicStrategies: boolean;
  advancedStrategies: boolean;
  premiumInsights: boolean;
  performanceReports: boolean;
  aiBot: boolean;
  copyPortfolios: boolean;
  community: boolean;
  capitalOptimization: boolean;
}

export interface SubscriptionState {
  tier: 'free' | 'pro' | 'club';
  activeSince: string | null;
  expiresAt: string | null;
}

export type InvestorType = 
  | 'Conservative Builder' 
  | 'Balanced Optimizer' 
  | 'Growth Seeker' 
  | 'Wealth Protector'
  | 'Dynamic Investor';

export interface AppState {
  // Onboarding
  hasCompletedOnboarding: boolean;
  currentQuizStep: number;
  
  // User profile
  userProfile: UserProfile;
  investorType: InvestorType | null;
  
  // Progress
  setupProgress: SetupProgress;
  overallProgress: number;
  
  // Unlocks
  unlockState: UnlockState;
  subscription: SubscriptionState;
  
  // App state
  daysActive: number;
  lastOpenDate: string | null;
  
  // Actions
  setQuizStep: (step: number) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  updateSetupProgress: (updates: Partial<SetupProgress>) => void;
  calculateInvestorType: () => void;
  unlockFeature: (feature: keyof UnlockState) => void;
  setSubscription: (tier: 'free' | 'pro' | 'club') => void;
  incrementDaysActive: () => void;
  resetApp: () => void;
}

const defaultUserProfile: UserProfile = {
  goal: null,
  experience: null,
  riskTolerance: null,
  capitalRange: null,
  timeInvolvement: null,
  investorStyle: null,
  region: null,
};

const defaultSetupProgress: SetupProgress = {
  exchangeConnected: false,
  securityCompleted: false,
  pathSelected: false,
  moduleActivated: false,
  confirmationDone: false,
};

const defaultUnlockState: UnlockState = {
  basicDashboard: true,
  limitedInsights: true,
  basicStrategies: true,
  advancedStrategies: false,
  premiumInsights: false,
  performanceReports: false,
  aiBot: false,
  copyPortfolios: false,
  community: false,
  capitalOptimization: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasCompletedOnboarding: false,
      currentQuizStep: 0,
      userProfile: defaultUserProfile,
      investorType: null,
      setupProgress: defaultSetupProgress,
      overallProgress: 0,
      unlockState: defaultUnlockState,
      subscription: {
        tier: 'free',
        activeSince: null,
        expiresAt: null,
      },
      daysActive: 0,
      lastOpenDate: null,

      setQuizStep: (step) => set({ currentQuizStep: step }),

      updateUserProfile: (updates) =>
        set((state) => ({
          userProfile: { ...state.userProfile, ...updates },
        })),

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
          const overallProgress = Math.round((completed / total) * 100);

          // Progressive unlocking based on progress
          const newUnlocks = { ...state.unlockState };
          if (newProgress.exchangeConnected) {
            newUnlocks.copyPortfolios = true;
          }
          if (newProgress.securityCompleted) {
            newUnlocks.aiBot = true;
          }
          if (completed >= 3) {
            newUnlocks.advancedStrategies = true;
          }

          return {
            setupProgress: newProgress,
            overallProgress,
            unlockState: newUnlocks,
          };
        }),

      calculateInvestorType: () => {
        const { userProfile } = get();
        let type: InvestorType = 'Balanced Optimizer';

        if (userProfile.goal === 'protection') {
          type = 'Wealth Protector';
        } else if (userProfile.riskTolerance === 'low') {
          type = 'Conservative Builder';
        } else if (userProfile.riskTolerance === 'high' || userProfile.goal === 'growth') {
          type = 'Growth Seeker';
        } else if (userProfile.experience === 'experienced' && userProfile.riskTolerance === 'medium') {
          type = 'Dynamic Investor';
        }

        set({ investorType: type });
      },

      unlockFeature: (feature) =>
        set((state) => ({
          unlockState: { ...state.unlockState, [feature]: true },
        })),

      setSubscription: (tier) =>
        set((state) => {
          const newUnlocks = { ...state.unlockState };
          if (tier === 'pro' || tier === 'club') {
            newUnlocks.premiumInsights = true;
            newUnlocks.performanceReports = true;
            newUnlocks.advancedStrategies = true;
          }
          if (tier === 'club') {
            newUnlocks.community = true;
            newUnlocks.capitalOptimization = true;
          }

          return {
            subscription: {
              tier,
              activeSince: new Date().toISOString(),
              expiresAt: null,
            },
            unlockState: newUnlocks,
          };
        }),

      incrementDaysActive: () =>
        set((state) => {
          const today = new Date().toDateString();
          if (state.lastOpenDate !== today) {
            return {
              daysActive: state.daysActive + 1,
              lastOpenDate: today,
            };
          }
          return {};
        }),

      resetApp: () =>
        set({
          hasCompletedOnboarding: false,
          currentQuizStep: 0,
          userProfile: defaultUserProfile,
          investorType: null,
          setupProgress: defaultSetupProgress,
          overallProgress: 0,
          unlockState: defaultUnlockState,
          subscription: {
            tier: 'free',
            activeSince: null,
            expiresAt: null,
          },
          daysActive: 0,
          lastOpenDate: null,
        }),
    }),
    {
      name: 'apice-storage',
    }
  )
);

// Investor type traits
export const investorTypeTraits: Record<InvestorType, string[]> = {
  'Conservative Builder': [
    'Prioritizes capital preservation',
    'Prefers steady, low-risk returns',
    'Values automation with tight controls',
  ],
  'Balanced Optimizer': [
    'Seeks moderate growth with managed risk',
    'Open to diversified strategies',
    'Values transparency and control',
  ],
  'Growth Seeker': [
    'Comfortable with higher volatility',
    'Focused on maximizing returns',
    'Experienced with market dynamics',
  ],
  'Wealth Protector': [
    'Prioritizes protecting existing capital',
    'Conservative approach to risk',
    'Prefers proven, stable strategies',
  ],
  'Dynamic Investor': [
    'Adapts strategy to market conditions',
    'Experienced decision maker',
    'Balances growth and protection',
  ],
};

// Recommended strategy based on investor type
export const recommendedStrategy: Record<InvestorType, 'conservative' | 'balanced' | 'aggressive'> = {
  'Conservative Builder': 'conservative',
  'Balanced Optimizer': 'balanced',
  'Growth Seeker': 'aggressive',
  'Wealth Protector': 'conservative',
  'Dynamic Investor': 'balanced',
};
