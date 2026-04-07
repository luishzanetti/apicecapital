// ============================================================================
// Apice Portfolio Tiers — Simplified Strategic System
// ============================================================================
// Philosophy: "Choose. Activate. Forget."
//
// 3 clear progression tiers + 1 AI-managed tier:
//   Starter → Core → Pro → AI Optimized
//
// Each tier includes mandatory War Chest in USDT.
// DCA auto-executes after 1-click activation.
// System recommends upgrade when user is ready.
// ============================================================================

export interface PortfolioAsset {
  symbol: string;
  name: string;
  percentage: number;
  color: string;
  isWarChest?: boolean;
}

export interface PortfolioTier {
  id: string;
  tier: 1 | 2 | 3 | 4;
  name: string;
  subtitle: string;
  emoji: string;
  description: string;
  // Strategy
  assets: PortfolioAsset[];
  warChestPct: number;
  // Requirements
  minWeekly: number;
  maxWeekly: number;
  suggestedWeekly: number;
  minCapitalLabel: string;
  // Targeting
  forProfile: ('Conservative Builder' | 'Balanced Optimizer' | 'Growth Seeker')[];
  riskLevel: 'low' | 'medium' | 'high' | 'dynamic';
  riskLabel: string;
  // Projections
  targetAnnualReturn: string;
  // UX
  highlight?: string;
  isRecommended?: boolean;
  isPro?: boolean;
  // Visual
  gradient: string;
  borderColor: string;
}

export interface UpgradeRecommendation {
  fromTier: string;
  toTier: string;
  reason: string;
  trigger: 'consistency' | 'capital_increase' | 'profile_evolution' | 'market_opportunity';
  conditions: {
    minStreakWeeks?: number;
    minBehavioralScore?: number;
    minCapitalInvested?: number;
    regime?: string;
  };
}

// ─── Tier Definitions ─────────────────────────────────────────

export const PORTFOLIO_TIERS: PortfolioTier[] = [
  // ── TIER 1: STARTER ──────────────────────────────────────────
  {
    id: 'apice-starter',
    tier: 1,
    name: 'Apice Starter',
    subtitle: 'Start with confidence',
    emoji: '🌱',
    description: 'Perfect for those taking their first steps in crypto. Full focus on BTC and ETH — the safest assets in the market — with War Chest for opportunities.',
    assets: [
      { symbol: 'BTC', name: 'Bitcoin', percentage: 55, color: '#F7931A' },
      { symbol: 'ETH', name: 'Ethereum', percentage: 28, color: '#627EEA' },
      { symbol: 'USDT', name: 'War Chest', percentage: 17, color: '#26A17B', isWarChest: true },
    ],
    warChestPct: 17,
    minWeekly: 10,
    maxWeekly: 100,
    suggestedWeekly: 25,
    minCapitalLabel: '$10/week',
    forProfile: ['Conservative Builder'],
    riskLevel: 'low',
    riskLabel: 'Low Risk',
    targetAnnualReturn: '10-20%',
    highlight: 'Ideal to start',
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    borderColor: 'border-emerald-500/30',
  },

  // ── TIER 2: CORE ─────────────────────────────────────────────
  {
    id: 'apice-core',
    tier: 2,
    name: 'Apice Core',
    subtitle: 'Solid base + diversification',
    emoji: '💎',
    description: 'The portfolio every consistent investor should have. Blue-chips + high-quality L1s + strategic War Chest. Smart DCA adjusts automatically by market regime.',
    assets: [
      { symbol: 'BTC', name: 'Bitcoin', percentage: 38, color: '#F7931A' },
      { symbol: 'ETH', name: 'Ethereum', percentage: 23, color: '#627EEA' },
      { symbol: 'SOL', name: 'Solana', percentage: 15, color: '#9945FF' },
      { symbol: 'USDT', name: 'War Chest', percentage: 14, color: '#26A17B', isWarChest: true },
      { symbol: 'LINK', name: 'Chainlink', percentage: 10, color: '#2A5ADA' },
    ],
    warChestPct: 14,
    minWeekly: 25,
    maxWeekly: 300,
    suggestedWeekly: 75,
    minCapitalLabel: '$25/week',
    forProfile: ['Balanced Optimizer'],
    riskLevel: 'medium',
    riskLabel: 'Medium Risk',
    targetAnnualReturn: '25-40%',
    isRecommended: true,
    highlight: 'Most popular',
    gradient: 'from-blue-500/10 to-indigo-600/5',
    borderColor: 'border-blue-500/30',
  },

  // ── TIER 3: PRO ──────────────────────────────────────────────
  {
    id: 'apice-pro',
    tier: 3,
    name: 'Apice Pro',
    subtitle: 'Maximum diversification',
    emoji: '🚀',
    description: 'For experienced investors seeking asymmetric returns. Diversification across 6 assets with aggressive Smart DCA + War Chest for capitulations.',
    assets: [
      { symbol: 'BTC', name: 'Bitcoin', percentage: 30, color: '#F7931A' },
      { symbol: 'ETH', name: 'Ethereum', percentage: 20, color: '#627EEA' },
      { symbol: 'SOL', name: 'Solana', percentage: 17, color: '#9945FF' },
      { symbol: 'USDT', name: 'War Chest', percentage: 11, color: '#26A17B', isWarChest: true },
      { symbol: 'AVAX', name: 'Avalanche', percentage: 10, color: '#E84142' },
      { symbol: 'LINK', name: 'Chainlink', percentage: 7, color: '#2A5ADA' },
      { symbol: 'DOT', name: 'Polkadot', percentage: 5, color: '#E6007A' },
    ],
    warChestPct: 11,
    minWeekly: 50,
    maxWeekly: 500,
    suggestedWeekly: 150,
    minCapitalLabel: '$50/week',
    forProfile: ['Growth Seeker'],
    riskLevel: 'high',
    riskLabel: 'High Risk',
    targetAnnualReturn: '40-70%',
    highlight: 'Maximum return',
    gradient: 'from-purple-500/10 to-pink-600/5',
    borderColor: 'border-purple-500/30',
  },

  // ── TIER 4: AI OPTIMIZED ─────────────────────────────────────
  {
    id: 'apice-ai',
    tier: 4,
    name: 'AI Optimized',
    subtitle: 'AI manages everything',
    emoji: '🧠',
    description: 'Portfolio 100% managed by Apice artificial intelligence. Allocations adjust automatically based on market regime, sentiment, and historical performance. Full autopilot.',
    assets: [
      { symbol: 'AI', name: 'Dynamic Allocation', percentage: 88, color: '#8B5CF6' },
      { symbol: 'USDT', name: 'War Chest', percentage: 12, color: '#26A17B', isWarChest: true },
    ],
    warChestPct: 12,
    minWeekly: 100,
    maxWeekly: 2000,
    suggestedWeekly: 250,
    minCapitalLabel: '$100/week',
    forProfile: ['Balanced Optimizer', 'Growth Seeker'],
    riskLevel: 'dynamic',
    riskLabel: 'Dynamic Risk (AI)',
    targetAnnualReturn: '30-60%+',
    isPro: true,
    highlight: 'Autopilot',
    gradient: 'from-violet-500/10 to-fuchsia-600/5',
    borderColor: 'border-violet-500/30',
  },
];

// ─── Upgrade Recommendations ──────────────────────────────────

export const UPGRADE_PATHS: UpgradeRecommendation[] = [
  {
    fromTier: 'apice-starter',
    toTier: 'apice-core',
    reason: 'You have {weeks} weeks of consistency! Ready to diversify with SOL and LINK.',
    trigger: 'consistency',
    conditions: { minStreakWeeks: 4, minBehavioralScore: 40 },
  },
  {
    fromTier: 'apice-starter',
    toTier: 'apice-core',
    reason: 'Your capital has grown! With ${amount} invested, you can take advantage of more diversification.',
    trigger: 'capital_increase',
    conditions: { minCapitalInvested: 500 },
  },
  {
    fromTier: 'apice-core',
    toTier: 'apice-pro',
    reason: 'Behavioral score of {score}/100 — your profile has evolved to Growth Seeker!',
    trigger: 'profile_evolution',
    conditions: { minStreakWeeks: 8, minBehavioralScore: 65 },
  },
  {
    fromTier: 'apice-core',
    toTier: 'apice-pro',
    reason: 'Market in capitulation (F&G: {fg}) — Pro has more assets to seize the opportunity.',
    trigger: 'market_opportunity',
    conditions: { regime: 'CAPITULATION' },
  },
  {
    fromTier: 'apice-pro',
    toTier: 'apice-ai',
    reason: 'With {weeks} weeks of consistency and a score of {score}, AI can optimize even further.',
    trigger: 'consistency',
    conditions: { minStreakWeeks: 12, minBehavioralScore: 75 },
  },
];

// ─── Helper Functions ─────────────────────────────────────────

export function getTierById(id: string): PortfolioTier | undefined {
  return PORTFOLIO_TIERS.find(t => t.id === id);
}

export function getRecommendedTier(
  investorType: string | null,
  weeklyBudget: number
): PortfolioTier {
  const type = (investorType || '').toLowerCase();

  if (type.includes('conservative') || weeklyBudget < 25) {
    return PORTFOLIO_TIERS[0]; // Starter
  }
  if (type.includes('growth') && weeklyBudget >= 50) {
    return PORTFOLIO_TIERS[2]; // Pro
  }
  return PORTFOLIO_TIERS[1]; // Core (default)
}

export function getUpgradeRecommendation(
  currentTierId: string,
  streakWeeks: number,
  behavioralScore: number,
  totalInvested: number,
  regime: string
): UpgradeRecommendation | null {
  const applicable = UPGRADE_PATHS.filter(u => u.fromTier === currentTierId);

  for (const upgrade of applicable) {
    const c = upgrade.conditions;
    let matches = true;

    if (c.minStreakWeeks && streakWeeks < c.minStreakWeeks) matches = false;
    if (c.minBehavioralScore && behavioralScore < c.minBehavioralScore) matches = false;
    if (c.minCapitalInvested && totalInvested < c.minCapitalInvested) matches = false;
    if (c.regime && regime !== c.regime) matches = false;

    if (matches) return upgrade;
  }

  return null;
}

// Weekly amount presets per tier
export const AMOUNT_PRESETS: Record<string, number[]> = {
  'apice-starter': [10, 15, 25, 50],
  'apice-core': [25, 50, 75, 100, 150],
  'apice-pro': [50, 100, 150, 250, 500],
  'apice-ai': [100, 200, 300, 500, 1000],
};
