import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/appStore';
import { dailyInsights, missionDefinitions } from '@/data/sampleData';
import type { MissionProgress } from '@/store/appStore';
import SetupMissions from '@/components/SetupMissions';
import { GamificationWidget } from '@/components/GamificationWidget';
import { TopCoinsList } from '@/components/TopCoinsList';
import { ExecutivePortfolioBoard } from '@/components/home/ExecutivePortfolioBoard';
import { DCATracker } from '@/components/portfolio/DCATracker';
import { useAutoDCA } from '@/hooks/useAutoDCA';
import { AiInsightCard } from '@/components/ai/AiInsightCard';
import { AiAdvisorChat } from '@/components/ai/AiAdvisorChat';
import { AiPortfolioScore } from '@/components/ai/AiPortfolioScore';
import { WeeklyDepositConfirm } from '@/components/WeeklyDepositConfirm';
import {
  TrendingUp, DollarSign, Flame, ChevronRight, ArrowRight,
  PieChart, BookOpen, Sparkles, Zap, Award, Settings2,
  Lock, Crown, GripVertical, X, Check, Target, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { MarketRegimeBadge, DailyBriefingCard, SmartAlertsList, SmartDCACard, BehavioralScoreCard, RebalanceAlertCard, WarChestCard, UpgradeRecommendation } from '@/components/intelligence';
import { useMarketIntelligence } from '@/hooks/useMarketIntelligence';
import { PortfolioTierSelector } from '@/components/portfolio/PortfolioTierSelector';

function getCurrentWeekId(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const weekNum = Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getTimeGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'home.goodMorning';
  if (hour < 18) return 'home.goodAfternoon';
  return 'home.goodEvening';
}

function getInsightTypeLabel(type: string, language: 'en' | 'pt') {
  switch (type) {
    case 'education':
      return language === 'pt' ? 'Aprendizado' : 'Learning';
    case 'portfolio':
      return language === 'pt' ? 'Portfólio' : 'Portfolio';
    case 'discipline':
      return language === 'pt' ? 'Disciplina' : 'Discipline';
    case 'market':
      return language === 'pt' ? 'Mercado' : 'Market';
    default:
      return 'Insight';
  }
}

function getInsightRoute(type: string) {
  switch (type) {
    case 'education':
      return '/learn';
    case 'portfolio':
      return '/portfolio';
    case 'discipline':
      return '/dca-planner';
    case 'market':
      return '/analytics';
    default:
      return '/learn';
  }
}

// Widget definitions — the system is ordered via appStore widgetOrder
type WidgetLock =
  | { lockType: null; premiumRequired: null }
  | { lockType: 'usage'; usageUnlockKey: 'hasFirstDeposit' | 'hasMinimumActivity'; premiumRequired: null }
  | { lockType: 'premium'; premiumRequired: 'pro' | 'club' };

type WidgetDef = {
  id: string;
  label: string;
  icon: string;
  description: string;
} & WidgetLock;

// Widget definitions use translation keys, resolved at render time via t()
const WIDGET_DEFINITIONS: WidgetDef[] = [
  {
    id: 'nextstep',
    label: 'widgets.nextStep',
    icon: '🎯',
    description: 'widgets.yourNextAction',
    lockType: null,
    premiumRequired: null,
  },
  {
    id: 'journey',
    label: 'widgets.apiceJourney',
    icon: '🗺️',
    description: 'widgets.missionProgress',
    lockType: null,
    premiumRequired: null,
  },
  {
    id: 'milestone',
    label: 'widgets.nextMilestone',
    icon: '🏆',
    description: 'widgets.investmentMilestone',
    lockType: 'usage' as const,
    usageUnlockKey: 'hasFirstDeposit',
    premiumRequired: null,
  },
  {
    id: 'market',
    label: 'widgets.marketMovers',
    icon: '📈',
    description: 'widgets.topCryptoPrices',
    lockType: null,
    premiumRequired: null,
  },
  {
    id: 'insight',
    label: 'widgets.dailyInsight',
    icon: '💡',
    description: 'widgets.personalizedInsight',
    lockType: null,
    premiumRequired: null,
  },
  {
    id: 'quickactions',
    label: 'widgets.quickActions',
    icon: '⚡',
    description: 'widgets.fastAccess',
    lockType: null,
    premiumRequired: null,
  },
  {
    id: 'gamification',
    label: 'widgets.levelsAndBadges',
    icon: '🎮',
    description: 'widgets.xpLevelBadges',
    lockType: 'usage' as const,
    usageUnlockKey: 'hasMinimumActivity',
    premiumRequired: null,
  },
  {
    id: 'intelligence',
    label: 'widgets.intelligence',
    icon: '🧠',
    description: 'widgets.marketRegimeAlerts',
    lockType: null,
    premiumRequired: null,
  },
  {
    id: 'war-chest',
    label: 'widgets.warChest',
    icon: '🛡️',
    description: 'widgets.capitalDeGuerra',
    lockType: null,
    premiumRequired: null,
  },
  {
    id: 'smart-dca',
    label: 'widgets.smartDCA',
    icon: '🎯',
    description: 'widgets.dynamicDCAStrategy',
    lockType: null,
    premiumRequired: null,
  },
  {
    id: 'behavioral-score',
    label: 'widgets.behavioralScore',
    icon: '📊',
    description: 'widgets.investorEvolution',
    lockType: null,
    premiumRequired: null,
  },
  {
    id: 'ai-score',
    label: 'widgets.aiPortfolioScore',
    icon: '🤖',
    description: 'widgets.aiAnalysis',
    lockType: null,
    premiumRequired: null,
  },
  {
    id: 'analytics',
    label: 'widgets.portfolioAnalytics',
    icon: '📊',
    description: 'widgets.advancedStats',
    lockType: 'premium' as const,
    premiumRequired: 'pro' as const,
  },
  {
    id: 'copytrading',
    label: 'widgets.copyTradingStatus',
    icon: '🤖',
    description: 'widgets.monitorCopy',
    lockType: 'premium' as const,
    premiumRequired: 'pro' as const,
  },
] as const;

function WidgetCustomizer({
  isOpen,
  onClose,
  widgetOrder,
  onOrderChange,
  daysActive,
  hasFirstDeposit,
  subscriptionTier,
  t,
}: {
  isOpen: boolean;
  onClose: () => void;
  widgetOrder: string[];
  onOrderChange: (order: string[]) => void;
  daysActive: number;
  hasFirstDeposit: boolean;
  subscriptionTier: string;
  t: (key: string) => string;
}) {
  const [order, setOrder] = useState(widgetOrder);

  const getWidgetStatus = (w: WidgetDef): 'available' | 'locked' | 'premium' => {
    if (w.lockType === 'premium') {
      if (subscriptionTier === 'free') return 'premium';
      return 'available';
    }
    if (w.lockType === 'usage') {
      const uk = w.usageUnlockKey;
      if (uk === 'hasFirstDeposit' && !hasFirstDeposit) return 'locked';
      if (uk === 'hasMinimumActivity' && daysActive < 3) return 'locked';
    }
    return 'available';
  };

  const move = (id: string, dir: 'up' | 'down') => {
    const idx = order.indexOf(id);
    if (idx < 0) return;
    const newOrder = [...order];
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newOrder.length) return;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    setOrder(newOrder);
  };

  const save = () => {
    onOrderChange(order);
    onClose();
  };

  const orderedWidgets = [...WIDGET_DEFINITIONS].sort(
    (a, b) => order.indexOf(a.id) - order.indexOf(b.id)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 glass-heavy rounded-t-3xl max-h-[80vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border/60" />
            </div>

            <div className="px-5 py-3 flex items-center justify-between border-b border-border/30">
              <div>
                <h2 className="font-bold text-base">{t('home.customizeWidgets')}</h2>
                <p className="text-xs text-muted-foreground">{t('home.reorderWidgets')}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto pb-24" style={{ maxHeight: 'calc(80vh - 100px)' }}>
              <div className="px-5 py-4 space-y-2">
                {orderedWidgets.map((w, i) => {
                  const status = getWidgetStatus(w);
                  return (
                    <div
                      key={w.id}
                      className={cn(
                        'flex items-center gap-3 p-3.5 rounded-xl border transition-all',
                        status === 'available' ? 'bg-secondary/40 border-border/40' :
                          status === 'locked' ? 'bg-secondary/20 border-border/20 opacity-60' :
                            'bg-amber-500/5 border-amber-500/20 opacity-70'
                      )}
                    >
                      <span className="text-xl shrink-0">{w.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{t(w.label)}</p>
                        <p className="text-[11px] text-muted-foreground">{t(w.description)}</p>
                        {status === 'locked' && (
                          <p className="text-[11px] text-orange-400 mt-0.5 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            {w.lockType === 'usage' && w.usageUnlockKey === 'hasFirstDeposit'
                              ? t('home.unlockAfterDeposit')
                              : t('home.unlockAfterDays')}
                          </p>
                        )}
                        {status === 'premium' && (
                          <p className="text-[11px] text-amber-400 mt-0.5 flex items-center gap-1">
                            <Crown className="w-2.5 h-2.5" />
                            {t('home.proClubOnly')}
                          </p>
                        )}
                      </div>
                      {status === 'available' && (
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            onClick={() => move(w.id, 'up')}
                            disabled={i === 0}
                            className="w-6 h-6 rounded bg-border/30 flex items-center justify-center disabled:opacity-30 hover:bg-primary/20 transition-colors"
                          >
                            <span className="text-[11px]">↑</span>
                          </button>
                          <button
                            onClick={() => move(w.id, 'down')}
                            disabled={i === orderedWidgets.length - 1}
                            className="w-6 h-6 rounded bg-border/30 flex items-center justify-center disabled:opacity-30 hover:bg-primary/20 transition-colors"
                          >
                            <span className="text-[11px]">↓</span>
                          </button>
                        </div>
                      )}
                      {status === 'locked' && <Lock className="w-4 h-4 text-orange-400/60 shrink-0" />}
                      {status === 'premium' && <Crown className="w-4 h-4 text-amber-400/60 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 glass-heavy border-t border-border/20">
              <Button variant="premium" size="lg" className="w-full" onClick={save}>
                <Check className="w-4 h-4 mr-1.5" />
                {t('common.saveLayout')}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [showDepositConfirm, setShowDepositConfirm] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const { t, language } = useTranslation();

  // Auto-execute due DCA plans on app load + every 5 min
  useAutoDCA();

  const weeklyInvestment = useAppStore((s) => s.weeklyInvestment);
  const weeklyDepositHistory = useAppStore((s) => s.weeklyDepositHistory);
  const weeklyDepositStreak = useAppStore((s) => s.weeklyDepositStreak);
  const investorType = useAppStore((s) => s.investorType);
  const currentInsightIndex = useAppStore((s) => s.currentInsightIndex);
  const missionProgress = useAppStore((s) => s.missionProgress);
  const userProfile = useAppStore((state) => state.userProfile);
  const subscription = useAppStore((state) => state.subscription);
  const daysActive = useAppStore((state) => state.daysActive);
  const widgetOrder = useAppStore((s) => s.widgetOrder);
  const updateWidgetOrder = useAppStore((s) => s.updateWidgetOrder);
  const dcaPlans = useAppStore((s) => s.dcaPlans);

  const isJourneyCompleted = useMemo(() => missionProgress.m5_advancedUnlocked, [missionProgress]);

  // Gate advanced widgets: user needs at least 1 active DCA plan OR mission 4 completed
  const hasActiveDCA = dcaPlans.some((p) => p.isActive);
  const isMission4Complete = missionProgress.m4_weeklyPlanSet && missionProgress.m4_firstDepositConfirmed && missionProgress.m4_allocationExecuted;
  const showAdvancedWidgets = hasActiveDCA || isMission4Complete;

  const currentWeekId = getCurrentWeekId();
  const totalDeposited = weeklyDepositHistory.reduce((sum, d) => sum + d.amount, 0);
  const hasFirstDeposit = weeklyDepositHistory.length > 0;
  const todayInsight = dailyInsights[currentInsightIndex % dailyInsights.length];
  const dateLocale = language === 'pt' ? 'pt-BR' : language === 'es' ? 'es' : 'en-US';
  const todayDate = new Intl.DateTimeFormat(dateLocale, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date());

  const milestones = [
    { threshold: 0, label: 'Start', icon: '🌱' },
    { threshold: 500, label: 'Builder', icon: '🔨' },
    { threshold: 2000, label: 'Optimizer', icon: '⚡' },
    { threshold: 5000, label: 'Pro', icon: '🚀' },
    { threshold: 10000, label: 'Elite', icon: '💎' },
  ];
  const currentMilestone = [...milestones].reverse().find(m => totalDeposited >= m.threshold) || milestones[0];
  const nextMilestone = milestones.find(m => m.threshold > totalDeposited);
  const milestoneProgress = nextMilestone
    ? ((totalDeposited - currentMilestone.threshold) / (nextMilestone.threshold - currentMilestone.threshold)) * 100
    : 100;
  const weeksToNext = nextMilestone && weeklyInvestment > 0
    ? Math.ceil((nextMilestone.threshold - totalDeposited) / weeklyInvestment)
    : null;

  // Check unlock conditions
  const isGamificationUnlocked = daysActive >= 3;
  const isMilestoneUnlocked = hasFirstDeposit;

  // Calculate next step from journey
  const nextStep = useMemo(() => {
    for (const mission of missionDefinitions) {
      for (const task of mission.tasks) {
        const key = task.storeKey as keyof MissionProgress;
        if (!missionProgress[key]) {
          return { mission, task };
        }
      }
    }
    return null;
  }, [missionProgress]);

  // Render widget by ID
  const renderWidget = (widgetId: string, idx: number) => {
    switch (widgetId) {
      case 'journey':
        if (isJourneyCompleted) return null; // show below main content instead
        return (
          <motion.div key="journey" id="apice-journey" className="md:col-span-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
            <SetupMissions />
          </motion.div>
        );

      case 'milestone':
        if (!nextMilestone) return null;
        if (!isMilestoneUnlocked) {
          return (
            <motion.div key="milestone" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
              <div className="p-4 rounded-2xl glass-light flex items-center gap-3 opacity-60">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">{t('home.milestoneTracker')}</p>
                  <p className="text-xs text-muted-foreground">{t('home.makeFirstDeposit')}</p>
                </div>
              </div>
            </motion.div>
          );
        }
        return (
          <motion.div key="milestone" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
            <Card className="overflow-hidden">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{currentMilestone.icon}</span>
                    <span className="text-sm font-semibold">{currentMilestone.label}</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-lg">{nextMilestone.icon}</span>
                    <span className="text-sm font-semibold text-muted-foreground">{nextMilestone.label}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-2">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                    animate={{ width: `${Math.min(milestoneProgress, 100)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>${totalDeposited.toLocaleString()} {t('home.invested')}</span>
                  <span>{weeksToNext ? t('home.weeksTo').replace('{weeks}', String(weeksToNext)).replace('{milestone}', nextMilestone.label) : t('home.goal').replace('{amount}', nextMilestone.threshold.toLocaleString())}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'balance':
        // The executive portfolio board is always shown in the hero section above
        return null;

      case 'dca':
        // DCA is now rendered separately below the widget grid
        return null;

      case 'intelligence':
        return (
          <motion.div key="intelligence" className="md:col-span-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
            <div className="space-y-3">
              <DailyBriefingCard />
              <UpgradeRecommendation />
              <SmartAlertsList maxAlerts={3} compact />
              <RebalanceAlertCard />
            </div>
          </motion.div>
        );

      case 'war-chest':
        return (
          <motion.div key="war-chest" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
            <WarChestCard />
          </motion.div>
        );

      case 'smart-dca':
        return (
          <motion.div key="smart-dca" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
            <SmartDCACard />
          </motion.div>
        );

      case 'behavioral-score':
        return (
          <motion.div key="behavioral-score" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
            <BehavioralScoreCard />
          </motion.div>
        );

      case 'ai-score':
        return (
          <motion.div key="ai-score" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
            <AiPortfolioScore />
          </motion.div>
        );

      case 'market':
        return (
          <motion.div key="market" className="md:col-span-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
            <TopCoinsList />
          </motion.div>
        );

      case 'insight':
        return (
          <motion.div key="insight" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
            <AiInsightCard />
          </motion.div>
        );

      case 'nextstep':
        if (!nextStep || isJourneyCompleted) return null;
        return (
          <motion.div key="nextstep" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
            <button
              onClick={() => nextStep.task.actionRoute && navigate(nextStep.task.actionRoute)}
              className="w-full p-4 rounded-2xl glass-card border-glow-blue text-left group hover-lift press-scale"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] text-primary font-semibold uppercase tracking-wider">{t('home.nextStep')}</span>
                <span className="text-[11px] text-muted-foreground/60 ml-auto">{t('home.mission')} {nextStep.mission.id}</span>
              </div>
              <h3 className="text-sm font-bold mb-1">{nextStep.task.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{nextStep.task.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  +{nextStep.task.xp} XP
                </span>
                <span className="text-xs font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                  {nextStep.task.actionLabel}
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          </motion.div>
        );

      case 'quickactions':
        return (
          <motion.div key="quickactions" className="md:col-span-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
            <div className="grid grid-cols-5 gap-3">
              {[
                { icon: Sparkles, label: t('home.quickActions.analysis'), color: 'bg-green-500/10 text-green-500', action: () => navigate('/analytics') },
                { icon: PieChart, label: t('home.quickActions.portfolio'), color: 'bg-blue-500/10 text-blue-500', action: () => navigate('/portfolio') },
                { icon: Plus, label: t('home.quickActions.dca'), color: 'bg-cyan-500/10 text-cyan-500', action: () => navigate('/dca-planner') },
                { icon: BookOpen, label: t('home.quickActions.learn'), color: 'bg-purple-500/10 text-purple-500', action: () => navigate('/learn') },
                { icon: Award, label: t('home.quickActions.upgrade'), color: 'bg-amber-500/10 text-amber-500', action: () => navigate('/upgrade') },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="flex flex-col items-center gap-2 py-3 rounded-xl glass-light hover:border-primary/20 transition-all press-scale hover-lift"
                >
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', item.color)}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 'gamification':
        if (!isGamificationUnlocked) {
          return (
            <motion.div key="gamification" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
              <div className="p-4 rounded-2xl glass-light flex items-center gap-3 opacity-60">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">{t('home.levelsAndBadges')}</p>
                  <p className="text-xs text-muted-foreground">{t('home.useAppForDays')}</p>
                </div>
              </div>
            </motion.div>
          );
        }
        return (
          <motion.div key="gamification" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
            <GamificationWidget />
          </motion.div>
        );

      case 'analytics':
        if (!showAdvancedWidgets) return null;
        if (subscription.tier === 'free') {
          return (
            <motion.div key="analytics" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
              <div className="p-4 rounded-2xl glass-light border-glow-gold flex items-center gap-3">
                <Crown className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-300">{t('home.portfolioAnalytics')}</p>
                  <p className="text-xs text-muted-foreground">{t('home.upgradeToProAnalytics')}</p>
                </div>
                <Button variant="premium" size="sm" onClick={() => navigate('/upgrade')}>Pro</Button>
              </div>
            </motion.div>
          );
        }
        return null;

      case 'copytrading':
        if (!showAdvancedWidgets) return null;
        if (subscription.tier === 'free') {
          return (
            <motion.div key="copytrading" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
              <div className="p-4 rounded-2xl glass-light border-glow-gold flex items-center gap-3">
                <Crown className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-300">{t('home.copyTrading')}</p>
                  <p className="text-xs text-muted-foreground">{t('home.upgradeToCopyTraders')}</p>
                </div>
                <Button variant="premium" size="sm" onClick={() => navigate('/upgrade')}>Pro</Button>
              </div>
            </motion.div>
          );
        }
        return null;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Hero Header — Mesh gradient background */}
      <div
        className="relative px-6 pt-8 pb-6 space-y-4 overflow-hidden"
      >
        {/* Ambient background orbs */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/[0.07] blur-[80px] animate-glow-pulse" />
          <div className="absolute -bottom-10 -left-20 w-48 h-48 rounded-full bg-accent/[0.05] blur-[60px] animate-glow-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full bg-purple-500/[0.04] blur-[50px] animate-glow-pulse" style={{ animationDelay: '3s' }} />
        </div>

        {/* Top bar */}
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{t(getTimeGreetingKey())}, {investorType || t('common.investor')}!</p>
            <h1 className="text-xl font-bold">{t('home.yourDashboard')}</h1>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-[11px] capitalize text-muted-foreground/80">{todayDate}</p>
              <MarketRegimeBadge size="sm" />
            </div>
          </div>
          <button
            onClick={() => setShowCustomizer(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-light hover:bg-secondary/60 transition-all text-xs font-medium text-muted-foreground press-scale"
          >
            <Settings2 className="w-3.5 h-3.5" />
            {t('home.widgets')}
          </button>
        </div>

        {/* Executive portfolio board (always first in the hero) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <ExecutivePortfolioBoard />
        </motion.div>

        {/* Daily insight card — glass style */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          onClick={() => navigate(getInsightRoute(todayInsight.type))}
          className="relative w-full rounded-2xl glass-card border-glow-blue p-4 text-left hover-lift"
        >
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary/80">
            <span>{t('home.todaysContext')}</span>
            <span className="rounded-full glass-light px-2 py-0.5 tracking-[0.12em] text-primary/90 text-[10px] font-semibold">
              {getInsightTypeLabel(todayInsight.type, language)}
            </span>
          </div>
          <h2 className="mt-3 text-sm font-bold text-foreground">{todayInsight.title}</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{todayInsight.content}</p>
          {todayInsight.recommendedAction && (
            <div className="mt-3 flex items-center gap-2 text-xs text-primary">
              <span className="font-semibold">{t('home.recommendedAction')}:</span>
              <span>{todayInsight.recommendedAction}</span>
            </div>
          )}
        </motion.button>
      </div>

      {/* Widget Grid — Bento layout */}
      <div className="px-6 space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
        <p className="text-[11px] text-muted-foreground/40 text-center mb-2 md:col-span-2">
          {t('common.lastUpdated')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        {widgetOrder.map((widgetId, idx) => renderWidget(widgetId, idx))}

        {/* Completed Journey (at the very end) */}
        {isJourneyCompleted && (
          <div className="md:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="pt-4"
          >
            <div className="flex items-center gap-2 mb-4 px-1">
              <Award className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">{t('home.yourJourney')}</h2>
            </div>
            <SetupMissions />
          </motion.div>
          </div>
        )}
      </div>

      {/* DCA Automation Tracker — below main widgets */}
      <div className="px-6 mt-4">
        <DCATracker />
      </div>

      {/* Widget Customizer Sheet */}
      <WidgetCustomizer
        isOpen={showCustomizer}
        onClose={() => setShowCustomizer(false)}
        widgetOrder={widgetOrder}
        onOrderChange={updateWidgetOrder}
        daysActive={daysActive}
        hasFirstDeposit={hasFirstDeposit}
        subscriptionTier={subscription.tier}
        t={t}
      />

      {/* Deposit Confirm Modal */}
      <WeeklyDepositConfirm
        isOpen={showDepositConfirm}
        onClose={() => setShowDepositConfirm(false)}
      />

      {/* AI Advisor Chat FAB */}
      <AiAdvisorChat />
    </div>
  );
}
