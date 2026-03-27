import type {
  UserProfile,
  SetupProgress,
  MissionProgress,
  UnlockState,
  LearnProgress,
  LinkClick,
} from './types';

export const defaultUserProfile: UserProfile = {
  goal: null,
  experience: null,
  riskTolerance: null,
  capitalRange: null,
  habitType: null,
  preferredAssets: null,
};

export const defaultSetupProgress: SetupProgress = {
  exchangeAccountCreated: false,
  corePortfolioSelected: false,
  dcaPlanConfigured: false,
};

export const defaultMissionProgress: MissionProgress = {
  m1_onboardingCompleted: false,
  m1_profileQuizDone: false,
  m2_methodologyRead: false,
  m2_whyCryptoExchange: false,
  m2_bybitAccountCreated: false,
  m2_bybitReferralUsed: false,
  m2_firstDepositUSDT: false,
  m2_activationChallengeDay: 0,
  m2_challengeStartDate: null,
  m3_strategyChosen: false,
  m3_portfolioSelected: false,
  m3_allocationReviewed: false,
  m4_weeklyPlanSet: false,
  m4_firstDepositConfirmed: false,
  m4_allocationExecuted: false,
  m5_foundationsCourseCompleted: false,
  m5_firstStrategyMastered: false,
  m5_advancedUnlocked: false,
};

export const defaultUnlockState: UnlockState = {
  basicDashboard: true,
  limitedInsights: true,
  classicPortfolios: true,
  basicDcaPlanner: true,
  foundationalLessons: true,
  optimizedPortfolios: false,
  explosiveList: false,
  advancedDcaTemplates: false,
  aiTradeGuides: false,
  aiBotGuides: false,
  copyPortfolios: false,
  premiumInsights: false,
  weeklyReports: false,
  community: false,
  advancedRiskModes: false,
};

export const defaultLearnProgress: LearnProgress = {
  completedLessons: [],
  currentStreak: 0,
  lastLessonDate: null,
  unlockedTracks: ['foundations'],
};

export const defaultLinkClicks: LinkClick = {
  bybitClicked: false,
  bybitClickedAt: null,
  aiBotClicked: false,
  aiBotClickedAt: null,
  aiTradeClicked: false,
  aiTradeClickedAt: null,
};
