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
  { author: 'Jack Bogle', quote: 'Time is your friend; impulse is your enemy.', role: 'Founder of Vanguard' },
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
  { id: 'consistency-king', name: 'Consistency King', description: '30 days with an active DCA plan', icon: '👑', requirement: 'Plan active for 30 days', category: 'consistency' },
  { id: 'diversifier', name: 'Diversifier', description: 'DCA into 3+ different assets', icon: '🎯', requirement: '3+ assets in DCA', category: 'diversification' },
  { id: 'long-game', name: 'Long Game', description: 'Created a 90+ day DCA plan', icon: '🏆', requirement: '90+ day plan', category: 'commitment' },
  { id: 'committed', name: 'Committed', description: 'Committed $1,000+ to DCA', icon: '💎', requirement: '$1,000+ committed', category: 'commitment' },
  { id: 'diamond-hands', name: 'Diamond Hands', description: 'Started an indefinite DCA plan', icon: '💪', requirement: 'DCA Forever mode', category: 'commitment' },
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
  { id: 'rec-cons-1', profileType: 'Conservative Builder', capitalRange: 'under-200', suggestedAmount: 10, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 60 }, { symbol: 'ETH', allocation: 40 }], rationale: 'Blue-chip stability focus with maximum capital preservation.', marketContext: 'Current market conditions favor disciplined accumulation.' },
  { id: 'rec-cons-2', profileType: 'Conservative Builder', capitalRange: '200-1k', suggestedAmount: 25, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 60 }, { symbol: 'ETH', allocation: 40 }], rationale: 'Steady accumulation of proven assets builds a solid foundation.', marketContext: 'Blue-chip dominance protects against volatility.' },
  { id: 'rec-cons-3', profileType: 'Conservative Builder', capitalRange: '1k-5k', suggestedAmount: 50, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 55 }, { symbol: 'ETH', allocation: 35 }, { symbol: 'USDT', allocation: 10 }], rationale: 'Keep stablecoin reserve for opportunistic buys.', marketContext: 'Dry powder strategy amplifies long-term returns.' },
  { id: 'rec-cons-4', profileType: 'Conservative Builder', capitalRange: '5k-plus', suggestedAmount: 100, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 50 }, { symbol: 'ETH', allocation: 35 }, { symbol: 'USDC', allocation: 15 }], rationale: 'Institutional-grade allocation with strategic reserves.', marketContext: 'Professional approach to systematic accumulation.' },
  // Balanced
  { id: 'rec-bal-1', profileType: 'Balanced Optimizer', capitalRange: 'under-200', suggestedAmount: 15, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 45 }, { symbol: 'ETH', allocation: 35 }, { symbol: 'SOL', allocation: 20 }], rationale: 'Core + growth allocation for optimized risk-return profile.', marketContext: 'Diversification across top assets reduces concentration risk.' },
  { id: 'rec-bal-2', profileType: 'Balanced Optimizer', capitalRange: '200-1k', suggestedAmount: 35, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 40 }, { symbol: 'ETH', allocation: 30 }, { symbol: 'SOL', allocation: 20 }, { symbol: 'USDT', allocation: 10 }], rationale: 'Balanced exposure with tactical stablecoin position.', marketContext: 'Multi-asset approach captures broader market growth.' },
  { id: 'rec-bal-3', profileType: 'Balanced Optimizer', capitalRange: '1k-5k', suggestedAmount: 75, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 35 }, { symbol: 'ETH', allocation: 30 }, { symbol: 'SOL', allocation: 20 }, { symbol: 'LINK', allocation: 15 }], rationale: 'Add DeFi exposure for yield potential.', marketContext: 'Infrastructure projects offer asymmetric upside.' },
  { id: 'rec-bal-4', profileType: 'Balanced Optimizer', capitalRange: '5k-plus', suggestedAmount: 150, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 35 }, { symbol: 'ETH', allocation: 25 }, { symbol: 'SOL', allocation: 20 }, { symbol: 'AVAX', allocation: 10 }, { symbol: 'USDC', allocation: 10 }], rationale: 'Diversified core with L1 basket and reserves.', marketContext: 'Broad exposure to capture ecosystem growth.' },
  // Growth
  { id: 'rec-gro-1', profileType: 'Growth Seeker', capitalRange: 'under-200', suggestedAmount: 20, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 35 }, { symbol: 'ETH', allocation: 30 }, { symbol: 'SOL', allocation: 35 }], rationale: 'Higher beta allocation for maximum growth potential.', marketContext: 'Early accumulation benefits from higher volatility exposure.' },
  { id: 'rec-gro-2', profileType: 'Growth Seeker', capitalRange: '200-1k', suggestedAmount: 50, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 30 }, { symbol: 'ETH', allocation: 25 }, { symbol: 'SOL', allocation: 25 }, { symbol: 'ARB', allocation: 20 }], rationale: 'L2 exposure adds growth potential with managed risk.', marketContext: 'Layer 2 adoption is accelerating.' },
  { id: 'rec-gro-3', profileType: 'Growth Seeker', capitalRange: '1k-5k', suggestedAmount: 100, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 25 }, { symbol: 'ETH', allocation: 25 }, { symbol: 'SOL', allocation: 20 }, { symbol: 'ARB', allocation: 15 }, { symbol: 'TIA', allocation: 15 }], rationale: 'Emerging asset allocation for asymmetric returns.', marketContext: 'Modular blockchain thesis gaining traction.' },
  { id: 'rec-gro-4', profileType: 'Growth Seeker', capitalRange: '5k-plus', suggestedAmount: 200, frequency: 'weekly', assets: [{ symbol: 'BTC', allocation: 25 }, { symbol: 'ETH', allocation: 20 }, { symbol: 'SOL', allocation: 20 }, { symbol: 'ARB', allocation: 15 }, { symbol: 'INJ', allocation: 10 }, { symbol: 'JUP', allocation: 10 }], rationale: 'Aggressive diversification across high-conviction positions.', marketContext: 'Multi-ecosystem approach maximizes opportunity capture.' },
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
  // Core Portfolios (Free) — All include mandatory War Chest (Capital de Guerra)
  {
    id: 'classic-core',
    name: 'Classic Core',
    type: 'core',
    risk: 'balanced',
    riskLabel: 'Medium Risk',
    allocations: [
      { asset: 'BTC', percentage: 38, color: 'hsl(33, 100%, 50%)' },
      { asset: 'ETH', percentage: 25, color: 'hsl(217, 100%, 60%)' },
      { asset: 'SOL', percentage: 15, color: 'hsl(280, 100%, 60%)' },
      { asset: 'USDT', percentage: 12, color: 'hsl(152, 70%, 50%)' },  // Capital de Guerra
      { asset: 'LINK', percentage: 10, color: 'hsl(230, 70%, 55%)' },
    ],
    description: 'The institutional standard. Solid BTC & ETH base with strategic War Chest.',
    whyItWorks: 'BTC and ETH as store of value; SOL and LINK for growth; USDT as War Chest — ammunition for market opportunities.',
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
      { asset: 'BTC', percentage: 45, color: 'hsl(33, 100%, 50%)' },
      { asset: 'ETH', percentage: 22, color: 'hsl(217, 100%, 60%)' },
      { asset: 'USDT', percentage: 18, color: 'hsl(152, 70%, 50%)' },  // Capital de Guerra
      { asset: 'SOL', percentage: 15, color: 'hsl(280, 100%, 60%)' },
    ],
    description: 'Maximum stability. Blue-chip focus with robust War Chest.',
    whyItWorks: 'Blue-chip dominance reduces volatility. 18% War Chest allows buying during aggressive dips when the market shows extreme fear.',
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
      { asset: 'ETH', percentage: 22, color: 'hsl(217, 100%, 60%)' },
      { asset: 'SOL', percentage: 20, color: 'hsl(280, 100%, 60%)' },
      { asset: 'USDT', percentage: 10, color: 'hsl(152, 70%, 50%)' },  // Capital de Guerra
      { asset: 'AVAX', percentage: 10, color: 'hsl(0, 100%, 60%)' },
      { asset: 'LINK', percentage: 8, color: 'hsl(230, 70%, 55%)' },
    ],
    description: 'Aggressive altcoin exposure with lean War Chest for opportunities.',
    whyItWorks: 'Solid BTC/ETH base with allocation in high-potential alts. 10% War Chest — automatically deployed during capitulations.',
    minCapital: '$500',
    isLocked: false,
  },
  // Optimized Portfolios (Pro) — Intelligence-enhanced with dynamic War Chest
  {
    id: 'momentum-optimized',
    name: 'Momentum Alpha',
    type: 'optimized',
    risk: 'growth',
    riskLabel: 'High Risk',
    allocations: [
      { asset: 'BTC', percentage: 25, color: 'hsl(33, 100%, 50%)' },
      { asset: 'ETH', percentage: 18, color: 'hsl(217, 100%, 60%)' },
      { asset: 'SOL', percentage: 18, color: 'hsl(280, 100%, 60%)' },
      { asset: 'AVAX', percentage: 12, color: 'hsl(0, 100%, 60%)' },
      { asset: 'USDT', percentage: 12, color: 'hsl(152, 70%, 50%)' },  // Capital de Guerra
      { asset: 'LINK', percentage: 8, color: 'hsl(230, 70%, 55%)' },
      { asset: 'DOT', percentage: 7, color: 'hsl(328, 100%, 54%)' },
    ],
    description: 'Captures market momentum with smart rebalancing and dynamic War Chest.',
    whyItWorks: 'Dynamic allocation based on relative strength indicators. War Chest adjusted by market regime.',
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
      { asset: 'ETH', percentage: 30, color: 'hsl(217, 100%, 60%)' },
      { asset: 'BTC', percentage: 25, color: 'hsl(33, 100%, 50%)' },
      { asset: 'SOL', percentage: 15, color: 'hsl(280, 100%, 60%)' },
      { asset: 'USDT', percentage: 15, color: 'hsl(152, 70%, 50%)' },  // Capital de Guerra
      { asset: 'LINK', percentage: 8, color: 'hsl(230, 70%, 55%)' },
      { asset: 'AVAX', percentage: 7, color: 'hsl(0, 100%, 60%)' },
    ],
    description: 'Optimized for yield with 15% War Chest for strategic opportunities.',
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
  return [
    {
      id: 'di-1',
      date: new Date().toISOString(),
      title: 'Bitcoin and digital gold',
      content: 'With only 21 million units that will ever exist, Bitcoin has programmed scarcity, something no government can change. While fiat currencies are printed without limit, BTC appreciates by design.',
      recommendedAction: 'Review your BTC allocation in portfolio',
      type: 'education',
    },
    {
      id: 'di-2',
      date: new Date(Date.now() - 86400000).toISOString(),
      title: 'DCA discipline beats timing',
      content: 'Studies show that 95% of traders who try to "call tops and bottoms" underperform a simple DCA strategy. Weekly consistency beats any attempt to predict the market.',
      recommendedAction: 'Check your next scheduled DCA',
      type: 'discipline',
    },
    {
      id: 'di-3',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      title: 'Market cycles: the wheel always turns',
      content: 'The crypto market follows 4-year cycles tied to the Bitcoin halving. Every bear market has been followed by an even greater bull run. Historical context is your greatest advantage as an investor.',
      recommendedAction: 'Study the market cycles module',
      type: 'market',
    },
    {
      id: 'di-4',
      date: new Date(Date.now() - 86400000 * 3).toISOString(),
      title: 'A diversified portfolio sleeps well',
      content: 'The golden rule: no asset should exceed 50% of your portfolio (except BTC for conservative profiles). Diversification is not cowardice, it is intelligence. Concentration risk is the enemy of long-term wealth.',
      recommendedAction: 'Review your portfolio distribution',
      type: 'portfolio',
    },
    {
      id: 'di-5',
      date: new Date(Date.now() - 86400000 * 4).toISOString(),
      title: 'FOMO is the investor\'s worst enemy',
      content: 'The fear of missing out makes you buy at the tops and sell at the bottoms. When everyone is euphoric, caution is mandatory. When everyone is afraid, accumulate. Wealth is born from being contrarian to the herd.',
      recommendedAction: 'Complete the investor psychology lesson',
      type: 'discipline',
    },
    {
      id: 'di-6',
      date: new Date(Date.now() - 86400000 * 5).toISOString(),
      title: 'Ethereum: the world computer',
      content: 'ETH is the foundation of DeFi, NFTs, and Web3 apps. The transition to Proof of Stake made the asset deflationary during high demand periods. ETH is the second pillar of any serious crypto portfolio.',
      recommendedAction: 'Add ETH to your DCA plan if you haven\'t already',
      type: 'education',
    },
    {
      id: 'di-7',
      date: new Date(Date.now() - 86400000 * 6).toISOString(),
      title: 'Stablecoins: your strategic reserve',
      content: 'Keeping 10-20% in USDT or USDC is not weakness, it is strategy. When the market drops 40%, you have ammunition to buy quality assets at a discount. Cash creates opportunity.',
      recommendedAction: 'Check if your stablecoin reserve is adequate',
      type: 'portfolio',
    },
    {
      id: 'di-8',
      date: new Date(Date.now() - 86400000 * 7).toISOString(),
      title: 'The power of compound interest in crypto',
      content: '$100 per week for 4 years at 35% annually results in over $65,000. Time in the market is stronger than any timing. Every week of delay is money that stops compounding. The sooner you start, the stronger the curve.',
      recommendedAction: 'Use the DCA calculator to simulate your growth',
      type: 'education',
    },
    {
      id: 'di-9',
      date: new Date(Date.now() - 86400000 * 8).toISOString(),
      title: 'Solana: speed and scalability',
      content: 'SOL processes 65,000 transactions per second vs 15 for Ethereum. With penny-level fees, it is the ideal blockchain for high-frequency DeFi. SOL represents the growth engine in the Apice allocation.',
      recommendedAction: 'Check your SOL allocation in the portfolio',
      type: 'market',
    },
    {
      id: 'di-10',
      date: new Date(Date.now() - 86400000 * 9).toISOString(),
      title: 'Never invest more than you can lose',
      content: 'Core rule: only invest in crypto what you can see drop 80% without panic selling. If that number scares you, reduce the position. A safe long-term strategy always beats short bets with excessive risk.',
      recommendedAction: null,
      type: 'discipline',
    },
    {
      id: 'di-11',
      date: new Date(Date.now() - 86400000 * 10).toISOString(),
      title: 'Bitcoin halving: the 4-year event',
      content: 'Every 4 years, the reward for Bitcoin miners is cut in half. Historically, each halving has been followed by a strong rally in the following 12-18 months. It is the most predictable supply shock in financial history.',
      recommendedAction: 'Study the market cycles lesson',
      type: 'education',
    },
    {
      id: 'di-12',
      date: new Date(Date.now() - 86400000 * 11).toISOString(),
      title: 'DCA during dips: where wealth is created',
      content: 'Investors who maintained DCA during the 2022 bear market (BTC from $68k to $15k) accumulated Bitcoin at an average price of ~$25,000 and saw their portfolio multiply in 2023-2024. The dip is the discount.',
      recommendedAction: 'Keep DCA active regardless of price',
      type: 'discipline',
    },
    {
      id: 'di-13',
      date: new Date(Date.now() - 86400000 * 12).toISOString(),
      title: 'Layer 2: the future of scalability',
      content: 'Arbitrum and Optimism process Ethereum transactions for a fraction of the cost. As Ethereum adoption grows, L2s benefit directly. They are the sweet spot between security and low fees.',
      recommendedAction: 'Explore the advanced strategies section',
      type: 'market',
    },
    {
      id: 'di-14',
      date: new Date(Date.now() - 86400000 * 13).toISOString(),
      title: 'Rebalancing: sell high, buy low automatically',
      content: 'When BTC rises 50% and represents 60% of your portfolio, rebalancing means selling BTC high and buying cheaper ETH/SOL. It is the automated discipline of buying low and selling high, without timing.',
      recommendedAction: 'Check if your portfolio needs rebalancing',
      type: 'portfolio',
    },
    {
      id: 'di-15',
      date: new Date(Date.now() - 86400000 * 14).toISOString(),
      title: 'Security: your funds stay on the exchange',
      content: 'With Apice, you never transfer funds to third parties. Your keys stay on your exchange (Bybit). Never trust platforms that ask for custody of your assets. The gold standard is non-custodial.',
      recommendedAction: null,
      type: 'education',
    },
    {
      id: 'di-16',
      date: new Date(Date.now() - 86400000 * 15).toISOString(),
      title: 'The mistake of checking prices every day',
      content: 'Behavioral research shows that investors who check prices daily make 3x more harmful emotional decisions. Weekly reviews are enough. Pick a fixed day and stick to it.',
      recommendedAction: 'Set a weekly review reminder',
      type: 'discipline',
    },
    {
      id: 'di-17',
      date: new Date(Date.now() - 86400000 * 16).toISOString(),
      title: 'DeFi: generate yield with your crypto',
      content: 'DeFi protocols like Aave let you lend your assets and earn interest. With well-managed risk, you can generate an extra 3-8% per year on your stablecoin allocation beyond the main strategy.',
      recommendedAction: 'Study the automation and AI track',
      type: 'education',
    },
    {
      id: 'di-18',
      date: new Date(Date.now() - 86400000 * 17).toISOString(),
      title: 'Position sizing: the art of protection',
      content: 'Apice rule: high-risk altcoins should never exceed 5-15% of total portfolio. If an asset goes to zero, you lose 5-15%, not 50-80%. Surviving an entire cycle requires correct sizing from the start.',
      recommendedAction: 'Review each position size in your portfolio',
      type: 'portfolio',
    },
    {
      id: 'di-19',
      date: new Date(Date.now() - 86400000 * 18).toISOString(),
      title: 'Crypto correlation: the diversification illusion',
      content: 'During crashes, 90% of altcoins fall along with BTC. Real protection comes from stablecoins (zero correlation), not from diversifying within crypto itself. That is why Apice always includes a USDT reserve.',
      recommendedAction: 'Check your stablecoin allocation',
      type: 'education',
    },
    {
      id: 'di-20',
      date: new Date(Date.now() - 86400000 * 19).toISOString(),
      title: 'Consistency above perfection',
      content: 'There is no perfect time to invest. The best time to start your DCA was yesterday. The second best is today. $50 per week consistently beats $500 sporadically over any horizon above 3 years.',
      recommendedAction: 'Keep your DCA active even during tough weeks',
      type: 'discipline',
    },
    {
      id: 'di-21',
      date: new Date(Date.now() - 86400000 * 20).toISOString(),
      title: 'Chainlink: the bridge to the real world',
      content: 'LINK connects smart contracts with real-world data (prices, weather, sports events). It is critical DeFi infrastructure. Without oracles, smart contracts cannot interact with anything outside the blockchain.',
      recommendedAction: null,
      type: 'market',
    },
    {
      id: 'di-22',
      date: new Date(Date.now() - 86400000 * 21).toISOString(),
      title: 'The classic Apice portfolio',
      content: 'BTC 40% + ETH 30% + SOL 20% + USDT 10%: this allocation balances growth, security, and liquidity. Simple, efficient, and tested across multiple market cycles. It is the base for a reason.',
      recommendedAction: 'Compare your current portfolio with the Classic',
      type: 'portfolio',
    },
    {
      id: 'di-23',
      date: new Date(Date.now() - 86400000 * 22).toISOString(),
      title: 'Altcoins: high risk, high potential',
      content: 'Emerging assets like TIA, INJ, and JUP can multiply 5x-20x in bull markets, but also fall 90%+ in bears. Keep a maximum of 15-20% of your portfolio in this category. The upside is real; so is the downside.',
      recommendedAction: 'Evaluate your exposure to high-risk altcoins',
      type: 'education',
    },
    {
      id: 'di-24',
      date: new Date(Date.now() - 86400000 * 23).toISOString(),
      title: 'Bull week: stay calm',
      content: 'When the market surges, the temptation is to invest more out of FOMO. But that is exactly when risk is highest. Follow the plan. Do not add positions outside the strategy when euphoria hits.',
      recommendedAction: null,
      type: 'discipline',
    },
    {
      id: 'di-25',
      date: new Date(Date.now() - 86400000 * 24).toISOString(),
      title: 'API keys: security is non-negotiable',
      content: 'If you use bots or automations, NEVER enable withdrawal permission on API keys. With trade-only permission, even in case of a leak, no funds leave the account. A simple rule that protects everything.',
      recommendedAction: 'Check your API key permissions',
      type: 'education',
    },
    {
      id: 'di-26',
      date: new Date(Date.now() - 86400000 * 25).toISOString(),
      title: 'Time is your greatest asset',
      content: 'An investor who starts at 25 with $100/week tends to have much more than one who starts at 35 with $200/week, even investing double. Time to compound is irreplaceable. Start early and maintain consistency.',
      recommendedAction: 'Calculate your long-term projection in the DCA Planner',
      type: 'education',
    },
    {
      id: 'di-27',
      date: new Date(Date.now() - 86400000 * 26).toISOString(),
      title: 'Copy trading: learn from the best',
      content: 'Copying traders with 12+ months of consistency allows you to learn their strategies while generating returns. At Apice, you always control how much to allocate and can stop at any time.',
      recommendedAction: 'Explore the Copy Trading section',
      type: 'market',
    },
    {
      id: 'di-28',
      date: new Date(Date.now() - 86400000 * 27).toISOString(),
      title: 'Volatile week: time to accumulate',
      content: 'Volatility is not the enemy of DCA, it is an ally. When the market swings 10-15% in a week, your fixed amount buys more when the price drops. Dollar-cost averaging works in your favor automatically.',
      recommendedAction: 'Keep your DCA active during volatility',
      type: 'discipline',
    },
    {
      id: 'di-29',
      date: new Date(Date.now() - 86400000 * 28).toISOString(),
      title: 'Avalanche: speed with security',
      content: 'AVAX combines Solana\'s speed with Ethereum compatibility. Its subnet architecture allows building custom blockchains on top. It is one of the most solid Layer 1 projects outside the top 3.',
      recommendedAction: null,
      type: 'market',
    },
    {
      id: 'di-30',
      date: new Date(Date.now() - 86400000 * 29).toISOString(),
      title: 'Your mission this week',
      content: 'Review your portfolio, confirm your weekly DCA, and complete at least one lesson in the Learn section. These three simple habits, repeated for 52 weeks, build real wealth in crypto. That is the Apice methodology.',
      recommendedAction: 'Complete all 3 actions this week',
      type: 'discipline',
    },
  ];
};

export const dailyInsights = generateDailyInsights();

// ============== LEARNING TRACKS ==============

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonChallenge {
  title: string;
  description: string;
  steps: string[];
  reward: string;
}

export interface ContentBlock {
  type: 'paragraph' | 'highlight' | 'stat' | 'quote';
  content: string;
  label?: string;
  value?: string;
  author?: string;
  role?: string;
}

export interface Lesson {
  id: string;
  title: string;
  summary: string[];
  content: string;
  contentBlocks?: ContentBlock[];
  doThisNow: string;
  readingTime: number;
  isLocked: boolean;
  quiz?: QuizQuestion[];
  challenge?: LessonChallenge;
}

export interface Track {
  id: string;
  name: string;
  description: string;
  icon?: string;
  lessons: Lesson[];
  isLocked: boolean;
  requiredTier: 'free' | 'pro' | 'club';
}

export const learningTracks: Track[] = [
  {
    id: 'foundations',
    name: 'Foundations',
    icon: '🏛️',
    description: 'Essential concepts every crypto investor needs to master.',
    isLocked: false,
    requiredTier: 'free',
    lessons: [
      {
        id: 'intro-portfolio',
        title: 'What is a Crypto Portfolio?',
        summary: ['Collection of crypto assets', 'Diversification reduces risk', 'Balance between growth and stability'],
        content: 'A crypto portfolio is your collection of cryptocurrency holdings, strategically allocated to balance risk and return.',
        contentBlocks: [
          { type: 'paragraph', content: 'A crypto portfolio is your collection of cryptocurrency holdings, strategically allocated to balance risk and return. Unlike picking a single asset, a portfolio approach spreads risk across multiple positions, protecting you when any single asset drops.' },
          { type: 'highlight', content: 'The Apice framework divides portfolios into three tiers: Blue Chips (BTC/ETH) for stability, Layer-1s for growth, and Stablecoins for dry powder to buy dips.' },
          { type: 'stat', label: 'Blue Chip allocation', value: '50-70%', content: 'of most safe portfolios should be BTC + ETH' },
          { type: 'quote', content: 'Diversification is the only free lunch in investing.', author: 'Harry Markowitz', role: 'Nobel Prize in Economics' },
          { type: 'paragraph', content: 'The key insight: you don\'t need to pick the winner. By holding a basket of high-quality assets, you capture the upside of the entire market cycle without betting everything on one coin.' },
        ],
        doThisNow: 'Go to Portfolio and review the Classic Core allocation — notice how it distributes across asset classes.',
        readingTime: 4,
        isLocked: false,
        quiz: [
          { id: 'q1', question: 'What is the main advantage of a crypto portfolio vs. holding a single asset?', options: ['Higher returns guaranteed', 'Risk is spread across multiple assets', 'You pay lower fees', 'The market moves faster'], correctIndex: 1, explanation: 'Diversification spreads risk so that a crash in one asset doesn\'t wipe you out.' },
          { id: 'q2', question: 'In the Apice framework, what role do stablecoins (USDT/USDC) play?', options: ['Maximum growth potential', 'Dry powder to buy market dips', 'The riskiest bet', 'Replace Bitcoin'], correctIndex: 1, explanation: 'Stablecoins act as reserves so you can buy aggressively during market crashes.' },
          { id: 'q3', question: 'Which allocation is typically considered the "foundation" of a safe crypto portfolio?', options: ['Memecoins 80%', 'BTC + ETH 50-70%', 'Only stablecoins', 'Equal split of 100 coins'], correctIndex: 1, explanation: 'BTC and ETH have the longest track record, deepest liquidity, and are the base of most institutional portfolios.' },
        ],
        challenge: { title: 'Portfolio Analysis Challenge', description: 'Look at your current or desired crypto holdings and classify each asset.', steps: ['List every asset you hold or want to hold', 'Categorize each: Blue Chip / Layer-1 / DeFi / Stablecoin', 'Calculate what % each category represents', 'Compare to the Classic Core (40% BTC, 30% ETH, 20% SOL, 10% USDT)'], reward: '+25 Bonus XP if shared in community' },
      },
      {
        id: 'why-dca',
        title: 'Why DCA Works',
        summary: ['Removes emotional timing', 'Averages your entry price', 'Proven institutional strategy'],
        content: 'Dollar-Cost Averaging (DCA) means investing fixed amounts at regular intervals regardless of price.',
        contentBlocks: [
          { type: 'paragraph', content: 'Dollar-Cost Averaging (DCA) means investing a fixed amount at regular intervals, regardless of market price. This eliminates the near-impossible task of "timing the market" — a game that even professional traders lose 95% of the time.' },
          { type: 'stat', label: 'DCA investors in profit', value: '83%', content: 'after 3+ years, regardless of entry point' },
          { type: 'highlight', content: 'When price drops, your fixed $100 buys MORE coins. When price rises, it buys fewer. Over time, this averages out to a cost lower than the average price — the mathematical edge of DCA.' },
          { type: 'paragraph', content: 'Consider this: an investor who put $100/week into Bitcoin from 2019 to 2024, through crashes and recoveries, accumulated over 3x their total investment. They did this without stress, without charts, without fear.' },
          { type: 'quote', content: 'Time in the market beats timing the market.', author: 'Ken Fisher', role: 'Forbes Columnist & Fund Manager' },
        ],
        doThisNow: 'Set up your first DCA plan in the Automations tab. Even $25/week changes everything over 4 years.',
        readingTime: 4,
        isLocked: false,
        quiz: [
          { id: 'q1', question: 'What happens when the price drops during a DCA plan?', options: ['You should pause your plan', 'Your fixed amount buys more coins', 'You lose more money', 'Nothing changes'], correctIndex: 1, explanation: 'Lower prices mean your fixed investment buys more units — this is the power of cost averaging.' },
          { id: 'q2', question: 'What percentage of market timers lose money long-term?', options: ['20%', '50%', '75%', '95%'], correctIndex: 3, explanation: 'Studies consistently show 95%+ of traders who try to time markets underperform a simple DCA strategy.' },
          { id: 'q3', question: 'What is the main psychological benefit of DCA?', options: ['You make more trades', 'Eliminates emotional decision-making', 'You always buy at the bottom', 'Guarantees profit'], correctIndex: 1, explanation: 'With DCA you invest on a schedule, removing fear and greed from the equation.' },
          { id: 'q4', question: 'The Apice recommended DCA frequency is:', options: ['Daily', 'Weekly', 'Monthly', 'Annually'], correctIndex: 1, explanation: 'Weekly DCA provides the optimal balance of averaging frequency and practical execution.' },
        ],
        challenge: { title: 'DCA Simulator Challenge', description: 'Calculate what weekly DCA into BTC would have returned over different periods.', steps: ['Pick a weekly amount: $25, $50, or $100', 'Assume you started 2 years ago (Jan 2023)', 'Estimate total invested (weekly × 104 weeks)', 'Compare to today\'s approximate BTC price vs 2023 price'], reward: 'Unlock the DCA Historical Data section' },
      },
      {
        id: 'risk-tolerance',
        title: 'Understanding Your Risk Tolerance',
        summary: ['Know your comfort zone', 'Match strategy to psychology', 'Avoid panic selling'],
        content: 'Risk tolerance is how much volatility you can handle without making emotional decisions.',
        contentBlocks: [
          { type: 'paragraph', content: 'Risk tolerance is not just about returns — it\'s about sleep. The most profitable strategy is the one you can stick to. A 60% annual return means nothing if you panic-sell during a 40% drawdown.' },
          { type: 'highlight', content: 'The Apice 3 Profiles: Conservative Builder (15% target, focus on BTC/ETH) · Balanced Optimizer (35% target, BTC/ETH + L1s) · Growth Seeker (60%+ target, adds high-beta altcoins)' },
          { type: 'stat', label: 'Biggest investor mistake', value: '72%', content: 'of retail investors sell at the worst possible time due to panic' },
          { type: 'paragraph', content: 'Key principle: Never invest more than you can psychologically afford to see drop 50% without panicking. Crypto regularly experiences 30-80% drawdowns — even Bitcoin has dropped 80% from all-time highs multiple times before recovering to new highs.' },
          { type: 'quote', content: 'The investor\'s chief problem — and even his worst enemy — is likely to be himself.', author: 'Benjamin Graham', role: 'Father of Value Investing' },
        ],
        doThisNow: 'Confirm your investor profile in Settings. Does your wallet size match your risk selection?',
        readingTime: 3,
        isLocked: false,
        quiz: [
          { id: 'q1', question: 'Bitcoin has historically experienced maximum drawdowns of up to:', options: ['20%', '40%', '80%', '100%'], correctIndex: 2, explanation: 'BTC has dropped ~80-85% from highs multiple times (2018, 2022) before recovering to new all-time highs.' },
          { id: 'q2', question: 'What is the most profitable strategy according to Apice?', options: ['The one with highest returns', 'The riskiest', 'The one you can stick to during volatility', 'Daily trading'], correctIndex: 2, explanation: 'Consistency and execution matter more than theoretical returns. The strategy you abandon during a crash is useless.' },
          { id: 'q3', question: 'A "Conservative Builder" profile targets approximately:', options: ['5% annual', '15% annual', '60%+ annual', '100% annual'], correctIndex: 1, explanation: 'Conservative builders focus on BTC/ETH DCA targeting ~15% annual returns with lower volatility.' },
        ],
        challenge: { title: 'Stress Test Challenge', description: 'Test your true risk tolerance before the market does.', steps: ['Imagine your portfolio drops 40% tomorrow', 'Would you: panic-sell / hold / buy more?', 'Pick your answer honestly', 'Check if your current investor profile matches your answer'], reward: 'Personalized profile confirmation badge' },
      },
      {
        id: 'position-sizing',
        title: 'Position Sizing Fundamentals',
        summary: ['Never bet too big on one asset', 'Protect your capital first', 'Small positions = big protection'],
        content: 'Position sizing determines how much of your portfolio goes into each asset.',
        contentBlocks: [
          { type: 'paragraph', content: 'Position sizing is the discipline of deciding HOW MUCH of your portfolio to allocate to each asset. The core rule: the higher the risk, the smaller the position. This one principle can be the difference between surviving a crash and losing everything.' },
          { type: 'highlight', content: 'Apice Rule: If an asset can go to zero (high-risk), it should represent no more than 5-15% of your portfolio. Blue chips (BTC/ETH) can represent 40-70%. Stablecoins 10-20%.' },
          { type: 'stat', label: 'Portfolio protection', value: '5%', content: 'max allocation to any single high-risk altcoin' },
          { type: 'paragraph', content: 'Example: Imagine your portfolio is $1,000. You put $900 in a memecoin that goes to zero — you lose $900. But if you used proper sizing ($50 max), you lose only $50 while your BTC/ETH positions might have gained during the same period.' },
          { type: 'quote', content: 'Risk comes from not knowing what you\'re doing.', author: 'Warren Buffett', role: 'CEO, Berkshire Hathaway' },
        ],
        doThisNow: 'Review your current or planned allocations. Is any single asset over 25%? If it\'s a high-risk altcoin, consider reducing.',
        readingTime: 4,
        isLocked: false,
        quiz: [
          { id: 'q1', question: 'According to Apice, what is the max recommended allocation for a single high-risk altcoin?', options: ['50%', '30%', '5-15%', 'No limit'], correctIndex: 2, explanation: 'High-risk assets can go to zero. Keeping them at 5-15% means a total loss barely affects your overall portfolio.' },
          { id: 'q2', question: 'What is the primary goal of position sizing?', options: ['Maximize profits', 'Protect capital from catastrophic loss', 'Buy more coins', 'Impress other investors'], correctIndex: 1, explanation: 'Position sizing is defensive — it ensures no single bad bet can destroy your portfolio.' },
          { id: 'q3', question: 'In a $500 portfolio, following Apice rules, the maximum you should put in a speculative new L1 is:', options: ['$250', '$500 — go all in', '$75 (15%)', '$5'], correctIndex: 2, explanation: '15% of $500 = $75. This protects your core portfolio if the speculative bet fails.' },
        ],
        challenge: { title: 'Portfolio Sizing Exercise', description: 'Apply position sizing rules to a hypothetical $1,000 portfolio.', steps: ['Allocate 50% to BTC + ETH (blue chips)', 'Allocate 20% to 1-2 L1s like SOL or AVAX', 'Allocate 15% to 1 DeFi project', 'Allocate 10% to USDT/USDC reserves', 'Leave max 5% for a speculative play'], reward: '50 XP + Position Sizing badge' },
      },
    ],
  },
  {
    id: 'dca-mastery',
    name: 'DCA Mastery',
    icon: '📈',
    description: 'Complete guide to the Dollar-Cost Averaging strategy.',
    isLocked: false,
    requiredTier: 'free',
    lessons: [
      {
        id: 'dca-intro',
        title: 'Introduction to DCA',
        summary: ['What is Dollar-Cost Averaging', 'How it reduces risk', 'Perfect for beginners'],
        content: 'Dollar-Cost Averaging (DCA) is an investment strategy where you invest a fixed amount of money at regular intervals, regardless of the asset price.',
        contentBlocks: [
          { type: 'paragraph', content: 'Dollar-Cost Averaging (DCA) is an investment strategy where you invest a fixed amount of money at regular intervals, regardless of the asset price. This removes the psychological burden of market timing and ensures you accumulate assets consistently.' },
          { type: 'stat', label: 'DCA vs Lump Sum', value: '78%', content: 'of the time DCA beats lump-sum for retail investors in volatile markets' },
          { type: 'highlight', content: 'Core Apice principle: Start small, stay consistent. $25/week for 4 years compounding at 35% annually = $15,000+. The math rewards discipline, not size.' },
          { type: 'paragraph', content: 'DCA works in all market conditions. In bull markets, you accumulate more assets from early cheaper prices. In bear markets, every week is a discounted buying opportunity. Across full market cycles, the average entry price almost always beats discretionary timing.' },
        ],
        doThisNow: 'Create your first DCA plan in the Automations tab.',
        readingTime: 3,
        isLocked: false,
        quiz: [
          { id: 'q1', question: 'DCA stands for:', options: ['Digital Currency Allocation', 'Dollar-Cost Averaging', 'Decentralized Capital Asset', 'Dynamic Compound Averaging'], correctIndex: 1, explanation: 'Dollar-Cost Averaging — investing a fixed dollar amount at regular intervals.' },
          { id: 'q2', question: 'The main goal of DCA is to eliminate:', options: ['All investment risk', 'The need to time the market', 'Transaction fees', 'Crypto volatility'], correctIndex: 1, explanation: 'DCA doesn\'t eliminate risk but removes the pressure and danger of trying to predict market timing.' },
          { id: 'q3', question: '$50/week for 2 years = total invested of:', options: ['$1,200', '$2,400', '$5,200', '$10,400'], correctIndex: 2, explanation: '$50 × 52 weeks × 2 years = $5,200 total invested.' },
        ],
        challenge: { title: 'Your First DCA Plan', description: 'Design your ideal DCA plan using the Apice framework.', steps: ['Choose your weekly amount ($25-$500)', 'Choose 2-4 assets maximum', 'Set a frequency: weekly (recommended)', 'Commit to at least 6 months without stopping'], reward: '🏆 DCA Starter badge + 50 XP' },
      },
      {
        id: 'dca-psychology',
        title: 'The Psychology of DCA',
        summary: ['Removing emotional decisions', 'Discipline over timing', 'Sleep well at night'],
        content: 'The biggest enemy of investment returns is emotional decision-making. DCA removes this by automating your investment schedule.',
        contentBlocks: [
          { type: 'paragraph', content: 'The biggest enemy of your investment returns is not the market — it\'s you. Studies show that emotional decision-making costs the average investor 1.5-3% per year in missed returns. Fear makes you sell at bottoms. Greed makes you buy at tops. DCA neutralizes both.' },
          { type: 'quote', content: 'The stock market is a device for transferring money from the impatient to the patient.', author: 'Warren Buffett', role: 'CEO, Berkshire Hathaway' },
          { type: 'highlight', content: 'The Apice mindset: your weekly DCA is not a trade, it\'s a recurring bill — like rent or Netflix. Non-negotiable, automatic, emotionless.' },
          { type: 'stat', label: 'Emotional investors', value: '1.5-3%', content: 'less annual returns due to behavioral mistakes' },
          { type: 'paragraph', content: 'Crypto crashes feel catastrophic. The 2022 bear market saw BTC drop 77%. But DCA investors who kept buying through the crash accumulated BTC at $16,000-$25,000 — assets now worth multiples more. The ones who sold never bought back.' },
        ],
        doThisNow: 'Reflect on your last emotional financial decision. What would have happened if you had followed a DCA plan instead?',
        readingTime: 4,
        isLocked: false,
        quiz: [
          { id: 'q1', question: 'Emotional decision-making costs the average investor how much per year?', options: ['0-0.1%', '0.5%', '1.5-3%', '10%+'], correctIndex: 2, explanation: 'Behavioral finance studies consistently show 1.5-3% annual performance drag from emotional decisions.' },
          { id: 'q2', question: 'How should you think about your weekly DCA according to Apice?', options: ['As an optional bonus investment', 'Like a recurring bill — automatic and non-negotiable', 'As a fun gambling game', 'Based on how the market is doing'], correctIndex: 1, explanation: 'Treating DCA as a fixed expense removes choice and emotion from the equation.' },
          { id: 'q3', question: 'During BTC\'s 2022 crash (down 77%), what happened to disciplined DCA investors?', options: ['They lost everything', 'They accumulated cheap BTC that recovered', 'Nothing — DCA doesn\'t work in bear markets', 'They switched to stocks'], correctIndex: 1, explanation: 'DCA investors accumulated BTC at major discounts during the crash, capturing huge gains in the subsequent recovery.' },
        ],
        challenge: { title: 'Emotional Audit Challenge', description: 'Identify and neutralize your emotional investing triggers.', steps: ['Write down 3 market events that made you want to sell in fear', 'Write down 3 moments you wanted to buy in FOMO', 'For each: what would DCA discipline have done?', 'Create a personal rule: "I will not deviate from my DCA unless..."'], reward: 'Psychology Master badge + 75 XP' },
      },
      {
        id: 'dca-vs-lumpsum',
        title: 'DCA vs Lump Sum: The Data',
        summary: ['Historical comparisons', 'When each works best', 'Risk-adjusted returns'],
        content: 'While lump-sum investing has higher expected returns in trending markets, DCA provides superior risk-adjusted returns for most investors.',
        contentBlocks: [
          { type: 'paragraph', content: 'The academic debate: lump-sum investing (investing all at once) produces higher raw returns ~66% of the time in traditional markets. BUT — crypto is not traditional markets. In a market with 30-80% regular drawdowns, your entry point matters enormously.' },
          { type: 'stat', label: 'DCA into BTC (4-year windows)', value: '94%', content: 'of all 4-year DCA periods ended in profit, regardless of starting price' },
          { type: 'highlight', content: 'The Apice position: DCA wins on risk-adjusted returns for retail crypto investors. The risk of catastrophic timing in crypto (e.g., buying at November 2021 peak) is too high. DCA smooths this completely.' },
          { type: 'paragraph', content: 'Real example: Investor A puts $10,000 in BTC at the November 2021 peak ($67k). Portfolio drops 77% to $2,300. Investor B DCA\'d $200/week from 2021-2023. Average buy price: ~$28,000. Portfolio in much better shape entering 2024.' },
        ],
        doThisNow: 'Check the Historical Proof section for real data and compare DCA vs lump-sum scenarios.',
        readingTime: 5,
        isLocked: false,
        quiz: [
          { id: 'q1', question: 'In traditional stock markets, lump-sum outperforms DCA:', options: ['Always', 'Never', '~66% of the time', '~10% of the time'], correctIndex: 2, explanation: 'In trending markets, being fully invested sooner wins. But crypto\'s extreme volatility changes this calculation.' },
          { id: 'q2', question: 'What percentage of 4-year DCA periods into BTC ended in profit?', options: ['50%', '70%', '85%', '94%'], correctIndex: 3, explanation: 'Historical analysis shows 94%+ of all 4-year DCA windows ended positive regardless of start date.' },
          { id: 'q3', question: 'Why does DCA win in crypto specifically vs. traditional markets?', options: ['Crypto has lower fees', 'Crypto\'s extreme volatility makes entry point much more important', 'DCA is only for crypto', 'Crypto always goes up'], correctIndex: 1, explanation: 'Crypto\'s 30-80% regular drawdowns mean bad timing can devastate lump-sum investors in ways DCA avoids.' },
        ],
        challenge: { title: 'Backtest Your Strategy', description: 'Run a mental backtest comparing DCA vs lump-sum.', steps: ['Pick an asset: BTC or ETH', 'Pick a start date when price was high (e.g., November 2021)', 'Calculate: $5,000 lump sum vs $100/week DCA', 'Estimate current value of each approach using current prices'], reward: 'Data-Driven Investor badge + 100 XP' },
      },
      {
        id: 'dca-building-plan',
        title: 'Building Your DCA Plan',
        summary: ['Choosing the right amount', 'Selecting assets', 'Setting frequency'],
        content: 'A good DCA plan starts with an amount you can commit to consistently.',
        contentBlocks: [
          { type: 'paragraph', content: 'The perfect DCA plan has three qualities: (1) An amount you can genuinely afford every week without stress, (2) A focused asset selection (2-5 maximum), (3) A timeline commitment of at least 12 months.' },
          { type: 'highlight', content: 'Apice Golden Rule: The amount matters less than the consistency. $25/week every week for 4 years beats $500/month for 2 months every time. Build the habit first. Increase the amount later.' },
          { type: 'stat', label: 'Optimal DCA assets', value: '2-5', content: 'maximum coins for a focused, manageable DCA plan' },
          { type: 'paragraph', content: 'Asset selection framework: Start with BTC (40-50% of DCA). Add ETH (25-35%). Optional: Add 1 high-conviction L1 like SOL (15-25%). Only if you have $200+/week: Consider adding 1 DeFi or L2 position.' },
        ],
        doThisNow: 'Use the AI Recommendation feature to get a personalized DCA plan based on your profile.',
        readingTime: 4,
        isLocked: false,
        quiz: [
          { id: 'q1', question: 'How many assets maximum does Apice recommend for a focused DCA plan?', options: ['1', '2-5', '10', '20+'], correctIndex: 1, explanation: 'More assets creates confusion and complexity. 2-5 quality assets is the effective range.' },
          { id: 'q2', question: 'What is the minimum recommended DCA commitment period?', options: ['1 month', '3 months', '12 months', '5 years'], correctIndex: 2, explanation: '12 months is the minimum to begin seeing the statistical advantages of DCA averaging.' },
          { id: 'q3', question: 'According to Apice, what matters MORE than the weekly DCA amount?', options: ['Picking the right coins', 'Consistency over time', 'Maximum leverage', 'Trading actively'], correctIndex: 1, explanation: 'Habit and consistency mathematically beat larger but inconsistent investments.' },
        ],
        challenge: { title: 'Design Your 12-Month DCA Plan', description: 'Create your complete personalized DCA blueprint.', steps: ['Set your weekly investment amount', 'Choose 2-4 assets and their % split', 'Calculate your 12-month total investment', 'Project a 35% annual return scenario', 'Commit to it by saving it in the app'], reward: 'Master Planner badge + 150 XP' },
      },
      {
        id: 'dca-advanced',
        title: 'Advanced DCA Strategies',
        summary: ['Value averaging', 'Dynamic DCA', 'Rebalancing with DCA'],
        content: 'Advanced DCA techniques enhance returns while maintaining the core discipline framework.',
        contentBlocks: [
          { type: 'paragraph', content: 'Once you\'ve mastered base DCA, advanced techniques can amplify returns without abandoning discipline. Value Averaging adjusts your contribution based on portfolio performance. Dynamic DCA increases buys during crashes. Rebalancing DCA uses contributions strategically to maintain allocations.' },
          { type: 'highlight', content: 'Apice Elite Strategy: During crashes of 20%+, double your weekly DCA. During 40%+ crashes, triple it if possible. Use your stablecoin reserves. This is where the biggest returns are generated.' },
          { type: 'stat', label: 'Enhanced DCA performance', value: '+15-25%', content: 'additional returns from dynamic crash-buying vs static DCA' },
          { type: 'paragraph', content: 'Rebalancing DCA: When BTC runs up and becomes 60% of your portfolio (above your 50% target), allocate more to ETH and SOL that month until rebalanced. This forces you to buy relatively cheaper assets — systematic low-buying.' },
        ],
        doThisNow: 'Consider upgrading to Pro for advanced DCA templates with dynamic crash-buying features.',
        readingTime: 5,
        isLocked: true,
        quiz: [
          { id: 'q1', question: 'What does Apice recommend doing during a 40%+ market crash?', options: ['Stop investing — protect cash', 'Triple your DCA if possible', 'Switch entirely to stablecoins', 'Wait until the market recovers'], correctIndex: 1, explanation: 'Crash-buying is where generational wealth is built. Apice\'s elite strategy uses reserves to amplify purchases during crashes.' },
          { id: 'q2', question: 'What is "Value Averaging" in the context of DCA?', options: ['Investing only in valuable coins', 'Adjusting contribution size based on portfolio performance', 'Dollar averaging in value tokens only', 'Averaging down on losing positions'], correctIndex: 1, explanation: 'Value averaging adjusts how much you invest based on whether your portfolio is under or over its target growth curve.' },
          { id: 'q3', question: 'Rebalancing DCA means:', options: ['Selling assets to rebalance', 'Using contributions strategically to restore target allocations', 'Starting multiple DCA plans', 'Changing your plan monthly'], correctIndex: 1, explanation: 'Smart rebalancing uses new contributions to buy underweight assets instead of selling overweight ones — tax efficient and disciplined.' },
        ],
        challenge: { title: 'Crash Strategy Blueprint', description: 'Prepare your action plan before the next market crash.', steps: ['Define your crash thresholds: 20%, 40%, 60%', 'Decide how much extra DCA for each level', 'Identify which stablecoin reserves you\'d deploy', 'Write it down so you act on rules, not emotion'], reward: 'Elite Strategist badge + 200 XP' },
      },
      {
        id: 'dca-success-stories',
        title: 'DCA Success Stories',
        summary: ['Real investor examples', 'Long-term results', 'Consistency wins'],
        content: 'The most successful crypto investors share one trait: consistency.',
        contentBlocks: [
          { type: 'paragraph', content: 'The numbers tell the story. An investor who DCA\'d $100/week into BTC from January 2020 to January 2024 invested $20,800 total. At January 2024 prices (~$45,000/BTC), that portfolio was worth approximately $65,000+ — over 3x their investment.' },
          { type: 'stat', label: 'BTC DCA ($100/week, 2020-2024)', value: '3x+', content: 'return on total investment despite 3 major crashes in that period' },
          { type: 'highlight', content: 'The secret: those investors kept buying through 2022\'s bear market when BTC dropped from $68k to $15k. Discipline during fear was the differentiator.' },
          { type: 'quote', content: 'I have made more money being lazy than active. Set it, forget it, compound it.', author: 'Michael Saylor', role: 'MicroStrategy CEO, Bitcoin Maximalist' },
          { type: 'paragraph', content: 'Every Apice member who completes 12 months of consistent DCA has positive portfolio performance in their total investment versus holding cash. The strategy works. The only question is whether you\'ll stay the course.' },
        ],
        doThisNow: 'Start your DCA journey today — even $5/week matters. Open Automations and create your first plan.',
        readingTime: 4,
        isLocked: false,
        quiz: [
          { id: 'q1', question: '$100/week DCA into BTC from 2020-2024 resulted in approximately:', options: ['Breaking even', '50% gain', '3x+ gain', '10x gain'], correctIndex: 2, explanation: '$20,800 invested grew to ~$65,000+ for most DCA investors through full market cycles.' },
          { id: 'q2', question: 'What was the key behavior that separated successful DCA investors in 2022?', options: ['They sold before the crash', 'They kept buying through the bear market', 'They switched to gold', 'They used leverage'], correctIndex: 1, explanation: 'Keeping DCA active during the 2022 crash — when BTC hit $15k — generated the largest gains when markets recovered.' },
          { id: 'q3', question: 'According to Apice data, what does any investor who completes 12 months of DCA achieve?', options: ['Guaranteed 100% gains', 'Positive performance vs. holding cash', 'Access to Club tier free', 'A guaranteed monthly return'], correctIndex: 1, explanation: 'Historical consistency shows 12-month DCA investors consistently outperform cash holdings regardless of market conditions.' },
        ],
        challenge: { title: 'Your 12-Month Commitment', description: 'Make the commitment that separates future-you from everyone else.', steps: ['Set a specific weekly DCA amount', 'Set a calendar reminder every week on the same day', 'Create a rule: "I will not check my portfolio more than once per month"', 'Log your first weekly deposit in the app today'], reward: '🎖️ DCA Champion badge + 250 XP' },
      },
    ],
  },
  {
    id: 'portfolio-mastery',
    name: 'Portfolio Mastery',
    icon: '🏆',
    description: 'Advanced allocation strategies and rebalancing techniques.',
    isLocked: false,
    requiredTier: 'free',
    lessons: [
      {
        id: 'rebalancing-basics',
        title: 'When and How to Rebalance',
        summary: ['Maintain target allocations', 'Quarterly or threshold-based', 'Sell high, buy low automatically'],
        content: 'Rebalancing means adjusting your portfolio back to target allocations.',
        contentBlocks: [
          { type: 'paragraph', content: 'Rebalancing means adjusting your portfolio holdings back to your target allocation percentages. When BTC has a big rally, it might grow from 40% to 55% of your portfolio — rebalancing automatically "trims" the winner and adds to underweighted assets.' },
          { type: 'highlight', content: 'The genius of rebalancing: it forces you to systematically sell relatively high (the winner) and buy relatively low (the laggards). This is disciplined profit-taking without market timing.' },
          { type: 'stat', label: 'Rebalancing benefit', value: '1-3%', content: 'additional annual returns with quarterly threshold-based rebalancing' },
          { type: 'paragraph', content: 'Apice recommends threshold-based rebalancing: when any asset drifts more than 5-10% from its target allocation, rebalance. This is more effective than calendar-based (quarterly) because it responds to actual market movements.' },
        ],
        doThisNow: 'Review your current allocation against your target. Has any asset drifted more than 10%?',
        readingTime: 5,
        isLocked: false,
        quiz: [
          { id: 'q1', question: 'What does portfolio rebalancing accomplish?', options: ['Guarantees higher returns', 'Restores target asset allocations', 'Eliminates all risk', 'Maximizes a single asset'], correctIndex: 1, explanation: 'Rebalancing restores your designed allocation by trimming winners and adding to underweighted positions.' },
          { id: 'q2', question: 'When does Apice recommend rebalancing (threshold-based)?', options: ['Every day', 'When an asset drifts 5-10% from target', 'Only in bull markets', 'Never — just hold'], correctIndex: 1, explanation: 'Threshold rebalancing (5-10% drift) is more responsive to actual market conditions than calendar-based approaches.' },
          { id: 'q3', question: 'Rebalancing automatically implements which investment principle?', options: ['Buy and hold forever', 'Average down on losers', 'Sell relatively high, buy relatively low', 'Maximum concentration'], correctIndex: 2, explanation: 'By trimming what grew and adding to what lagged, rebalancing systematically sells relatively higher and buys relatively lower.' },
        ],
        challenge: { title: 'Rebalancing Audit', description: 'Check if your portfolio needs rebalancing right now.', steps: ['Write down your target allocation (e.g., BTC 40%, ETH 30%, SOL 20%, USDT 10%)', 'Check your current actual percentages on Bybit', 'Identify which assets are over/under target by 5%+', 'Plan which trades would restore balance'], reward: 'Portfolio Architect badge + 100 XP' },
      },
      {
        id: 'correlation-matters',
        title: 'Asset Correlation Explained',
        summary: ['Not all crypto moves together', 'True diversification needs low correlation', 'BTC/ETH vs altcoins'],
        content: 'Correlation measures how assets move relative to each other.',
        contentBlocks: [
          { type: 'paragraph', content: 'Correlation measures how two assets move relative to each other. A correlation of 1.0 means they move identically. A correlation of 0 means no relationship. A correlation of -1.0 means they move opposite. True diversification requires assets with correlation below 0.7.' },
          { type: 'highlight', content: 'Crypto reality: Most altcoins have 0.7-0.9 correlation with BTC in downturns. This means in a crash, diversification within crypto provides less protection than it appears. Stablecoins (0 correlation) are your true hedge.' },
          { type: 'stat', label: 'Altcoin-BTC correlation (bear markets)', value: '0.8-0.9', content: 'meaning most altcoins fall similarly to BTC in crashes' },
          { type: 'paragraph', content: 'This is why Apice insists on keeping 10-20% in stablecoins. In a crash, your stablecoins maintain value while everything else drops. This lets you buy the dip aggressively — turning the crash into an opportunity.' },
        ],
        doThisNow: 'Consider if your portfolio has enough uncorrelated positions. Is your stablecoin allocation adequate?',
        readingTime: 4,
        isLocked: true,
        quiz: [
          { id: 'q1', question: 'A correlation of 0.9 between two assets means:', options: ['They are completely independent', 'They move almost identically', 'One rises when the other falls', 'No meaningful relationship'], correctIndex: 1, explanation: '0.9 correlation means the assets move very similarly — near-perfect positive correlation. Poor diversification.' },
          { id: 'q2', question: 'The best "true hedge" in a crypto portfolio according to Apice is:', options: ['Gold', 'More Bitcoin', 'Stablecoins (USDT/USDC)', 'NFTs'], correctIndex: 2, explanation: 'Stablecoins have near-zero correlation with crypto in downturns, maintaining value when everything else drops.' },
          { id: 'q3', question: 'During a crypto crash, altcoins typically:', options: ['Stay stable', 'Rise in value', 'Drop similarly to BTC (0.8-0.9 correlation)', 'Outperform BTC'], correctIndex: 2, explanation: 'In bear markets, crypto assets become highly correlated — they all fall together, limiting intra-crypto diversification.' },
        ],
        challenge: { title: 'Correlation Map Exercise', description: 'Map the correlation in your portfolio to measure true diversification.', steps: ['List your assets', 'Estimate: do you hold assets that tend to move together?', 'Identify your stablecoin %', 'Ask: if BTC drops 50%, what % of my portfolio is protected?'], reward: 'Risk Analyst badge + 150 XP' },
      },
    ],
  },
  {
    id: 'automation',
    name: 'Automation & AI',
    icon: '🤖',
    description: 'AI trading, DCA automation, and execution infrastructure.',
    isLocked: true,
    requiredTier: 'pro',
    lessons: [
      {
        id: 'ai-trade-intro',
        title: 'Introduction to AI Trading',
        summary: ['Algorithmic execution', 'Risk-managed by design', 'You remain in control'],
        content: 'AI trading uses algorithms to execute trades based on predefined strategies.',
        contentBlocks: [
          { type: 'paragraph', content: 'AI trading uses algorithms to execute trades based on predefined strategies and market conditions. The AI doesn\'t guess — it follows rules. Your rules. You define the parameters; the algorithm executes with inhuman speed and precision.' },
          { type: 'highlight', content: 'Critical: AI trading through Apice means the algo executes on YOUR Bybit account using API keys with NO withdrawal permissions. Your funds are always in YOUR control.' },
          { type: 'stat', label: 'Algorithm advantage', value: '24/7', content: 'automated execution with zero emotional interference' },
          { type: 'paragraph', content: 'The three AI tools Apice integrates: (1) Grid Bots — profit from sideways volatility, (2) DCA Bots — automated weekly purchases, (3) Copy Trading — mirror elite traders proportionally.' },
        ],
        doThisNow: 'Explore the AI Trade setup wizard in Automations to see what\'s available at your tier.',
        readingTime: 4,
        isLocked: true,
        quiz: [
          { id: 'q1', question: 'When using AI trading through Apice, where do your funds stay?', options: ['With Apice', 'In a shared pool', 'On your own Bybit account', 'Converted to stablecoins'], correctIndex: 2, explanation: 'Your funds always remain in YOUR Bybit account. API keys never have withdrawal permissions.' },
          { id: 'q2', question: 'AI trading eliminates which of the following from the investment process?', options: ['All risk', 'Emotional decision-making during execution', 'The need for strategy', 'Market volatility'], correctIndex: 1, explanation: 'Algorithms execute exactly as programmed — no fear, no greed, no hesitation. Emotional errors are eliminated.' },
          { id: 'q3', question: 'Which Apice AI tool profits from sideways/ranging markets?', options: ['DCA Bots', 'Copy Trading', 'Grid Bots', 'Yield Farming'], correctIndex: 2, explanation: 'Grid bots create a grid of buy/sell orders, profiting from price oscillations in both directions.' },
        ],
        challenge: { title: 'API Security Setup', description: 'Set up your Bybit API correctly for safe bot connection.', steps: ['Create a new API key on Bybit (API Management)', 'Enable: Spot trading, Read permissions only', 'Disable: Withdrawal permissions (critical)', 'Add IP whitelist if possible', 'Test the connection in Apice Automations'], reward: 'Security Expert badge + 200 XP' },
      },
      {
        id: 'api-security',
        title: 'API Key Security Best Practices',
        summary: ['Read-only when possible', 'IP whitelisting is essential', 'Never share your keys'],
        content: 'API keys connect external tools to your exchange. Security is paramount.',
        contentBlocks: [
          { type: 'paragraph', content: 'API keys are like a limited power of attorney for your exchange account. Done right: your crypto is safe and automations work perfectly. Done wrong: a hacker could access and trade (but not withdraw) from your account.' },
          { type: 'highlight', content: 'The 4 Rules of API Security: 1) Never enable withdrawal permissions. 2) Always add IP whitelist restrictions. 3) Use separate keys for each tool. 4) Rotate keys every 90 days.' },
          { type: 'stat', label: 'Exchange hacks prevented', value: '99%+', content: 'of hacking incidents involved keys with withdrawal permissions enabled' },
        ],
        doThisNow: 'Review your existing API key permissions on Bybit. Disable withdrawal if enabled.',
        readingTime: 3,
        isLocked: true,
        quiz: [
          { id: 'q1', question: 'The most critical API permission to DISABLE is:', options: ['Spot trading', 'Read access', 'Withdrawal permissions', 'Futures trading'], correctIndex: 2, explanation: 'Disabling withdrawal permissions means even if an API key is compromised, no funds can leave your account.' },
          { id: 'q2', question: 'How often should you rotate your API keys?', options: ['Never', 'Every 90 days', 'Once a year', 'Only if hacked'], correctIndex: 1, explanation: 'Regular rotation (every 90 days) minimizes exposure window if a key is ever compromised without your knowledge.' },
          { id: 'q3', question: 'IP whitelisting on an API key means:', options: ['Any IP can use the key', 'Only specified IPs can use the key', 'The key is locked permanently', 'The key only works on mobile'], correctIndex: 1, explanation: 'IP whitelisting restricts which server/device can use the key, blocking access from unauthorized sources.' },
        ],
        challenge: { title: 'Full Security Audit', description: 'Audit all your exchange API keys for security compliance.', steps: ['Log in to Bybit → API Management', 'Review each existing key\'s permissions', 'Delete any unused or old keys', 'Ensure no active keys have withdrawal enabled', 'Add IP restrictions to trading keys'], reward: 'Security Guardian badge + 150 XP' },
      },
    ],
  },
  {
    id: 'copy-trading',
    name: 'Copy Trading',
    icon: '🤝',
    description: 'Following curated portfolios and understanding copy mechanics.',
    isLocked: true,
    requiredTier: 'pro',
    lessons: [
      {
        id: 'copy-intro',
        title: 'How Copy Trading Works',
        summary: ['Mirror expert entries', 'Proportional position sizing', 'Stop anytime'],
        content: 'Copy trading automatically mirrors the trades of selected traders.',
        contentBlocks: [
          { type: 'paragraph', content: 'Copy trading automatically mirrors the trades of selected verified traders. When your chosen trader opens a position sizing 3% of their portfolio, you automatically open the same position at 3% of your allocated capital. Proportional, automatic, and always stoppable.' },
          { type: 'highlight', content: 'Apice copy portfolios are curated — not random Bybit traders. Our team selects based on: 12+ months verified history, max drawdown limits, risk-adjusted returns, and operational transparency.' },
          { type: 'stat', label: 'Apice copy portfolio target', value: '25-60%', content: 'annual returns depending on risk profile selected' },
          { type: 'paragraph', content: 'You can stop copying instantly at any time. No lock-up periods. No penalties. Your capital remains yours. This is not a fund — you\'re always in direct control of your assets.' },
        ],
        doThisNow: 'Review the Copy Portfolios section to see the three risk profiles available.',
        readingTime: 3,
        isLocked: true,
        quiz: [
          { id: 'q1', question: 'In Apice copy trading, position sizing is:', options: ['Fixed at $1,000 per trade', 'Proportional to your allocated capital', 'The same as the trader\'s exact amount', 'Random'], correctIndex: 1, explanation: 'Positions are proportional: if you allocate $2,000 and the trader uses 5% per trade, you use $100 per trade.' },
          { id: 'q2', question: 'Can you stop copy trading whenever you want?', options: ['No, there\'s a 30-day lock-up', 'Yes, instantly with no penalty', 'Only during weekdays', 'Only with 7-day notice'], correctIndex: 1, explanation: 'You can stop copying instantly at any time. No lock-up, no penalty, no friction.' },
          { id: 'q3', question: 'How does Apice select copy trading portfolios?', options: ['Random traders with high followers', 'Curated based on 12+ month history, drawdowns, and risk-adjusted returns', 'The highest returns only', 'Community vote'], correctIndex: 1, explanation: 'Apice curates based on verified track records, not just past returns — drawdown limits and consistency matter equally.' },
        ],
        challenge: { title: 'Copy Trading Risk Assessment', description: 'Determine which copy portfolio matches your risk tolerance.', steps: ['Review all 3 Apice copy portfolio risk profiles', 'Match to your investor profile (Conservative/Balanced/Growth)', 'Calculate: how much capital would you allocate?', 'Understand the max drawdown of your chosen profile'], reward: 'Copy Trading Ready badge + 200 XP' },
      },
    ],
  },
  {
    id: 'bybit-mastery',
    name: 'Bybit Mastery',
    icon: '🏦',
    description: 'Master Bybit exchange — from basics to API automation with Apice.',
    isLocked: false,
    requiredTier: 'free',
    lessons: [
      {
        id: 'bybit-intro',
        title: 'Getting Started with Bybit',
        summary: ['Account setup & KYC', 'Interface overview', 'Security best practices'],
        content: 'Bybit is a top 3 global crypto exchange. Learn to navigate it like a pro.',
        contentBlocks: [
          { type: 'paragraph', content: 'Bybit ranks consistently in the top 3 global exchanges by trading volume. With 750+ trading pairs, zero-fee spot trading on major pairs, and institutional-grade security, it\'s the execution engine behind the Apice methodology.' },
          { type: 'highlight', content: 'First steps: Complete KYC verification (ID + selfie, ~5 min), enable 2FA authentication, and set an anti-phishing code. These 3 steps protect 99% of accounts from unauthorized access.' },
          { type: 'stat', label: 'Security Score', value: '9.4/10', content: 'Multi-sig cold wallets + $300M+ insurance fund' },
          { type: 'paragraph', content: 'The Bybit interface has 5 key areas: Home (overview), Trade (spot/derivatives), Earn (yield products), Copy Trading, and Assets (wallets). For the Apice methodology, you\'ll primarily use Spot trading and Assets.' },
        ],
        doThisNow: 'Log into Bybit and enable 2FA + anti-phishing code if you haven\'t already.',
        readingTime: 4,
        isLocked: false,
        quiz: [
          { id: 'q1', question: 'What are the 3 essential security steps for a new Bybit account?', options: ['Just set a password', 'KYC, 2FA, and anti-phishing code', 'Download the mobile app', 'None — Bybit handles security'], correctIndex: 1, explanation: 'KYC verifies your identity, 2FA adds a second login factor, and anti-phishing codes help you identify legitimate Bybit emails.' },
          { id: 'q2', question: 'Bybit\'s spot trading fees on major pairs are:', options: ['1% per trade', 'Zero fees on major pairs', '0.5% per trade', 'Variable based on volume'], correctIndex: 1, explanation: 'Bybit offers zero-fee spot trading on major pairs like BTCUSDT, making it ideal for DCA strategies.' },
        ],
      },
      {
        id: 'bybit-deposit',
        title: 'Deposits & Withdrawals',
        summary: ['Fiat on-ramp methods', 'Crypto deposits (networks)', 'Withdrawal best practices'],
        content: 'Learn to move money in and out of Bybit efficiently and safely.',
        contentBlocks: [
          { type: 'paragraph', content: 'Bybit supports multiple deposit methods: credit/debit cards (instant, ~2% fee), bank transfer (1-3 days, lower fees), P2P trading (flexible, peer-to-peer), and crypto deposits (fastest, network fees only).' },
          { type: 'highlight', content: 'Pro tip: For regular DCA deposits, bank transfers offer the best fee structure. For one-time quick buys, card deposits are instant. For crypto transfers, use TRC-20 (Tron network) for the cheapest USDT transfers (~$1 fee).' },
          { type: 'stat', label: 'Cheapest USDT transfer', value: 'TRC-20', content: '~$1 fee vs $5-15 on Ethereum' },
          { type: 'paragraph', content: 'Withdrawals: Always double-check the network and address before sending. Bybit uses withdrawal whitelisting — add your personal wallet addresses and enable 24h withdrawal locks for maximum security.' },
        ],
        doThisNow: 'Make your first USDT deposit using any method. Even $10 activates your Apice strategies.',
        readingTime: 3,
        isLocked: false,
        quiz: [
          { id: 'q1', question: 'Which network is cheapest for USDT transfers?', options: ['Ethereum (ERC-20)', 'Tron (TRC-20)', 'Bitcoin', 'Solana'], correctIndex: 1, explanation: 'TRC-20 USDT transfers cost ~$1 vs $5-15 on Ethereum, making it ideal for regular deposits.' },
          { id: 'q2', question: 'What is Bybit\'s withdrawal whitelisting feature?', options: ['A list of banned addresses', 'Pre-approved addresses for withdrawals', 'A VIP perk', 'Not a real feature'], correctIndex: 1, explanation: 'Whitelisting lets you pre-approve withdrawal addresses, preventing unauthorized withdrawals even if your account is compromised.' },
        ],
      },
      {
        id: 'bybit-spot',
        title: 'Spot Trading Basics',
        summary: ['Market vs Limit orders', 'Reading the order book', 'Understanding trading pairs'],
        content: 'Spot trading is buying and selling crypto at current market prices.',
        contentBlocks: [
          { type: 'paragraph', content: 'Spot trading means buying crypto at the current market price and owning it directly. Unlike derivatives, you actually hold the asset. This is the foundation of the Apice DCA strategy — you\'re accumulating real crypto.' },
          { type: 'highlight', content: 'Market Order: Execute immediately at best price. Perfect for DCA buys. Limit Order: Set a specific price — useful for buying dips. The Apice DCA system uses Market orders for automatic execution.' },
          { type: 'stat', label: 'Order types you need', value: '2', content: 'Market (DCA) and Limit (dip buying) cover 99% of use cases' },
          { type: 'paragraph', content: 'Trading pairs like BTCUSDT mean you\'re trading BTC priced in USDT. The quote coin (USDT) is what you spend, and the base coin (BTC) is what you receive. For DCA, you set the USDT amount and receive however much crypto that buys at current prices.' },
        ],
        doThisNow: 'Try a small spot market buy on Bybit — even $5 of BTCUSDT to see the flow.',
        readingTime: 4,
        isLocked: false,
        quiz: [
          { id: 'q1', question: 'What type of order does the Apice DCA system use?', options: ['Limit orders only', 'Market orders for automatic execution', 'Stop-loss orders', 'OCO orders'], correctIndex: 1, explanation: 'Market orders execute immediately at the best available price, perfect for scheduled DCA buys.' },
          { id: 'q2', question: 'In the pair BTCUSDT, what do you spend to buy?', options: ['BTC', 'USDT', 'ETH', 'USD'], correctIndex: 1, explanation: 'USDT is the quote coin — you spend USDT to buy BTC in the BTCUSDT trading pair.' },
        ],
      },
      {
        id: 'bybit-api',
        title: 'Connecting Bybit API with Apice',
        summary: ['API key creation', 'Permission settings', 'Automated DCA setup'],
        content: 'Connect your Bybit account to Apice for automated DCA execution.',
        contentBlocks: [
          { type: 'paragraph', content: 'The Bybit API lets Apice execute your DCA plans automatically. Instead of manually placing orders every week, the system buys for you at the scheduled time with the exact amounts you configured.' },
          { type: 'highlight', content: 'API Key Setup: Bybit → Account → API Management → Create New Key. Enable "Trade" with "Spot" access. NEVER enable "Withdraw" permission — Apice only needs to place buy orders, not move your funds.' },
          { type: 'stat', label: 'Security model', value: 'Read + Trade', content: 'Apice never has withdrawal access to your funds' },
          { type: 'paragraph', content: 'After creating your API key, go to Apice Settings → Connect Bybit → paste your API Key and Secret. The system tests permissions automatically and confirms the connection. Your secret is encrypted and never stored in plain text.' },
          { type: 'paragraph', content: 'Once connected, your DCA plans execute automatically on schedule. You can monitor executions in the DCA Planner, see filled prices, and track your cost basis — all without lifting a finger.' },
        ],
        doThisNow: 'Go to Settings → Connect Bybit and link your API key to enable automated DCA.',
        readingTime: 5,
        isLocked: false,
        quiz: [
          { id: 'q1', question: 'What permissions should you enable for the Apice API key?', options: ['Read + Withdraw', 'Read + Trade (Spot) only', 'All permissions', 'Read only'], correctIndex: 1, explanation: 'Read + Trade (Spot) lets Apice place DCA buy orders. Never enable Withdraw — Apice doesn\'t need it.' },
          { id: 'q2', question: 'What happens after you connect the API to Apice?', options: ['Nothing until you buy premium', 'DCA plans execute automatically on schedule', 'Your funds move to Apice', 'You need to manually approve each trade'], correctIndex: 1, explanation: 'Connected DCA plans execute automatically — buying at scheduled intervals with configured amounts.' },
          { id: 'q3', question: 'How is your API secret stored in Apice?', options: ['Plain text in database', 'Encrypted with AES', 'Not stored at all', 'Sent to third parties'], correctIndex: 1, explanation: 'API secrets are AES-encrypted before storage. The plain text secret is never stored or transmitted after initial connection.' },
        ],
        challenge: { title: 'Full Automation Setup', description: 'Complete the end-to-end automated DCA setup.', steps: ['Create API key on Bybit with Trade (Spot) permission', 'Connect API in Apice Settings', 'Create a DCA plan with at least 2 assets', 'Verify the first automated execution'], reward: '🤖 Automation Master badge + 150 XP' },
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
    // TODO: Replace APICE with your real Bybit affiliate ID from https://www.bybit.com/affiliates/
    url: 'https://www.bybit.com/invite?ref=APICE',
    category: 'exchange',
  },
  {
    id: 'ai-trade',
    name: 'AI Trade Tool',
    description: 'External AI execution tool for automated trading.',
    // Guest access based on local reverse engineering reference docs.
    url: 'https://app.cointech2u.com/h51/index.html#/?invite_code=gr4Mca',
    category: 'ai-tool',
  },
  {
    id: 'ai-bot',
    name: 'Bitradex AI Bot',
    description: 'AI automation infrastructure for consistent execution.',
    // TODO: Replace with real Bitradex affiliate URL once partnership is finalized
    url: 'https://example.com/bitradex?ref=apice',
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
    price: '$49.90',
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
    price: '$149.90',
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
    subtitle: 'Start your journey in the Apice universe',
    icon: '🔥',
    color: 'text-orange-400',
    gradient: 'from-orange-500 to-red-500',
    badge: 'Awakened',
    badgeIcon: '👁️',
    xpTotal: 300,
    tasks: [
      { id: 'm1-1', storeKey: 'm1_onboardingCompleted', title: 'The Manifesto', description: 'Unlock the vision. Understand how elite capital flows and why you were invited.', actionLabel: 'Explore Vision', actionRoute: '/onboarding', xp: 150 },
      { id: 'm1-2', storeKey: 'm1_profileQuizDone', title: 'DNA Analysis', description: 'Our AI needs to understand your core. Reveal your investor DNA to open the path.', actionLabel: 'Start Analysis', actionRoute: '/quiz', xp: 150 },
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
    xpTotal: 550,
    tasks: [
      { id: 'm2-1', storeKey: 'm2_methodologyRead', title: 'Master the Apice Method', description: 'Internalize the 3 pillars: DCA + diversification + micro-leverage for explosive performance.', actionLabel: 'Go Deeper', actionRoute: '/mission2/method', xp: 200 },
      { id: 'm2-2', storeKey: 'm2_apiConnected', title: 'Connect the Strategy Engine', description: 'Link your Bybit account via API to enable automated DCA, AI Advisor, and real-time execution.', actionLabel: 'Connect', actionRoute: '/mission2/api-setup', xp: 200 },
      { id: 'm2-3', storeKey: 'm2_strategiesExplored', title: 'Explore Strategies', description: 'Discover the wealth-building and automation frameworks that power the Apice engine.', actionLabel: 'Explore', actionRoute: '/strategies', xp: 150 },
    ],
  },
  {
    id: 3,
    title: 'Smart Diversifier',
    subtitle: 'Build a resilient wealth engine',
    icon: '🛡️',
    color: 'text-emerald-400',
    gradient: 'from-emerald-500 to-cyan-500',
    badge: 'Architect',
    badgeIcon: '🏗️',
    xpTotal: 400,
    tasks: [
      { id: 'm3-1', storeKey: 'm3_strategyChosen', title: 'Strategic Alignment', description: 'Align your goals to the right risk profile: conservative, balanced, or aggressive.', actionLabel: 'Align Now', actionRoute: '/portfolio', xp: 100 },
      { id: 'm3-2', storeKey: 'm3_portfolioSelected', title: 'Architect Selection', description: 'Choose a market-tested portfolio blueprint optimized by our AI for the current cycle.', actionLabel: 'Choose Blueprint', actionRoute: '/portfolio', xp: 150 },
      { id: 'm3-3', storeKey: 'm3_allocationReviewed', title: 'Precision Check', description: 'Review the weights. Understand exactly what you own and why it is there.', actionLabel: 'Verify Weights', actionRoute: '/portfolio', xp: 150 },
    ],
  },
  {
    id: 4,
    title: 'Execution Force',
    subtitle: 'Deploy your capital on the digital frontier',
    icon: '⚔️',
    color: 'text-rose-400',
    gradient: 'from-rose-500 to-pink-500',
    badge: 'Centurion',
    badgeIcon: '💎',
    xpTotal: 500,
    tasks: [
      { id: 'm4-1', storeKey: 'm4_weeklyPlanSet', title: 'Discipline Protocol', description: 'Set your automated DCA frequency. Consistency is the ultimate weapon.', actionLabel: 'Set Protocol', actionRoute: '/dca-planner', xp: 150 },
      { id: 'm4-2', storeKey: 'm4_firstDepositConfirmed', title: 'Initial Deployment', description: 'Execute your first allocation across assets and watch the engine come to life.', actionLabel: 'Launch Portfolio', actionRoute: '/portfolio', xp: 150 },
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
      { id: 'm5-1', storeKey: 'm5_foundationsCourseCompleted', title: 'Advanced Intel', description: 'Complete the full Foundations course to unlock a deeper market read.', actionLabel: 'Get Intel', actionRoute: '/learn', xp: 250 },
      { id: 'm5-2', storeKey: 'm5_firstStrategyMastered', title: 'Elite Strategy', description: 'Demonstrate DCA mastery for 4 consecutive weeks to prove your consistency.', actionLabel: 'Show Mastery', actionRoute: '/learn', xp: 250 },
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
      { id: 'c1-1', title: 'What is the crypto market?', description: 'Crypto is one of the most innovative financial markets in the world. Bitcoin has delivered extraordinary returns since 2009. Apice helps you participate with intelligence.', actionLabel: 'Got it', tip: 'The crypto market runs 24/7 — unlike the traditional stock exchange.' },
      { id: 'c1-2', title: 'Why DCA works better than trying to time the market', description: 'Investing a fixed amount every week eliminates emotion. Most traders who try to predict the market lose consistency. With DCA, you buy more when it drops and less when it rises.', actionLabel: 'Learn DCA', actionRoute: '/learn' },
      { id: 'c1-3', title: 'The Apice methodology in 3 pillars', description: '1️⃣ Strategic DCA — weekly contributions. 2️⃣ Smart diversification — blue chips, L1s, and DeFi. 3️⃣ Micro-Leverage — 2-5x on 10-20% of the portfolio.', actionLabel: 'Continue' },
    ],
    reward: '🏅 Apice Start',
  },
  {
    day: 2, title: 'Your Exchange Account', subtitle: 'Create your Bybit account step by step', icon: '🏦',
    tasks: [
      { id: 'c2-1', title: 'Why use Bybit?', description: 'One of the largest exchanges in the world: ✅ low fees, ✅ intuitive interface, ✅ automated DCA, ✅ copy trading, ✅ institutional security.', actionLabel: 'Got it', tip: 'Your funds stay in YOUR account. Apice never has access to your money.' },
      { id: 'c2-2', title: 'Step 1: create your account', description: 'Access bybit.com through our link. Sign up with email, create a strong password, and confirm your email.', actionLabel: 'Open Bybit', tip: 'Use our invite for bonuses and reduced fees.' },
      { id: 'c2-3', title: 'Step 2: KYC verification', description: 'Submit a document and a selfie. Process takes 5 to 15 minutes, with approval in up to 24h.', actionLabel: 'Verify account', tip: 'KYC is required by law and protects your account against fraud.' },
    ],
    reward: '🏅 Account ready',
  },
  {
    day: 3, title: 'First Deposit', subtitle: 'Deposit USDT and get ready to invest', icon: '💵',
    tasks: [
      { id: 'c3-1', title: 'What is USDT?', description: 'A stablecoin pegged to the dollar: 1 USDT = 1 USD. It is the base currency for buying other crypto assets.', actionLabel: 'Got it' },
      { id: 'c3-2', title: 'How to deposit USDT on Bybit', description: '1) Assets → Deposit. 2) Select USDT on the TRC20 network. 3) Copy the address. 4) Send from another exchange or use P2P.', actionLabel: 'Deposit now', tip: 'You can start with any amount: $10, $50, or $100.' },
    ],
    reward: '🏅 Account funded',
  },
  {
    day: 4, title: 'Choose Your Strategy', subtitle: 'Set your profile and select a portfolio', icon: '🎯',
    tasks: [
      { id: 'c4-1', title: 'Review your investor profile', description: 'Confirm that the profile reflects your real goals and risk tolerance.', actionLabel: 'View profile', actionRoute: '/profile-result' },
      { id: 'c4-2', title: 'Choose a portfolio', description: 'Select one of the curated portfolios. You can adjust it later.', actionLabel: 'Choose portfolio', actionRoute: '/portfolio' },
    ],
    reward: '🏅 Strategist',
  },
  {
    day: 5, title: 'First Investment', subtitle: 'Execute your first buy following the plan', icon: '🚀',
    tasks: [
      { id: 'c5-1', title: 'Set up your weekly DCA', description: 'Define your weekly amount. A disciplined recurring contribution can completely change your trajectory.', actionLabel: 'Configure DCA', actionRoute: '/investment-setup' },
      { id: 'c5-2', title: 'Execute your first buy', description: 'On Bybit, use Spot Trading. Buy in the proportions of your portfolio and confirm in the app.', actionLabel: 'Confirm purchase', actionRoute: '/portfolio', tip: 'Use market orders for instant purchase.' },
    ],
    reward: '🏅 First trade',
  },
  {
    day: 6, title: 'Automation and Discipline', subtitle: 'Set up reminders and tracking', icon: '⚡',
    tasks: [
      { id: 'c6-1', title: 'Set weekly alerts', description: 'Create a weekly reminder for your contribution. The goal is to build habit.', actionLabel: 'Configure' },
      { id: 'c6-2', title: 'Understand rebalancing', description: 'Every month, review allocations and redistribute if necessary.', actionLabel: 'Learn', actionRoute: '/learn' },
    ],
    reward: '🏅 Disciplined',
  },
  {
    day: 7, title: 'Review and Evolution', subtitle: 'Review your progress and unlock the next level', icon: '🏆',
    tasks: [
      { id: 'c7-1', title: 'Review your first week', description: 'Congratulations. ✅ Account created, ✅ deposit made, ✅ portfolio defined, ✅ investment executed. You are already ahead of most.', actionLabel: 'View summary', actionRoute: '/home' },
      { id: 'c7-2', title: 'Unlock the next level', description: 'Complete Foundations + 4 weeks of DCA to unlock optimized portfolios and copy trading.', actionLabel: 'Go to Learn', actionRoute: '/learn', tip: 'Those who complete this cycle tend to advance with much more consistency.' },
    ],
    reward: '🏅 7-day champion',
  },
];

// ============== BYBIT GUIDE ==============

export const bybitGuide = {
  // TODO: Replace APICE with your real Bybit affiliate ID from https://www.bybit.com/affiliates/
  referralLink: 'https://www.bybit.com/invite?ref=APICE',
  referralCode: 'APICE', // TODO: Replace with real affiliate code
  benefits: [
    { icon: '💰', title: 'Sign-up bonus', description: 'Receive benefits when creating your account with the Apice invite' },
    { icon: '📉', title: 'Reduced fees', description: 'Trading fee discounts through the Apice partner link' },
    { icon: '🎁', title: 'Exclusive promotions', description: 'Access to events and rewards reserved for Apice members' },
    { icon: '🤝', title: 'Priority support', description: 'Dedicated Apice community support for questions and setup' },
  ],
  steps: [
    { step: 1, title: 'Access the link', description: 'Click the button to open Bybit with the invite already applied.' },
    { step: 2, title: 'Create your account', description: 'Email + strong password. Then confirm the verification email.' },
    { step: 3, title: 'KYC verification', description: 'Document + selfie. Approval in up to 24 hours.' },
    { step: 4, title: 'Deposit USDT', description: 'Assets → Deposit → USDT → TRC20 network. Any amount works.' },
    { step: 5, title: 'Return to the app', description: 'Confirm here that you are ready and start investing.' },
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
