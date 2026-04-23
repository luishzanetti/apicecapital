import { useEffect, useMemo } from 'react';
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
import { SmartReportWidget } from '@/components/home/SmartReportWidget';
import { MarketPulseWidget } from '@/components/home/MarketPulseWidget';
import { useAutoDCA } from '@/hooks/useAutoDCA';
import { AiInsightCard } from '@/components/ai/AiInsightCard';
import { AiAdvisorChat } from '@/components/ai/AiAdvisorChat';
import { AiPortfolioScore } from '@/components/ai/AiPortfolioScore';
import { ExplosivePicksWidget } from '@/components/home/ExplosivePicksWidget';
import { InsufficientFundsAlert } from '@/components/balance/InsufficientFundsAlert';
import { AcademyHomeWidget } from '@/components/academy/AcademyHomeWidget';
// EarnSuggestionCard removed — not relevant for the app
import {
  TrendingUp, PieChart, BookOpen, Sparkles, Zap, Award, Settings2,
  Lock, ArrowRight, Target, Plus, BarChart3, Clock, AlertTriangle
} from 'lucide-react';
import { isSupabaseConfigured } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// ── Utilities ──────────────────────────────────────────────────────────────────

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

function SectionHeader({ icon: Icon, label, action }: { icon: React.ComponentType<{ className?: string }>; label: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-3.5 h-3.5 text-muted-foreground/60" />
      <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
        {label}
      </span>
      {action && (
        <>
          <span className="flex-1" />
          <button
            onClick={action.onClick}
            className="text-[11px] text-primary font-semibold hover:text-primary/80 transition-colors"
          >
            {action.label}
          </button>
        </>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  // Auto-execute due DCA plans on app load + every 5 min
  useAutoDCA();

  // Refresh balances/alerts on Home mount so the InsufficientFundsAlert banner
  // reflects current Bybit state without waiting on the nightly cron.
  const refreshBalances = useAppStore((s) => s.refreshBalances);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void refreshBalances();
  }, [refreshBalances]);

  // ── Store selectors (scalar — avoids re-renders on unrelated field changes) ─
  const investorType = useAppStore((s) => s.investorType);
  const currentInsightIndex = useAppStore((s) => s.currentInsightIndex);
  const missionProgress = useAppStore((s) => s.missionProgress);
  const userProfile = useAppStore((state) => state.userProfile);
  const daysActive = useAppStore((state) => state.daysActive);
  const isJourneyCompleted = useAppStore((s) => s.missionProgress.m5_advancedUnlocked);

  const todayInsight = dailyInsights[currentInsightIndex % dailyInsights.length];
  const dateLocale = language === 'pt' ? 'pt-BR' : language === 'es' ? 'es' : 'en-US';
  const todayDate = new Intl.DateTimeFormat(dateLocale, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date());

  const isGamificationUnlocked = daysActive >= 3;

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

  // Stabilized at mount — avoids recomputing on every render. Not a live
  // clock (use a state + interval if live ticking is ever needed).
  const lastUpdated = useMemo(
    () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    [],
  );

  // ── Quick Actions — emerald signature per brand, mapped by expert accent color ────
  const quickActions = [
    { icon: BarChart3, label: 'Analysis', color: 'text-[hsl(var(--apice-emerald))]', bg: 'bg-[hsl(var(--apice-emerald))]/10', action: () => navigate('/analytics') },
    { icon: PieChart, label: 'Portfolio', color: 'text-sky-400', bg: 'bg-sky-500/10', action: () => navigate('/portfolio') },
    { icon: Plus, label: 'DCA', color: 'text-[hsl(var(--apice-emerald))]', bg: 'bg-[hsl(var(--apice-emerald))]/10', action: () => navigate('/dca-planner') },
    { icon: BookOpen, label: 'Learn', color: 'text-amber-400', bg: 'bg-amber-500/10', action: () => navigate('/learn') },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-28 scroll-smooth">
      {/* Ambient background orbs — emerald signature per brand */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="animate-glow-pulse absolute -right-20 -top-20 h-60 w-60 rounded-full blur-[80px]"
          style={{ background: 'hsl(var(--apice-emerald) / 0.08)' }}
        />
        <div
          className="animate-glow-pulse absolute -bottom-10 -left-20 h-48 w-48 rounded-full blur-[60px]"
          style={{
            animationDelay: '1.5s',
            background: 'hsl(var(--apice-blue-glow) / 0.06)',
          }}
        />
        <div
          className="animate-glow-pulse absolute right-1/4 top-1/2 h-32 w-32 rounded-full blur-[50px]"
          style={{
            animationDelay: '3s',
            background: 'hsl(var(--apice-gold) / 0.04)',
          }}
        />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10">
        {/* ── Demo Mode Banner ───────────────────────────────────────────── */}
        {!isSupabaseConfigured && (
          <div className="mx-4 md:mx-6 lg:mx-8 xl:mx-10 mt-2 lg:mt-0 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300">
              Running in demo mode — connect Supabase for real data.
            </p>
          </div>
        )}

        {/* ── Insufficient Funds Alert (critical / blocked) ─────────────── */}
        <div className="px-4 md:px-6 lg:px-8 xl:px-10 pt-2 lg:pt-0 empty:hidden">
          <ErrorBoundary fallback={null}>
            <InsufficientFundsAlert />
          </ErrorBoundary>
        </div>

        {/* ── Greeting Bar — single line, responsive, EN-first ──────────── */}
        <motion.div
          className="px-4 md:px-6 lg:px-8 xl:px-10 pt-3 lg:pt-6 pb-4 flex items-center justify-between gap-4"
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
        >
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl md:text-2xl font-semibold tracking-tight text-white truncate">
              {t(getTimeGreetingKey())},{' '}
              <span className="text-white/80">
                {userProfile?.name || investorType || 'Investor'}
              </span>
            </h1>
            <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-white/40 capitalize">
              {todayDate}
            </p>
          </div>
          <button
            type="button"
            aria-label="Open settings"
            onClick={() => navigate('/settings')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur transition-all hover:border-white/20 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1626]"
          >
            <Settings2 className="h-4 w-4 text-white/70" aria-hidden="true" />
          </button>
        </motion.div>

        {/* ── Full-width single-column layout · every widget spans the full available width ── */}
        <div className="px-4 md:px-6 lg:px-8 xl:px-10 space-y-6 lg:space-y-7">

          {/* Hero: Portfolio Board */}
          <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}>
            <ErrorBoundary fallback={<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">Portfolio data unavailable</div>}>
              <ExecutivePortfolioBoard />
            </ErrorBoundary>
          </motion.div>

          {/* Widgets stack full-width in sequence */}
          <div className="space-y-5 lg:space-y-6">

            {/* Quick Actions — horizontal on desktop, 2x2 on mobile */}
            <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}>
              <SectionHeader icon={Zap} label="Quick Actions" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {quickActions.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="group flex min-h-[56px] items-center gap-3 rounded-2xl bg-white/[0.03] p-4 text-left backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/[0.06] hover:shadow-[0_10px_30px_-12px_hsl(var(--apice-emerald)/0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1626] active:scale-[0.98]"
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

            {/* Apice Academy — compact progress + continue lesson CTA */}
            <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}>
              <SectionHeader icon={BookOpen} label="Apice Academy" action={{ label: 'View Academy', onClick: () => navigate('/learn') }} />
              <ErrorBoundary fallback={<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">Academy unavailable</div>}>
                <AcademyHomeWidget />
              </ErrorBoundary>
            </motion.div>

            {/* Smart Report v2.0 — strategy breakdown · short/medium/long-term */}
            <motion.div initial="hidden" animate="visible" custom={3.5} variants={fadeUp}>
              <ErrorBoundary fallback={<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">Smart report unavailable</div>}>
                <SmartReportWidget />
              </ErrorBoundary>
            </motion.div>

            {/* Explosive Picks AI Widget */}
            <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp}>
              <ErrorBoundary fallback={<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">Explosive picks unavailable</div>}>
                <ExplosivePicksWidget />
              </ErrorBoundary>
            </motion.div>

            {/* Today's Context */}
            <motion.div initial="hidden" animate="visible" custom={5} variants={fadeUp}>
              <SectionHeader icon={Sparkles} label="Today's Context" />
              <button
                onClick={() => navigate(getInsightRoute(todayInsight.type))}
                className="relative w-full rounded-2xl glass-card p-4 text-left hover-lift transition-all group"
              >
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary/80">
                  <span className="rounded-full glass-light px-2 py-0.5 tracking-[0.12em] text-primary/90 text-xs font-semibold">
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
            <motion.div initial="hidden" animate="visible" custom={5} variants={fadeUp}>
              <SectionHeader icon={TrendingUp} label="Market Movers" action={{ label: 'View All', onClick: () => navigate('/explosive-list') }} />
              <ErrorBoundary fallback={<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">Market data unavailable</div>}>
                <div className="rounded-2xl glass-card overflow-hidden">
                  <TopCoinsList />
                </div>
              </ErrorBoundary>
            </motion.div>

            {/* AI Insight */}
            <motion.div initial="hidden" animate="visible" custom={6} variants={fadeUp}>
              <SectionHeader icon={Sparkles} label="AI Insight" />
              <AiInsightCard />
            </motion.div>
          </div>

          {/* DCA Automation · full width */}
          <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp}>
            <SectionHeader icon={TrendingUp} label="DCA Automation" />
            <div className="rounded-2xl glass-card overflow-hidden">
              <DCATracker />
            </div>
          </motion.div>

          {/* Market Pulse · full width */}
          <motion.div initial="hidden" animate="visible" custom={5} variants={fadeUp}>
            <SectionHeader icon={Sparkles} label="Market Pulse" />
            <ErrorBoundary fallback={<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">Market pulse unavailable</div>}>
              <MarketPulseWidget />
            </ErrorBoundary>
          </motion.div>

          {/* AI Portfolio Score · full width */}
          <motion.div initial="hidden" animate="visible" custom={6} variants={fadeUp}>
            <SectionHeader icon={Sparkles} label="AI Portfolio Score" />
            <AiPortfolioScore />
          </motion.div>
        </div>

        {/* ── Apice Journey · full width ──────────────────────────────── */}
        <div className="px-4 md:px-6 lg:px-8 xl:px-10 mt-6 lg:mt-7">
          <motion.div initial="hidden" animate="visible" custom={7} variants={fadeUp}>
            <SectionHeader icon={Target} label={isJourneyCompleted ? 'Your Journey' : 'Apice Journey'} />
            <SetupMissions />
          </motion.div>
        </div>

        {/* ── Gamification · full width ──────────────────────────────── */}
        <div className="px-4 md:px-6 lg:px-8 xl:px-10 mt-6 lg:mt-7">
          <motion.div initial="hidden" animate="visible" custom={8} variants={fadeUp}>
            {isGamificationUnlocked ? (
              <>
                <SectionHeader icon={Award} label="Levels & Badges" />
                <GamificationWidget />
              </>
            ) : (
              <div className="p-4 rounded-2xl glass-light flex items-center gap-3 opacity-60">
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

      {/* AI Advisor Chat FAB */}
      <AiAdvisorChat />
    </div>
  );
}
