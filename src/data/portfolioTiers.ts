// ============================================================================
// Apice Portfolio Tiers — Simplified Strategic System
// ============================================================================
// Philosophy: "Escolhe. Ativa. Esquece."
//
// 3 clear progression tiers + 1 AI-managed tier:
//   Starter → Core → Pro → AI Optimized
//
// Each tier includes mandatory War Chest (Capital de Guerra) in USDT.
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
    subtitle: 'Comece com segurança',
    emoji: '🌱',
    description: 'Perfeito para quem está dando os primeiros passos em cripto. Foco total em BTC e ETH — os ativos mais seguros do mercado — com Capital de Guerra para oportunidades.',
    assets: [
      { symbol: 'BTC', name: 'Bitcoin', percentage: 55, color: '#F7931A' },
      { symbol: 'ETH', name: 'Ethereum', percentage: 28, color: '#627EEA' },
      { symbol: 'USDT', name: 'Capital de Guerra', percentage: 17, color: '#26A17B', isWarChest: true },
    ],
    warChestPct: 17,
    minWeekly: 10,
    maxWeekly: 100,
    suggestedWeekly: 25,
    minCapitalLabel: '$10/semana',
    forProfile: ['Conservative Builder'],
    riskLevel: 'low',
    riskLabel: 'Risco Baixo',
    targetAnnualReturn: '10-20%',
    highlight: 'Ideal para começar',
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    borderColor: 'border-emerald-500/30',
  },

  // ── TIER 2: CORE ─────────────────────────────────────────────
  {
    id: 'apice-core',
    tier: 2,
    name: 'Apice Core',
    subtitle: 'Base sólida + diversificação',
    emoji: '💎',
    description: 'O portfólio que todo investidor consistente deveria ter. Blue-chips + L1 de alta qualidade + Capital de Guerra estratégico. Smart DCA ajusta automaticamente por regime de mercado.',
    assets: [
      { symbol: 'BTC', name: 'Bitcoin', percentage: 38, color: '#F7931A' },
      { symbol: 'ETH', name: 'Ethereum', percentage: 23, color: '#627EEA' },
      { symbol: 'SOL', name: 'Solana', percentage: 15, color: '#9945FF' },
      { symbol: 'USDT', name: 'Capital de Guerra', percentage: 14, color: '#26A17B', isWarChest: true },
      { symbol: 'LINK', name: 'Chainlink', percentage: 10, color: '#2A5ADA' },
    ],
    warChestPct: 14,
    minWeekly: 25,
    maxWeekly: 300,
    suggestedWeekly: 75,
    minCapitalLabel: '$25/semana',
    forProfile: ['Balanced Optimizer'],
    riskLevel: 'medium',
    riskLabel: 'Risco Médio',
    targetAnnualReturn: '25-40%',
    isRecommended: true,
    highlight: 'Mais popular',
    gradient: 'from-blue-500/10 to-indigo-600/5',
    borderColor: 'border-blue-500/30',
  },

  // ── TIER 3: PRO ──────────────────────────────────────────────
  {
    id: 'apice-pro',
    tier: 3,
    name: 'Apice Pro',
    subtitle: 'Diversificação máxima',
    emoji: '🚀',
    description: 'Para investidores experientes que buscam retornos assimétricos. Diversificação em 6 ativos com Smart DCA agressivo + Capital de Guerra para capitulações.',
    assets: [
      { symbol: 'BTC', name: 'Bitcoin', percentage: 30, color: '#F7931A' },
      { symbol: 'ETH', name: 'Ethereum', percentage: 20, color: '#627EEA' },
      { symbol: 'SOL', name: 'Solana', percentage: 17, color: '#9945FF' },
      { symbol: 'USDT', name: 'Capital de Guerra', percentage: 11, color: '#26A17B', isWarChest: true },
      { symbol: 'AVAX', name: 'Avalanche', percentage: 10, color: '#E84142' },
      { symbol: 'LINK', name: 'Chainlink', percentage: 7, color: '#2A5ADA' },
      { symbol: 'DOT', name: 'Polkadot', percentage: 5, color: '#E6007A' },
    ],
    warChestPct: 11,
    minWeekly: 50,
    maxWeekly: 500,
    suggestedWeekly: 150,
    minCapitalLabel: '$50/semana',
    forProfile: ['Growth Seeker'],
    riskLevel: 'high',
    riskLabel: 'Risco Alto',
    targetAnnualReturn: '40-70%',
    highlight: 'Máximo retorno',
    gradient: 'from-purple-500/10 to-pink-600/5',
    borderColor: 'border-purple-500/30',
  },

  // ── TIER 4: AI OPTIMIZED ─────────────────────────────────────
  {
    id: 'apice-ai',
    tier: 4,
    name: 'AI Optimized',
    subtitle: 'A IA gerencia tudo',
    emoji: '🧠',
    description: 'Portfólio 100% gerenciado pela inteligência artificial da Apice. Alocações ajustam automaticamente conforme regime de mercado, sentimento e performance histórica. Piloto automático total.',
    assets: [
      { symbol: 'AI', name: 'Alocação Dinâmica', percentage: 88, color: '#8B5CF6' },
      { symbol: 'USDT', name: 'Capital de Guerra', percentage: 12, color: '#26A17B', isWarChest: true },
    ],
    warChestPct: 12,
    minWeekly: 100,
    maxWeekly: 2000,
    suggestedWeekly: 250,
    minCapitalLabel: '$100/semana',
    forProfile: ['Balanced Optimizer', 'Growth Seeker'],
    riskLevel: 'dynamic',
    riskLabel: 'Risco Dinâmico (IA)',
    targetAnnualReturn: '30-60%+',
    isPro: true,
    highlight: 'Piloto automático',
    gradient: 'from-violet-500/10 to-fuchsia-600/5',
    borderColor: 'border-violet-500/30',
  },
];

// ─── Upgrade Recommendations ──────────────────────────────────

export const UPGRADE_PATHS: UpgradeRecommendation[] = [
  {
    fromTier: 'apice-starter',
    toTier: 'apice-core',
    reason: 'Você tem {weeks} semanas de consistência! Está pronto para diversificar com SOL e LINK.',
    trigger: 'consistency',
    conditions: { minStreakWeeks: 4, minBehavioralScore: 40 },
  },
  {
    fromTier: 'apice-starter',
    toTier: 'apice-core',
    reason: 'Seu capital cresceu! Com ${amount} investidos, você pode aproveitar mais diversificação.',
    trigger: 'capital_increase',
    conditions: { minCapitalInvested: 500 },
  },
  {
    fromTier: 'apice-core',
    toTier: 'apice-pro',
    reason: 'Score comportamental de {score}/100 — seu perfil evoluiu para Growth Seeker!',
    trigger: 'profile_evolution',
    conditions: { minStreakWeeks: 8, minBehavioralScore: 65 },
  },
  {
    fromTier: 'apice-core',
    toTier: 'apice-pro',
    reason: 'Mercado em capitulação (F&G: {fg}) — o Pro tem mais ativos para aproveitar a oportunidade.',
    trigger: 'market_opportunity',
    conditions: { regime: 'CAPITULATION' },
  },
  {
    fromTier: 'apice-pro',
    toTier: 'apice-ai',
    reason: 'Com {weeks} semanas de consistência e score de {score}, a IA pode otimizar ainda mais.',
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
