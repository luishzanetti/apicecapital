import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import { subscriptionPlans } from '@/data/sampleData';
import { Check, ArrowLeft, Star, Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

export default function Upgrade() {
  const navigate = useNavigate();
  const setSubscription = useAppStore((s) => s.setSubscription);
  const checkTrialExpiry = useAppStore((s) => s.checkTrialExpiry);
  const subscription = useAppStore((s) => s.subscription);
  const currentTier = subscription.tier;

  // Check trial expiry on mount
  useEffect(() => {
    checkTrialExpiry();
    trackEvent(AnalyticsEvents.UPGRADE_PAGE_VIEWED);
  }, [checkTrialExpiry]);

  // Calculate trial days remaining
  const trialDaysLeft = subscription.isTrial && subscription.expiresAt
    ? Math.max(0, Math.ceil((new Date(subscription.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const handleUpgrade = (tier: 'free' | 'pro' | 'club') => {
    trackEvent('upgrade_completed', { tier, previousTier: currentTier });
    setSubscription(tier);
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="px-5 py-6 safe-top border-b border-border">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-headline">Upgrade</h1>
            <p className="text-caption text-muted-foreground">Unlock your full potential</p>
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 py-6 space-y-4">
        {trialDaysLeft !== null && trialDaysLeft > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20"
          >
            <Clock className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Pro Trial: {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} remaining
              </p>
              <p className="text-xs text-muted-foreground">
                Upgrade now to keep all Pro features after your trial ends.
              </p>
            </div>
          </motion.div>
        )}

        {subscriptionPlans.map((plan, i) => {
          const isCurrentPlan = plan.id === currentTier;
          const isRecommended = plan.id === 'pro';

          return (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card variant={isRecommended ? 'premium' : 'default'} className={cn(isCurrentPlan && 'ring-2 ring-primary')}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        {plan.id === 'club' && <Star className="w-4 h-4 text-apice-gold" />}
                        {plan.id === 'pro' && <Zap className="w-4 h-4 text-primary" />}
                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-title font-bold">{plan.price}</span>
                        <span className="text-caption text-muted-foreground">/{plan.period}</span>
                      </div>
                    </div>
                    {isRecommended && <Badge variant="recommended">Best Value</Badge>}
                    {isCurrentPlan && <Badge variant="default">Current</Badge>}
                  </div>

                  <div className="space-y-2 mb-4">
                    {plan.features.map((feature, j) => (
                      <div key={j} className="flex items-center gap-2 text-caption">
                        <Check className="w-4 h-4 text-apice-success shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant={isRecommended ? 'premium' : 'outline'}
                    className="w-full"
                    disabled={isCurrentPlan}
                    onClick={() => handleUpgrade(plan.id as 'free' | 'pro' | 'club')}
                  >
                    {isCurrentPlan ? 'Current Plan' : `Choose ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        <p className="text-center text-micro text-muted-foreground pt-4">Cancel anytime. No hidden fees.</p>
      </motion.div>
    </div>
  );
}
