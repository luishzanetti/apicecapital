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

  return (
    <div className="min-h-screen bg-background px-5 py-6 pb-24 safe-top">
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
