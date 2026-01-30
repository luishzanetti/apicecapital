// Sample data for the Apice app

export interface Strategy {
  id: string;
  name: string;
  risk: 'low' | 'medium' | 'high';
  objective: string;
  description: string;
  forWho: string;
  riskControls: string[];
  activationSteps: string[];
  expectedRange: string;
  minCapital: string;
}

export interface DailyInsight {
  id: string;
  date: string;
  title: string;
  summary: string;
  type: 'market' | 'strategy' | 'education' | 'action';
  actionRequired: boolean;
  premium: boolean;
}

export interface CopyPortfolio {
  id: string;
  name: string;
  risk: 'low' | 'medium' | 'high';
  description: string;
  traders: number;
  avgReturn: string;
  drawdown: string;
}

export const strategies: Strategy[] = [
  {
    id: 'conservative',
    name: 'Conservative Strategy',
    risk: 'low',
    objective: 'Steady returns with minimal volatility through diversified, low-risk positions.',
    description: 'This strategy focuses on capital preservation while generating consistent, modest returns. It uses advanced risk management to limit drawdowns and protect your investment.',
    forWho: 'Ideal for investors who prioritize safety over high returns, or those new to automated trading.',
    riskControls: [
      'Maximum position size limited to 5% of portfolio',
      'Automatic stop-loss at 2% per trade',
      'Daily drawdown limit of 3%',
      'Diversified across 5+ asset pairs',
    ],
    activationSteps: [
      'Connect your exchange account',
      'Complete security verification',
      'Set your capital allocation',
      'Review and confirm risk parameters',
      'Activate the strategy',
    ],
    expectedRange: '8-15% annually',
    minCapital: '$200',
  },
  {
    id: 'balanced',
    name: 'Balanced Strategy',
    risk: 'medium',
    objective: 'Optimized risk-reward balance combining steady growth with controlled volatility.',
    description: 'A balanced approach that seeks to maximize returns while maintaining reasonable risk levels. Combines multiple sub-strategies to smooth out performance.',
    forWho: 'Suited for investors comfortable with moderate fluctuations in pursuit of better returns.',
    riskControls: [
      'Maximum position size of 10% of portfolio',
      'Dynamic stop-loss between 3-5%',
      'Weekly rebalancing',
      'Correlation monitoring across positions',
    ],
    activationSteps: [
      'Connect your exchange account',
      'Complete security verification',
      'Choose allocation percentage',
      'Set risk tolerance parameters',
      'Activate the strategy',
    ],
    expectedRange: '15-30% annually',
    minCapital: '$500',
  },
  {
    id: 'aggressive',
    name: 'Aggressive Strategy',
    risk: 'high',
    objective: 'Maximum growth potential through dynamic, high-opportunity positions.',
    description: 'Designed for experienced investors seeking higher returns. Uses advanced algorithms to identify high-potential opportunities while maintaining essential risk controls.',
    forWho: 'For experienced investors with higher risk tolerance and longer time horizons.',
    riskControls: [
      'Position sizing up to 20% of portfolio',
      'Trailing stop-loss mechanism',
      'Volatility-adjusted position sizing',
      'Maximum daily loss limit of 8%',
    ],
    activationSteps: [
      'Connect your exchange account',
      'Complete security verification',
      'Acknowledge risk disclosure',
      'Set capital allocation',
      'Activate the strategy',
    ],
    expectedRange: '30-60%+ annually',
    minCapital: '$1,000',
  },
];

export const dailyInsights: DailyInsight[] = [
  {
    id: '1',
    date: new Date().toISOString(),
    title: 'Market Conditions Stable',
    summary: 'Current market volatility is within normal parameters. All active strategies are performing as expected. No action required.',
    type: 'market',
    actionRequired: false,
    premium: false,
  },
  {
    id: '2',
    date: new Date(Date.now() - 86400000).toISOString(),
    title: 'Risk Adjustment Applied',
    summary: 'Your Conservative Strategy automatically reduced exposure by 15% due to increased market uncertainty. Positions will normalize when conditions improve.',
    type: 'strategy',
    actionRequired: false,
    premium: false,
  },
  {
    id: '3',
    date: new Date(Date.now() - 172800000).toISOString(),
    title: 'Weekly Performance Summary',
    summary: 'Your portfolio showed a +2.3% return this week. All risk parameters remained within targets. Review detailed breakdown in reports.',
    type: 'strategy',
    actionRequired: false,
    premium: true,
  },
  {
    id: '4',
    date: new Date(Date.now() - 259200000).toISOString(),
    title: 'Understanding Risk Controls',
    summary: 'Learn how Apice automatically manages risk across your portfolio with stop-losses, position limits, and diversification.',
    type: 'education',
    actionRequired: false,
    premium: false,
  },
  {
    id: '5',
    date: new Date(Date.now() - 345600000).toISOString(),
    title: 'Exchange Security Check',
    summary: 'We recommend reviewing your exchange API permissions to ensure read-only access where possible. Tap to learn more.',
    type: 'action',
    actionRequired: true,
    premium: false,
  },
];

export const copyPortfolios: CopyPortfolio[] = [
  {
    id: 'cp-conservative',
    name: 'Steady Growth Portfolio',
    risk: 'low',
    description: 'Follow top-performing conservative traders with proven track records of consistent returns.',
    traders: 5,
    avgReturn: '+12% / 6mo',
    drawdown: '-4% max',
  },
  {
    id: 'cp-balanced',
    name: 'Balanced Leaders Portfolio',
    risk: 'medium',
    description: 'A curated mix of balanced traders combining growth with risk management.',
    traders: 8,
    avgReturn: '+24% / 6mo',
    drawdown: '-8% max',
  },
  {
    id: 'cp-aggressive',
    name: 'Alpha Seekers Portfolio',
    risk: 'high',
    description: 'High-performance traders targeting maximum returns. Higher risk, higher potential.',
    traders: 4,
    avgReturn: '+45% / 6mo',
    drawdown: '-15% max',
  },
];

export const faqItems = [
  {
    question: 'How do I keep control of my funds?',
    answer: 'Your funds always remain on your exchange account. Apice connects via API with limited permissions - we never have withdrawal access. You can revoke access at any time.',
  },
  {
    question: 'What are the risks involved?',
    answer: 'All crypto trading involves risk. Past performance does not guarantee future results. Our strategies include risk controls, but losses are possible. Only invest what you can afford to lose.',
  },
  {
    question: 'How does the AI automation work?',
    answer: 'Our AI infrastructure analyzes market conditions and executes trades based on predefined strategies and risk parameters. All actions are transparent and logged for your review.',
  },
  {
    question: 'Can I stop at any time?',
    answer: 'Yes, absolutely. You have full control to pause or stop any strategy instantly. There are no lock-up periods or withdrawal restrictions.',
  },
  {
    question: 'What exchanges are supported?',
    answer: 'Currently, we support Bybit as our primary exchange partner. We chose Bybit for its reliability, security, and comprehensive API capabilities.',
  },
  {
    question: 'How do subscription tiers work?',
    answer: 'Free users get access to basic features and limited insights. Pro unlocks all strategies and premium features. Club adds community access and advanced optimization tools.',
  },
];

export const subscriptionPlans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      'Basic dashboard',
      'Limited daily insights',
      'Conservative strategy preview',
      'Basic setup guide',
    ],
    limitations: [
      'No premium strategies',
      'No detailed reports',
      'No community access',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    period: 'per month',
    features: [
      'All strategies unlocked',
      'Premium daily insights',
      'Detailed performance reports',
      'Priority support',
      'AI Bot access',
      'Copy portfolios',
    ],
    limitations: [
      'No community access',
      'No capital optimization tools',
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
      'Capital optimization tools',
      'Early access to new features',
      'Direct strategy team contact',
      'Custom risk configurations',
    ],
    limitations: [],
  },
];
