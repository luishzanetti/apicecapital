import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressRing } from '@/components/ProgressRing';
import { useAppStore, recommendedPath } from '@/store/appStore';
import { ArrowRight, Lightbulb, Shield, TrendingUp, Zap, PieChart, ExternalLink } from 'lucide-react';
import { dailyInsights, referralLinks } from '@/data/sampleData';

export default function Home() {
  const navigate = useNavigate();
  const investorType = useAppStore((s) => s.investorType);
  const setupProgressPercent = useAppStore((s) => s.setupProgressPercent);
  const setupProgress = useAppStore((s) => s.setupProgress);
  const subscription = useAppStore((s) => s.subscription);
  const trackLinkClick = useAppStore((s) => s.trackLinkClick);
  const currentInsightIndex = useAppStore((s) => s.currentInsightIndex);

  const recommended = investorType ? recommendedPath[investorType] : 'balanced';
  const todayInsight = dailyInsights[currentInsightIndex % dailyInsights.length];

  // Determine context-aware primary CTA
  const getPrimaryCTA = () => {
    if (!setupProgress.exchangeAccountCreated) {
      return {
        label: 'Create Exchange Account',
        icon: ExternalLink,
        action: () => {
          const bybitLink = referralLinks.find(l => l.id === 'bybit');
          if (bybitLink) {
            trackLinkClick('bybit');
            window.open(bybitLink.url, '_blank');
          }
        },
      };
    }
    if (!setupProgress.corePortfolioSelected) {
      return {
        label: 'Choose Portfolio',
        icon: PieChart,
        action: () => navigate('/portfolio'),
      };
    }
    if (!setupProgress.dcaPlanConfigured) {
      return {
        label: 'Set DCA Plan',
        icon: Zap,
        action: () => navigate('/automations'),
      };
    }
    return {
      label: "View Today's Insight",
      icon: Lightbulb,
      action: () => navigate('/insights'),
    };
  };

  const primaryCTA = getPrimaryCTA();

  return (
    <div className="min-h-screen bg-background px-5 py-6 pb-24 safe-top">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs">Welcome back</p>
            <h1 className="text-xl font-bold">{investorType || 'Investor'}</h1>
          </div>
          <Badge 
            variant={subscription.tier === 'free' ? 'outline' : 'premium'} 
            size="sm"
            className="cursor-pointer"
            onClick={() => navigate('/upgrade')}
          >
            {subscription.tier.toUpperCase()}
          </Badge>
        </div>

        {/* Portfolio Status Card */}
        <Card className="bg-card border-primary/10">
          <CardContent className="pt-5">
            <div className="flex items-center gap-5">
              <ProgressRing progress={setupProgressPercent} size={80} />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Setup Progress</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {setupProgressPercent === 100 
                    ? 'All set! Your path is active.' 
                    : 'Complete setup to activate your strategy'}
                </p>
                <Button
                  variant="premium"
                  size="sm"
                  onClick={primaryCTA.action}
                >
                  {primaryCTA.label}
                  <primaryCTA.icon className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today Card */}
        <Card className="cursor-pointer hover:border-primary/20 transition-colors" onClick={() => navigate('/insights')}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                Daily Pulse
              </CardTitle>
              <Badge variant={todayInsight.recommendedAction ? 'medium' : 'low'} size="sm">
                {todayInsight.recommendedAction ? 'Action' : 'No action'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h4 className="font-medium text-sm mb-1">{todayInsight.title}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {todayInsight.content}
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Quick Actions
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <Card
              className="text-center py-4 cursor-pointer hover:border-primary/20 transition-colors"
              onClick={() => navigate('/portfolio')}
            >
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-primary/10 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-medium">Portfolio</p>
            </Card>
            <Card
              className="text-center py-4 cursor-pointer hover:border-primary/20 transition-colors"
              onClick={() => navigate('/automations')}
            >
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-medium">Automate</p>
            </Card>
            <Card
              className="text-center py-4 cursor-pointer hover:border-primary/20 transition-colors"
              onClick={() => navigate('/learn')}
            >
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-medium">Learn</p>
            </Card>
          </div>
        </div>

        {/* Recommended Strategy */}
        <Card 
          className="cursor-pointer hover:border-primary/20 transition-colors" 
          onClick={() => navigate('/portfolio')}
        >
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="recommended" size="sm" className="mb-2">
                  Recommended for You
                </Badge>
                <h3 className="font-semibold capitalize">{recommended} Path</h3>
                <p className="text-xs text-muted-foreground">
                  Matched to your investor profile
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Trust Message */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
          <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            No guaranteed returns. Risk-managed frameworks.
            <br />
            You are always in control.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
