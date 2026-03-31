import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Onboarding V2 Types ─────────────────────────────────────

type Goal = 'savings' | 'growth' | 'retirement' | 'diversify';
type Experience = 'beginner' | 'intermediate' | 'advanced';
type RiskProfile = 'conservative' | 'moderate' | 'aggressive';

export interface OnboardingV2State {
  // Step tracking
  currentStep: number;
  completed: boolean;

  // Step 1: Profile
  goal: Goal | null;
  experience: Experience | null;
  riskProfile: RiskProfile | null;

  // Step 2: Strategy
  selectedStrategy: string | null;

  // Step 3: Amount
  weeklyAmount: number;

  // Actions
  setStep: (step: number) => void;
  setGoal: (goal: Goal) => void;
  setExperience: (exp: Experience) => void;
  setRiskProfile: (risk: RiskProfile) => void;
  setStrategy: (id: string) => void;
  setWeeklyAmount: (amount: number) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingV2Store = create<OnboardingV2State>()(
  persist(
    (set) => ({
      // Defaults
      currentStep: 0,
      completed: false,
      goal: null,
      experience: null,
      riskProfile: null,
      selectedStrategy: null,
      weeklyAmount: 100,

      // Actions
      setStep: (step) => set({ currentStep: step }),
      setGoal: (goal) => set({ goal }),
      setExperience: (experience) => set({ experience }),
      setRiskProfile: (riskProfile) => set({ riskProfile }),
      setStrategy: (selectedStrategy) => set({ selectedStrategy }),
      setWeeklyAmount: (weeklyAmount) => set({ weeklyAmount }),
      completeOnboarding: () => set({ completed: true }),
      resetOnboarding: () =>
        set({
          currentStep: 0,
          completed: false,
          goal: null,
          experience: null,
          riskProfile: null,
          selectedStrategy: null,
          weeklyAmount: 100,
        }),
    }),
    {
      name: 'apice-onboarding-v2',
    }
  )
);
