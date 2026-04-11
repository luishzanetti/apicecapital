import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Compass,
  Shield,
  Calendar,
  Bot,
  Copy,
  CreditCard,
  TrendingUp,
  Zap,
  Sparkles,
  ArrowRight,
  Lock,
  BarChart3,
  Target,
  ChevronRight,
  CheckCircle2,
  PieChart,
  ArrowRightLeft,
  Layers,
  DollarSign,
  Rocket,
  Flame,
  Crown,
  CircleDot,
} from 'lucide-react';

interface StrategyCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  iconGradient: string;
  route: string;
  badge?: string;
  badgeVariant?: 'default' | 'premium' | 'low' | 'medium' | 'high' | 'recommended';
  features: string[];
  projection?: string;
  isLocked: boolean;
  lockMessage?: string;
  category: 'wealth-building' | 'automation' | 'advanced';
}

// ═══════════════════════════════════════════════════════════════════════════════
// Strategy Onboarding — Visual walkthrough on first visit from Mission 2
// ═══════════════════════════════════════════════════════════════════════════════

const ONBOARDING_SLIDES = [
  {
    id: 'intro',
    icon: Layers,
    iconGradient: 'from-indigo-500 to-violet-500',
    title: 'Welcome to the Apice Arsenal',
    subtitle: 'Your wealth-building strategy system',
    body: 'Apice isn\'t a single strategy — it\'s a complete system. Every piece is designed to work together, transforming consistent contributions into real wealth in the crypto market.',
    highlight: null,
  },
  {
    id: 'dca',
    icon: ArrowRightLeft,
    iconGradient: 'from-blue-500 to-cyan-500',
    title: 'DCA Accumulation',
    subtitle: 'The foundation — accumulate with consistency',
    body: 'Dollar-Cost Averaging is the foundation of everything. You set a weekly amount (starting from $5) and the system buys automatically, without emotion. When the market drops, you buy more. When it rises, you buy less. Over 4 years, BTC DCA investors had positive returns in 94% of cases.',
    highlight: { stat: '+138%', label: 'Average BTC DCA return over 4 years' },
  },
  {
    id: 'cashback',
    icon: CreditCard,
    iconGradient: 'from-amber-500 to-orange-500',
    title: 'Cashback Machine',
    subtitle: 'Turn everyday spending into Bitcoin',
    body: 'Every purchase you normally make becomes a micro-accumulation of BTC. Earn 2-10% cashback in Bitcoin on your daily purchases. $2,000/month in spending can generate $50-200/month in BTC — zero extra effort.',
    highlight: { stat: '$2,400+', label: 'BTC accumulated per year in cashback' },
  },
  {
    id: 'copy',
    icon: PieChart,
    iconGradient: 'from-violet-500 to-purple-500',
    title: 'Copy Portfolios',
    subtitle: 'Expert-curated portfolios',
    body: 'Follow portfolios built and rebalanced by experienced traders. Three risk profiles: Core (conservative), Optimized (balanced), and Explosive (aggressive). Your funds, their strategy. Automatic quarterly rebalancing keeps your allocation optimized.',
    highlight: { stat: '35-60%', label: 'Target annual return (varies by profile)' },
  },
  {
    id: 'ai',
    icon: Bot,
    iconGradient: 'from-emerald-500 to-green-500',
    title: 'AI Trade & Automation',
    subtitle: 'Artificial intelligence in command',
    body: 'Our AI Advisor analyzes your portfolio in real time, suggests rebalancing, and identifies opportunities. AI Trade Setup uses algorithmic analysis for optimized entries with automatic risk management. AI eliminates the emotional factor — the investor\'s biggest enemy.',
    highlight: { stat: '24/7', label: 'Non-stop monitoring and execution' },
  },
  {
    id: 'synergy',
    icon: Rocket,
    iconGradient: 'from-rose-500 to-pink-500',
    title: 'The Multiplier Effect',
    subtitle: 'How it all connects',
    body: 'Alone, each strategy delivers results. Together, they create a multiplier effect:',
    highlight: null,
    synergy: [
      { icon: ArrowRightLeft, color: 'text-blue-400', bg: 'bg-blue-500/10', title: 'DCA builds the foundation', desc: 'Consistent weekly contributions accumulate wealth automatically' },
      { icon: CreditCard, color: 'text-amber-400', bg: 'bg-amber-500/10', title: 'Cashback accelerates', desc: 'Every purchase becomes more BTC with zero extra investment' },
      { icon: PieChart, color: 'text-violet-400', bg: 'bg-violet-500/10', title: 'Portfolios diversify', desc: 'Intelligent allocation reduces risk and maximizes returns' },
      { icon: Bot, color: 'text-emerald-400', bg: 'bg-emerald-500/10', title: 'AI optimizes everything', desc: 'Automated rebalancing and timing 24/7' },
      { icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10', title: 'Compounding multiplies', desc: 'Reinvested gains generate gains on gains — exponentially' },
    ],
  },
];

function StrategyOnboarding({
  onComplete,
  investorType,
}: {
  onComplete: () => void;
  investorType: string | null;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { language } = useTranslation();
  const slide = ONBOARDING_SLIDES[currentSlide];
  const isLast = currentSlide === ONBOARDING_SLIDES.length - 1;
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-background px-5 py-6 pb-28 safe-top flex flex-col">
      {/* Progress dots */}
      <div className="flex gap-1.5 mb-6">
        {ONBOARDING_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              i < currentSlide ? 'bg-green-400' :
              i === currentSlide ? 'bg-primary' :
              'bg-border/40'
            }`}
          />
        ))}
      </div>

      {/* Slide content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            {/* Icon */}
            <div className="text-center">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${slide.iconGradient} flex items-center justify-center mx-auto shadow-lg`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold">{slide.title}</h1>
              <p className="text-sm text-muted-foreground">{slide.subtitle}</p>
            </div>

            {/* Investor context */}
            {currentSlide === 0 && investorType && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 mx-auto max-w-xs">
                <Target className="w-4 h-4 text-primary shrink-0" />
                <p className="text-xs text-primary font-medium">
                  {language === 'pt' ? `Personalizado para seu perfil: ${investorType}` : `Tailored to your profile: ${investorType}`}
                </p>
              </div>
            )}

            {/* Body text */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {slide.body}
            </p>

            {/* Highlight stat */}
            {slide.highlight && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 text-center"
              >
                <p className="text-3xl font-bold text-primary">{slide.highlight.stat}</p>
                <p className="text-xs text-muted-foreground mt-1">{slide.highlight.label}</p>
              </motion.div>
            )}

            {/* Synergy section (last slide) */}
            {'synergy' in slide && slide.synergy && (
              <div className="space-y-2.5">
                {slide.synergy.map((item, i) => {
                  const SynergyIcon = item.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/30"
                    >
                      <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                        <SynergyIcon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{item.title}</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                      {i < slide.synergy!.length - 1 && (
                        <div className="absolute -bottom-1.5 left-7 w-px h-3 bg-border/30" />
                      )}
                    </motion.div>
                  );
                })}

                {/* Final multiplier callout */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="p-4 rounded-2xl bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-green-500/20 text-center"
                >
                  <p className="text-xs font-semibold text-green-400 mb-1">The result?</p>
                  <p className="text-lg font-bold">
                    DCA + Cashback + Portfolios + AI = Exponential Wealth
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Each strategy feeds the next. Time does the rest.
                  </p>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="pt-4 space-y-3">
        <div className="flex gap-2">
          {currentSlide > 0 && (
            <Button
              variant="outline"
              size="lg"
              className="flex-shrink-0"
              onClick={() => setCurrentSlide(prev => prev - 1)}
            >
              Back
            </Button>
          )}
          <Button
            variant="premium"
            size="lg"
            className="flex-1"
            onClick={() => {
              if (isLast) {
                onComplete();
              } else {
                setCurrentSlide(prev => prev + 1);
              }
            }}
          >
            {isLast ? (
              <>
                Explore My Strategies
                <Rocket className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>

        {/* Skip option */}
        {!isLast && (
          <button
            onClick={onComplete}
            className="w-full text-center text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Skip and view strategies directly
          </button>
        )}

        <p className="text-[11px] text-muted-foreground text-center">
          {currentSlide + 1} of {ONBOARDING_SLIDES.length}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Copy Portfolio Risk Tiers
// ═══════════════════════════════════════════════════════════════════════════════

interface CopyPortfolioTier {
  id: string;
  name: string;
  targetReturn: string;
  riskLevel: number; // 1-5
  assets: string[];
  description: string;
  requiredTier: 'pro' | 'club';
}

const COPY_PORTFOLIO_TIERS: CopyPortfolioTier[] = [
  {
    id: 'conservative',
    name: 'Conservative',
    targetReturn: '10-30%',
    riskLevel: 2,
    assets: ['BTC', 'ETH', 'USDT Yield'],
    description: 'Blue-chip crypto focus with stablecoin yield buffer. Ideal for capital preservation with moderate growth.',
    requiredTier: 'pro',
  },
  {
    id: 'balanced',
    name: 'Balanced',
    targetReturn: '25-40%',
    riskLevel: 3,
    assets: ['BTC', 'ETH', 'SOL', 'LINK', 'AVAX'],
    description: 'Diversified allocation across top-20 assets with quarterly rebalancing. Best risk-adjusted returns.',
    requiredTier: 'pro',
  },
  {
    id: 'growth',
    name: 'Growth',
    targetReturn: '35-60%',
    riskLevel: 4,
    assets: ['ETH', 'SOL', 'AVAX', 'ARB', 'SUI', 'INJ'],
    description: 'Aggressive allocation targeting high-growth L1/L2 ecosystems. Higher volatility, higher potential.',
    requiredTier: 'club',
  },
];

function RiskDots({ level, max = 5 }: { level: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <CircleDot
          key={i}
          className={`w-3 h-3 ${i < level ? 'text-primary' : 'text-muted-foreground/20'}`}
        />
      ))}
    </div>
  );
}

export default function Strategies() {
  const navigate = useNavigate();
  const unlockState = useAppStore((s) => s.unlockState);
  const dcaPlans = useAppStore((s) => s.dcaPlans);
  const subscription = useAppStore((s) => s.subscription);
  const investorType = useAppStore((s) => s.investorType);
  const missionProgress = useAppStore((s) => s.missionProgress);
  const completeMissionTask = useAppStore((s) => s.completeMissionTask);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);

  // Show strategy onboarding if mission task not yet completed
  const showOnboarding = !missionProgress.m2_strategiesExplored;

  // Strategies fully unlocked after completing the strategy onboarding or the general onboarding
  const isStrategiesLocked = !hasCompletedOnboarding && !missionProgress.m2_strategiesExplored;

  // Show welcome/connect banner only before "Master the Apice Method" is done
  const showWelcomeBanner = !missionProgress.m2_methodologyRead;

  const strategies: StrategyCard[] = [
    {
      id: 'dca',
      title: 'DCA Accumulation',
      subtitle: 'Dollar-Cost Averaging',
      description: 'Build wealth systematically with automated recurring investments. Remove emotion, stay consistent.',
      icon: Calendar,
      iconGradient: 'from-blue-500 to-cyan-500',
      route: '/dca-planner',
      badge: dcaPlans.length > 0 ? `${dcaPlans.length} Active` : 'Get Started',
      badgeVariant: dcaPlans.length > 0 ? 'low' : 'recommended',
      features: ['AI-powered recommendations', 'Multi-asset allocation', 'Forever mode available', 'From $5/interval'],
      projection: 'Historical: BTC DCA 4yr = +138% avg return',
      isLocked: false,
      category: 'wealth-building',
    },
    {
      id: 'cashback',
      title: 'Cashback Machine',
      subtitle: 'BTC Income Engine',
      description: 'Turn every daily expense into Bitcoin. Earn 2-10% cashback on all purchases, building passive BTC income.',
      icon: CreditCard,
      iconGradient: 'from-amber-500 to-orange-500',
      route: '/cashback-onboarding',
      badge: 'New',
      badgeVariant: 'premium',
      features: ['2-10% cashback in BTC', '100% back on select subscriptions', 'Zero effort accumulation', 'Compounds over time'],
      projection: 'Avg $2,000/mo spend → ~$50-200/mo in BTC',
      isLocked: false,
      category: 'wealth-building',
    },
    {
      id: 'copy',
      title: 'Copy Portfolios',
      subtitle: 'Mirror Expert Strategies',
      description: 'Follow curated, risk-managed portfolios built by experienced traders. Your funds, their strategy.',
      icon: Copy,
      iconGradient: 'from-violet-500 to-purple-500',
      route: '/strategies/copy',
      badge: 'Pro',
      badgeVariant: 'premium',
      features: ['3 risk profiles available', 'Proportional position sizing', 'Stop anytime', 'Quarterly rebalancing'],
      projection: 'Target: 10-60% annual (varies by risk)',
      isLocked: !unlockState.copyPortfolios,
      lockMessage: 'Upgrade to Pro',
      category: 'wealth-building',
    },
    {
      id: 'explosive',
      title: 'Explosive List',
      subtitle: 'High-Momentum Picks',
      description: 'Curated watchlist of high-momentum altcoins with explosive growth potential. Updated weekly by our research team.',
      icon: Flame,
      iconGradient: 'from-orange-500 to-red-500',
      route: '/explosive-list',
      badge: 'Pro',
      badgeVariant: 'premium',
      features: ['Weekly updated picks', 'Momentum scoring', 'Entry/exit zones', 'Risk-rated selections'],
      projection: 'Top picks avg +45% in first 30 days (2024)',
      isLocked: !unlockState.explosiveList,
      lockMessage: 'Upgrade to Pro',
      category: 'wealth-building',
    },
    {
      id: 'ai-trade',
      title: 'AI Trade Setup',
      subtitle: 'Advanced AI-Powered Leverage',
      description: 'Harness artificial intelligence for strategic financial leverage. AI-optimized entries, risk-managed positions, and algorithmic execution that adapts to market conditions in real-time.',
      icon: Bot,
      iconGradient: 'from-emerald-500 to-green-500',
      route: '/ai-trade',
      badge: 'Featured',
      badgeVariant: 'recommended',
      features: ['5 automated strategies', 'Active risk protection', 'AI-powered signals (Claude)', 'Grid + Arb + Trend + MeanRev'],
      projection: 'Backtest: +568% over 75 months (Full Stack)',
      isLocked: false,
      category: 'automation',
    },
    {
      id: 'ai-bot',
      title: 'AI Bot Infrastructure',
      subtitle: 'Autonomous Trading Engine',
      description: 'Military-grade automated trading infrastructure. Reserved for selected Apice members with verified track record.',
      icon: Zap,
      iconGradient: 'from-rose-500 to-pink-500',
      route: '/strategies/ai-bot',
      badge: 'Invite Only',
      badgeVariant: 'high',
      features: ['Autonomous 24/7 execution', 'Institutional-grade algorithms', 'Private signal network', 'Dedicated risk engine'],
      isLocked: true,
      lockMessage: 'Application required — Selected members only',
      category: 'automation',
    },
  ];

  const wealthStrategies = strategies.filter(s => s.category === 'wealth-building');
  const automationStrategies = strategies.filter(s => s.category === 'automation');

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  // ── Strategy Onboarding Flow ──
  if (showOnboarding) {
    return (
      <StrategyOnboarding
        onComplete={() => completeMissionTask('m2_strategiesExplored')}
        investorType={investorType}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background px-5 py-6 pb-28 safe-top">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Compass className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Strategies</h1>
              <p className="text-muted-foreground text-xs">
                Wealth-building frameworks & automation
              </p>
            </div>
          </div>
        </motion.div>

        {/* Welcome Banner — disappears after Master the Apice Method */}
        {showWelcomeBanner && (
          <motion.div variants={itemVariants}>
            <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-indigo-500/10 border border-primary/20 space-y-3">
              <p className="text-sm font-semibold">Welcome to your Strategy Hub</p>
              <p className="text-xs text-muted-foreground">
                Complete "Master the Apice Method" in Mission 2 to understand how these strategies work together. Then connect your API to start executing.
              </p>
              <Button
                variant="premium"
                size="sm"
                onClick={() => navigate('/mission2/method')}
              >
                Start Mission 2
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Profile Context Banner */}
        {investorType && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <Target className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-primary">Personalized for {investorType}</p>
                <p className="text-[11px] text-muted-foreground">
                  Strategies ranked by relevance to your profile
                </p>
              </div>
              <Sparkles className="w-4 h-4 text-primary/60" />
            </div>
          </motion.div>
        )}

        {/* Wealth Building Strategies */}
        <motion.div variants={itemVariants}>
          <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Wealth Building
          </h2>
          <div className="space-y-3">
            {wealthStrategies.map((strategy, i) => (
              <StrategyCardComponent
                key={strategy.id}
                strategy={strategy}
                index={i}
                onNavigate={navigate}
                missionLocked={isStrategiesLocked}
              />
            ))}
          </div>
        </motion.div>

        {/* Copy Portfolio Tiers Expanded Section */}
        <motion.div variants={itemVariants}>
          <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <PieChart className="w-3.5 h-3.5" />
            Copy Portfolio Tiers
          </h2>
          <div className="space-y-3">
            {COPY_PORTFOLIO_TIERS.map((tier) => {
              const isTierLocked = tier.requiredTier === 'club'
                ? subscription.tier !== 'club'
                : subscription.tier === 'free';
              const tierLabel = tier.requiredTier === 'club' ? 'Club' : 'Pro';

              return (
                <Card
                  key={tier.id}
                  className={`overflow-hidden transition-all duration-300 ${
                    isTierLocked ? 'opacity-80' : 'hover:border-primary/20'
                  }`}
                >
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{tier.name}</h3>
                          {isTierLocked && (
                            <Badge variant="premium" size="sm" className="gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              {tierLabel}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{tier.description}</p>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="p-2.5 rounded-lg bg-secondary/50 text-center">
                        <p className="text-[11px] text-muted-foreground mb-0.5">Target Annual</p>
                        <p className="text-sm font-bold text-primary">{tier.targetReturn}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-secondary/50 text-center">
                        <p className="text-[11px] text-muted-foreground mb-0.5">Risk Level</p>
                        <div className="flex justify-center mt-0.5">
                          <RiskDots level={tier.riskLevel} />
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-secondary/50 text-center">
                        <p className="text-[11px] text-muted-foreground mb-0.5">Assets</p>
                        <p className="text-sm font-bold">{tier.assets.length}</p>
                      </div>
                    </div>

                    {/* Target assets */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {tier.assets.map((asset) => (
                        <span
                          key={asset}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                        >
                          {asset}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    {isTierLocked ? (
                      <Button
                        variant="premium"
                        size="sm"
                        className="w-full"
                        onClick={() => navigate('/settings')}
                      >
                        <Crown className="w-3 h-3 mr-1.5" />
                        Upgrade to {tierLabel} to Copy
                      </Button>
                    ) : (
                      <Button
                        variant="premium"
                        size="sm"
                        className="w-full"
                        onClick={() => navigate('/strategies/copy')}
                      >
                        Copy This Portfolio
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* Automation Strategies */}
        <motion.div variants={itemVariants}>
          <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Bot className="w-3.5 h-3.5" />
            AI & Automation
          </h2>
          <div className="space-y-3">
            {automationStrategies.map((strategy, i) => (
              <StrategyCardComponent
                key={strategy.id}
                strategy={strategy}
                index={i}
                onNavigate={navigate}
                missionLocked={isStrategiesLocked}
              />
            ))}
          </div>
        </motion.div>

        {/* Strategy Metrics */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-card to-card/80">
            <CardContent className="pt-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Strategy Principles
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <p className="text-2xl font-bold text-primary">94%</p>
                  <p className="text-[11px] text-muted-foreground">4yr BTC DCA = positive returns</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <p className="text-2xl font-bold text-primary">∞</p>
                  <p className="text-[11px] text-muted-foreground">Compounding never stops</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <p className="text-2xl font-bold text-primary">5+</p>
                  <p className="text-[11px] text-muted-foreground">Diversification strategies</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <p className="text-2xl font-bold text-primary">$5</p>
                  <p className="text-[11px] text-muted-foreground">Minimum to start</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Trust Message */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
            <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              Your funds remain on your exchange. No withdrawal access.
              You are always in control. Past performance ≠ future results.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function StrategyCardComponent({
  strategy,
  index,
  onNavigate,
  missionLocked,
}: {
  strategy: StrategyCard;
  index: number;
  onNavigate: (path: string) => void;
  missionLocked: boolean;
}) {
  // A strategy's action is blocked if the per-strategy lock is set OR the global mission gate is active
  const isActionBlocked = strategy.isLocked || missionLocked;

  const content = (
    <Card
      className="cursor-pointer hover:border-primary/20 transition-all duration-300 overflow-hidden group"
      onClick={() => !isActionBlocked && onNavigate(strategy.route)}
    >
      <CardContent className="pt-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${strategy.iconGradient} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform`}>
            <strategy.icon className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <h3 className="font-semibold text-sm leading-tight">{strategy.title}</h3>
                <p className="text-[11px] text-muted-foreground">{strategy.subtitle}</p>
              </div>
              {strategy.badge && (
                <Badge variant={strategy.badgeVariant || 'default'} size="sm" className="shrink-0">
                  {strategy.isLocked && <Lock className="w-2.5 h-2.5 mr-1" />}
                  {strategy.badge}
                </Badge>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {strategy.description}
            </p>

            {/* Features */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {strategy.features.slice(0, 3).map((feature, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* Projection */}
            {strategy.projection && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 mb-3">
                <TrendingUp className="w-3 h-3 text-primary shrink-0" />
                <p className="text-[11px] text-primary font-medium">{strategy.projection}</p>
              </div>
            )}

            {/* CTA — locked when mission incomplete or per-strategy lock */}
            {isActionBlocked ? (
              <Button variant="premium" size="sm" className="w-full opacity-60 cursor-not-allowed" disabled title={
                strategy.isLocked
                  ? (strategy.lockMessage || 'Upgrade to unlock')
                  : 'Complete Mission 2 to unlock'
              }>
                <Lock className="w-3 h-3 mr-1.5" />
                {strategy.isLocked ? 'Unlock with Pro' : 'Complete Mission 2 to unlock'}
              </Button>
            ) : (
              <Button variant="premium" size="sm" className="w-full">
                Explore Strategy
                <ArrowRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return content;
}
