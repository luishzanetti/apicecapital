import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  TrendingUp, PieChart, BookOpen, Sparkles, Zap, Award, Settings2,
  Lock, Crown, ArrowRight, Target, Plus, BarChart3, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

// ── Utilities ──────────────────────────────────────────────────────────────────

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
      return language === 'pt' ? 'Portfolio' : 'Portfolio';
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

// ── Animation variants ─────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' },
  }),
};

// ── Section Header ─────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-3.5 h-3.5 text-muted-foreground/60" />
      <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
        {label}
      </span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate();
  const [showDepositConfirm, setShowDepositConfirm] = useState(false);
  const { t, language } = useTranslation();

  // Auto-execute due DCA plans on app load + every 5 min
  useAutoDCA();

  // ── Store selectors ────────────────────────────────────────────────────────
  const weeklyInvestment = useAppStore((s) => s.weeklyInvestment);
  const weeklyDepositHistory = useAppStore((s) => s.weeklyDepositHistory);
  const weeklyDepositStreak = useAppStore((s) => s.weeklyDepositStreak);
  const investorType = useAppStore((s) => s.investorType);
  const currentInsightIndex = useAppStore((s) => s.currentInsightIndex);
  const missionProgress = useAppStore((s) => s.missionProgress);
  const userProfile = useAppStore((state) => state.userProfile);
  const subscription = useAppStore((state) => state.subscription);
  const daysActive = useAppStore((state) => state.daysActive);
  const dcaPlans = useAppStore((s) => s.dcaPlans);

  // ── Derived state ──────────────────────────────────────────────────────────
  const isJourneyCompleted = useMemo(() => missionProgress.m5_advancedUnlocked, [missionProgress]);

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

  const isGamificationUnlocked = daysActive >= 3;
  const isMilestoneUnlocked = hasFirstDeposit;

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

  const lastUpdated = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // ── Quick Actions ──────────────────────────────────────────────────────────
  const quickActions = [
    { icon: BarChart3, label: 'Analysis', color: 'text-emerald-400', bg: 'bg-emerald-500/10', action: () => navigate('/analytics') },
    { icon: PieChart, label: 'Portfolio', color: 'text-blue-400', bg: 'bg-blue-500/10', action: () => navigate('/portfolio') },
    { icon: Plus, label: 'DCA', color: 'text-cyan-400', bg: 'bg-cyan-500/10', action: () => navigate('/dca-planner') },
    { icon: BookOpen, label: 'Learn', color: 'text-purple-400', bg: 'bg-purple-500/10', action: () => navigate('/learn') },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-28 scroll-smooth">
      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/[0.07] blur-[80px] animate-glow-pulse" />
        <div className="absolute -bottom-10 -left-20 w-48 h-48 rounded-full bg-accent/[0.05] blur-[60px] animate-glow-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full bg-purple-500/[0.04] blur-[50px] animate-glow-pulse" style={{ animationDelay: '3s' }} />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10">
        {/* ── Greeting Bar ────────────────────────────────────────────────── */}
        <motion.div
          className="px-5 pt-7 pb-2 flex items-center justify-between"
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
        >
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-bold">
              {t(getTimeGreetingKey())}, {userProfile?.name || investorType || 'Investor'}
            </h1>
            <span className="text-[11px] text-muted-foreground/60 capitalize hidden sm:inline">
              {todayDate}
            </span>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="w-9 h-9 rounded-xl glass-light flex items-center justify-center hover:bg-secondary/60 transition-all press-scale"
          >
            <Settings2 className="w-4 h-4 text-muted-foreground" />
          </button>
        </motion.div>

        {/* Mobile date (visible on small screens only) */}
        <motion.p
          className="px-5 text-[11px] text-muted-foreground/50 capitalize sm:hidden -mt-1 mb-3"
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
        >
          {todayDate}
        </motion.p>

        {/* ── Full-width Hero: Portfolio Board ──────────────────────────── */}
        <div className="px-4 md:px-6">
          <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}>
            <ExecutivePortfolioBoard />
          </motion.div>
        </div>

        {/* ── Desktop 2-Column / Mobile Single Column ─────────────────────── */}
        <div className="px-4 md:px-6 mt-5 xl:grid xl:grid-cols-3 xl:gap-6">

          {/* ── LEFT COLUMN (main content) ──────────────────────────────── */}
          <div className="xl:col-span-2 space-y-5">

            {/* Quick Actions — horizontal on desktop, 2x2 on mobile */}
            <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}>
              <SectionHeader icon={Zap} label="Quick Actions" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {quickActions.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="flex items-center gap-3 p-4 rounded-2xl glass-card border border-border/20 text-left hover:border-primary/20 transition-all press-scale hover-lift group min-h-[56px]"
                  >
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', item.bg)}>
                      <item.icon className={cn('w-5 h-5', item.color)} />
                    </div>
                    <span className="text-sm font-medium text-foreground/90 group-hover:text-foreground transition-colors">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Today's Context */}
            <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}>
              <SectionHeader icon={Sparkles} label="Today's Context" />
              <button
                onClick={() => navigate(getInsightRoute(todayInsight.type))}
                className="relative w-full rounded-2xl glass-card border border-border/20 p-4 text-left hover-lift transition-all group"
              >
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary/80">
                  <span className="rounded-full glass-light px-2 py-0.5 tracking-[0.12em] text-primary/90 text-[10px] font-semibold">
                    {getInsightTypeLabel(todayInsight.type, language)}
                  </span>
                </div>
                <h2 className="mt-3 text-sm font-bold text-foreground">{todayInsight.title}</h2>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">{todayInsight.content}</p>
                {todayInsight.recommendedAction && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-primary">
                    <span className="font-semibold">Action:</span>
                    <span>{todayInsight.recommendedAction}</span>
                  </div>
                )}
                <ArrowRight className="absolute top-4 right-4 w-4 h-4 text-muted-foreground/30 group-hover:text-primary/60 transition-colors" />
              </button>
            </motion.div>

            {/* Market Movers */}
            <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp}>
              <SectionHeader icon={TrendingUp} label="Market Movers" />
              <div className="rounded-2xl glass-card border border-border/20 overflow-hidden">
                <TopCoinsList />
              </div>
            </motion.div>

            {/* AI Insight */}
            <motion.div initial="hidden" animate="visible" custom={5} variants={fadeUp}>
              <SectionHeader icon={Sparkles} label="AI Insight" />
              <AiInsightCard />
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN (sidebar) ──────────────────────────────────── */}
          <div className="xl:col-span-1 space-y-5 mt-5 xl:mt-0">

            {/* DCA Status */}
            <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}>
              <SectionHeader icon={TrendingUp} label="DCA Automation" />
              <div className="rounded-2xl glass-card border border-border/20 overflow-hidden">
                <DCATracker />
              </div>
            </motion.div>

            {/* AI Portfolio Score */}
            <motion.div initial="hidden" animate="visible" custom={5} variants={fadeUp}>
              <SectionHeader icon={Sparkles} label="AI Portfolio Score" />
              <AiPortfolioScore />
            </motion.div>
          </div>
        </div>

        {/* ── Full-width: Apice Journey ────────────────────────────────── */}
        <div className="px-4 md:px-6 mt-5">
          <motion.div initial="hidden" animate="visible" custom={6} variants={fadeUp}>
            <SectionHeader icon={Target} label={isJourneyCompleted ? 'Your Journey' : 'Apice Journey'} />
            <SetupMissions />
          </motion.div>
        </div>

        {/* ── Full-width: Gamification ─────────────────────────────────── */}
        <div className="px-4 md:px-6 mt-5">
          <motion.div initial="hidden" animate="visible" custom={7} variants={fadeUp}>
            {isGamificationUnlocked ? (
              <>
                <SectionHeader icon={Award} label="Levels & Badges" />
                <GamificationWidget />
              </>
            ) : (
              <div className="p-4 rounded-2xl glass-light border border-border/20 flex items-center gap-3 opacity-60">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Levels & Badges</p>
                  <p className="text-xs text-muted-foreground">Use the app for 3 days to unlock</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Last Updated ────────────────────────────────────────────────── */}
        <motion.div
          className="px-5 mt-8 mb-4 flex items-center justify-center gap-1.5"
          initial="hidden"
          animate="visible"
          custom={7}
          variants={fadeUp}
        >
          <Clock className="w-3 h-3 text-muted-foreground/30" />
          <span className="text-[11px] text-muted-foreground/30">
            Last updated {lastUpdated}
          </span>
        </motion.div>
      </div>

      {/* ── Modals & Overlays ───────────────────────────────────────────────── */}
      <WeeklyDepositConfirm
        isOpen={showDepositConfirm}
        onClose={() => setShowDepositConfirm(false)}
      />

      {/* AI Advisor Chat FAB */}
      <AiAdvisorChat />
    </div>
  );
}
