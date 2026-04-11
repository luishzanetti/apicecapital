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
        {/* Social proof banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20"
        >
          <div className="flex -space-x-2 shrink-0">
            {['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500'].map((bg, i) => (
              <div key={i} className={`w-7 h-7 rounded-full ${bg} border-2 border-background flex items-center justify-center text-[10px] font-bold text-white`}>
                {['J', 'M', 'A', 'K'][i]}
              </div>
            ))}
          </div>
          <p className="text-xs font-medium text-foreground">
            Join <span className="font-bold text-primary">2,400+</span> investors who automated their wealth building
          </p>
        </motion.div>

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

        {/* Feature Comparison Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="rounded-2xl glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/30">
              <h3 className="text-sm font-bold">Feature Comparison</h3>
            </div>
            <div className="divide-y divide-border/20">
              {[
                { feature: 'DCA Automation', free: true, pro: true, club: true },
                { feature: 'AI Market Analysis', free: false, pro: true, club: true },
                { feature: 'AI Trade Strategies', free: false, pro: true, club: true },
                { feature: 'Advanced Risk Engine', free: false, pro: true, club: true },
                { feature: 'Priority Support', free: false, pro: false, club: true },
                { feature: 'VIP Community', free: false, pro: false, club: true },
              ].map((row) => (
                <div key={row.feature} className="grid grid-cols-4 px-4 py-2.5 items-center">
                  <span className="text-xs text-foreground col-span-1">{row.feature}</span>
                  {[row.free, row.pro, row.club].map((has, i) => (
                    <div key={i} className="flex justify-center">
                      {has ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <span className="w-4 h-4 flex items-center justify-center text-muted-foreground/30">—</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              <div className="grid grid-cols-4 px-4 py-2 items-center bg-secondary/20">
                <span className="text-[10px] text-muted-foreground font-semibold">PLAN</span>
                {['Free', 'Pro', 'Club'].map((name) => (
                  <span key={name} className="text-[10px] text-muted-foreground font-semibold text-center">{name}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Testimonial */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="rounded-2xl glass-card p-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-foreground leading-relaxed italic">
                  "DCA automation changed my portfolio. +47% in 6 months."
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                  — Growth Seeker user
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trial CTA */}
        {currentTier === 'free' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
            <button
              onClick={() => handleUpgrade('pro')}
              className="w-full py-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-primary to-purple-600 shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
            >
              Start 7-day free trial
            </button>
            <p className="text-center text-micro text-muted-foreground mt-1.5">No card required. Cancel anytime.</p>
          </motion.div>
        )}

        <p className="text-center text-micro text-muted-foreground pt-4">Cancel anytime. No hidden fees.</p>
      </motion.div>
    </div>
  );
}
