// Complete sample data for the Apice MVP

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
    { period: '1 year', weeklyAmount: 25, totalInvested: 1300, currentValue: 1850, returnPercent: 42.3 },
    { period: '2 years', weeklyAmount: 25, totalInvested: 2600, currentValue: 4200, returnPercent: 61.5 },
    { period: '4 years', weeklyAmount: 25, totalInvested: 5200, currentValue: 12400, returnPercent: 138.5 },
  ],
  ETH: [
    { period: '1 year', weeklyAmount: 25, totalInvested: 1300, currentValue: 1680, returnPercent: 29.2 },
    { period: '2 years', weeklyAmount: 25, totalInvested: 2600, currentValue: 3900, returnPercent: 50.0 },
    { period: '4 years', weeklyAmount: 25, totalInvested: 5200, currentValue: 9800, returnPercent: 88.5 },
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
