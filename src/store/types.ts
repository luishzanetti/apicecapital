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
  m2_strategiesExplored: boolean;
  m2_apiConnected: boolean;
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

export interface UserPortfolio {
  id: string;
  name: string;
  allocations: { asset: string; percentage: number; color?: string }[];
  isActive: boolean;
  isCustom: boolean;
  templateId?: string;
  createdAt: string;
  totalInvested: number;
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

export type DCAPlanDraft = Omit<DCAPlan, 'id'> & { id?: string };

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
  isTrial: boolean;
}

// ─── Notifications ──────────────────────────────────────────
export type NotificationType = 'success' | 'warning' | 'error' | 'info';
export type NotificationCategory = 'dca' | 'system' | 'mission' | 'market';

export interface AppNotification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionRoute?: string;
  actionLabel?: string;
}

// ─── Widgets ────────────────────────────────────────────────
export interface HomeWidget {
  id: string;
  enabled: boolean;
}

// ─── Education (gamified learning) ──────────────────────────
export interface Track {
  id: string;
  slug: string;
  title: string;
  description?: string;
  tier: 'free' | 'pro' | 'club';
  order: number;
  icon?: string;
  colorTheme?: string;
  lessonCount: number;
  xpTotal: number;
}

export interface Lesson {
  id: string;
  trackId: string;
  slug: string;
  title: string;
  summary?: string;
  videoUrl?: string;
  videoDurationSec?: number;
  durationMin: number;
  xp: number;
  order: number;
  requiredTier: 'free' | 'pro' | 'club';
  quiz?: unknown[];
  challenge?: unknown;
}

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  earnedAt?: string;
}

export interface Challenge {
  id: string;
  slug: string;
  title: string;
  description?: string;
  type: 'daily' | 'weekly' | 'seasonal' | 'evergreen' | 'cohort';
  rulesJson: unknown;
  rewardXp: number;
  activeFrom?: string;
  activeTo?: string;
  progress?: { current: number; target: number; completedAt?: string };
}

export type CelebrationType = 'xp' | 'level' | 'badge' | 'streak';
export interface Celebration {
  type: CelebrationType;
  payload: unknown;
  seen: boolean;
}

// ─── Balance / Fund Alerts ──────────────────────────────────
export interface CurrentBalances {
  spot: number;
  unified: number;
  funding: number;
  contract: number;
  total: number;
}

export interface FundAlertContext {
  remainingExecutions?: number;
  remainingMonths?: number;
  required?: number;
  available?: number;
}

export interface FundAlert {
  id: string;
  planId: string | null;
  severity: 'info' | 'warning' | 'critical' | 'blocked';
  code: string;
  message: string;
  contextJson: FundAlertContext;
  triggeredAt: string;
}

// ─── Transfers ──────────────────────────────────────────────
export interface Transfer {
  id: string;
  fromAccount: string;
  toAccount: string;
  coin: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  bybitTxnId?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface TransferInput {
  fromAccount: string;
  toAccount: string;
  coin: string;
  amount: number;
  initiatedFrom?: string;
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

  // Multi-portfolio management
  userPortfolios: UserPortfolio[];
  addPortfolio: (portfolio: Omit<UserPortfolio, 'id' | 'createdAt' | 'totalInvested'>) => void;
  removePortfolio: (portfolioId: string) => void;
  updatePortfolio: (portfolioId: string, updates: Partial<UserPortfolio>) => void;
  setActivePortfolio: (portfolioId: string) => void;
}

export interface DCASlice {
  dcaPlans: DCAPlan[];
  dcaGamification: DCAGamification;
  weeklyInvestment: number;
  investmentFrequency: 'weekly' | 'monthly';
  addDcaPlan: (plan: DCAPlanDraft) => Promise<DCAPlan>;
  updateDcaPlan: (id: string, updates: Partial<DCAPlan>) => void;
  deleteDcaPlan: (id: string) => void;
  updateDcaGamification: (updates: Partial<DCAGamification>) => void;
  unlockDcaBadge: (badgeId: string) => void;
  setWeeklyInvestment: (amount: number) => void;
  setInvestmentFrequency: (frequency: 'weekly' | 'monthly') => void;
}

export interface LearnSlice {
  learnProgress: LearnProgress;
  completeLesson: (lessonId: string) => void;
  unlockTrack: (trackId: string) => void;
  resetLearnProgress: () => void;
}

export interface SubscriptionSlice {
  unlockState: UnlockState;
  subscription: SubscriptionState;
  aiTradeWizard: { [step: string]: boolean };
  aiBotWizard: { [step: string]: boolean };
  unlockFeature: (feature: keyof UnlockState) => void;
  setSubscription: (tier: 'free' | 'pro' | 'club') => void;
  startFreeTrial: () => void;
  checkTrialExpiry: () => void;
  completeWizardStep: (wizard: 'aiTrade' | 'aiBot', step: string) => void;
}

export interface NotificationSlice {
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;
}

export interface AppSlice {
  daysActive: number;
  lastOpenDate: string | null;
  currentInsightIndex: number;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  widgetOrder: string[];
  linkClicks: LinkClick;
  trackLinkClick: (link: 'bybit' | 'aiBot' | 'aiTrade') => void;
  incrementDaysActive: () => void;
  advanceInsight: () => void;
  updateWidgetOrder: (order: string[]) => void;
  resetApp: () => void;
}

// ─── ALTIS (leveraged trading) ──────────────────────────────
export interface StrategyConfig {
  id: string;
  strategyType: string;
  isActive: boolean;
  allocationPct: number;
  maxLeverage: number;
  assets: string[];
}

export interface BotConfig {
  id: string;
  name: string;
  capital: number;
  profile: string;
  strategies: StrategyConfig[];
  createdAt: string;
  isActive: boolean;
  maxLeverage: number;
  riskPerTradePct: number;
  maxPositions: number;
  autoExecute: boolean;
  selectedAssets: string[];
}

export interface AltisSlice {
  bots: BotConfig[];
  activeBotId: string | null;
  addBot: (
    name: string,
    capital: number,
    profile: string,
    strategies: StrategyConfig[],
    options?: {
      maxLeverage?: number;
      riskPerTradePct?: number;
      maxPositions?: number;
      autoExecute?: boolean;
      selectedAssets?: string[];
    }
  ) => string;
  removeBot: (botId: string) => void;
  setActiveBotId: (id: string) => void;
  updateActiveBot: (updates: Partial<BotConfig>) => void;
  updateStrategies: (updater: (prev: StrategyConfig[]) => StrategyConfig[]) => void;
  migrateFromLocalStorage: () => void;
}

// ─── Education Slice ────────────────────────────────────────
export interface EducationSlice {
  tracks: Track[];
  lessonsByTrack: Record<string, Lesson[]>;
  badges: Badge[];
  completedLessons: string[];
  lessonScores: Record<string, number>;
  totalXP: number;
  level: number;
  levelTitle: string;
  nextLevelThreshold: number;
  streak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  earnedBadges: Badge[];
  activeChallenges: Challenge[];
  lastCelebration: Celebration | null;

  hydrateEducation: () => Promise<void>;
  completeLesson_v2: (
    lessonId: string,
    score: number,
    timeSpentSec: number
  ) => Promise<{ leveledUp: boolean; badgesUnlocked: Badge[] }>;
  recordLessonView: (lessonId: string, timeSpentSec: number) => Promise<void>;
  acknowledgeCelebration: () => void;
}

// ─── Balance Slice ──────────────────────────────────────────
export interface BalanceSlice {
  currentBalances: CurrentBalances;
  alerts: FundAlert[];
  lastSnapshot: string | null;
  isRefreshing: boolean;
  refreshBalances: () => Promise<void>;
  dismissAlert: (id: string) => Promise<void>;
  getActiveAlert: (planId?: string) => FundAlert | null;
}

// ─── Transfer Slice ─────────────────────────────────────────
export interface TransferSlice {
  transfers: Transfer[];
  isTransferring: boolean;
  transferError: string | null;
  executeTransfer: (input: TransferInput) => Promise<Transfer | null>;
  fetchTransferHistory: (limit?: number) => Promise<void>;
  clearTransferError: () => void;
}

// ─── Apex AI Slice ──────────────────────────────────────────
// Minimal UI-state slice for Apex AI. Canonical data (portfolios/positions/trades)
// lives in Supabase and is read via TanStack Query + Realtime. This slice only
// tracks client-side UI selection and setup wizard state.
export interface ApexAiWizardState {
  step: 'exchange' | 'capital' | 'risk' | 'confirm' | 'done';
  capitalUsdt: number | null;
  riskProfile: 'conservative' | 'balanced' | 'aggressive' | null;
  lastProposal: import('@/types/apexAi').ApexAiQuickSetupProposal | null;
}

export interface ApexAiSlice {
  apexAiActivePortfolioId: string | null;
  apexAiWizard: ApexAiWizardState;
  apexAiHasViewedLanding: boolean;
  setApexAiActivePortfolio: (id: string | null) => void;
  resetApexAiWizard: () => void;
  updateApexAiWizard: (updates: Partial<ApexAiWizardState>) => void;
  markApexAiLandingViewed: () => void;
}

// ─── Combined AppState ──────────────────────────────────────
export type AppState =
  OnboardingSlice &
  MissionSlice &
  PortfolioSlice &
  DCASlice &
  LearnSlice &
  SubscriptionSlice &
  NotificationSlice &
  AppSlice &
  AltisSlice &
  EducationSlice &
  BalanceSlice &
  TransferSlice &
  ApexAiSlice;

// Slice creator helper type
export type SliceCreator<T> = StateCreator<AppState, [], [], T>;
