import type { StateCreator } from 'zustand';

// ─── User Profile ───────────────────────────────────────────
export interface UserProfile {
  goal: 'passive-income' | 'growth' | 'balanced' | 'protection' | null;
  experience: 'new' | 'intermediate' | 'experienced' | null;
  riskTolerance: 'low' | 'medium' | 'high' | null;
  capitalRange: 'under-200' | '200-1k' | '1k-5k' | '5k-plus' | null;
  habitType: 'passive' | 'minimal' | 'active' | null;
  preferredAssets: 'btc-eth' | 'majors' | 'majors-alts' | null;
}

export type InvestorType =
  | 'Conservative Builder'
  | 'Balanced Optimizer'
  | 'Growth Seeker';

// ─── Setup Progress ─────────────────────────────────────────
export interface SetupProgress {
  exchangeAccountCreated: boolean;
  corePortfolioSelected: boolean;
  dcaPlanConfigured: boolean;
}

// ─── Mission Progress ───────────────────────────────────────
export interface MissionProgress {
  m1_onboardingCompleted: boolean;
  m1_profileQuizDone: boolean;
  m2_methodologyRead: boolean;
  m2_whyCryptoExchange: boolean;
  m2_bybitAccountCreated: boolean;
  m2_bybitReferralUsed: boolean;
  m2_firstDepositUSDT: boolean;
  m2_activationChallengeDay: number;
  m2_challengeStartDate: string | null;
  m3_strategyChosen: boolean;
  m3_portfolioSelected: boolean;
  m3_allocationReviewed: boolean;
  m4_weeklyPlanSet: boolean;
  m4_firstDepositConfirmed: boolean;
  m4_allocationExecuted: boolean;
  m5_foundationsCourseCompleted: boolean;
  m5_firstStrategyMastered: boolean;
  m5_advancedUnlocked: boolean;
}

// ─── Portfolio ──────────────────────────────────────────────
export interface SelectedPortfolio {
  portfolioId: string | null;
  allocations: { asset: string; percentage: number; color?: string }[];
  selectedAt: string | null;
}

// ─── DCA ────────────────────────────────────────────────────
export interface DCAPlan {
  id: string;
  assets: { symbol: string; allocation: number }[];
  amountPerInterval: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  durationDays: number | null;
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

export interface WeeklyDeposit {
  weekId: string;
  amount: number;
  confirmedAt: string;
  allocations: { asset: string; amount: number; percentage: number }[];
}

// ─── Learning ───────────────────────────────────────────────
export interface LearnProgress {
  completedLessons: string[];
  currentStreak: number;
  lastLessonDate: string | null;
  unlockedTracks: string[];
}

// ─── Links ──────────────────────────────────────────────────
export interface LinkClick {
  bybitClicked: boolean;
  bybitClickedAt: string | null;
  aiBotClicked: boolean;
  aiBotClickedAt: string | null;
  aiTradeClicked: boolean;
  aiTradeClickedAt: string | null;
}

// ─── Subscription / Unlocks ─────────────────────────────────
export interface UnlockState {
  basicDashboard: boolean;
  limitedInsights: boolean;
  classicPortfolios: boolean;
  basicDcaPlanner: boolean;
  foundationalLessons: boolean;
  optimizedPortfolios: boolean;
  explosiveList: boolean;
  advancedDcaTemplates: boolean;
  aiTradeGuides: boolean;
  aiBotGuides: boolean;
  copyPortfolios: boolean;
  premiumInsights: boolean;
  weeklyReports: boolean;
  community: boolean;
  advancedRiskModes: boolean;
}

export interface SubscriptionState {
  tier: 'free' | 'pro' | 'club';
  activeSince: string | null;
  expiresAt: string | null;
}

// ─── Widgets ────────────────────────────────────────────────
export interface HomeWidget {
  id: string;
  enabled: boolean;
}

// ─── Slice State Interfaces ─────────────────────────────────

export interface OnboardingSlice {
  hasCompletedOnboarding: boolean;
  onboardingSkipped: boolean;
  onboardingStep: number;
  currentQuizStep: number;
  userProfile: UserProfile;
  investorType: InvestorType | null;
  syncFromSupabase: () => Promise<void>;
  setQuizStep: (step: number) => void;
  setOnboardingStep: (step: number) => void;
  skipOnboarding: () => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  calculateInvestorType: () => void;
}

export interface MissionSlice {
  missionProgress: MissionProgress;
  completeMissionTask: (task: keyof MissionProgress, value?: any) => void;
  startActivationChallenge: () => void;
  advanceChallengeDay: () => void;
}

export interface PortfolioSlice {
  selectedPortfolio: SelectedPortfolio;
  setupProgress: SetupProgress;
  setupProgressPercent: number;
  portfolioAccepted: boolean;
  setSelectedPortfolio: (portfolioId: string, allocations: { asset: string; percentage: number; color?: string }[]) => void;
  selectPortfolio: (portfolioId: string, allocations: { asset: string; percentage: number; color?: string }[]) => void;
  updateSetupProgress: (updates: Partial<SetupProgress>) => void;
  setPortfolioAccepted: (accepted: boolean) => void;
}

export interface DCASlice {
  dcaPlans: DCAPlan[];
  dcaGamification: DCAGamification;
  weeklyInvestment: number;
  investmentFrequency: 'weekly' | 'monthly';
  weeklyDepositHistory: WeeklyDeposit[];
  weeklyDepositStreak: number;
  addDcaPlan: (plan: Omit<DCAPlan, 'id'>) => void;
  updateDcaPlan: (id: string, updates: Partial<DCAPlan>) => void;
  deleteDcaPlan: (id: string) => void;
  updateDcaGamification: (updates: Partial<DCAGamification>) => void;
  unlockDcaBadge: (badgeId: string) => void;
  setWeeklyInvestment: (amount: number) => void;
  setInvestmentFrequency: (frequency: 'weekly' | 'monthly') => void;
  confirmWeeklyDeposit: (weekId: string, amount: number, allocations: { asset: string; amount: number; percentage: number }[]) => void;
  editDeposit: (weekId: string, newAmount: number) => void;
  removeDeposit: (weekId: string) => void;
}

export interface LearnSlice {
  learnProgress: LearnProgress;
  completeLesson: (lessonId: string) => void;
  unlockTrack: (trackId: string) => void;
}

export interface SubscriptionSlice {
  unlockState: UnlockState;
  subscription: SubscriptionState;
  aiTradeWizard: { [step: string]: boolean };
  aiBotWizard: { [step: string]: boolean };
  unlockFeature: (feature: keyof UnlockState) => void;
  setSubscription: (tier: 'free' | 'pro' | 'club') => void;
  completeWizardStep: (wizard: 'aiTrade' | 'aiBot', step: string) => void;
}

export interface AppSlice {
  daysActive: number;
  lastOpenDate: string | null;
  currentInsightIndex: number;
  widgetOrder: string[];
  linkClicks: LinkClick;
  trackLinkClick: (link: 'bybit' | 'aiBot' | 'aiTrade') => void;
  incrementDaysActive: () => void;
  advanceInsight: () => void;
  updateWidgetOrder: (order: string[]) => void;
  resetApp: () => void;
}

// ─── Combined AppState ──────────────────────────────────────
export type AppState =
  OnboardingSlice &
  MissionSlice &
  PortfolioSlice &
  DCASlice &
  LearnSlice &
  SubscriptionSlice &
  AppSlice;

// Slice creator helper type
export type SliceCreator<T> = StateCreator<AppState, [], [], T>;
