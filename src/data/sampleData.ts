// Complete sample data for the Apice MVP

// ============== APICE RETURN RATES ==============
// Conservative: 15% annual (DCA + stablecoin buffer + blue-chip focus)
// Balanced: 35% annual (DCA + diversification + strategic rebalancing)
// Aggressive: 60%+ annual (DCA + micro-leverage + explosive allocation)

export const APICE_RETURN_RATES = {
  conservative: 0.15,
  balanced: 0.35,
  aggressive: 0.60,
} as const;

export type ApiceRiskLevel = keyof typeof APICE_RETURN_RATES;

export const getReturnRateForInvestorType = (investorType: string | null): number => {
  switch (investorType) {
    case 'Conservative Builder': return APICE_RETURN_RATES.conservative;
    case 'Growth Seeker': return APICE_RETURN_RATES.aggressive;
    default: return APICE_RETURN_RATES.balanced;
  }
};

export const getReturnLabel = (investorType: string | null): string => {
  switch (investorType) {
    case 'Conservative Builder': return '~15% a.a.';
    case 'Growth Seeker': return '~60%+ a.a.';
    default: return '~35% a.a.';
  }
};

// ============== DCA ASSETS ==============

export interface DCAAsset {
  symbol: string;
  name: string;
  category: 'blueChips' | 'layer1' | 'layer2' | 'defi' | 'stablecoins' | 'emerging';
  categoryLabel: string;
  color: string;
  isRecommended?: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export const dcaAssets: DCAAsset[] = [
  // Blue Chips
  { symbol: 'BTC', name: 'Bitcoin', category: 'blueChips', categoryLabel: 'Blue Chips', color: 'hsl(33, 100%, 50%)', isRecommended: true, riskLevel: 'low' },
  { symbol: 'ETH', name: 'Ethereum', category: 'blueChips', categoryLabel: 'Blue Chips', color: 'hsl(217, 100%, 60%)', isRecommended: true, riskLevel: 'low' },
  // Layer 1s
  { symbol: 'SOL', name: 'Solana', category: 'layer1', categoryLabel: 'Layer 1', color: 'hsl(280, 100%, 60%)', isRecommended: true, riskLevel: 'medium' },
  { symbol: 'AVAX', name: 'Avalanche', category: 'layer1', categoryLabel: 'Layer 1', color: 'hsl(0, 100%, 60%)', riskLevel: 'medium' },
  { symbol: 'ADA', name: 'Cardano', category: 'layer1', categoryLabel: 'Layer 1', color: 'hsl(210, 100%, 50%)', riskLevel: 'medium' },
  { symbol: 'NEAR', name: 'NEAR Protocol', category: 'layer1', categoryLabel: 'Layer 1', color: 'hsl(160, 100%, 45%)', riskLevel: 'medium' },
  { symbol: 'SUI', name: 'Sui', category: 'layer1', categoryLabel: 'Layer 1', color: 'hsl(200, 100%, 55%)', riskLevel: 'high' },
  // Layer 2s
  { symbol: 'ARB', name: 'Arbitrum', category: 'layer2', categoryLabel: 'Layer 2', color: 'hsl(210, 100%, 55%)', riskLevel: 'medium' },
  { symbol: 'OP', name: 'Optimism', category: 'layer2', categoryLabel: 'Layer 2', color: 'hsl(0, 100%, 55%)', riskLevel: 'medium' },
  { symbol: 'MATIC', name: 'Polygon', category: 'layer2', categoryLabel: 'Layer 2', color: 'hsl(270, 100%, 60%)', riskLevel: 'medium' },
  // DeFi
  { symbol: 'LINK', name: 'Chainlink', category: 'defi', categoryLabel: 'DeFi', color: 'hsl(220, 100%, 55%)', riskLevel: 'medium' },
  { symbol: 'UNI', name: 'Uniswap', category: 'defi', categoryLabel: 'DeFi', color: 'hsl(330, 100%, 60%)', riskLevel: 'medium' },
  { symbol: 'AAVE', name: 'Aave', category: 'defi', categoryLabel: 'DeFi', color: 'hsl(280, 80%, 55%)', riskLevel: 'medium' },
  // Stablecoins
  { symbol: 'USDT', name: 'Tether', category: 'stablecoins', categoryLabel: 'Stablecoins', color: 'hsl(152, 70%, 50%)', riskLevel: 'low' },
  { symbol: 'USDC', name: 'USD Coin', category: 'stablecoins', categoryLabel: 'Stablecoins', color: 'hsl(210, 100%, 55%)', riskLevel: 'low' },
  // Emerging
  { symbol: 'TIA', name: 'Celestia', category: 'emerging', categoryLabel: 'Emerging', color: 'hsl(270, 100%, 65%)', riskLevel: 'high' },
  { symbol: 'INJ', name: 'Injective', category: 'emerging', categoryLabel: 'Emerging', color: 'hsl(200, 100%, 55%)', riskLevel: 'high' },
  { symbol: 'JUP', name: 'Jupiter', category: 'emerging', categoryLabel: 'Emerging', color: 'hsl(30, 100%, 55%)', riskLevel: 'high' },
];

// ============== DCA HISTORICAL DATA ==============

export interface DCAHistoricalReturn {
  period: string;
  weeklyAmount: number;
  totalInvested: number;
  currentValue: number;
  returnPercent: number;
}

export const dcaHistoricalData: Record<string, DCAHistoricalReturn[]> = {
  BTC: [
    { period: '1 year', weeklyAmount: 25, totalInvested: 1300, currentValue: 2145, returnPercent: 65.0 },
    { period: '2 years', weeklyAmount: 25, totalInvested: 2600, currentValue: 5720, returnPercent: 120.0 },
    { period: '4 years', weeklyAmount: 25, totalInvested: 5200, currentValue: 18200, returnPercent: 250.0 },
  ],
  ETH: [
    { period: '1 year', weeklyAmount: 25, totalInvested: 1300, currentValue: 1950, returnPercent: 50.0 },
    { period: '2 years', weeklyAmount: 25, totalInvested: 2600, currentValue: 5460, returnPercent: 110.0 },
    { period: '4 years', weeklyAmount: 25, totalInvested: 5200, currentValue: 15600, returnPercent: 200.0 },
  ],
  'Apice Strategy': [
    { period: '1 year', weeklyAmount: 100, totalInvested: 5200, currentValue: 7020, returnPercent: 35.0 },
    { period: '2 years', weeklyAmount: 100, totalInvested: 10400, currentValue: 18980, returnPercent: 82.5 },
    { period: '4 years', weeklyAmount: 100, totalInvested: 20800, currentValue: 56160, returnPercent: 170.0 },
  ],
};

// ============== DCA QUOTES ==============

export interface DCAQuote {
  author: string;
  quote: string;
  role?: string;
}

export const dcaQuotes: DCAQuote[] = [
  { author: 'Warren Buffett', quote: 'The stock market transfers money from the impatient to the patient.', role: 'Legendary Investor' },
  { author: 'Benjamin Graham', quote: 'The essence of investment management is the management of risks, not returns.', role: 'Father of Value Investing' },
  { author: 'Jack Bogle', quote: 'Time is your friend; impulse is your enemy.', role: 'Vanguard Founder' },
  { author: 'Peter Lynch', quote: 'The key to making money in stocks is not to get scared out of them.', role: 'Fidelity Legend' },
];

// ============== DCA BADGES ==============

export interface DCABadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  category: 'beginner' | 'consistency' | 'diversification' | 'commitment';
}

export const dcaBadges: DCABadge[] = [
  { id: 'first-step', name: 'First Step', description: 'Created your first DCA plan', icon: '🚀', requirement: 'Create 1 DCA plan', category: 'beginner' },
  { id: 'consistency-king', name: 'Consistency King', description: '30 days with an active DCA plan', icon: '👑', requirement: '30-day active plan', category: 'consistency' },
  { id: 'diversifier', name: 'Diversifier', description: 'DCA into 3+ different assets', icon: '🎯', requirement: '3+ assets in DCA', category: 'diversification' },
  { id: 'long-game', name: 'Long Game', description: 'Created a 90+ day DCA plan', icon: '🏆', requirement: '90+ day plan', category: 'commitment' },
  { id: 'committed', name: 'Committed', description: 'Committed $1,000+ to DCA', icon: '💎', requirement: '$1,000+ committed', category: 'commitment' },
  { id: 'diamond-hands', name: 'Diamond Hands', description: 'Started an indefinite DCA plan', icon: '💪', requirement: 'Forever mode DCA', category: 'commitment' },
];

// ============== DCA RECOMMENDATIONS ==============

export interface DCARecommendation {
  id: string;
  profileType: 'Conservative Builder' | 'Balanced Optimizer' | 'Growth Seeker';
  capitalRange: 'under-200' | '200-1k' | '1k-5k' | '5k-plus';
  suggestedAmount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  assets: { symbol: string; allocation: number }[];
  rationale: string;
  marketContext: string;
}

export const dcaRecommendations: DCARecommendation[] = [
  // Conservative
  { id: 'rec-cons-1', profileType: 'Conservative Builder', capitalRange: 'under-200', suggestedAmount: 10, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 60 }, { symbol: 'ETH', allocation: 40 }], rationale: 'Focus on blue-chip stability with maximum capital preservation.', marketContext: 'Current market conditions favor disciplined accumulation.' },
  { id: 'rec-cons-2', profileType: 'Conservative Builder', capitalRange: '200-1k', suggestedAmount: 25, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 60 }, { symbol: 'ETH', allocation: 40 }], rationale: 'Steady accumulation of proven assets builds a solid foundation.', marketContext: 'Blue-chip dominance protects against volatility.' },
  { id: 'rec-cons-3', profileType: 'Conservative Builder', capitalRange: '1k-5k', suggestedAmount: 50, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 55 }, { symbol: 'ETH', allocation: 35 }, { symbol: 'USDT', allocation: 10 }], rationale: 'Maintain stablecoin buffer for opportunistic buying.', marketContext: 'Dry powder strategy enhances long-term returns.' },
  { id: 'rec-cons-4', profileType: 'Conservative Builder', capitalRange: '5k-plus', suggestedAmount: 100, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 50 }, { symbol: 'ETH', allocation: 35 }, { symbol: 'USDC', allocation: 15 }], rationale: 'Institutional-grade allocation with strategic reserves.', marketContext: 'Professional approach to systematic accumulation.' },
  // Balanced
  { id: 'rec-bal-1', profileType: 'Balanced Optimizer', capitalRange: 'under-200', suggestedAmount: 15, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 45 }, { symbol: 'ETH', allocation: 35 }, { symbol: 'SOL', allocation: 20 }], rationale: 'Core + growth allocation for optimized risk-reward.', marketContext: 'Diversification across top assets reduces concentration risk.' },
  { id: 'rec-bal-2', profileType: 'Balanced Optimizer', capitalRange: '200-1k', suggestedAmount: 35, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 40 }, { symbol: 'ETH', allocation: 30 }, { symbol: 'SOL', allocation: 20 }, { symbol: 'USDT', allocation: 10 }], rationale: 'Balanced exposure with tactical stablecoin position.', marketContext: 'Multi-asset approach captures broader market growth.' },
  { id: 'rec-bal-3', profileType: 'Balanced Optimizer', capitalRange: '1k-5k', suggestedAmount: 75, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 35 }, { symbol: 'ETH', allocation: 30 }, { symbol: 'SOL', allocation: 20 }, { symbol: 'LINK', allocation: 15 }], rationale: 'Add DeFi exposure for yield potential.', marketContext: 'Infrastructure plays offer asymmetric upside.' },
  { id: 'rec-bal-4', profileType: 'Balanced Optimizer', capitalRange: '5k-plus', suggestedAmount: 150, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 35 }, { symbol: 'ETH', allocation: 25 }, { symbol: 'SOL', allocation: 20 }, { symbol: 'AVAX', allocation: 10 }, { symbol: 'USDC', allocation: 10 }], rationale: 'Diversified core with L1 basket and reserves.', marketContext: 'Broad exposure to capture ecosystem growth.' },
  // Growth
  { id: 'rec-gro-1', profileType: 'Growth Seeker', capitalRange: 'under-200', suggestedAmount: 20, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 35 }, { symbol: 'ETH', allocation: 30 }, { symbol: 'SOL', allocation: 35 }], rationale: 'Higher beta allocation for growth potential.', marketContext: 'Early accumulation benefits from higher volatility exposure.' },
  { id: 'rec-gro-2', profileType: 'Growth Seeker', capitalRange: '200-1k', suggestedAmount: 50, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 30 }, { symbol: 'ETH', allocation: 25 }, { symbol: 'SOL', allocation: 25 }, { symbol: 'ARB', allocation: 20 }], rationale: 'L2 exposure adds growth potential with managed risk.', marketContext: 'Layer 2 adoption is accelerating.' },
  { id: 'rec-gro-3', profileType: 'Growth Seeker', capitalRange: '1k-5k', suggestedAmount: 100, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 25 }, { symbol: 'ETH', allocation: 25 }, { symbol: 'SOL', allocation: 20 }, { symbol: 'ARB', allocation: 15 }, { symbol: 'TIA', allocation: 15 }], rationale: 'Emerging asset allocation for asymmetric returns.', marketContext: 'Modular blockchain thesis gaining traction.' },
  { id: 'rec-gro-4', profileType: 'Growth Seeker', capitalRange: '5k-plus', suggestedAmount: 200, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 25 }, { symbol: 'ETH', allocation: 20 }, { symbol: 'SOL', allocation: 20 }, { symbol: 'ARB', allocation: 15 }, { symbol: 'INJ', allocation: 10 }, { symbol: 'JUP', allocation: 10 }], rationale: 'Aggressive diversification across high-conviction plays.', marketContext: 'Multi-ecosystem approach maximizes opportunity capture.' },
];

// ============== PORTFOLIOS ==============

export interface PortfolioAllocation {
  asset: string;
  percentage: number;
  color: string;
}

export interface Portfolio {
  id: string;
  name: string;
  type: 'core' | 'optimized' | 'explosive';
  risk: 'conservative' | 'balanced' | 'growth';
  riskLabel: 'Low Risk' | 'Medium Risk' | 'High Risk';
  allocations: PortfolioAllocation[];
  description: string;
  whyItWorks: string;
  minCapital: string;
  isLocked: boolean;
}

export const portfolios: Portfolio[] = [
  // Core Portfolios (Free)
  {
    id: 'classic-core',
    name: 'Classic Core',
    type: 'core',
    risk: 'balanced',
    riskLabel: 'Medium Risk',
    allocations: [
      { asset: 'BTC', percentage: 40, color: 'hsl(33, 100%, 50%)' },
      { asset: 'ETH', percentage: 30, color: 'hsl(217, 100%, 60%)' },
      { asset: 'SOL', percentage: 20, color: 'hsl(280, 100%, 60%)' },
      { asset: 'USDT', percentage: 10, color: 'hsl(152, 70%, 50%)' },
    ],
    description: 'The institutional standard. Heavy on BTC & ETH with tactical altcoin exposure.',
    whyItWorks: 'BTC and ETH provide store of value; SOL adds growth potential; USDT maintains dry powder.',
    minCapital: '$200',
    isLocked: false,
  },
  {
    id: 'conservative-core',
    name: 'Conservative Core',
    type: 'core',
    risk: 'conservative',
    riskLabel: 'Low Risk',
    allocations: [
      { asset: 'BTC', percentage: 50, color: 'hsl(33, 100%, 50%)' },
      { asset: 'ETH', percentage: 30, color: 'hsl(217, 100%, 60%)' },
      { asset: 'USDT', percentage: 20, color: 'hsl(152, 70%, 50%)' },
    ],
    description: 'Maximum stability. Focus on blue-chip assets with significant stablecoin buffer.',
    whyItWorks: 'Blue-chip dominance reduces volatility. Stablecoin allocation enables dip buying.',
    minCapital: '$100',
    isLocked: false,
  },
  {
    id: 'growth-core',
    name: 'Growth Core',
    type: 'core',
    risk: 'growth',
    riskLabel: 'High Risk',
    allocations: [
      { asset: 'BTC', percentage: 30, color: 'hsl(33, 100%, 50%)' },
      { asset: 'ETH', percentage: 25, color: 'hsl(217, 100%, 60%)' },
      { asset: 'SOL', percentage: 25, color: 'hsl(280, 100%, 60%)' },
      { asset: 'Others', percentage: 20, color: 'hsl(200, 100%, 50%)' },
    ],
    description: 'Higher altcoin exposure for those seeking asymmetric upside potential.',
    whyItWorks: 'Maintains BTC/ETH foundation while allocating to higher-beta assets.',
    minCapital: '$500',
    isLocked: false,
  },
  // Optimized Portfolios (Pro)
  {
    id: 'momentum-optimized',
    name: 'Momentum Alpha',
    type: 'optimized',
    risk: 'growth',
    riskLabel: 'High Risk',
    allocations: [
      { asset: 'BTC', percentage: 25, color: 'hsl(33, 100%, 50%)' },
      { asset: 'ETH', percentage: 20, color: 'hsl(217, 100%, 60%)' },
      { asset: 'SOL', percentage: 20, color: 'hsl(280, 100%, 60%)' },
      { asset: 'AVAX', percentage: 15, color: 'hsl(0, 100%, 60%)' },
      { asset: 'Others', percentage: 20, color: 'hsl(200, 100%, 50%)' },
    ],
    description: 'Designed to capture market momentum with tactical rebalancing.',
    whyItWorks: 'Dynamic allocation based on relative strength indicators.',
    minCapital: '$1,000',
    isLocked: true,
  },
  {
    id: 'yield-optimized',
    name: 'Yield Maximizer',
    type: 'optimized',
    risk: 'balanced',
    riskLabel: 'Medium Risk',
    allocations: [
      { asset: 'ETH', percentage: 35, color: 'hsl(217, 100%, 60%)' },
      { asset: 'BTC', percentage: 25, color: 'hsl(33, 100%, 50%)' },
      { asset: 'SOL', percentage: 20, color: 'hsl(280, 100%, 60%)' },
      { asset: 'Stables', percentage: 20, color: 'hsl(152, 70%, 50%)' },
    ],
    description: 'Optimized for yield generation through strategic positioning.',
    whyItWorks: 'Focus on assets with staking potential and DeFi yield opportunities.',
    minCapital: '$500',
    isLocked: true,
  },
];

// Explosive List (Club only)
export interface ExplosiveAsset {
  id: string;
  symbol: string;
  name: string;
  category: string;
  riskScore: number;
  rationale: string;
}

export const explosiveList: ExplosiveAsset[] = [
  {
    id: 'exp-1',
    symbol: 'WIF',
    name: 'dogwifhat',
    category: 'Memecoin',
    riskScore: 9,
    rationale: 'High-beta Solana memecoin with strong community.',
  },
  {
    id: 'exp-2',
    symbol: 'JUP',
    name: 'Jupiter',
    category: 'DeFi',
    riskScore: 7,
    rationale: 'Leading Solana DEX aggregator with strong fundamentals.',
  },
  {
    id: 'exp-3',
    symbol: 'INJ',
    name: 'Injective',
    category: 'L1/DeFi',
    riskScore: 7,
    rationale: 'Decentralized derivatives infrastructure.',
  },
];

// ============== DAILY INSIGHTS ==============

export interface DailyInsight {
  id: string;
  date: string;
  title: string;
  content: string;
  recommendedAction: string | null;
  type: 'market' | 'portfolio' | 'education' | 'discipline';
  lessonLink?: string;
}

// Generate 30 days of insights
const generateDailyInsights = (): DailyInsight[] => {
  const insights: DailyInsight[] = [
    {
      id: 'di-1',
      date: new Date().toISOString(),
      title: 'Market Stability Confirmed',
      content: 'Current volatility is within normal ranges. Your portfolio allocation remains optimal. No rebalancing needed.',
      recommendedAction: null,
      type: 'portfolio',
    },
    {
      id: 'di-2',
      date: new Date(Date.now() - 86400000).toISOString(),
      title: 'DCA Discipline Reminder',
      content: 'Consistent DCA beats timing the market. Your next scheduled buy maintains your cost-averaging advantage.',
      recommendedAction: 'Review your DCA schedule',
      type: 'discipline',
    },
    {
      id: 'di-3',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      title: 'Risk Band Check',
      content: 'Your portfolio remains within target risk parameters. Diversification score: Strong.',
      recommendedAction: null,
      type: 'portfolio',
    },
    {
      id: 'di-4',
      date: new Date(Date.now() - 86400000 * 3).toISOString(),
      title: 'Learning: Position Sizing',
      content: 'Understanding position sizing is key to risk management. Small positions in volatile assets protect your capital.',
      recommendedAction: 'Complete the Position Sizing lesson',
      type: 'education',
      lessonLink: 'position-sizing',
    },
    {
      id: 'di-5',
      date: new Date(Date.now() - 86400000 * 4).toISOString(),
      title: 'Weekly Market Context',
      content: 'Major indices stable. Crypto correlation to equities remains moderate. No significant macro catalysts this week.',
      recommendedAction: null,
      type: 'market',
    },
    {
      id: 'di-6',
      date: new Date(Date.now() - 86400000 * 5).toISOString(),
      title: 'Stay the Course',
      content: 'Emotional decisions erode returns. Your systematic approach is working. Trust the process.',
      recommendedAction: null,
      type: 'discipline',
    },
    {
      id: 'di-7',
      date: new Date(Date.now() - 86400000 * 6).toISOString(),
      title: 'Diversification Insight',
      content: 'Your multi-asset allocation reduces single-point-of-failure risk. This is institutional-grade thinking.',
      recommendedAction: null,
      type: 'portfolio',
    },
  ];

  // Generate more insights for remaining days
  for (let i = 8; i <= 30; i++) {
    const types: DailyInsight['type'][] = ['market', 'portfolio', 'education', 'discipline'];
    const type = types[i % 4];
    insights.push({
      id: `di-${i}`,
      date: new Date(Date.now() - 86400000 * (i - 1)).toISOString(),
      title: type === 'market' ? 'Market Update' : type === 'portfolio' ? 'Portfolio Status' : type === 'education' ? 'Learning Moment' : 'Discipline Check',
      content: 'Your portfolio continues to perform within expected parameters. Stay consistent with your strategy.',
      recommendedAction: null,
      type,
    });
  }

  return insights;
};

export const dailyInsights = generateDailyInsights();

// ============== LEARNING TRACKS ==============

export interface Lesson {
  id: string;
  title: string;
  summary: string[];
  content: string;
  doThisNow: string;
  readingTime: number;
  isLocked: boolean;
}

export interface Track {
  id: string;
  name: string;
  description: string;
  lessons: Lesson[];
  isLocked: boolean;
  requiredTier: 'free' | 'pro' | 'club';
}

export const learningTracks: Track[] = [
  {
    id: 'foundations',
    name: 'Foundations',
    description: 'Essential concepts every crypto investor must understand.',
    isLocked: false,
    requiredTier: 'free',
    lessons: [
      {
        id: 'intro-portfolio',
        title: 'What is a Crypto Portfolio?',
        summary: ['Collection of crypto assets', 'Diversification reduces risk', 'Balance between growth and stability'],
        content: 'A crypto portfolio is your collection of cryptocurrency holdings, strategically allocated to balance risk and return. Unlike picking a single asset, a portfolio approach spreads risk across multiple positions.',
        doThisNow: 'Review the Core Portfolios section to see example allocations.',
        readingTime: 3,
        isLocked: false,
      },
      {
        id: 'why-dca',
        title: 'Why DCA Works',
        summary: ['Removes emotional timing', 'Averages your entry price', 'Proven institutional strategy'],
        content: 'Dollar-Cost Averaging (DCA) means investing fixed amounts at regular intervals regardless of price. This eliminates the stress of timing and historically outperforms lump-sum investing for most people.',
        doThisNow: 'Set up your first DCA plan in the Automations tab.',
        readingTime: 4,
        isLocked: false,
      },
      {
        id: 'risk-tolerance',
        title: 'Understanding Your Risk Tolerance',
        summary: ['Know your comfort zone', 'Match strategy to psychology', 'Avoid panic selling'],
        content: 'Risk tolerance is how much volatility you can handle without making emotional decisions. Understanding this helps you choose the right portfolio and stick to it during market turbulence.',
        doThisNow: 'Confirm your investor profile matches how you truly feel about risk.',
        readingTime: 3,
        isLocked: false,
      },
      {
        id: 'position-sizing',
        title: 'Position Sizing Fundamentals',
        summary: ['Never bet too big on one asset', 'Protect your capital first', 'Small positions = big protection'],
        content: 'Position sizing determines how much of your portfolio goes into each asset. The rule: the riskier the asset, the smaller the position. This simple principle protects your downside.',
        doThisNow: 'Check if your current allocation follows position sizing principles.',
        readingTime: 4,
        isLocked: false,
      },
    ],
  },
  {
    id: 'dca-mastery',
    name: 'DCA Mastery',
    description: 'Complete guide to Dollar-Cost Averaging strategy.',
    isLocked: false,
    requiredTier: 'free',
    lessons: [
      {
        id: 'dca-intro',
        title: 'Introduction to DCA',
        summary: ['What is Dollar-Cost Averaging', 'How it reduces risk', 'Perfect for beginners'],
        content: 'Dollar-Cost Averaging (DCA) is an investment strategy where you invest a fixed amount of money at regular intervals, regardless of the asset price. This removes the stress of timing the market and smooths your entry price over time. Studies show DCA outperforms lump-sum investing for most retail investors due to reduced emotional decision-making.',
        doThisNow: 'Create your first DCA plan in the Automations tab.',
        readingTime: 3,
        isLocked: false,
      },
      {
        id: 'dca-psychology',
        title: 'The Psychology of DCA',
        summary: ['Removing emotional decisions', 'Discipline over timing', 'Sleep well at night'],
        content: 'The biggest enemy of investment returns is emotional decision-making. DCA removes this by automating your investment schedule. You buy when prices are high, and you buy when prices are low - averaging your cost. This disciplined approach means you sleep well at night knowing your strategy is working regardless of daily price movements.',
        doThisNow: 'Reflect on past investment decisions driven by emotion.',
        readingTime: 4,
        isLocked: false,
      },
      {
        id: 'dca-vs-lumpsum',
        title: 'DCA vs Lump Sum: The Data',
        summary: ['Historical comparisons', 'When each works best', 'Risk-adjusted returns'],
        content: 'While lump-sum investing has higher expected returns in trending markets, DCA provides superior risk-adjusted returns for most investors. Historical data shows that DCA into BTC and ETH over 4-year periods has generated positive returns 94% of the time, regardless of entry point. The key advantage: DCA protects against catastrophic timing mistakes.',
        doThisNow: 'Check the Historical Proof section for real data.',
        readingTime: 5,
        isLocked: false,
      },
      {
        id: 'dca-building-plan',
        title: 'Building Your DCA Plan',
        summary: ['Choosing the right amount', 'Selecting assets', 'Setting frequency'],
        content: 'A good DCA plan starts with an amount you can commit to consistently - consistency beats size. Choose 2-5 assets maximum to maintain focus. Weekly frequency provides optimal averaging, but biweekly or monthly works too. The key: pick a plan you can sustain for at least 6-12 months without interruption.',
        doThisNow: 'Use the AI Recommendation feature to get a personalized plan.',
        readingTime: 4,
        isLocked: false,
      },
      {
        id: 'dca-advanced',
        title: 'Advanced DCA Strategies',
        summary: ['Value averaging', 'Dynamic DCA', 'Rebalancing with DCA'],
        content: 'Advanced DCA techniques include value averaging (adjusting contribution based on portfolio performance), dynamic DCA (increasing purchases during drawdowns), and using DCA contributions to rebalance your portfolio. These strategies can enhance returns but require more active management.',
        doThisNow: 'Consider upgrading to Pro for advanced DCA templates.',
        readingTime: 5,
        isLocked: true,
      },
      {
        id: 'dca-success-stories',
        title: 'DCA Success Stories',
        summary: ['Real investor examples', 'Long-term results', 'Consistency wins'],
        content: 'The most successful crypto investors share one trait: consistency. Investors who DCA\'d $100/week into BTC since 2020 saw their portfolio grow to over 3x their total investment. The key lesson: time in market beats timing the market. Start small, stay consistent, and let compound growth work.',
        doThisNow: 'Start your DCA journey today - even $5/week matters.',
        readingTime: 4,
        isLocked: false,
      },
    ],
  },
  {
    id: 'portfolio-mastery',
    name: 'Portfolio Mastery',
    description: 'Advanced allocation strategies and rebalancing techniques.',
    isLocked: false,
    requiredTier: 'free',
    lessons: [
      {
        id: 'rebalancing-basics',
        title: 'When and How to Rebalance',
        summary: ['Maintain target allocations', 'Quarterly or threshold-based', 'Sell high, buy low automatically'],
        content: 'Rebalancing means adjusting your portfolio back to target allocations. When one asset grows significantly, you trim it and add to underperformers. This is a disciplined way to sell high and buy low.',
        doThisNow: 'Review your current allocation against your target.',
        readingTime: 5,
        isLocked: false,
      },
      {
        id: 'correlation-matters',
        title: 'Asset Correlation Explained',
        summary: ['Not all crypto moves together', 'True diversification needs low correlation', 'BTC/ETH vs altcoins'],
        content: 'Correlation measures how assets move relative to each other. True diversification requires holding assets that don\'t always move in the same direction.',
        doThisNow: 'Consider if your portfolio has enough uncorrelated positions.',
        readingTime: 4,
        isLocked: true,
      },
    ],
  },
  {
    id: 'automation',
    name: 'Automation',
    description: 'AI trading, DCA automation, and execution infrastructure.',
    isLocked: true,
    requiredTier: 'pro',
    lessons: [
      {
        id: 'ai-trade-intro',
        title: 'Introduction to AI Trading',
        summary: ['Algorithmic execution', 'Risk-managed by design', 'You remain in control'],
        content: 'AI trading uses algorithms to execute trades based on predefined strategies. You set the parameters, the AI executes. Your funds remain on your exchange.',
        doThisNow: 'Explore the AI Trade setup wizard in Automations.',
        readingTime: 4,
        isLocked: true,
      },
      {
        id: 'api-security',
        title: 'API Key Security Best Practices',
        summary: ['Read-only when possible', 'IP whitelisting is essential', 'Never share your keys'],
        content: 'API keys connect external tools to your exchange. Security is paramount. Always use IP restrictions, avoid withdrawal permissions, and rotate keys periodically.',
        doThisNow: 'Review your API key permissions on Bybit.',
        readingTime: 3,
        isLocked: true,
      },
    ],
  },
  {
    id: 'copy-trading',
    name: 'Copy Trading',
    description: 'Following curated portfolios and understanding copy mechanics.',
    isLocked: true,
    requiredTier: 'pro',
    lessons: [
      {
        id: 'copy-intro',
        title: 'How Copy Trading Works',
        summary: ['Mirror expert entries', 'Proportional position sizing', 'Stop anytime'],
        content: 'Copy trading automatically mirrors the trades of selected traders. Your positions are proportional to your allocated capital. You can stop copying at any time.',
        doThisNow: 'Review the Copy Portfolios section.',
        readingTime: 3,
        isLocked: true,
      },
    ],
  },
];

// ============== LEARNING BADGES ==============

export interface LearnBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  requirement: string;
  type: 'track' | 'streak' | 'milestone';
  unlockCondition: { type: 'lessons' | 'streak' | 'tracks'; count: number };
}

export const learnBadges: LearnBadge[] = [
  { id: 'first-lesson', name: 'First Light', icon: '💡', description: 'Completed your first lesson', requirement: 'Complete 1 lesson', type: 'milestone', unlockCondition: { type: 'lessons', count: 1 } },
  { id: 'curious-mind', name: 'Curious Mind', icon: '🧠', description: 'Completed 5 lessons', requirement: 'Complete 5 lessons', type: 'milestone', unlockCondition: { type: 'lessons', count: 5 } },
  { id: 'knowledge-seeker', name: 'Knowledge Seeker', icon: '📚', description: 'Completed 10 lessons', requirement: 'Complete 10 lessons', type: 'milestone', unlockCondition: { type: 'lessons', count: 10 } },
  { id: 'scholar', name: 'Scholar', icon: '🎓', description: 'Completed 15 lessons', requirement: 'Complete 15 lessons', type: 'milestone', unlockCondition: { type: 'lessons', count: 15 } },
  { id: 'streak-3', name: 'On Fire', icon: '🔥', description: '3-day learning streak', requirement: '3-day streak', type: 'streak', unlockCondition: { type: 'streak', count: 3 } },
  { id: 'streak-7', name: 'Unstoppable', icon: '⚡', description: '7-day learning streak', requirement: '7-day streak', type: 'streak', unlockCondition: { type: 'streak', count: 7 } },
  { id: 'track-complete', name: 'Track Master', icon: '🏆', description: 'Completed an entire track', requirement: 'Finish 1 track', type: 'track', unlockCondition: { type: 'tracks', count: 1 } },
  { id: 'multi-track', name: 'Polymath', icon: '🌟', description: 'Completed 2 tracks', requirement: 'Finish 2 tracks', type: 'track', unlockCondition: { type: 'tracks', count: 2 } },
];

// ============== COPY PORTFOLIOS ==============

export interface CopyPortfolio {
  id: string;
  name: string;
  risk: 'low' | 'balanced' | 'aggressive';
  riskLabel: string;
  forWho: string;
  description: string;
  riskExplanation: string;
  whatItAims: string;
  howItWorks: string;
}

export const copyPortfolios: CopyPortfolio[] = [
  {
    id: 'copy-low',
    name: 'Low Risk Copy',
    risk: 'low',
    riskLabel: 'Conservative',
    forWho: 'Investors prioritizing capital preservation with modest, steady returns.',
    description: 'Follows conservative traders with proven track records of consistent, low-volatility performance.',
    riskExplanation: 'Maximum drawdown target: 5%. Trades mostly major assets. Position sizes capped at 3% per trade.',
    whatItAims: 'Target: 10-15% annual return with minimal volatility. Focus on preservation over speculation.',
    howItWorks: 'You copy my entries automatically. Positions are proportional to your allocation. You can stop anytime.',
  },
  {
    id: 'copy-balanced',
    name: 'Balanced Copy',
    risk: 'balanced',
    riskLabel: 'Moderate',
    forWho: 'Investors seeking optimized risk-reward with controlled exposure.',
    description: 'Follows balanced traders who mix major assets with selective altcoin positions.',
    riskExplanation: 'Maximum drawdown target: 10%. Diversified across majors and select alts. Dynamic position sizing.',
    whatItAims: 'Target: 20-35% annual return with managed volatility. Growth with guardrails.',
    howItWorks: 'You copy my entries automatically. Positions are proportional to your allocation. You can stop anytime.',
  },
  {
    id: 'copy-aggressive',
    name: 'Aggressive Copy',
    risk: 'aggressive',
    riskLabel: 'Growth',
    forWho: 'Experienced investors comfortable with higher volatility for higher potential returns.',
    description: 'Follows growth-focused traders targeting asymmetric opportunities.',
    riskExplanation: 'Maximum drawdown target: 20%. Includes higher-beta altcoins. Larger position sizes on high-conviction plays.',
    whatItAims: 'Target: 40-60%+ annual return. Accepts higher volatility for potentially higher gains.',
    howItWorks: 'You copy my entries automatically. Positions are proportional to your allocation. You can stop anytime.',
  },
];

// ============== REFERRAL LINKS ==============

export interface ReferralLink {
  id: string;
  name: string;
  description: string;
  url: string;
  category: 'exchange' | 'ai-tool' | 'infrastructure';
}

export const referralLinks: ReferralLink[] = [
  {
    id: 'bybit',
    name: 'Bybit',
    description: 'Primary exchange for trading and DCA execution.',
    url: 'https://www.bybit.com/invite?ref=APICE', // Placeholder referral link
    category: 'exchange',
  },
  {
    id: 'ai-trade',
    name: 'AI Trade Tool',
    description: 'External AI execution tool for automated trading.',
    url: 'https://example.com/ai-trade?ref=apice', // Placeholder
    category: 'ai-tool',
  },
  {
    id: 'ai-bot',
    name: 'Bitradex AI Bot',
    description: 'AI automation infrastructure for consistent execution.',
    url: 'https://example.com/bitradex?ref=apice', // Placeholder
    category: 'infrastructure',
  },
];

// ============== SUBSCRIPTION PLANS ==============

export const subscriptionPlans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      'Investor profile & path',
      '1 Classic portfolio',
      'Basic DCA planner',
      'Limited daily insights',
      'Foundational lessons',
    ],
    limitations: [
      'No optimized portfolios',
      'No AI Trade guides',
      'No Copy portfolios',
      'No community access',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    period: 'per month',
    features: [
      'All Classic & Optimized portfolios',
      'Explosive List access',
      'Advanced DCA templates',
      'AI Trade setup guides',
      'AI Bot setup guides',
      'Copy portfolios',
      'Premium daily insights',
      'Weekly educational reports',
      'All learning tracks',
    ],
    limitations: [
      'No community access',
      'No advanced risk modes',
    ],
    recommended: true,
  },
  {
    id: 'club',
    name: 'Apice Club',
    price: '$79',
    period: 'per month',
    features: [
      'Everything in Pro',
      'Exclusive community access',
      'Advanced risk configurations',
      'Early access to new features',
      'Direct strategy team contact',
      'Custom portfolio consulting',
    ],
    limitations: [],
  },
];

// ============== FAQ ==============

export const faqItems = [
  {
    question: 'How do I keep control of my funds?',
    answer: 'Your funds always remain on your exchange account. Apice guides you through setup but never has access to your funds. You control everything.',
  },
  {
    question: 'What are the risks involved?',
    answer: 'All crypto trading involves risk. Past performance does not guarantee future results. Our frameworks include risk controls, but losses are possible. Only invest what you can afford to lose.',
  },
  {
    question: 'How does the copy trading work?',
    answer: 'Copy trading mirrors trades from curated portfolios. You allocate capital, and trades are proportionally copied to your account. You can stop copying at any time with no lock-up period.',
  },
  {
    question: 'Can I stop at any time?',
    answer: 'Yes, absolutely. You have full control to pause or stop any automation, DCA plan, or copy portfolio instantly. There are no lock-up periods or withdrawal restrictions.',
  },
  {
    question: 'What exchanges are supported?',
    answer: 'Currently, we guide users to set up on Bybit as our primary exchange partner, chosen for its reliability, security, and comprehensive features.',
  },
  {
    question: 'How do subscription tiers work?',
    answer: 'Free users get basic features and limited content. Pro unlocks all portfolios, automation guides, and premium insights. Club adds community access and advanced customization.',
  },
];

// ============== MISSIONS DATA ==============

export interface MissionTask {
  id: string;
  storeKey: string;
  title: string;
  description: string;
  actionLabel: string;
  actionRoute?: string;
  xp: number;
}

export interface MissionDef {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  gradient: string;
  badge: string;
  badgeIcon: string;
  xpTotal: number;
  tasks: MissionTask[];
}

export const missionDefinitions: MissionDef[] = [
  {
    id: 1,
    title: 'The Awakening',
    subtitle: 'Ignite your journey into the Apice universe',
    icon: '🔥',
    color: 'text-orange-400',
    gradient: 'from-orange-500 to-red-500',
    badge: 'Awakened',
    badgeIcon: '👁️',
    xpTotal: 300,
    tasks: [
      { id: 'm1-1', storeKey: 'm1_onboardingCompleted', title: 'The Manifesto', description: 'Unlock the vision. Understand how elite capital flows and why you were invited.', actionLabel: 'Explore Vision', actionRoute: '/onboarding', xp: 150 },
      { id: 'm1-2', storeKey: 'm1_profileQuizDone', title: 'DNA Analysis', description: 'Our AI needs to understand your core. Reveal your investor DNA to unlock the path.', actionLabel: 'Start Scan', actionRoute: '/quiz', xp: 150 },
    ],
  },
  {
    id: 2,
    title: 'Methodology Master',
    subtitle: 'Internalize the laws of asymmetric growth',
    icon: '🧠',
    color: 'text-indigo-400',
    gradient: 'from-indigo-500 to-blue-500',
    badge: 'Apice Sage',
    badgeIcon: '📚',
    xpTotal: 600,
    tasks: [
      { id: 'm2-1', storeKey: 'm2_methodologyRead', title: 'Master the Apice Method', description: 'Internalize the 3 Pillars: DCA + Diversification + Micro-Leverage for explosive performance.', actionLabel: 'Deep Dive', actionRoute: '/learn', xp: 150 },
      { id: 'm2-2', storeKey: 'm2_whyCryptoExchange', title: 'The Fortress', description: 'Why self-custody and top-tier exchanges like Bybit are your financial fortress.', actionLabel: 'Build Fortress', actionRoute: '/activation-challenge', xp: 100 },
      { id: 'm2-3', storeKey: 'm2_bybitAccountCreated', title: 'Gateway Access', description: 'Create your multi-chain gateway on Bybit. This is your primary execution engine.', actionLabel: 'Secure Access', actionRoute: '/activation-challenge', xp: 150 },
      { id: 'm2-4', storeKey: 'm2_bybitReferralUsed', title: 'Elite Benefits', description: 'Activate the Apice protocol on your account for fee reduction and exclusive liquidity.', actionLabel: 'Activate Perks', xp: 100 },
      { id: 'm2-5', storeKey: 'm2_firstDepositUSDT', title: 'Fuel the Tank', description: 'Fuel your journey with your first USDT deposit. Even the smallest spark starts a fire.', actionLabel: 'Fuel Up', xp: 100 },
    ],
  },
  {
    id: 3,
    title: 'Smart Diversifier',
    subtitle: 'Construct your resilient wealth engine',
    icon: '🛡️',
    color: 'text-emerald-400',
    gradient: 'from-emerald-500 to-cyan-500',
    badge: 'Architect',
    badgeIcon: '🏗️',
    xpTotal: 400,
    tasks: [
      { id: 'm3-1', storeKey: 'm3_strategyChosen', title: 'Strategic Alignment', description: 'Align your goals with the right risk profile: Conservative, Balanced, or Aggressive growth.', actionLabel: 'Align Now', actionRoute: '/portfolio', xp: 100 },
      { id: 'm3-2', storeKey: 'm3_portfolioSelected', title: 'Architect Selection', description: 'Choose a battle-tested portfolio blueprint optimized by our AI for current cycles.', actionLabel: 'Choose Blueprint', actionRoute: '/portfolio', xp: 150 },
      { id: 'm3-3', storeKey: 'm3_allocationReviewed', title: 'Precision Check', description: 'Review the weights. Understand exactly what you own and why it\'s there.', actionLabel: 'Verify Weights', actionRoute: '/portfolio', xp: 150 },
    ],
  },
  {
    id: 4,
    title: 'Execution Force',
    subtitle: 'Deploy your capital into the digital frontier',
    icon: '⚔️',
    color: 'text-rose-400',
    gradient: 'from-rose-500 to-pink-500',
    badge: 'Centurion',
    badgeIcon: '💎',
    xpTotal: 500,
    tasks: [
      { id: 'm4-1', storeKey: 'm4_weeklyPlanSet', title: 'Discipline Protocol', description: 'Set your automated DCA frequency. Consistency is the ultimate weapon.', actionLabel: 'Set Protocol', actionRoute: '/investment-setup', xp: 150 },
      { id: 'm4-2', storeKey: 'm4_firstDepositConfirmed', title: 'Initial Deployment', description: 'Execute your first cross-asset allocation and witness the engine start.', actionLabel: 'Launch Port', actionRoute: '/portfolio', xp: 150 },
      { id: 'm4-3', storeKey: 'm4_allocationExecuted', title: 'Market Presence', description: 'Establish your presence. Your first real-time execution across the portfolio.', actionLabel: 'Execute Plan', actionRoute: '/portfolio', xp: 200 },
    ],
  },
  {
    id: 5,
    title: 'The Ascended',
    subtitle: 'Unlock elite strategies and deep automation',
    icon: '👑',
    color: 'text-amber-400',
    gradient: 'from-amber-500 to-yellow-500',
    badge: 'Ascended',
    badgeIcon: '✨',
    xpTotal: 700,
    tasks: [
      { id: 'm5-1', storeKey: 'm5_foundationsCourseCompleted', title: 'Advanced Intel', description: 'Complete the full Foundations course to unlock deeper market understanding.', actionLabel: 'Get Intel', actionRoute: '/learn', xp: 250 },
      { id: 'm5-2', storeKey: 'm5_firstStrategyMastered', title: 'Elite Strategy', description: 'Demonstrate DCA mastery for 4 consecutive weeks to prove your resolve.', actionLabel: 'Show Mastery', actionRoute: '/learn', xp: 250 },
      { id: 'm5-3', storeKey: 'm5_advancedUnlocked', title: 'Final Ascension', description: 'Unlock institutional-grade optimized portfolios and automated copy trading.', actionLabel: 'Ascend Now', xp: 200 },
    ],
  },
];

// ============== 7-DAY ACTIVATION CHALLENGE ==============

export interface ChallengeDay {
  day: number;
  title: string;
  subtitle: string;
  icon: string;
  tasks: { id: string; title: string; description: string; actionLabel: string; actionRoute?: string; tip?: string }[];
  reward: string;
}

export const activationChallenge: ChallengeDay[] = [
  {
    day: 1, title: 'Understand the Game', subtitle: 'Why invest in crypto and how Apice works', icon: '🧠',
    tasks: [
      { id: 'c1-1', title: 'What is the crypto market?', description: 'Crypto is the most innovative financial market in the world. Bitcoin has generated returns of over 1,000,000% since 2009. Apice helps you participate intelligently.', actionLabel: 'Got It', tip: 'The crypto market operates 24/7 — unlike the stock market.' },
      { id: 'c1-2', title: 'Why DCA works better than timing', description: 'Investing a fixed amount every week eliminates emotion. 95% of traders who try to time the market lose money. With DCA, you buy more when prices are low and less when they\'re high.', actionLabel: 'Learn DCA', actionRoute: '/learn' },
      { id: 'c1-3', title: 'The Apice methodology in 3 pillars', description: '1️⃣ Strategic DCA — weekly investments. 2️⃣ Smart Diversification — blue-chips, L1s, DeFi. 3️⃣ Micro-Leverage — 2-5x on 10-20% of portfolio.', actionLabel: 'Continue' },
    ],
    reward: '🏅 Apice Starter',
  },
  {
    day: 2, title: 'Your Exchange Account', subtitle: 'Create your Bybit account step by step', icon: '🏦',
    tasks: [
      { id: 'c2-1', title: 'Why use Bybit?', description: 'One of the world\'s largest exchanges: ✅ Low fees (0.1%), ✅ Intuitive interface, ✅ Auto DCA, ✅ Copy trading, ✅ Institutional security.', actionLabel: 'Got It', tip: 'Your funds stay in YOUR account. Apice never has access to your money.' },
      { id: 'c2-2', title: 'Step 1: Create your account', description: 'Go to bybit.com through our link. Sign Up with email, create a strong password, confirm your email.', actionLabel: 'Open Bybit', tip: 'Use our invite for a $30 bonus + reduced fees.' },
      { id: 'c2-3', title: 'Step 2: KYC Verification', description: 'Submit an ID document + selfie. 5-15 min process, approval within 24h.', actionLabel: 'Verify Account', tip: 'KYC is legally required and protects your account from fraud.' },
    ],
    reward: '🏅 Exchange Ready',
  },
  {
    day: 3, title: 'First Deposit', subtitle: 'Deposit USDT and get ready to invest', icon: '💵',
    tasks: [
      { id: 'c3-1', title: 'What is USDT?', description: 'A stablecoin pegged to the dollar: 1 USDT = 1 USD. It\'s the base currency to buy other cryptos.', actionLabel: 'Got It' },
      { id: 'c3-2', title: 'How to deposit USDT on Bybit', description: '1) Assets → Deposit. 2) Select USDT, TRC20 network. 3) Copy the address. 4) Send from another exchange or use P2P.', actionLabel: 'Deposit Now', tip: 'Start with any amount: $10, $50, or $100.' },
    ],
    reward: '🏅 Funded',
  },
  {
    day: 4, title: 'Choose Your Strategy', subtitle: 'Define your profile and select a portfolio', icon: '🎯',
    tasks: [
      { id: 'c4-1', title: 'Review your investor profile', description: 'Confirm that the profile reflects your real goals and risk tolerance.', actionLabel: 'View Profile', actionRoute: '/profile-result' },
      { id: 'c4-2', title: 'Choose a portfolio', description: 'Select one of the curated portfolios. You can change it at any time.', actionLabel: 'Choose Portfolio', actionRoute: '/portfolio' },
    ],
    reward: '🏅 Strategist',
  },
  {
    day: 5, title: 'First Investment', subtitle: 'Execute your first purchase following the plan', icon: '🚀',
    tasks: [
      { id: 'c5-1', title: 'Set up your weekly DCA', description: 'Define your weekly amount. $25/week for 5 years could grow to $15,000+ with the Apice methodology.', actionLabel: 'Set Up DCA', actionRoute: '/investment-setup' },
      { id: 'c5-2', title: 'Execute your first purchase', description: 'On Bybit, use Spot Trading. Buy in the proportions of your portfolio. Confirm in the app.', actionLabel: 'Confirm Purchase', actionRoute: '/portfolio', tip: 'Use "Market" orders for instant purchase.' },
    ],
    reward: '🏅 First Trade',
  },
  {
    day: 6, title: 'Automation & Discipline', subtitle: 'Set up reminders and tracking', icon: '⚡',
    tasks: [
      { id: 'c6-1', title: 'Set weekly alerts', description: 'Weekly reminder (Friday is ideal) for your deposit. Build the habit.', actionLabel: 'Set Up' },
      { id: 'c6-2', title: 'Understand rebalancing', description: 'Every month, review allocations and redistribute if needed.', actionLabel: 'Learn', actionRoute: '/learn' },
    ],
    reward: '🏅 Disciplined',
  },
  {
    day: 7, title: 'Review & Level Up', subtitle: 'Review your progress and unlock the next level', icon: '🏆',
    tasks: [
      { id: 'c7-1', title: 'Review your first week', description: 'Congratulations! ✅ Account created, ✅ Deposit made, ✅ Portfolio set, ✅ Investment executed. You\'re ahead of 90% of people.', actionLabel: 'View Summary', actionRoute: '/home' },
      { id: 'c7-2', title: 'Unlock the next level', description: 'Complete Foundations + 4 weeks of DCA to unlock optimized portfolios and copy trading.', actionLabel: 'Go to Learn', actionRoute: '/learn', tip: 'Members who complete everything are 3x more likely to reach their goals.' },
    ],
    reward: '🏅 7-Day Champion',
  },
];

// ============== BYBIT GUIDE ==============

export const bybitGuide = {
  referralLink: 'https://www.bybit.com/invite?ref=APICE',
  referralCode: 'APICE',
  benefits: [
    { icon: '💰', title: '$30 Bonus', description: 'Earn up to $30 USDT by creating your account with our invite' },
    { icon: '📉', title: 'Reduced Fees', description: 'Discount on trading fees through the Apice partner link' },
    { icon: '🎁', title: 'Exclusive Promotions', description: 'Access to exclusive events and rewards for Apice members' },
    { icon: '🤝', title: 'Priority Support', description: 'Dedicated support via the Apice community for any questions' },
  ],
  steps: [
    { step: 1, title: 'Access the link', description: 'Click the button to open Bybit with our invite applied.' },
    { step: 2, title: 'Create your account', description: 'Email + strong password. Confirm the verification email.' },
    { step: 3, title: 'KYC Verification', description: 'Identity document + selfie. Approval within 24h.' },
    { step: 4, title: 'Deposit USDT', description: 'Assets → Deposit → USDT → TRC20 Network. Any amount.' },
    { step: 5, title: 'Back to the app', description: 'Confirm here that you are ready and start investing.' },
  ],
};

// ============== LOCKED STRATEGIES ==============

export interface LockedStrategy {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockRequirements: string[];
  expectedReturn: string;
  risk: string;
  color: string;
  gradient: string;
}

export const lockedStrategies: LockedStrategy[] = [
  {
    id: 'copy-trading',
    name: 'Copy Trading',
    icon: '🤖',
    description: 'Automatically copy trades from top Bybit traders. AI selects the top performers for you.',
    unlockRequirements: ['Complete 4 weeks of DCA', 'Minimum investment of $500', 'Foundations course complete'],
    expectedReturn: '25-80% APY',
    risk: 'Medium-High',
    color: 'text-blue-400',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'grid-bot',
    name: 'Grid Bot',
    icon: '📊',
    description: 'Automated trading bots that profit from sideways market volatility. Operates 24/7 without intervention.',
    unlockRequirements: ['Complete Mission 5', 'Minimum investment of $2,000', 'Pro Subscription'],
    expectedReturn: '15-40% APY',
    risk: 'Medium',
    color: 'text-purple-400',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'dca-futures',
    name: 'DCA with Micro-Leverage',
    icon: '⚡',
    description: 'Combine DCA with 2-5x leverage on selected positions. The explosive pillar of the Apice methodology.',
    unlockRequirements: ['3 months of consistent DCA', 'Minimum investment of $1,000', 'Leverage Safety course'],
    expectedReturn: '60-120%+ APY',
    risk: 'High',
    color: 'text-amber-400',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'yield-farming',
    name: 'Yield Farming',
    icon: '🌾',
    description: 'Generate passive yield in DeFi with your idle assets. Optimized staking, liquidity pools, and lending.',
    unlockRequirements: ['6 months of active investing', 'Diversified portfolio', 'Club Subscription'],
    expectedReturn: '10-30% APY',
    risk: 'Medium',
    color: 'text-green-400',
    gradient: 'from-green-500 to-emerald-500',
  },
];

// ============== DCA EDUCATION SLIDES ==============

export const dcaEducationSlides = [
  {
    id: 1,
    title: 'Why DCA is the #1 Strategy',
    icon: '📈',
    content: 'Dollar-Cost Averaging (DCA) is the safest and most proven strategy for investing in crypto. You invest a fixed amount every week, eliminating emotion and market timing.',
    stats: [
      { label: 'DCA Investors', value: '83%', detail: 'have positive returns in 3+ years' },
      { label: 'Timing Traders', value: '95%', detail: 'lose money in the long run' },
    ],
  },
  {
    id: 2,
    title: 'Last 10 Years of Crypto',
    icon: '🚀',
    content: 'Those who invested $25/week in Bitcoin over the last 10 years turned $13,000 into over $1,200,000. With smart diversification, results are even better.',
    stats: [
      { label: 'Bitcoin', value: '+1,000,000%', detail: 'since 2013' },
      { label: 'Ethereum', value: '+500,000%', detail: 'since 2015' },
    ],
  },
  {
    id: 3,
    title: 'Next 10 Years',
    icon: '🔮',
    content: 'Institutional adoption, ETFs, clear regulation, and RWA tokenization should multiply the market from $2T to $20T+. Starting now captures this growth.',
    stats: [
      { label: 'BTC Potential', value: '$500K-1M', detail: 'analyst projection by 2035' },
      { label: 'Total Market', value: '10x', detail: 'projected growth' },
    ],
  },
  {
    id: 4,
    title: 'The Apice Advantage',
    icon: '🧠',
    content: 'Our AI adjusts your strategy in real-time: when the market dips, it recommends buying more. In major crashes, it suggests using USDT reserves to amplify positions.',
    stats: [
      { label: 'Apice Strategy', value: '+35-60%', detail: 'avg annual return' },
      { label: 'Individual Investor', value: '+8-12%', detail: 'avg return without strategy' },
    ],
  },
];

// ============== ACTION PLAN STEPS ==============

export const actionPlanSteps = [
  { step: 1, title: 'Define your goal', description: 'Passive income, growth, or protection? Your goal guides the entire strategy.', icon: '🎯', status: 'profileSet' as const },
  { step: 2, title: 'Choose base strategy', description: 'Conservative (15%), Balanced (35%) or Aggressive (60%+). AI recommends based on your profile.', icon: '📋', status: 'strategySet' as const },
  { step: 3, title: 'Set up weekly DCA', description: 'Define how much to invest per week. Consistency > amount. Start with what you can.', icon: '💰', status: 'weeklySet' as const },
  { step: 4, title: 'Execute allocation', description: 'Distribute according to plan. AI shows exactly how much to invest in each crypto.', icon: '🚀', status: 'executed' as const },
  { step: 5, title: 'Review and optimize', description: 'Monthly, review proportions. AI suggests rebalancing when necessary.', icon: '🔄', status: 'optimized' as const },
];

// ============== AI MARKET INSIGHTS ==============

export const aiMarketRecommendations = {
  bullish: {
    sentiment: 'bullish',
    icon: '📈',
    title: 'Bull Market',
    message: 'The market is in an uptrend. Continue your normal DCA and maintain discipline. Do not increase investment due to FOMO.',
    actionLabel: 'Maintain DCA',
    color: 'text-green-400',
    bgColor: 'bg-green-500/5',
    borderColor: 'border-green-500/20',
  },
  neutral: {
    sentiment: 'neutral',
    icon: '➡️',
    title: 'Stable Market',
    message: 'Normal volatility. Ideal time for DCA. Your weekly investments are buying at fair prices.',
    actionLabel: 'Continue DCA',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/5',
    borderColor: 'border-blue-500/20',
  },
  dip: {
    sentiment: 'dip',
    icon: '📉',
    title: 'Buying Opportunity',
    message: 'Market down 15-30%. Consider increasing your DCA this week. Historically, buying the dip generates the highest returns.',
    actionLabel: 'Increase DCA',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/5',
    borderColor: 'border-amber-500/20',
  },
  crash: {
    sentiment: 'crash',
    icon: '🔥',
    title: 'Major Crash — Buy More!',
    message: 'Down 30%+. Now is the time to use your USDT reserves to buy aggressively. 90% of history\'s biggest returns came from crash buys.',
    actionLabel: 'Use USDT Reserves',
    color: 'text-red-400',
    bgColor: 'bg-red-500/5',
    borderColor: 'border-red-500/20',
  },
};
// ============== INVESTMENT TIERS ==============

export const getPersonalizedTiers = (capitalRange: string | null, investorType: string | null) => {
  const isConservative = investorType === 'Conservative Builder';
  const isGrowth = investorType === 'Growth Seeker';

  if (capitalRange === 'under-200') {
    return [
      { amount: 25, label: 'Starter', tag: 'Start small', description: 'Build the habit with minimal commitment', icon: '🌱', recommended: false },
      { amount: 50, label: 'Recommended', tag: 'Sweet spot', description: 'The ideal starting point for your profile', icon: '⭐', recommended: true },
      { amount: 100, label: 'Accelerated', tag: 'Fast track', description: 'Accelerate your early growth phase', icon: '🚀', recommended: false },
    ];
  }
  if (capitalRange === '200-1k') {
    return [
      { amount: 50, label: 'Starter', tag: 'Build habits', description: 'Consistent weekly contribution', icon: '🌱', recommended: false },
      { amount: 100, label: 'Recommended', tag: 'Optimal growth', description: isConservative ? 'Steady accumulation of proven assets' : 'Balanced growth for your goals', icon: '⭐', recommended: true },
      { amount: 250, label: 'Accelerated', tag: 'Power mode', description: 'Maximize your early portfolio growth', icon: '🚀', recommended: false },
    ];
  }
  if (capitalRange === '1k-5k') {
    return [
      { amount: 100, label: 'Steady', tag: 'Consistent', description: 'Disciplined weekly accumulation', icon: '🌱', recommended: false },
      { amount: 250, label: 'Recommended', tag: 'Optimal', description: isGrowth ? 'Aggressive growth aligned to your goals' : 'Sweet spot for your capital level', icon: '⭐', recommended: true },
      { amount: 500, label: 'Accelerated', tag: 'Fast track', description: 'Reach investment milestones faster', icon: '🚀', recommended: false },
    ];
  }
  // 5k-plus
  return [
    { amount: 250, label: 'Moderate', tag: 'Steady pace', description: 'Consistent high-value accumulation', icon: '🌱', recommended: false },
    { amount: 500, label: 'Recommended', tag: 'Optimal', description: 'Strategic allocation for serious investors', icon: '⭐', recommended: true },
    { amount: 1000, label: 'Maximum', tag: 'Full power', description: 'Maximum weekly allocation for rapid growth', icon: '🚀', recommended: false },
  ];
};
