import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import { dailyInsights, getReturnRateForInvestorType, getReturnLabel } from '@/data/sampleData';
import SetupMissions from '@/components/SetupMissions';
import InvestmentDashboard from '@/components/InvestmentDashboard';
import { GamificationWidget } from '@/components/GamificationWidget';
import { TopCoinsList } from '@/components/TopCoinsList';
import {
  TrendingUp, DollarSign, Flame, ChevronRight,
  PieChart, BookOpen, Sparkles, Zap, Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Get current ISO week ID
function getCurrentWeekId(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const weekNum = Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export default function Home() {
  const navigate = useNavigate();
  const weeklyInvestment = useAppStore((s) => s.weeklyInvestment);
  const weeklyDepositHistory = useAppStore((s) => s.weeklyDepositHistory);
  const weeklyDepositStreak = useAppStore((s) => s.weeklyDepositStreak);
  const investorType = useAppStore((s) => s.investorType);
  const currentInsightIndex = useAppStore((s) => s.currentInsightIndex);
  const missionProgress = useAppStore((s) => s.missionProgress);
  const isJourneyCompleted = useMemo(() => {
    return missionProgress.m5_advancedUnlocked; // Mission 5 last task
  }, [missionProgress]);

  const userProfile = useAppStore((state) => state.userProfile);
  const setupProgress = useAppStore((state) => state.setupProgress);
  const subscription = useAppStore((state) => state.subscription);
  const daysActive = useAppStore((state) => state.daysActive);
  const currentWeekId = getCurrentWeekId();
  const totalDeposited = weeklyDepositHistory.reduce((sum, d) => sum + d.amount, 0);

  // Dynamic return rate based on investor profile
  const annualRate = getReturnRateForInvestorType(investorType);
  const returnLabel = getReturnLabel(investorType);

  const todayInsight = dailyInsights[currentInsightIndex % dailyInsights.length];

  // Milestone progression
  const milestones = [
    { threshold: 0, label: 'Starter', icon: '🌱' },
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

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Header */}
      <div
        className="px-6 pt-8 pb-6 space-y-6"
        style={{
          background: 'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%)',
        }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Welcome back</p>
            <h1 className="text-xl font-bold">{investorType || 'Investor'}</h1>
          </div>
        </div>

        {/* Gamification Widget */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
        >
          <GamificationWidget />
        </motion.div>

        {/* Investment Dashboard (compact) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <InvestmentDashboard compact />
        </motion.div>

      </div>

      {/* Content */}
      <div className="px-6 space-y-4">
        {/* Setup Missions (if not completed) */}
        {!isJourneyCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <SetupMissions />
          </motion.div>
        )}

        {/* Next Milestone */}
        {nextMilestone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
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
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>${totalDeposited.toLocaleString()} invested</span>
                  <span>
                    {weeksToNext
                      ? `~${weeksToNext}w to ${nextMilestone.label}`
                      : `$${nextMilestone.threshold.toLocaleString()} to unlock`}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Market Movers */}
        <TopCoinsList />

        {/* Personalized Insight */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-none" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))' }}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Daily Insight</p>
                  <h3 className="text-sm font-semibold mb-1">{todayInsight.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{todayInsight.content}</p>
                  {todayInsight.recommendedAction && (
                    <p className="text-xs text-primary mt-2 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {todayInsight.recommendedAction}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                icon: DollarSign,
                label: 'Deposit',
                color: 'bg-green-500/10 text-green-500',
                action: () => navigate('/portfolio'),
              },
              {
                icon: PieChart,
                label: 'Portfolio',
                color: 'bg-blue-500/10 text-blue-500',
                action: () => navigate('/portfolio'),
              },
              {
                icon: BookOpen,
                label: 'Learn',
                color: 'bg-purple-500/10 text-purple-500',
                action: () => navigate('/learn'),
              },
              {
                icon: Award,
                label: 'Upgrade',
                color: 'bg-amber-500/10 text-amber-500',
                action: () => navigate('/upgrade'),
              },
            ].map((item, i) => (
              <button
                key={item.label}
                onClick={item.action}
                className="flex flex-col items-center gap-2 py-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-all active:scale-95"
              >
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', item.color)}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Completed Journey (at the end) */}
        {isJourneyCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="pt-8 pb-4"
          >
            <div className="flex items-center gap-2 mb-4 px-1">
              <Award className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Your Journey</h2>
            </div>
            <SetupMissions />
          </motion.div>
        )}
      </div>
    </div>
  );
}
