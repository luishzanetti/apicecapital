import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LockedOverlay } from '@/components/LockedOverlay';
import { useAppStore } from '@/store/appStore';
import { dailyInsights } from '@/data/sampleData';
import { Lightbulb, TrendingUp, BookOpen, AlertCircle, ChevronRight, Lock } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

export default function Insights() {
  const navigate = useNavigate();
  const unlockState = useAppStore((s) => s.unlockState);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'market': return TrendingUp;
      case 'strategy': return Lightbulb;
      case 'education': return BookOpen;
      case 'action': return AlertCircle;
      default: return Lightbulb;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  const todayInsight = dailyInsights[0];
  const pastInsights = dailyInsights.slice(1);

  return (
    <div className="min-h-screen bg-background px-5 py-6 safe-top">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h1 className="text-headline">Insights</h1>
          </div>
          <p className="text-muted-foreground text-caption">
            Your daily intelligence feed
          </p>
        </div>

        {/* Daily Pulse */}
        <Card variant="premium">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Daily Pulse</CardTitle>
              <Badge variant="default" size="sm">Today</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl apice-gradient-primary flex items-center justify-center shrink-0">
                {(() => {
                  const Icon = getInsightIcon(todayInsight.type);
                  return <Icon className="w-5 h-5 text-white" />;
                })()}
              </div>
              <div>
                <h3 className="font-semibold mb-1">{todayInsight.title}</h3>
                <p className="text-caption text-muted-foreground leading-relaxed">
                  {todayInsight.summary}
                </p>
              </div>
            </div>
            
            {todayInsight.actionRequired ? (
              <Badge variant="medium" className="w-full justify-center py-2">
                Action may be required
              </Badge>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-apice-success/10">
                <AlertCircle className="w-4 h-4 text-apice-success" />
                <p className="text-caption text-apice-success font-medium">
                  No action needed today
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Summary - Locked */}
        <LockedOverlay
          isLocked={!unlockState.premiumInsights}
          message="Upgrade to Pro for weekly summaries"
          onUnlock={() => navigate('/upgrade')}
        >
          <Card variant="elevated">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Weekly Summary
                </h3>
                <Badge variant="premium" size="sm">
                  <Lock className="w-3 h-3 mr-1" />
                  Pro
                </Badge>
              </div>
              <p className="text-caption text-muted-foreground">
                Get detailed performance breakdowns, trend analysis, and personalized recommendations every week.
              </p>
            </CardContent>
          </Card>
        </LockedOverlay>

        {/* Past Insights */}
        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Recent
          </h2>
          <div className="space-y-3">
            {pastInsights.map((insight, i) => {
              const Icon = getInsightIcon(insight.type);
              const isLocked = insight.premium && !unlockState.premiumInsights;

              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <LockedOverlay
                    isLocked={isLocked}
                    message="Premium insight"
                    onUnlock={() => navigate('/upgrade')}
                  >
                    <Card variant="interactive">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate">{insight.title}</h4>
                              {insight.premium && (
                                <Badge variant="premium" size="sm">Pro</Badge>
                              )}
                            </div>
                            <p className="text-caption text-muted-foreground line-clamp-2">
                              {insight.summary}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-micro text-muted-foreground">
                              {formatDate(insight.date)}
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </LockedOverlay>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Education Nuggets */}
        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Learn
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Card variant="glass" className="text-center py-5">
              <BookOpen className="w-6 h-6 mx-auto mb-2 text-primary" />
              <h4 className="font-medium text-sm mb-1">Risk 101</h4>
              <p className="text-micro text-muted-foreground">2 min read</p>
            </Card>
            <Card variant="glass" className="text-center py-5">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
              <h4 className="font-medium text-sm mb-1">Automation</h4>
              <p className="text-micro text-muted-foreground">3 min read</p>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
