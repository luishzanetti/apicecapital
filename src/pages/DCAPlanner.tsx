import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { getNextExecutionDate } from '@/lib/dca';
import { useAppStore } from '@/store/appStore';
import type { InvestorType } from '@/store/types';
import { DCAAmountSlider } from '@/components/dca/DCAAmountSlider';
import { DCAAssetSelector } from '@/components/dca/DCAAssetSelector';
import { DCARecommendationCard } from '@/components/dca/DCARecommendationCard';
import { DCAPlanCard } from '@/components/dca/DCAPlanCard';
import { DCASummaryBar } from '@/components/dca/DCASummaryBar';
import { DCAPerformanceChart } from '@/components/dca/DCAPerformanceChart';
import { DCAExecutionTimeline } from '@/components/dca/DCAExecutionTimeline';
import { DcaRecommendationsWidget } from '@/components/dca/DcaRecommendationsWidget';
import { DipBuyPlansWidget } from '@/components/dca/DipBuyPlansWidget';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  ArrowLeft,
  Calendar,
  Plus,
  ChevronRight,
  ChevronLeft,
  Infinity as InfinityIcon,
  Sparkles,
  Check,
  Loader2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ShieldCheck,
  Clock,
  Trophy,
  Award,
  LayoutGrid,
  History,
} from 'lucide-react';
import { useDCAExecution } from '@/hooks/useDCAExecution';
import { isSupabaseConfigured } from '@/integrations/supabase/client';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
const WIZARD_STEPS: WizardStep[] = ['amount', 'assets', 'schedule', 'review'];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

const DURATION_OPTIONS = [
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
  { value: 180, label: '180 days' },
  { value: 365, label: '1 year' },
] as const;

const FREQ_LABEL: Record<string, string> = {
  daily: 'day',
  weekly: 'week',
  biweekly: '2 weeks',
  monthly: 'month',
};

const MONTHLY_MULT: Record<string, number> = {
  daily: 30,
  weekly: 4,
  biweekly: 2,
  monthly: 1,
};

const YEARLY_MULT: Record<string, number> = {
  daily: 365,
  weekly: 52,
  biweekly: 26,
  monthly: 12,
};

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <h2 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
        {label}
      </h2>
    </div>
  );
}

export default function DCAPlanner() {
  const navigate = useNavigate();
  const dcaPlans = useAppStore((s) => s.dcaPlans);
  const addDcaPlan = useAppStore((s) => s.addDcaPlan);
  const updateDcaPlan = useAppStore((s) => s.updateDcaPlan);
  const investorType = useAppStore((s) => s.investorType);
  const missionProgress = useAppStore((s) => s.missionProgress);
  const { executePlan, lastResult, error: execError, clearError } = useDCAExecution();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>('amount');
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [createStatus, setCreateStatus] = useState<'idle' | 'executing' | 'success' | 'error'>('idle');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPlanAmount, setCelebrationPlanAmount] = useState(0);
  const [newPlan, setNewPlan] = useState({
    assets: [] as { symbol: string; allocation: number }[],
    amountPerInterval: 25,
    frequency: 'weekly' as 'daily' | 'weekly' | 'biweekly' | 'monthly',
    durationDays: 90 as number | null,
    isForever: false,
  });

  const activePlans = dcaPlans.filter((p) => p.isActive);
  const setupProgress = useAppStore((s) => s.setupProgress);
  const liveTotalBalance = useAppStore((s) => s.currentBalances?.total ?? 0);
  // Gate the "Connect API" wall when there's NO evidence of a working
  // Bybit connection. The mission flag (`m2_apiConnected`) is unreliable —
  // users who connected via direct Settings flow or via legacy paths often
  // have a live balance but the flag never flipped, leaving them stuck on
  // the gate forever. Treat live balance + setup progress as ground truth.
  const looksConnected =
    missionProgress.m2_apiConnected ||
    setupProgress.exchangeAccountCreated ||
    liveTotalBalance > 0 ||
    activePlans.length > 0;
  const requiresApiConnection = isSupabaseConfigured && !looksConnected;

  // --- Wizard helpers ---

  const resetWizard = () => {
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
  };

  const openWizard = () => {
    resetWizard();
    setSheetOpen(true);
  };

  const canProceed = (): boolean => {
    switch (wizardStep) {
      case 'amount': return newPlan.amountPerInterval >= 5;
      case 'assets': return newPlan.assets.length > 0;
      case 'schedule': return true;
      case 'review': return true;
    }
  };

  const stepIndex = WIZARD_STEPS.indexOf(wizardStep);

  const nextStep = () => {
    if (stepIndex < WIZARD_STEPS.length - 1) {
      setWizardStep(WIZARD_STEPS[stepIndex + 1]);
    }
  };

  const prevStep = () => {
    if (stepIndex > 0) {
      setWizardStep(WIZARD_STEPS[stepIndex - 1]);
    } else {
      setSheetOpen(false);
    }
  };

  // --- Plan creation ---

  const handleCreatePlan = async () => {
    trackEvent(AnalyticsEvents.DCA_PLAN_CREATED, {
      amount: newPlan.amountPerInterval,
      frequency: newPlan.frequency,
    });
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

      if (result && result.executions.some((e) => e.status === 'success')) {
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
      setSheetOpen(false);
      resetWizard();
    }, 1500);
  };

  const handleActivateRecommendedPlan = async () => {
    const type = investorType || 'Balanced Optimizer';
    const rec = RECOMMENDED_PLANS[type];
    trackEvent(AnalyticsEvents.DCA_RECOMMENDED_ACTIVATED, {
      investorType: type,
      amount: rec.amount,
    });

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

  const handleApplyRecommendation = (
    assets: { symbol: string; allocation: number }[],
    amount: number,
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly',
  ) => {
    setNewPlan((prev) => ({ ...prev, assets, amountPerInterval: amount, frequency }));
    setWizardStep('review');
    setSheetOpen(true);
  };

  // --- Celebration ---

  useEffect(() => {
    if (!showCelebration) return;
    const timer = setTimeout(() => setShowCelebration(false), 3000);
    return () => clearTimeout(timer);
  }, [showCelebration]);

  useEffect(() => {
    if (!showCelebration) return;
    const end = Date.now() + 2000;
    const colors = ['#528FFF', '#FFD700', '#8B5CF6'];
    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, [showCelebration]);

  // --- API connection gate ---

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
              <h1 className="text-lg font-bold">DCA Planner</h1>
              <p className="text-xs text-muted-foreground">Automated investing</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center space-y-5 max-w-xs">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Connect your API first</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The DCA Planner needs a Bybit API connection to execute automated investments for you.
              </p>
            </div>
            <Button
              variant="premium"
              size="lg"
              className="w-full"
              onClick={() => navigate('/mission2/api-setup')}
            >
              Connect Bybit API
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-[11px] text-muted-foreground">
              It takes about 2 minutes. The walkthrough is included.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Main dashboard ---

  const monthlyAmount = newPlan.amountPerInterval * (MONTHLY_MULT[newPlan.frequency] ?? 1);
  const yearlyAmount = newPlan.amountPerInterval * (YEARLY_MULT[newPlan.frequency] ?? 12);

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Page header */}
      <div className="px-5 py-6 safe-top border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-secondary/80"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">DCA Planner</h1>
            <p className="text-xs text-muted-foreground">Recurring buys with discipline</p>
          </div>
          <Button size="sm" onClick={openWizard} className="gap-1.5">
            <Plus className="w-4 h-4" />
            New Plan
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 md:px-6 lg:px-8 py-5 space-y-5"
      >
        {/* AI-recommended infinite plans (Primary + Diversifier) */}
        <ErrorBoundary fallback={null}>
          <DcaRecommendationsWidget
            onCustomize={() => openWizard()}
          />
        </ErrorBoundary>

        {/* Dip-Buy plans — opportunistic 7d / 21d bursts */}
        <ErrorBoundary fallback={null}>
          <DipBuyPlansWidget />
        </ErrorBoundary>

        {/* Empty state */}
        {dcaPlans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl glass-card p-6 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-1.5">Automate your contributions</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-[280px] mx-auto leading-relaxed">
              DCA means investing a fixed amount at regular intervals, reducing emotion and timing risk in your decisions.
            </p>
            <div className="flex flex-col gap-3 mb-5">
              {[
                { icon: ShieldCheck, text: 'Reduce volatility risk over time' },
                { icon: Clock, text: 'Set it once and stay consistent' },
                { icon: TrendingUp, text: 'Historically outperforms impulse-based decisions' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Inline recommended plan for empty state */}
            {investorType && (
              <div className="mb-4 p-4 rounded-xl bg-white/[0.05] text-left">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                  Recommended for {investorType}
                </p>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-2xl font-bold text-primary">
                    ${RECOMMENDED_PLANS[investorType].amount}
                  </span>
                  <span className="text-sm text-muted-foreground">/week</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {RECOMMENDED_PLANS[investorType].assets.map((a) => (
                    <Badge key={a.symbol} variant="secondary" className="text-[11px]">
                      {a.symbol} {a.allocation}%
                    </Badge>
                  ))}
                </div>
                <Button
                  variant="premium"
                  className="w-full"
                  onClick={handleActivateRecommendedPlan}
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Activate recommended plan
                </Button>
              </div>
            )}

            <button
              onClick={openWizard}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white apice-gradient-primary transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Create my first DCA plan
            </button>
          </motion.div>
        ) : (
          <>
            {/* Summary stats */}
            <ErrorBoundary fallback={<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">DCA summary unavailable</div>}>
              <DCASummaryBar />
            </ErrorBoundary>

            {/* Performance + Timeline — side by side on xl */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div>
                <SectionHeader icon={TrendingUp} label="Performance" />
                <ErrorBoundary fallback={<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">Performance chart unavailable</div>}>
                <DCAPerformanceChart />
              </ErrorBoundary>
              </div>
              <div>
                <SectionHeader icon={History} label="Recent Executions" />
                <DCAExecutionTimeline />
              </div>
            </div>

            {/* AI Recommendation */}
            <DCARecommendationCard onApply={handleApplyRecommendation} />

            {/* Active Plans */}
            <div>
              <SectionHeader icon={LayoutGrid} label={`Your Plans (${dcaPlans.length})`} />
              <AnimatePresence mode="popLayout">
                <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                  {dcaPlans.map((plan) => (
                    <DCAPlanCard key={plan.id} plan={plan} />
                  ))}
                </div>
              </AnimatePresence>
            </div>
          </>
        )}
      </motion.div>

      {/* Create Plan Sheet (wizard) */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) resetWizard(); setSheetOpen(open); }}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl pb-8">
          <SheetHeader className="mb-4">
            <SheetTitle>Create Plan ({stepIndex + 1}/4)</SheetTitle>
            <SheetDescription>
              {wizardStep === 'amount' && 'Set your contribution amount'}
              {wizardStep === 'assets' && 'Choose your assets'}
              {wizardStep === 'schedule' && 'Configure recurrence'}
              {wizardStep === 'review' && 'Review and confirm'}
            </SheetDescription>
          </SheetHeader>

          {/* Step indicator */}
          <div className="flex gap-1.5 mb-6">
            {WIZARD_STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= stepIndex ? 'bg-primary' : 'bg-secondary'
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Amount */}
            {wizardStep === 'amount' && (
              <motion.div
                key="amount"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <DCAAmountSlider
                  value={newPlan.amountPerInterval}
                  onChange={(v) => setNewPlan({ ...newPlan, amountPerInterval: v })}
                  frequency={newPlan.frequency}
                />
                <p className="text-xs text-center text-muted-foreground mt-4">
                  Minimum $5 per interval
                </p>
              </motion.div>
            )}

            {/* Step 2: Assets */}
            {wizardStep === 'assets' && (
              <motion.div
                key="assets"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <DCAAssetSelector
                  selectedAssets={newPlan.assets}
                  onChange={(assets) => setNewPlan({ ...newPlan, assets })}
                  maxAssets={5}
                />
              </motion.div>
            )}

            {/* Step 3: Schedule */}
            {wizardStep === 'schedule' && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                {/* Frequency */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Frequency
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {FREQUENCY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setNewPlan({ ...newPlan, frequency: opt.value })}
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

                {/* Forever toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <InfinityIcon className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Continuous mode</p>
                      <p className="text-xs text-muted-foreground">No end date, DCA stays active</p>
                    </div>
                  </div>
                  <Switch
                    checked={newPlan.isForever}
                    onCheckedChange={(checked) => setNewPlan({ ...newPlan, isForever: checked })}
                  />
                </div>

                {/* Duration */}
                {!newPlan.isForever && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      Duration
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DURATION_OPTIONS.map((opt) => (
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
              </motion.div>
            )}

            {/* Step 4: Review */}
            {wizardStep === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Amount */}
                <div className="text-center mb-2">
                  <span className="text-4xl font-bold text-primary">${newPlan.amountPerInterval}</span>
                  <span className="text-lg text-muted-foreground">/{FREQ_LABEL[newPlan.frequency]}</span>
                </div>

                {/* Assets */}
                <div className="flex flex-wrap justify-center gap-2">
                  {newPlan.assets.map((asset) => (
                    <Badge key={asset.symbol} variant="outline">
                      {asset.symbol} ({asset.allocation}%)
                    </Badge>
                  ))}
                </div>

                {/* Duration */}
                <div className="p-3 rounded-xl glass-light text-center">
                  {newPlan.isForever ? (
                    <div className="flex items-center justify-center gap-2">
                      <InfinityIcon className="w-5 h-5 text-primary" />
                      <span className="font-medium">Continuous mode</span>
                    </div>
                  ) : (
                    <span className="font-medium">{newPlan.durationDays} days</span>
                  )}
                </div>

                {/* Projections */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl glass-light text-center">
                    <p className="text-xs text-muted-foreground">Monthly</p>
                    <p className="text-lg font-bold">${monthlyAmount.toLocaleString('en-US')}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/10 text-center">
                    <p className="text-xs text-muted-foreground">Yearly</p>
                    <p className="text-lg font-bold text-primary">${yearlyAmount.toLocaleString('en-US')}</p>
                  </div>
                </div>

                {/* Confidence Section */}
                <div className="space-y-2 mt-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="font-semibold">Why this works</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/60 mt-0.5 shrink-0" />
                      <span>DCA removes emotion from investing — you buy consistently regardless of market noise.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/60 mt-0.5 shrink-0" />
                      <span>Historical data shows DCA into BTC over any 4-year period has been profitable 100% of the time.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/60 mt-0.5 shrink-0" />
                      <span>Your plan executes automatically — set it and let compound interest do the work.</span>
                    </li>
                  </ul>
                </div>

                {/* Risk Disclosure */}
                <p className="text-xs text-muted-foreground/50 mt-2">
                  Past performance does not guarantee future results. Crypto is volatile — expect drawdowns of 30-50% during bear markets. Only invest what you can afford to hold for 2+ years.
                </p>

                {/* Create button */}
                <Button
                  variant="premium"
                  className="w-full"
                  onClick={handleCreatePlan}
                  disabled={creatingPlan}
                >
                  {createStatus === 'executing' ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Executing first buy...</>
                  ) : createStatus === 'success' ? (
                    <><CheckCircle2 className="w-4 h-4 mr-2" />Plan created and first execution completed!</>
                  ) : createStatus === 'error' ? (
                    <><XCircle className="w-4 h-4 mr-2" />Plan created, but the buy failed</>
                  ) : (
                    <><Check className="w-4 h-4 mr-2" />Create plan and execute first buy</>
                  )}
                </Button>

                {/* Execution result feedback */}
                {createStatus === 'success' && lastResult && (
                  <div className="p-3 rounded-xl glass-light border-glow-success">
                    <p className="text-xs text-green-400 font-medium mb-1">Executed orders:</p>
                    {lastResult.executions.map((ex, i) => (
                      <p key={i} className="text-[11px] text-muted-foreground">
                        {ex.asset}: {ex.status === 'success'
                          ? `Bought${ex.quantity ? ` ${ex.quantity}` : ''} ${ex.price ? `@ $${ex.price}` : `$${(ex.amountUsdt ?? 0).toFixed(2)}`}`
                          : ex.error || 'Failed'
                        }
                      </p>
                    ))}
                  </div>
                )}
                {createStatus === 'error' && execError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-[11px] text-red-400">{execError}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      The plan was saved. Enable Trade (Spot) permission on your Bybit API and try again from the plan card.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Wizard navigation */}
          {wizardStep !== 'review' && (
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={prevStep}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button variant="premium" className="flex-1" onClick={nextStep} disabled={!canProceed()}>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Celebration overlay */}
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
                Your DCA plan is live!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="text-sm text-muted-foreground mb-4"
              >
                In 52 weeks: ~${(celebrationPlanAmount * 52).toLocaleString('en-US')} invested
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30"
              >
                <Award className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-amber-500">Achievement: Disciplined Investor</span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
