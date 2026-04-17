import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/components/AuthProvider';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { AnalyticsEvents, trackEvent } from '@/lib/analytics';
import {
  formatUsd,
  getAiTradeSetupContent,
  getAnnualRate,
  getInvestorTypeLabel,
  getStrategyBlueprint,
  projectWeeklyPlan,
  weeklyAmountPresets,
  deriveInvestorType,
} from '@/data/aiTradeSetup';
import { useAppStore } from '@/store/appStore';
import type { UserProfile } from '@/store/types';
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  ChevronRight,
  Clock3,
  Layers3,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { TriangleMark } from '@/components/brand/BrandMark';

const TOTAL_STEPS = 4;

type StepIndex = 0 | 1 | 2 | 3;

type LocalProfile = Pick<UserProfile, 'goal' | 'experience' | 'riskTolerance' | 'capitalRange'>;

function ProgressHeader({
  step,
  onSkip,
  stepLabel,
  skipLabel,
}: {
  step: number;
  onSkip: () => void;
  stepLabel: string;
  skipLabel: string;
}) {
  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TriangleMark variant="circle" size={44} aria-hidden="true" />
          <div>
            <p className="font-display text-sm font-semibold text-white">Apice</p>
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">Global AI Investing</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            {stepLabel} {step + 1}/{TOTAL_STEPS}
          </span>
          <Button variant="ghost" size="sm" onClick={onSkip}>
            {skipLabel}
          </Button>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full apice-gradient-primary"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function ChoiceCard({
  active,
  label,
  description,
  onClick,
}: {
  active: boolean;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-[1.35rem] border px-4 py-4 text-left backdrop-blur transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1626]',
        active
          ? 'border-[hsl(var(--apice-gold))]/40 bg-white/[0.04] shadow-[0_0_0_1px_hsl(var(--apice-gold)/0.2),0_20px_60px_-20px_hsl(var(--apice-gold)/0.3)]'
          : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
      )}
    >
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-2 text-sm leading-6 text-white/60">{description}</p>
    </button>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  actionLabel,
}: {
  icon: typeof Brain;
  title: string;
  description: string;
  actionLabel: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.02] px-4 py-5 backdrop-blur">
      <div className="flex items-start gap-4">
        <div
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--apice-gradient-start) / 0.2), hsl(var(--apice-gradient-end) / 0.1))",
          }}
        >
          <Icon className="h-5 w-5 text-[hsl(var(--apice-gold))]" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-sm font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/60">{description}</p>
          <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--apice-gold))]">
            {actionLabel}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AiTradeOnboarding() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { language, t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const setupContent = useMemo(() => getAiTradeSetupContent(language), [language]);

  const updateUserProfile = useAppStore((state) => state.updateUserProfile);
  const calculateInvestorType = useAppStore((state) => state.calculateInvestorType);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const startFreeTrial = useAppStore((state) => state.startFreeTrial);
  const completeMissionTask = useAppStore((state) => state.completeMissionTask);
  const setWeeklyInvestment = useAppStore((state) => state.setWeeklyInvestment);
  const skipOnboarding = useAppStore((state) => state.skipOnboarding);
  const setOnboardingStep = useAppStore((state) => state.setOnboardingStep);
  const userProfile = useAppStore((state) => state.userProfile);
  const persistedStep = useAppStore((state) => state.onboardingStep);
  const persistedWeeklyAmount = useAppStore((state) => state.weeklyInvestment);

  const [step, setStep] = useState<StepIndex>(() => {
    const clamped = Math.max(0, Math.min(persistedStep, TOTAL_STEPS - 1));
    return clamped as StepIndex;
  });
  const [profile, setProfile] = useState<LocalProfile>({
    goal: userProfile.goal,
    experience: userProfile.experience,
    riskTolerance: userProfile.riskTolerance,
    capitalRange: userProfile.capitalRange,
  });
  const [weeklyAmount, setWeeklyAmount] = useState(persistedWeeklyAmount || 100);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setOnboardingStep(step);
  }, [setOnboardingStep, step]);

  const investorType = useMemo(
    () => deriveInvestorType(profile.goal, profile.riskTolerance),
    [profile.goal, profile.riskTolerance]
  );
  const investorTypeLabel = useMemo(
    () => getInvestorTypeLabel(investorType, language),
    [investorType, language]
  );
  const annualRate = useMemo(() => getAnnualRate(investorType), [investorType]);
  const projections = useMemo(
    () => [
      { label: language === 'pt' ? '12 meses' : '12 months', value: projectWeeklyPlan(weeklyAmount, annualRate, 1) },
      { label: language === 'pt' ? '36 meses' : '36 months', value: projectWeeklyPlan(weeklyAmount, annualRate, 3) },
      { label: language === 'pt' ? '60 meses' : '60 months', value: projectWeeklyPlan(weeklyAmount, annualRate, 5) },
    ],
    [annualRate, language, weeklyAmount]
  );
  const blueprint = useMemo(
    () => getStrategyBlueprint(investorType, language),
    [investorType, language]
  );

  const profileCompleted = Boolean(
    profile.goal && profile.experience && profile.riskTolerance && profile.capitalRange
  );

  const copy = useMemo(
    () =>
      language === 'pt'
        ? {
            stepLabel: 'Step',
            ariaStep: 'Step',
            skip: t('common.skip'),
            back: t('common.back'),
            continue: t('common.continue'),
            manifestoBadge: 'Apice manifesto',
            manifestoTitle:
              'Intelligent wealth grows when strategy, AI, and discipline work together.',
            manifestoBody:
              'Apice Global AI Investing exists to pull you out of improvisation. First we show how the logic works. Then we translate it into a setup that fits your profile and improves every day with strategic guidance.',
            manifestoCardEyebrow: 'What you are building here',
            manifestoCardTitle: 'A routine that reads, executes, and adjusts.',
            manifestoMiniTitle: 'What changes in practice',
            manifestoMiniCards: [
              {
                icon: Brain,
                title: 'Filtered decision-making',
                body: 'AI condenses context so your entries start from logic instead of emotion.',
              },
              {
                icon: Layers3,
                title: 'Layered setup design',
                body: 'Each capital band gets a structure that matches your goal and risk appetite.',
              },
              {
                icon: Clock3,
                title: 'Continuous rhythm',
                body: 'Daily reads and weekly decisions keep the portfolio moving with intention.',
              },
            ],
            profileBadge: 'Your operating profile',
            profileTitle: 'Before we configure the tool, we need to configure the logic.',
            profileBody:
              'This step defines the setup style, the pace of growth, and how AI will guide your execution inside the Apice method.',
            goalLabel: 'Primary goal',
            experienceLabel: 'Experience level',
            riskLabel: 'Risk profile',
            capitalLabel: 'Capital range',
            aiReadEyebrow: 'Initial AI read',
            aiReadTitle: 'Suggested direction for your setup',
            aiReadBody:
              'This is not a promise of returns. It is the starting structure that best matches your current moment.',
            cadenceBadge: 'Set the cadence',
            cadenceTitle: 'The consistency of your setup starts with a contribution you can sustain.',
            cadenceBody:
              'Running 24/7 with intelligence does not mean entering everywhere. It means choosing a pace you can keep and letting the method scale over time.',
            cadenceSliderLabel: 'Weekly setup amount',
            cadenceSliderHint: 'Choose the amount you can maintain with discipline through the cycle.',
            projectionEyebrow: 'Smart projection',
            projectionTitle: 'Your growth through consistency.',
            projectionBody:
              'This is about long-term growth potential, not guaranteed returns. AI organizes the execution; discipline sustains the compounding.',
            finalBadge: 'Final mission',
            finalTitle: 'Your plan is ready. Now comes intelligent execution.',
            finalBody:
              'From here, the Apice journey takes over: create the structure, configure the tool, review the result, and grow the portfolio with AI recommendations.',
            actions: [
              {
                icon: Layers3,
                title: 'Understand the method deeply',
                description: 'Open the Apice methodology mission to consolidate the pillars that guide each setup adjustment.',
                actionLabel: 'Open methodology',
              },
              {
                icon: Clock3,
                title: 'Create and configure the setup',
                description: 'Set the weekly amount, choose assets, and connect the structure to put the routine in motion.',
                actionLabel: 'Open configuration',
              },
              {
                icon: Sparkles,
                title: 'Use the guest tool access when needed',
                description: 'When the method calls for it, the flow takes you to the partner environment without exposing that brand across the rest of the journey.',
                actionLabel: 'Open guest access',
              },
              {
                icon: Brain,
                title: 'Grow the portfolio every day',
                description: 'Go back to the dashboard to track insights, next actions, and strategic AI recommendations from Apice.',
                actionLabel: 'Enter command center',
              },
            ],
            summaryEyebrow: 'Setup summary',
            summaryLabels: {
              goal: 'Goal',
              risk: 'Risk',
              capital: 'Capital range',
              weekly: 'Weekly amount',
            },
            ctaHome: 'Finish and open dashboard',
            ctaPlanner: 'Finish and configure now',
            ctaReferral: 'View guest links',
          }
        : {
            stepLabel: 'Step',
            ariaStep: 'Step',
            skip: t('common.skip'),
            back: t('common.back'),
            continue: t('common.continue'),
            manifestoBadge: 'Apice manifesto',
            manifestoTitle:
              'Intelligent wealth grows when strategy, AI, and discipline work together.',
            manifestoBody:
              'Apice Global AI Investing exists to pull you out of improvisation. First we show how the logic works. Then we translate it into a setup that fits your profile and improves every day with strategic guidance.',
            manifestoCardEyebrow: 'What you are building here',
            manifestoCardTitle: 'A routine that reads, executes, and adjusts.',
            manifestoMiniTitle: 'What changes in practice',
            manifestoMiniCards: [
              {
                icon: Brain,
                title: 'Filtered decision-making',
                body: 'AI condenses context so your entries start from logic instead of emotion.',
              },
              {
                icon: Layers3,
                title: 'Layered setup design',
                body: 'Each capital band gets a structure that matches your goal and risk appetite.',
              },
              {
                icon: Clock3,
                title: 'Continuous rhythm',
                body: 'Daily reads and weekly decisions keep the portfolio moving with intention.',
              },
            ],
            profileBadge: 'Your operating profile',
            profileTitle: 'Before we configure the tool, we need to configure the logic.',
            profileBody:
              'This step defines the setup style, the pace of growth, and how AI will guide your execution inside the Apice method.',
            goalLabel: 'Primary goal',
            experienceLabel: 'Experience level',
            riskLabel: 'Risk profile',
            capitalLabel: 'Capital range',
            aiReadEyebrow: 'Initial AI read',
            aiReadTitle: 'Suggested direction for your setup',
            aiReadBody:
              'This is not a promise of returns. It is the starting structure that best matches your current moment.',
            cadenceBadge: 'Set the cadence',
            cadenceTitle: 'The consistency of your setup starts with a contribution you can sustain.',
            cadenceBody:
              'Running 24/7 with intelligence does not mean entering everywhere. It means choosing a pace you can keep and letting the method scale over time.',
            cadenceSliderLabel: 'Weekly setup amount',
            cadenceSliderHint: 'Choose the amount you can maintain with discipline through the cycle.',
            projectionEyebrow: 'Smart projection',
            projectionTitle: 'Your growth through consistency.',
            projectionBody:
              'This is about long-term growth potential, not guaranteed returns. AI organizes the execution; discipline sustains the compounding.',
            finalBadge: 'Final mission',
            finalTitle: 'Your plan is ready. Now comes intelligent execution.',
            finalBody:
              'From here, the Apice journey takes over: create the structure, configure the tool, review the result, and grow the portfolio with AI recommendations.',
            actions: [
              {
                icon: Layers3,
                title: 'Understand the method deeply',
                description: 'Open the Apice methodology mission to lock in the principles behind each setup adjustment.',
                actionLabel: 'Open methodology',
              },
              {
                icon: Clock3,
                title: 'Create and configure the setup',
                description: 'Set the weekly amount, choose assets, and connect the structure to put the routine in motion.',
                actionLabel: 'Open configuration',
              },
              {
                icon: Sparkles,
                title: 'Use the guest tool access when needed',
                description: 'When the method calls for it, the flow takes you to the partner environment without exposing that brand across the rest of the journey.',
                actionLabel: 'Open guest access',
              },
              {
                icon: Brain,
                title: 'Grow the portfolio every day',
                description: 'Go back to the dashboard to track insights, next actions, and strategic AI recommendations from Apice.',
                actionLabel: 'Enter command center',
              },
            ],
            summaryEyebrow: 'Setup summary',
            summaryLabels: {
              goal: 'Goal',
              risk: 'Risk',
              capital: 'Capital range',
              weekly: 'Weekly amount',
            },
            ctaHome: 'Finish and open dashboard',
            ctaPlanner: 'Finish and configure now',
            ctaReferral: 'View guest links',
          },
    [language, t]
  );

  const handleSkip = () => {
    skipOnboarding();
    navigate(session ? '/home' : '/auth', {
      replace: true,
      state: session ? undefined : { from: { pathname: '/home' } },
    });
  };

  const persistProfile = () => {
    updateUserProfile(profile);
    calculateInvestorType();
    setWeeklyInvestment(weeklyAmount);
  };

  const handleNext = () => {
    if (step === 1 && !profileCompleted) {
      return;
    }

    if (step === 1 || step === 2) {
      persistProfile();
    }

    if (step < TOTAL_STEPS - 1) {
      setStep((current) => (current + 1) as StepIndex);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((current) => (current - 1) as StepIndex);
    }
  };

  const finishOnboarding = (target: '/home' | '/dca-planner' | '/referrals') => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    persistProfile();
    completeOnboarding();
    completeMissionTask('m1_profileQuizDone');
    completeMissionTask('m1_onboardingCompleted');
    startFreeTrial();
    setOnboardingStep(0);

    trackEvent(AnalyticsEvents.ONBOARDING_COMPLETED, {
      investorType,
      weeklyAmount,
      target,
    });

    navigate(session ? target : '/auth', {
      replace: true,
      state: session ? undefined : { from: { pathname: target } },
    });
  };

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.16, 1, 0.3, 1] };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0F1626] text-white antialiased dark">
      {/* Landing-style layered background decor */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(82,143,255,0.18),transparent_32%),radial-gradient(circle_at_85%_20%,rgba(234,179,8,0.1),transparent_22%),radial-gradient(circle_at_15%_80%,rgba(155,135,245,0.16),transparent_28%),linear-gradient(180deg,#0F1626_0%,#152038_50%,#0F1626_100%)]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:96px_96px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_50%,transparent_100%)]" />
      </div>
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 md:px-8 lg:px-10">
        <ProgressHeader
          step={step}
          onSkip={handleSkip}
          stepLabel={copy.stepLabel}
          skipLabel={copy.skip}
        />

        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {copy.ariaStep} {step + 1} of {TOTAL_STEPS}
        </div>

        <div className="mt-8 flex-1">
          <AnimatePresence mode="wait">
            <motion.section
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={transition}
              className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]"
            >
              {step === 0 && (
                <>
                  <div className="space-y-8">
                    <div className="space-y-5">
                      <Badge variant="outline" className="px-3 py-1 text-[11px] uppercase tracking-[0.24em]">
                        {copy.manifestoBadge}
                      </Badge>
                      <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-5xl">
                        {copy.manifestoTitle}
                      </h1>
                      <p className="max-w-2xl text-base leading-7 text-muted-foreground">{copy.manifestoBody}</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      {copy.manifestoMiniCards.map((item) => (
                        <Card key={item.title} className="border-white/10 bg-white/[0.02] backdrop-blur text-white">
                          <CardContent className="space-y-3 pt-5">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                              <item.icon className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-lg font-bold leading-snug">{item.title}</h2>
                            <p className="text-sm leading-6 text-muted-foreground">{item.body}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Card className="border-[hsl(var(--apice-gold))]/30 bg-white/[0.02] backdrop-blur text-white">
                      <CardContent className="space-y-5 pt-5">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl apice-gradient-primary shadow-lg shadow-primary/20">
                            <Target className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
                              {copy.manifestoCardEyebrow}
                            </p>
                            <h2 className="mt-2 text-2xl font-bold">{copy.manifestoCardTitle}</h2>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {setupContent.stages.map((stage) => (
                            <div key={stage.step} className="rounded-2xl border border-border/50 bg-card/80 px-4 py-4">
                              <div className="flex items-start gap-4">
                                <span className="text-2xl font-black text-primary/80">{stage.step}</span>
                                <div>
                                  <h3 className="text-sm font-semibold">{stage.title}</h3>
                                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{stage.description}</p>
                                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                                    {stage.outcome}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/[0.02] backdrop-blur text-white">
                      <CardContent className="space-y-4 pt-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          {copy.manifestoMiniTitle}
                        </p>
                        {setupContent.dailyLoop.map((item) => (
                          <div key={item.title} className="rounded-2xl border border-border/50 bg-secondary/20 px-4 py-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                              {item.eyebrow}
                            </p>
                            <h3 className="mt-2 text-sm font-semibold">{item.title}</h3>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Badge variant="outline" className="px-3 py-1 text-[11px] uppercase tracking-[0.24em]">
                        {copy.profileBadge}
                      </Badge>
                      <h1 className="text-4xl font-black tracking-tight md:text-5xl">{copy.profileTitle}</h1>
                      <p className="max-w-2xl text-base leading-7 text-muted-foreground">{copy.profileBody}</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {copy.goalLabel}
                        </h2>
                        <div className="grid gap-3 md:grid-cols-2">
                          {setupContent.goalOptions.map((option) => (
                            <ChoiceCard
                              key={option.value}
                              active={profile.goal === option.value}
                              label={option.label}
                              description={option.description}
                              onClick={() => setProfile((current) => ({ ...current, goal: option.value }))}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {copy.experienceLabel}
                        </h2>
                        <div className="grid gap-3 md:grid-cols-3">
                          {setupContent.experienceOptions.map((option) => (
                            <ChoiceCard
                              key={option.value}
                              active={profile.experience === option.value}
                              label={option.label}
                              description={option.description}
                              onClick={() => setProfile((current) => ({ ...current, experience: option.value }))}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {copy.riskLabel}
                        </h2>
                        <div className="grid gap-3 md:grid-cols-3">
                          {setupContent.riskOptions.map((option) => (
                            <ChoiceCard
                              key={option.value}
                              active={profile.riskTolerance === option.value}
                              label={option.label}
                              description={option.description}
                              onClick={() => setProfile((current) => ({ ...current, riskTolerance: option.value }))}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {copy.capitalLabel}
                        </h2>
                        <div className="grid gap-3 md:grid-cols-2">
                          {setupContent.capitalOptions.map((option) => (
                            <ChoiceCard
                              key={option.value}
                              active={profile.capitalRange === option.value}
                              label={option.label}
                              description={option.description}
                              onClick={() => setProfile((current) => ({ ...current, capitalRange: option.value }))}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Card className="border-[hsl(var(--apice-gold))]/25 bg-white/[0.02] backdrop-blur text-white">
                      <CardContent className="space-y-5 pt-5">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                            <Brain className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
                              {copy.aiReadEyebrow}
                            </p>
                            <h2 className="mt-2 text-2xl font-bold">{investorTypeLabel}</h2>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.aiReadBody}</p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-card px-4 py-4">
                          <p className="text-sm font-semibold">{copy.aiReadTitle}</p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{blueprint.title}</p>
                          <div className="mt-4 space-y-3">
                            {blueprint.allocation.map((item) => (
                              <div key={item.label}>
                                <div className="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
                                  <span>{item.label}</span>
                                  <span>{item.percentage}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-secondary">
                                  <div
                                    className="h-2 rounded-full apice-gradient-primary"
                                    style={{ width: `${item.percentage}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <p className="text-sm leading-6 text-muted-foreground">{blueprint.note}</p>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Badge variant="outline" className="px-3 py-1 text-[11px] uppercase tracking-[0.24em]">
                        {copy.cadenceBadge}
                      </Badge>
                      <h1 className="text-4xl font-black tracking-tight md:text-5xl">{copy.cadenceTitle}</h1>
                      <p className="max-w-2xl text-base leading-7 text-muted-foreground">{copy.cadenceBody}</p>
                    </div>

                    <Card className="border-white/10 bg-white/[0.02] backdrop-blur text-white">
                      <CardContent className="space-y-6 pt-6">
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              {copy.cadenceSliderLabel}
                            </p>
                            <p className="text-3xl font-black text-primary">
                              {formatUsd(weeklyAmount, language)}
                            </p>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{copy.cadenceSliderHint}</p>
                        </div>

                        <Slider
                          min={25}
                          max={1500}
                          step={25}
                          value={[weeklyAmount]}
                          onValueChange={(value) => setWeeklyAmount(value[0] ?? 100)}
                        />

                        <div className="grid gap-2 sm:grid-cols-5">
                          {weeklyAmountPresets.map((amount) => (
                            <Button
                              key={amount}
                              type="button"
                              variant={weeklyAmount === amount ? 'premium' : 'soft'}
                              onClick={() => setWeeklyAmount(amount)}
                            >
                              {formatUsd(amount, language)}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <Card className="border-[hsl(var(--apice-gold))]/25 bg-white/[0.02] backdrop-blur text-white">
                      <CardContent className="space-y-5 pt-5">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                            <TrendingUp className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
                              {copy.projectionEyebrow}
                            </p>
                            <h2 className="mt-2 text-2xl font-bold">{copy.projectionTitle}</h2>
                          </div>
                        </div>

                        <div className="grid gap-3">
                          {projections.map((projection) => (
                            <div key={projection.label} className="rounded-2xl border border-border/60 bg-card px-4 py-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                {projection.label}
                              </p>
                              <p className="mt-2 text-2xl font-black">
                                {formatUsd(projection.value, language)}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-4">
                          <div className="flex items-start gap-3">
                            <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-500" />
                            <p className="text-sm leading-6 text-muted-foreground">{copy.projectionBody}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Badge variant="outline" className="px-3 py-1 text-[11px] uppercase tracking-[0.24em]">
                        {copy.finalBadge}
                      </Badge>
                      <h1 className="text-4xl font-black tracking-tight md:text-5xl">{copy.finalTitle}</h1>
                      <p className="max-w-2xl text-base leading-7 text-muted-foreground">{copy.finalBody}</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {copy.actions.map((action) => (
                        <ActionCard
                          key={action.title}
                          icon={action.icon}
                          title={action.title}
                          description={action.description}
                          actionLabel={action.actionLabel}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Card className="border-[hsl(var(--apice-gold))]/25 bg-white/[0.02] backdrop-blur text-white">
                      <CardContent className="space-y-5 pt-5">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
                            {copy.summaryEyebrow}
                          </p>
                          <h2 className="mt-2 text-2xl font-bold">{investorTypeLabel}</h2>
                        </div>

                        <div className="space-y-3 rounded-2xl border border-border/60 bg-card px-4 py-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{copy.summaryLabels.goal}</span>
                            <span className="font-semibold">
                              {setupContent.goalOptions.find((item) => item.value === profile.goal)?.label}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{copy.summaryLabels.risk}</span>
                            <span className="font-semibold">
                              {setupContent.riskOptions.find((item) => item.value === profile.riskTolerance)?.label}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{copy.summaryLabels.capital}</span>
                            <span className="font-semibold">
                              {setupContent.capitalOptions.find((item) => item.value === profile.capitalRange)?.label}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{copy.summaryLabels.weekly}</span>
                            <span className="font-semibold">{formatUsd(weeklyAmount, language)}</span>
                          </div>
                        </div>

                        <div className="grid gap-3">
                          <Button
                            variant="premium"
                            size="lg"
                            disabled={isSubmitting}
                            onClick={() => finishOnboarding('/home')}
                          >
                            {copy.ctaHome}
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="gold"
                            size="lg"
                            disabled={isSubmitting}
                            onClick={() => finishOnboarding('/dca-planner')}
                          >
                            {copy.ctaPlanner}
                            <Target className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="soft"
                            size="lg"
                            disabled={isSubmitting}
                            onClick={() => finishOnboarding('/referrals')}
                          >
                            {copy.ctaReferral}
                            <Sparkles className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </motion.section>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border/60 pt-5">
          <Button variant="ghost" size="lg" onClick={handleBack} disabled={step === 0 || isSubmitting}>
            <ArrowLeft className="h-4 w-4" />
            {copy.back}
          </Button>

          {step < TOTAL_STEPS - 1 && (
            <Button
              variant="premium"
              size="lg"
              onClick={handleNext}
              disabled={(step === 1 && !profileCompleted) || isSubmitting}
            >
              {copy.continue}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
