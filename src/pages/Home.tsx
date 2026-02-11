import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ProgressRing } from '@/components/ProgressRing';
import { useAppStore, recommendedPath } from '@/store/appStore';
import {
  ArrowRight,
  ArrowUpRight,
  Brain,
  ChevronRight,
  Crown,
  ExternalLink,
  Flame,
  Lightbulb,
  PieChart,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { dailyInsights, referralLinks } from '@/data/sampleData';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function Home() {
  const navigate = useNavigate();
  const investorType = useAppStore((s) => s.investorType);
  const setupProgressPercent = useAppStore((s) => s.setupProgressPercent);
  const setupProgress = useAppStore((s) => s.setupProgress);
  const subscription = useAppStore((s) => s.subscription);
  const trackLinkClick = useAppStore((s) => s.trackLinkClick);
  const currentInsightIndex = useAppStore((s) => s.currentInsightIndex);
  const dcaPlans = useAppStore((s) => s.dcaPlans);
  const dcaGamification = useAppStore((s) => s.dcaGamification);
  const learnProgress = useAppStore((s) => s.learnProgress);
  const daysActive = useAppStore((s) => s.daysActive);
  const selectedPortfolio = useAppStore((s) => s.selectedPortfolio);

  const recommended = investorType ? recommendedPath[investorType] : 'balanced';
  const todayInsight = dailyInsights[currentInsightIndex % dailyInsights.length];

  const activePlans = dcaPlans.filter((p) => p.isActive).length;
  const totalCommitted = dcaGamification.totalAmountCommitted;
  const streak = dcaGamification.dcaStreak;
  const lessonsCompleted = learnProgress.completedLessons.length;

  // Context-aware primary CTA
  const getPrimaryCTA = () => {
    if (!setupProgress.exchangeAccountCreated) {
      return {
        label: 'Create Exchange Account',
        icon: ExternalLink,
        action: () => {
          const bybitLink = referralLinks.find((l) => l.id === 'bybit');
          if (bybitLink) {
            trackLinkClick('bybit');
            window.open(bybitLink.url, '_blank');
          }
        },
      };
    }
    if (!setupProgress.corePortfolioSelected) {
      return { label: 'Choose Portfolio', icon: PieChart, action: () => navigate('/portfolio') };
    }
    if (!setupProgress.dcaPlanConfigured) {
      return { label: 'Set DCA Plan', icon: Zap, action: () => navigate('/strategies') };
    }
    return { label: "View Insight", icon: Lightbulb, action: () => navigate('/insights') };
  };
  const primaryCTA = getPrimaryCTA();

  const insightTypeIcon: Record<string, typeof TrendingUp> = {
    market: TrendingUp,
    portfolio: PieChart,
    education: Lightbulb,
    discipline: Target,
  };
  const InsightIcon = insightTypeIcon[todayInsight.type] || Lightbulb;

  return (
    <div className="min-h-screen bg-background px-5 py-6 pb-24 safe-top">
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
        {/* ── Header ── */}
        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-micro">Welcome back</p>
            <h1 className="text-headline font-bold tracking-tight">
              {investorType || 'Investor'}
            </h1>
          </div>
          <Badge
            variant={subscription.tier === 'free' ? 'outline' : 'premium'}
            size="sm"
            className="cursor-pointer"
            onClick={() => navigate('/upgrade')}
          >
            {subscription.tier === 'free' ? (
              'FREE'
            ) : (
              <span className="flex items-center gap-1">
                <Crown className="w-3 h-3" />
                {subscription.tier.toUpperCase()}
              </span>
            )}
          </Badge>
        </motion.div>

        {/* ── Portfolio Value Hero ── */}
        <motion.div variants={fadeUp}>
          <Card variant="premium" className="overflow-hidden relative">
            <div className="absolute inset-0 apice-gradient-primary opacity-[0.06]" />
            <CardContent className="pt-5 pb-5 relative z-10">
              <p className="text-micro text-muted-foreground mb-1">Total Committed</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-display tracking-tight">
                  ${totalCommitted.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1.5 text-apice-success">
                  <div className="w-5 h-5 rounded-full bg-apice-success/10 flex items-center justify-center">
                    <TrendingUp className="w-3 h-3" />
                  </div>
                  <span className="text-micro font-medium">
                    {activePlans} active plan{activePlans !== 1 ? 's' : ''}
                  </span>
                </div>
                {streak > 0 && (
                  <div className="flex items-center gap-1.5 text-accent">
                    <Flame className="w-3.5 h-3.5" />
                    <span className="text-micro font-medium">{streak} day streak</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Key Metrics Row ── */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
          {[
            {
              label: 'Days Active',
              value: daysActive || 1,
              icon: Target,
              color: 'text-primary',
              bg: 'bg-primary/10',
            },
            {
              label: 'Lessons',
              value: lessonsCompleted,
              icon: Brain,
              color: 'text-apice-success',
              bg: 'bg-apice-success/10',
            },
            {
              label: 'Badges',
              value: dcaGamification.badges.length,
              icon: Sparkles,
              color: 'text-accent',
              bg: 'bg-accent/10',
            },
          ].map((m) => (
            <Card key={m.label} className="text-center py-3.5">
              <div
                className={`w-8 h-8 mx-auto mb-1.5 rounded-lg ${m.bg} flex items-center justify-center`}
              >
                <m.icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <p className="text-headline font-bold">{m.value}</p>
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </Card>
          ))}
        </motion.div>

        {/* ── Setup Progress (only if incomplete) ── */}
        {setupProgressPercent < 100 && (
          <motion.div variants={fadeUp}>
            <Card variant="interactive" onClick={primaryCTA.action}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-4">
                  <ProgressRing progress={setupProgressPercent} size={56} strokeWidth={5} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-caption font-semibold">Setup Progress</p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-micro text-muted-foreground mb-2 truncate">
                      {primaryCTA.label}
                    </p>
                    <Progress value={setupProgressPercent} className="h-1.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── AI Daily Insight ── */}
        <motion.div variants={fadeUp}>
          <Card
            variant="interactive"
            className="overflow-hidden"
            onClick={() => navigate('/insights')}
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl apice-gradient-primary flex items-center justify-center shrink-0">
                  <InsightIcon className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-micro text-muted-foreground uppercase tracking-wide font-medium">
                      Daily Pulse
                    </p>
                    {todayInsight.recommendedAction && (
                      <Badge variant="medium" size="sm">
                        Action
                      </Badge>
                    )}
                  </div>
                  <h4 className="text-caption font-semibold mb-0.5 truncate">
                    {todayInsight.title}
                  </h4>
                  <p className="text-micro text-muted-foreground line-clamp-2">
                    {todayInsight.content}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Quick Actions ── */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-micro font-semibold text-muted-foreground uppercase tracking-wide">
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: 'Portfolio',
                desc: 'View & manage',
                icon: PieChart,
                route: '/portfolio',
                gradient: 'from-primary/10 to-primary/5',
              },
              {
                label: 'Strategies',
                desc: 'DCA & automation',
                icon: Zap,
                route: '/strategies',
                gradient: 'from-accent/10 to-accent/5',
              },
              {
                label: 'Learn',
                desc: `${lessonsCompleted} completed`,
                icon: Brain,
                route: '/learn',
                gradient: 'from-apice-success/10 to-apice-success/5',
              },
              {
                label: 'Insights',
                desc: 'Market pulse',
                icon: TrendingUp,
                route: '/insights',
                gradient: 'from-primary/10 to-primary/5',
              },
            ].map((a) => (
              <Card
                key={a.label}
                variant="interactive"
                className="group"
                onClick={() => navigate(a.route)}
              >
                <CardContent className="py-4 px-4">
                  <div
                    className={`w-10 h-10 mb-2.5 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center`}
                  >
                    <a.icon className="w-5 h-5 text-foreground/70" />
                  </div>
                  <p className="text-caption font-semibold">{a.label}</p>
                  <p className="text-micro text-muted-foreground">{a.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* ── Recommended Path ── */}
        <motion.div variants={fadeUp}>
          <Card variant="gold" className="overflow-hidden" onClick={() => navigate('/portfolio')}>
            <CardContent className="pt-4 pb-4 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl apice-gradient-gold flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <Badge variant="recommended" size="sm" className="mb-1">
                      Recommended
                    </Badge>
                    <h3 className="text-caption font-semibold capitalize">{recommended} Path</h3>
                    <p className="text-micro text-muted-foreground">Matched to your profile</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Upgrade CTA (free users) ── */}
        {subscription.tier === 'free' && (
          <motion.div variants={fadeUp}>
            <Card
              className="cursor-pointer border-primary/20 overflow-hidden relative"
              onClick={() => navigate('/upgrade')}
            >
              <div className="absolute inset-0 apice-gradient-primary opacity-[0.04]" />
              <CardContent className="pt-4 pb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl apice-gradient-primary flex items-center justify-center">
                    <Crown className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-caption font-semibold">Unlock Pro</p>
                    <p className="text-micro text-muted-foreground">
                      Advanced portfolios, AI guides & more
                    </p>
                  </div>
                  <Button variant="premium" size="sm">
                    Upgrade
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Trust Footer ── */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
            <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-micro text-muted-foreground">
              No guaranteed returns. Risk-managed frameworks. You are always in control.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
