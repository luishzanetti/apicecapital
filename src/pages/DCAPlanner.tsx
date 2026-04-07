import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { getNextExecutionDate } from '@/lib/dca';
import { useAppStore } from '@/store/appStore';
import type { InvestorType } from '@/store/types';
import { DCAAmountSlider } from '@/components/dca/DCAAmountSlider';
import { DCAAssetSelector } from '@/components/dca/DCAAssetSelector';
import { DCARecommendationCard } from '@/components/dca/DCARecommendationCard';
import { DCAHistoricalProof } from '@/components/dca/DCAHistoricalProof';
import { DCABadges } from '@/components/dca/DCABadges';
import { DCALearnBlock } from '@/components/dca/DCALearnBlock';
import { DCAPlanCard } from '@/components/dca/DCAPlanCard';
import {
  ArrowLeft,
  Calendar,
  Plus,
  ChevronRight,
  ChevronLeft,
  Infinity as InfinityIcon,
  Sparkles,
  Check,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ShieldCheck,
  Clock,
  Trophy,
  Award,
  Zap,
} from 'lucide-react';
import { referralLinks } from '@/data/sampleData';
import { useDCAExecution } from '@/hooks/useDCAExecution';
import { isSupabaseConfigured } from '@/integrations/supabase/client';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';
import { useTranslation } from '@/hooks/useTranslation';

// Recommended DCA plans per investor type
const RECOMMENDED_PLANS: Record<InvestorType, {
  amount: number;
  frequency: 'weekly';
  assets: { symbol: string; allocation: number }[];
  label: string;
}> = {
  'Conservative Builder': {
    amount: 25,
    frequency: 'weekly',
    assets: [
      { symbol: 'BTC', allocation: 65 },
      { symbol: 'ETH', allocation: 35 },
    ],
    label: 'Stable and secure',
  },
  'Balanced Optimizer': {
    amount: 35,
    frequency: 'weekly',
    assets: [
      { symbol: 'BTC', allocation: 45 },
      { symbol: 'ETH', allocation: 30 },
      { symbol: 'SOL', allocation: 15 },
      { symbol: 'LINK', allocation: 10 },
    ],
    label: 'Balanced growth',
  },
  'Growth Seeker': {
    amount: 50,
    frequency: 'weekly',
    assets: [
      { symbol: 'BTC', allocation: 35 },
      { symbol: 'ETH', allocation: 25 },
      { symbol: 'SOL', allocation: 20 },
      { symbol: 'ARB', allocation: 10 },
      { symbol: 'INJ', allocation: 10 },
    ],
    label: 'Maximum growth',
  },
};

type WizardStep = 'amount' | 'assets' | 'schedule' | 'review';

export default function DCAPlanner() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const dcaPlans = useAppStore((s) => s.dcaPlans);
  const addDcaPlan = useAppStore((s) => s.addDcaPlan);
  const updateDcaPlan = useAppStore((s) => s.updateDcaPlan);
  const investorType = useAppStore((s) => s.investorType);
  const trackLinkClick = useAppStore((s) => s.trackLinkClick);
  const linkClicks = useAppStore((s) => s.linkClicks);
  const { executePlan, lastResult, error: execError, clearError } = useDCAExecution();

  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>('amount');
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [createStatus, setCreateStatus] = useState<'idle' | 'executing' | 'success' | 'error'>('idle');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPlanAmount, setCelebrationPlanAmount] = useState(0);
  const [newPlan, setNewPlan] = useState<{
    assets: { symbol: string; allocation: number }[];
    amountPerInterval: number;
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    durationDays: number | null;
    isForever: boolean;
  }>({
    assets: [],
    amountPerInterval: 25,
    frequency: 'weekly',
    durationDays: 90,
    isForever: false,
  });
  const locale = language === 'pt' ? 'pt-BR' : 'en-US';
  const copy = language === 'pt'
    ? {
        plannerTitle: 'DCA Planner',
        automatedInvesting: 'Automated investing',
        connectApiTitle: 'Connect your API first',
        connectApiBody: 'The DCA Planner needs a Bybit API connection to execute automated investments for you.',
        connectApiCta: 'Connect Bybit API',
        connectApiFootnote: 'It takes about 2 minutes. The walkthrough is included.',
        createPlanHeader: (step: number) => `Create plan (${step}/4)`,
        stepAmount: 'Set your contribution amount',
        stepAssets: 'Choose the assets',
        stepSchedule: 'Set the schedule',
        stepReview: 'Review and confirm',
        plannerSubtitle: 'Recurring purchases with discipline',
        recommendedPlan: 'Recommended plan',
        basedOnProfile: (profile: string) => `Based on your ${profile} profile`,
        projection52Weeks: (value: number) => `In 52 weeks: ~$${value.toLocaleString(locale)} invested`,
        activateRecommended: 'Activate recommended plan',
        customize: 'I want to customize',
        emptyTitle: 'Automate your contributions',
        emptyBody: 'DCA means investing a fixed amount at regular intervals, reducing emotion and timing risk in your decisions.',
        emptyPoints: [
          'Reduce volatility risk over time',
          'Set up once and follow with discipline',
          'Historically outperforms impulsive decisions',
        ],
        createFirstPlan: 'Create my first DCA plan',
        activePlans: (count: number) => `Your DCA plans (${count})`,
        createNewPlan: 'Create new DCA plan',
        bybitGuideTitle: 'How to execute on Bybit',
        bybitGuideSteps: [
          'Open Bybit and go to "Trade" → "Spot"',
          'Set up a recurring buy for the chosen assets',
          'Set amount and frequency to mirror your plan',
          'Review and confirm your recurring order',
        ],
        accountCreated: 'Account created',
        openBybit: 'Open Bybit',
        amountTitle: 'Contribution amount',
        amountSubtitle: 'How much per interval?',
        minimumPerInterval: 'Minimum $5 per interval',
        assetTitle: 'Select assets',
        assetSubtitle: 'Choose up to 5 assets',
        frequency: 'Frequency',
        continuousMode: 'Continuous mode',
        continuousModeBody: 'No end date, ongoing DCA',
        duration: 'Duration',
        reviewTitle: 'Plan summary',
        monthly: 'Monthly',
        annual: 'Annual',
        disclaimer: 'Crypto is volatile. Past returns do not guarantee future results. Only invest what you can sustain.',
        executingFirstBuy: 'Executing first buy...',
        successBuy: 'Plan created and first execution complete!',
        errorBuy: 'Plan created, but the buy failed',
        createAndExecute: 'Create plan and execute first buy',
        ordersExecuted: 'Orders executed:',
        bought: (quantity?: number | null, price?: number | null, amountUsdt?: number | null) =>
          `Bought${quantity ? ` ${quantity}` : ''} ${price ? `@ $${price}` : `$${(amountUsdt ?? 0).toFixed(2)}`}`,
        failed: 'Failed',
        savedPlanErrorHelp: 'Plan saved. Enable Trade (Spot) permission on your Bybit API key and try again from the plan card.',
        back: 'Back',
        next: 'Next',
        celebrationTitle: 'Your DCA plan is active!',
        celebrationBadge: 'Achievement: Disciplined Investor',
        backToDashboard: 'Back to dashboard',
        recommendedLabels: {
          'Conservative Builder': 'Stable and secure',
          'Balanced Optimizer': 'Balanced growth',
          'Growth Seeker': 'Maximum growth',
        } as Record<InvestorType, string>,
      }
    : {
        plannerTitle: 'DCA Planner',
        automatedInvesting: 'Automated investing',
        connectApiTitle: 'Connect your API first',
        connectApiBody: 'The DCA Planner needs a Bybit API connection to execute automated investments for you.',
        connectApiCta: 'Connect Bybit API',
        connectApiFootnote: 'It takes about 2 minutes. The walkthrough is included.',
        createPlanHeader: (step: number) => `Create plan (${step}/4)`,
        stepAmount: 'Set your contribution amount',
        stepAssets: 'Choose the assets',
        stepSchedule: 'Configure recurrence',
        stepReview: 'Review and confirm',
        plannerSubtitle: 'Recurring buys with discipline',
        recommendedPlan: 'Recommended plan',
        basedOnProfile: (profile: string) => `Based on your ${profile} profile`,
        projection52Weeks: (value: number) => `In 52 weeks: ~$${value.toLocaleString(locale)} invested`,
        activateRecommended: 'Activate recommended plan',
        customize: 'Customize it',
        emptyTitle: 'Automate your contributions',
        emptyBody: 'DCA means investing a fixed amount at regular intervals, reducing emotion and timing risk in your decisions.',
        emptyPoints: [
          'Reduce volatility risk over time',
          'Set it once and stay consistent',
          'Historically outperforms impulse-based decisions',
        ],
        createFirstPlan: 'Create my first DCA plan',
        activePlans: (count: number) => `Your DCA plans (${count})`,
        createNewPlan: 'Create new DCA plan',
        bybitGuideTitle: 'How to execute on Bybit',
        bybitGuideSteps: [
          'Open Bybit and go to "Trade" → "Spot"',
          'Set up a recurring buy for the selected assets',
          'Choose the amount and frequency to mirror your plan',
          'Review and confirm your recurring order',
        ],
        accountCreated: 'Account created',
        openBybit: 'Open Bybit',
        amountTitle: 'Contribution amount',
        amountSubtitle: 'How much per interval?',
        minimumPerInterval: 'Minimum $5 per interval',
        assetTitle: 'Select assets',
        assetSubtitle: 'Choose up to 5 assets',
        frequency: 'Frequency',
        continuousMode: 'Continuous mode',
        continuousModeBody: 'No end date, DCA stays active',
        duration: 'Duration',
        reviewTitle: 'Plan summary',
        monthly: 'Monthly',
        annual: 'Yearly',
        disclaimer: 'Crypto is volatile. Past returns do not guarantee future results. Invest only what you can sustain.',
        executingFirstBuy: 'Executing the first buy...',
        successBuy: 'Plan created and first execution completed!',
        errorBuy: 'Plan created, but the buy failed',
        createAndExecute: 'Create plan and execute first buy',
        ordersExecuted: 'Executed orders:',
        bought: (quantity?: number | null, price?: number | null, amountUsdt?: number | null) =>
          `Bought${quantity ? ` ${quantity}` : ''} ${price ? `@ $${price}` : `$${(amountUsdt ?? 0).toFixed(2)}`}`,
        failed: 'Failed',
        savedPlanErrorHelp: 'The plan was saved. Enable Trade (Spot) permission on your Bybit API and try again from the plan card.',
        back: 'Back',
        next: 'Next',
        celebrationTitle: 'Your DCA plan is live!',
        celebrationBadge: 'Achievement: Disciplined investor',
        backToDashboard: 'Back to dashboard',
        recommendedLabels: {
          'Conservative Builder': 'Stable and secure',
          'Balanced Optimizer': 'Balanced growth',
          'Growth Seeker': 'Maximum growth',
        } as Record<InvestorType, string>,
      };

  const handleCreatePlan = async () => {
    trackEvent(AnalyticsEvents.DCA_PLAN_CREATED, { amount: newPlan.amountPerInterval, frequency: newPlan.frequency });
    setCreatingPlan(true);
    setCreateStatus('executing');
    clearError();

    const startDate = new Date().toISOString();
    const createdPlan = await addDcaPlan({
      assets: newPlan.assets,
      amountPerInterval: newPlan.amountPerInterval,
      frequency: newPlan.frequency,
      durationDays: newPlan.isForever ? null : newPlan.durationDays,
      startDate,
      isActive: true,
      totalInvested: 0,
      nextExecutionDate: getNextExecutionDate(newPlan.frequency, startDate),
    });

    try {
      const result = await executePlan(createdPlan.id, {
        id: createdPlan.id,
        assets: newPlan.assets,
        amountPerInterval: newPlan.amountPerInterval,
        frequency: newPlan.frequency,
      });

      if (result) {
        updateDcaPlan(createdPlan.id, {
          totalInvested: (createdPlan.totalInvested ?? 0) + result.totalSpent,
          nextExecutionDate: getNextExecutionDate(createdPlan.frequency),
        });
      }

      if (result && result.executions.some(e => e.status === 'success')) {
        setCreateStatus('success');
      } else {
        setCreateStatus('error');
      }
    } catch {
      setCreateStatus('error');
    }

    setCelebrationPlanAmount(newPlan.amountPerInterval);
    setShowCelebration(true);

    setTimeout(() => {
      setShowWizard(false);
      setWizardStep('amount');
      setCreatingPlan(false);
      setCreateStatus('idle');
      setNewPlan({
        assets: [],
        amountPerInterval: 25,
        frequency: 'weekly',
        durationDays: 90,
        isForever: false,
      });
    }, 1500);
  };

  // Handle activating the recommended plan (one-tap DCA)
  const handleActivateRecommendedPlan = async () => {
    const type = investorType || 'Balanced Optimizer';
    const rec = RECOMMENDED_PLANS[type];
    trackEvent(AnalyticsEvents.DCA_RECOMMENDED_ACTIVATED, { investorType: type, amount: rec.amount });

    const startDate = new Date().toISOString();
    await addDcaPlan({
      assets: rec.assets,
      amountPerInterval: rec.amount,
      frequency: rec.frequency,
      durationDays: null,
      startDate,
      isActive: true,
      totalInvested: 0,
      nextExecutionDate: getNextExecutionDate(rec.frequency, startDate),
    });

    setCelebrationPlanAmount(rec.amount);
    setShowCelebration(true);
  };

  // Auto-dismiss celebration after 5 seconds
  useEffect(() => {
    if (!showCelebration) return;
    const timer = setTimeout(() => {
      setShowCelebration(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [showCelebration]);

  // Fire confetti from both sides when celebration shows
  useEffect(() => {
    if (showCelebration) {
      const end = Date.now() + 2000;
      const colors = ['#528FFF', '#FFD700', '#8B5CF6'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }
  }, [showCelebration]);

  const handleApplyRecommendation = (
    assets: { symbol: string; allocation: number }[],
    amount: number,
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  ) => {
    setNewPlan({
      ...newPlan,
      assets,
      amountPerInterval: amount,
      frequency,
    });
    setShowWizard(true);
    setWizardStep('review');
  };

  const frequencyOptions = [
    { value: 'daily', label: language === 'pt' ? 'Diário' : 'Daily' },
    { value: 'weekly', label: language === 'pt' ? 'Semanal' : 'Weekly' },
    { value: 'biweekly', label: language === 'pt' ? 'Quinzenal' : 'Biweekly' },
    { value: 'monthly', label: language === 'pt' ? 'Mensal' : 'Monthly' },
  ];

  const durationOptions = [
    { value: 30, label: language === 'pt' ? '30 dias' : '30 days' },
    { value: 60, label: language === 'pt' ? '60 dias' : '60 days' },
    { value: 90, label: language === 'pt' ? '90 dias' : '90 days' },
    { value: 180, label: language === 'pt' ? '180 dias' : '180 days' },
    { value: 365, label: language === 'pt' ? '1 ano' : '1 year' },
  ];

  const frequencyLabelMap: Record<typeof newPlan.frequency, string> = {
    daily: language === 'pt' ? 'dia' : 'day',
    weekly: language === 'pt' ? 'semana' : 'week',
    biweekly: language === 'pt' ? 'quinzena' : 'biweekly',
    monthly: language === 'pt' ? 'mês' : 'month',
  };

  const canProceed = () => {
    switch (wizardStep) {
      case 'amount': return newPlan.amountPerInterval >= 5;
      case 'assets': return newPlan.assets.length > 0;
      case 'schedule': return true;
      case 'review': return true;
    }
  };

  const nextStep = () => {
    const steps: WizardStep[] = ['amount', 'assets', 'schedule', 'review'];
    const currentIndex = steps.indexOf(wizardStep);
    if (currentIndex < steps.length - 1) {
      setWizardStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: WizardStep[] = ['amount', 'assets', 'schedule', 'review'];
    const currentIndex = steps.indexOf(wizardStep);
    if (currentIndex > 0) {
      setWizardStep(steps[currentIndex - 1]);
    } else {
      setShowWizard(false);
    }
  };

  const getStepNumber = () => {
    const steps: WizardStep[] = ['amount', 'assets', 'schedule', 'review'];
    return steps.indexOf(wizardStep) + 1;
  };

  const bybitLink = referralLinks.find(l => l.id === 'bybit');
  const missionProgress = useAppStore((s) => s.missionProgress);

  const requiresApiConnection = isSupabaseConfigured && !missionProgress.m2_apiConnected;

  if (requiresApiConnection) {
    return (
      <div className="min-h-screen bg-background pb-28 flex flex-col">
        <div className="px-5 py-6 safe-top border-b border-border">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-secondary/80"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">{copy.plannerTitle}</h1>
              <p className="text-xs text-muted-foreground">{copy.automatedInvesting}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center space-y-5 max-w-xs">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">{copy.connectApiTitle}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {copy.connectApiBody}
              </p>
            </div>
            <Button
              variant="premium"
              size="lg"
              className="w-full"
              onClick={() => navigate('/mission2/api-setup')}
            >
              {copy.connectApiCta}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-[11px] text-muted-foreground">
              {copy.connectApiFootnote}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="px-5 py-6 safe-top border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => showWizard ? prevStep() : navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-secondary/80"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">
              {showWizard ? copy.createPlanHeader(getStepNumber()) : copy.plannerTitle}
            </h1>
            <p className="text-xs text-muted-foreground">
              {showWizard ? 
                wizardStep === 'amount' ? copy.stepAmount :
                wizardStep === 'assets' ? copy.stepAssets :
                wizardStep === 'schedule' ? copy.stepSchedule :
                copy.stepReview
                : copy.plannerSubtitle
              }
            </p>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 py-6 space-y-6 pb-24"
      >
        {!showWizard ? (
          <>
            {/* One-Tap Recommended Plan — shown when no active plans */}
            {dcaPlans.filter(p => p.isActive).length === 0 && investorType && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl glass-card border-glow-blue p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{copy.recommendedPlan}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {copy.basedOnProfile(investorType)}
                    </p>
                  </div>
                </div>

                {(() => {
                  const rec = RECOMMENDED_PLANS[investorType];
                  return (
                    <>
                      <div className="flex items-baseline gap-1.5 mb-2">
                        <span className="text-3xl font-bold text-primary">${rec.amount}</span>
                        <span className="text-sm text-muted-foreground">/{frequencyLabelMap[rec.frequency]}</span>
                        <Badge variant="outline" className="ml-auto text-[11px]">
                          {copy.recommendedLabels[investorType]}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {rec.assets.map((a) => (
                          <Badge key={a.symbol} variant="secondary" className="text-[11px] font-medium">
                            {a.symbol} {a.allocation}%
                          </Badge>
                        ))}
                      </div>

                      <div className="p-3 rounded-xl glass-light mb-4">
                        <p className="text-xs text-muted-foreground text-center">
                          <span className="font-semibold text-foreground">{copy.projection52Weeks(rec.amount * 52)}</span>
                        </p>
                      </div>

                      <button
                        onClick={handleActivateRecommendedPlan}
                        className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 transition-all hover:opacity-90 active:scale-[0.98] mb-2"
                      >
                        <Sparkles className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                        {copy.activateRecommended}
                      </button>

                      <button
                        onClick={() => setShowWizard(true)}
                        className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5"
                      >
                        {copy.customize}
                      </button>
                    </>
                  );
                })()}
              </motion.div>
            )}

            {/* Empty State: No DCA plans */}
            {dcaPlans.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl glass-card p-6 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-1.5">{copy.emptyTitle}</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-[280px] mx-auto leading-relaxed">
                  {copy.emptyBody}
                </p>
                <div className="flex flex-col gap-3 mb-5">
                  {[
                    { icon: ShieldCheck, text: copy.emptyPoints[0] },
                    { icon: Clock, text: copy.emptyPoints[1] },
                    { icon: TrendingUp, text: copy.emptyPoints[2] },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-left">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <item.icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground">{item.text}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowWizard(true)}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white apice-gradient-primary transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  {copy.createFirstPlan}
                </button>
              </motion.div>
            )}

            {/* AI Recommendation Card */}
            <DCARecommendationCard onApply={handleApplyRecommendation} />

            {/* Active Plans */}
            {dcaPlans.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                  {copy.activePlans(dcaPlans.length)}
                </h2>
                <AnimatePresence mode="popLayout">
                  <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                    {dcaPlans.map((plan) => (
                      <DCAPlanCard key={plan.id} plan={plan} />
                    ))}
                  </div>
                </AnimatePresence>
              </div>
            )}

            {/* Create New Plan Button */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowWizard(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              {copy.createNewPlan}
            </Button>

            {/* Learn Block */}
            <DCALearnBlock />

            {/* Historical Proof */}
            <DCAHistoricalProof />

            {/* Gamification / Badges */}
            <DCABadges />

            {/* Execution Guide */}
            <Card>
              <CardContent className="pt-5">
                <h3 className="font-semibold text-sm mb-3">{copy.bybitGuideTitle}</h3>
                <div className="space-y-3 text-xs text-muted-foreground">
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-semibold shrink-0">1</span>
                    <p>{copy.bybitGuideSteps[0]}</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-semibold shrink-0">2</span>
                    <p>{copy.bybitGuideSteps[1]}</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-semibold shrink-0">3</span>
                    <p>{copy.bybitGuideSteps[2]}</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-semibold shrink-0">4</span>
                    <p>{copy.bybitGuideSteps[3]}</p>
                  </div>
                </div>

                {bybitLink && (
                  <Button
                    variant={linkClicks.bybitClicked ? 'outline' : 'premium'}
                    className="w-full mt-4"
                    onClick={() => {
                      trackLinkClick('bybit');
                      window.open(bybitLink.url, '_blank');
                    }}
                  >
                    {linkClicks.bybitClicked ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        {copy.accountCreated}
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {copy.openBybit}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          /* Wizard Flow */
          <AnimatePresence mode="wait">
            {wizardStep === 'amount' && (
              <motion.div
                key="amount"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl apice-gradient-primary flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{copy.amountTitle}</h3>
                        <p className="text-xs text-muted-foreground">{copy.amountSubtitle}</p>
                      </div>
                    </div>

                    <DCAAmountSlider
                      value={newPlan.amountPerInterval}
                      onChange={(v) => setNewPlan({ ...newPlan, amountPerInterval: v })}
                      frequency={newPlan.frequency}
                    />

                    <p className="text-xs text-center text-muted-foreground mt-4">
                      {copy.minimumPerInterval}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {wizardStep === 'assets' && (
              <motion.div
                key="assets"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl apice-gradient-primary flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{copy.assetTitle}</h3>
                        <p className="text-xs text-muted-foreground">{copy.assetSubtitle}</p>
                      </div>
                    </div>

                    <DCAAssetSelector
                      selectedAssets={newPlan.assets}
                      onChange={(assets) => setNewPlan({ ...newPlan, assets })}
                      maxAssets={5}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {wizardStep === 'schedule' && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <Card>
                  <CardContent className="pt-5 space-y-5">
                    {/* Frequency */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">
                        {copy.frequency}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {frequencyOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setNewPlan({ ...newPlan, frequency: opt.value as 'daily' | 'weekly' | 'biweekly' | 'monthly' })}
                            className={`py-3 rounded-xl text-sm font-medium transition-all ${
                              newPlan.frequency === opt.value
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Forever Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <InfinityIcon className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{copy.continuousMode}</p>
                          <p className="text-xs text-muted-foreground">{copy.continuousModeBody}</p>
                        </div>
                      </div>
                      <Switch
                        checked={newPlan.isForever}
                        onCheckedChange={(checked) => setNewPlan({ ...newPlan, isForever: checked })}
                      />
                    </div>

                    {/* Duration (if not forever) */}
                    {!newPlan.isForever && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-2 block">
                          {copy.duration}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {durationOptions.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setNewPlan({ ...newPlan, durationDays: opt.value })}
                              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                newPlan.durationDays === opt.value
                                  ? 'bg-primary text-primary-foreground shadow-sm'
                                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {wizardStep === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <Card variant="premium">
                  <CardContent className="pt-5">
                    <h3 className="font-semibold text-lg mb-4 text-center">{copy.reviewTitle}</h3>
                    
                    {/* Amount */}
                    <div className="text-center mb-4">
                      <span className="text-4xl font-bold text-primary">${newPlan.amountPerInterval}</span>
                      <span className="text-lg text-muted-foreground">/{frequencyLabelMap[newPlan.frequency]}</span>
                    </div>

                    {/* Assets */}
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                      {newPlan.assets.map((asset) => (
                        <Badge key={asset.symbol} variant="outline">
                          {asset.symbol} ({asset.allocation}%)
                        </Badge>
                      ))}
                    </div>

                    {/* Duration */}
                    <div className="p-3 rounded-xl glass-light text-center mb-4">
                      {newPlan.isForever ? (
                        <div className="flex items-center justify-center gap-2">
                          <InfinityIcon className="w-5 h-5 text-primary" />
                          <span className="font-medium">{copy.continuousMode}</span>
                        </div>
                      ) : (
                        <span className="font-medium">
                          {newPlan.durationDays} {language === 'pt' ? 'dias' : 'days'}
                        </span>
                      )}
                    </div>

                    {/* Projections */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 rounded-xl glass-light text-center">
                        <p className="text-xs text-muted-foreground">{copy.monthly}</p>
                        <p className="text-lg font-bold">
                          ${(newPlan.amountPerInterval * (
                            newPlan.frequency === 'daily' ? 30 :
                            newPlan.frequency === 'weekly' ? 4 :
                            newPlan.frequency === 'biweekly' ? 2 : 1
                          )).toLocaleString(locale)}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-primary/10 text-center">
                        <p className="text-xs text-muted-foreground">{copy.annual}</p>
                        <p className="text-lg font-bold text-primary">
                          ${(newPlan.amountPerInterval * (
                            newPlan.frequency === 'daily' ? 365 :
                            newPlan.frequency === 'weekly' ? 52 :
                            newPlan.frequency === 'biweekly' ? 26 : 12
                          )).toLocaleString(locale)}
                        </p>
                      </div>
                    </div>

                    {/* Disclaimer */}
                    <p className="text-[11px] text-center text-muted-foreground mb-4">
                      {copy.disclaimer}
                    </p>

                    <Button
                      variant="premium"
                      className="w-full"
                      onClick={handleCreatePlan}
                      disabled={creatingPlan}
                    >
                      {createStatus === 'executing' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {copy.executingFirstBuy}
                        </>
                      ) : createStatus === 'success' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {copy.successBuy}
                        </>
                      ) : createStatus === 'error' ? (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          {copy.errorBuy}
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          {copy.createAndExecute}
                        </>
                      )}
                    </Button>

                    {/* Execution result feedback */}
                    {createStatus === 'success' && lastResult && (
                      <div className="mt-3 p-3 rounded-xl glass-light border-glow-success">
                        <p className="text-xs text-green-400 font-medium mb-1">{copy.ordersExecuted}</p>
                        {lastResult.executions.map((ex, i) => (
                          <p key={i} className="text-[11px] text-muted-foreground">
                            {ex.asset}: {ex.status === 'success'
                              ? copy.bought(ex.quantity, ex.price, ex.amountUsdt)
                              : ex.error || copy.failed
                            }
                          </p>
                        ))}
                      </div>
                    )}
                    {createStatus === 'error' && execError && (
                      <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <p className="text-[11px] text-red-400">{execError}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {copy.savedPlanErrorHelp}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Wizard Navigation */}
        {showWizard && wizardStep !== 'review' && (
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={prevStep}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {copy.back}
            </Button>
            <Button 
              variant="premium" 
              className="flex-1"
              onClick={nextStep}
              disabled={!canProceed()}
            >
              {copy.next}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </motion.div>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="mx-6 w-full max-w-sm rounded-3xl glass-heavy p-8 text-center apice-shadow-elevated"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Trophy icon */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.15 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/30"
              >
                <Trophy className="w-10 h-10 text-white" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-xl font-bold mb-2"
              >
                {copy.celebrationTitle}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="text-sm text-muted-foreground mb-4"
              >
                {copy.projection52Weeks(celebrationPlanAmount * 52)}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 mb-6"
              >
                <Award className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-amber-500">{copy.celebrationBadge}</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
              >
                <Button
                  variant="premium"
                  className="w-full"
                  onClick={() => {
                    setShowCelebration(false);
                    navigate('/home');
                  }}
                >
                  {copy.backToDashboard}
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
