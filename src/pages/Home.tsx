import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressRing } from '@/components/ProgressRing';
import { useAppStore, recommendedStrategy } from '@/store/appStore';
import { ArrowRight, Lightbulb, Shield, TrendingUp, Zap } from 'lucide-react';
import { dailyInsights } from '@/data/sampleData';

export default function Home() {
  const navigate = useNavigate();
  const investorType = useAppStore((s) => s.investorType);
  const overallProgress = useAppStore((s) => s.overallProgress);
  const setupProgress = useAppStore((s) => s.setupProgress);
  const subscription = useAppStore((s) => s.subscription);

  const recommended = investorType ? recommendedStrategy[investorType] : 'balanced';
  const todayInsight = dailyInsights[0];

  const activeModules = [
    { name: 'Strategies', active: setupProgress.pathSelected, icon: TrendingUp },
    { name: 'AI Bot', active: setupProgress.moduleActivated, icon: Zap },
    { name: 'Copy Trading', active: false, icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background px-5 py-6 safe-top">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-caption">Welcome back</p>
            <h1 className="text-headline">{investorType || 'Investor'}</h1>
          </div>
          <Badge variant={subscription.tier === 'free' ? 'outline' : 'premium'} size="sm">
            {subscription.tier.toUpperCase()}
          </Badge>
        </div>

        {/* Progress Card */}
        <Card variant="premium" className="overflow-hidden">
          <CardContent className="pt-5">
            <div className="flex items-center gap-6">
              <ProgressRing progress={overallProgress} size={90} />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Setup Progress</h3>
                <p className="text-caption text-muted-foreground mb-3">
                  {overallProgress === 100 
                    ? 'All set! Your infrastructure is active.' 
                    : 'Complete setup to activate your strategies'}
                </p>
                <Button
                  variant="premium"
                  size="sm"
                  onClick={() => navigate('/automate')}
                >
                  {overallProgress === 100 ? 'View Status' : 'Complete Setup'}
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Insight */}
        <Card variant="interactive" onClick={() => navigate('/insights')}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                Today
              </CardTitle>
              <Badge variant={todayInsight.actionRequired ? 'medium' : 'low'} size="sm">
                {todayInsight.actionRequired ? 'Action' : 'Info'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h4 className="font-medium mb-1">{todayInsight.title}</h4>
            <p className="text-caption text-muted-foreground line-clamp-2">
              {todayInsight.summary}
            </p>
          </CardContent>
        </Card>

        {/* Your Infrastructure */}
        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Your Infrastructure
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {activeModules.map((module) => (
              <Card
                key={module.name}
                variant={module.active ? 'default' : 'glass'}
                className="text-center py-4"
              >
                <div className={`w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center ${
                  module.active ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <module.icon className={`w-5 h-5 ${
                    module.active ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                <p className="text-micro font-medium">{module.name}</p>
                <Badge 
                  variant={module.active ? 'unlocked' : 'locked'} 
                  size="sm"
                  className="mt-1"
                >
                  {module.active ? 'Active' : 'Inactive'}
                </Badge>
              </Card>
            ))}
          </div>
        </div>

        {/* Recommended Strategy */}
        <Card variant="interactive" onClick={() => navigate(`/strategies/${recommended}`)}>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="recommended" size="sm" className="mb-2">
                  Recommended for You
                </Badge>
                <h3 className="font-semibold capitalize">{recommended} Strategy</h3>
                <p className="text-caption text-muted-foreground">
                  Matched to your investor profile
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Trust Message */}
        <div className="text-center pt-2">
          <p className="text-micro text-muted-foreground">
            <Shield className="w-3 h-3 inline mr-1" />
            No guaranteed returns. Risk-managed strategies.
            <br />
            You are always in control.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
