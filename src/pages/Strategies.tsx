import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LockedOverlay } from '@/components/LockedOverlay';
import { useAppStore } from '@/store/appStore';
import { Progress } from '@/components/ui/progress';
import {
  Compass,
  Shield,
  Calendar,
  Bot,
  Copy,
  ChevronRight,
  CreditCard,
  TrendingUp,
  Zap,
  Sparkles,
  ArrowRight,
  Lock,
  BarChart3,
  Target,
  Infinity
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

export default function Strategies() {
  const navigate = useNavigate();
  const unlockState = useAppStore((s) => s.unlockState);
  const dcaPlans = useAppStore((s) => s.dcaPlans);
  const subscription = useAppStore((s) => s.subscription);
  const investorType = useAppStore((s) => s.investorType);
  const missionProgress = useAppStore((s) => s.missionProgress);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);

  // Mission 2 completion check — need methodology + Bybit account
  const isMission2Done = missionProgress.m2_methodologyRead && missionProgress.m2_bybitAccountCreated;
  const isStrategiesLocked = !hasCompletedOnboarding || !isMission2Done;

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
      id: 'ai-trade',
      title: 'AI Trade Setup',
      subtitle: 'Advanced AI-Powered Leverage',
      description: 'Harness artificial intelligence for strategic financial leverage. AI-optimized entries, risk-managed positions, and algorithmic execution that adapts to market conditions in real-time.',
      icon: Bot,
      iconGradient: 'from-emerald-500 to-green-500',
      route: '/strategies/ai-trade',
      badge: 'Featured',
      badgeVariant: 'recommended',
      features: ['AI-powered market analysis', 'Smart leverage optimization', 'Real-time risk management', 'Guided setup wizard'],
      projection: 'AI advantage: algorithmic precision + emotional discipline',
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

  // ─── LOCKED SCREEN: Mission 2 Required ───
  if (isStrategiesLocked) {
    const completedSteps = [
      hasCompletedOnboarding,
      missionProgress.m1_profileQuizDone,
      missionProgress.m2_methodologyRead,
      missionProgress.m2_bybitAccountCreated,
    ].filter(Boolean).length;
    const totalSteps = 4;
    const lockProgress = (completedSteps / totalSteps) * 100;

    return (
      <div className="min-h-screen bg-background px-5 py-6 pb-28 safe-top">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Strategies</h1>
              <p className="text-muted-foreground text-xs">Complete your missions to unlock</p>
            </div>
          </div>

          {/* Unlock Progress Card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="overflow-hidden border-primary/20">
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top, rgba(99,102,241,0.08), transparent 70%)' }} />
              <CardContent className="pt-6 pb-6 relative">
                <div className="flex flex-col items-center text-center gap-4">
                  <motion.div
                    animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center"
                  >
                    <Sparkles className="w-10 h-10 text-primary" />
                  </motion.div>
                  <div>
                    <h2 className="text-lg font-bold mb-1">Unlock Your Strategies</h2>
                    <p className="text-xs text-muted-foreground max-w-[280px]">
                      Complete Mission 2 — Master the Apice methodology and create your Bybit account to access all strategies.
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{completedSteps}/{totalSteps} steps completed</span>
                      <span>{Math.round(lockProgress)}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${lockProgress}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      />
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="w-full space-y-2 mt-2">
                    {[
                      { done: hasCompletedOnboarding, label: 'Complete onboarding', route: '/onboarding' },
                      { done: missionProgress.m1_profileQuizDone, label: 'Investor DNA analysis', route: '/onboarding' },
                      { done: missionProgress.m2_methodologyRead, label: 'Master the Apice Method', route: '/mission2/1' },
                      { done: missionProgress.m2_bybitAccountCreated, label: 'Create Bybit account', route: '/mission2/3' },
                    ].map((s, i) => (
                      <button
                        key={i}
                        onClick={() => !s.done && navigate(s.route)}
                        disabled={s.done}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          s.done
                            ? 'bg-green-500/5 border-green-500/20 opacity-60'
                            : 'bg-card border-primary/20 hover:border-primary/40 active:scale-[0.98]'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          s.done ? 'bg-green-500/20' : 'bg-primary/10'
                        }`}>
                          {s.done ? (
                            <ChevronRight className="w-3 h-3 text-green-400" />
                          ) : (
                            <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                          )}
                        </div>
                        <span className={`text-xs font-medium flex-1 ${s.done ? 'line-through text-muted-foreground' : ''}`}>
                          {s.label}
                        </span>
                        {!s.done && <ArrowRight className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    ))}
                  </div>

                  <Button variant="premium" className="w-full mt-2" onClick={() => {
                    if (!hasCompletedOnboarding) navigate('/onboarding');
                    else if (!missionProgress.m2_methodologyRead) navigate('/mission2/1');
                    else navigate('/mission2/3');
                  }}>
                    <Zap className="w-4 h-4 mr-1.5" />
                    Continue Mission
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Preview of locked strategies */}
          <div className="space-y-3 opacity-40 pointer-events-none">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Lock className="w-3 h-3" />
              Available After Unlock
            </h2>
            {strategies.slice(0, 3).map((strategy) => (
              <Card key={strategy.id} className="overflow-hidden">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${strategy.iconGradient} flex items-center justify-center shrink-0 opacity-50`}>
                      <strategy.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{strategy.title}</h3>
                      <p className="text-[10px] text-muted-foreground">{strategy.subtitle}</p>
                    </div>
                    <Lock className="w-4 h-4 text-muted-foreground ml-auto" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
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
              />
            ))}
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
                  <p className="text-[10px] text-muted-foreground">4yr BTC DCA = positive returns</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <p className="text-2xl font-bold text-primary">∞</p>
                  <p className="text-[10px] text-muted-foreground">Compounding never stops</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <p className="text-2xl font-bold text-primary">5+</p>
                  <p className="text-[10px] text-muted-foreground">Diversification strategies</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <p className="text-2xl font-bold text-primary">$5</p>
                  <p className="text-[10px] text-muted-foreground">Minimum to start</p>
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
  onNavigate
}: {
  strategy: StrategyCard;
  index: number;
  onNavigate: (path: string) => void;
}) {
  const content = (
    <Card
      className="cursor-pointer hover:border-primary/20 transition-all duration-300 overflow-hidden group"
      onClick={() => !strategy.isLocked && onNavigate(strategy.route)}
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
                  className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* Projection */}
            {strategy.projection && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 mb-3">
                <TrendingUp className="w-3 h-3 text-primary shrink-0" />
                <p className="text-[10px] text-primary font-medium">{strategy.projection}</p>
              </div>
            )}

            {/* CTA */}
            <Button variant="premium" size="sm" className="w-full">
              {strategy.isLocked ? 'Unlock with Pro' : 'Explore Strategy'}
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (strategy.isLocked) {
    return (
      <LockedOverlay
        isLocked={true}
        message={strategy.lockMessage || 'Upgrade to unlock'}
        onUnlock={() => onNavigate('/upgrade')}
      >
        {content}
      </LockedOverlay>
    );
  }

  return content;
}
